package server

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"strings"
)

// Secrets for the wearable integrations:
//   - provider refresh tokens are stored AES-256-GCM encrypted (key derived from HEALTH_TOKEN_KEY) and never leave the
//     server;
//   - the same key seals the short-lived OAuth state cookie (PKCE verifier + state + user);
//   - ingest tokens (iOS Shortcut / Android automation) are random bearer secrets shown once; only their SHA-256 is
//     stored.

const (
	ingestTokenPrefix = "shi_"
	minHealthKeyLen   = 16
)

var errHealthKey = errors.New("HEALTH_TOKEN_KEY is not configured")

// healthKey derives the 32-byte AES key from the configured secret (any string of at least 16 characters).
func healthKey(secret string) ([]byte, error) {
	if len(strings.TrimSpace(secret)) < minHealthKeyLen {
		return nil, errHealthKey
	}
	sum := sha256.Sum256([]byte("sihat-tcm/health-token-key/v1\x00" + secret))
	return sum[:], nil
}

// sealString encrypts plain with AES-256-GCM; output is base64url(nonce || ciphertext). aad binds the ciphertext to
// its purpose/owner so a blob cannot be replayed in another context.
func sealString(secret, aad, plain string) (string, error) {
	key, err := healthKey(secret)
	if err != nil {
		return "", err
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return "", err
	}
	ct := gcm.Seal(nonce, nonce, []byte(plain), []byte(aad))
	return base64.RawURLEncoding.EncodeToString(ct), nil
}

// openString reverses sealString; any tampering, wrong key or wrong aad fails.
func openString(secret, aad, sealed string) (string, error) {
	key, err := healthKey(secret)
	if err != nil {
		return "", err
	}
	raw, err := base64.RawURLEncoding.DecodeString(sealed)
	if err != nil {
		return "", errors.New("malformed sealed value")
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	if len(raw) < gcm.NonceSize()+gcm.Overhead() {
		return "", errors.New("malformed sealed value")
	}
	pt, err := gcm.Open(nil, raw[:gcm.NonceSize()], raw[gcm.NonceSize():], []byte(aad))
	if err != nil {
		return "", errors.New("could not decrypt (wrong key or tampered value)")
	}
	return string(pt), nil
}

// newRandomString is n random bytes as base64url (no padding).
func newRandomString(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

// newIngestToken mints a bearer token: "shi_" + 32 random bytes (256 bits).
func newIngestToken() (token string, err error) {
	r, err := newRandomString(32)
	if err != nil {
		return "", err
	}
	return ingestTokenPrefix + r, nil
}

// hashIngestToken is the stored form of an ingest token.
func hashIngestToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

// tokenHint is the only part of a token that may be shown again: its last four characters.
func tokenHint(token string) string {
	if len(token) <= 4 {
		return ""
	}
	return token[len(token)-4:]
}

func constEq(a, b string) bool { return subtle.ConstantTimeCompare([]byte(a), []byte(b)) == 1 }

// pkceChallenge is the S256 code challenge for a verifier.
func pkceChallenge(verifier string) string {
	sum := sha256.Sum256([]byte(verifier))
	return base64.RawURLEncoding.EncodeToString(sum[:])
}

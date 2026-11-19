package localdb

import (
	"crypto/pbkdf2"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"fmt"
	"strconv"
	"strings"
)

// DefaultPBKDF2Iterations: the fallback's brief is "at least 100k"; 120k keeps a login near 50 ms on a small VPS.
// OWASP's 2023 guidance for PBKDF2-HMAC-SHA256 is 600k - raise it with Options.PBKDF2Iter (LOCAL_PBKDF2_ITER) if CPU allows.
const DefaultPBKDF2Iterations = 120_000

const pwKeyLen = 32

// hashPassword returns "pbkdf2-sha256$<iter>$<salt b64>$<hash b64>" with a fresh random 16-byte salt.
func hashPassword(pw string, iter int) (string, error) {
	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}
	dk, err := pbkdf2.Key(sha256.New, pw, salt, iter, pwKeyLen)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("pbkdf2-sha256$%d$%s$%s", iter, base64.RawStdEncoding.EncodeToString(salt), base64.RawStdEncoding.EncodeToString(dk)), nil
}

// verifyPassword checks pw against an encoded hash in constant time.
func verifyPassword(pw, encoded string) bool {
	parts := strings.Split(encoded, "$")
	if len(parts) != 4 || parts[0] != "pbkdf2-sha256" {
		return false
	}
	iter, err := strconv.Atoi(parts[1])
	if err != nil || iter < 1 || iter > 10_000_000 {
		return false
	}
	salt, err := base64.RawStdEncoding.DecodeString(parts[2])
	if err != nil {
		return false
	}
	want, err := base64.RawStdEncoding.DecodeString(parts[3])
	if err != nil {
		return false
	}
	dk, err := pbkdf2.Key(sha256.New, pw, salt, iter, len(want))
	if err != nil {
		return false
	}
	return subtle.ConstantTimeCompare(dk, want) == 1
}

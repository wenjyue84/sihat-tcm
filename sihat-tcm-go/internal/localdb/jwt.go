package localdb

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"strings"
	"time"
)

var b64 = base64.RawURLEncoding

var (
	errJWTMalformed = errors.New("invalid JWT: unable to parse or verify signature")
	errJWTExpired   = errors.New("JWT expired")
)

// signJWT returns a compact HS256 JWT.
func signJWT(secret []byte, claims map[string]any) string {
	hdr, _ := json.Marshal(map[string]string{"alg": "HS256", "typ": "JWT"})
	pl, _ := json.Marshal(claims)
	signing := b64.EncodeToString(hdr) + "." + b64.EncodeToString(pl)
	mac := hmac.New(sha256.New, secret)
	mac.Write([]byte(signing))
	return signing + "." + b64.EncodeToString(mac.Sum(nil))
}

// verifyJWT checks the HS256 signature (alg must be exactly HS256 — never "none") and the exp/nbf claims.
func verifyJWT(secret []byte, token string, now time.Time) (map[string]any, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, errJWTMalformed
	}
	hb, err := b64.DecodeString(parts[0])
	if err != nil {
		return nil, errJWTMalformed
	}
	var hdr struct {
		Alg string `json:"alg"`
	}
	if json.Unmarshal(hb, &hdr) != nil || hdr.Alg != "HS256" {
		return nil, errJWTMalformed
	}
	sig, err := b64.DecodeString(parts[2])
	if err != nil {
		return nil, errJWTMalformed
	}
	mac := hmac.New(sha256.New, secret)
	mac.Write([]byte(parts[0] + "." + parts[1]))
	if !hmac.Equal(sig, mac.Sum(nil)) {
		return nil, errJWTMalformed
	}
	pb, err := b64.DecodeString(parts[1])
	if err != nil {
		return nil, errJWTMalformed
	}
	var claims map[string]any
	if json.Unmarshal(pb, &claims) != nil {
		return nil, errJWTMalformed
	}
	exp, ok := claims["exp"].(float64)
	if !ok {
		return nil, errJWTMalformed
	}
	if now.Unix() >= int64(exp) {
		return nil, errJWTExpired
	}
	if nbf, ok := claims["nbf"].(float64); ok && now.Unix() < int64(nbf) {
		return nil, errJWTMalformed
	}
	return claims, nil
}

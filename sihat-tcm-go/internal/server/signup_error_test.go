package server

import (
	"errors"
	"strings"
	"testing"
)

func TestSignupErrorMessage_NeverLeaksUpstream(t *testing.T) {
	cases := []struct {
		name, in, want string
	}{
		{"already registered", `supabase: POST /auth/v1/signup → 422: {"msg":"User already registered"}`, "already registered"},
		{"weak", `supabase: POST /auth/v1/signup → 422: {"error_code":"weak_password"}`, "too weak"},
		{"bad email", `supabase: ... Unable to validate email address: invalid format`, "invalid email"},
		{"network", `supabase: Post "https://jvokcruuowmvpthubjqh.supabase.co/auth/v1/signup": dial tcp: lookup failed`, "try again later"},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got := signupErrorMessage(errors.New(c.in))
			if !strings.Contains(got, c.want) {
				t.Fatalf("got %q, want substring %q", got, c.want)
			}
			for _, leak := range []string{"supabase", "dial tcp", "jvokcruuow", "https://"} {
				if strings.Contains(strings.ToLower(got), leak) {
					t.Fatalf("message %q leaks %q", got, leak)
				}
			}
		})
	}
}

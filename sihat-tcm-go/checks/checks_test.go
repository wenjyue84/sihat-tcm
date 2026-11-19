// Package checks holds source-scan tests that turn this project's prose rules into failing tests.
// They run with `go test ./...` (and so inside the regression graph's "unit" node).
// Reference and how to tighten the baselines: wiki/checks.md.
package checks

import (
	"encoding/json"
	"go/ast"
	"go/parser"
	"go/token"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"testing"
)

const root = ".." // module root (sihat-tcm-go)

type src struct {
	rel  string
	fset *token.FileSet
	file *ast.File
	text string
}

// productionGo parses every non-test .go file of the module (internal/ + main.go), skipping tools.
func productionGo(t *testing.T) []src {
	t.Helper()
	var out []src
	err := filepath.Walk(root, func(p string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		rel, _ := filepath.Rel(root, p)
		rel = filepath.ToSlash(rel)
		if info.IsDir() {
			if strings.HasPrefix(rel, "regress") || strings.HasPrefix(rel, "node_modules") || strings.HasPrefix(rel, "sihat-listener") || strings.HasPrefix(rel, "checks") {
				return filepath.SkipDir
			}
			return nil
		}
		if !strings.HasSuffix(p, ".go") || strings.HasSuffix(p, "_test.go") {
			return nil
		}
		b, err := os.ReadFile(p)
		if err != nil {
			return err
		}
		fset := token.NewFileSet()
		f, err := parser.ParseFile(fset, p, b, parser.ParseComments)
		if err != nil {
			t.Fatalf("parse %s: %v", rel, err)
		}
		out = append(out, src{rel, fset, f, string(b)})
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
	if len(out) < 20 {
		t.Fatalf("only %d go files found; scan root wrong?", len(out))
	}
	return out
}

func exprText(s src, n ast.Node) string {
	return s.text[s.fset.Position(n.Pos()).Offset:s.fset.Position(n.End()).Offset]
}

// Boundary: every /api route is behind RequireAuth, unless it is on this reviewed public list.
// A new public endpoint must be added here on purpose (with a reason), never by accident.
var publicAPI = map[string]string{
	"GET /api/health": "health probe", "POST /api/admin/system-health": "token-gated inside handler",
	"POST /api/logs": "client error log, rate limited", "GET /api/config/gemini-key": "gated inside handler",
	"GET /api/monitoring/health": "monitoring probe", "POST /api/monitoring/metrics": "client metrics, rate limited",
	"POST /api/chat": "guest consult", "POST /api/consult": "guest consult", "POST /api/report-chat": "guest consult",
	"POST /api/western-chat": "guest consult", "POST /api/heart-companion": "guest consult", "OPTIONS /api/heart-companion": "CORS preflight",
	"POST /api/admin/assistant": "gated inside handler", "POST /api/developer/assistant": "gated inside handler",
	"POST /api/analyze-image": "guest wizard", "POST /api/analyze-audio": "guest wizard", "POST /api/analyze-snore": "guest wizard",
	"POST /api/extract-text": "guest wizard", "POST /api/validate-medicine": "guest wizard", "POST /api/doctor/generate-inquiry": "guest wizard",
	"POST /api/auth/login": "login", "POST /api/auth/signup": "signup", "POST /api/auth/logout": "logout",
	"POST /api/auth/forgot-password": "reset flow", "POST /api/auth/reset-password": "reset flow",
	"GET /api/doctors": "public directory", "POST /api/guest/sessions": "guest session",
	"POST /api/notifications/report-viewed": "token-gated inside handler",
	"POST /api/summarize-inquiry": "guest wizard", "POST /api/summarize-reports": "guest wizard",
	"POST /api/summarize-medical-history": "guest wizard", "POST /api/ask-dietary-advice": "guest wizard",
	"POST /api/generate-infographic": "guest wizard", "GET /api/health/google/callback": "OAuth callback",
	"POST /api/health/ingest": "device token inside handler",
}

func TestRoutesRequireAuthOrAreReviewedPublic(t *testing.T) {
	seen := map[string]bool{}
	for _, s := range productionGo(t) {
		ast.Inspect(s.file, func(n ast.Node) bool {
			c, ok := n.(*ast.CallExpr)
			if !ok || len(c.Args) < 2 {
				return true
			}
			sel, ok := c.Fun.(*ast.SelectorExpr)
			if !ok || sel.Sel.Name != "HandleFunc" {
				return true
			}
			lit, ok := c.Args[0].(*ast.BasicLit)
			if !ok {
				return true
			}
			pat, _ := strconv.Unquote(lit.Value)
			if !strings.Contains(pat, " /api/") {
				return true
			}
			seen[pat] = true
			if !strings.Contains(exprText(s, c.Args[1]), "RequireAuth") {
				if _, ok := publicAPI[pat]; !ok {
					t.Errorf("%s: route %q has no RequireAuth wrapper and is not in publicAPI.\n  Wrap the handler with s.RequireAuth(handler, roles...), or if it is meant to be public add it to publicAPI in checks/checks_test.go with a reason.", s.rel, pat)
				}
			}
			return true
		})
	}
	if len(seen) < 40 {
		t.Fatalf("only %d /api routes found; scanner broken?", len(seen))
	}
}

// Grandfathered: http.DefaultClient used with a request that carries a 10s context deadline.
var defaultClientAllowed = map[string]bool{"internal/server/handlers_notifications.go": true}

// Ban-new: HTTP clients without a timeout hang a handler forever. Use a Timeout (see gemini/supabase clients).
func TestNoHTTPWithoutTimeout(t *testing.T) {
	for _, s := range productionGo(t) {
		ast.Inspect(s.file, func(n ast.Node) bool {
			switch x := n.(type) {
			case *ast.CompositeLit:
				if sel, ok := x.Type.(*ast.SelectorExpr); ok && sel.Sel.Name == "Client" && exprText(s, sel.X) == "http" {
					hasTimeout := false
					for _, e := range x.Elts {
						if kv, ok := e.(*ast.KeyValueExpr); ok && exprText(s, kv.Key) == "Timeout" {
							hasTimeout = true
						}
					}
					if !hasTimeout {
						t.Errorf("%s:%d http.Client{} without Timeout.\n  Set Timeout, or reuse s.AI.HTTP / s.DB.HTTP / s.googleHTTP().", s.rel, s.fset.Position(x.Pos()).Line)
					}
				}
			case *ast.SelectorExpr:
				if id, ok := x.X.(*ast.Ident); ok && id.Name == "http" && !(defaultClientAllowed[s.rel] && x.Sel.Name == "DefaultClient") && (x.Sel.Name == "DefaultClient" || x.Sel.Name == "Get" || x.Sel.Name == "Post" || x.Sel.Name == "Head" || x.Sel.Name == "PostForm") {
					t.Errorf("%s:%d http.%s has no timeout.\n  Build a request with http.NewRequestWithContext and send it with a client that has Timeout.", s.rel, s.fset.Position(x.Pos()).Line, x.Sel.Name)
				}
			}
			return true
		})
	}
}

// Boundary: configuration is read in internal/config (and main.go); two older reads are grandfathered.
var getenvAllowed = map[string]bool{
	"main.go": true, "internal/config/config.go": true,
	"internal/server/handlers_admin.go": true, "internal/server/handlers_media.go": true,
}

func TestEnvReadOnlyInConfig(t *testing.T) {
	for _, s := range productionGo(t) {
		if getenvAllowed[s.rel] {
			continue
		}
		ast.Inspect(s.file, func(n ast.Node) bool {
			if sel, ok := n.(*ast.SelectorExpr); ok && sel.Sel.Name == "Getenv" && exprText(s, sel.X) == "os" {
				t.Errorf("%s:%d os.Getenv outside config.\n  Add the variable to internal/config/config.go (Config struct + Load) and read it from s.Cfg.", s.rel, s.fset.Position(sel.Pos()).Line)
			}
			return true
		})
	}
}

// Boundary: no secret-shaped literal in source, templates or static JS.
func TestNoTokenShapedStrings(t *testing.T) {
	re := regexp.MustCompile(`AIza[0-9A-Za-z_-]{30,}|sk-[A-Za-z0-9]{32,}|ghp_[A-Za-z0-9]{30,}|eyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY-----`)
	for _, dir := range []string{"internal", "static", "templates", "deploy", "db"} {
		_ = filepath.Walk(filepath.Join(root, dir), func(p string, info os.FileInfo, err error) error {
			if err != nil || info.IsDir() || info.Size() > 2<<20 || strings.HasSuffix(p, "_test.go") {
				return nil
			}
			ext := filepath.Ext(p)
			if ext != ".go" && ext != ".js" && ext != ".html" && ext != ".conf" && ext != ".sql" && ext != ".json" {
				return nil
			}
			b, _ := os.ReadFile(p)
			if m := re.Find(b); m != nil {
				t.Errorf("%s contains a token-shaped string (%.8s...).\n  Secrets live in .env / Bitwarden (Get-Secret), never in source.", filepath.ToSlash(p), m)
			}
			return nil
		})
	}
}

// Boundary: every table in db/schema.sql is registered in internal/localdb/schema.go (CLAUDE.md: keep both in sync).
func TestSchemaSQLMatchesLocalDB(t *testing.T) {
	sql, err := os.ReadFile(filepath.Join(root, "db", "schema.sql"))
	if err != nil {
		t.Fatal(err)
	}
	gob, err := os.ReadFile(filepath.Join(root, "internal", "localdb", "schema.go"))
	if err != nil {
		t.Fatal(err)
	}
	sqlTables := regexp.MustCompile(`(?im)^\s*create table (?:if not exists )?public\.([a-z_]+)`).FindAllStringSubmatch(string(sql), -1)
	if len(sqlTables) < 10 {
		t.Fatalf("only %d tables parsed from schema.sql", len(sqlTables))
	}
	for _, m := range sqlTables {
		if !strings.Contains(string(gob), `newTable("`+m[1]+`"`) {
			t.Errorf("table %q is in db/schema.sql but not registered in internal/localdb/schema.go.\n  Add newTable(%q, ...) there so the SQLite fallback matches Supabase.", m[1], m[1])
		}
	}
}

// Ratchet: ignored errors (`_ = call()`) per package may only go down. Baseline: checks/baseline.json.
func TestIgnoredErrorsRatchet(t *testing.T) {
	b, err := os.ReadFile("baseline.json")
	if err != nil {
		t.Fatal(err)
	}
	var base struct {
		IgnoredErrors map[string]int `json:"ignored_errors"`
	}
	if err := json.Unmarshal(b, &base); err != nil {
		t.Fatal(err)
	}
	got := map[string]int{}
	for _, s := range productionGo(t) {
		ast.Inspect(s.file, func(n ast.Node) bool {
			if a, ok := n.(*ast.AssignStmt); ok && len(a.Rhs) == 1 {
				if _, isCall := a.Rhs[0].(*ast.CallExpr); isCall {
					allBlank := true
					for _, l := range a.Lhs {
						if id, ok := l.(*ast.Ident); !ok || id.Name != "_" {
							allBlank = false
						}
					}
					if allBlank {
						got[filepath.ToSlash(filepath.Dir(s.rel))]++
					}
				}
			}
			return true
		})
	}
	keys := make([]string, 0, len(got))
	for k := range got {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	for _, k := range keys {
		if got[k] > base.IgnoredErrors[k] {
			t.Errorf("package %s: %d ignored errors (`_ = call()`), baseline %d.\n  Handle or log the error instead. Do not raise the baseline unless Jay approves.", k, got[k], base.IgnoredErrors[k])
		}
		if got[k] < base.IgnoredErrors[k] {
			t.Logf("package %s improved: %d < baseline %d - lower it in checks/baseline.json", k, got[k], base.IgnoredErrors[k])
		}
	}
	t.Logf("ignored-error counts: %v", got)
}

package server

import (
	"net/http/httptest"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
)

// mediaFixture creates a MEDIA_DIR with a 10 KB mp4-named file (bytes 0..255 repeating) plus a secret next to it.
func mediaFixture(t *testing.T) (dir string, data []byte) {
	t.Helper()
	root := t.TempDir()
	dir = filepath.Join(root, "media")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		t.Fatal(err)
	}
	data = make([]byte, 10240)
	for i := range data {
		data[i] = byte(i % 251)
	}
	if err := os.WriteFile(filepath.Join(dir, promoVideoFile), data, 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "poster.WEBP"), []byte("x"), 0o644); err != nil { // uppercase ext is not allowlisted
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "secret.mp4"), []byte("TOPSECRET"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "notes.txt"), []byte("no"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.Mkdir(filepath.Join(dir, "sub.mp4"), 0o755); err != nil { // a directory with an allowed extension
		t.Fatal(err)
	}
	t.Setenv("MEDIA_DIR", dir)
	return dir, data
}

func mediaReq(s *Server, method, target, rng string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, target, nil)
	if rng != "" {
		req.Header.Set("Range", rng)
	}
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)
	return rec
}

func TestMediaServesFullFile(t *testing.T) {
	_, data := mediaFixture(t)
	s := demoTestServer(t)
	rec := mediaReq(s, "GET", "/media/"+promoVideoFile, "")
	if rec.Code != 200 {
		t.Fatalf("status %d", rec.Code)
	}
	if ct := rec.Header().Get("Content-Type"); ct != "video/mp4" {
		t.Errorf("content-type %q", ct)
	}
	if cc := rec.Header().Get("Cache-Control"); cc != "public, max-age=86400" {
		t.Errorf("cache-control %q", cc)
	}
	if ar := rec.Header().Get("Accept-Ranges"); ar != "bytes" {
		t.Errorf("accept-ranges %q", ar)
	}
	if rec.Header().Get("Content-Length") != strconv.Itoa(len(data)) || rec.Body.Len() != len(data) {
		t.Errorf("length header=%s body=%d want %d", rec.Header().Get("Content-Length"), rec.Body.Len(), len(data))
	}
}

func TestMediaRange(t *testing.T) {
	_, data := mediaFixture(t)
	s := demoTestServer(t)
	rec := mediaReq(s, "GET", "/media/"+promoVideoFile, "bytes=100-199")
	if rec.Code != 206 {
		t.Fatalf("status %d, want 206", rec.Code)
	}
	if got := rec.Header().Get("Content-Range"); got != "bytes 100-199/"+strconv.Itoa(len(data)) {
		t.Errorf("content-range %q", got)
	}
	if rec.Body.Len() != 100 || string(rec.Body.Bytes()) != string(data[100:200]) {
		t.Errorf("range body mismatch (len %d)", rec.Body.Len())
	}
	if rec.Header().Get("Content-Length") != "100" {
		t.Errorf("content-length %q", rec.Header().Get("Content-Length"))
	}
	// open-ended and suffix ranges (what Safari/iOS and seeking send)
	if r := mediaReq(s, "GET", "/media/"+promoVideoFile, "bytes=10000-"); r.Code != 206 || r.Body.Len() != len(data)-10000 {
		t.Errorf("open-ended: %d len %d", r.Code, r.Body.Len())
	}
	if r := mediaReq(s, "GET", "/media/"+promoVideoFile, "bytes=-50"); r.Code != 206 || r.Body.Len() != 50 {
		t.Errorf("suffix: %d len %d", r.Code, r.Body.Len())
	}
	if r := mediaReq(s, "GET", "/media/"+promoVideoFile, "bytes=0-1"); r.Code != 206 || r.Body.Len() != 2 {
		t.Errorf("bytes=0-1 (Safari probe): %d len %d", r.Code, r.Body.Len())
	}
	// unsatisfiable
	r := mediaReq(s, "GET", "/media/"+promoVideoFile, "bytes=99999-100000")
	if r.Code != 416 {
		t.Errorf("unsatisfiable = %d, want 416", r.Code)
	}
	if cr := r.Header().Get("Content-Range"); cr != "bytes */"+strconv.Itoa(len(data)) {
		t.Errorf("416 content-range %q", cr)
	}
}

func TestMediaHead(t *testing.T) {
	_, data := mediaFixture(t)
	s := demoTestServer(t)
	rec := mediaReq(s, "HEAD", "/media/"+promoVideoFile, "")
	if rec.Code != 200 || rec.Body.Len() != 0 {
		t.Fatalf("HEAD = %d body %d", rec.Code, rec.Body.Len())
	}
	if rec.Header().Get("Content-Length") != strconv.Itoa(len(data)) || rec.Header().Get("Content-Type") != "video/mp4" {
		t.Errorf("HEAD headers: %v", rec.Header())
	}
}

func TestMediaRejectsBadNamesAndTraversal(t *testing.T) {
	mediaFixture(t)
	s := demoTestServer(t)
	bad := []string{
		"/media/..%2fsecret.mp4", "/media/..%2Fsecret.mp4", "/media/%2e%2e%2fsecret.mp4", "/media/%2e%2e/secret.mp4", "/media/../secret.mp4",
		"/media/..%5csecret.mp4", "/media/%252e%252e%252fsecret.mp4", "/media/..%00.mp4", "/media/sihat-tcm-demo.mp4%00.txt",
		"/media/.hidden.mp4", "/media/..mp4", "/media/a%20b.mp4", "/media/notes.txt", "/media/poster.WEBP", "/media/sihat-tcm-demo.mp4.exe",
		"/media/sub.mp4", "/media/nope.mp4", "/media/sihat-tcm-demo.MP4",
		"/media/", "/media", "/media//sihat-tcm-demo.mp4", "/media/sub/x.mp4",
	}
	for _, p := range bad {
		rec := mediaReq(s, "GET", p, "")
		if rec.Code == 200 || rec.Code == 206 {
			t.Errorf("%s served %d", p, rec.Code)
		}
		if strings.Contains(rec.Body.String(), "TOPSECRET") {
			t.Errorf("%s leaked the secret file", p)
		}
	}
	for _, p := range []string{"/media/nope.mp4", "/media/notes.txt", "/media/..%2fsecret.mp4", "/media/sub.mp4"} {
		if rec := mediaReq(s, "GET", p, ""); rec.Code != 404 {
			t.Errorf("%s = %d, want 404", p, rec.Code)
		}
	}
	// POST is not routed
	req := httptest.NewRequest("POST", "/media/"+promoVideoFile, nil)
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)
	if rec.Code != 405 {
		t.Errorf("POST = %d, want 405", rec.Code)
	}
}

func TestMediaMissingDir(t *testing.T) {
	t.Setenv("MEDIA_DIR", filepath.Join(t.TempDir(), "does-not-exist"))
	s := demoTestServer(t)
	if rec := mediaReq(s, "GET", "/media/"+promoVideoFile, ""); rec.Code != 404 {
		t.Errorf("missing dir = %d, want 404", rec.Code)
	}
	if rec := mediaReq(s, "HEAD", "/media/"+promoVideoFile, ""); rec.Code != 404 {
		t.Errorf("HEAD missing = %d, want 404", rec.Code)
	}
}

func TestMediaContentTypes(t *testing.T) {
	dir, _ := mediaFixture(t)
	want := map[string]string{"a.webm": "video/webm", "a.jpg": "image/jpeg", "a.png": "image/png", "a.webp": "image/webp", "a.vtt": "text/vtt", "a.srt": "text/plain"}
	s := demoTestServer(t)
	for name, ct := range want {
		if err := os.WriteFile(filepath.Join(dir, name), []byte("hello"), 0o644); err != nil {
			t.Fatal(err)
		}
		rec := mediaReq(s, "GET", "/media/"+name, "")
		if rec.Code != 200 || !strings.HasPrefix(rec.Header().Get("Content-Type"), ct) {
			t.Errorf("%s -> %d %q, want %s", name, rec.Code, rec.Header().Get("Content-Type"), ct)
		}
	}
}

func TestVideoPage(t *testing.T) {
	mediaFixture(t)
	s := demoTestServer(t)
	rec := mediaReq(s, "GET", "/video", "")
	if rec.Code != 200 || !strings.HasPrefix(rec.Header().Get("Content-Type"), "text/html") {
		t.Fatalf("GET /video = %d %q", rec.Code, rec.Header().Get("Content-Type"))
	}
	body := rec.Body.String()
	for _, want := range []string{`<video id="promo" controls preload="metadata"`, `poster="/static/img/art/video-poster.webp?v=`, `src="/media/sihat-tcm-demo.mp4"`,
		`id="video-download"`, `https://wa.me/?text=`, `https%3A%2F%2Ftcm.example.com%2Fvideo`, `data-seek="0.00"`, `id="video-credits"`, `CC BY 3.0`, `/video`} {
		if !strings.Contains(body, want) {
			t.Errorf("page missing %q", want)
		}
	}
	if strings.Contains(body, `noindex`) {
		t.Error("/video must be indexable")
	}
	if got := strings.Count(body, "data-seek="); got != len(videoScenes)+1 {
		t.Errorf("%d chapters, want %d", got, len(videoScenes)+1)
	}
	// sitemap lists /video only while the file exists
	if sm := mediaReq(s, "GET", "/sitemap.xml", "").Body.String(); !strings.Contains(sm, "tcm.example.com/video<") {
		t.Errorf("sitemap lacks /video while the file exists: %s", sm)
	}
}

func TestVideoPageWithoutFile(t *testing.T) {
	t.Setenv("MEDIA_DIR", t.TempDir())
	s := demoTestServer(t)
	rec := mediaReq(s, "GET", "/video", "")
	if rec.Code != 200 {
		t.Fatalf("GET /video = %d", rec.Code)
	}
	body := rec.Body.String()
	if strings.Contains(body, `<video`) || strings.Contains(body, `id="video-download"`) {
		t.Error("a broken player/download link is rendered although the file is missing")
	}
	if !strings.Contains(body, "not available on this server") || !strings.Contains(body, "此服务器暂时没有该视频文件") {
		t.Error("friendly missing-video message absent")
	}
	if sm := mediaReq(s, "GET", "/sitemap.xml", "").Body.String(); strings.Contains(sm, "/video") {
		t.Errorf("sitemap lists /video although the file is missing: %s", sm)
	}
}

func TestVideoChapters(t *testing.T) {
	ch := videoChapters()
	if len(ch) != 11 || ch[0].Start != 0 || ch[0].Label != "0:00" {
		t.Fatalf("chapters: %+v", ch)
	}
	if ch[1].Label != "0:13" { // 11.9 + 1.2
		t.Errorf("chapter 2 at %s, want 0:13", ch[1].Label)
	}
	for i := 1; i < len(ch); i++ {
		if ch[i].Start <= ch[i-1].Start {
			t.Errorf("chapters not increasing at %d", i)
		}
	}
	if last := ch[len(ch)-1]; last.Start > 164 {
		t.Errorf("credits chapter at %.1fs is past the 2:44 video", last.Start)
	}
}

package server

import (
	"fmt"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// Media (the promo video) is NOT embedded in the binary: it is a large, repo-ignored file that lives in
// MEDIA_DIR (default ./media next to the working directory) and is copied to the server separately (DEPLOY.md
// "Media (video)"). GET /media/{name} serves it with http.ServeContent so HTTP Range works (seeking, iOS Safari).
// GET /video is the public page that plays it.

// mediaNameRE is the strict allowlist for /media/{name}: one path segment of [A-Za-z0-9._-] ending in a known media
// extension. Anything else (separators, encoded separators, NUL, spaces, other extensions) is a 404.
var mediaNameRE = regexp.MustCompile(`^[A-Za-z0-9._-]+\.(mp4|webm|jpg|png|webp|vtt|srt)$`)

var mediaTypes = map[string]string{
	".mp4": "video/mp4", ".webm": "video/webm", ".jpg": "image/jpeg", ".png": "image/png",
	".webp": "image/webp", ".vtt": "text/vtt; charset=utf-8", ".srt": "text/plain; charset=utf-8",
}

// promoVideoFile is the file the /video page plays from MEDIA_DIR.
const promoVideoFile = "sihat-tcm-demo.mp4"

func (s *Server) registerMediaRoutes() {
	s.Mux.HandleFunc("GET /media/{name}", s.handleMedia)
	s.Mux.HandleFunc("GET /video", s.handleVideoPage)
}

// mediaDir resolves MEDIA_DIR on every call (cheap; lets tests and ops change it without a rebuild).
func mediaDir() string {
	if v := strings.TrimSpace(os.Getenv("MEDIA_DIR")); v != "" {
		return v
	}
	return "media"
}

// mediaPath validates name against the allowlist and returns the file path, or "" when it is not servable.
func mediaPath(name string) string {
	if !mediaNameRE.MatchString(name) || strings.Contains(name, "..") || strings.HasPrefix(name, ".") {
		return ""
	}
	return filepath.Join(mediaDir(), name)
}

func (s *Server) handleMedia(w http.ResponseWriter, r *http.Request) {
	p := mediaPath(r.PathValue("name"))
	if p == "" {
		http.NotFound(w, r)
		return
	}
	f, err := os.Open(p)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	defer f.Close()
	st, err := f.Stat()
	if err != nil || !st.Mode().IsRegular() {
		http.NotFound(w, r)
		return
	}
	h := w.Header()
	h.Set("Content-Type", mediaTypes[strings.ToLower(filepath.Ext(p))])
	h.Set("Cache-Control", "public, max-age=86400")
	http.ServeContent(w, r, st.Name(), st.ModTime(), f)
}

// ---- /video page ----

type videoChapter struct {
	Start   float64
	Label   string // m:ss
	TitleZH string
	TitleEN string
}

// videoScenes mirrors demo-video/narration.json (titles) and demo-video/build/audio/durations.json (narration
// seconds). Each scene lasts narration + 1.2 s of padding (0.5 head + 0.7 tail); the credits card follows.
var videoScenes = []struct {
	ZH, EN string
	Audio  float64
}{
	{"开场", "Opening", 11.9},
	{"产品", "The product", 11.78},
	{"访客问诊", "Guest consultation", 20.66},
	{"注册患者", "Registered patient", 12.77},
	{"连接医生", "Connect with a doctor", 9.5},
	{"医生端", "Doctor's console", 18.98},
	{"管理与开发", "Admin and developer", 11.04},
	{"可靠性", "Reliability", 28.8},
	{"灵活与多语言", "Flexible and multilingual", 11.02},
	{"结尾", "Closing", 8.26},
}

const videoScenePad = 1.2

func videoChapters() []videoChapter {
	var out []videoChapter
	at := 0.0
	for _, sc := range videoScenes {
		out = append(out, videoChapter{Start: at, Label: fmtClock(at), TitleZH: sc.ZH, TitleEN: sc.EN})
		at += sc.Audio + videoScenePad
	}
	out = append(out, videoChapter{Start: at, Label: fmtClock(at), TitleZH: "素材致谢", TitleEN: "Credits"})
	return out
}

func fmtClock(sec float64) string {
	n := int(sec + 0.5)
	return fmt.Sprintf("%d:%02d", n/60, n%60)
}

type videoPageData struct {
	Title     string
	User      *AuthUser
	Available bool
	Chapters  []videoChapter
	PageURL   string
	ShareURL  string
}

func (s *Server) handleVideoPage(w http.ResponseWriter, r *http.Request) {
	available := videoAvailable()
	page := strings.TrimRight(s.Cfg.PublicBaseURL, "/") + "/video"
	s.Render(w, "video.html", videoPageData{
		Title: "Sihat TCM Video", Available: available, Chapters: videoChapters(),
		PageURL: page, ShareURL: "https://wa.me/?text=" + url.QueryEscape("Sihat TCM 介绍视频 / intro video: "+page),
	})
}

// videoAvailable reports whether the promo video file exists in MEDIA_DIR (the /video page and the sitemap depend on it).
func videoAvailable() bool {
	st, err := os.Stat(filepath.Join(mediaDir(), promoVideoFile))
	return err == nil && st.Mode().IsRegular() && st.Size() > 0
}

package server

import "mime"

// The embedded static tree is served by http.FileServerFS, which derives Content-Type from the file extension via the
// OS mime tables. WebVTT (the promo video's captions track) is missing from most of them; Firefox refuses a <track>
// that is not served as text/vtt, so register it explicitly rather than depend on the host's /etc/mime.types.
func init() {
	_ = mime.AddExtensionType(".vtt", "text/vtt; charset=utf-8")
	_ = mime.AddExtensionType(".svg", "image/svg+xml")
}

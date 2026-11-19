package main

import (
	"io"
	"net"
	"net/http"
	"testing"
	"time"
)

// hunt robust-04 / sec-15: the production http.Server must carry every timeout (it used to be a bare
// &http.Server{Addr, Handler}, i.e. unlimited slowloris).
func TestHTTPServerHasTimeouts(t *testing.T) {
	hs := newHTTPServer(":0", http.NotFoundHandler())
	if hs.ReadHeaderTimeout <= 0 || hs.ReadHeaderTimeout > 30*time.Second {
		t.Errorf("ReadHeaderTimeout = %v", hs.ReadHeaderTimeout)
	}
	if hs.ReadTimeout < hs.ReadHeaderTimeout || hs.ReadTimeout > 2*time.Minute {
		t.Errorf("ReadTimeout = %v", hs.ReadTimeout)
	}
	if hs.WriteTimeout < 5*time.Minute || hs.WriteTimeout > time.Hour {
		t.Errorf("WriteTimeout = %v (must outlast a 300 s model stream, but be bounded)", hs.WriteTimeout)
	}
	if hs.IdleTimeout <= 0 || hs.IdleTimeout > 10*time.Minute {
		t.Errorf("IdleTimeout = %v", hs.IdleTimeout)
	}
}

func TestSlowClientsAreDisconnected(t *testing.T) {
	oldH, oldR := readHeaderTimeout, readTimeout
	readHeaderTimeout, readTimeout = 300*time.Millisecond, 600*time.Millisecond
	defer func() { readHeaderTimeout, readTimeout = oldH, oldR }()

	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	hs := newHTTPServer(ln.Addr().String(), http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = io.Copy(io.Discard, r.Body)
		w.WriteHeader(204)
	}))
	go hs.Serve(ln)
	defer hs.Close()

	closedWithin := func(payload string, limit time.Duration) bool {
		c, err := net.Dial("tcp", ln.Addr().String())
		if err != nil {
			t.Fatal(err)
		}
		defer c.Close()
		_, _ = c.Write([]byte(payload))
		_ = c.SetReadDeadline(time.Now().Add(limit))
		buf := make([]byte, 512)
		for {
			if _, err := c.Read(buf); err != nil {
				ne, isNet := err.(net.Error)
				return !(isNet && ne.Timeout()) // EOF / reset = the server hung up; a read timeout = still connected
			}
		}
	}
	if !closedWithin("GET /healthz HTTP/1.1\r\nHost: x\r\nX-A: b\r\n", 3*time.Second) {
		t.Error("a client that sends half a header and stalls is still connected (no ReadHeaderTimeout)")
	}
	if !closedWithin("POST /x HTTP/1.1\r\nHost: x\r\nContent-Length: 1000\r\n\r\n{\"email\":", 3*time.Second) {
		t.Error("a client that promises a body and stalls is still connected (no ReadTimeout)")
	}
}

package localdb

import (
	"strings"
	"unicode"
)

// Text ordering that follows Postgres/Supabase's en_US.UTF-8 collation closely enough for app data: letters compare
// case- and accent-insensitively first (a < B < c, e < é < f), then accents (plain before accented), then case
// (lowercase before uppercase), and only then bytes so that two different strings never compare equal.
// Order of classes at the primary level: punctuation/space/symbols < digits < letters < every other script (code point).

var accentFold = func() map[rune]rune {
	m := map[rune]rune{}
	add := func(base rune, chars string) {
		for _, c := range chars {
			m[c] = base
		}
	}
	add('a', "àáâãäåāăąǎ")
	add('c', "çćĉċč")
	add('d', "ďđ")
	add('e', "èéêëēĕėęě")
	add('g', "ĝğġģ")
	add('h', "ĥħ")
	add('i', "ìíîïĩīĭįıǐ")
	add('j', "ĵ")
	add('k', "ķ")
	add('l', "ĺļľŀł")
	add('n', "ñńņňŉ")
	add('o', "òóôõöøōŏőǒ")
	add('r', "ŕŗř")
	add('s', "śŝşšß")
	add('t', "ţťŧ")
	add('u', "ùúûüũūŭůűųǔ")
	add('w', "ŵ")
	add('y', "ýÿŷ")
	add('z', "źżž")
	return m
}()

// collKey returns the primary weight, the accent flag (0 plain, 1 accented) and the case flag (0 lower, 1 upper).
func collKey(r rune) (primary uint32, accent, upper uint8) {
	lr := unicode.ToLower(r)
	if lr != r {
		upper = 1
	}
	if base, ok := accentFold[lr]; ok {
		accent = 1
		lr = base
	}
	switch {
	case lr >= '0' && lr <= '9':
		return 1<<24 | uint32(lr), accent, upper
	case unicode.IsLetter(lr) && lr < 0x250:
		return 2<<24 | uint32(lr), accent, upper
	case unicode.IsLetter(lr) || unicode.IsDigit(lr):
		return 3<<24 | uint32(lr), accent, upper
	}
	return uint32(lr), accent, upper // punctuation, space, symbols
}

// collateCompare orders two strings like en_US.UTF-8; it returns 0 only for identical strings.
func collateCompare(a, b string) int {
	if a == b {
		return 0
	}
	ra, rb := []rune(a), []rune(b)
	type key struct {
		p    uint32
		a, u uint8
	}
	ka, kb := make([]key, len(ra)), make([]key, len(rb))
	for i, r := range ra {
		p, ac, up := collKey(r)
		ka[i] = key{p, ac, up}
	}
	for i, r := range rb {
		p, ac, up := collKey(r)
		kb[i] = key{p, ac, up}
	}
	n := min(len(ka), len(kb))
	for i := 0; i < n; i++ {
		if ka[i].p != kb[i].p {
			if ka[i].p < kb[i].p {
				return -1
			}
			return 1
		}
	}
	if len(ka) != len(kb) {
		if len(ka) < len(kb) {
			return -1
		}
		return 1
	}
	for i := 0; i < n; i++ {
		if ka[i].a != kb[i].a {
			if ka[i].a < kb[i].a {
				return -1
			}
			return 1
		}
	}
	for i := 0; i < n; i++ {
		if ka[i].u != kb[i].u {
			if ka[i].u < kb[i].u {
				return -1
			}
			return 1
		}
	}
	return strings.Compare(a, b)
}

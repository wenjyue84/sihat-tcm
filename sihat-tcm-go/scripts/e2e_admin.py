"""
e2e_admin.py - shared helper of the browser E2E scripts.

A self-registered doctor is NOT approved: the doctor inbox/APIs answer 403 and the doctor is hidden from the patient
directory until an admin approves the account (POST /api/admin/doctors/approve). The scripts register doctors through the
UI/API and then call approve_doctor() to do the admin step through the API as the seeded demo admin (present in the
hermetic fake DB and the SQLite backend).
"""
import json
import random
import urllib.error
import urllib.request

ADMIN_EMAIL = "admin@sihat.com"
ADMIN_PASSWORD = "password123"


def _call(base, path, method="GET", body=None, token=None):
    headers = {"Content-Type": "application/json", "X-Forwarded-For": "10.%d.%d.%d" % (random.randint(1, 250), random.randint(1, 250), random.randint(1, 250))}
    if token:
        headers["Authorization"] = "Bearer " + token
    req = urllib.request.Request(base.rstrip("/") + path, method=method, headers=headers, data=json.dumps(body).encode() if body is not None else None)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, r.read().decode("utf-8", "replace"), r.headers.get("Set-Cookie") or ""
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace"), ""


def admin_token(base):
    status, text, cookie = _call(base, "/api/auth/login", "POST", {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if status != 200 or "sb-access-token=" not in cookie:
        raise RuntimeError("admin login failed: %s %s" % (status, text[:120]))
    return cookie.split("sb-access-token=", 1)[1].split(";", 1)[0]


def approve_doctor(base, email, approved=True):
    """Approve (or suspend) the doctor account with this email through the admin API. Returns the doctor id."""
    token = admin_token(base)
    status, text, _ = _call(base, "/api/admin/doctors", token=token)
    if status != 200:
        raise RuntimeError("GET /api/admin/doctors -> %s %s" % (status, text[:120]))
    row = next((d for d in json.loads(text).get("doctors", []) if (d.get("email") or "").lower() == email.lower()), None)
    if not row:
        raise RuntimeError("doctor %s not in GET /api/admin/doctors" % email)
    status, text, _ = _call(base, "/api/admin/doctors/approve", "POST", {"id": row["id"], "approved": approved}, token)
    if status != 200:
        raise RuntimeError("approve %s -> %s %s" % (email, status, text[:120]))
    return row["id"]

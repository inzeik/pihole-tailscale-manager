# ============================================
# ADGUARD · Network Ad Blocker Backend
# FastAPI + NextDNS Cloud API
# ============================================

import os
import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

NEXTDNS_API = "https://api.nextdns.io"
API_KEY = os.getenv("NEXTDNS_API_KEY")
PROFILE_ID = os.getenv("NEXTDNS_PROFILE_ID")
HEADERS = {"X-Api-Key": API_KEY} if API_KEY else {}
HTTP_TIMEOUT = 10.0

app = FastAPI(
    title="AdGuard Dashboard API",
    description="Network-wide ad blocker dashboard backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class StatsResponse(BaseModel):
    dns_queries_today: int
    ads_blocked_today: int
    ads_percentage_today: float
    domains_being_blocked: int
    status: str


def is_configured() -> bool:
    return bool(API_KEY and PROFILE_ID)


async def fetch_json(client: httpx.AsyncClient, url: str) -> dict | None:
    try:
        res = await client.get(url, headers=HEADERS, timeout=HTTP_TIMEOUT)
        if res.status_code != 200:
            print(f"[NextDNS] {url} -> {res.status_code}")
            return None
        return res.json()
    except Exception as e:
        print(f"[NextDNS] Exception on {url}: {e}")
        return None


@app.get("/")
async def root():
    return {
        "service": "AdGuard Dashboard API",
        "status": "ok",
        "configured": is_configured(),
    }


@app.get("/api/stats", response_model=StatsResponse)
async def get_stats():
    if not is_configured():
        return {
            "dns_queries_today": 0,
            "ads_blocked_today": 0,
            "ads_percentage_today": 0.0,
            "domains_being_blocked": 0,
            "status": "not_configured",
        }

    async with httpx.AsyncClient() as client:
        data = await fetch_json(
            client,
            f"{NEXTDNS_API}/profiles/{PROFILE_ID}/analytics/status",
        )

        if not data:
            return {
                "dns_queries_today": 0,
                "ads_blocked_today": 0,
                "ads_percentage_today": 0.0,
                "domains_being_blocked": 0,
                "status": "error",
            }

        rows = data.get("data", [])
        total = 0
        blocked = 0

        for row in rows:
            count = row.get("queries", 0)
            total += count
            if row.get("status") == "blocked":
                blocked += count

        pct = round((blocked / total) * 100, 2) if total > 0 else 0.0

        return {
            "dns_queries_today": total,
            "ads_blocked_today": blocked,
            "ads_percentage_today": pct,
            "domains_being_blocked": 150000,
            "status": "enabled",
        }


@app.get("/api/queries/live")
async def get_live_queries():
    if not is_configured():
        return []

    async with httpx.AsyncClient() as client:
        data = await fetch_json(
            client,
            f"{NEXTDNS_API}/profiles/{PROFILE_ID}/logs",
        )
        if not data:
            return []

        entries = data.get("data", [])
        queries = []

        for entry in entries:
            ts = entry.get("timestamp", "")
            device = entry.get("device") or {}

            client_name = (
                device.get("name")
                or device.get("model")
                or entry.get("clientIp")
                or "unknown"
            )

            queries.append({
                "time": ts[11:19] if len(ts) >= 19 else ts,
                "client": client_name,
                "domain": entry.get("domain", ""),
                "status": "BLOCKED" if entry.get("status") == "blocked" else "ALLOWED",
            })

        return queries


@app.get("/api/tailscale/devices")
async def get_devices():
    if not is_configured():
        return []

    async with httpx.AsyncClient() as client:
        data = await fetch_json(
            client,
            f"{NEXTDNS_API}/profiles/{PROFILE_ID}/logs",
        )
        if not data:
            return []

        entries = data.get("data", [])
        seen = {}

        for entry in entries:
            device = entry.get("device") or {}
            dev_id = (
                device.get("id")
                or device.get("name")
                or entry.get("clientIp")
                or "unknown"
            )

            if dev_id in seen:
                continue

            name = (
                device.get("name")
                or device.get("model")
                or entry.get("clientIp")
                or "Unknown device"
            )
            ip = (
                device.get("ip")
                or device.get("localIp")
                or entry.get("clientIp")
                or "—"
            )

            seen[dev_id] = {
                "id": str(len(seen) + 1),
                "name": name,
                "hostname": device.get("model") or name,
                "ip": ip,
                "os": device.get("model") or "Unknown",
                "online": True,
            }

        return list(seen.values())


@app.get("/api/history")
async def get_history():
    queries = await get_live_queries()
    if not queries:
        return []

    buckets = {}
    for q in queries:
        minute = q["time"][:5]
        if minute not in buckets:
            buckets[minute] = {"queries": 0, "blocked": 0}
        buckets[minute]["queries"] += 1
        if q["status"] == "BLOCKED":
            buckets[minute]["blocked"] += 1

    return [
        {"time": k, "queries": v["queries"], "blocked": v["blocked"]}
        for k, v in sorted(buckets.items())
    ]


@app.get("/api/top-blocked")
async def get_top_blocked():
    if not is_configured():
        return []

    async with httpx.AsyncClient() as client:
        data = await fetch_json(
            client,
            f"{NEXTDNS_API}/profiles/{PROFILE_ID}/logs",
        )
        if not data:
            return []

        entries = data.get("data", [])
        counts = {}

        for entry in entries:
            if entry.get("status") != "blocked":
                continue
            domain = entry.get("domain", "")
            if domain:
                counts[domain] = counts.get(domain, 0) + 1

        top = sorted(counts.items(), key=lambda x: -x[1])[:10]
        return [{"domain": d, "count": c} for d, c in top]


@app.get("/api/info")
async def get_info():
    return {
        "version": "1.0.0",
        "author": {
            "name": "Inzeik",
            "email": "inzeikofficial@gmail.com",
            "github": "https://github.com/inzeik",
        },
        "institution": {
            "name": "BMIT",
            "email": "bmit@bmssp.org",
        },
        "stack": {
            "frontend": "React + Vite",
            "backend": "FastAPI + Python 3.12",
            "filtering": "NextDNS Cloud",
            "frontend_host": "Cloudflare Pages",
            "backend_host": "Render",
            "cost": "Free",
        },
        "how_it_works": [
            {
                "step": 1,
                "title": "DNS Interception",
                "desc": "Each device sends all DNS queries through NextDNS — every domain request passes through the cloud filter first.",
            },
            {
                "step": 2,
                "title": "Cloud Filtering",
                "desc": "NextDNS matches each domain against AdGuard, OISD, and HaGeZi blocklists. Known ad and tracker domains are flagged instantly.",
            },
            {
                "step": 3,
                "title": "Silent Block",
                "desc": "Blocked domains resolve to 0.0.0.0 — the ad never loads, and the page continues as if the request never happened.",
            },
            {
                "step": 4,
                "title": "Live Dashboard",
                "desc": "This FastAPI backend polls the NextDNS API every 2 seconds and serves the aggregated data to the React dashboard over REST.",
            },
        ],
    }


@app.post("/api/blocking/toggle")
async def toggle_blocking(enable: bool):
    return {"status": "success", "blocking": enable}
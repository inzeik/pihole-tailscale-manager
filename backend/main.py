# backend/main.py
import os
import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="NextDNS Manager API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

NEXTDNS_API = "https://api.nextdns.io"
API_KEY = os.getenv("NEXTDNS_API_KEY")
PROFILE_ID = os.getenv("NEXTDNS_PROFILE_ID")
HEADERS = {"X-Api-Key": API_KEY} if API_KEY else {}


class PiHoleStats(BaseModel):
    dns_queries_today: int
    ads_blocked_today: int
    ads_percentage_today: float
    domains_being_blocked: int
    status: str


@app.get("/")
async def root():
    return {"message": "NextDNS Dashboard API is running"}


@app.get("/api/stats", response_model=PiHoleStats)
async def get_stats():
    if not API_KEY or not PROFILE_ID:
        return {
            "dns_queries_today": 0, "ads_blocked_today": 0,
            "ads_percentage_today": 0.0, "domains_being_blocked": 0,
            "status": "not_configured",
        }
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(
                f"{NEXTDNS_API}/profiles/{PROFILE_ID}/analytics/status",
                headers=HEADERS, timeout=10.0,
            )
            if res.status_code != 200:
                print(f"NextDNS stats status {res.status_code}: {res.text}")
                return {
                    "dns_queries_today": 0, "ads_blocked_today": 0,
                    "ads_percentage_today": 0.0, "domains_being_blocked": 0,
                    "status": f"api_error_{res.status_code}",
                }
            data = res.json().get("data", [])
            total = 0
            blocked = 0
            for item in data:
                total += item.get("queries", 0)
                if item.get("status") == "blocked":
                    blocked = item.get("queries", 0)
            pct = (blocked / total * 100) if total > 0 else 0
            return {
                "dns_queries_today": total,
                "ads_blocked_today": blocked,
                "ads_percentage_today": round(pct, 2),
                "domains_being_blocked": 150000,
                "status": "enabled",
            }
    except Exception as e:
        print(f"NextDNS stats exception: {e}")
        return {
            "dns_queries_today": 0, "ads_blocked_today": 0,
            "ads_percentage_today": 0.0, "domains_being_blocked": 0,
            "status": "error",
        }


@app.get("/api/queries/live")
async def get_live_queries():
    """Fetch real live logs from NextDNS."""
    if not API_KEY or not PROFILE_ID:
        return []
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(
                f"{NEXTDNS_API}/profiles/{PROFILE_ID}/logs",
                headers=HEADERS, timeout=10.0,
            )
            if res.status_code != 200:
                print(f"NextDNS logs status {res.status_code}: {res.text}")
                return []
            log_data = res.json().get("data", [])
            queries = []
            for entry in log_data:
                ts = entry.get("timestamp", "")
                device = entry.get("device", {}) or {}
                queries.append({
                    "time": ts[11:19] if len(ts) >= 19 else ts,
                    "client": device.get("name") or device.get("model") or "unknown",
                    "domain": entry.get("domain", ""),
                    "status": "BLOCKED" if entry.get("status") == "blocked" else "ALLOWED",
                })
            return queries
    except Exception as e:
        print(f"NextDNS logs exception: {e}")
        return []


@app.get("/api/tailscale/devices")
async def get_devices():
    """Real devices extracted from NextDNS logs."""
    if not API_KEY or not PROFILE_ID:
        return []
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(
                f"{NEXTDNS_API}/profiles/{PROFILE_ID}/logs",
                headers=HEADERS, timeout=10.0,
            )
            if res.status_code != 200:
                print(f"NextDNS devices status {res.status_code}: {res.text}")
                return []
            log_data = res.json().get("data", [])

            # Aggregate unique devices
            devices_map = {}
            for entry in log_data:
                device = entry.get("device", {}) or {}
                dev_id = device.get("id") or device.get("name") or "unknown"
                if dev_id not in devices_map:
                    devices_map[dev_id] = {
                        "id": str(len(devices_map) + 1),
                        "name": device.get("name") or device.get("model") or "Unknown device",
                        "hostname": device.get("model") or device.get("name") or "unknown",
                        "ip": device.get("ip") or device.get("localIp") or "—",
                        "os": device.get("model") or "Unknown",
                        "online": True,
                    }
            return list(devices_map.values())
    except Exception as e:
        print(f"NextDNS devices exception: {e}")
        return []


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


@app.get("/api/info")
async def get_info():
    return {
        "version": "1.0.0-nextdns",
        "real_setup": {
            "hardware": "Windows PC + NextDNS Cloud",
            "dns_filter": "NextDNS",
            "mesh_vpn": "Tailscale",
            "cost_usd": 0,
        },
        "how_it_works": [
            {"step": 1, "title": "DNS Interception", "desc": "NextDNS becomes your DNS provider for all your devices."},
            {"step": 2, "title": "Cloud Filtering", "desc": "Queries are filtered in the cloud against 150,000+ blocklist domains."},
            {"step": 3, "title": "Silent Block", "desc": "Ads and trackers never reach your device — the page just skips them."},
            {"step": 4, "title": "Anywhere Access", "desc": "Tailscale routes DNS through your NextDNS profile from any network."},
        ],
    }


@app.post("/api/blocking/toggle")
async def toggle_blocking(enable: bool):
    return {"status": "success", "blocking": enable}
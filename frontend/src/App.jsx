import { useState, useEffect } from 'react';
import {
  getPiHoleStats,
  getTailscaleDevices,
  getLiveQueries,
  getHistory,
  getTopBlocked,
  toggleBlocking,
  getInfo,
} from './api';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import AnimatedNumber from './components/AnimatedNumber';
import QRModal from './components/QRModal';
import HowItWorksModal from './components/HowItWorksModal';
import './App.css';

function ShieldIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function QRicon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <path d="M14 14h3v3h-3zM21 14v3M14 21h3M21 21h.01" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

export default function App() {
  const [stats, setStats] = useState(null);
  const [devices, setDevices] = useState([]);
  const [queries, setQueries] = useState([]);
  const [history, setHistory] = useState([]);
  const [topBlocked, setTopBlocked] = useState([]);
  const [info, setInfo] = useState(null);
  const [blocking, setBlocking] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [showHIW, setShowHIW] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, d, q, h, t, i] = await Promise.all([
          getPiHoleStats(),
          getTailscaleDevices(),
          getLiveQueries(),
          getHistory(),
          getTopBlocked(),
          getInfo(),
        ]);
        setStats(s);
        setDevices(d);
        setQueries(q);
        setHistory(h);
        setTopBlocked(t);
        setInfo(i);
        setBlocking(s.status === 'enabled');
        setReady(true);
      } catch (e) {
        console.error(e);
      }
    };
    load();
    const id = setInterval(load, 2000);
    return () => clearInterval(id);
  }, []);

  const handleToggle = async () => {
    try {
      await toggleBlocking(!blocking);
      setBlocking(!blocking);
    } catch (e) {
      console.error(e);
    }
  };

  if (!ready) {
    return (
      <div className="splash">
        <div className="splash-inner">
          <div className="splash-mark"><ShieldIcon size={24} /></div>
          <p className="splash-text">Loading Dashboard</p>
        </div>
      </div>
    );
  }

  const maxCount = topBlocked.length > 0 ? topBlocked[0].count : 1;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><ShieldIcon size={14} /></div>
          <span>ADGUARD</span>
        </div>

        <nav className="nav-links">
          <a href="#dashboard">Dashboard</a>
          <a href="#devices">Devices</a>
          <a href="#queries">Queries</a>
        </nav>

        <div className="top-actions">
          <button className="icon-btn" onClick={() => setShowQR(true)} title="Show QR code">
            <QRicon />
          </button>
          <button className="icon-btn" onClick={() => setShowHIW(true)} title="How it works">
            <InfoIcon />
          </button>
          <button className={`toggle-btn ${blocking ? 'on' : 'off'}`} onClick={handleToggle}>
            <span className="toggle-dot" />
            {blocking ? 'Active' : 'Paused'}
          </button>
        </div>
      </header>

      <section className="hero" id="dashboard">
        <div className="hero-left">
          <div className="hero-eyebrow">Network Protection · Live</div>
          <h1>Block ads. Everywhere.</h1>
          <p className="hero-sub">
            DNS-level blocking for every device on your network — at the source,
            before ads ever reach you.
          </p>
        </div>
        <div className="hero-right">
          <div className="hero-stat">Blocked Today</div>
          <div className="hero-stat-value">
            <AnimatedNumber value={stats?.ads_blocked_today || 0} />
          </div>
          <div className="hero-stat-label">Across {devices.length} devices</div>
        </div>
      </section>

      <section className="kpi-grid">
        <div className="kpi">
          <div className="kpi-label">DNS Queries</div>
          <div className="kpi-value">
            <AnimatedNumber value={stats?.dns_queries_today || 0} />
          </div>
          <div className="kpi-sub">Last 24 hours</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Ads Blocked</div>
          <div className="kpi-value accent-orange">
            <AnimatedNumber value={stats?.ads_blocked_today || 0} />
          </div>
          <div className="kpi-sub">Last 24 hours</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Block Ratio</div>
          <div className="kpi-value accent-red">
            {stats?.ads_percentage_today?.toFixed(2) || '0.00'}
            <span className="kpi-suffix">%</span>
          </div>
          <div className="kpi-sub">Of all queries</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Blocklist</div>
          <div className="kpi-value">
            <AnimatedNumber value={stats?.domains_being_blocked || 0} />
          </div>
          <div className="kpi-sub">Domains</div>
        </div>
      </section>

      <div className="main-grid">
        <div className="main-col">
          <section className="panel chart-panel">
            <div className="panel-head">
              <div>
                <div className="panel-title">Network Traffic</div>
                <div className="panel-sub">Queries vs. blocked — last 40 minutes</div>
              </div>
              <div className="legend">
                <span className="legend-item"><span className="legend-dot blue" /> Queries</span>
                <span className="legend-item"><span className="legend-dot pink" /> Blocked</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={history} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="g-queries" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0A0A0A" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#0A0A0A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g-blocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF5C1A" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#FF5C1A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#E5E5E3" vertical={false} />
                <XAxis dataKey="time" stroke="#A8A8A8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#A8A8A8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#FFFFFF',
                    border: '1px solid #E5E5E3',
                    borderRadius: 0,
                    fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
                    fontSize: 12,
                  }}
                  labelStyle={{ color: '#6B6B6B', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}
                />
                <Area type="monotone" dataKey="queries" stroke="#0A0A0A" strokeWidth={2} fill="url(#g-queries)" name="Queries" />
                <Area type="monotone" dataKey="blocked" stroke="#FF5C1A" strokeWidth={2} fill="url(#g-blocked)" name="Blocked" />
              </AreaChart>
            </ResponsiveContainer>
          </section>

          <section className="panel" id="queries">
            <div className="panel-head">
              <div>
                <div className="panel-title">Live Queries</div>
                <div className="panel-sub">Streaming from your network</div>
              </div>
              <span className="live-pill"><span className="live-dot" /> Live</span>
            </div>
            <div className="log">
              {queries.length === 0 ? (
                <div className="empty-state">No activity yet</div>
              ) : (
                queries.map((q, i) => (
                  <div key={i} className="log-row">
                    <span className="log-time">{q.time}</span>
                    <span className="log-client">{q.client}</span>
                    <span className="log-domain">{q.domain}</span>
                    <span className={`log-badge ${q.status.toLowerCase()}`}>
                      {q.status === 'BLOCKED' ? 'Blocked' : 'Allowed'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <aside className="side-col">
          <section className="panel" id="devices">
            <div className="panel-head">
              <div>
                <div className="panel-title">Devices</div>
                <div className="panel-sub">
                  {devices.filter((d) => d.online).length} of {devices.length} online
                </div>
              </div>
            </div>
            <div className="devices">
              {devices.length === 0 ? (
                <div className="empty-state">No devices</div>
              ) : (
                devices.map((d) => (
                  <div key={d.id} className={`device ${d.online ? 'online' : 'offline'}`}>
                    <span className="device-status" />
                    <div className="device-info">
                      <span className="device-name">{d.name}</span>
                      <span className="device-meta">{d.ip}</span>
                    </div>
                    <span className="device-badge">{d.online ? 'On' : 'Off'}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <div className="panel-title">Top Blocked</div>
                <div className="panel-sub">Most blocked domains</div>
              </div>
            </div>
            <div className="top-blocked">
              {topBlocked.length === 0 ? (
                <div className="empty-state">No data yet</div>
              ) : (
                topBlocked.map((item, i) => (
                  <div key={i} className="top-row">
                    <div className="top-domain">{item.domain}</div>
                    <div className="top-count">{item.count}</div>
                    <div className="top-bar-wrap">
                      <div className="top-bar" style={{ width: `${(item.count / maxCount) * 100}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>

      <footer className="footer">
        <span>AdGuard · Network Ad Blocker</span>
        <span>NextDNS + FastAPI + React</span>
      </footer>

      <QRModal open={showQR} onClose={() => setShowQR(false)} />
      <HowItWorksModal open={showHIW} onClose={() => setShowHIW(false)} info={info} />
    </div>
  );
}
import { useState, useEffect } from 'react';
import {
  getPiHoleStats,
  getTailscaleDevices,
  getLiveQueries,
  getHistory,
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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <path d="M14 14h3v3h-3zM21 14v3M14 21h3M21 21h.01" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  const [info, setInfo] = useState(null);
  const [blocking, setBlocking] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [showHIW, setShowHIW] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, d, q, h, i] = await Promise.all([
          getPiHoleStats(),
          getTailscaleDevices(),
          getLiveQueries(),
          getHistory(),
          getInfo(),
        ]);
        setStats(s);
        setDevices(d);
        setQueries(q);
        setHistory(h);
        setInfo(i);
        setBlocking(s.status === 'enabled');
        setReady(true);
      } catch (e) {
        console.error(e);
      }
    };
    load();
    const id = setInterval(load, 1500);
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
        <div className="splash-logo"><ShieldIcon size={56} /></div>
        <p className="splash-text">Starting dashboard…</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-logo">
            <ShieldIcon size={22} />
          </div>
          <span className="brand-name">AdGuard</span>
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
            {blocking ? 'Protection on' : 'Protection off'}
          </button>
        </div>
      </header>

      <section className="hero" id="dashboard">
        <h1>
          Block ads.<br />
          <span className="hero-accent">Everywhere.</span>
        </h1>
        <p className="hero-sub">
          A network-wide DNS blocker that protects every device in your home — at the source,
          before ads even reach you.
        </p>
        <div className="hero-meta">
          <span className="hero-badge live">
            <span className="live-dot" /> Live
          </span>
          <span className="hero-badge">Last 24 hours</span>
          <span className="hero-badge">NextDNS</span>
        </div>
      </section>

      <section className="stats">
        <StatCard
          label="DNS Queries"
          value={stats?.dns_queries_today || 0}
          color="blue"
          sub="today"
        />
        <StatCard
          label="Ads Blocked"
          value={stats?.ads_blocked_today || 0}
          color="orange"
          sub="today"
        />
        <StatCard
          label="Block Ratio"
          value={stats?.ads_percentage_today || 0}
          suffix="%"
          decimals={2}
          color="pink"
          sub="of all queries"
        />
        <StatCard
          label="Blocklist"
          value={stats?.domains_being_blocked || 0}
          color="ink"
          sub="domains"
        />
      </section>

      <section className="panel chart-panel">
        <div className="panel-head">
          <div>
            <h2>Network traffic</h2>
            <p className="panel-sub">Queries vs. blocked — last 40 minutes</p>
          </div>
          <div className="legend">
            <span className="legend-item"><span className="legend-dot blue" /> Queries</span>
            <span className="legend-item"><span className="legend-dot pink" /> Blocked</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={history} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="g-queries" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0060DF" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#0060DF" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="g-blocked" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF4F5E" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#FF4F5E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#F0F0F4" vertical={false} />
            <XAxis dataKey="time" stroke="#B3B3BF" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#B3B3BF" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: '#FFF',
                border: '1px solid #E0E0E6',
                borderRadius: 8,
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                fontFamily: 'Inter, sans-serif',
              }}
              labelStyle={{ color: '#6E6E7F', fontWeight: 600 }}
            />
            <Area type="monotone" dataKey="queries" stroke="#0060DF" strokeWidth={2.5} fill="url(#g-queries)" name="Queries" />
            <Area type="monotone" dataKey="blocked" stroke="#FF4F5E" strokeWidth={2.5} fill="url(#g-blocked)" name="Blocked" />
          </AreaChart>
        </ResponsiveContainer>
      </section>

      <div className="two-col">
        <section className="panel" id="devices">
          <div className="panel-head">
            <div>
              <h2>Devices</h2>
              <p className="panel-sub">
                {devices.filter((d) => d.online).length} of {devices.length} online
              </p>
            </div>
          </div>
          <div className="devices">
            {devices.length === 0 ? (
              <div className="empty-state">No devices seen yet</div>
            ) : (
              devices.map((d) => (
                <div key={d.id} className={`device ${d.online ? 'online' : 'offline'}`}>
                  <span className={`status-dot ${d.online ? 'online' : 'offline'}`} />
                  <div className="device-info">
                    <span className="device-name">{d.name}</span>
                    <span className="device-meta">{d.ip} · {d.os}</span>
                  </div>
                  <span className="device-badge">{d.online ? 'Online' : 'Offline'}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="panel" id="queries">
          <div className="panel-head">
            <div>
              <h2>Live DNS queries</h2>
              <p className="panel-sub">Streaming activity from your network</p>
            </div>
            <span className="live-pill"><span className="live-dot" /> Live</span>
          </div>
          <div className="log">
            {queries.map((q, i) => (
              <div key={i} className={`log-row ${q.status === 'BLOCKED' ? 'blocked' : 'allowed'}`}>
                <span className="log-time">{q.time}</span>
                <span className="log-client">{q.client}</span>
                <span className="log-domain">{q.domain}</span>
                <span className={`log-badge ${q.status.toLowerCase()}`}>
                  {q.status === 'BLOCKED' ? 'Blocked' : 'Allowed'}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <footer className="footer">
        <span>AdGuard · Network Ad Blocker</span>
        <span className="footer-sep">·</span>
        <span>Built with NextDNS + FastAPI + React</span>
      </footer>

      <QRModal open={showQR} onClose={() => setShowQR(false)} />
      <HowItWorksModal open={showHIW} onClose={() => setShowHIW(false)} info={info} />
    </div>
  );
}

function StatCard({ label, value, suffix = '', decimals = 0, color, sub }) {
  return (
    <div className={`stat stat-${color}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">
        {decimals > 0 ? (
          <>
            {value.toFixed(decimals)}
            <span className="stat-suffix">{suffix}</span>
          </>
        ) : (
          <>
            <AnimatedNumber value={value} />
            <span className="stat-suffix">{suffix}</span>
          </>
        )}
      </div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}
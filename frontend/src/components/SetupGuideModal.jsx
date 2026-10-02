import { useState } from 'react';

const NEXTDNS_HOST = 'a869b3.dns.nextdns.io';
const NEXTDNS_PROFILE_URL = 'https://my.nextdns.io/a869b3';

const DEVICES = [
  {
    id: 'android',
    name: 'Android',
    desc: 'Android 9+ phones and tablets',
    steps: [
      'Open Settings → Network & Internet',
      'Tap "Private DNS"',
      'Select "Private DNS provider hostname"',
      'Enter the hostname below',
      'Tap Save',
    ],
    label: 'Hostname',
    value: NEXTDNS_HOST,
  },
  {
    id: 'ios',
    name: 'iPhone / iPad',
    desc: 'iOS 14+ and iPadOS',
    steps: [
      'Open Safari and visit apple.nextdns.io',
      'Enter your Profile ID: a869b3',
      'Tap Install Profile → Allow',
      'Open Settings → General → VPN & Device Management',
      'Install the downloaded profile',
    ],
    label: 'Profile',
    value: 'apple.nextdns.io',
  },
  {
    id: 'windows',
    name: 'Windows',
    desc: 'Windows 10 and Windows 11',
    steps: [
      'Download the NextDNS Windows app',
      'Run the installer and open the app',
      'Paste Profile ID: a869b3',
      'Click Save',
      'Verify at test.nextdns.io',
    ],
    label: 'Download',
    value: 'nextdns.io/download',
  },
  {
    id: 'macos',
    name: 'macOS',
    desc: 'macOS 11 and newer',
    steps: [
      'Download the NextDNS Mac app',
      'Install and open it',
      'Enter Profile ID: a869b3',
      'Allow the DNS profile install',
      'Verify at test.nextdns.io',
    ],
    label: 'Download',
    value: 'nextdns.io/download',
  },
  {
    id: 'smarttv',
    name: 'Smart TV',
    desc: 'Samsung, LG, Android TV',
    steps: [
      'Open Settings → Network → DNS Settings',
      'Change DNS from Automatic to Manual',
      'Enter the Primary DNS below',
      'Set Secondary to 45.90.30.0',
      'Save and restart the TV',
    ],
    label: 'Primary DNS',
    value: '45.90.28.0',
  },
  {
    id: 'router',
    name: 'Wi-Fi Router',
    desc: 'Covers every device on your network',
    steps: [
      'Open your router admin page',
      'Find DHCP or Internet → DNS settings',
      'Enter the Primary DNS below',
      'Set Secondary to 45.90.30.0',
      'Save and reboot the router',
    ],
    label: 'Primary DNS',
    value: '45.90.28.0',
  },
];

function CopyRow({ label, value }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error(e);
    }
  };
  return (
    <div className="sg-copy">
      <div className="sg-copy-label">{label}</div>
      <div className="sg-copy-row">
        <code className="sg-copy-value">{value}</code>
        <button className="sg-copy-btn" onClick={handleCopy}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

export default function SetupGuideModal({ open, onClose }) {
  const [active, setActive] = useState('android');
  if (!open) return null;

  const device = DEVICES.find((d) => d.id === active);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-setup" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="sg-head">
          <h2>Set up on your device</h2>
          <p className="modal-sub">
            Protect any device in 2 minutes. Follow the steps for your platform.
          </p>
        </div>

        <div className="sg-layout">
          <aside className="sg-sidebar">
            {DEVICES.map((d) => (
              <button
                key={d.id}
                className={`sg-nav-item ${active === d.id ? 'active' : ''}`}
                onClick={() => setActive(d.id)}
              >
                <span className="sg-nav-name">{d.name}</span>
                <span className="sg-nav-arrow">→</span>
              </button>
            ))}
          </aside>

          <div className="sg-content">
            <div className="sg-content-head">
              <h3>{device.name}</h3>
              <p>{device.desc}</p>
            </div>

            <div className="sg-steps">
              {device.steps.map((step, i) => (
                <div key={i} className="sg-step">
                  <div className="sg-step-num">{String(i + 1).padStart(2, '0')}</div>
                  <div className="sg-step-text">{step}</div>
                </div>
              ))}
            </div>

            <CopyRow label={device.label} value={device.value} />
          </div>
        </div>

        <div className="sg-footer">
          <div className="sg-footer-block">
            <div className="sg-footer-label">Full profile</div>
            <a
              href={NEXTDNS_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="sg-footer-link"
            >
              {NEXTDNS_PROFILE_URL}
            </a>
          </div>
          <a
            href="https://nextdns.io"
            target="_blank"
            rel="noopener noreferrer"
            className="sg-footer-cta"
          >
            Get your own NextDNS
          </a>
        </div>
      </div>
    </div>
  );
}
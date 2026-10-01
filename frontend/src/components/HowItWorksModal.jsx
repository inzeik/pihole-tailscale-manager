export default function HowItWorksModal({ open, onClose, info }) {
  if (!open || !info) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2>How it works</h2>
        <p className="modal-sub">
          Simulating a real Pi-hole + Tailscale deployment on a Raspberry Pi.
        </p>

        <div className="hiw-hero">
          <div className="hiw-hero-item">
            <span className="hiw-label">Hardware</span>
            <span className="hiw-value">{info.real_setup.hardware}</span>
          </div>
          <div className="hiw-hero-item">
            <span className="hiw-label">DNS Filter</span>
            <span className="hiw-value">{info.real_setup.dns_filter}</span>
          </div>
          <div className="hiw-hero-item">
            <span className="hiw-label">Mesh VPN</span>
            <span className="hiw-value">{info.real_setup.mesh_vpn}</span>
          </div>
          <div className="hiw-hero-item">
            <span className="hiw-label">Total cost</span>
            <span className="hiw-value">${info.real_setup.cost_usd}</span>
          </div>
        </div>

        <div className="hiw-steps">
          {info.how_it_works.map((s) => (
            <div key={s.step} className="hiw-step">
              <div className="hiw-num">{s.step}</div>
              <div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
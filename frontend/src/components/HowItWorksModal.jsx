export default function HowItWorksModal({ open, onClose, info }) {
  if (!open || !info) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2>How it works</h2>
        <p className="modal-sub">
          A cloud-deployed DNS filtering system with a real-time dashboard.
        </p>

        <div className="hiw-hero">
          <div className="hiw-hero-item">
            <span className="hiw-label">Frontend</span>
            <span className="hiw-value">{info.stack.frontend}</span>
          </div>
          <div className="hiw-hero-item">
            <span className="hiw-label">Backend</span>
            <span className="hiw-value">{info.stack.backend}</span>
          </div>
          <div className="hiw-hero-item">
            <span className="hiw-label">Filtering</span>
            <span className="hiw-value">{info.stack.filtering}</span>
          </div>
          <div className="hiw-hero-item">
            <span className="hiw-label">Hosting</span>
            <span className="hiw-value">
              {info.stack.frontend_host} + {info.stack.backend_host}
            </span>
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

        <div className="hiw-footer">
          <span className="hiw-label">Total cost</span>
          <span className="hiw-value">{info.stack.cost} · No hardware required</span>
        </div>

        <div className="hiw-author">
          <div className="hiw-author-row">
            <span className="hiw-label">Built by</span>
            <span className="hiw-value">{info.author.name}</span>
          </div>
          <div className="hiw-author-row">
            <span className="hiw-label">Email</span>
            <a href={`mailto:${info.author.email}`} className="hiw-value hiw-link">
              {info.author.email}
            </a>
          </div>
          <div className="hiw-author-row">
            <span className="hiw-label">Institution</span>
            <span className="hiw-value">{info.institution.name}</span>
          </div>
          <div className="hiw-author-row">
            <span className="hiw-label">College Email</span>
            <a href={`mailto:${info.institution.email}`} className="hiw-value hiw-link">
              {info.institution.email}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
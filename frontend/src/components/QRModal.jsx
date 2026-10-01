import { QRCodeSVG } from 'qrcode.react';

export default function QRModal({ open, onClose }) {
  if (!open) return null;
  const url = window.location.origin;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2>Scan to open on your phone</h2>
        <p className="modal-sub">Make sure you're on the same Wi-Fi / hotspot</p>
        <div className="qr-wrap">
          <QRCodeSVG value={url} size={220} level="M" bgColor="#ffffff" fgColor="#0a0a0a" />
        </div>
        <code className="qr-url">{url}</code>
      </div>
    </div>
  );
}
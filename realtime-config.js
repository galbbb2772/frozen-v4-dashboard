window.FROZEN_V4_REALTIME_WS = window.localStorage.getItem('FROZEN_V4_REALTIME_WS') || 'wss://frozen-v4-realtime.onrender.com/ws';

// Keep the Intraday reference card aligned with the canonical Beta Hedge export.
// The hedge engine stores portfolio_beta120 / B_regime_active, while older
// intraday payloads used legacy portfolio_beta / B_active names.
(function () {
  let beta = null;

  function fmtNum(v, d = 3) {
    return v == null || Number.isNaN(Number(v)) ? '—' : Number(v).toFixed(d);
  }
  function fmtPct(v, d = 2) {
    return v == null || Number.isNaN(Number(v)) ? '—' : (Number(v) * 100).toFixed(d) + '%';
  }
  function setRow(box, label, value, cls) {
    if (!box) return;
    let row = Array.from(box.querySelectorAll('.kv')).find(function (el) {
      const k = el.querySelector('span');
      return k && k.textContent.trim() === label;
    });
    if (!row) {
      row = document.createElement('div');
      row.className = 'kv';
      const k = document.createElement('span');
      k.className = 'muted';
      k.textContent = label;
      const v = document.createElement('b');
      row.appendChild(k);
      row.appendChild(v);
      box.appendChild(row);
    }
    const out = row.querySelector('b');
    out.textContent = value;
    out.className = cls || '';
  }
  function applyBetaReference() {
    const box = document.getElementById('reference');
    if (!box || !beta) return;
    setRow(box, 'Beta as-of', beta.market_date || '—');
    setRow(box, 'Portfolio beta', fmtNum(beta.portfolio_beta120, 3));
    setRow(box, 'Beta coverage', fmtPct(beta.beta_coverage));
    setRow(box, 'Hedge B', beta.B_regime_active ? 'ACTIVE' : 'OFF', beta.B_regime_active ? 'warn' : 'good');
    setRow(box, 'B target SPY short', fmtPct(beta.B_target_short_spy_nav), beta.B_regime_active ? 'warn' : '');
    setRow(box, 'SPY vs MA200', fmtPct(beta.spy_distance_to_ma200));
  }
  async function refreshBetaReference() {
    try {
      const r = await fetch('data/beta_hedge.json?x=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) return;
      const d = await r.json();
      beta = d.current || null;
      applyBetaReference();
    } catch (_) {}
  }

  document.addEventListener('DOMContentLoaded', function () {
    refreshBetaReference();
    setInterval(refreshBetaReference, 60000);
    // Intraday render can replace the reference DOM every refresh; re-apply the
    // canonical hedge fields shortly afterwards without touching strategy state.
    setInterval(applyBetaReference, 2000);
  });
})();

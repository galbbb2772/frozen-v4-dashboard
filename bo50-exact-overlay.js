(() => {
  const NAME = "UPPER-BOX50 · exact daily";
  let payload = null;
  let tries = 0;

  function sameTrace(t) { return t && t.name === NAME; }
  function upsert(id, y, transform) {
    const el = document.getElementById(id);
    if (!el || !Array.isArray(el.data) || !payload) return false;
    const idx = el.data.findIndex(sameTrace);
    if (idx >= 0) Plotly.deleteTraces(el, idx);
    const yy = transform ? y.map(transform) : y;
    Plotly.addTraces(el, {
      x: payload.dates,
      y: yy,
      name: NAME,
      mode: "lines",
      line: {width: 2.2, dash: "dot"},
      hovertemplate: "%{x}<br>" + NAME + ": %{y:.4f}<extra></extra>"
    });
    return true;
  }

  function summary() {
    const host = document.getElementById("histSummary");
    if (!host || document.getElementById("bo50ExactSummary")) return;
    const x = document.createElement("div");
    x.id = "bo50ExactSummary";
    x.className = "note section";
    const m = payload.metrics;
    x.innerHTML = `<b>UPPER-BOX50 · exact position-level replay</b><br>` +
      `Ending <b>${m.ending_multiple.toFixed(6)}x</b> · Total return <b>${m.total_return_pct.toFixed(2)}%</b> · ` +
      `CAGR <b>${m.cagr_pct.toFixed(2)}%</b> · Max DD <b>${m.max_drawdown_pct.toFixed(2)}%</b> · ` +
      `$100k → <b>$${m.capital_100k_end.toLocaleString(undefined,{maximumFractionDigits:2})}</b><br>` +
      `<span class="tiny">Historical research/shadow only. Fixed MAIN-B selection path; 14 trades with aggregate box position ≥55% were sized at 50%. ` +
      `Exact curve reconstructed from the frozen 2019-01→2026-03 OHLC snapshot and validated against MAIN-B to floating-point precision.</span>`;
    host.parentElement.appendChild(x);
  }

  function apply() {
    if (!payload) return;
    const a = upsert("histEquity", payload.equity);
    const b = upsert("histDD", payload.drawdown);
    const c = upsert("capitalChart", payload.equity, v => v * 100000);
    if (a || b || c) summary();
    tries++;
  }

  async function load() {
    try {
      const r = await fetch("data/upper_box50_exact.json?ts=" + Date.now(), {cache:"no-store"});
      if (!r.ok) throw new Error("HTTP " + r.status);
      payload = await r.json();
      apply();
      const timer = setInterval(() => { apply(); if (tries > 20) clearInterval(timer); }, 1000);
    } catch (e) {
      console.warn("BO50 exact overlay unavailable", e);
    }
  }

  document.addEventListener("click", (ev) => {
    const t = ev.target;
    if (!t) return;
    if (t.matches('[data-tab="historical"]') || t.closest('#historical .range')) {
      setTimeout(apply, 350);
      setTimeout(apply, 900);
    }
  });
  load();
})();

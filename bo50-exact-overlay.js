(() => {
  const NAME = "UPPER-BOX50 · exact daily";
  let payload = null;
  let livePayload = null;
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

  function esc(v) {
    return String(v ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function pct(v, d = 2) {
    return v == null || Number.isNaN(Number(v)) ? "—" : (Number(v) * 100).toFixed(d) + "%";
  }

  function laneContext(lane, st) {
    const reg = st.regime_shadow || {};
    const upper = st.upper_box_shadow || {};
    if (lane === "REGIME-COMBO50") {
      return {
        mode: reg.combo50_flag ? "50% CAP" : "FULL SIZE",
        detail: `CALM_CROWDED ${reg.calm_crowded ? "ON" : "OFF"} · DUAL ${reg.regime_dual_drain ? "ON" : "OFF"}`,
        status: reg.strict_pure_oos ? "PURE YES" : "PURE NO",
        statusDetail: `Freeze ${reg.freeze_date || "2026-09-21"}`
      };
    }
    if (lane === "UPPER-BOX50") {
      return {
        mode: upper.upper_box_flag ? "50% SIZE" : "FULL SIZE",
        detail: `${upper.aggregate_type || "—"} · pos ${upper.aggregate_position_pct == null ? "—" : Number(upper.aggregate_position_pct).toFixed(1) + "%"}`,
        status: upper.strict_pure_oos ? "PURE YES" : "PURE NO",
        statusDetail: `Freeze ${upper.freeze_date || "2026-09-22"}`
      };
    }
    if (lane === "MAIN-B") {
      return {mode:"OFFICIAL MAIN", detail:"Frozen V4 selection / lifecycle", status:"FORWARD OOS", statusDetail:"Main ledger"};
    }
    if (lane === "BENCH-A") {
      return {mode:"BENCHMARK", detail:"Benchmark lane", status:"FORWARD OOS", statusDetail:"Separate ledger"};
    }
    if (lane === "SHADOW-3S") {
      return {mode:"SHADOW", detail:"3-slot shadow lane", status:"FORWARD OOS", statusDetail:"Separate ledger"};
    }
    return {mode:"SHADOW", detail:"SAT20 shadow lane", status:"FORWARD OOS", statusDetail:"Separate ledger"};
  }

  function ensureLanePositionPanels() {
    const oos = document.getElementById("oos");
    if (!oos || document.getElementById("lanePositionPanels")) return;
    const section = document.createElement("div");
    section.id = "lanePositionPanels";
    section.className = "section twoequal";
    section.innerHTML = `
      <div class="card">
        <div class="label" id="laneCurrentTitle">Selected lane · current positions</div>
        <div class="small" style="margin:5px 0 10px">当前仍在持有 / 等待退出的实际 Forward OOS 仓位。</div>
        <div id="laneCurrentPositions" class="tablewrap"></div>
      </div>
      <div class="card">
        <div class="label" id="laneHistoryTitle">Selected lane · entry history</div>
        <div class="small" style="margin:5px 0 10px">该 Lane 自 Forward OOS 启动以来进入过的全部仓位，包含当前与已退出记录。</div>
        <div id="lanePositionHistory" class="tablewrap"></div>
      </div>`;
    oos.appendChild(section);
  }

  function miniTable(rows, columns) {
    if (!rows?.length) return '<div class="empty">暂无记录</div>';
    return '<table><thead><tr>' + columns.map(c => '<th>' + esc(c[0]) + '</th>').join('') + '</tr></thead><tbody>' +
      rows.map(r => '<tr>' + columns.map(c => '<td>' + esc(c[1](r)) + '</td>').join('') + '</tr>').join('') +
      '</tbody></table>';
  }

  function renderLanePositions(lane) {
    if (!livePayload) return;
    ensureLanePositionPanels();
    const currentHost = document.getElementById("laneCurrentPositions");
    const historyHost = document.getElementById("lanePositionHistory");
    if (!currentHost || !historyHost) return;

    const current = (livePayload.current_positions || [])
      .filter(r => r.shadow_version === lane)
      .sort((a,b) => String(b.entry_date || "").localeCompare(String(a.entry_date || "")));
    const history = (livePayload.all_entry_log || [])
      .filter(r => r.shadow_version === lane)
      .sort((a,b) => String(b.entry_date || "").localeCompare(String(a.entry_date || "")) || String(b.recorded_at_utc || "").localeCompare(String(a.recorded_at_utc || "")));

    document.getElementById("laneCurrentTitle").textContent = `${lane} · CURRENT POSITIONS`;
    document.getElementById("laneHistoryTitle").textContent = `${lane} · ENTRY HISTORY`;

    currentHost.innerHTML = miniTable(current, [
      ["Symbol", r => r.symbol || "—"],
      ["Entry", r => r.entry_date || "—"],
      ["Slot", r => r.slot ?? "—"],
      ["Weight", r => pct(r.model_target_weight)],
      ["State", r => r.status || "OPEN"]
    ]);

    historyHost.innerHTML = miniTable(history, [
      ["Symbol", r => r.symbol || "—"],
      ["Entry", r => r.entry_date || "—"],
      ["Slot", r => r.slot ?? "—"],
      ["Weight", r => pct(r.model_target_weight)],
      ["State", r => r.status || "—"],
      ["Exit", r => r.exit_date || "—"],
      ["Return", r => pct(r.model_net_return)],
      ["Reason", r => r.exit_reason || "—"]
    ]);
  }

  function renderTopForLane(lane) {
    if (!livePayload) return;
    const host = document.getElementById("topCards");
    if (!host) return;

    const live = livePayload;
    const st = live.statuses || {};
    const eod = st.eod_replay || {};
    const prev = st.market_preview || {};
    const d = live.lanes?.[lane] || {};
    const current = live.current_candidates || [];
    const selected = eod.selected?.[lane];
    const ctx = laneContext(lane, st);

    const cards = [
      ["Latest EOD", eod.market_date || "—", `${eod.status || "NOT RUN"} · ${lane}`],
      [`${lane} OOS`, d.latest_equity == null ? "—" : Number(d.latest_equity).toFixed(4) + "x", "累计 " + pct(d.cumulative_return)],
      ["Latest Daily", pct(d.latest_daily_return), lane],
      ["Open Positions", d.open_positions ?? 0, "Target exposure " + pct(d.active_target_exposure)],
      ["Base Candidates", current.length, `${prev.signal_date || "—"} · shared base gate`],
      ["Selected This EOD", selected ?? 0, lane],
      ["Lane Mode", ctx.mode, ctx.detail],
      ["Lane OOS", ctx.status, ctx.statusDetail],
      ["Current DD", pct(d.latest_drawdown), "Max DD " + pct(d.max_drawdown)],
      ["Closed Trades", d.closed_trades ?? 0, "Win rate " + pct(d.win_rate)]
    ];

    host.innerHTML = cards.map(x =>
      '<div class="card"><div class="label">' + esc(x[0]) + '</div><div class="value">' + esc(x[1]) + '</div><div class="small">' + esc(x[2]) + '</div></div>'
    ).join("");
    host.dataset.selectedLane = lane;
    renderLanePositions(lane);
  }

  async function loadLaneSummary() {
    try {
      const r = await fetch("data/live.json?lane_ui=" + Date.now(), {cache:"no-store"});
      if (!r.ok) throw new Error("HTTP " + r.status);
      livePayload = await r.json();
      const activeLane = document.querySelector('.laneBtn.active[data-lane]')?.dataset.lane || "MAIN-B";
      renderTopForLane(activeLane);
    } catch (e) {
      console.warn("Lane summary sync unavailable", e);
    }
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

    const laneButton = t.closest?.(".laneBtn[data-lane]");
    if (laneButton) {
      setTimeout(() => renderTopForLane(laneButton.dataset.lane), 0);
    }

    if (t.matches?.('[data-tab="historical"]') || t.closest?.('#historical .range')) {
      setTimeout(apply, 350);
      setTimeout(apply, 900);
    }
  });

  loadLaneSummary();
  load();
})();

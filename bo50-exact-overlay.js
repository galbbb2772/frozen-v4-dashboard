(() => {
  let historicalUpgraded = false;
  let readinessPoll = null;

  function bindStandaloneTab(btn, section) {
    btn.addEventListener('click', ev => {
      ev.preventDefault();
      document.querySelectorAll('.tabs button').forEach(x => x.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(x => x.classList.remove('on'));
      btn.classList.add('active');
      section.classList.add('on');
      setTimeout(() => window.dispatchEvent(new Event('resize')), 40);
    });
  }

  function injectLateSurvivalTab() {
    if (document.querySelector('[data-tab="late-survival"]')) return;
    const tabs = document.querySelector('.tabs');
    const wrap = document.querySelector('.wrap');
    if (!tabs || !wrap) return;
    const btn = document.createElement('button');
    btn.dataset.tab = 'late-survival';
    btn.textContent = 'Late Survival';
    const historical = tabs.querySelector('[data-tab="historical"]');
    if (historical) tabs.insertBefore(btn, historical); else tabs.appendChild(btn);
    const section = document.createElement('section');
    section.id = 'late-survival';
    section.className = 'panel';
    section.innerHTML = `<div class="card" style="padding:0;overflow:hidden"><iframe src="late-survival.html" title="Late Survival Shadow V1" style="display:block;width:100%;height:2050px;border:0;background:transparent"></iframe></div>`;
    const system = document.getElementById('system');
    if (system) wrap.insertBefore(section, system); else wrap.appendChild(section);
    bindStandaloneTab(btn, section);
  }

  function removeOldNewShadowTab() {
    const btn = document.querySelector('[data-tab="new-shadow-backtest"]');
    if (btn) btn.remove();
    const panel = document.getElementById('new-shadow-backtest');
    if (panel) panel.remove();
  }

  function dashboardHistoricalIsReady() {
    const histEq = document.getElementById('histEquity');
    const histSummary = document.getElementById('histSummary');
    const systemNote = document.getElementById('systemNote');
    const hasPlot = !!histEq && Array.isArray(histEq.data) && histEq.data.length > 0;
    const hasSummary = !!histSummary && histSummary.innerHTML.trim().length > 0;
    const mainRenderFinished = !!systemNote && systemNote.textContent.trim().length > 0;
    return hasPlot && hasSummary && mainRenderFinished;
  }

  function upgradeHistoricalCenterWhenSafe() {
    if (historicalUpgraded) return true;
    const btn = document.querySelector('[data-tab="historical"]');
    const panel = document.getElementById('historical');
    if (!btn || !panel) return false;
    if (!dashboardHistoricalIsReady()) return false;

    historicalUpgraded = true;
    btn.textContent = '历史回测 · 8 Strategies';
    panel.dataset.eightStrategyCenter = '1';
    panel.innerHTML = `<div class="card" style="padding:0;overflow:hidden"><iframe src="historical-backtests.html" title="8 Strategies Historical Backtest Center" style="display:block;width:100%;height:2450px;border:0;background:transparent"></iframe></div>`;
    return true;
  }

  function installNonDestructiveParts() {
    removeOldNewShadowTab();
    injectLateSurvivalTab();
  }

  function startSafeUpgradePoll() {
    if (readinessPoll || historicalUpgraded) return;
    let tries = 0;
    readinessPoll = setInterval(() => {
      tries += 1;
      installNonDestructiveParts();
      if (upgradeHistoricalCenterWhenSafe() || tries >= 120) {
        clearInterval(readinessPoll);
        readinessPoll = null;
      }
    }, 250);
  }

  // Important: never replace #historical during DOMContentLoaded. The main dashboard
  // still renders Plotly into #histEquity asynchronously and would throw if that node
  // disappears early. Only swap after the dashboard has rendered its historical chart,
  // summary and system note successfully.
  installNonDestructiveParts();
  if (document.readyState === 'complete') startSafeUpgradePoll();
  else window.addEventListener('load', startSafeUpgradePoll, {once:true});
})();

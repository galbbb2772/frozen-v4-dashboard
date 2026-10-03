(() => {
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
    section.innerHTML = `<div class="card" style="padding:0;overflow:hidden"><iframe src="late-survival.html?v=20261003fix4" title="Late Survival Shadow V1" style="display:block;width:100%;height:2050px;border:0;background:transparent"></iframe></div>`;
    const system = document.getElementById('system');
    if (system) wrap.insertBefore(section, system); else wrap.appendChild(section);
    bindStandaloneTab(btn, section);
  }

  function wireHistoricalLink() {
    const btn = document.querySelector('[data-tab="historical"]');
    if (!btn || btn.dataset.historicalStandalone === '1') return;
    btn.dataset.historicalStandalone = '1';
    btn.textContent = '历史回测 · 8 Strategies';
    btn.addEventListener('click', ev => {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      window.location.href = 'historical-backtests.html?v=20261003fix4';
    }, true);
  }

  function removeOldNewShadowTab() {
    const btn = document.querySelector('[data-tab="new-shadow-backtest"]');
    if (btn) btn.remove();
    const panel = document.getElementById('new-shadow-backtest');
    if (panel) panel.remove();
  }

  function install() {
    // Never remove or replace #historical/#histEquity. The dashboard's own
    // async Plotly render must always retain its original DOM on every browser.
    removeOldNewShadowTab();
    injectLateSurvivalTab();
    wireHistoricalLink();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, {once:true});
  } else {
    install();
  }
  window.addEventListener('load', install, {once:true});
  setTimeout(install, 800);
})();

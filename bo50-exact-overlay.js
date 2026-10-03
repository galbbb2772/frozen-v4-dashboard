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
    section.innerHTML = `<div class="card" style="padding:0;overflow:hidden"><iframe src="late-survival.html" title="Late Survival Shadow V1" style="display:block;width:100%;height:2050px;border:0;background:transparent"></iframe></div>`;
    const system = document.getElementById('system');
    if (system) wrap.insertBefore(section, system); else wrap.appendChild(section);
    bindStandaloneTab(btn, section);
  }

  function upgradeHistoricalCenter() {
    const btn = document.querySelector('[data-tab="historical"]');
    const panel = document.getElementById('historical');
    if (!btn || !panel || panel.dataset.eightStrategyCenter === '1') return;
    btn.textContent = '历史回测 · 8 Strategies';
    panel.dataset.eightStrategyCenter = '1';
    panel.innerHTML = `<div class="card" style="padding:0;overflow:hidden"><iframe src="historical-backtests.html" title="8 Strategies Historical Backtest Center" style="display:block;width:100%;height:2450px;border:0;background:transparent"></iframe></div>`;
  }

  function removeOldNewShadowTab() {
    const btn = document.querySelector('[data-tab="new-shadow-backtest"]');
    if (btn) btn.remove();
    const panel = document.getElementById('new-shadow-backtest');
    if (panel) panel.remove();
  }

  function install() {
    removeOldNewShadowTab();
    injectLateSurvivalTab();
    upgradeHistoricalCenter();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(install, 0));
  else setTimeout(install, 0);
  setTimeout(install, 700);
  setTimeout(install, 1800);
})();

// 상단 메뉴의 "계산기" 펼침 메뉴 (명중·몬파·효율·N방컷). 바깥을 누르거나 Esc를 누르면 닫힌다.
(function () {
  document.querySelectorAll('.nav-menu').forEach(function (menu) {
    var btn = menu.querySelector('.nav-menu-btn'), pop = menu.querySelector('.nav-pop');
    if (!btn || !pop) return;
    function set(open) {
      pop.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
    }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      set(pop.hidden);
      if (!pop.hidden) { var first = pop.querySelector('a'); if (first && e.detail === 0) first.focus(); }
    });
    document.addEventListener('click', function (e) { if (!menu.contains(e.target)) set(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !pop.hidden) { set(false); btn.focus(); }
    });
    // 같은 페이지 안 링크(#calculator 등)를 누르면 메뉴를 닫는다
    pop.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
  });
})();

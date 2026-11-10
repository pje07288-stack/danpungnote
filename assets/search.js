// 통합 검색: 헤더의 검색 버튼(또는 / · Ctrl+K)으로 몬스터·맵·아이템·도구를 한 번에 찾는다.
// 검색 목록(assets/search-index.js)은 처음 열 때 한 번만 불러온다. 초성 검색(ㅁㄷㅇ → 망둥이)도 된다.
(function () {
  var me = document.currentScript;
  var base = me ? me.src.replace(/assets\/search\.js.*$/, '') : '';
  var ver = me && /[?&]v=([^&]+)/.test(me.src) ? RegExp.$1 : '';
  var openBtn = document.getElementById('searchOpen');
  if (!openBtn || !window.HTMLDialogElement) { if (openBtn) openBtn.hidden = true; return; }

  var GROUPS = [
    { type: 't', title: '도구·메뉴', more: '' },
    { type: 'm', title: '몬스터', more: 'mob/' },
    { type: 'p', title: '맵', more: 'map/' },
    { type: 'i', title: '아이템', more: 'item/' },
  ];
  var PER_GROUP = 6;
  var CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  var norm = function (s) { return String(s || '').replace(/\s+/g, '').toLowerCase(); };
  var cho = function (s) {
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      out += c >= 0xAC00 && c <= 0xD7A3 ? CHO[Math.floor((c - 0xAC00) / 588)] : s[i];
    }
    return out;
  };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  // ── 화면 ──
  var dlg = document.createElement('dialog');
  dlg.className = 'search-dialog';
  dlg.setAttribute('aria-label', '통합 검색');
  dlg.innerHTML =
    '<div class="search-box">' +
      '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
      '<input id="siteSearch" type="search" placeholder="몬스터·맵·아이템 검색 (예: 망둥이, ㅁㄷㅇ)" autocomplete="off" spellcheck="false" ' +
        'role="combobox" aria-expanded="true" aria-controls="siteSearchResults" aria-autocomplete="list">' +
      '<button type="button" class="search-close" aria-label="검색 닫기">Esc</button>' +
    '</div>' +
    '<div class="search-results" id="siteSearchResults" role="listbox" aria-label="검색 결과"></div>' +
    '<p class="search-foot"><span><kbd>↑</kbd><kbd>↓</kbd> 이동</span><span><kbd>Enter</kbd> 열기</span><span><kbd>Esc</kbd> 닫기</span></p>';
  document.body.appendChild(dlg);
  var input = dlg.querySelector('input');
  var box = dlg.querySelector('.search-results');

  // ── 검색 목록 불러오기 ──
  var rows = null, loading = false;
  function load(done) {
    if (rows) return done();
    if (loading) return;
    loading = true;
    box.innerHTML = '<p class="search-empty">검색 목록을 불러오는 중…</p>';
    var s = document.createElement('script');
    s.src = base + 'assets/search-index.js'; // 버전 없이: _headers의 no-cache로 매번 새로 확인
    s.onload = function () {
      rows = (window.DANPUNG_SEARCH || []).map(function (r) {
        var n = norm(r[2]);
        return { type: r[0], id: r[1], name: r[2], sub: r[3], img: r[4], n: n, c: cho(n), k: norm(r[5]) };
      });
      done();
    };
    s.onerror = function () { loading = false; box.innerHTML = '<p class="search-empty">검색 목록을 불러오지 못했어요. 새로고침해 주세요.</p>'; };
    document.head.appendChild(s);
  }

  // ── 점수: 같은 이름 > 앞부분 일치 > 포함 > 초성 > 추가 검색어 (낮을수록 위) ──
  var TYPE_RANK = { t: 0, m: 1, p: 2, i: 3 };
  function score(r, q, onlyCho) {
    if (onlyCho) {
      if (r.c.indexOf(q) === 0) return 1;
      var ci = r.c.indexOf(q);
      return ci > 0 ? 3 + ci / 100 : -1;
    }
    if (r.n === q) return 0;
    if (r.n.indexOf(q) === 0) return 1;
    var i = r.n.indexOf(q);
    if (i > 0) return 2 + i / 100;
    if (r.k && r.k.indexOf(q) >= 0) return 4;
    return -1;
  }
  function hrefOf(r) {
    if (r.type === 't') return base + r.id;
    return base + { m: 'mob/', p: 'map/', i: 'item/' }[r.type] + r.id;
  }
  function imgOf(r) {
    if (r.type === 't' || !r.img) return '';
    return base + { m: 'images/mob/icon/' + r.id + '.png', p: 'images/map/thumb/' + r.id + '.jpg', i: 'images/item/' + r.id + '.png' }[r.type];
  }

  var active = -1;
  function render() {
    var raw = input.value.trim(), q = norm(raw);
    active = -1;
    if (!q) {
      box.innerHTML = '<p class="search-empty">몬스터, 맵, 아이템 이름을 입력해요. 초성만 쳐도 돼요.<br>' +
        ['망둥이', '페리온', '일비', 'ㅈㅋㅁ'].map(function (w) { return '<button type="button" class="search-try">' + w + '</button>'; }).join('') + '</p>';
      return;
    }
    var onlyCho = /^[ㄱ-ㅎ]+$/.test(q);
    var hits = {};
    rows.forEach(function (r) {
      var s = score(r, q, onlyCho);
      if (s < 0) return;
      if (r.sub === '미출시') s += 0.9; // 미출시 아이템은 아래로
      (hits[r.type] = hits[r.type] || []).push({ r: r, s: s });
    });
    var html = '', total = 0, idx = 0;
    GROUPS.forEach(function (g) {
      var list = hits[g.type];
      if (!list) return;
      list.sort(function (a, b) { return a.s - b.s || a.r.name.length - b.r.name.length || a.r.name.localeCompare(b.r.name, 'ko'); });
      total += list.length;
      html += '<section class="search-group"><h3>' + g.title + ' <small>' + list.length + '</small></h3>';
      list.slice(0, PER_GROUP).forEach(function (h) {
        var r = h.r, img = imgOf(r);
        html += '<a class="search-hit is-' + r.type + '" role="option" id="sh' + (idx++) + '" href="' + esc(hrefOf(r)) + '">' +
          (img ? '<img src="' + esc(img) + '" alt="" loading="lazy">' : '<i aria-hidden="true"></i>') +
          '<span><strong>' + esc(r.name) + '</strong><small>' + esc(r.sub) + '</small></span></a>';
      });
      if (list.length > PER_GROUP && g.more && !onlyCho)
        html += '<a class="search-more" role="option" id="sh' + (idx++) + '" href="' + esc(base + g.more + '?q=' + encodeURIComponent(raw)) + '">' + g.title + ' ' + list.length + '개 모두 보기 →</a>';
      html += '</section>';
    });
    box.innerHTML = total ? html : '<p class="search-empty">"' + esc(raw) + '"에 맞는 결과가 없어요.</p>';
    if (total) move(0);
  }
  function options() { return [].slice.call(box.querySelectorAll('[role="option"]')); }
  function move(i) {
    var opts = options();
    if (!opts.length) return;
    active = (i + opts.length) % opts.length;
    opts.forEach(function (o, j) { o.setAttribute('aria-selected', String(j === active)); });
    input.setAttribute('aria-activedescendant', opts[active].id);
    opts[active].scrollIntoView({ block: 'nearest' });
  }

  function open() {
    if (!dlg.open) dlg.showModal();
    input.select();
    load(render);
  }
  openBtn.addEventListener('click', open);
  dlg.querySelector('.search-close').addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) {
    if (e.target === dlg) dlg.close(); // 바깥 어두운 곳 클릭
    var t = e.target.closest('.search-try');
    if (t) { input.value = t.textContent; render(); input.focus(); }
  });
  input.addEventListener('input', function () { if (rows) render(); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(active - 1); }
    else if (e.key === 'Enter') {
      var o = options()[active];
      if (o) { e.preventDefault(); location.href = o.href; dlg.close(); }
    }
  });
  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase();
    var typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
    if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); open(); }
    else if (e.key === '/' && !typing && !e.ctrlKey && !e.altKey && !e.metaKey) { e.preventDefault(); open(); }
  });

  // 목록 페이지에 ?q=로 오면 그 페이지 검색칸에 넣는다 ("모두 보기")
  var q = new URLSearchParams(location.search).get('q');
  if (q) ['dexSearch', 'itemSearch', 'mapSearch'].some(function (id) {
    var el = document.getElementById(id);
    if (!el) return false;
    el.value = q;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  });
})();

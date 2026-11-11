// 첫 화면 벤토 타일: 지금 잡기 좋은 몬스터, 오늘의 몬스터, 몬파 D-day, 검색.
// 데이터: assets/home-data.js (window.DANPUNG_HOME.hunt = [ID, 이름, 레벨, HP, 경험치, 회피, 그림])
(function () {
  var D = window.DANPUNG_HOME;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var num = function (n) { return Number(n).toLocaleString('ko-KR'); };
  var need = function (lv, ml, av) { return Math.ceil((51 + 2 * Math.max(0, ml - lv)) * av / 14); };
  var img = function (m) { return m[6] & 2 ? 'images/mob/icon/' + m[0] + '.png' : m[6] & 1 ? 'images/mob/stand/' + m[0] + '.gif' : 'images/mob-placeholder.svg'; };

  // 검색 타일: 상단 검색 창을 연다
  var sb = $('bentoSearch');
  if (sb) sb.addEventListener('click', function () { var b = $('searchOpen'); if (b) b.click(); });

  // 몬파 D-day (monpa.js의 MONPA_EVENT_END)
  var dd = $('bentoMonpaDay');
  if (dd && typeof MONPA_EVENT_END !== 'undefined') {
    var p = MONPA_EVENT_END.split('-').map(Number), end = Date.UTC(p[0], p[1] - 1, p[2]);
    var now = new Date(Date.now() + 9 * 3600e3), today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    var left = Math.round((end - today) / 864e5);
    dd.textContent = left < 0 ? '종료' : left === 0 ? 'D-DAY' : 'D-' + left;
    $('bentoMonpaNote').textContent = left < 0 ? '다음 이벤트 일정은 아직 몰라요' : p[1] + '월 ' + p[2] + '일까지 · 몬파 계산하기 →';
  }
  if (!D || !D.hunt || !D.hunt.length) return;
  var H = D.hunt;

  // 오늘의 몬스터: 한국 날짜로 하루 동안 같은 몬스터
  var t = $('todayMob');
  if (t) {
    var day = Math.floor((Date.now() + 9 * 3600e3) / 864e5);
    var m = H[(Math.imul(day, 2654435761) >>> 0) % H.length];
    t.href = 'mob/' + m[0];
    $('todayImg').src = m[6] & 1 ? 'images/mob/stand/' + m[0] + '.gif' : img(m);
    $('todayImg').alt = m[1];
    $('todayName').textContent = m[1];
    $('todayStats').innerHTML = '<span class="tag lv">Lv.' + m[2] + '</span><span class="tag">HP ' + num(m[3]) + '</span><span class="tag">경험치 ' + num(m[4]) + '</span>';
  }

  // 지금 잡기 좋은 몬스터: 내 레벨 −10 ~ +5, HP 100당 경험치 순 5마리. 레벨·명중은 도감과 같은 곳에 저장
  var lvIn = $('huntLevel'), accIn = $('huntAcc'), list = $('huntList'), KEY = 'maple_dex_state_v1';
  if (!lvIn || !list) return;
  var st = {};
  try { st = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) {}
  if (st.level) lvIn.value = st.level;
  if (st.acc) accIn.value = st.acc;
  function render() {
    var lv = parseInt(lvIn.value, 10), acc = parseFloat(accIn.value), hasAcc = acc >= 0;
    try { st.level = lvIn.value; st.acc = accIn.value; localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {}
    if (!(lv >= 1 && lv <= 200)) { list.innerHTML = '<li class="hunt-empty">내 레벨을 넣으면 경험치 효율 좋은 몬스터를 골라 드려요.</li>'; return; }
    var pick = H.filter(function (m) { return m[2] >= lv - 10 && m[2] <= lv + 5 && m[5] < 999; })
      .sort(function (a, b) { return b[4] / b[3] - a[4] / a[3]; }).slice(0, 5);
    if (!pick.length) { list.innerHTML = '<li class="hunt-empty">이 레벨대에 맞는 몬스터가 없어요.</li>'; return; }
    list.innerHTML = pick.map(function (m) {
      var n = need(lv, m[2], m[5]), ok = !hasAcc || acc >= n;
      return '<li><a href="mob/' + m[0] + '"><img src="' + img(m) + '" alt="" loading="lazy" width="36" height="36"><span class="hunt-name"><strong>' + esc(m[1]) + '</strong><small>Lv.' + m[2] + ' · HP ' + num(m[3]) + ' · 경험치 ' + num(m[4]) + '</small></span>' +
        '<b class="hunt-need' + (hasAcc ? (ok ? ' ok' : ' short') : '') + '">명중 ' + n + '</b></a></li>';
    }).join('');
  }
  lvIn.addEventListener('input', render);
  accIn.addEventListener('input', render);
  render();
})();

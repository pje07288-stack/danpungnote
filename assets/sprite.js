// 몬스터·아이템 그림 크기 맞추기. 원본보다 작은 칸에선 CSS(object-fit: scale-down)가 부드럽게 줄이고,
// 칸이 원본의 2배 이상이면 여기서 정확히 2·3배로 키워 픽셀이 번지지 않게 한다. (.target-stage 안의 그림만)
(function () {
  function fit(img) {
    if (!img.closest || !img.closest('.target-stage') || /\.svg(\?|$)/.test(img.currentSrc || img.src)) return;
    var nw = img.naturalWidth, nh = img.naturalHeight;
    if (!nw || !nh) return;
    img.style.width = img.style.height = img.style.imageRendering = img.style.objectFit = '';
    var cs = getComputedStyle(img);
    var k = Math.min(3, Math.floor(Math.min(parseFloat(cs.width) / nw, parseFloat(cs.height) / nh)));
    if (k >= 2) {
      img.style.width = nw * k + 'px';
      img.style.height = nh * k + 'px';
      img.style.objectFit = 'fill';
      img.style.imageRendering = 'pixelated';
    }
  }
  function fitAll() { document.querySelectorAll('.target-stage img').forEach(function (i) { if (i.complete) fit(i); }); }
  document.addEventListener('load', function (e) { if (e.target.tagName === 'IMG') fit(e.target); }, true);
  var t;
  addEventListener('resize', function () { clearTimeout(t); t = setTimeout(fitAll, 150); });
  fitAll();
})();

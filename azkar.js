// يعرض الأذكار ويحفظ تقدّمك اليوم في المتصفح (يبدأ من جديد كل يوم)
(function () {
  var page = document.body.dataset.page;
  var data = window.AZKAR || [];
  var nf = new Intl.NumberFormat('ar-EG');
  var d = new Date();
  var prefix = 'azkar:' + page + ':';
  var key = prefix + d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();

  var state = {};
  try {
    state = JSON.parse(localStorage.getItem(key)) || {};
    Object.keys(localStorage).forEach(function (k) {
      if (k.indexOf(prefix) === 0 && k !== key) localStorage.removeItem(k);
    });
  } catch (e) {}
  function save() { try { localStorage.setItem(key, JSON.stringify(state)); } catch (e) {} }

  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-label="تم"><path d="M20 6L9 17l-5-5"/></svg>';
  var RESET = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>';

  function rep(n) {
    if (n === 1) return 'مرة واحدة';
    if (n === 2) return 'مرتان';
    return nf.format(n) + (n <= 10 ? ' مرات' : ' مرة');
  }

  var list = document.getElementById('azkar-container');
  var countEl = document.getElementById('progress-text');
  var bar = document.getElementById('progress-bar');
  var complete = document.getElementById('complete');
  var cards = [];

  function remaining(i) { return state[i] === undefined ? data[i].count : state[i]; }

  function paint(i) {
    var c = cards[i], r = remaining(i);
    c.tap.innerHTML = r > 0 ? nf.format(r) : CHECK;
    c.tap.disabled = r === 0;
    c.tap.setAttribute('aria-label', r > 0 ? 'متبقي ' + rep(r) : 'تم');
    c.el.classList.toggle('done', r === 0);
  }

  function summary() {
    var done = data.filter(function (_, i) { return remaining(i) === 0; }).length;
    countEl.textContent = nf.format(done) + ' من ' + nf.format(data.length);
    bar.style.width = (data.length ? (done / data.length) * 100 : 0) + '%';
    var all = done === data.length && data.length > 0;
    complete.classList.toggle('show', all);
    if (all) AzkarStreak.record(page);
    var n = AzkarStreak.count(page), st = document.getElementById('streak');
    st.hidden = n < 1;
    if (n >= 1) st.textContent = 'سلسلة المواظبة على ' + document.querySelector('.bar h1').textContent + ': ' + AzkarStreak.label(n);
  }

  data.forEach(function (z, i) {
    var el = document.createElement('article');
    el.className = 'card';
    el.innerHTML =
      '<p class="zekr">' + z.text + '</p>' +
      (z.fadl ? '<p class="fadl">' + z.fadl + '</p>' : '') +
      '<div class="counter"><span class="rep">' + rep(z.count) + '</span>' +
      '<div class="controls"><button class="reset" type="button" aria-label="إعادة ضبط هذا الذكر">' + RESET + '</button>' +
      '<button class="tap" type="button"></button></div></div>';
    list.appendChild(el);
    var c = { el: el, tap: el.querySelector('.tap') };
    cards.push(c);
    c.tap.addEventListener('click', function () {
      state[i] = remaining(i) - 1;
      save(); paint(i); summary();
    });
    el.querySelector('.reset').addEventListener('click', function () {
      delete state[i];
      save(); paint(i); summary();
    });
    paint(i);
  });

  document.getElementById('reset-all').addEventListener('click', function () {
    state = {};
    save();
    data.forEach(function (_, i) { paint(i); });
    summary();
  });
  document.getElementById('print-btn').addEventListener('click', function () { window.print(); });
  summary();
})();

// تبديل الوضع الليلي (يعمل في كل الصفحات)
(function () {
  var btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.innerHTML =
    '<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>' +
    '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  btn.addEventListener('click', function () {
    var dark = document.documentElement.getAttribute('data-theme') !== 'dark';
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (e) {}
  });
})();

// سلسلة المواظبة: أيام متتالية أتممت فيها أذكار الصباح أو المساء (محفوظة في المتصفح فقط)
window.AzkarStreak = (function () {
  function ymd(d) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function read(p) { try { return JSON.parse(localStorage.getItem('azkar:streak:' + p)) || []; } catch (e) { return []; } }
  return {
    record: function (p) {
      var a = read(p), t = ymd(new Date());
      if (a.indexOf(t) === -1) { a.push(t); try { localStorage.setItem('azkar:streak:' + p, JSON.stringify(a.slice(-400))); } catch (e) {} }
    },
    count: function (p) {
      var set = {}; read(p).forEach(function (x) { set[x] = 1; });
      var d = new Date(), n = 0;
      if (!set[ymd(d)]) d.setDate(d.getDate() - 1);   // لو لسه ما خلصتش النهارده، السلسلة بتتحسب لحد امبارح
      while (set[ymd(d)]) { n++; d.setDate(d.getDate() - 1); }
      return n;
    },
    label: function (n) {
      var f = new Intl.NumberFormat('ar-EG');
      return n === 1 ? 'يوم واحد' : n === 2 ? 'يومان متتاليان' : n <= 10 ? f.format(n) + ' أيام متتالية' : f.format(n) + ' يومًا متتاليًا';
    }
  };
})();

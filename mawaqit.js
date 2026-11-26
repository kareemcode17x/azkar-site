(function () {
  var TZ = 'Africa/Cairo';
  var CITIES = [['القاهرة', 30.0444, 31.2357], ['الإسكندرية', 31.2001, 29.9187], ['الجيزة', 30.0131, 31.2089], ['المنصورة', 31.0409, 31.3785],
    ['طنطا', 30.7865, 31.0004], ['الزقازيق', 30.5877, 31.5020], ['بورسعيد', 31.2653, 32.3019], ['السويس', 29.9668, 32.5498],
    ['الإسماعيلية', 30.5965, 32.2715], ['دمنهور', 31.0341, 30.4682], ['كفر الشيخ', 31.1107, 30.9388], ['بني سويف', 29.0661, 31.0994],
    ['الفيوم', 29.3084, 30.8428], ['المنيا', 28.1099, 30.7503], ['أسيوط', 27.1783, 31.1859], ['سوهاج', 26.5591, 31.6948],
    ['قنا', 26.1551, 32.7160], ['الأقصر', 25.6872, 32.6396], ['أسوان', 24.0889, 32.8998], ['الغردقة', 27.2579, 33.8116],
    ['شرم الشيخ', 27.9158, 34.3300], ['مرسى مطروح', 31.3543, 27.2373], ['العريش', 31.1316, 33.8033]];
  var ROWS = [['Fajr', 'الفجر'], ['Sunrise', 'الشروق'], ['Dhuhr', 'الظهر'], ['Asr', 'العصر'], ['Maghrib', 'المغرب'], ['Isha', 'العشاء']];
  var $ = function (id) { return document.getElementById(id); };
  var AR = '٠١٢٣٤٥٦٧٨٩';
  function ar(s) { return String(s).replace(/\d/g, function (d) { return AR[d]; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  var city = parseInt(read('mw:city'), 10); if (!(city >= 0 && city < CITIES.length)) city = 0;
  var days = {};      // 'DD-MM-YYYY' -> { secs: {Fajr: ...}, hijri: '...' }
  var failed = false;

  var sel = $('city');
  CITIES.forEach(function (c, i) { var o = document.createElement('option'); o.value = i; o.textContent = c[0]; sel.appendChild(o); });
  sel.value = city;
  sel.addEventListener('change', function () { city = +sel.value; save('mw:city', city); days = {}; start(); });
  $('mw-retry').addEventListener('click', function () { start(); });

  // الوقت الحالي بتوقيت القاهرة (مش بتوقيت الجهاز)
  function now() {
    var p = {};
    new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      .formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    var t = new Date(Date.UTC(+p.year, +p.month - 1, +p.day + 1));
    return { today: p.day + '-' + p.month + '-' + p.year, secs: +p.hour * 3600 + +p.minute * 60 + +p.second,
             tomorrow: pad(t.getUTCDate()) + '-' + pad(t.getUTCMonth() + 1) + '-' + t.getUTCFullYear() };
  }
  function toSecs(s) { var m = /^(\d{1,2}):(\d{2})/.exec(s); return m ? +m[1] * 3600 + +m[2] * 60 : null; }
  function fmt(secs) { var h = Math.floor(secs / 3600) % 24, m = Math.floor(secs % 3600 / 60); return ar((h % 12 || 12) + ':' + pad(m)) + (h < 12 ? ' ص' : ' م'); }

  async function load(date) {
    if (days[date]) return days[date];
    var key = 'mw:' + city + ':' + date, cached = null;
    try { cached = JSON.parse(read(key)); } catch (e) {}
    if (!cached) {
      var c = CITIES[city];
      var r = await fetch('https://api.aladhan.com/v1/timings/' + date + '?latitude=' + c[1] + '&longitude=' + c[2] + '&method=5&timezonestring=' + TZ);
      if (!r.ok) throw new Error(r.status);
      var d = (await r.json()).data, secs = {};
      ROWS.forEach(function (x) { secs[x[0]] = toSecs(d.timings[x[0]]); });
      if (Object.keys(secs).some(function (k) { return secs[k] === null; })) throw new Error('bad times');
      var h = d.date && d.date.hijri;
      cached = { secs: secs, hijri: h ? h.weekday.ar + ' ' + ar(h.day) + ' ' + h.month.ar + ' ' + ar(h.year) + ' هـ' : '' };
      save(key, JSON.stringify(cached));
      // تنظيف الأيام القديمة
      try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf('mw:') === 0 && k !== 'mw:city' && k.indexOf(':' + date) === -1 && k.split(':')[2] !== now().tomorrow && k.split(':')[2] !== now().today) localStorage.removeItem(k); }); } catch (e) {}
    }
    days[date] = cached;
    return cached;
  }

  var timer = null;
  function paint(t, today, tomorrow) {
    var order = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'], next = null, target = 0;
    for (var i = 0; i < order.length; i++) if (today.secs[order[i]] > t.secs) { next = order[i]; target = today.secs[next]; break; }
    if (!next) { next = 'Fajr'; target = tomorrow.secs.Fajr + 86400; }
    var list = $('mw-list'); list.innerHTML = '';
    ROWS.forEach(function (x) {
      var li = document.createElement('li');
      li.className = 'mw-row' + (x[0] === next && target < 86400 ? ' next' : '') + (today.secs[x[0]] <= t.secs ? ' past' : '');
      li.innerHTML = '<span></span><span></span>';
      li.children[0].textContent = x[1]; li.children[1].textContent = fmt(today.secs[x[0]]);
      list.appendChild(li);
    });
    $('next-name').textContent = ROWS.filter(function (x) { return x[0] === next; })[0][1];
    $('next-time').textContent = 'الساعة ' + fmt(target % 86400);
    $('hijri').textContent = today.hijri;
    tick(target);
  }
  function tick(target) {
    clearInterval(timer);
    function upd() {
      var left = target - now().secs;
      if (left < -43200) left += 86400;    // عدّى منتصف الليل
      if (left <= 0) { clearInterval(timer); start(); return; }
      $('countdown').textContent = ar(pad(Math.floor(left / 3600)) + ':' + pad(Math.floor(left % 3600 / 60)) + ':' + pad(left % 60));
    }
    upd(); timer = setInterval(upd, 1000);
  }
  async function start() {
    clearInterval(timer);
    try {
      var t = now(), today = await load(t.today), tomorrow = await load(t.tomorrow);
      $('mw-error').hidden = true;
      paint(t, today, tomorrow);
    } catch (e) {
      $('mw-error').hidden = false;
      $('next-name').textContent = '--'; $('countdown').textContent = '--:--:--';
    }
  }
  start();
})();

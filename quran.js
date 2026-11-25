(function () {
  var DATA = "الفاتحة:7,البقرة:286,آل عمران:200,النساء:176,المائدة:120,الأنعام:165,الأعراف:206,الأنفال:75,التوبة:129,يونس:109,هود:123,يوسف:111,الرعد:43,إبراهيم:52,الحجر:99,النحل:128,الإسراء:111,الكهف:110,مريم:98,طه:135,الأنبياء:112,الحج:78,المؤمنون:118,النور:64,الفرقان:77,الشعراء:227,النمل:93,القصص:88,العنكبوت:69,الروم:60,لقمان:34,السجدة:30,الأحزاب:73,سبأ:54,فاطر:45,يس:83,الصافات:182,ص:88,الزمر:75,غافر:85,فصلت:54,الشورى:53,الزخرف:89,الدخان:59,الجاثية:37,الأحقاف:35,محمد:38,الفتح:29,الحجرات:18,ق:45,الذاريات:60,الطور:49,النجم:62,القمر:55,الرحمن:78,الواقعة:96,الحديد:29,المجادلة:22,الحشر:24,الممتحنة:13,الصف:14,الجمعة:11,المنافقون:11,التغابن:18,الطلاق:12,التحريم:12,الملك:30,القلم:52,الحاقة:52,المعارج:44,نوح:28,الجن:28,المزمل:20,المدثر:56,القيامة:40,الإنسان:31,المرسلات:50,النبأ:40,النازعات:46,عبس:42,التكوير:29,الانفطار:19,المطففين:36,الانشقاق:25,البروج:22,الطارق:17,الأعلى:19,الغاشية:26,الفجر:30,البلد:20,الشمس:15,الليل:21,الضحى:11,الشرح:8,التين:8,العلق:19,القدر:5,البينة:8,الزلزلة:8,العاديات:11,القارعة:11,التكاثر:8,العصر:3,الهمزة:9,الفيل:5,قريش:4,الماعون:7,الكوثر:3,الكافرون:6,النصر:3,المسد:5,الإخلاص:4,الفلق:5,الناس:6";
  var SURAHS = DATA.split(',').map(function (x, i) { var p = x.split(':'); return { n: i + 1, name: p[0], ayahs: +p[1] }; });
  var nf = new Intl.NumberFormat('ar-EG');
  var $ = function (id) { return document.getElementById(id); };
  var KEY_LAST = 'quran:last', KEY_FS = 'quran:fs', KEY_CACHE = 'quran:s:';
  function save(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function ayahLabel(c) { return nf.format(c) + (c <= 10 ? ' آيات' : ' آية'); }
  function norm(s) {
    return s.replace(/[\u064B-\u065F\u0670]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').trim();
  }
  function link(n) { return 'quran.html?s=' + n; }

  /* ---------- الفهرس ---------- */
  function showList() {
    $('view-list').hidden = false;
    var list = $('surah-list');

    var last = parseInt(read(KEY_LAST), 10);
    if (last >= 1 && last <= 114) {
      var r = $('resume');
      r.href = link(last);
      r.textContent = 'تابع القراءة: سورة ' + SURAHS[last - 1].name;
      r.hidden = false;
    }
    if (new Date().getDay() === 5) {   // الجمعة
      var p = $('pinned');
      p.href = link(18);
      p.hidden = false;
    }

    function render(filter) {
      var f = norm(filter || '');
      var frag = document.createDocumentFragment();
      var shown = 0;
      SURAHS.forEach(function (s) {
        if (f && norm(s.name).indexOf(f) === -1 && String(s.n) !== f) return;
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.className = 'surah';
        a.href = link(s.n);
        a.innerHTML = '<span class="num"></span><span class="s-name"></span><span class="s-meta"></span>';
        a.children[0].textContent = nf.format(s.n);
        a.children[1].textContent = s.name;
        a.children[2].textContent = ayahLabel(s.ayahs);
        li.appendChild(a);
        frag.appendChild(li);
        shown++;
      });
      list.innerHTML = '';
      list.appendChild(frag);
      $('empty').hidden = shown !== 0;
    }
    render('');
    $('search').addEventListener('input', function (e) { render(e.target.value); });
  }

  /* ---------- القراءة ---------- */
  function showReader(n) {
    var s = SURAHS[n - 1];
    $('view-reader').hidden = false;
    document.title = 'سورة ' + s.name + ' | القرآن الكريم';
    $('title').textContent = 'سورة ' + s.name;
    $('back').href = 'quran.html';
    $('back-label').textContent = 'الفهرس';
    if (n === 18) $('hadith').hidden = false;
    if (n === 1 || n === 9) $('basmala').hidden = true;   // الفاتحة آيتها الأولى هي البسملة، والتوبة بلا بسملة
    save(KEY_LAST, String(n));

    // حجم الخط
    var fs = parseFloat(read(KEY_FS)) || 1.85;
    function setFs(v) {
      fs = Math.min(3, Math.max(1.3, v));
      document.documentElement.style.setProperty('--q-size', fs + 'rem');
      save(KEY_FS, String(fs));
    }
    setFs(fs);
    $('fs-minus').addEventListener('click', function () { setFs(fs - 0.15); });
    $('fs-plus').addEventListener('click', function () { setFs(fs + 0.15); });

    // السابقة والتالية
    var prev = $('prev'), next = $('next');
    if (n > 1) { prev.href = link(n - 1); prev.textContent = '→ ' + SURAHS[n - 2].name; } else { prev.setAttribute('aria-disabled', 'true'); }
    if (n < 114) { next.href = link(n + 1); next.textContent = SURAHS[n].name + ' ←'; } else { next.setAttribute('aria-disabled', 'true'); }

    // التلاوة (مشاري العفاسي)
    var audio = $('quran-audio'), btn = $('play-audio-btn');
    audio.src = 'https://server8.mp3quran.net/afs/' + String(n).padStart(3, '0') + '.mp3';
    var PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg>';
    var PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>';
    function label() {
      btn.innerHTML = (audio.paused ? PLAY : PAUSE) + '<span>' + (audio.paused ? 'استمع للسورة بصوت مشاري العفاسي' : 'إيقاف مؤقت') + '</span>';
      btn.setAttribute('aria-pressed', String(!audio.paused));
    }
    btn.addEventListener('click', function () { if (audio.paused) { audio.play().catch(function () {}); } else { audio.pause(); } });
    ['play', 'pause', 'ended'].forEach(function (ev) { audio.addEventListener(ev, label); });
    label();

    // نص السورة
    var box = $('quran-container'), loader = $('loader');
    function render(texts) {
      var frag = document.createDocumentFragment();
      texts.forEach(function (t, i) {
        // بعض الإصدارات تضيف البسملة لأول آية، وهي معروضة أعلاه
        if (i === 0 && n !== 1 && n !== 9 && /^بِسْمِ/.test(t)) t = t.split(' ').slice(4).join(' ');
        frag.appendChild(document.createTextNode(t + ' '));
        var m = document.createElement('span');
        m.className = 'ayah-no';
        m.textContent = '\uFD3F' + nf.format(i + 1) + '\uFD3E';
        frag.appendChild(m);
        frag.appendChild(document.createTextNode(' '));
      });
      box.appendChild(frag);
    }
    function cacheSet(texts) {
      var v = JSON.stringify(texts);
      if (!save(KEY_CACHE + n, v)) {   // الذاكرة امتلأت: نمسح القديم ونحاول مرة
        try { Object.keys(localStorage).filter(function (k) { return k.indexOf(KEY_CACHE) === 0; }).forEach(function (k) { localStorage.removeItem(k); }); } catch (e) {}
        save(KEY_CACHE + n, v);
      }
    }
    function fail() {
      var e = document.createElement('div');
      e.className = 'error';
      e.innerHTML = '<p>تعذّر تحميل السورة. تأكد من اتصالك بالإنترنت ثم حاول مرة أخرى.</p><button class="tap" type="button">إعادة المحاولة</button>';
      e.querySelector('button').addEventListener('click', function () { e.remove(); loader.style.display = 'block'; load(); });
      box.appendChild(e);
    }
    async function load() {
      var texts = null;
      try { texts = JSON.parse(read(KEY_CACHE + n)); } catch (e) {}
      if (!texts) {
        try {
          var r = await fetch('https://api.alquran.cloud/v1/surah/' + n + '/quran-uthmani');
          if (!r.ok) throw new Error(r.status);
          var j = await r.json();
          texts = j.data.ayahs.map(function (a) { return a.text; });
          if (!texts.length) throw new Error('empty');
          cacheSet(texts);
        } catch (e) { loader.style.display = 'none'; fail(); return; }
      }
      loader.style.display = 'none';
      render(texts);
    }
    load();
  }

  var n = parseInt(new URLSearchParams(location.search).get('s'), 10);
  if (n >= 1 && n <= 114) showReader(n); else showList();
})();

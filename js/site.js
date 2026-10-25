// AGILE コーポレートサイトの動き。中身はJSなしでも全部読める（JSは「隠してから出す」演出だけを足す）
window.AGILE_READY = true;
// フォームを出す印（動きの印 .js とは別。site.js が遅れて届いても、届いた時点でフォームが出る）
document.documentElement.classList.add('jsok');
(function(){
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var reduce = !!(mq && mq.matches);
  function onMedia(q, fn){ var m = window.matchMedia(q); if(m.addEventListener) m.addEventListener('change', fn); else if(m.addListener) m.addListener(fn); return m; }

  // 画面に入ったら出す（いちばん先に用意する。ほかの処理が失敗しても中身は出る）
  var targets = document.querySelectorAll('[data-rv], .vals li');
  if(reduce || !('IntersectionObserver' in window)){
    targets.forEach(function(el){ el.classList.add('in'); });
  }else{
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
    }, {rootMargin:'0px 0px -10% 0px', threshold:0.06});
    targets.forEach(function(el){ io.observe(el); });
  }

  // ファーストビュー：書体の読み込みを待ってから（ページを開いてから最大0.8秒）ロゴと見出しを出す
  var fv = document.querySelector('.fv');
  function go(){ if(fv) fv.classList.add('go'); }
  if(reduce){ go(); }
  else{
    var started = false;
    function once(){ if(started) return; started = true; setTimeout(go, 30); }
    if(document.fonts && document.fonts.ready){ document.fonts.ready.then(once); }
    var now = (window.performance && performance.now) ? performance.now() : 0;
    setTimeout(once, Math.max(0, 800 - now));
  }

  // 進め方の線：見えたら左から引く
  var steps = document.querySelector('.steps');
  if(steps){
    if(reduce || !('IntersectionObserver' in window)){ steps.style.setProperty('--p', 1); }
    else{
      var so = new IntersectionObserver(function(en){ if(en[0].isIntersecting){ steps.style.setProperty('--p', 1); so.disconnect(); } }, {threshold:0.35});
      so.observe(steps);
    }
  }

  // 年表：読み進めた分だけ線が伸び、通り過ぎた印が灯る
  var tl = document.querySelector('.tl');
  var items = tl ? tl.querySelectorAll('li') : [];
  function timeline(){
    if(!tl) return;
    var r = tl.getBoundingClientRect();
    var vh = window.innerHeight;
    var p = reduce ? 1 : Math.max(0, Math.min(1, (vh * 0.62 - r.top) / r.height));
    tl.style.setProperty('--tp', p.toFixed(4));
    for(var i = 0; i < items.length; i++){
      var b = items[i].getBoundingClientRect();
      items[i].classList.toggle('lit', reduce || b.top + 14 < vh * 0.62);
    }
  }

  // 背景や図が、スクロールに少し遅れてついてくる（data-px＝動く割合）
  var pxEls = reduce ? [] : Array.prototype.slice.call(document.querySelectorAll('[data-px]'));
  function parallax(){
    var vh = window.innerHeight;
    for(var i = 0; i < pxEls.length; i++){
      var el = pxEls[i], r = el.getBoundingClientRect();
      if(r.bottom < -200 || r.top > vh + 200) continue;
      var d = (r.top + r.height / 2) - vh / 2;
      el.style.setProperty('--py', (d * parseFloat(el.getAttribute('data-px'))).toFixed(1) + 'px');
    }
  }

  // ファーストビュー：PCではマウスに淡い光がついてくる（なめらかに追いかける）
  var glowEl = document.querySelector('.fv-bg .glow');
  if(fv && glowEl && !reduce && window.matchMedia('(hover:hover) and (pointer:fine)').matches){
    var tx = 0, ty = 0, gx = 0, gy = 0, running = false;
    function follow(){
      gx += (tx - gx) * 0.08; gy += (ty - gy) * 0.08;
      glowEl.style.setProperty('--gx', (gx - 230).toFixed(1) + 'px');
      glowEl.style.setProperty('--gy', (gy - 230).toFixed(1) + 'px');
      if(Math.abs(tx - gx) > 0.5 || Math.abs(ty - gy) > 0.5){ requestAnimationFrame(follow); } else { running = false; }
    }
    fv.addEventListener('pointermove', function(e){
      var r = fv.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top;
      if(!fv.classList.contains('hov')){ gx = tx; gy = ty; fv.classList.add('hov'); }
      if(!running){ running = true; requestAnimationFrame(follow); }
    });
    fv.addEventListener('pointerleave', function(){ fv.classList.remove('hov'); });
  }

  // 雷の棒グラフ：見えたら「1.57倍」を数え上げる
  var xb = document.querySelector('.bars .x b');
  if(xb && (reduce || !('IntersectionObserver' in window))){ var bx = xb.closest('.bars'); if(bx) bx.classList.add('in'); }
  if(xb){
    var goal = parseFloat(xb.textContent);
    if(!reduce && 'IntersectionObserver' in window){
      var bars = xb.closest('.bars');
      var xo = new IntersectionObserver(function(en){
        if(!en[0].isIntersecting) return; xo.disconnect();
        if(bars) bars.classList.add('in');
        xb.textContent = '1.00';
        var t0 = null;
        function step(t){ if(!t0) t0 = t; var k = Math.min(1, (t - t0) / 1400); var e = 1 - Math.pow(1 - k, 3);
          xb.textContent = (1 + (goal - 1) * e).toFixed(2); if(k < 1) requestAnimationFrame(step); }
        setTimeout(function(){ requestAnimationFrame(step); }, 600);
      }, {threshold:0.5});
      xo.observe(bars || xb);
    }
  }

  // ヘッダー：少しでも下に送ったら白い帯にする（スクロールの処理は1コマに1回まで）
  var hd = document.querySelector('.hd');
  var ticking = false;
  function onScroll(){
    if(ticking) return; ticking = true;
    requestAnimationFrame(function(){
      ticking = false;
      var y = window.scrollY || window.pageYOffset;
      if(hd) hd.classList.toggle('solid', y > 24);
      timeline();
      parallax();
    });
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', onScroll);
  onScroll();

  // スマホのメニュー（開いている間は、裏のページにフォーカスが行かないようにする）
  var btn = document.querySelector('.menu-btn');
  var drawer = document.getElementById('drawer');
  var behind = document.querySelectorAll('main, footer, .skip');
  function setMenu(open){
    document.body.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.querySelector('.t').textContent = open ? 'とじる' : 'メニュー';
    drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    behind.forEach(function(el){ if(open) el.setAttribute('inert', ''); else el.removeAttribute('inert'); });
    if(open){ drawer.removeAttribute('inert'); var f = drawer.querySelector('a'); if(f) f.focus(); }
    else{ drawer.setAttribute('inert', ''); }
  }
  if(btn && drawer){
    btn.addEventListener('click', function(){ setMenu(!document.body.classList.contains('menu-open')); });
    drawer.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ setMenu(false); }); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && document.body.classList.contains('menu-open')){ setMenu(false); btn.focus(); } });
    onMedia('(min-width:1080px)', function(m){ if(m.matches) setMenu(false); });
  }
})();

// お問い合わせ（Google Apps Script で agileos.info@gmail.com に通知し、送った人にも控えを返す）
(function(){
  var ENDPOINT = "https://script.google.com/macros/s/AKfycbxZGjRChv0uIR0_iB8SRolDW8Qfm8ubuTdiaPHlpvmyh6PVFpTEQoQYZMhy-BaLU4fSJg/exec";
  var form = document.getElementById('contact-form');
  if(!form) return;
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var sending = false;
  function picked(name){ return Array.prototype.slice.call(form.querySelectorAll('input[name="' + name + '"]:checked')).map(function(i){ return i.value; }); }
  var bar = form.querySelector('.prog .pbar i'), num = form.querySelector('.prog .pnum b');
  function progress(){
    var e = form.elements;
    var n = (picked('kind').length ? 1 : 0) + (picked('when').length ? 1 : 0) + (picked('how').length ? 1 : 0) + (e['name'].value.trim() ? 1 : 0) + (e['email'].validity.valid && e['email'].value ? 1 : 0);
    if(bar) bar.style.setProperty('--pp', n / 5);
    if(num) num.textContent = n;
    if(n) document.getElementById('cf-need').style.display = 'none';
  }
  form.addEventListener('change', progress);
  form.addEventListener('input', progress);
  form.addEventListener('submit', function(ev){
    ev.preventDefault();
    if(sending) return;
    var el = form.elements;
    var kinds = picked('kind'), when = picked('when'), how = picked('how');
    var need = document.getElementById('cf-need');
    if(!kinds.length && !el['message'].value.trim()){ need.style.display = 'block'; var q1 = document.getElementById('q1'); q1.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block:'center'}); var f1 = q1.querySelector('input'); if(f1) f1.focus({preventScroll:true}); return; }
    need.style.display = 'none';
    if(!form.reportValidity()) return;
    var head = [];
    if(kinds.length) head.push('【ご相談】' + kinds.join('・'));
    if(when.length) head.push('【時期】' + when[0]);
    if(how.length) head.push('【お話の方法】' + how[0]);
    var body = el['message'].value.trim();
    var msg = head.join('\n') + (head.length && body ? '\n\n' : '') + body;
    var payload = JSON.stringify({
      name: el['name'].value,
      company: el['company'].value,
      email: el['email'].value,
      message: msg,
      website: el['website'].value
    });
    var btn = form.querySelector('button');
    var label = btn.querySelector('.t');
    var err = document.getElementById('cf-error');
    sending = true; btn.disabled = true; label.textContent = '送信しています…'; err.style.display = 'none';
    function done(){
      form.style.display = 'none';
      var d = document.getElementById('cf-done');
      d.style.display = 'block';
      d.setAttribute('tabindex', '-1'); d.focus();
    }
    function fail(){
      sending = false; btn.disabled = false; label.textContent = '内容を送る';
      err.style.display = 'block';
    }
    // 送り先はブラウザから返事が読める（CORS可）。返事が読めないときに送り直すと二重に届くので、送り直さずにメールの案内を出す
    fetch(ENDPOINT, { method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body: payload })
      .then(function(r){ return r.json(); })
      .then(function(res){ res && res.ok ? done() : fail(); })
      .catch(fail);
  });
})();

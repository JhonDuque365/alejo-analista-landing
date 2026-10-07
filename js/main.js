(function () {
  'use strict';
  var OWNER = 'JhonDuque365', REPO = 'alejo-analista-landing';
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var modal = document.getElementById('lightbox'), large = document.getElementById('lb-img'), close = document.getElementById('lb-close');
  var lastFocus = null, oldOverflow = '';
  var style = document.createElement('style');
  style.textContent = 'body,button,input,.nav-name,.brand,.brand-sub,.headline,.title,.cta h2,.card h3{font-family:Inter,system-ui,sans-serif!important}.title,.cta h2{font-size:var(--text-title,clamp(2rem,4vw,3rem));font-weight:700;font-style:normal;line-height:1.2}.lead,.results-copy,.card p,.about p,.steps li,.cta p{font-size:1rem;line-height:1.7}.roulette-track .result-card{transition:none!important;will-change:transform;pointer-events:auto}.roulette-track .result-card.is-active{z-index:auto!important}.roulette-track .result-card img{pointer-events:none}.roulette-stage{touch-action:pan-y}.brand-sub{letter-spacing:.12em}.brand-sub span{width:clamp(12px,4vw,60px)}@media(max-width:640px){.brand{font-size:clamp(2.8rem,13vw,4.5rem)}.logo-frame-hero{width:60px;height:60px;flex-shrink:0}}';
  document.head.appendChild(style);

  async function list(dir) {
    var r = await fetch('https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents/' + dir + '?ref=main');
    if (!r.ok) throw new Error('No se pudo cargar ' + dir);
    var items = await r.json();
    if (!Array.isArray(items)) throw new Error('Respuesta inesperada');
    return items.filter(function(f){return f.type === 'file' && /\.(png|jpe?g|webp|svg|gif|avif)$/i.test(f.name);});
  }
  list('assets/logo').then(function(files){
    files.sort(function(a,b){return a.name.localeCompare(b.name);});
    if (!files.length) return;
    ['logo-nav','logo-hero','logo-hero-inline'].forEach(function(id){
      var img = document.getElementById(id);
      if (!img) return;
      var frame = img.closest('.logo-frame');
      img.hidden = true;
      img.onload = function(){img.hidden=false;if(frame)frame.classList.add('has-logo');};
      img.onerror = function(){img.hidden=true;img.removeAttribute('src');if(frame)frame.classList.remove('has-logo');};
      img.src = files[0].download_url || files[0].path;
    });
  }).catch(function(){});

  function shut(){
    if (!modal || modal.hidden) return;
    modal.hidden=true;large.removeAttribute('src');document.body.style.overflow=oldOverflow;
    if(lastFocus && lastFocus.isConnected)lastFocus.focus({preventScroll:true});
  }
  function open(src,alt){
    if(!modal || !large)return;
    lastFocus=document.activeElement;oldOverflow=document.body.style.overflow;
    large.src=src;large.alt=alt;modal.hidden=false;document.body.style.overflow='hidden';close.focus();
  }
  if(close)close.addEventListener('click',shut);
  if(modal)modal.addEventListener('click',function(e){if(e.target===modal)shut();});
  document.addEventListener('keydown',function(e){
    if(modal && !modal.hidden){
      if(e.key==='Escape')shut();
      if(e.key==='Tab'){e.preventDefault();close.focus();}
    }
  });
  var menu=document.getElementById('mobile-menu'), toggle=document.querySelector('.menu-toggle');
  function menuOpen(on){menu.hidden=!on;toggle.setAttribute('aria-expanded',String(on));toggle.setAttribute('aria-label',on?'Cerrar menú':'Abrir menú');}
  if(menu && toggle){
    toggle.addEventListener('click',function(){menuOpen(menu.hidden);});
    menu.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){menuOpen(false);});});
  }
  var year=document.getElementById('year');if(year)year.textContent=new Date().getFullYear();
  if('IntersectionObserver' in window){
    var observer=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-visible');observer.unobserve(e.target);}});},{threshold:.12});
    document.querySelectorAll('.reveal').forEach(function(el){observer.observe(el);});
  }else{document.querySelectorAll('.reveal').forEach(function(el){el.classList.add('is-visible');});}

  var stage=document.getElementById('roulette-stage') || document.querySelector('.roulette-stage');
  var track=document.getElementById('roulette-track'), empty=document.getElementById('picks-empty'), hint=document.querySelector('.roulette-hint');
  function noResults(){if(stage)stage.hidden=true;if(empty)empty.hidden=false;if(hint)hint.hidden=true;}
  async function results(){
    if(!track || !stage)return;
    var files=await list('assets/picks');
    files.sort(function(a,b){return b.name.localeCompare(a.name,undefined,{numeric:true});});
    var loaded=await Promise.all(files.map(function(file){return new Promise(function(resolve){
      var img=new Image();img.alt='Resultado '+file.name;img.decoding='async';
      img.onload=function(){resolve(img);};img.onerror=function(){resolve(null);};
      img.src=file.download_url || file.path;
    });}));
    var images=loaded.filter(Boolean);if(!images.length){noResults();return;}
    stage.hidden=false;if(empty)empty.hidden=true;if(hint)hint.hidden=false;track.replaceChildren();
    track.setAttribute('aria-live','off');
    var angle=0, step=2*Math.PI/images.length, hovered=false, touching=false, resumeAt=0, last=0, nearest=0, dragged=false;
    var startX=0,startY=0;
    var cards=images.map(function(img,i){
      var card=document.createElement('button');card.type='button';card.className='result-card';card.appendChild(img);track.appendChild(card);
      card.addEventListener('click',function(){
        if(dragged)return;
        if(i===nearest)open(img.src,img.alt);
        else{angle=-i*step;resumeAt=performance.now()+2500;draw();}
      });return card;
    });
    function draw(){
      var radius=Math.min(330,stage.clientWidth*.33), depth=140, best=-Infinity;
      var values=cards.map(function(card,i){var a=angle+i*step,c=Math.cos(a),s=Math.sin(a);if(c>best){best=c;nearest=i;}return {c:c,s:s};});
      cards.forEach(function(card,i){
        var c=values[i].c,s=values[i].s,front=(c+1)/2;
        card.style.transform='translate(-50%,-50%) translateX('+(images.length===1?0:s*radius)+'px) translateZ('+(images.length===1?80:c*depth)+'px) rotateY('+(-s*48)+'deg) scale('+(.76+.24*front)+')';
        card.style.opacity=String(.22+.78*front);card.style.filter='brightness('+(.46+.54*front)+')';card.style.zIndex=String(Math.round(100+100*c));
        card.classList.toggle('is-active',i===nearest);card.tabIndex=c<0?-1:0;card.style.pointerEvents=c<0?'none':'auto';
        card.setAttribute('aria-hidden',String(c<0));card.setAttribute('aria-label',(i===nearest?'Ampliar':'Centrar')+' resultado '+(i+1));
      });
    }
    stage.addEventListener('pointerenter',function(e){if(e.pointerType==='mouse')hovered=true;});
    stage.addEventListener('pointerleave',function(e){if(e.pointerType==='mouse')hovered=false;});
    stage.addEventListener('pointerdown',function(e){
      if(e.pointerType==='mouse')return;touching=true;dragged=false;startX=e.clientX;startY=e.clientY;
    });
    stage.addEventListener('pointermove',function(e){if(touching && (Math.abs(e.clientX-startX)>12 || Math.abs(e.clientY-startY)>12))dragged=true;});
    function release(e){if(e.pointerType==='mouse' || !touching)return;touching=false;resumeAt=performance.now()+2500;setTimeout(function(){dragged=false;},300);}
    window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);
    window.addEventListener('resize',draw);
    track.addEventListener('keydown',function(e){
      if(e.key==='ArrowRight' || e.key==='ArrowLeft'){e.preventDefault();angle+=(e.key==='ArrowRight'?step:-step);resumeAt=performance.now()+3000;draw();cards[nearest].focus();}
    });
    function frame(now){
      var dt=last?Math.min((now-last)/1000,.05):0;last=now;
      var focused=stage.querySelector(':focus-visible');
      if(images.length>1 && !motion.matches && !hovered && !touching && !focused && now>=resumeAt && !document.hidden && (!modal || modal.hidden)){
        angle=(angle+dt*.24)%(2*Math.PI);draw();
      }
      requestAnimationFrame(frame);
    }
    motion.addEventListener('change',draw);draw();requestAnimationFrame(frame);
  }
  results().catch(noResults);
  document.querySelectorAll('[data-cta]').forEach(function(link){link.addEventListener('click',function(){
    var location=link.getAttribute('data-cta');
    if(typeof window.gtag==='function')window.gtag('event','telegram_click',{cta_location:location});
    else if(window.dataLayer && window.dataLayer.push)window.dataLayer.push({event:'telegram_click',cta_location:location});
  });});
})();

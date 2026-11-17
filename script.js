(() => {
  'use strict';
  document.querySelector('#year').textContent = new Date().getFullYear();
  const tabs = [...document.querySelectorAll('[role=tab]')];
  function selectTab(tab) {
    tabs.forEach(t => {
      const selected = t === tab;
      t.setAttribute('aria-selected', String(selected));
      t.tabIndex = selected ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !selected;
    });
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', e => {
      let index;
      if (['ArrowDown','ArrowRight'].includes(e.key)) index = (i + 1) % tabs.length;
      if (['ArrowUp','ArrowLeft'].includes(e.key)) index = (i - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') index = 0;
      if (e.key === 'End') index = tabs.length - 1;
      if (index !== undefined) { e.preventDefault(); selectTab(tabs[index]); tabs[index].focus(); }
    });
  });
  const narrow = matchMedia('(max-width:480px)');
  function orientation() { document.querySelector('[role=tablist]').setAttribute('aria-orientation', narrow.matches ? 'horizontal' : 'vertical'); }
  narrow.addEventListener('change', orientation); orientation();
  const canvas = document.querySelector('#particle-field');
  const ctx = canvas.getContext('2d');
  const pause = document.querySelector('#pause-drift');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!ctx) { pause.hidden = true; return; }
  let w, h, points = [], target = 0, progress = 0, time = 0, last = 0, raf = 0, paused = reduced.matches;
  let seed = 85;
  const clamp = n => Math.max(0, Math.min(1, n));
  const smooth = n => n * n * (3 - 2 * n);
  function random() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
  function requestDraw() { if (!raf && !document.hidden) raf = requestAnimationFrame(draw); }
  function resize() {
    w = innerWidth; h = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(w*dpr); canvas.height = Math.round(h*dpr); ctx.setTransform(dpr,0,0,dpr,0,0);
    seed = 85;
    points = Array.from({length:w<650?850:1600},()=>({a:random()*Math.PI*2,r:Math.sqrt(random()),z:random()*2-1,size:.35+random()*.9,seed:random()}));
    requestDraw();
  }
  function draw(now) {
    raf=0;const dt=last?Math.min((now-last)/1000,.06):.016;last=now;
    if(!paused&&!reduced.matches)time+=dt;
    progress=reduced.matches?target:progress+(target-progress)*(1-Math.exp(-dt*12));
    if(Math.abs(progress-target)<.00005)progress=target;
    const fade=smooth(progress),opacity=1-fade*.89,radius=Math.min(w*.46,h*.49),spread=1+fade*.65;
    ctx.clearRect(0,0,w,h);ctx.globalAlpha=opacity;
    for(const p of points){
      const a=p.a+time*.018*(.3+p.r*.2),r=radius*(.48+p.r*.55),depth=(Math.sin(a)+1)/2;
      const x=w*.73+Math.cos(a)*r*spread+Math.cos(p.a*5)*fade*radius*.12;
      const y=h*.46+(Math.sin(a)*r*.85+p.z*radius*.12)*spread-fade*h*.18;
      const alpha=(.06+depth*.23)*(1-p.r*.2),size=p.size*(.6+depth*.5);
      ctx.fillStyle=`rgba(196,165,245,${alpha})`;ctx.fillRect(x,y,size,size);
    }
    ctx.globalAlpha=1;
    if((!paused&&!reduced.matches)||progress!==target)requestDraw();
  }
  const update=p=>{target=clamp(p);requestDraw();};
  if(window.Motion)Motion.scroll(update,{target:document.querySelector('.intro'),offset:['start start','end start']});
  else {const onScroll=()=>update(scrollY/Math.max(1,document.querySelector('.intro').offsetHeight));addEventListener('scroll',onScroll,{passive:true});onScroll();}
  function syncPause(){pause.textContent=paused?'Resume background':'Pause background';pause.setAttribute('aria-pressed',String(paused));}
  pause.addEventListener('click',()=>{paused=!paused;syncPause();last=0;requestDraw();});
  reduced.addEventListener('change',()=>{paused=reduced.matches;syncPause();requestDraw();});
  document.addEventListener('visibilitychange',()=>{last=0;requestDraw();});
  addEventListener('resize',resize);syncPause();resize();
})();

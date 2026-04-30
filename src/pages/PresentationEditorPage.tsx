// src/pages/PresentationEditorPage.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import './PresentationEditorPage.css';

/* ---------- типы ---------- */
type SlideData = { id: string; html: string };

type Layer = {
  id: string; name: string; type: 'circle' | 'icon' | 'image';
  color: string; iconName?: string;
  minSize: number; maxSize: number; opacity: number;
  anim: string; rot: number; count: number;
  items: LayerItem[]; collapsed?: boolean;
};

type LayerItem = {
  x: number; y: number; size: number;
  rot: number; rotV: number; vx: number; vy: number;
};

/* ---------- иконки ---------- */
const ICON_LIST = [
  'fa-heart','fa-star','fa-cloud','fa-bolt','fa-music','fa-search',
  'fa-envelope','fa-camera','fa-moon','fa-sun','fa-smile','fa-thumbs-up',
  'fa-comment','fa-share','fa-cog','fa-home','fa-paper-plane','fa-fire',
  'fa-bell','fa-calendar','fa-play','fa-pause','fa-stop','fa-globe',
  'fa-leaf','fa-certificate','fa-tag','fa-map-pin','fa-rocket','fa-crown',
  'fa-gem','fa-trophy','fa-gift','fa-tree','fa-paw','fa-bug','fa-fish',
  'fa-kiwi-bird','fa-spider','fa-apple-whole','fa-carrot','fa-lemon',
  'fa-seedling','fa-umbrella','fa-bicycle','fa-bus','fa-car','fa-plane','fa-robot'
];

const ICON_UNICODE: Record<string, number> = {
  'fa-heart':0xf004, 'fa-star':0xf005, 'fa-cloud':0xf0c2, 'fa-bolt':0xf0e7, 'fa-music':0xf001,
  'fa-search':0xf002, 'fa-envelope':0xf0e0, 'fa-camera':0xf030, 'fa-moon':0xf186, 'fa-sun':0xf185,
  'fa-smile':0xf118, 'fa-thumbs-up':0xf164, 'fa-comment':0xf075, 'fa-share':0xf064, 'fa-cog':0xf013,
  'fa-home':0xf015, 'fa-paper-plane':0xf1d8, 'fa-fire':0xf06d, 'fa-bell':0xf0f3, 'fa-calendar':0xf133,
  'fa-play':0xf04b, 'fa-pause':0xf04c, 'fa-stop':0xf04d, 'fa-globe':0xf0ac, 'fa-leaf':0xf06c,
  'fa-certificate':0xf0a3, 'fa-tag':0xf02b, 'fa-map-pin':0xf276, 'fa-rocket':0xf135, 'fa-crown':0xf521,
  'fa-gem':0xf3a5, 'fa-trophy':0xf091, 'fa-gift':0xf06b, 'fa-tree':0xf1bb, 'fa-paw':0xf1b0,
  'fa-bug':0xf188, 'fa-fish':0xf578, 'fa-kiwi-bird':0xf535, 'fa-spider':0xf717, 'fa-apple-whole':0xf5d1,
  'fa-carrot':0xf787, 'fa-lemon':0xf094, 'fa-seedling':0xf4d8, 'fa-umbrella':0xf0e9, 'fa-bicycle':0xf206,
  'fa-bus':0xf207, 'fa-car':0xf1b9, 'fa-plane':0xf072, 'fa-robot':0xf544
};

/* ---------- начальные данные ---------- */
const DEFAULT_SLIDES: SlideData[] = [
  { id: 's1', html: '<h1 style="text-align:center">Добро пожаловать!</h1><p style="text-align:center">Это редактор презентаций Sputnik Studio.</p>' },
  { id: 's2', html: '<h2 style="text-align:center">Второй слайд</h2><p style="text-align:center">Дважды кликните, чтобы редактировать.</p>' }
];

const DEFAULT_LAYERS: Layer[] = [
  { id: 'l1', name:'Круги', type:'circle', color:'#5b8c42', minSize:30, maxSize:60, opacity:0.6, anim:'fallDown', rot:0.4, count:10, items:[], collapsed:false },
  { id: 'l2', name:'Сердечки', type:'icon', color:'#e63950', iconName:'fa-heart', minSize:40, maxSize:70, opacity:0.7, anim:'fallDown', rot:0.3, count:8, items:[], collapsed:false }
];

const PresentationEditorPage: React.FC = () => {
  /* ---- динамическая загрузка Font Awesome 6.4.2 (Solid, 900) ---- */
  useEffect(() => {
    const existingLink = document.querySelector('link[href*="font-awesome@6.4.2"]');
    if (!existingLink) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css';
      document.head.appendChild(link);
    }
  }, []);

  /* состояние */
  const [slides, setSlides] = useState<SlideData[]>(DEFAULT_SLIDES);
  const [current, setCurrent] = useState(0);
  const [layers, setLayers] = useState<Layer[]>(DEFAULT_LAYERS);
  const [speed, setSpeed] = useState(0.8);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  /* фон */
  const [bgType, setBgType] = useState<'solid' | 'gradient'>('solid');
  const [solidColor, setSolidColor] = useState('#ffffff');
  const [angle, setAngle] = useState(45);
  const [gColors, setGColors] = useState(['#ffaa00','#dd2a7b','#8134af']);
  const [blur, setBlur] = useState(0);

  /* карточка */
  const [card, setCard] = useState({
    bg: '#ffffff', width: '100%', shape: 'rounded', radius: 28,
    borderW: 2, borderColor: '#000000', font: "'Segoe UI',sans-serif", textColor: '#333333'
  });

  const initItems = useCallback(() => {
    const w = window.innerWidth, h = window.innerHeight;
    setLayers(prev => prev.map(l => ({
      ...l,
      items: Array.from({length:l.count}, () => ({
        x:Math.random()*w, y:Math.random()*h,
        size:l.minSize+Math.random()*(l.maxSize-l.minSize),
        rot:Math.random()*360,
        rotV:l.rot*(Math.random()-0.5)*2,
        vx:(Math.random()-0.5)*1.5, vy:(Math.random()-0.5)*1.5
      }))
    })));
  }, []);

  useEffect(() => { initItems(); }, [initItems]);

  /* анимация */
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const resize = () => {
      canvas.width = canvas.parentElement!.clientWidth;
      canvas.height = canvas.parentElement!.clientHeight;
    };
    resize(); window.addEventListener('resize', resize);
    const draw = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      if (bgType==='solid') ctx.fillStyle = solidColor;
      else {
        const cols = gColors.filter(c=>c);
        const rad = (angle*Math.PI)/180;
        const dx = Math.cos(rad)*canvas.width, dy = Math.sin(rad)*canvas.width;
        const grad = ctx.createLinearGradient(canvas.width/2-dx/2, canvas.height/2-dy/2, canvas.width/2+dx/2, canvas.height/2+dy/2);
        if (cols.length===1) ctx.fillStyle = cols[0];
        else { cols.forEach((c,i)=> grad.addColorStop(i/(cols.length-1),c)); ctx.fillStyle = grad; }
      }
      ctx.fillRect(0,0,canvas.width,canvas.height);
      canvas.style.filter = `blur(${blur}px)`;

      layers.forEach(l => l.items.forEach(it => {
        if (l.anim==='fallDown') it.y += speed*0.8;
        else if (l.anim==='fallUp') it.y -= speed*0.8;
        else if (l.anim==='fallLeft') it.x -= speed*0.8;
        else if (l.anim==='fallRight') it.x += speed*0.8;
        else if (l.anim==='diagonalTL') { it.y-=speed*0.6; it.x-=speed*0.6; }
        else if (l.anim==='diagonalTR') { it.y-=speed*0.6; it.x+=speed*0.6; }
        else if (l.anim==='float') {
          it.x += it.vx*speed*0.3; it.y += it.vy*speed*0.3;
          if (it.x<0||it.x>canvas.width) it.vx*=-1;
          if (it.y<0||it.y>canvas.height) it.vy*=-1;
        } else if (l.anim==='zigzag') {
          it.y += speed*0.6; it.x += Math.sin(it.y*0.02+Date.now()*0.005)*speed;
        } else if (l.anim==='chaotic') {
          it.x += it.vx*speed*0.4; it.y += it.vy*speed*0.4;
          if (it.x<0||it.x>canvas.width) it.vx*=-1;
          if (it.y<0||it.y>canvas.height) it.vy*=-1;
        }
        it.rot += it.rotV*speed;
        if (it.y>canvas.height+it.size) it.y=-it.size;
        if (it.y<-it.size) it.y=canvas.height+it.size;
        if (it.x>canvas.width+it.size) it.x=-it.size;
        if (it.x<-it.size) it.x=canvas.width+it.size;

        ctx.save(); ctx.translate(it.x,it.y); ctx.rotate(it.rot*Math.PI/180);
        ctx.globalAlpha = l.opacity;

        if (l.type==='circle') {
          ctx.beginPath(); ctx.arc(0,0,it.size/2,0,Math.PI*2);
          ctx.fillStyle = l.color; ctx.fill();
        } else if (l.type==='icon') {
          const code = ICON_UNICODE[l.iconName||l.color] || 0xf004;
          ctx.font = `900 ${it.size}px "Font Awesome 6 Free"`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillStyle = l.color;
          ctx.fillText(String.fromCharCode(code),0,0);
        } else if (l.type==='image' && l.color.startsWith('data:')) {
          if (!imageCache.current.has(l.color)) {
            const img = new Image(); img.src = l.color;
            imageCache.current.set(l.color, img);
          }
          const img = imageCache.current.get(l.color)!;
          if (img.complete) ctx.drawImage(img, -it.size/2, -it.size/2, it.size, it.size);
        }
        ctx.restore();
      }));
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize',resize); };
  }, [layers, speed, bgType, solidColor, angle, gColors, blur]);

  /* скролл */
  useEffect(() => {
    const vp = viewportRef.current; if (!vp) return;
    const onScroll = () => {
      const idx = Math.round(vp.scrollTop / vp.clientHeight);
      if (idx !== current && idx >=0 && idx<slides.length) setCurrent(idx);
    };
    vp.addEventListener('scroll', onScroll, {passive:true});
    return () => vp.removeEventListener('scroll', onScroll);
  }, [current, slides.length]);

  const goTo = (i: number) => viewportRef.current?.scrollTo({top: i*window.innerHeight, behavior:'smooth'});

  const bgClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.slide-card') || (e.target as HTMLElement).closest('.formatting-toolbar')) return;
    if (activeId) {
      const el = cardRefs.current.get(activeId);
      if (el) setSlides(prev => prev.map(s => s.id===activeId?{...s, html:el.innerHTML}:s));
      setActiveId(null);
    }
  };

  const addSlide = () => setSlides(prev => [...prev, {id:Date.now().toString(), html:'<h2 style="text-align:center">Новый слайд</h2><p style="text-align:center">Описание</p>'}]);
  const removeSlide = () => {
    if (slides.length<=1) return;
    setSlides(prev => prev.filter((_,i)=>i!==current));
    if (current>=slides.length-1) setCurrent(slides.length-2);
  };

  const dblClick = (id: string) => {
    if (activeId && activeId!==id) {
      const prev = cardRefs.current.get(activeId);
      if (prev) setSlides(prevS => prevS.map(s => s.id===activeId?{...s, html:prev.innerHTML}:s));
    }
    setActiveId(id);
  };

  const exec = (cmd: string, arg?: string) => { document.execCommand(cmd, false, arg); cardRefs.current.get(activeId!)?.focus(); };

  const fontSize = (delta: number) => {
    const sel = window.getSelection(); if (!sel?.rangeCount) return;
    const r = sel.getRangeAt(0); if (r.collapsed) return;
    const span = document.createElement('span');
    let base = 16;
    const cardEl = cardRefs.current.get(activeId!);
    if (cardEl) { const sz = window.getComputedStyle(cardEl).fontSize; base = parseInt(sz)||16; }
    span.style.fontSize = (base+delta)+'px';
    try { r.surroundContents(span); } catch(e) {}
    cardEl?.focus();
  };

  const insertImg = () => {
    const url = prompt('URL изображения (или пусто для загрузки):');
    if (url) exec('insertImage', url);
    else {
      const inp = document.createElement('input'); inp.type='file'; inp.accept='image/*';
      inp.onchange = () => {
        const f = inp.files?.[0]; if (!f) return;
        const reader = new FileReader();
        reader.onload = () => exec('insertImage', reader.result as string);
        reader.readAsDataURL(f);
      };
      inp.click();
    }
  };
  const insertVid = () => {
    const url = prompt('URL видео (embed):');
    if (url) exec('insertHTML', `<iframe width="560" height="315" src="${url}" frameborder="0" allowfullscreen></iframe>`);
  };

  const cardStyle: React.CSSProperties = {
    background: card.bg,
    borderRadius: card.shape==='circle' ? '50%' : card.radius,
    border: `${card.borderW}px solid ${card.borderColor}`,
    fontFamily: card.font, color: card.textColor,
    overflow: 'hidden',
    padding: 50,
    outline: 'none', wordWrap: 'break-word',
    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'stretch',
    boxShadow: '0 30px 40px rgba(0,0,0,0.1)',
    maxWidth: 800, width: card.width,
    aspectRatio: card.shape==='circle' ? '1' : 'auto',
    height: card.shape==='circle' ? card.radius*2 : 'auto',
  };

  const updateLayer = (id: string, patch: Partial<Layer>) => {
    setLayers(prev => prev.map(l => {
      if (l.id!==id) return l;
      const upd = {...l, ...patch};
      if (patch.count!==undefined || patch.minSize!==undefined || patch.maxSize!==undefined) {
        const w=window.innerWidth, h=window.innerHeight;
        upd.items = Array.from({length: upd.count}, () => ({
          x:Math.random()*w, y:Math.random()*h,
          size:upd.minSize+Math.random()*(upd.maxSize-upd.minSize),
          rot:Math.random()*360, rotV:upd.rot*(Math.random()-0.5)*2,
          vx:(Math.random()-0.5)*1.5, vy:(Math.random()-0.5)*1.5
        }));
      }
      return upd;
    }));
  };
  const addLayer = () => {
    const nl: Layer = { id:Date.now().toString(), name:'Новый слой', type:'circle', color:'#ffaa00', minSize:20, maxSize:50, opacity:0.5, anim:'fallDown', rot:0.2, count:10, items:[], collapsed:false };
    setLayers(prev => [...prev, nl]);
    initItems();
  };
  const removeLayer = (id: string) => setLayers(prev => prev.filter(l => l.id!==id));
  const loadLayerImg = (id: string) => {
    const inp = document.createElement('input'); inp.type='file'; inp.accept='image/*';
    inp.onchange = () => {
      const f = inp.files?.[0]; if (!f) return;
      const reader = new FileReader();
      reader.onload = () => updateLayer(id, { color: reader.result as string });
      reader.readAsDataURL(f);
    };
    inp.click();
  };

  /* экспорт с корректной разметкой слайдов */
  const exportHTML = () => {
    const layersConfig = layers.map(l => ({ ...l, items: [] }));

    const styles = `
* { margin:0; padding:0; box-sizing:border-box; }
body { overflow:hidden; }
#bg-canvas { position:absolute; top:0; left:0; z-index:0; }
.slides-viewport { position:relative; z-index:1; height:100vh; overflow-y:scroll; scroll-snap-type:y mandatory; scroll-behavior:smooth; }
.slides-container { display:flex; flex-direction:column; }
.slide { scroll-snap-align:start; height:100vh; display:flex; align-items:center; justify-content:center; padding:40px; }
.card {
  background: ${card.bg}; border-radius: ${card.shape==='circle' ? '50%' : card.radius+'px'};
  border: ${card.borderW}px solid ${card.borderColor}; font-family: ${card.font}; color: ${card.textColor};
  overflow:hidden; padding:50px; max-width:800px; width:${card.width};
  box-shadow:0 30px 40px rgba(0,0,0,0.1); word-wrap:break-word;
  display:flex; flex-direction:column; justify-content:center; align-items:stretch;
}`;

    const animCode = `
const layers = ${JSON.stringify(layersConfig)};
const speed = ${speed};
const icons = ${JSON.stringify(ICON_UNICODE)};
const W = window.innerWidth, H = window.innerHeight;
layers.forEach(l => {
  l.items = Array.from({length:l.count}, () => ({
    x:Math.random()*W, y:Math.random()*H,
    size:l.minSize+Math.random()*(l.maxSize-l.minSize),
    rot:Math.random()*360,
    rotV:l.rot*(Math.random()-0.5)*2,
    vx:(Math.random()-0.5)*1.5, vy:(Math.random()-0.5)*1.5
  }));
});
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
canvas.width = W; canvas.height = H;
function draw() {
  ctx.clearRect(0,0,W,H);
  layers.forEach(l => l.items.forEach(it => {
    if (l.anim==='fallDown') it.y += speed*0.8;
    else if (l.anim==='fallUp') it.y -= speed*0.8;
    else if (l.anim==='float') {
      it.x += it.vx*speed*0.3; it.y += it.vy*speed*0.3;
      if (it.x<0||it.x>W) it.vx*=-1;
      if (it.y<0||it.y>H) it.vy*=-1;
    }
    it.rot += it.rotV*speed;
    if (it.y>H+it.size) it.y = -it.size;
    if (it.y<-it.size) it.y = H+it.size;
    ctx.save();
    ctx.translate(it.x, it.y);
    ctx.rotate(it.rot*Math.PI/180);
    ctx.globalAlpha = l.opacity;
    if (l.type==='circle') {
      ctx.beginPath(); ctx.arc(0,0,it.size/2,0,Math.PI*2);
      ctx.fillStyle=l.color; ctx.fill();
    } else if (l.type==='icon') {
      const code = icons[l.iconName||l.color] || 0xf004;
      ctx.font = '900 '+it.size+'px "Font Awesome 6 Free"';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillStyle=l.color;
      ctx.fillText(String.fromCharCode(code),0,0);
    }
    ctx.restore();
  }));
  requestAnimationFrame(draw);
}
draw();
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  layers.forEach(l => {
    l.items = Array.from({length:l.count}, () => ({
      x:Math.random()*W, y:Math.random()*H,
      size:l.minSize+Math.random()*(l.maxSize-l.minSize),
      rot:Math.random()*360,
      rotV:l.rot*(Math.random()-0.5)*2,
      vx:(Math.random()-0.5)*1.5, vy:(Math.random()-0.5)*1.5
    }));
  });
});
`;

    const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Презентация</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
<style>${styles}</style></head><body>
<canvas id="bg-canvas"></canvas>
<div class="slides-viewport">
  <div class="slides-container">
    ${slides.map(s => `<div class="slide"><div class="card">${s.html}</div></div>`).join('')}
  </div>
</div>
<script>${animCode}</script></body></html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'presentation.html';
    a.click();
  };

  return (
    <div className="presentation-editor" onClick={bgClick}>
      <canvas ref={canvasRef} className="bg-canvas" />
      <div className="editor-layout">
        <div className="sidebar">
          <h3>Настройки</h3>
          <div className="section">
            <label>Слайды</label>
            <button onClick={addSlide}><i className="fas fa-plus"/> Добавить</button>
            <button onClick={removeSlide} className="secondary"><i className="fas fa-minus"/> Удалить</button>
          </div>
          <div className="section">
            <label>Фон</label>
            <select value={bgType} onChange={e=>setBgType(e.target.value as any)}>
              <option value="solid">Сплошной цвет</option>
              <option value="gradient">Градиент</option>
            </select>
            {bgType==='solid'? (
              <div><label>Цвет</label><input type="color" value={solidColor} onChange={e=>setSolidColor(e.target.value)}/></div>
            ):(
              <div>
                <label>Угол (°)</label><input type="number" value={angle} onChange={e=>setAngle(+e.target.value)} min="0" max="360"/>
                <label>Цвет 1</label><input type="color" value={gColors[0]||'#ffaa00'} onChange={e=>{const n=[...gColors];n[0]=e.target.value;setGColors(n);}}/>
                <label>Цвет 2</label><input type="color" value={gColors[1]||'#dd2a7b'} onChange={e=>{const n=[...gColors];n[1]=e.target.value;setGColors(n);}}/>
                <label>Цвет 3</label><input type="color" value={gColors[2]||'#8134af'} onChange={e=>{const n=[...gColors];n[2]=e.target.value;setGColors(n);}}/>
              </div>
            )}
            <label>Размытие (px)</label><input type="range" min="0" max="10" step="0.5" value={blur} onChange={e=>setBlur(+e.target.value)}/>
          </div>
          <div className="section">
            <label>Карточка</label>
            <label>Цвет фона</label><input type="color" value={card.bg} onChange={e=>setCard(c=>({...c,bg:e.target.value}))}/>
            <label>Ширина</label><input type="text" value={card.width} onChange={e=>setCard(c=>({...c,width:e.target.value}))}/>
            <label>Форма</label>
            <select value={card.shape} onChange={e=>setCard(c=>({...c,shape:e.target.value}))}>
              <option value="rounded">Скруглённая</option>
              <option value="circle">Круг</option>
              <option value="oval">Овал</option>
            </select>
            <label>Радиус</label><input type="number" value={card.radius} onChange={e=>setCard(c=>({...c,radius:+e.target.value}))}/>
            <label>Обводка (px)</label><input type="number" value={card.borderW} onChange={e=>setCard(c=>({...c,borderW:+e.target.value}))}/>
            <label>Цвет обводки</label><input type="color" value={card.borderColor} onChange={e=>setCard(c=>({...c,borderColor:e.target.value}))}/>
            <label>Шрифт</label>
            <select value={card.font} onChange={e=>setCard(c=>({...c,font:e.target.value}))}>
              <option value="'Segoe UI',sans-serif">Segoe UI</option>
              <option value="'Roboto',sans-serif">Roboto</option>
              <option value="'Playfair Display',serif">Playfair Display</option>
              <option value="'Montserrat',sans-serif">Montserrat</option>
              <option value="'Oswald',sans-serif">Oswald</option>
              <option value="'Lobster',cursive">Lobster</option>
              <option value="'Comfortaa',cursive">Comfortaa</option>
              <option value="'Pacifico',cursive">Pacifico</option>
            </select>
            <label>Цвет текста</label><input type="color" value={card.textColor} onChange={e=>setCard(c=>({...c,textColor:e.target.value}))}/>
          </div>
          <div className="section">
            <label>Слои</label>
            <button onClick={addLayer}><i className="fas fa-plus"/> Добавить</button>
            <div className="layers-list">
              {layers.map(l => (
                <div key={l.id} className="layer-panel">
                  <div className="layer-header" onClick={()=>updateLayer(l.id,{collapsed:!l.collapsed})}>
                    <span>{l.name}</span>
                    <div>
                      <button onClick={e=>{e.stopPropagation();removeLayer(l.id)}} className="secondary"><i className="fas fa-trash"/></button>
                      <i className={`fas ${l.collapsed?'fa-chevron-down':'fa-chevron-up'}`}/>
                    </div>
                  </div>
                  {!l.collapsed && (
                    <div className="layer-details">
                      <label>Название</label><input type="text" value={l.name} onChange={e=>updateLayer(l.id,{name:e.target.value})}/>
                      <label>Тип</label>
                      <select value={l.type} onChange={e=>updateLayer(l.id,{type:e.target.value as any})}>
                        <option value="circle">Круг</option>
                        <option value="icon">Иконка</option>
                        <option value="image">Изображение</option>
                      </select>
                      {l.type==='icon' && (
                        <>
                          <label>Иконка</label>
                          <select value={l.iconName||l.color} onChange={e=>updateLayer(l.id,{iconName:e.target.value,color:e.target.value})}>
                            {ICON_LIST.map(name=><option key={name} value={name}>{name}</option>)}
                          </select>
                        </>
                      )}
                      {l.type!=='image' && <label>Цвет</label>}
                      {l.type==='image' && <button onClick={()=>loadLayerImg(l.id)}>Загрузить PNG</button>}
                      <label>Размер (мин/макс)</label>
                      <div className="range-group">
                        <input type="number" value={l.minSize} onChange={e=>updateLayer(l.id,{minSize:+e.target.value})}/>
                        <input type="number" value={l.maxSize} onChange={e=>updateLayer(l.id,{maxSize:+e.target.value})}/>
                      </div>
                      <label>Количество</label><input type="range" min="1" max="30" value={l.count} onChange={e=>updateLayer(l.id,{count:+e.target.value})}/>
                      <label>Прозрачность</label><input type="range" min="0.1" max="1" step="0.1" value={l.opacity} onChange={e=>updateLayer(l.id,{opacity:+e.target.value})}/>
                      <label>Анимация</label>
                      <select value={l.anim} onChange={e=>updateLayer(l.id,{anim:e.target.value})}>
                        <option value="fallDown">Падение вниз</option>
                        <option value="fallUp">Падение вверх</option>
                        <option value="fallLeft">Влево</option>
                        <option value="fallRight">Вправо</option>
                        <option value="diagonalTL">Диагональ ↖</option>
                        <option value="diagonalTR">Диагональ ↗</option>
                        <option value="float">Парение</option>
                        <option value="zigzag">Зигзаг</option>
                        <option value="rotateOnly">Вращение</option>
                        <option value="chaotic">Хаос</option>
                      </select>
                      <label>Вращение</label><input type="range" min="0" max="2" step="0.1" value={l.rot} onChange={e=>updateLayer(l.id,{rot:+e.target.value})}/>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <label>Скорость</label><input type="range" min="0.1" max="2" step="0.1" value={speed} onChange={e=>setSpeed(+e.target.value)}/>
          </div>
          <button onClick={exportHTML} className="export-btn"><i className="fas fa-download"/> Экспорт HTML</button>
        </div>

        <div className="slides-viewport" ref={viewportRef}>
          <div className="slides-container">
            {slides.map(s => (
              <div className="slide" key={s.id}>
                {activeId===s.id && (
                  <div className="formatting-toolbar">
                    <button onMouseDown={e=>{e.preventDefault();exec('bold')}}><b>B</b></button>
                    <button onMouseDown={e=>{e.preventDefault();exec('italic')}}><i>I</i></button>
                    <button onMouseDown={e=>{e.preventDefault();exec('underline')}}><u>U</u></button>
                    <button onMouseDown={e=>{e.preventDefault();exec('strikeThrough')}}><s>S</s></button>
                    <button onMouseDown={e=>{e.preventDefault();exec('formatBlock','h1')}}>H1</button>
                    <button onMouseDown={e=>{e.preventDefault();exec('formatBlock','h2')}}>H2</button>
                    <button onMouseDown={e=>{e.preventDefault();fontSize(2)}}>A+</button>
                    <button onMouseDown={e=>{e.preventDefault();fontSize(-2)}}>A-</button>
                    <button onMouseDown={e=>{e.preventDefault();insertImg()}}>🖼️</button>
                    <button onMouseDown={e=>{e.preventDefault();insertVid()}}>🎬</button>
                  </div>
                )}
                <div
                  ref={el=>{if(el)cardRefs.current.set(s.id,el)}}
                  className={`slide-card ${activeId===s.id?'active':''}`}
                  contentEditable={activeId===s.id}
                  suppressContentEditableWarning
                  dangerouslySetInnerHTML={{__html:s.html}}
                  style={cardStyle}
                  onDoubleClick={()=>dblClick(s.id)}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="indicators">
          {slides.map((_,i)=>(
            <div key={i} className={`indicator ${i===current?'active':''}`} onClick={()=>goTo(i)}/>
          ))}
        </div>
      </div>
    </div>
  );
};

export { PresentationEditorPage };

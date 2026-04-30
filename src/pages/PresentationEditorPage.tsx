// src/pages/PresentationEditorPage.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import EmblaCarousel from 'embla-carousel-react';
import './PresentationEditorPage.css';

// ---------- типы ----------
interface SlideData {
  id: string;
  html: string;
}

interface Layer {
  id: string;
  name: string;
  type: 'circle' | 'icon' | 'image';
  color: string;          // цвет (circle), имя иконки (icon) или dataURL (image)
  iconName?: string;      // имя иконки для типа icon
  minSize: number;
  maxSize: number;
  opacity: number;
  anim: string;           // fallDown, fallUp, float
  rot: number;            // скорость вращения
  count: number;
  items: LayerItem[];
}

interface LayerItem {
  x: number;
  y: number;
  size: number;
  rot: number;
  rotV: number;
  vx: number;
  vy: number;
}

// ---------- константы ----------
const ICON_NAMES = [
  'fa-heart','fa-star','fa-cloud','fa-bolt','fa-music','fa-camera',
  'fa-smile','fa-fire','fa-leaf','fa-rocket','fa-crown','fa-gem',
  'fa-paper-plane','fa-globe','fa-certificate'
] as const;

const ICON_UNICODE: Record<string, number> = {
  'fa-heart': 0xf004, 'fa-star': 0xf005, 'fa-cloud': 0xf0c2, 'fa-bolt': 0xf0e7,
  'fa-music': 0xf001, 'fa-camera': 0xf030, 'fa-smile': 0xf118, 'fa-fire': 0xf06d,
  'fa-leaf': 0xf06c, 'fa-rocket': 0xf135, 'fa-crown': 0xf521, 'fa-gem': 0xf3a5,
  'fa-paper-plane': 0xf1d8, 'fa-globe': 0xf0ac, 'fa-certificate': 0xf0a3
};

const DEFAULT_SLIDES: SlideData[] = [
  { id: '1', html: '<h1>Добро пожаловать!</h1><p>Это редактор презентаций Sputnik Studio.</p>' },
  { id: '2', html: '<h2>Второй слайд</h2><p>Дважды кликните, чтобы редактировать.</p>' }
];

const DEFAULT_LAYERS: Layer[] = [
  {
    id: 'layer1', name: 'Круги', type: 'circle', color: '#5b8c42',
    minSize: 30, maxSize: 60, opacity: 0.6, anim: 'fallDown', rot: 0.4, count: 10, items: []
  },
  {
    id: 'layer2', name: 'Сердечки', type: 'icon', color: '#e63950', iconName: 'fa-heart',
    minSize: 40, maxSize: 70, opacity: 0.7, anim: 'fallDown', rot: 0.3, count: 8, items: []
  }
];

// ---------- компонент ----------
const PresentationEditorPage: React.FC = () => {
  // состояние
  const [slides, setSlides] = useState<SlideData[]>(DEFAULT_SLIDES);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [layers, setLayers] = useState<Layer[]>(DEFAULT_LAYERS);
  const [globalSpeed, setGlobalSpeed] = useState(0.8);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  // стили карточки
  const [cardStyle, setCardStyle] = useState({
    bg: '#ffffff', width: '100%', height: 'auto', shape: 'rounded',
    radius: 28, borderWidth: 2, borderColor: 'rgba(0,0,0,0.05)',
    font: "'Segoe UI', sans-serif", textColor: '#333333'
  });

  const [emblaRef, emblaApi] = EmblaCarousel({ loop: false, align: 'start', skipSnaps: false });

  // ---------- инициализация частиц ----------
  const initLayerItems = useCallback(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    setLayers(prev => prev.map(layer => ({
      ...layer,
      items: Array.from({ length: layer.count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        size: layer.minSize + Math.random() * (layer.maxSize - layer.minSize),
        rot: Math.random() * 360,
        rotV: layer.rot * (Math.random() - 0.5) * 2,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5
      }))
    })));
  }, []);

  useEffect(() => { initLayerItems(); }, [initLayerItems]);

  // ---------- анимация канваса ----------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const container = canvas.parentElement!;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255,255,255,0.02)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      layers.forEach(layer => {
        layer.items.forEach(item => {
          if (layer.anim === 'fallDown') item.y += globalSpeed * 0.8;
          else if (layer.anim === 'fallUp') item.y -= globalSpeed * 0.8;
          else if (layer.anim === 'float') {
            item.x += item.vx * globalSpeed * 0.3;
            item.y += item.vy * globalSpeed * 0.3;
            if (item.x < 0 || item.x > canvas.width) item.vx *= -1;
            if (item.y < 0 || item.y > canvas.height) item.vy *= -1;
          }
          item.rot += item.rotV * globalSpeed;
          if (item.y > canvas.height + item.size) item.y = -item.size;
          if (item.y < -item.size) item.y = canvas.height + item.size;

          ctx.save();
          ctx.translate(item.x, item.y);
          ctx.rotate((item.rot * Math.PI) / 180);
          ctx.globalAlpha = layer.opacity;

          if (layer.type === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, item.size / 2, 0, Math.PI * 2);
            ctx.fillStyle = layer.color;
            ctx.fill();
          } else if (layer.type === 'icon') {
            const code = ICON_UNICODE[layer.iconName || layer.color] || 0xf004;
            ctx.font = `${item.size}px "Font Awesome 6 Free"`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = layer.color;
            ctx.fillText(String.fromCharCode(code), 0, 0);
          } else if (layer.type === 'image' && layer.color.startsWith('data:')) {
            const img = new Image();
            img.src = layer.color;
            ctx.drawImage(img, -item.size / 2, -item.size / 2, item.size, item.size);
          }
          ctx.restore();
        });
      });
      animFrameRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [layers, globalSpeed]);

  // ---------- Embla синхронизация ----------
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setCurrentSlide(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi]);

  // ---------- слайды ----------
  const addSlide = () => setSlides(prev => [...prev, { id: Date.now().toString(), html: '<h2>Новый слайд</h2><p>Описание</p>' }]);
  const removeSlide = () => setSlides(prev => prev.length > 1 ? prev.filter((_, i) => i !== currentSlide) : prev);

  const handleSlideDoubleClick = (id: string) => setActiveSlideId(id);
  const handleSlideBlur = (id: string, e: React.FocusEvent<HTMLDivElement>) => {
    setSlides(prev => prev.map(s => s.id === id ? { ...s, html: e.currentTarget.innerHTML } : s));
    setActiveSlideId(null);
  };

  // ---------- тулбар форматирования ----------
  const execCmd = (cmd: string, arg?: string) => document.execCommand(cmd, false, arg);
  const changeFontSize = (delta: number) => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return;
    let parent = range.commonAncestorContainer as HTMLElement;
    if (parent.nodeType === Node.TEXT_NODE) parent = parent.parentElement!;
    let cur = parent, size = 16;
    while (cur && cur !== document.body) {
      if (cur.style.fontSize) { size = parseInt(cur.style.fontSize); break; }
      cur = cur.parentElement!;
    }
    const span = document.createElement('span');
    span.style.fontSize = (size + delta) + 'px';
    try { range.surroundContents(span); } catch (e) { /* ignore */ }
  };

  const insertTable = () => {
    const r = prompt('Строк:','2'), c = prompt('Столбцов:','2');
    if (r && c) {
      let tbl = '<table style="width:100%;border-collapse:collapse;margin-top:10px">';
      for (let i=0;i<+r;i++) { tbl += '<tr>'; for (let j=0;j<+c;j++) tbl += '<td style="border:1px solid #ccc;padding:8px">&nbsp;</td>'; tbl += '</tr>'; }
      tbl += '</table>';
      execCmd('insertHTML', tbl);
    }
  };
  const insertImage = () => {
    const url = prompt('URL изображения (или оставьте пустым для загрузки):');
    if (url) execCmd('insertImage', url);
    else {
      const inp = document.createElement('input'); inp.type='file'; inp.accept='image/*';
      inp.onchange = () => {
        const f = inp.files?.[0]; if (!f) return;
        const reader = new FileReader();
        reader.onload = () => execCmd('insertImage', reader.result as string);
        reader.readAsDataURL(f);
      };
      inp.click();
    }
  };
  const insertVideo = () => {
    const url = prompt('URL видео (YouTube/Vimeo):');
    if (url) execCmd('insertHTML', `<iframe width="560" height="315" src="${url}" frameborder="0" allowfullscreen></iframe>`);
  };

  // ---------- слои ----------
  const updateLayer = (id: string, patch: Partial<Layer>) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...patch, items: patch.count !== undefined || patch.minSize !== undefined || patch.maxSize !== undefined ? [] : l.items } : l));
    // пересоздаём items для этого слоя при изменении размера/количества
    const w = window.innerWidth, h = window.innerHeight;
    setLayers(prev => prev.map(l => {
      if (l.id !== id) return l;
      if (patch.count !== undefined || patch.minSize !== undefined || patch.maxSize !== undefined) {
        return {
          ...l,
          items: Array.from({ length: l.count }, () => ({
            x: Math.random()*w, y: Math.random()*h,
            size: l.minSize + Math.random()*(l.maxSize-l.minSize),
            rot: Math.random()*360,
            rotV: l.rot*(Math.random()-0.5)*2,
            vx: (Math.random()-0.5)*1.5, vy: (Math.random()-0.5)*1.5
          }))
        };
      }
      return l;
    }));
  };

  const addLayer = () => {
    const newLayer: Layer = {
      id: Date.now().toString(), name: `Новый слой`, type: 'circle', color: '#ffaa00',
      minSize: 20, maxSize: 50, opacity: 0.5, anim: 'fallDown', rot: 0.2, count: 10, items: []
    };
    setLayers(prev => [...prev, newLayer]);
    initLayerItems();
  };
  const removeLayer = (id: string) => setLayers(prev => prev.filter(l => l.id !== id));
  const handleLayerImage = (id: string) => {
    const inp = document.createElement('input'); inp.type='file'; inp.accept='image/*';
    inp.onchange = () => {
      const f = inp.files?.[0]; if (!f) return;
      const reader = new FileReader();
      reader.onload = () => updateLayer(id, { color: reader.result as string });
      reader.readAsDataURL(f);
    };
    inp.click();
  };

  // ---------- экспорт ----------
  const handleExport = () => {
    const canvasCode = `
      const layers = ${JSON.stringify(layers.map(l => ({ ...l, items: [] })))};
      const w = window.innerWidth, h = window.innerHeight;
      layers.forEach(l => l.items = Array.from({length: l.count}, () => ({x:Math.random()*w, y:Math.random()*h, ...}))); 
      // ... полный код анимации как в useEffect
    `;
    const html = `<html><head><meta charset="UTF-8"><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css"><style>${document.querySelector('style')?.innerHTML||''}</style></head><body><canvas id="c"></canvas><script>${canvasCode}</`+`script></body></html>`;
    const blob = new Blob([html], {type:'text/html'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'presentation.html'; a.click();
  };

  // ---------- стиль карточки ----------
  const cardInline: React.CSSProperties = {
    background: cardStyle.bg, width: cardStyle.width, height: cardStyle.height,
    borderRadius: cardStyle.shape === 'circle' ? '50%' : cardStyle.radius,
    border: `${cardStyle.borderWidth}px solid ${cardStyle.borderColor}`,
    fontFamily: cardStyle.font, color: cardStyle.textColor
  };

  return (
    <div className="presentation-editor">
      <canvas ref={canvasRef} className="bg-canvas" />

      <div className="editor-layout">
        {/* Сайдбар */}
        <div className="sidebar">
          <h3>Настройки</h3>

          <div className="section">
            <label>Слайды</label>
            <button onClick={addSlide}><i className="fas fa-plus"/> Добавить</button>
            <button onClick={removeSlide} className="secondary"><i className="fas fa-minus"/> Удалить</button>
          </div>

          <div className="section">
            <label>Карточка</label>
            <label>Цвет фона</label>
            <input type="color" value={cardStyle.bg} onChange={e => setCardStyle(prev => ({...prev, bg: e.target.value}))} />
            <label>Форма</label>
            <select value={cardStyle.shape} onChange={e => setCardStyle(prev => ({...prev, shape: e.target.value}))}>
              <option value="rounded">Скруглённая</option>
              <option value="circle">Круг</option>
              <option value="oval">Овал</option>
            </select>
            <label>Радиус</label>
            <input type="number" value={cardStyle.radius} onChange={e => setCardStyle(prev => ({...prev, radius: +e.target.value}))} />
            <label>Обводка (px)</label>
            <input type="number" value={cardStyle.borderWidth} onChange={e => setCardStyle(prev => ({...prev, borderWidth: +e.target.value}))} />
            <label>Цвет обводки</label>
            <input type="text" value={cardStyle.borderColor} onChange={e => setCardStyle(prev => ({...prev, borderColor: e.target.value}))} />
            <label>Шрифт</label>
            <select value={cardStyle.font} onChange={e => setCardStyle(prev => ({...prev, font: e.target.value}))}>
              <option value="'Segoe UI', sans-serif">Segoe UI</option>
              <option value="'Roboto', sans-serif">Roboto</option>
              <option value="'Playfair Display', serif">Playfair Display</option>
              <option value="'Montserrat', sans-serif">Montserrat</option>
            </select>
            <label>Цвет текста</label>
            <input type="color" value={cardStyle.textColor} onChange={e => setCardStyle(prev => ({...prev, textColor: e.target.value}))} />
          </div>

          <div className="section">
            <label>Слои фона</label>
            <button onClick={addLayer}><i className="fas fa-plus"/> Добавить слой</button>
            <div className="layers-list">
              {layers.map(layer => (
                <div key={layer.id} className="layer-panel">
                  <div className="layer-header">
                    <span>{layer.name}</span>
                    <button onClick={() => removeLayer(layer.id)} className="secondary"><i className="fas fa-trash"/></button>
                  </div>
                  <label>Тип</label>
                  <select value={layer.type} onChange={e => updateLayer(layer.id, { type: e.target.value as Layer['type'] })}>
                    <option value="circle">Круг</option>
                    <option value="icon">Иконка</option>
                    <option value="image">Изображение</option>
                  </select>
                  {layer.type === 'icon' && (
                    <>
                      <label>Иконка</label>
                      <select value={layer.iconName || layer.color} onChange={e => updateLayer(layer.id, { iconName: e.target.value, color: e.target.value })}>
                        {ICON_NAMES.map(name => <option key={name} value={name}>{name}</option>)}
                      </select>
                    </>
                  )}
                  {layer.type !== 'image' && (
                    <>
                      <label>Цвет</label>
                      <input type="color" value={layer.color} onChange={e => updateLayer(layer.id, { color: e.target.value })} />
                    </>
                  )}
                  {layer.type === 'image' && (
                    <button onClick={() => handleLayerImage(layer.id)}>Загрузить PNG</button>
                  )}
                  <label>Размер (мин/макс)</label>
                  <div className="range-group">
                    <input type="number" value={layer.minSize} onChange={e => updateLayer(layer.id, { minSize: +e.target.value })} />
                    <input type="number" value={layer.maxSize} onChange={e => updateLayer(layer.id, { maxSize: +e.target.value })} />
                  </div>
                  <label>Количество</label>
                  <input type="range" min="1" max="30" value={layer.count} onChange={e => updateLayer(layer.id, { count: +e.target.value })} />
                  <label>Прозрачность</label>
                  <input type="range" min="0.1" max="1" step="0.1" value={layer.opacity} onChange={e => updateLayer(layer.id, { opacity: +e.target.value })} />
                  <label>Анимация</label>
                  <select value={layer.anim} onChange={e => updateLayer(layer.id, { anim: e.target.value })}>
                    <option value="fallDown">Падение вниз</option>
                    <option value="fallUp">Падение вверх</option>
                    <option value="float">Парение</option>
                  </select>
                  <label>Вращение</label>
                  <input type="range" min="0" max="2" step="0.1" value={layer.rot} onChange={e => updateLayer(layer.id, { rot: +e.target.value })} />
                </div>
              ))}
            </div>
            <label>Общая скорость</label>
            <input type="range" min="0.1" max="2" step="0.1" value={globalSpeed} onChange={e => setGlobalSpeed(+e.target.value)} />
          </div>

          <button onClick={handleExport} className="export-btn"><i className="fas fa-download"/> Экспорт HTML</button>
        </div>

        {/* Слайды */}
        <div className="slides-area">
          {activeSlideId && (
            <div className="formatting-toolbar">
              <button onClick={() => execCmd('bold')}><b>B</b></button>
              <button onClick={() => execCmd('italic')}><i>I</i></button>
              <button onClick={() => execCmd('underline')}><u>U</u></button>
              <button onClick={() => execCmd('formatBlock', 'h1')}>H1</button>
              <button onClick={() => execCmd('formatBlock', 'h2')}>H2</button>
              <button onClick={() => changeFontSize(2)}>A+</button>
              <button onClick={() => changeFontSize(-2)}>A-</button>
              <button onClick={insertTable}>⊞ Таблица</button>
              <button onClick={insertImage}>🖼️ Изобр.</button>
              <button onClick={insertVideo}>🎬 Видео</button>
            </div>
          )}
          <div className="slides-viewport" ref={emblaRef}>
            <div className="slides-container">
              {slides.map(slide => (
                <div className="slide" key={slide.id}>
                  <div
                    className={`slide-card ${activeSlideId === slide.id ? 'active' : ''}`}
                    contentEditable={activeSlideId === slide.id}
                    suppressContentEditableWarning
                    dangerouslySetInnerHTML={{ __html: slide.html }}
                    style={cardInline}
                    onDoubleClick={() => handleSlideDoubleClick(slide.id)}
                    onBlur={(e) => handleSlideBlur(slide.id, e)}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="indicators">
            {slides.map((_, i) => (
              <div key={i} className={`indicator ${i === currentSlide ? 'active' : ''}`} onClick={() => emblaApi?.scrollTo(i)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresentationEditorPage;

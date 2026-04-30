// src/pages/PresentationEditorPage.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import './PresentationEditorPage.css';

// Типы
interface SlideData {
  id: string;
  content: any;   // JSON для TipTap
  html: string;   // HTML для экспорта и отображения (будет синхронизироваться)
}

interface Layer {
  id: string;
  name: string;
  type: 'circle' | 'icon' | 'image';
  color: string;
  iconName?: string;
  minSize: number;
  maxSize: number;
  opacity: number;
  anim: string;
  rot: number;
  count: number;
  items: LayerItem[];
  collapsed?: boolean;
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

// Иконки (юникоды)
const ICON_NAMES = [
  'fa-heart','fa-star','fa-cloud','fa-bolt','fa-music','fa-camera','fa-smile','fa-fire',
  'fa-leaf','fa-rocket','fa-crown','fa-gem','fa-paper-plane','fa-globe','fa-certificate',
  'fa-bell','fa-calendar','fa-comment','fa-envelope','fa-thumbs-up','fa-bicycle','fa-bus',
  'fa-car','fa-plane','fa-robot','fa-trophy','fa-gift','fa-tree','fa-paw','fa-bug','fa-fish',
  'fa-kiwi-bird','fa-spider','fa-apple-whole','fa-carrot','fa-lemon','fa-seedling','fa-umbrella',
  'fa-moon','fa-sun'
];

const ICON_UNICODE: Record<string, number> = {
  'fa-heart':0xf004, 'fa-star':0xf005, 'fa-cloud':0xf0c2, 'fa-bolt':0xf0e7, 'fa-music':0xf001,
  'fa-camera':0xf030, 'fa-smile':0xf118, 'fa-fire':0xf06d, 'fa-leaf':0xf06c, 'fa-rocket':0xf135,
  'fa-crown':0xf521, 'fa-gem':0xf3a5, 'fa-paper-plane':0xf1d8, 'fa-globe':0xf0ac, 'fa-certificate':0xf0a3,
  'fa-bell':0xf0f3, 'fa-calendar':0xf133, 'fa-comment':0xf075, 'fa-envelope':0xf0e0, 'fa-thumbs-up':0xf164,
  'fa-bicycle':0xf206, 'fa-bus':0xf207, 'fa-car':0xf1b9, 'fa-plane':0xf072, 'fa-robot':0xf544, 'fa-trophy':0xf091,
  'fa-gift':0xf06b, 'fa-tree':0xf1bb, 'fa-paw':0xf1b0, 'fa-bug':0xf188, 'fa-fish':0xf578, 'fa-kiwi-bird':0xf535,
  'fa-spider':0xf717, 'fa-apple-whole':0xf5d1, 'fa-carrot':0xf787, 'fa-lemon':0xf094, 'fa-seedling':0xf4d8,
  'fa-umbrella':0xf0e9, 'fa-moon':0xf186, 'fa-sun':0xf185
};

// Начальные слайды с HTML
const DEFAULT_SLIDES: SlideData[] = [
  {
    id: '1',
    content: { type: 'doc', content: [{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Добро пожаловать!' }] }, { type: 'paragraph', content: [{ type: 'text', text: 'Это редактор презентаций Sputnik Studio.' }] }] },
    html: '<h1>Добро пожаловать!</h1><p>Это редактор презентаций Sputnik Studio.</p>'
  },
  {
    id: '2',
    content: { type: 'doc', content: [{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Второй слайд' }] }, { type: 'paragraph', content: [{ type: 'text', text: 'Редактируйте текст как в привычном редакторе.' }] }] },
    html: '<h2>Второй слайд</h2><p>Редактируйте текст как в привычном редакторе.</p>'
  }
];

const DEFAULT_LAYERS: Layer[] = [
  { id: 'layer1', name: 'Круги', type: 'circle', color: '#5b8c42', minSize:30, maxSize:60, opacity:0.6, anim:'fallDown', rot:0.4, count:10, items:[], collapsed:false },
  { id: 'layer2', name: 'Сердечки', type:'icon', color:'#e63950', iconName:'fa-heart', minSize:40, maxSize:70, opacity:0.7, anim:'fallDown', rot:0.3, count:8, items:[], collapsed:false }
];

const PresentationEditorPage: React.FC = () => {
  const [slides, setSlides] = useState<SlideData[]>(DEFAULT_SLIDES);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [layers, setLayers] = useState<Layer[]>(DEFAULT_LAYERS);
  const [globalSpeed, setGlobalSpeed] = useState(0.8);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);

  const [cardStyle, setCardStyle] = useState({
    bg: '#ffffff', width: '100%', height: 'auto', shape: 'rounded',
    radius: 28, borderWidth: 2, borderColor: '#000000',
    font: "'Segoe UI', sans-serif", textColor: '#333333'
  });

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

  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const resize = () => {
      canvas.width = canvas.parentElement!.clientWidth;
      canvas.height = canvas.parentElement!.clientHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      layers.forEach(layer => {
        layer.items.forEach(item => {
          if (layer.anim === 'fallDown') item.y += globalSpeed * 0.8;
          else if (layer.anim === 'fallUp') item.y -= globalSpeed * 0.8;
          else if (layer.anim === 'fallLeft') item.x -= globalSpeed * 0.8;
          else if (layer.anim === 'fallRight') item.x += globalSpeed * 0.8;
          else if (layer.anim === 'diagonalTL') { item.y -= globalSpeed * 0.6; item.x -= globalSpeed * 0.6; }
          else if (layer.anim === 'diagonalTR') { item.y -= globalSpeed * 0.6; item.x += globalSpeed * 0.6; }
          else if (layer.anim === 'float') {
            item.x += item.vx * globalSpeed * 0.3;
            item.y += item.vy * globalSpeed * 0.3;
            if (item.x < 0 || item.x > canvas.width) item.vx *= -1;
            if (item.y < 0 || item.y > canvas.height) item.vy *= -1;
          } else if (layer.anim === 'zigzag') {
            item.y += globalSpeed * 0.6;
            item.x += Math.sin(item.y * 0.02 + Date.now() * 0.005) * globalSpeed;
          } else if (layer.anim === 'chaotic') {
            item.x += item.vx * globalSpeed * 0.4;
            item.y += item.vy * globalSpeed * 0.4;
            if (item.x < 0 || item.x > canvas.width) item.vx *= -1;
            if (item.y < 0 || item.y > canvas.height) item.vy *= -1;
          }
          item.rot += item.rotV * globalSpeed;
          if (item.y > canvas.height + item.size) item.y = -item.size;
          if (item.y < -item.size) item.y = canvas.height + item.size;
          if (item.x > canvas.width + item.size) item.x = -item.size;
          if (item.x < -item.size) item.x = canvas.width + item.size;

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
            if (!imageCache.current.has(layer.color)) {
              const img = new Image();
              img.src = layer.color;
              imageCache.current.set(layer.color, img);
            }
            const img = imageCache.current.get(layer.color)!;
            if (img.complete) {
              ctx.drawImage(img, -item.size / 2, -item.size / 2, item.size, item.size);
            }
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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const slideHeight = container.clientHeight;
      const newIndex = Math.round(scrollTop / slideHeight);
      if (newIndex !== currentSlide && newIndex >= 0 && newIndex < slides.length) {
        setCurrentSlide(newIndex);
      }
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [currentSlide, slides.length]);

  const scrollToSlide = (index: number) => {
    containerRef.current?.scrollTo({ top: index * window.innerHeight, behavior: 'smooth' });
  };

  const addSlide = () => {
    setSlides(prev => [...prev, { id: Date.now().toString(), content: { type: 'doc', content: [{ type: 'paragraph' }] }, html: '<p></p>' }]);
  };
  const removeSlide = () => {
    if (slides.length <= 1) return;
    setSlides(prev => prev.filter((_, i) => i !== currentSlide));
    if (currentSlide >= slides.length - 1) setCurrentSlide(slides.length - 2);
  };

  const updateSlideContent = (id: string, json: any, html: string) => {
    setSlides(prev => prev.map(s => s.id === id ? { ...s, content: json, html } : s));
  };

  const cardInline: React.CSSProperties = {
    background: cardStyle.bg,
    width: cardStyle.shape === 'circle' ? cardStyle.radius * 2 + 'px' : cardStyle.width,
    height: cardStyle.shape === 'circle' ? cardStyle.radius * 2 + 'px' : cardStyle.height,
    borderRadius: cardStyle.shape === 'circle' ? '50%' : cardStyle.radius,
    border: `${cardStyle.borderWidth}px solid ${cardStyle.borderColor}`,
    fontFamily: cardStyle.font,
    color: cardStyle.textColor,
    overflow: 'hidden',
    aspectRatio: cardStyle.shape === 'circle' ? '1' : 'auto',
  };

  // Компонент SlideEditor использует useEditor и синхронизирует JSON+HTML
  const SlideEditor: React.FC<{ slide: SlideData; isActive: boolean; onActivate: () => void }> = ({ slide, isActive, onActivate }) => {
    const editor = useEditor({
      extensions: [StarterKit, Placeholder.configure({ placeholder: 'Введите текст...' })],
      content: slide.content,
      editable: isActive,
      onUpdate: ({ editor }) => {
        const json = editor.getJSON();
        const html = editor.getHTML();
        updateSlideContent(slide.id, json, html);
      },
      editorProps: {
        attributes: {
          class: 'tiptap-editor',
        },
      },
    });

    if (!editor) return null;

    return (
      <div className={`slide-card ${isActive ? 'active' : ''}`} style={cardInline} onClick={onActivate}>
        {isActive && (
          <div className="formatting-toolbar">
            <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''}><b>B</b></button>
            <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''}><i>I</i></button>
            <button onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'is-active' : ''}><s>S</s></button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}>H1</button>
            <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}>H2</button>
            <button onClick={() => editor.chain().focus().toggleBulletList().run()}>•</button>
            <button onClick={() => editor.chain().focus().toggleOrderedList().run()}>1.</button>
          </div>
        )}
        <EditorContent editor={editor} />
      </div>
    );
  };

  const updateLayer = (id: string, patch: Partial<Layer>) => {
    setLayers(prev => prev.map(l => {
      if (l.id !== id) return l;
      const updated = { ...l, ...patch };
      if (patch.count !== undefined || patch.minSize !== undefined || patch.maxSize !== undefined) {
        const w = window.innerWidth, h = window.innerHeight;
        updated.items = Array.from({ length: updated.count }, () => ({
          x: Math.random()*w, y: Math.random()*h,
          size: updated.minSize + Math.random()*(updated.maxSize-updated.minSize),
          rot: Math.random()*360, rotV: updated.rot*(Math.random()-0.5)*2,
          vx: (Math.random()-0.5)*1.5, vy: (Math.random()-0.5)*1.5
        }));
      }
      return updated;
    }));
  };

  const addLayer = () => {
    const newLayer: Layer = {
      id: Date.now().toString(), name: `Новый слой`, type: 'circle', color: '#ffaa00',
      minSize:20, maxSize:50, opacity:0.5, anim:'fallDown', rot:0.2, count:10, items:[], collapsed:false
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

  const handleExport = () => {
    const htmlContent = slides.map(s => `<section>${s.html}</section>`).join('');
    const full = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Презентация</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css"><style>body{margin:0;overflow:hidden;background:#f0f0f0;font-family:sans-serif}section{display:flex;align-items:center;justify-content:center;height:100vh;padding:2em}</style></head><body>${htmlContent}</body></html>`;
    const blob = new Blob([full], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'presentation.html';
    a.click();
  };

  return (
    <div className="presentation-editor">
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
            <label>Карточка</label>
            <label>Цвет фона</label>
            <input type="color" value={cardStyle.bg} onChange={e => setCardStyle(p => ({...p, bg: e.target.value}))} />
            <label>Ширина</label>
            <input type="text" value={cardStyle.width} onChange={e => setCardStyle(p => ({...p, width: e.target.value}))} />
            <label>Форма</label>
            <select value={cardStyle.shape} onChange={e => setCardStyle(p => ({...p, shape: e.target.value}))}>
              <option value="rounded">Скруглённая</option>
              <option value="circle">Круг</option>
              <option value="oval">Овал</option>
            </select>
            <label>Радиус</label>
            <input type="number" value={cardStyle.radius} onChange={e => setCardStyle(p => ({...p, radius: +e.target.value}))} />
            <label>Обводка (px)</label>
            <input type="number" value={cardStyle.borderWidth} onChange={e => setCardStyle(p => ({...p, borderWidth: +e.target.value}))} />
            <label>Цвет обводки</label>
            <input type="color" value={cardStyle.borderColor} onChange={e => setCardStyle(p => ({...p, borderColor: e.target.value}))} />
            <label>Шрифт</label>
            <select value={cardStyle.font} onChange={e => setCardStyle(p => ({...p, font: e.target.value}))}>
              <option value="'Segoe UI', sans-serif">Segoe UI</option>
              <option value="'Roboto', sans-serif">Roboto</option>
              <option value="'Playfair Display', serif">Playfair Display</option>
              <option value="'Montserrat', sans-serif">Montserrat</option>
            </select>
            <label>Цвет текста</label>
            <input type="color" value={cardStyle.textColor} onChange={e => setCardStyle(p => ({...p, textColor: e.target.value}))} />
          </div>
          <div className="section">
            <label>Слои фона</label>
            <button onClick={addLayer}><i className="fas fa-plus"/> Добавить</button>
            <div className="layers-list">
              {layers.map(layer => (
                <div key={layer.id} className="layer-panel">
                  <div className="layer-header" onClick={() => updateLayer(layer.id, { collapsed: !layer.collapsed })}>
                    <span>{layer.name}</span>
                    <div>
                      <button onClick={e => { e.stopPropagation(); removeLayer(layer.id); }} className="secondary"><i className="fas fa-trash"/></button>
                      <i className={`fas ${layer.collapsed ? 'fa-chevron-down' : 'fa-chevron-up'}`} />
                    </div>
                  </div>
                  {!layer.collapsed && (
                    <div className="layer-details">
                      <label>Название</label>
                      <input type="text" value={layer.name} onChange={e => updateLayer(layer.id, { name: e.target.value })} />
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
                      {layer.type !== 'image' && <label>Цвет</label>}
                      {layer.type === 'image' && <button onClick={() => handleLayerImage(layer.id)}>Загрузить PNG</button>}
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
                        <option value="fallLeft">Падение влево</option>
                        <option value="fallRight">Падение вправо</option>
                        <option value="diagonalTL">Диагональ ↖</option>
                        <option value="diagonalTR">Диагональ ↗</option>
                        <option value="float">Парение</option>
                        <option value="zigzag">Зигзаг</option>
                        <option value="rotateOnly">Вращение</option>
                        <option value="chaotic">Хаос</option>
                      </select>
                      <label>Вращение</label>
                      <input type="range" min="0" max="2" step="0.1" value={layer.rot} onChange={e => updateLayer(layer.id, { rot: +e.target.value })} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <label>Общая скорость</label>
            <input type="range" min="0.1" max="2" step="0.1" value={globalSpeed} onChange={e => setGlobalSpeed(+e.target.value)} />
          </div>
          <button onClick={handleExport} className="export-btn"><i className="fas fa-download"/> Экспорт HTML</button>
        </div>

        {/* Область слайдов */}
        <div className="slides-viewport" ref={containerRef}>
          <div className="slides-container">
            {slides.map((slide, index) => (
              <div className="slide" key={slide.id} ref={el => slideRefs.current[index] = el}>
                <SlideEditor
                  slide={slide}
                  isActive={activeSlideId === slide.id}
                  onActivate={() => setActiveSlideId(slide.id)}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="indicators">
          {slides.map((_, i) => (
            <div key={i} className={`indicator ${i === currentSlide ? 'active' : ''}`} onClick={() => scrollToSlide(i)} />
          ))}
        </div>
      </div>
    </div>
  );
};

export { PresentationEditorPage };

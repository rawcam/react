// src/pages/PresentationEditorPage.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import EmblaCarousel from 'embla-carousel-react';
import './PresentationEditorPage.css';

// Типы для слайдов и слоёв
interface SlideData {
  id: string;
  html: string;
}

interface Layer {
  id: string;
  name: string;
  type: 'circle' | 'icon';
  color: string;
  minSize: number;
  maxSize: number;
  opacity: number;
  anim: string;
  rot: number;
  count: number;
  items: { x: number; y: number; size: number; rot: number; rotV: number; vx: number; vy: number }[];
}

// Иконки (юникоды Font Awesome)
const ICON_MAP: Record<string, number> = {
  'fa-heart': 0xf004, 'fa-star': 0xf005, 'fa-cloud': 0xf0c2, 'fa-bolt': 0xf0e7,
  'fa-music': 0xf001, 'fa-camera': 0xf030, 'fa-smile': 0xf118, 'fa-fire': 0xf06d,
  'fa-leaf': 0xf06c, 'fa-rocket': 0xf135, 'fa-gem': 0xf3a5, 'fa-crown': 0xf521
};

const INITIAL_SLIDES: SlideData[] = [
  { id: '1', html: '<h1>Добро пожаловать!</h1><p>Это редактор презентаций Sputnik Studio.</p>' },
  { id: '2', html: '<h2>Второй слайд</h2><p>Дважды кликните, чтобы редактировать текст.</p>' }
];

const DEFAULT_LAYERS: Layer[] = [
  {
    id: '1', name: 'Слой 1', type: 'circle', color: '#5b8c42', minSize: 30, maxSize: 60,
    opacity: 0.6, anim: 'fallDown', rot: 0.4, count: 10, items: []
  },
  {
    id: '2', name: 'Слой 2', type: 'icon', color: '#e63950', minSize: 40, maxSize: 70,
    opacity: 0.7, anim: 'fallDown', rot: 0.3, count: 8, items: []
  }
];

export const PresentationEditorPage: React.FC = () => {
  const [slides, setSlides] = useState<SlideData[]>(INITIAL_SLIDES);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [layers, setLayers] = useState<Layer[]>(DEFAULT_LAYERS);
  const [globalSpeed, setGlobalSpeed] = useState(0.8);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [emblaRef, emblaApi] = EmblaCarousel({ loop: false, align: 'start', skipSnaps: false });

  // Инициализация частиц слоёв
  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    setLayers(prev => prev.map(l => ({
      ...l,
      items: Array.from({ length: l.count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        size: l.minSize + Math.random() * (l.maxSize - l.minSize),
        rot: Math.random() * 360,
        rotV: l.rot * (Math.random() - 0.5) * 2,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
      }))
    })));
  }, []);

  // Анимация фона
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255,255,255,0.02)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      layers.forEach(layer => {
        layer.items.forEach(item => {
          item.y += (layer.anim === 'fallDown' ? 1 : layer.anim === 'fallUp' ? -1 : 0) * globalSpeed * 0.8;
          item.x += item.vx * globalSpeed * 0.3;
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
          } else {
            const code = ICON_MAP[layer.color] || 0xf004;
            ctx.font = `${item.size}px "Font Awesome 6 Free"`;
            ctx.fillStyle = layer.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String.fromCharCode(code), 0, 0);
          }
          ctx.restore();
        });
      });
      animationRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [layers, globalSpeed]);

  // Синхронизация Embla с состоянием
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setCurrentSlide(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi]);

  const addSlide = () => {
    const newId = Date.now().toString();
    setSlides(prev => [...prev, { id: newId, html: '<h2>Новый слайд</h2><p>Описание</p>' }]);
  };

  const removeSlide = () => {
    if (slides.length <= 1) return;
    setSlides(prev => prev.filter((_, i) => i !== currentSlide));
  };

  const updateSlideContent = useCallback((id: string, html: string) => {
    setSlides(prev => prev.map(s => s.id === id ? { ...s, html } : s));
  }, []);

  const handleExport = () => {
    // Экспорт в HTML с анимацией
    const styles = document.querySelector('style')?.innerHTML || '';
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${styles}</style></head><body>${slides.map(s => `<div>${s.html}</div>`).join('')}<script>/* анимация */</script></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'presentation.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="presentation-editor">
      <canvas ref={canvasRef} className="bg-canvas" />
      <div className="editor-layout">
        <div className="toolbar">
          <button className="btn-secondary" onClick={addSlide}><i className="fas fa-plus"></i> Слайд</button>
          <button className="btn-secondary" onClick={removeSlide}><i className="fas fa-minus"></i> Удалить</button>
          <button className="btn-primary" onClick={handleExport}><i className="fas fa-download"></i> Экспорт HTML</button>
          <input type="range" min="0.1" max="2" step="0.1" value={globalSpeed} onChange={e => setGlobalSpeed(+e.target.value)} />
        </div>
        <div className="slides-viewport" ref={emblaRef}>
          <div className="slides-container">
            {slides.map(slide => (
              <div className="slide" key={slide.id}>
                <div
                  className={`slide-card ${activeSlideId === slide.id ? 'active' : ''}`}
                  contentEditable={activeSlideId === slide.id}
                  suppressContentEditableWarning
                  dangerouslySetInnerHTML={{ __html: slide.html }}
                  onDoubleClick={() => setActiveSlideId(slide.id)}
                  onBlur={(e) => {
                    updateSlideContent(slide.id, e.currentTarget.innerHTML);
                    setActiveSlideId(null);
                  }}
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
  );
};

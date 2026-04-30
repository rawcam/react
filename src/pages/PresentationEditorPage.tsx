// src/pages/PresentationEditorPage.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import EmblaCarousel from 'embla-carousel-react';
import './PresentationEditorPage.css';

// Типы данных
interface SlideData {
  id: string;
  html: string;
}

interface Layer {
  id: string;
  name: string;
  type: 'circle' | 'icon' | 'image';
  color: string;        // цвет для circle, название иконки или dataURL изображения
  minSize: number;
  maxSize: number;
  opacity: number;
  anim: string;          // fallDown, fallUp, float...
  rot: number;
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

// Стандартные иконки Font Awesome с кодами
const ICONS: Record<string, number> = {
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
    id: '1', name: 'Слой 1', type: 'circle', color: '#5b8c42',
    minSize: 30, maxSize: 60, opacity: 0.6, anim: 'fallDown', rot: 0.4, count: 10, items: []
  },
  {
    id: '2', name: 'Слой 2', type: 'icon', color: 'fa-heart',
    minSize: 40, maxSize: 70, opacity: 0.7, anim: 'fallDown', rot: 0.3, count: 8, items: []
  }
];

const PresentationEditorPage: React.FC = () => {
  // Слайды
  const [slides, setSlides] = useState<SlideData[]>(DEFAULT_SLIDES);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Слои фона
  const [layers, setLayers] = useState<Layer[]>(DEFAULT_LAYERS);
  const [globalSpeed, setGlobalSpeed] = useState(0.8);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  // Карточка
  const [cardStyle, setCardStyle] = useState({
    bg: '#ffffff', width: '100%', height: 'auto', shape: 'rounded',
    radius: 28, borderWidth: 2, borderColor: 'rgba(0,0,0,0.05)',
    font: "'Segoe UI', sans-serif", textColor: '#333333'
  });

  // Карусель (Embla)
  const [emblaRef, emblaApi] = EmblaCarousel({ loop: false, align: 'start', skipSnaps: false });

  // Инициализация частиц слоёв при монтировании и изменении размеров
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

  // Анимация канваса
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
      // Заливка фона
      ctx.fillStyle = 'rgba(255,255,255,0.02)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      layers.forEach(layer => {
        layer.items.forEach(item => {
          // Движение
          if (layer.anim === 'fallDown') item.y += globalSpeed * 0.8;
          else if (layer.anim === 'fallUp') item.y -= globalSpeed * 0.8;
          else if (layer.anim === 'float') {
            item.x += item.vx * globalSpeed * 0.3;
            item.y += item.vy * globalSpeed * 0.3;
            if (item.x < 0 || item.x > canvas.width) item.vx *= -1;
            if (item.y < 0 || item.y > canvas.height) item.vy *= -1;
          }
          item.rot += item.rotV * globalSpeed;
          // Зацикливание
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
            const code = ICONS[layer.color] || 0xf004;
            ctx.font = `${item.size}px "Font Awesome 6 Free"`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#000'; // иконки рисуются черным, но можно задать в слое
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

  // Синхронизация Embla
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setCurrentSlide(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi]);

  // Обработчики слайдов
  const addSlide = () => {
    setSlides(prev => [...prev, { id: Date.now().toString(), html: '<h2>Новый слайд</h2><p>Описание</p>' }]);
  };
  const removeSlide = () => {
    setSlides(prev => prev.length > 1 ? prev.filter((_, i) => i !== currentSlide) : prev);
  };

  // Применение стилей карточки
  const cardInlineStyle: React.CSSProperties = {
    background: cardStyle.bg,
    width: cardStyle.width,
    height: cardStyle.height,
    borderRadius: cardStyle.shape === 'circle' ? '50%' : cardStyle.radius,
    border: `${cardStyle.borderWidth}px solid ${cardStyle.borderColor}`,
    fontFamily: cardStyle.font,
    color: cardStyle.textColor,
  };

  // Загрузка изображения в слой
  const handleLayerImageUpload = (layerId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        setLayers(prev => prev.map(l => l.id === layerId ? { ...l, color: reader.result as string } : l));
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  // Экспорт упрощённый (полноценный будет в следующей версии)
  const handleExport = () => {
    alert('Экспорт HTML с анимацией будет готов в React-версии.');
  };

  // Добавление нового слоя
  const addLayer = () => {
    setLayers(prev => [...prev, {
      id: Date.now().toString(),
      name: `Слой ${prev.length + 1}`,
      type: 'circle',
      color: '#000000',
      minSize: 20,
      maxSize: 50,
      opacity: 0.5,
      anim: 'fallDown',
      rot: 0.2,
      count: 10,
      items: []
    }]);
    initLayerItems();
  };

  // Удаление слоя
  const removeLayer = (id: string) => setLayers(prev => prev.filter(l => l.id !== id));

  // Редактируемая карточка
  const handleSlideDoubleClick = (id: string) => setActiveSlideId(id);
  const handleSlideBlur = (id: string, e: React.FocusEvent<HTMLDivElement>) => {
    setSlides(prev => prev.map(s => s.id === id ? { ...s, html: e.currentTarget.innerHTML } : s));
    setActiveSlideId(null);
  };

  // Вставка медиа в слайд (используем execCommand)
  const insertImageToSlide = () => {
    const url = prompt('URL изображения:');
    if (url) document.execCommand('insertImage', false, url);
  };
  const insertVideoToSlide = () => {
    const url = prompt('URL видео (YouTube/Vimeo):');
    if (url) {
      const iframe = `<iframe width="560" height="315" src="${url}" frameborder="0" allowfullscreen></iframe>`;
      document.execCommand('insertHTML', false, iframe);
    }
  };

  return (
    <div className="presentation-editor">
      <canvas ref={canvasRef} className="bg-canvas" />

      <div className="editor-layout">
        {/* Сайдбар настроек */}
        <div className="sidebar">
          <h3>Настройки презентации</h3>

          <div className="section">
            <label>Слайды</label>
            <button onClick={addSlide}><i className="fas fa-plus"></i> Добавить слайд</button>
            <button onClick={removeSlide} className="secondary"><i className="fas fa-minus"></i> Удалить слайд</button>
          </div>

          <div className="section">
            <label>Карточка</label>
            <label>Цвет фона</label>
            <input type="color" value={cardStyle.bg} onChange={e => setCardStyle(prev => ({ ...prev, bg: e.target.value }))} />
            <label>Ширина</label>
            <input type="text" value={cardStyle.width} onChange={e => setCardStyle(prev => ({ ...prev, width: e.target.value }))} />
            <label>Форма</label>
            <select value={cardStyle.shape} onChange={e => setCardStyle(prev => ({ ...prev, shape: e.target.value }))}>
              <option value="rounded">Скруглённая</option>
              <option value="circle">Круг</option>
              <option value="oval">Овал</option>
            </select>
            <label>Радиус</label>
            <input type="number" value={cardStyle.radius} onChange={e => setCardStyle(prev => ({ ...prev, radius: +e.target.value }))} />
            <label>Обводка (px)</label>
            <input type="number" value={cardStyle.borderWidth} onChange={e => setCardStyle(prev => ({ ...prev, borderWidth: +e.target.value }))} />
            <label>Цвет обводки</label>
            <input type="text" value={cardStyle.borderColor} onChange={e => setCardStyle(prev => ({ ...prev, borderColor: e.target.value }))} />
            <label>Шрифт</label>
            <select value={cardStyle.font} onChange={e => setCardStyle(prev => ({ ...prev, font: e.target.value }))}>
              <option value="'Segoe UI', sans-serif">Segoe UI</option>
              <option value="'Roboto', sans-serif">Roboto</option>
              <option value="'Playfair Display', serif">Playfair Display</option>
              <option value="'Montserrat', sans-serif">Montserrat</option>
            </select>
            <label>Цвет текста</label>
            <input type="color" value={cardStyle.textColor} onChange={e => setCardStyle(prev => ({ ...prev, textColor: e.target.value }))} />
          </div>

          <div className="section">
            <label>Слои фона</label>
            <button onClick={addLayer}><i className="fas fa-plus"></i> Добавить слой</button>
            {layers.map(layer => (
              <div key={layer.id} className="layer-item">
                <span>{layer.name}</span>
                <button onClick={() => removeLayer(layer.id)} className="secondary"><i className="fas fa-trash"></i></button>
                {layer.type === 'image' && <button onClick={() => handleLayerImageUpload(layer.id)}>Загрузить</button>}
              </div>
            ))}
            <label>Общая скорость</label>
            <input type="range" min="0.1" max="2" step="0.1" value={globalSpeed} onChange={e => setGlobalSpeed(+e.target.value)} />
          </div>

          <button onClick={handleExport} className="export-btn"><i className="fas fa-download"></i> Экспорт HTML</button>
        </div>

        {/* Область слайдов */}
        <div className="slides-area">
          <div className="slides-toolbar">
            <button onClick={insertImageToSlide}><i className="fas fa-image"></i> Изображение</button>
            <button onClick={insertVideoToSlide}><i className="fas fa-video"></i> Видео</button>
          </div>
          <div className="slides-viewport" ref={emblaRef}>
            <div className="slides-container">
              {slides.map((slide, index) => (
                <div className="slide" key={slide.id}>
                  <div
                    className={`slide-card ${activeSlideId === slide.id ? 'active' : ''}`}
                    contentEditable={activeSlideId === slide.id}
                    suppressContentEditableWarning
                    dangerouslySetInnerHTML={{ __html: slide.html }}
                    style={cardInlineStyle}
                    onDoubleClick={() => handleSlideDoubleClick(slide.id)}
                    onBlur={(e) => handleSlideBlur(slide.id, e)}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="indicators">
            {slides.map((_, i) => (
              <div key={i} className={`indicator ${i === currentSlide ? 'active' : ''}`}
                   onClick={() => emblaApi?.scrollTo(i)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresentationEditorPage;

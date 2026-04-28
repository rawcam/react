// src/utils/tractCalculations.ts
import { VideoState } from '../store/videoSlice';
import { NetworkState } from '../store/networkSlice';

export const getResolutionFactor = (settings: VideoState): number => {
  const map: Record<string, number> = { '1080p': 1.0, '4K': 1.5, '8K': 2.5 };
  return map[settings.resolution] || 1.0;
};

export const getChromaFactor = (settings: VideoState): number => {
  const map: Record<string, number> = { '444': 1.2, '422': 1.0, '420': 0.9 };
  return map[settings.chroma] || 1.0;
};

export const getColorSpaceFactor = (settings: VideoState): number => {
  return settings.colorSpace === 'RGB' ? 1.2 : 1.0;
};

export const getBitDepthFactor = (settings: VideoState): number => {
  return (settings.bitDepth || 8) / 10;
};

export const calcVideoBitrate = (settings: VideoState): number => {
  let base = 1000;
  if (settings.resolution === '1080p') base = 300;
  if (settings.resolution === '8K') base = 4000;
  base *= getChromaFactor(settings);
  base *= getColorSpaceFactor(settings);
  base *= getBitDepthFactor(settings);
  base *= (settings.fps / 60);
  return base;
};

// Полный список моделей устройств (как в старом Utils.modelDB)
export const DEVICE_MODELS = {
  source: [
    { name: "Типовой ПК", latency: 5, poe: false, powerW: 200, icon: "fa-desktop", hasNetwork: true, shortPrefix: "PC" },
    { name: "Видеосервер", latency: 8, poe: false, powerW: 300, icon: "fa-server", hasNetwork: true, shortPrefix: "SRV" },
    { name: "Камера PTZ", latency: 3, poe: true, poePower: 30, powerW: 30, icon: "fa-camera", hasNetwork: true, shortPrefix: "CAM" },
    { name: "Медиаплеер", latency: 4, poe: false, powerW: 15, icon: "fa-play-circle", hasNetwork: true, shortPrefix: "MP" }
  ],
  tx: [
    { name: "SDVoE", latency: 0.3, usb: false, usbVersion: "2.0", audioEmbed: 1.0, bitrateFactor: 0.8, poe: true, poePower: 15, powerW: 15, icon: "fa-arrow-up", hasNetwork: true, shortPrefix: "TX" },
    { name: "HDBaseT", latency: 0.1, usb: false, usbVersion: "2.0", audioEmbed: 0.5, bitrateFactor: 0.9, poe: false, powerW: 13, icon: "fa-arrow-up", hasNetwork: false, shortPrefix: "TX" },
    { name: "Оптика", latency: 0.05, usb: false, usbVersion: "2.0", audioEmbed: 0.2, bitrateFactor: 1.0, poe: false, powerW: 5, icon: "fa-arrow-up", hasNetwork: false, shortPrefix: "TX" },
    { name: "NDI|HX", latency: 25, usb: false, usbVersion: "2.0", audioEmbed: 2.0, bitrateFactor: 0.3, poe: true, poePower: 10, powerW: 10, icon: "fa-arrow-up", hasNetwork: true, shortPrefix: "TX" },
    { name: "H.264", latency: 15, usb: false, usbVersion: "2.0", audioEmbed: 1.5, bitrateFactor: 0.4, poe: true, poePower: 12, powerW: 12, icon: "fa-arrow-up", hasNetwork: true, shortPrefix: "TX" },
    { name: "H.265", latency: 20, usb: false, usbVersion: "2.0", audioEmbed: 2.0, bitrateFactor: 0.35, poe: true, poePower: 12, powerW: 12, icon: "fa-arrow-up", hasNetwork: true, shortPrefix: "TX" },
    { name: "MJPEG", latency: 3, usb: false, usbVersion: "2.0", audioEmbed: 0.5, bitrateFactor: 0.7, poe: true, poePower: 8, powerW: 8, icon: "fa-arrow-up", hasNetwork: true, shortPrefix: "TX" },
    { name: "SDI", latency: 0.02, usb: false, usbVersion: "2.0", audioEmbed: 0, bitrateFactor: 1.0, poe: false, powerW: 4, icon: "fa-arrow-up", hasNetwork: false, shortPrefix: "TX" },
    { name: "Dante AV", latency: 1.5, usb: false, usbVersion: "2.0", audioEmbed: 2.0, bitrateFactor: 0.8, poe: true, poePower: 10, powerW: 10, icon: "fa-arrow-up", hasNetwork: true, shortPrefix: "TX" }
  ],
  rx: [
    { name: "SDVoE", latency: 0.3, usb: false, usbVersion: "2.0", audioEmbed: 1.0, bitrateFactor: 0.8, poe: true, poePower: 15, powerW: 15, icon: "fa-arrow-down", hasNetwork: true, shortPrefix: "RX" },
    { name: "HDBaseT", latency: 0.1, usb: false, usbVersion: "2.0", audioEmbed: 0.5, bitrateFactor: 0.9, poe: false, powerW: 13, icon: "fa-arrow-down", hasNetwork: false, shortPrefix: "RX" },
    { name: "Оптика", latency: 0.05, usb: false, usbVersion: "2.0", audioEmbed: 0.2, bitrateFactor: 1.0, poe: false, powerW: 5, icon: "fa-arrow-down", hasNetwork: false, shortPrefix: "RX" },
    { name: "NDI|HX", latency: 25, usb: false, usbVersion: "2.0", audioEmbed: 2.0, bitrateFactor: 0.3, poe: true, poePower: 10, powerW: 10, icon: "fa-arrow-down", hasNetwork: true, shortPrefix: "RX" },
    { name: "H.264", latency: 15, usb: false, usbVersion: "2.0", audioEmbed: 1.5, bitrateFactor: 0.4, poe: true, poePower: 12, powerW: 12, icon: "fa-arrow-down", hasNetwork: true, shortPrefix: "RX" },
    { name: "H.265", latency: 20, usb: false, usbVersion: "2.0", audioEmbed: 2.0, bitrateFactor: 0.35, poe: true, poePower: 12, powerW: 12, icon: "fa-arrow-down", hasNetwork: true, shortPrefix: "RX" },
    { name: "MJPEG", latency: 3, usb: false, usbVersion: "2.0", audioEmbed: 0.5, bitrateFactor: 0.7, poe: true, poePower: 8, powerW: 8, icon: "fa-arrow-down", hasNetwork: true, shortPrefix: "RX" },
    { name: "SDI", latency: 0.02, usb: false, usbVersion: "2.0", audioEmbed: 0, bitrateFactor: 1.0, poe: false, powerW: 4, icon: "fa-arrow-down", hasNetwork: false, shortPrefix: "RX" },
    { name: "Dante AV", latency: 1.5, usb: false, usbVersion: "2.0", audioEmbed: 2.0, bitrateFactor: 0.8, poe: true, poePower: 10, powerW: 10, icon: "fa-arrow-down", hasNetwork: true, shortPrefix: "RX" }
  ],
  matrix: [
    { name: "Без обработки 4x4", inputs: 4, outputs: 4, latencyIn: 0.1, latencyOut: 0.1, powerW: 50, icon: "fa-project-diagram", hasNetwork: true, shortPrefix: "MX" },
    { name: "Без обработки 8x8", inputs: 8, outputs: 8, latencyIn: 0.1, latencyOut: 0.1, powerW: 50, icon: "fa-project-diagram", hasNetwork: true, shortPrefix: "MX" },
    { name: "С масштабированием 16x16", inputs: 16, outputs: 16, latencyIn: 8, latencyOut: 8, powerW: 120, icon: "fa-project-diagram", hasNetwork: true, shortPrefix: "MX" },
    { name: "Бесшовная (seamless) 16x16", inputs: 16, outputs: 16, latencyIn: 12, latencyOut: 12, powerW: 150, icon: "fa-project-diagram", hasNetwork: true, shortPrefix: "MX" },
    { name: "Extron XTP 16x16", inputs: 16, outputs: 16, latencyIn: 4, latencyOut: 4, powerW: 200, icon: "fa-project-diagram", hasNetwork: true, shortPrefix: "MX" },
    { name: "Lightware MX 16x16", inputs: 16, outputs: 16, latencyIn: 2, latencyOut: 2, powerW: 180, icon: "fa-project-diagram", hasNetwork: true, shortPrefix: "MX" }
  ],
  networkSwitch: [
    { name: "Управляемый L2, 24 порта, 1 Гбит/с, без PoE", ports: 24, speed: 1000, backplane: 48, poeBudget: 0, switchingLatency: 0.2, powerW: 50, shortPrefix: "SW" },
    { name: "Управляемый L2, 48 портов, 1 Гбит/с, без PoE", ports: 48, speed: 1000, backplane: 96, poeBudget: 0, switchingLatency: 0.2, powerW: 80, shortPrefix: "SW" },
    { name: "Управляемый L3, 24 порта, 10 Гбит/с, без PoE", ports: 24, speed: 10000, backplane: 240, poeBudget: 0, switchingLatency: 0.15, powerW: 100, shortPrefix: "SW" },
    { name: "PoE-коммутатор, 24 порта, 1 Гбит/с, 802.3af (15.4 Вт/порт)", ports: 24, speed: 1000, backplane: 48, poeBudget: 370, switchingLatency: 0.2, powerW: 150, shortPrefix: "SW" },
    { name: "PoE-коммутатор, 48 портов, 1 Гбит/с, 802.3at (30 Вт/порт)", ports: 48, speed: 1000, backplane: 96, poeBudget: 1440, switchingLatency: 0.2, powerW: 250, shortPrefix: "SW" },
    { name: "PoE-коммутатор, 24 порта, 10 Гбит/с, 802.3bt (90 Вт/порт)", ports: 24, speed: 10000, backplane: 240, poeBudget: 2160, switchingLatency: 0.15, powerW: 300, shortPrefix: "SW" },
    { name: "Неуправляемый, 8 портов, 1 Гбит/с", ports: 8, speed: 1000, backplane: 16, poeBudget: 0, switchingLatency: 0.25, powerW: 20, shortPrefix: "SW" }
  ],
  splitter: [
    { name: "Пассивный сплиттер", latency: 0.01, powerW: 0, icon: "fa-code-branch", hasNetwork: false, shortPrefix: "SPL" },
    { name: "Активный сплиттер", latency: 1.5, powerW: 10, icon: "fa-code-branch", hasNetwork: false, shortPrefix: "SPL" }
  ],
  switch2x1: [
    { name: "Механический", latency: 0.02, powerW: 0, icon: "fa-random", hasNetwork: false, shortPrefix: "SEL" },
    { name: "Электронный", latency: 0.5, powerW: 5, icon: "fa-random", hasNetwork: false, shortPrefix: "SEL" }
  ],
  ledProc: [
    { name: "NovaStar H-series", latency: 8, powerW: 50, icon: "fa-microchip", hasNetwork: true, shortPrefix: "LED" },
    { name: "Colorlight Z6", latency: 6, powerW: 60, icon: "fa-microchip", hasNetwork: true, shortPrefix: "LED" },
    { name: "Brompton Tessera", latency: 5, powerW: 80, icon: "fa-microchip", hasNetwork: true, shortPrefix: "LED" },
    { name: "Linsn LED-процессор", latency: 10, powerW: 70, icon: "fa-microchip", hasNetwork: true, shortPrefix: "LED" },
    { name: "Другое", latency: 8, powerW: 50, icon: "fa-microchip", hasNetwork: true, shortPrefix: "LED" }
  ],
  ledScreen: [
    { name: "LED P0.7", pitch: 0.7, powerPerSqm: 500, shortPrefix: "LED", icon: "fa-border-all" },
    { name: "LED P0.8", pitch: 0.8, powerPerSqm: 480, shortPrefix: "LED", icon: "fa-border-all" },
    { name: "LED P0.9", pitch: 0.9, powerPerSqm: 460, shortPrefix: "LED", icon: "fa-border-all" },
    { name: "LED P1.2", pitch: 1.2, powerPerSqm: 420, shortPrefix: "LED", icon: "fa-border-all" },
    { name: "LED P1.5", pitch: 1.5, powerPerSqm: 390, shortPrefix: "LED", icon: "fa-border-all" },
    { name: "LED P1.56", pitch: 1.56, powerPerSqm: 380, shortPrefix: "LED", icon: "fa-border-all" },
    { name: "LED P2.5", pitch: 2.5, powerPerSqm: 350, shortPrefix: "LED", icon: "fa-border-all" },
    { name: "LED P3.91", pitch: 3.91, powerPerSqm: 320, shortPrefix: "LED", icon: "fa-border-all" },
    { name: "LED P4.8", pitch: 4.8, powerPerSqm: 300, shortPrefix: "LED", icon: "fa-border-all" },
    { name: "LED P6.25", pitch: 6.25, powerPerSqm: 280, shortPrefix: "LED", icon: "fa-border-all" },
    { name: "LED P10", pitch: 10, powerPerSqm: 250, shortPrefix: "LED", icon: "fa-border-all" }
  ],
  display: [
    { name: "Игровой монитор", latency: 4, powerW: 50, icon: "fa-desktop", hasNetwork: true, shortPrefix: "MON" },
    { name: "Телевизор (кино)", latency: 20, powerW: 150, icon: "fa-tv", hasNetwork: true, shortPrefix: "TV" },
    { name: "Проектор", latency: 15, powerW: 300, icon: "fa-video", hasNetwork: true, shortPrefix: "PROJ" },
    { name: "Видеостена", latency: 25, powerW: 800, icon: "fa-th", hasNetwork: true, shortPrefix: "VW" },
    { name: "LED-экран", latency: 4.5, powerW: 400, icon: "fa-border-all", hasNetwork: false, shortPrefix: "SCR" }
  ],
  dante: [
    { name: "Dante-устройство (аудио)", latency: 0.25, bitrate: 10, poe: true, poePower: 5, powerW: 5, icon: "fa-headphones", hasNetwork: true, shortPrefix: "DNT" },
    { name: "Dante AV (видео)", latency: 1.5, bitrate: 100, poe: true, poePower: 10, powerW: 10, icon: "fa-headphones", hasNetwork: true, shortPrefix: "DNT" }
  ]
};

export type DeviceModel = {
  name: string;
  latency?: number;
  poe?: boolean;
  poePower?: number;
  powerW?: number;
  icon?: string;
  hasNetwork?: boolean;
  shortPrefix: string;
  // для tx/rx
  usb?: boolean;
  usbVersion?: string;
  audioEmbed?: number;
  bitrateFactor?: number;
  // для матрицы
  inputs?: number;
  outputs?: number;
  latencyIn?: number;
  latencyOut?: number;
  // для коммутатора
  ports?: number;
  speed?: number;
  backplane?: number;
  poeBudget?: number;
  switchingLatency?: number;
  // для LED
  pitch?: number;
  powerPerSqm?: number;
  // для сплиттеров
  // для дисплеев
};

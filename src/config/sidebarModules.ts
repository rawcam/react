// src/config/sidebarModules.ts
import { VideoSection } from '../features/video/VideoSection';
import { NetworkSection } from '../features/network/NetworkSection';
import { LedSection } from '../features/led/LedSection';
import { SoundSection } from '../features/sound/SoundSection';
import { VcSection } from '../features/vc/VcSection';
import { ErgoSection } from '../features/ergo/ErgoSection';
import { PowerSection } from '../features/power/PowerSection';
import { TractsSection } from '../features/tracts/TractsSection';
import { NetworkStatsSection } from '../features/network/NetworkStatsSection';
import { PowerStatsSection } from '../features/power/PowerStatsSection';
import { ManageSection } from '../features/manage/ManageSection';

export interface SidebarModule {
  id: string;
  title: string;
  icon: string;
  component: React.ComponentType<any>;
}

export const sidebarModules: SidebarModule[] = [
  { id: 'tracts', title: 'ТРАКТЫ', icon: 'fas fa-road', component: TractsSection },
  { id: 'video', title: 'VIDEO', icon: 'fas fa-video', component: VideoSection },
  { id: 'network', title: 'NETWORK', icon: 'fas fa-network-wired', component: NetworkSection },
  { id: 'led', title: 'LED', icon: 'fas fa-border-all', component: LedSection },
  { id: 'sound', title: 'SOUND', icon: 'fas fa-headphones', component: SoundSection },
  { id: 'vc', title: 'VC (ВКС)', icon: 'fas fa-chalkboard', component: VcSection },
  { id: 'ergo', title: 'Эргономика ЭКП', icon: 'fas fa-chalkboard-user', component: ErgoSection },
  { id: 'power', title: 'ЭНЕРГИЯ', icon: 'fas fa-bolt', component: PowerSection },
  { id: 'networkStats', title: 'СЕТЬ', icon: 'fas fa-chart-line', component: NetworkStatsSection },
  { id: 'powerStats', title: 'ПИТАНИЕ', icon: 'fas fa-bolt', component: PowerStatsSection },
  { id: 'manage', title: 'УПРАВЛЕНИЕ', icon: 'fas fa-cog', component: ManageSection },
];

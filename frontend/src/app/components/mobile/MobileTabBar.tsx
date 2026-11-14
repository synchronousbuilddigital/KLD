import React from 'react';
import { Home, Box, Layers, Wand2, Folder } from 'lucide-react';

export type MobileTab = 'home' | 'models' | 'ai' | 'studio' | 'workspace' | 'dielines' | 'profile';

interface MobileTabBarProps {
  activeTab: MobileTab;
  onChangeTab: (tab: MobileTab) => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({ activeTab, onChangeTab }) => {
  const tabs = [
    { id: 'home' as MobileTab, label: 'Home', icon: Home },
    { id: 'models' as MobileTab, label: '3D Models', icon: Box },
    { id: 'ai' as MobileTab, label: 'AI Studio', icon: Layers, isCenter: true },
    { id: 'studio' as MobileTab, label: '3D Studio', icon: Wand2 },
    { id: 'workspace' as MobileTab, label: 'Workspace', icon: Folder },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] pb-[max(env(safe-area-inset-bottom,8px),8px)] pt-1.5 px-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isCenter) {
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className="relative -top-3 flex flex-col items-center justify-center cursor-pointer group"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-95 ${
                  isActive
                    ? 'bg-zinc-950 text-white ring-4 ring-zinc-200/80 shadow-zinc-950/25 border border-zinc-700/60'
                    : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 shadow-zinc-900/20 border border-zinc-800'
                }`}>
                  <Icon className={`w-5 h-5 text-white ${isActive ? 'scale-105' : ''}`} />
                </div>
                <span className={`text-[10px] mt-1 ${isActive ? 'text-zinc-950 font-extrabold' : 'text-zinc-600 font-semibold'}`}>
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors cursor-pointer active:scale-95 ${
                isActive ? 'text-zinc-950' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-zinc-950 stroke-[2.2]' : 'text-zinc-500 stroke-[1.8]'}`} />
              <span className={`text-[10px] mt-1 ${isActive ? 'text-zinc-950 font-bold' : 'text-zinc-500 font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileTabBar;

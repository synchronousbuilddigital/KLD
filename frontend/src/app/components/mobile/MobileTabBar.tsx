import React from 'react';
import { Home, Box, Layers, User, Wand2 } from 'lucide-react';

export type MobileTab = 'home' | 'models' | 'studio' | 'dielines' | 'profile';

interface MobileTabBarProps {
  activeTab: MobileTab;
  onChangeTab: (tab: MobileTab) => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({ activeTab, onChangeTab }) => {
  const tabs = [
    { id: 'home' as MobileTab, label: 'Home', icon: Home },
    { id: 'models' as MobileTab, label: '3D Models', icon: Box },
    { id: 'studio' as MobileTab, label: 'Studio', icon: Wand2, isCenter: true },
    { id: 'dielines' as MobileTab, label: 'Dielines', icon: Layers },
    { id: 'profile' as MobileTab, label: 'Account', icon: User },
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
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                  isActive
                    ? 'bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white ring-4 ring-indigo-100'
                    : 'bg-zinc-950 text-white hover:bg-zinc-800'
                }`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className={`text-[10px] font-bold mt-1 ${isActive ? 'text-indigo-600' : 'text-zinc-500'}`}>
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
                isActive ? 'text-indigo-600' : 'text-zinc-600 hover:text-zinc-600'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className={`text-[10px] mt-1 font-semibold ${isActive ? 'text-zinc-900 font-bold' : 'text-zinc-600'}`}>
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

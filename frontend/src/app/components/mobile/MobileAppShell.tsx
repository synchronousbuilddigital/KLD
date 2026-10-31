import React, { useState } from 'react';
import MobileHeader from './MobileHeader';
import MobileTabBar, { MobileTab } from './MobileTabBar';
import MobileHomeTab from './MobileHomeTab';
import MobileModelsTab from './MobileModelsTab';
import MobileDielinesTab from './MobileDielinesTab';
import MobileStudioTab from './MobileStudioTab';
import MobileWorkspaceTab from './MobileWorkspaceTab';
import MobileProfileTab from './MobileProfileTab';
import MobileModelDetailSheet from './MobileModelDetailSheet';
import { MockupVariant } from '../../data/mockupData';

interface MobileAppShellProps {
  onSwitchToDesktop: () => void;
  onOpenSignIn: () => void;
  initialCategoryId?: string | null;
  initialModelKey?: string | null;
}

export const MobileAppShell: React.FC<MobileAppShellProps> = ({
  onSwitchToDesktop,
  onOpenSignIn,
  initialCategoryId,
  initialModelKey,
}) => {
  const getInitialModelKey = () => {
    if (initialModelKey) return initialModelKey;
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const m = urlParams.get('model');
      if (m) return m;
      if (initialCategoryId?.includes('bottle')) return 'sipper_water_bottle';
      if (initialCategoryId?.includes('can')) return 'can';
      if (initialCategoryId?.includes('tube')) return 'tube';
    }
    return 'sipper_water_bottle';
  };

  const getInitialTab = (): MobileTab => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab') as MobileTab;
      if (['home', 'models', 'studio', 'workspace', 'dielines', 'profile'].includes(tabParam)) return tabParam;
      if (urlParams.get('model')) return 'studio';
      if (initialCategoryId) return 'models';
    }
    return 'home';
  };

  const [activeTab, setActiveTab] = useState<MobileTab>(getInitialTab);
  const [studioModelKey, setStudioModelKey] = useState<string>(getInitialModelKey);

  // Model Detail Sheet state
  const [inspectModel, setInspectModel] = useState<MockupVariant | null>(null);
  const [inspectCategoryName, setInspectCategoryName] = useState<string>('Packaging');

  const handleSelectModel = (model: MockupVariant, catName: string) => {
    setInspectModel(model);
    setInspectCategoryName(catName);
  };

  const handleOpenInStudio = (modelKey: string) => {
    setStudioModelKey(modelKey);
    setActiveTab('studio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4] flex flex-col antialiased text-zinc-900 font-sans select-none overflow-x-hidden">
      {/* Top Mobile Header with real desktop AnimatedLogo */}
      <MobileHeader
        activeTab={activeTab}
        onSearchClick={() => setActiveTab('models')}
        onSwitchToDesktop={onSwitchToDesktop}
        onOpenProfile={() => setActiveTab('profile')}
        onOpenSignIn={onOpenSignIn}
        onLogoClick={() => setActiveTab('home')}
      />

      {/* Main Tab Viewport */}
      <main className="flex-1 w-full max-w-lg mx-auto">
        {activeTab === 'home' && (
          <MobileHomeTab
            onNavigateTab={(tab) => setActiveTab(tab)}
            onSelectModel={handleSelectModel}
            onOpenInStudio={handleOpenInStudio}
          />
        )}

        {activeTab === 'models' && (
          <MobileModelsTab
            onSelectModel={handleSelectModel}
            onOpenInStudio={handleOpenInStudio}
            initialCategoryId={initialCategoryId}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'studio' && (
          <MobileStudioTab
            key={studioModelKey}
            initialModelKey={studioModelKey}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'workspace' && (
          <MobileWorkspaceTab
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenInStudio={handleOpenInStudio}
            onOpenSignIn={onOpenSignIn}
          />
        )}

        {activeTab === 'dielines' && (
          <MobileDielinesTab
            onOpenInStudio={handleOpenInStudio}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'profile' && (
          <MobileProfileTab
            onSwitchToDesktop={onSwitchToDesktop}
            onOpenSignIn={onOpenSignIn}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}
      </main>

      {/* Bottom Navigation Tab Bar */}
      <MobileTabBar
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Bottom Model Detail Sheet Drawer */}
      <MobileModelDetailSheet
        model={inspectModel}
        categoryName={inspectCategoryName}
        isOpen={Boolean(inspectModel)}
        onClose={() => setInspectModel(null)}
        onOpenInStudio={handleOpenInStudio}
      />
    </div>
  );
};

export default MobileAppShell;

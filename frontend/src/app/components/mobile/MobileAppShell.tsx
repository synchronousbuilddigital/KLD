import React, { useState } from 'react';
import MobileHeader from './MobileHeader';
import MobileTabBar, { MobileTab } from './MobileTabBar';
import MobileHomeTab from './MobileHomeTab';
import { MockupVariant } from '../../data/mockupData';

const MobileModelsTab = React.lazy(() => import('./MobileModelsTab'));
const MobileAiTab = React.lazy(() => import('./MobileAiTab'));
const MobileDielinesTab = React.lazy(() => import('./MobileDielinesTab'));
const MobileStudioTab = React.lazy(() => import('./MobileStudioTab'));
const MobileWorkspaceTab = React.lazy(() => import('./MobileWorkspaceTab'));
const MobileProfileTab = React.lazy(() => import('./MobileProfileTab'));
const MobileModelDetailSheet = React.lazy(() => import('./MobileModelDetailSheet'));

interface MobileAppShellProps {
  onSwitchToDesktop?: () => void;
  onOpenSignIn: () => void;
  initialCategoryId?: string | null;
  initialModelKey?: string | null;
}

export const MobileAppShell: React.FC<MobileAppShellProps> = ({
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
      if (['home', 'models', 'ai', 'studio', 'workspace', 'dielines', 'profile'].includes(tabParam)) return tabParam;
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

        <React.Suspense fallback={
          <div className="flex flex-col items-center justify-center p-12 text-zinc-400 gap-3 min-h-[300px]">
            <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
            <span className="text-xs font-semibold text-zinc-600">Loading tab...</span>
          </div>
        }>
          {activeTab === 'models' && (
            <MobileModelsTab
              onSelectModel={handleSelectModel}
              onOpenInStudio={handleOpenInStudio}
              initialCategoryId={initialCategoryId}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'ai' && (
            <MobileAiTab
              onOpenInStudio={handleOpenInStudio}
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
              onOpenSignIn={onOpenSignIn}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}
        </React.Suspense>
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
      {inspectModel && (
        <React.Suspense fallback={null}>
          <MobileModelDetailSheet
            model={inspectModel}
            categoryName={inspectCategoryName}
            isOpen={Boolean(inspectModel)}
            onClose={() => setInspectModel(null)}
            onOpenInStudio={handleOpenInStudio}
          />
        </React.Suspense>
      )}
    </div>
  );
};

export default MobileAppShell;

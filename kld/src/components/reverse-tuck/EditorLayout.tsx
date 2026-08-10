import React from 'react';

interface EditorLayoutProps {
  sidebarLeft: React.ReactNode;
  sidebarRight: React.ReactNode;
  workspace: React.ReactNode;
  toolbar: React.ReactNode;
  statusBar: React.ReactNode;
  navbar: React.ReactNode;
}

export const EditorLayout: React.FC<EditorLayoutProps> = ({
  sidebarLeft,
  sidebarRight,
  workspace,
  toolbar,
  statusBar,
  navbar,
}) => {
  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-50 overflow-hidden font-sans select-none">
      {/* Navbar Zone */}
      {navbar}

      {/* Main workspace splits */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Control Sidebar */}
        <div className="shrink-0 overflow-y-auto">
          {sidebarLeft}
        </div>

        {/* Central Drawing Viewport Area */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 p-5 relative gap-4 overflow-hidden">
          {/* Top workspace toolbar overlay */}
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-45 pointer-events-none flex justify-center">
            {toolbar}
          </div>

          {/* 2D Canvas Workspace */}
          {workspace}
        </div>

        {/* Right Properties Sidebar */}
        <div className="shrink-0 overflow-y-auto">
          {sidebarRight}
        </div>
      </div>

      {/* Status Bar Footer */}
      {statusBar}
    </div>
  );
};

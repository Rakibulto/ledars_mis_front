import { useState } from 'react';

export function Tabs({ tabs, defaultTab, onChange }) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };
  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;
  return (
    <div className="w-full">
      <div className="border-b border-border">
        <nav className="flex gap-6" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`relative px-1 py-3 text-sm font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="flex items-center gap-2">
                  {tab.label}
                  {tab.badge !== undefined && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                      {tab.badge}
                    </span>
                  )}
                </span>
                {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
              </button>
            );
          })}
        </nav>
      </div>
      <div className="py-6">{activeTabContent}</div>
    </div>
  );
}

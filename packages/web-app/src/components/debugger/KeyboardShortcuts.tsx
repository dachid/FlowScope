import React, { useEffect, useState } from 'react';
import { Keyboard, X, Info } from 'lucide-react';
import { useDebuggerStore } from '../../store/debugger';

interface KeyboardShortcutsProps {
  onClose?: () => void;
  className?: string;
}

interface ShortcutGroup {
  name: string;
  shortcuts: Array<{
    keys: string[];
    description: string;
    action: () => void;
  }>;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ onClose, className = '' }) => {
  const { 
    setViewMode, 
    setSidebarOpen, 
    clearTraces, 
    clearFilters,
    sidebarOpen 
  } = useDebuggerStore();

  const [isVisible, setIsVisible] = useState(false);

  // Define keyboard shortcuts
  const shortcutGroups: ShortcutGroup[] = [
    {
      name: 'Navigation',
      shortcuts: [
        {
          keys: ['Ctrl', 'K'],
          description: 'Open command palette',
          action: () => setIsVisible(true)
        },
        {
          keys: ['Ctrl', 'B'],
          description: 'Toggle sidebar',
          action: () => setSidebarOpen(!sidebarOpen)
        },
        {
          keys: ['Ctrl', '1'],
          description: 'Switch to timeline view',
          action: () => setViewMode('timeline')
        },
        {
          keys: ['Ctrl', '2'],
          description: 'Switch to flow view',
          action: () => setViewMode('flow')
        },
        {
          keys: ['Ctrl', '3'],
          description: 'Switch to table view',
          action: () => setViewMode('table')
        }
      ]
    },
    {
      name: 'Actions',
      shortcuts: [
        {
          keys: ['Ctrl', 'Shift', 'C'],
          description: 'Clear all traces',
          action: () => clearTraces()
        },
        {
          keys: ['Ctrl', 'Shift', 'F'],
          description: 'Clear all filters',
          action: () => clearFilters()
        },
        {
          keys: ['F5'],
          description: 'Refresh traces',
          action: () => window.location.reload()
        },
        {
          keys: ['Escape'],
          description: 'Close dialogs/modals',
          action: () => {
            setIsVisible(false);
            onClose?.();
          }
        }
      ]
    },
    {
      name: 'Search & Filter',
      shortcuts: [
        {
          keys: ['Ctrl', 'F'],
          description: 'Focus search box',
          action: () => {
            const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
            searchInput?.focus();
          }
        },
        {
          keys: ['Ctrl', 'Shift', 'A'],
          description: 'Open advanced search',
          action: () => {
            // This would open advanced search modal
            console.log('Open advanced search');
          }
        }
      ]
    },
    {
      name: 'Help',
      shortcuts: [
        {
          keys: ['F1'],
          description: 'Show help',
          action: () => setIsVisible(true)
        },
        {
          keys: ['Ctrl', '/'],
          description: 'Show keyboard shortcuts',
          action: () => setIsVisible(true)
        }
      ]
    }
  ];

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for each shortcut
      for (const group of shortcutGroups) {
        for (const shortcut of group.shortcuts) {
          if (isShortcutMatch(event, shortcut.keys)) {
            event.preventDefault();
            shortcut.action();
            return;
          }
        }
      }
    };

    const isShortcutMatch = (event: KeyboardEvent, keys: string[]): boolean => {
      if (keys.length === 1) {
        return event.code === keys[0] || event.key === keys[0];
      }

      const modifiers = {
        'Ctrl': event.ctrlKey || event.metaKey,
        'Shift': event.shiftKey,
        'Alt': event.altKey,
        'Meta': event.metaKey
      };

      // Check if all modifiers match
      for (let i = 0; i < keys.length - 1; i++) {
        const modifier = keys[i] as keyof typeof modifiers;
        if (!modifiers[modifier]) {
          return false;
        }
      }

      // Check the main key
      const mainKey = keys[keys.length - 1];
      return event.key === mainKey || event.code === `Key${mainKey.toUpperCase()}` || event.code === mainKey;
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcutGroups, sidebarOpen]);

  // Toggle visibility with Ctrl+/ or F1
  useEffect(() => {
    const handleToggle = (event: KeyboardEvent) => {
      if ((event.ctrlKey && event.key === '/') || event.key === 'F1') {
        event.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleToggle);
    return () => window.removeEventListener('keydown', handleToggle);
  }, []);

  const renderShortcutKey = (key: string) => {
    const keyMappings: Record<string, string> = {
      'Ctrl': '⌃',
      'Shift': '⇧',
      'Alt': '⌥',
      'Meta': '⌘',
      'Escape': 'Esc',
      'F1': 'F1',
      'F5': 'F5'
    };

    return keyMappings[key] || key;
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className={`fixed bottom-4 right-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50 ${className}`}
        title="Keyboard shortcuts (Ctrl+/)"
      >
        <Keyboard className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Keyboard className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              onClose?.();
            }}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {shortcutGroups.map((group) => (
              <div key={group.name} className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                  {group.name}
                </h3>
                <div className="space-y-3">
                  {group.shortcuts.map((shortcut, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-sm text-gray-700 flex-1">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1 ml-4">
                        {shortcut.keys.map((key, keyIndex) => (
                          <React.Fragment key={keyIndex}>
                            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded shadow-sm">
                              {renderShortcutKey(key)}
                            </kbd>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="text-gray-400 mx-1">+</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h4 className="font-medium text-blue-900">Pro Tips</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Use <kbd className="px-1 py-0.5 text-xs bg-blue-100 rounded">Ctrl+K</kbd> for quick command access</li>
                  <li>• Hold <kbd className="px-1 py-0.5 text-xs bg-blue-100 rounded">Shift</kbd> while clicking to select multiple traces</li>
                  <li>• Press <kbd className="px-1 py-0.5 text-xs bg-blue-100 rounded">Escape</kbd> to close any open dialog</li>
                  <li>• Use arrow keys to navigate through trace lists</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Press <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded">Ctrl</kbd> + <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded">/</kbd> to toggle this dialog
          </span>
          <button
            onClick={() => {
              setIsVisible(false);
              onClose?.();
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

export default function Layout({ children }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { path: '/app/dashboard', icon: '🏠', label: 'Dashboard' },
    { path: '/app/services', icon: '🎯', label: 'Services' },
    { path: '/app/manage', icon: '🎛️', label: 'Manage' },
    { path: '/app/events', icon: '📡', label: 'Events' },
    { path: '/app/metrics', icon: '📊', label: 'Metrics' },
    { path: '/app/alerts', icon: '🔔', label: 'Alerts' },
    { path: '/app/recommendations', icon: '💡', label: 'Recommendations' },
  { path: '/app/integrations', icon: '🔌', label: 'Integrations' },
  { path: '/app/code-analyzer', icon: '🤖', label: 'Code Analyzer' },
  { path: '/app/chaos', icon: '💣', label: 'Chaos Engineering' },
  { path: '/app/admin', icon: '*', label: 'Admin' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-grid opacity-10 pointer-events-none"></div>
      <div className="fixed inset-0 bg-dots opacity-5 pointer-events-none"></div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 glass-dark border-b border-gray-800/50">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-white text-2xl"
            >
              ☰
            </button>
            
            <Link to="/app/dashboard" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center animate-pulse-glow">
                <span className="text-2xl">🌑</span>
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">Obsidian MROP</h1>
                <p className="text-xs text-gray-400">Resilience & Observability</p>
              </div>
            </Link>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 px-4 py-2 bg-gray-800/50 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-300">System Online</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">
                  {JSON.parse(localStorage.getItem('user') || '{}').name || 'Admin'}
                </p>
                <p className="text-xs text-gray-400">
                  {JSON.parse(localStorage.getItem('user') || '{}').email || 'admin@obsidian.dev'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center font-bold text-white">
                {(JSON.parse(localStorage.getItem('user') || '{}').name || 'A')[0].toUpperCase()}
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-400 transition-colors"
                title="Logout"
              >
                🚪
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="pt-20 flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-20 left-0 bottom-0 w-64 glass-dark border-r border-gray-800/50 z-30
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <nav className="p-4 space-y-2 h-full overflow-y-auto">
            {navItems.map((item, idx) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white neon-border' 
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                    }
                  `}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <span className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  )}
                </Link>
              );
            })}

            {/* Divider */}
            <div className="my-4 border-t border-gray-800"></div>

            {/* System Status */}
            <div className="px-4 py-3 bg-gray-800/30 rounded-lg">
              <p className="text-xs text-gray-500 mb-2">System Health</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">API</span>
                  <span className="text-xs text-green-400">✓ Online</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Database</span>
                  <span className="text-xs text-green-400">✓ Connected</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Redis</span>
                  <span className="text-xs text-green-400">✓ Ready</span>
                </div>
              </div>
            </div>

            {/* Version Info */}
            <div className="px-4 py-3 mt-4">
              <p className="text-xs text-gray-600">Obsidian MROP v1.0.0</p>
              <p className="text-xs text-gray-700">© 2025 All rights reserved</p>
            </div>
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 min-h-screen">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

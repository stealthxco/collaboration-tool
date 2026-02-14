import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import QueryProvider from './providers/QueryProvider.jsx';
import IntegrationManager from './components/IntegrationManager.jsx';
import NotificationSystem from './components/NotificationSystem.jsx';
import Dashboard from './components/Dashboard.jsx';
import { useUIState } from './store/appStore.js';
import { Menu, Sun, Moon, Settings, Home, Users, Target, MessageSquare } from 'lucide-react';
import './App.css';

// Error boundary for the entire app
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-6">The application encountered an unexpected error.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading fallback
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading Mission Control...</p>
      </div>
    </div>
  );
}

// Main App Layout
function AppLayout({ children }) {
  const { sidebarOpen, theme } = useUIState();

  return (
    <div className={`min-h-screen bg-gray-50 ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="flex h-screen">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <Header />
          
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
      
      {/* Notification System */}
      <NotificationSystem />
    </div>
  );
}

// Sidebar Component
function Sidebar({ isOpen }) {
  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Agents', href: '/agents', icon: Users },
    { name: 'Missions', href: '/missions', icon: Target },
    { name: 'Activity', href: '/activity', icon: MessageSquare },
  ];

  if (!isOpen) {
    return null;
  }

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="h-full flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900 flex items-center">
            <span className="text-2xl mr-2">🚀</span>
            Mission Control
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.name}
                href={item.href}
                className="flex items-center px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </a>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <div>Version 1.0.0</div>
            <div>Real-time DevOps Control</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Header Component
function Header() {
  const { sidebarOpen, theme } = useUIState();
  const toggleSidebar = () => {
    // This would use useUIActions in a real component
    console.log('Toggle sidebar');
  };

  const toggleTheme = () => {
    // This would use useUIActions in a real component
    console.log('Toggle theme');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleSidebar}
              className="p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {!sidebarOpen && (
              <h1 className="text-xl font-semibold text-gray-900">Mission Control</h1>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            
            <button className="p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

// Placeholder components for other routes
function AgentsPage() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Agents</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Agents management page coming soon...</p>
        <p className="text-sm text-gray-500 mt-2">
          This page will show all agents with real-time status updates via WebSocket.
        </p>
      </div>
    </div>
  );
}

function MissionsPage() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Missions</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Missions management page coming soon...</p>
        <p className="text-sm text-gray-500 mt-2">
          This page will show all missions with progress tracking and real-time updates.
        </p>
      </div>
    </div>
  );
}

function ActivityPage() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Activity</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Activity feed page coming soon...</p>
        <p className="text-sm text-gray-500 mt-2">
          This page will show real-time activity and comments with live updates.
        </p>
      </div>
    </div>
  );
}

// Main App Component
function App() {
  return (
    <AppErrorBoundary>
      <QueryProvider>
        <IntegrationManager>
          <Router>
            <AppLayout>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/agents" element={<AgentsPage />} />
                  <Route path="/missions" element={<MissionsPage />} />
                  <Route path="/activity" element={<ActivityPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </AppLayout>
          </Router>
        </IntegrationManager>
      </QueryProvider>
    </AppErrorBoundary>
  );
}

export default App;
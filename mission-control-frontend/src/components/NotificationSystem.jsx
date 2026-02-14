import React, { useEffect, useState } from 'react';
import { useNotifications } from '../store/appStore.js';
import { X, CheckCircle, AlertTriangle, Info, XCircle, Bell } from 'lucide-react';

function NotificationSystem() {
  const { notifications, markNotificationRead, clearNotifications } = useNotifications();
  const [visibleNotifications, setVisibleNotifications] = useState([]);

  // Manage visible notifications (only show recent ones as toasts)
  useEffect(() => {
    const recentNotifications = notifications
      .filter(n => !n.persistent && !n.read)
      .slice(0, 5); // Show max 5 toasts

    setVisibleNotifications(recentNotifications);

    // Auto-remove non-persistent notifications after their duration
    recentNotifications.forEach(notification => {
      if (notification.duration && !notification.persistent) {
        setTimeout(() => {
          markNotificationRead(notification.id);
        }, notification.duration);
      }
    });
  }, [notifications, markNotificationRead]);

  return (
    <>
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {visibleNotifications.map((notification) => (
          <Toast
            key={notification.id}
            notification={notification}
            onClose={() => markNotificationRead(notification.id)}
          />
        ))}
      </div>

      {/* Notification Bell (for persistent/all notifications) */}
      <NotificationBell notifications={notifications} />
    </>
  );
}

function Toast({ notification, onClose }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const typeConfig = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      textColor: 'text-green-800',
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      textColor: 'text-red-800',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-800',
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-800',
    },
  };

  const config = typeConfig[notification.type] || typeConfig.info;
  const Icon = config.icon;

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${config.bgColor} ${config.borderColor} border rounded-lg shadow-lg p-4 max-w-sm
      `}
    >
      <div className="flex items-start space-x-3">
        <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
        
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${config.textColor}`}>
            {notification.message}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(notification.timestamp).toLocaleTimeString()}
          </p>
        </div>

        <button
          onClick={handleClose}
          className={`${config.textColor} hover:opacity-70 flex-shrink-0`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar for timed notifications */}
      {notification.duration && !notification.persistent && (
        <div className={`mt-3 h-1 ${config.bgColor} rounded-full overflow-hidden`}>
          <div
            className={`h-full bg-current ${config.iconColor} rounded-full transition-transform ease-linear`}
            style={{
              animation: `shrink ${notification.duration}ms linear`,
              transformOrigin: 'left',
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes shrink {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );
}

function NotificationBell({ notifications }) {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown 
          notifications={notifications}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

function NotificationDropdown({ notifications, onClose }) {
  const { markNotificationRead, clearNotifications, clearReadNotifications } = useNotifications();

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold">Notifications</h3>
        <div className="flex space-x-2">
          <button
            onClick={clearReadNotifications}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear Read
          </button>
          <button
            onClick={clearNotifications}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={() => markNotificationRead(notification.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationItem({ notification, onMarkRead }) {
  const typeConfig = {
    success: { icon: CheckCircle, color: 'text-green-600' },
    error: { icon: XCircle, color: 'text-red-600' },
    warning: { icon: AlertTriangle, color: 'text-yellow-600' },
    info: { icon: Info, color: 'text-blue-600' },
  };

  const config = typeConfig[notification.type] || typeConfig.info;
  const Icon = config.icon;

  return (
    <div
      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
        notification.read ? 'opacity-60' : ''
      }`}
      onClick={onMarkRead}
    >
      <div className="flex items-start space-x-3">
        <Icon className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} />
        
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${notification.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
            {notification.message}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {formatRelativeTime(notification.timestamp)}
          </p>
        </div>

        {!notification.read && (
          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
        )}
      </div>
    </div>
  );
}

function formatRelativeTime(timestamp) {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now - time;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return time.toLocaleDateString();
}

export default NotificationSystem;
import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import useCollaborationStore from '../store/collaborationStore';

const NotificationToast = ({ 
  notification,
  autoHide = true,
  hideDelay = 5000,
  onAction
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  const { markNotificationRead } = useCollaborationStore();

  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        handleHide();
      }, hideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, hideDelay]);

  const handleHide = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      markNotificationRead(notification.id);
    }, 300);
  };

  const handleClick = () => {
    if (notification.actionUrl && onAction) {
      onAction(notification.actionUrl);
    }
    handleHide();
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'error':
        return <AlertCircle size={20} className="text-red-500" />;
      case 'warning':
        return <AlertTriangle size={20} className="text-yellow-500" />;
      case 'info':
      default:
        return <Info size={20} className="text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`transform transition-all duration-300 ${
      isLeaving ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
    }`}>
      <div 
        className={`max-w-sm bg-white border rounded-lg shadow-lg ${getBackgroundColor()} ${
          notification.actionUrl ? 'cursor-pointer hover:shadow-xl' : ''
        }`}
        onClick={notification.actionUrl ? handleClick : undefined}
      >
        <div className="p-4">
          <div className="flex items-start space-x-3">
            {/* Icon */}
            <div className="flex-shrink-0 pt-0.5">
              {getIcon()}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 mb-1">
                {notification.title}
              </h4>
              <p className="text-sm text-gray-700 leading-5">
                {notification.message}
              </p>
              
              {/* Timestamp */}
              <div className="mt-2 text-xs text-gray-500">
                {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
              </div>

              {/* Action button */}
              {notification.actionUrl && (
                <button 
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClick();
                  }}
                >
                  View Details →
                </button>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleHide();
              }}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Progress bar for auto-hide */}
        {autoHide && (
          <div className="h-1 bg-gray-200 rounded-b-lg overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                notification.type === 'success' ? 'bg-green-500' :
                notification.type === 'error' ? 'bg-red-500' :
                notification.type === 'warning' ? 'bg-yellow-500' :
                'bg-blue-500'
              }`}
              style={{
                animation: `shrink ${hideDelay}ms linear`,
                transformOrigin: 'left center'
              }}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );
};

// Notification container component
export const NotificationContainer = () => {
  const { notifications } = useCollaborationStore();
  
  return (
    <div className="fixed top-4 right-4 space-y-2 z-50 max-w-sm">
      {notifications.slice(0, 5).map(notification => (
        <NotificationToast
          key={notification.id}
          notification={notification}
        />
      ))}
    </div>
  );
};

export default NotificationToast;
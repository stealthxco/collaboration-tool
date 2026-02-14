import React, { useState } from 'react';
import { User, Circle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const UserAvatar = ({ user, size = 'sm', showTooltip = true }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm', 
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };

  const getPresenceColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative">
      <div 
        className={`relative ${sizeClasses[size]} bg-blue-500 rounded-full flex items-center justify-center text-white font-medium cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all duration-200`}
        onMouseEnter={() => showTooltip && setShowDetails(true)}
        onMouseLeave={() => showTooltip && setShowDetails(false)}
        title={user.username}
      >
        {user.avatar ? (
          <img 
            src={user.avatar} 
            alt={user.username}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span>{getInitials(user.username)}</span>
        )}
        
        {/* Presence indicator */}
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${getPresenceColor(user.status || user.presence)} border-2 border-white rounded-full`} />
      </div>

      {/* Tooltip */}
      {showTooltip && showDetails && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap">
            <div className="font-medium">{user.username}</div>
            <div className="flex items-center space-x-2 mt-1 text-xs">
              <Circle size={8} className={getPresenceColor(user.status || user.presence).replace('bg-', 'text-')} />
              <span className="capitalize">{user.status || user.presence || 'unknown'}</span>
            </div>
            {user.lastSeen && (
              <div className="text-xs text-gray-300 mt-1">
                Last seen {formatDistanceToNow(new Date(user.lastSeen), { addSuffix: true })}
              </div>
            )}
            {user.joinedAt && (
              <div className="text-xs text-gray-300 mt-1">
                Joined {formatDistanceToNow(new Date(user.joinedAt), { addSuffix: true })}
              </div>
            )}
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
};

const PresenceIndicator = ({ users = [], maxVisible = 5, size = 'sm' }) => {
  const [showAllUsers, setShowAllUsers] = useState(false);
  
  // Sort users: online first, then by join time
  const sortedUsers = [...users].sort((a, b) => {
    const statusOrder = { online: 0, away: 1, offline: 2 };
    const aStatus = statusOrder[a.status || a.presence] || 3;
    const bStatus = statusOrder[b.status || b.presence] || 3;
    
    if (aStatus !== bStatus) {
      return aStatus - bStatus;
    }
    
    // Secondary sort by join time (most recent first)
    const aTime = new Date(a.joinedAt || a.lastSeen || 0);
    const bTime = new Date(b.joinedAt || b.lastSeen || 0);
    return bTime - aTime;
  });

  const visibleUsers = showAllUsers ? sortedUsers : sortedUsers.slice(0, maxVisible);
  const hiddenCount = Math.max(0, sortedUsers.length - maxVisible);

  if (users.length === 0) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <User size={16} />
        <span className="text-sm">No users online</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        {/* User avatars */}
        <div className="flex items-center -space-x-1">
          {visibleUsers.map(user => (
            <UserAvatar 
              key={user.userId} 
              user={user} 
              size={size}
              showTooltip={!showAllUsers}
            />
          ))}
        </div>

        {/* Show more button */}
        {hiddenCount > 0 && (
          <button
            onClick={() => setShowAllUsers(!showAllUsers)}
            className="flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-full transition-colors duration-200"
          >
            <span>{showAllUsers ? 'Less' : `+${hiddenCount} more`}</span>
          </button>
        )}
      </div>

      {/* Expanded user list */}
      {showAllUsers && users.length > maxVisible && (
        <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 min-w-64">
          <h4 className="font-medium text-gray-900 mb-3">All Users ({users.length})</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sortedUsers.map(user => (
              <div key={user.userId} className="flex items-center space-x-3">
                <UserAvatar user={user} size="sm" showTooltip={false} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {user.username}
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Circle size={6} className={
                      user.status === 'online' ? 'text-green-500' :
                      user.status === 'away' ? 'text-yellow-500' :
                      'text-gray-500'
                    } />
                    <span className="capitalize">{user.status || user.presence || 'unknown'}</span>
                    {user.lastSeen && user.status !== 'online' && (
                      <span>• {formatDistanceToNow(new Date(user.lastSeen), { addSuffix: true })}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowAllUsers(false)}
            className="mt-3 w-full text-center text-xs text-gray-600 hover:text-gray-800 py-1"
          >
            Show less
          </button>
        </div>
      )}
    </div>
  );
};

export default PresenceIndicator;
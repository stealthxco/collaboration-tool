import React from 'react';
import { MousePointer } from 'lucide-react';

const UserCursor = ({ cursor, isCurrentUser }) => {
  if (isCurrentUser) return null;

  const colors = [
    'bg-red-500',
    'bg-blue-500', 
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-orange-500'
  ];

  // Generate consistent color based on userId
  const colorIndex = cursor.userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  const cursorColor = colors[colorIndex];

  return (
    <div
      className="absolute pointer-events-none transition-all duration-100 ease-out z-50"
      style={{
        left: cursor.x,
        top: cursor.y,
        transform: 'translate(-2px, -2px)'
      }}
    >
      {/* Cursor */}
      <div className="relative">
        <MousePointer 
          size={20} 
          className={`${cursorColor.replace('bg-', 'text-')} drop-shadow-md`}
          style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.3))' }}
        />
        
        {/* Username label */}
        <div className={`absolute top-4 left-2 px-2 py-1 ${cursorColor} text-white text-xs rounded-md shadow-md whitespace-nowrap`}>
          {cursor.username}
        </div>
      </div>
    </div>
  );
};

const UserCursors = ({ cursors, currentUserId }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {Array.from(cursors.values()).map(cursor => (
        <UserCursor
          key={cursor.userId}
          cursor={cursor}
          isCurrentUser={cursor.userId === currentUserId}
        />
      ))}
    </div>
  );
};

export default UserCursors;
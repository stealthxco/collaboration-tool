import React from 'react';
import { Edit3, MessageCircle, Plus } from 'lucide-react';

const TypingDots = () => (
  <div className="flex space-x-1">
    {[0, 1, 2].map(i => (
      <div
        key={i}
        className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
        style={{
          animationDelay: `${i * 0.2}s`,
          animationDuration: '1.4s'
        }}
      />
    ))}
  </div>
);

const TypingIndicator = ({ 
  users = [], 
  context = 'typing',
  compact = false,
  showIcon = true
}) => {
  if (users.length === 0) return null;

  const getContextIcon = () => {
    switch (context) {
      case 'editing this card':
      case 'editing': 
        return <Edit3 size={12} className="text-blue-500" />;
      case 'commenting':
        return <MessageCircle size={12} className="text-green-500" />;
      case 'creating a new card':
        return <Plus size={12} className="text-purple-500" />;
      default:
        return <Edit3 size={12} className="text-blue-500" />;
    }
  };

  const formatUserList = (userList) => {
    if (userList.length === 1) {
      return userList[0].username;
    } else if (userList.length === 2) {
      return `${userList[0].username} and ${userList[1].username}`;
    } else if (userList.length === 3) {
      return `${userList[0].username}, ${userList[1].username}, and ${userList[2].username}`;
    } else {
      return `${userList[0].username}, ${userList[1].username}, and ${userList.length - 2} others`;
    }
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
        <TypingDots />
        <span>{users.length}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
      {showIcon && getContextIcon()}
      <div className="flex items-center space-x-2">
        <span>
          <strong>{formatUserList(users)}</strong> {users.length === 1 ? 'is' : 'are'} {context}
        </span>
        <TypingDots />
      </div>
    </div>
  );
};

export default TypingIndicator;
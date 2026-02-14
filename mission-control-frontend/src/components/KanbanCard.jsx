import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Lock, User, MessageCircle, Calendar, AlertCircle, Edit3 } from 'lucide-react';
import { format } from 'date-fns';
import TypingIndicator from './TypingIndicator';
import websocketService from '../services/websocket';

const KanbanCard = ({
  card,
  onUpdate,
  onMove,
  currentUser,
  connectedUsers,
  cardLock,
  typingUsers = [],
  position
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const cardRef = useRef(null);
  const editInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Handle drag events
  const handleDragStart = useCallback((e) => {
    if (cardLock && cardLock.userId !== currentUser?.userId) {
      e.preventDefault();
      return;
    }
    
    e.dataTransfer.setData('text/plain', card.id);
    e.dataTransfer.effectAllowed = 'move';
    
    // Add visual feedback
    setTimeout(() => {
      if (cardRef.current) {
        cardRef.current.style.opacity = '0.5';
      }
    }, 0);
  }, [card.id, cardLock, currentUser]);

  const handleDragEnd = useCallback(() => {
    if (cardRef.current) {
      cardRef.current.style.opacity = '1';
    }
  }, []);

  // Handle editing
  const startEditing = useCallback((field, currentValue) => {
    // Check if card is locked by someone else
    if (cardLock && cardLock.userId !== currentUser?.userId) {
      return;
    }

    // Request lock if not already locked
    if (!cardLock || cardLock.userId !== currentUser?.userId) {
      websocketService.requestCardLock(card.id, (success, existingLock) => {
        if (!success) {
          console.warn('Could not obtain lock for editing:', existingLock);
          return;
        }
        proceedWithEdit(field, currentValue);
      });
    } else {
      proceedWithEdit(field, currentValue);
    }
  }, [card.id, cardLock, currentUser]);

  const proceedWithEdit = useCallback((field, currentValue) => {
    setIsEditing(true);
    setEditingField(field);
    setEditValue(currentValue || '');
  }, []);

  const saveEdit = useCallback(() => {
    if (editingField && editValue !== card[editingField]) {
      onUpdate(card.id, editingField, editValue);
    }
    
    setIsEditing(false);
    setEditingField(null);
    setEditValue('');
    
    // Stop typing indicator
    websocketService.stopTyping(card.id);
  }, [card, editingField, editValue, onUpdate]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditingField(null);
    setEditValue('');
    
    // Stop typing indicator and release lock
    websocketService.stopTyping(card.id);
    websocketService.releaseCardLock(card.id);
  }, [card.id]);

  const handleTyping = useCallback((value) => {
    setEditValue(value);
    
    // Send typing indicator
    websocketService.startTyping(card.id);
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      websocketService.stopTyping(card.id);
    }, 1000);
  }, [card.id]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  }, [saveEdit, cancelEdit]);

  // Focus edit input when editing starts
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Get lock info
  const isLockedByMe = cardLock && cardLock.userId === currentUser?.userId;
  const isLockedByOther = cardLock && cardLock.userId !== currentUser?.userId;
  const lockOwner = isLockedByOther ? connectedUsers.get(cardLock.userId) : null;

  // Card priority styling
  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'URGENT': return 'border-l-4 border-red-500';
      case 'HIGH': return 'border-l-4 border-orange-500';
      case 'MEDIUM': return 'border-l-4 border-yellow-500';
      case 'LOW': return 'border-l-4 border-green-500';
      default: return 'border-l-4 border-gray-300';
    }
  };

  // Card status styling
  const getStatusStyle = (status) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-50 border-green-200';
      case 'IN_PROGRESS': return 'bg-blue-50 border-blue-200';
      case 'PENDING': return 'bg-yellow-50 border-yellow-200';
      case 'FAILED': return 'bg-red-50 border-red-200';
      default: return 'bg-white border-gray-200';
    }
  };

  return (
    <div
      ref={cardRef}
      draggable={!isLockedByOther}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`relative group cursor-pointer border rounded-lg shadow-sm transition-all duration-200 hover:shadow-md ${
        getStatusStyle(card.status)
      } ${getPriorityStyle(card.priority)} ${
        isLockedByOther ? 'opacity-75' : ''
      } ${isEditing ? 'ring-2 ring-blue-500' : ''}`}
      onClick={() => setShowDetails(!showDetails)}
    >
      {/* Lock indicator */}
      {cardLock && (
        <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center ${
          isLockedByMe ? 'bg-blue-500' : 'bg-amber-500'
        }`}>
          <Lock size={12} className="text-white" />
        </div>
      )}

      {/* Card content */}
      <div className="p-3">
        {/* Title */}
        <div className="mb-2">
          {isEditing && editingField === 'title' ? (
            <textarea
              ref={editInputRef}
              value={editValue}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={saveEdit}
              className="w-full p-1 text-sm font-medium border border-blue-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h4 
              className="font-medium text-gray-900 text-sm leading-tight group-hover:text-gray-700"
              onDoubleClick={(e) => {
                e.stopPropagation();
                startEditing('title', card.title);
              }}
            >
              {card.title}
            </h4>
          )}
        </div>

        {/* Description (if expanded) */}
        {showDetails && card.description && (
          <div className="mb-2">
            {isEditing && editingField === 'description' ? (
              <textarea
                ref={editInputRef}
                value={editValue}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyDown={handleKeyPress}
                onBlur={saveEdit}
                className="w-full p-2 text-xs border border-blue-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <p 
                className="text-xs text-gray-600 leading-relaxed"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  startEditing('description', card.description);
                }}
              >
                {card.description}
              </p>
            )}
          </div>
        )}

        {/* Card metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            {/* Priority badge */}
            {card.priority && card.priority !== 'MEDIUM' && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                card.priority === 'URGENT' ? 'bg-red-100 text-red-700' :
                card.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                card.priority === 'LOW' ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {card.priority}
              </span>
            )}

            {/* Due date */}
            {card.dueDate && (
              <div className="flex items-center space-x-1">
                <Calendar size={10} />
                <span>{format(new Date(card.dueDate), 'MMM dd')}</span>
              </div>
            )}
          </div>

          {/* Comments count */}
          {card.commentsCount > 0 && (
            <div className="flex items-center space-x-1">
              <MessageCircle size={10} />
              <span>{card.commentsCount}</span>
            </div>
          )}
        </div>

        {/* Assignee */}
        {card.assignedTo && (
          <div className="mt-2 flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <User size={12} className="text-white" />
            </div>
            <span className="text-xs text-gray-600">{card.assignedTo}</span>
          </div>
        )}

        {/* Lock info */}
        {isLockedByOther && lockOwner && (
          <div className="mt-2 flex items-center space-x-2 text-xs text-amber-600">
            <Lock size={10} />
            <span>Locked by {lockOwner.username}</span>
          </div>
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="mt-2">
            <TypingIndicator 
              users={typingUsers} 
              context="editing this card"
            />
          </div>
        )}

        {/* Edit button (on hover) */}
        {!isLockedByOther && (
          <button
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white rounded border border-gray-200 hover:bg-gray-50"
            onClick={(e) => {
              e.stopPropagation();
              startEditing('title', card.title);
            }}
          >
            <Edit3 size={12} className="text-gray-500" />
          </button>
        )}

        {/* Version info (for debugging) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-1 text-xs text-gray-400">
            v{card.version || 1} • {card.id}
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanCard;
import React, { useState, useCallback } from 'react';
import { Plus, MoreVertical, Lock, Users } from 'lucide-react';
import KanbanCard from './KanbanCard';
import TypingIndicator from './TypingIndicator';

const KanbanColumn = ({
  column,
  cards = [],
  onCardUpdate,
  onCardMove,
  onDragOver,
  onDrop,
  isDragOver,
  currentUser,
  connectedUsers,
  cardLocks,
  getTypingUsers
}) => {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');

  const handleAddCard = useCallback(() => {
    if (!newCardTitle.trim()) return;

    const newCard = {
      id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: newCardTitle,
      columnId: column.id,
      position: cards.length,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.userId,
      version: 1
    };

    // Add card locally and notify parent
    if (onCardUpdate) {
      onCardUpdate(newCard.id, 'title', newCardTitle);
    }

    setNewCardTitle('');
    setIsAddingCard(false);
  }, [newCardTitle, column.id, cards.length, currentUser, onCardUpdate]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleAddCard();
    } else if (e.key === 'Escape') {
      setIsAddingCard(false);
      setNewCardTitle('');
    }
  }, [handleAddCard]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    onDragOver(e);
  }, [onDragOver]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    onDrop(e);
  }, [onDrop]);

  // Get typing users for this column (for new cards)
  const typingUsersForNewCard = getTypingUsers(`new-card-${column.id}`, null);

  // Calculate column statistics
  const totalCards = cards.length;
  const lockedCards = cards.filter(card => cardLocks.has(card.id)).length;
  const activeUsers = new Set();
  
  // Find users actively working on cards in this column
  cards.forEach(card => {
    const lock = cardLocks.get(card.id);
    if (lock) {
      activeUsers.add(lock.userId);
    }
    
    const typingUsers = getTypingUsers(card.id, null);
    typingUsers.forEach(user => activeUsers.add(user.userId));
  });

  return (
    <div
      className={`min-w-80 bg-gray-100 rounded-lg transition-colors duration-200 ${
        isDragOver ? 'bg-blue-100 ring-2 ring-blue-300' : ''
      }`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-gray-200 bg-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="font-semibold text-gray-900">{column.title}</h3>
            <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-full">
              {totalCards}
            </span>
            {lockedCards > 0 && (
              <div className="flex items-center space-x-1 text-amber-600">
                <Lock size={12} />
                <span className="text-xs">{lockedCards}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Active users indicator */}
            {activeUsers.size > 0 && (
              <div className="flex items-center space-x-1">
                <Users size={12} className="text-blue-600" />
                <span className="text-xs text-blue-600">{activeUsers.size}</span>
              </div>
            )}
            
            <button className="p-1 hover:bg-gray-100 rounded">
              <MoreVertical size={16} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Column description */}
        {column.description && (
          <p className="mt-2 text-sm text-gray-600">{column.description}</p>
        )}
      </div>

      {/* Cards */}
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {cards.map((card, index) => (
          <KanbanCard
            key={card.id}
            card={card}
            onUpdate={onCardUpdate}
            onMove={onCardMove}
            currentUser={currentUser}
            connectedUsers={connectedUsers}
            cardLock={cardLocks.get(card.id)}
            typingUsers={getTypingUsers(card.id, null)}
            position={index}
          />
        ))}

        {/* Add Card Section */}
        <div className="space-y-2">
          {/* Typing indicator for new cards */}
          {typingUsersForNewCard.length > 0 && (
            <TypingIndicator 
              users={typingUsersForNewCard}
              context="creating a new card"
            />
          )}

          {isAddingCard ? (
            <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
              <textarea
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Enter card title..."
                className="w-full p-2 text-sm border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                autoFocus
              />
              <div className="mt-2 flex space-x-2">
                <button
                  onClick={handleAddCard}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add Card
                </button>
                <button
                  onClick={() => {
                    setIsAddingCard(false);
                    setNewCardTitle('');
                  }}
                  className="px-3 py-1 text-gray-600 text-sm rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingCard(true)}
              className="w-full p-3 text-left text-gray-600 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-800 transition-colors duration-200"
            >
              <div className="flex items-center space-x-2">
                <Plus size={16} />
                <span className="text-sm">Add a card</span>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default KanbanColumn;
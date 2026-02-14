import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Plus, Users, Settings, AlertTriangle } from 'lucide-react';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import UserCursors from './UserCursors';
import PresenceIndicator from './PresenceIndicator';
import NotificationToast from './NotificationToast';
import ConflictResolver from './ConflictResolver';
import useCollaborationStore from '../store/collaborationStore';
import websocketService from '../services/websocket';

const KanbanBoard = ({ 
  boardId = 'default-board',
  initialColumns = [],
  initialCards = [],
  currentUser,
  onCardUpdate,
  onCardMove,
  onColumnUpdate
}) => {
  const [columns, setColumns] = useState(initialColumns);
  const [cards, setCards] = useState(initialCards);
  const [draggedCard, setDraggedCard] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const boardRef = useRef(null);
  const lastCursorUpdate = useRef(0);

  // Collaboration store
  const {
    isConnected,
    connectedUsers,
    userCursors,
    cardLocks,
    activeConflicts,
    notifications,
    unreadCount,
    setCurrentUser,
    setCurrentBoard,
    initializeWebSocket,
    applyCardEdit,
    getTypingUsers,
    isCardLockedByOther,
    isCardLockedByMe,
    getActiveConflictsCount
  } = useCollaborationStore();

  // Initialize WebSocket connection
  useEffect(() => {
    if (!currentUser) return;

    setCurrentUser(currentUser);
    setCurrentBoard(boardId);
    
    // Connect to WebSocket if not already connected
    if (!isConnected) {
      websocketService.connect('http://localhost:3000', currentUser);
      initializeWebSocket();
    }

    // Join board
    websocketService.joinBoard(boardId, currentUser);

    // Cleanup on unmount
    return () => {
      websocketService.leaveBoard(boardId);
    };
  }, [currentUser, boardId, isConnected, setCurrentUser, setCurrentBoard, initializeWebSocket]);

  // Handle cursor movement
  const handleMouseMove = useCallback((e) => {
    if (!boardRef.current || !isConnected) return;

    const now = Date.now();
    if (now - lastCursorUpdate.current < 50) return; // Throttle to 20fps

    const rect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    websocketService.sendCursorPosition(x, y);
    lastCursorUpdate.current = now;
  }, [isConnected]);

  // Handle real-time card updates
  useEffect(() => {
    const handleCardEdit = (editData) => {
      setCards(prevCards => 
        prevCards.map(card => 
          card.id === editData.cardId 
            ? { ...card, [editData.field]: editData.value, version: editData.version }
            : card
        )
      );
      applyCardEdit(editData);
    };

    const handleCardMove = (moveData) => {
      setCards(prevCards => {
        const cardToMove = prevCards.find(card => card.id === moveData.cardId);
        if (!cardToMove) return prevCards;

        return prevCards.map(card => 
          card.id === moveData.cardId 
            ? { ...card, columnId: moveData.toColumnId, position: moveData.position }
            : card
        );
      });
    };

    websocketService.on('cardEdit', handleCardEdit);
    websocketService.on('cardMove', handleCardMove);

    return () => {
      websocketService.off('cardEdit', handleCardEdit);
      websocketService.off('cardMove', handleCardMove);
    };
  }, [applyCardEdit]);

  // Card operations
  const handleCardUpdate = useCallback(async (cardId, field, value) => {
    // Check if card is locked by someone else
    if (isCardLockedByOther(cardId)) {
      console.warn('Cannot edit card: locked by another user');
      return;
    }

    // Request lock if not already locked
    if (!isCardLockedByMe(cardId)) {
      websocketService.requestCardLock(cardId, (success, existingLock) => {
        if (!success) {
          console.warn('Could not obtain card lock:', existingLock);
          return;
        }
        performCardUpdate(cardId, field, value);
      });
    } else {
      performCardUpdate(cardId, field, value);
    }
  }, [isCardLockedByOther, isCardLockedByMe]);

  const performCardUpdate = useCallback((cardId, field, value) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    const newVersion = (card.version || 1) + 1;

    // Update local state optimistically
    setCards(prevCards => 
      prevCards.map(c => 
        c.id === cardId 
          ? { ...c, [field]: value, version: newVersion }
          : c
      )
    );

    // Broadcast update
    websocketService.updateCard(cardId, field, value, newVersion);

    // Call parent callback
    if (onCardUpdate) {
      onCardUpdate(cardId, field, value, newVersion);
    }
  }, [cards, onCardUpdate]);

  const handleCardMove = useCallback((cardId, fromColumnId, toColumnId, newPosition) => {
    // Update local state
    setCards(prevCards => 
      prevCards.map(card => 
        card.id === cardId 
          ? { ...card, columnId: toColumnId, position: newPosition }
          : card
      )
    );

    // Broadcast move
    websocketService.moveCard(cardId, fromColumnId, toColumnId, newPosition);

    // Call parent callback
    if (onCardMove) {
      onCardMove(cardId, fromColumnId, toColumnId, newPosition);
    }
  }, [onCardMove]);

  // Drag and drop handlers
  const handleDragStart = useCallback((e, card) => {
    setDraggedCard(card);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  }, []);

  const handleDrop = useCallback((e, columnId) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (!draggedCard || draggedCard.columnId === columnId) {
      setDraggedCard(null);
      return;
    }

    const columnCards = cards.filter(card => card.columnId === columnId);
    const newPosition = columnCards.length;

    handleCardMove(draggedCard.id, draggedCard.columnId, columnId, newPosition);
    setDraggedCard(null);
  }, [draggedCard, cards, handleCardMove]);

  const handleDragEnd = useCallback(() => {
    setDraggedCard(null);
    setDragOverColumn(null);
  }, []);

  // Get cards for a specific column
  const getCardsForColumn = useCallback((columnId) => {
    return cards
      .filter(card => card.columnId === columnId)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
  }, [cards]);

  return (
    <div 
      ref={boardRef}
      className="relative h-full bg-gray-50 overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">Mission Control Board</h1>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Active conflicts indicator */}
          {getActiveConflictsCount() > 0 && (
            <div className="flex items-center space-x-2 text-amber-600">
              <AlertTriangle size={16} />
              <span className="text-sm font-medium">
                {getActiveConflictsCount()} conflicts
              </span>
            </div>
          )}

          {/* Connected users */}
          <div className="flex items-center space-x-2">
            <Users size={16} className="text-gray-500" />
            <span className="text-sm text-gray-600">
              {connectedUsers.size} online
            </span>
          </div>

          {/* Presence indicators */}
          <PresenceIndicator users={Array.from(connectedUsers.values())} />

          {/* Notifications */}
          {unreadCount > 0 && (
            <div className="relative">
              <div className="w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 p-6 overflow-x-auto overflow-y-hidden">
        <div className="flex space-x-6 h-full min-w-max">
          {columns.map(column => (
            <KanbanColumn
              key={column.id}
              column={column}
              cards={getCardsForColumn(column.id)}
              onCardUpdate={handleCardUpdate}
              onCardMove={handleCardMove}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDrop={(e) => handleDrop(e, column.id)}
              isDragOver={dragOverColumn === column.id}
              currentUser={currentUser}
              connectedUsers={connectedUsers}
              cardLocks={cardLocks}
              getTypingUsers={getTypingUsers}
            />
          ))}

          {/* Add Column Button */}
          <div className="min-w-80 bg-gray-100 rounded-lg p-4 border-2 border-dashed border-gray-300 flex items-center justify-center">
            <button className="flex items-center space-x-2 text-gray-500 hover:text-gray-700">
              <Plus size={20} />
              <span>Add Column</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay components */}
      <UserCursors cursors={userCursors} currentUserId={currentUser?.userId} />
      
      {/* Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {notifications.slice(0, 5).map(notification => (
          <NotificationToast
            key={notification.id}
            notification={notification}
          />
        ))}
      </div>

      {/* Conflict resolution modal */}
      {Array.from(activeConflicts.values()).map(conflict => (
        <ConflictResolver
          key={`${conflict.entityType}:${conflict.entityId}`}
          conflict={conflict}
          onResolve={(resolvedVersion) => {
            websocketService.submitConflictResolution(
              conflict.entityType,
              conflict.entityId,
              resolvedVersion
            );
          }}
        />
      ))}
    </div>
  );
};

export default KanbanBoard;
import React, { useState } from 'react';
import { AlertTriangle, User, Clock, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import useCollaborationStore from '../store/collaborationStore';

const ConflictResolver = ({ conflict, onResolve }) => {
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [isResolving, setIsResolving] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const { connectedUsers, resolveConflict } = useCollaborationStore();

  if (!conflict) return null;

  const handleResolve = async (version) => {
    setIsResolving(true);
    
    try {
      await onResolve(version);
      resolveConflict(conflict.entityType, conflict.entityId);
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      setIsResolving(false);
    }
  };

  const handleMerge = () => {
    // For simplicity, we'll create a merged version
    // In a real app, this would be more sophisticated
    const versions = conflict.conflictingVersions || [];
    if (versions.length >= 2) {
      const mergedVersion = {
        ...versions[0],
        ...versions[1],
        version: Math.max(...versions.map(v => v.version || 1)) + 1,
        mergedAt: new Date().toISOString(),
        mergedBy: 'current-user' // Should be actual current user
      };
      
      handleResolve(mergedVersion);
    }
  };

  const getEntityTypeLabel = () => {
    switch (conflict.entityType) {
      case 'card': return 'Card';
      case 'comment': return 'Comment';
      default: return 'Item';
    }
  };

  const getUserName = (userId) => {
    const user = connectedUsers.get(userId);
    return user ? user.username : userId;
  };

  const formatVersionContent = (version) => {
    if (!version) return 'No content';
    
    // For cards, show title and description
    if (conflict.entityType === 'card') {
      return (
        <div>
          <div className="font-medium">{version.title || 'Untitled'}</div>
          {version.description && (
            <div className="text-sm text-gray-600 mt-1">{version.description}</div>
          )}
        </div>
      );
    }
    
    // For comments, show content
    if (conflict.entityType === 'comment') {
      return <div>{version.content || 'No content'}</div>;
    }
    
    // Generic content display
    return <pre className="text-xs">{JSON.stringify(version, null, 2)}</pre>;
  };

  const renderVersionComparison = () => {
    const versions = conflict.conflictingVersions || [];
    
    if (versions.length < 2) {
      return (
        <div className="text-center text-gray-500 py-4">
          No conflicting versions to display
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {versions.map((version, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
              selectedVersion === index 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedVersion(index)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  index === 0 ? 'bg-green-500' : 'bg-blue-500'
                }`} />
                <span className="text-sm font-medium">
                  Version {version.version || index + 1}
                </span>
              </div>
              
              {selectedVersion === index && (
                <Check size={16} className="text-blue-600" />
              )}
            </div>

            <div className="mb-3">
              {formatVersionContent(version)}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <User size={12} />
                <span>{getUserName(version.lastModifiedBy || version.userId)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock size={12} />
                <span>{format(new Date(version.timestamp || version.updatedAt), 'MMM dd, HH:mm')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle size={24} className="text-amber-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Edit Conflict Detected
                </h2>
                <p className="text-sm text-gray-600">
                  {getEntityTypeLabel()} "{conflict.entityId}" has conflicting changes that need to be resolved.
                </p>
              </div>
            </div>
            
            <button
              onClick={() => resolveConflict(conflict.entityType, conflict.entityId)}
              className="text-gray-400 hover:text-gray-600"
              disabled={isResolving}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="mb-6">
            <p className="text-sm text-gray-700 mb-4">
              Multiple users have made changes to this {conflict.entityType}. 
              Please choose which version to keep or merge the changes.
            </p>
            
            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={() => setShowDiff(!showDiff)}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                {showDiff ? 'Hide' : 'Show'} detailed comparison
              </button>
            </div>
          </div>

          {renderVersionComparison()}

          {showDiff && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Detailed Changes</h4>
              <div className="text-xs">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(conflict.conflictingVersions, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Conflict detected at {format(new Date(conflict.timestamp), 'MMM dd, yyyy HH:mm')}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => resolveConflict(conflict.entityType, conflict.entityId)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                disabled={isResolving}
              >
                Cancel
              </button>
              
              <button
                onClick={handleMerge}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={isResolving || !conflict.conflictingVersions || conflict.conflictingVersions.length < 2}
              >
                {isResolving ? 'Merging...' : 'Auto Merge'}
              </button>
              
              <button
                onClick={() => handleResolve(conflict.conflictingVersions[selectedVersion])}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                disabled={isResolving || selectedVersion === null}
              >
                {isResolving ? 'Resolving...' : 'Use Selected Version'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConflictResolver;
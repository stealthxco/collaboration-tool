import React, { useState, useEffect } from 'react'
import { 
  Play, Square, CheckSquare, Trash2, UserPlus, 
  Tag, Calendar, AlertTriangle, Download, 
  Filter, Clock, BarChart3, RefreshCw,
  ChevronRight, Eye, Settings, X
} from 'lucide-react'
import apiClient from '../services/apiClient'
import AdvancedSearch from './AdvancedSearch'

const BulkOperations = () => {
  const [selectedMissions, setSelectedMissions] = useState([])
  const [searchResults, setSearchResults] = useState({ missions: [], pagination: {} })
  const [operations, setOperations] = useState([])
  const [loading, setLoading] = useState(false)
  const [showOperationModal, setShowOperationModal] = useState(false)
  const [currentOperation, setCurrentOperation] = useState(null)
  const [operationConfig, setOperationConfig] = useState({})
  const [agents, setAgents] = useState([])
  const [users, setUsers] = useState([])
  const [tags, setTags] = useState([])

  const operationTypes = [
    {
      id: 'UPDATE_STATUS',
      name: 'Update Status',
      description: 'Change the status of selected missions',
      icon: CheckSquare,
      color: 'blue',
      configFields: [
        {
          name: 'status',
          label: 'New Status',
          type: 'select',
          required: true,
          options: [
            { value: 'PENDING', label: 'Pending' },
            { value: 'IN_PROGRESS', label: 'In Progress' },
            { value: 'COMPLETED', label: 'Completed' },
            { value: 'FAILED', label: 'Failed' },
            { value: 'CANCELLED', label: 'Cancelled' },
            { value: 'ON_HOLD', label: 'On Hold' },
            { value: 'BLOCKED', label: 'Blocked' }
          ]
        }
      ]
    },
    {
      id: 'ASSIGN_AGENT',
      name: 'Assign Agent',
      description: 'Assign an agent to selected missions',
      icon: UserPlus,
      color: 'green',
      configFields: [
        {
          name: 'agentId',
          label: 'Agent',
          type: 'agent-select',
          required: true
        }
      ]
    },
    {
      id: 'UPDATE_PRIORITY',
      name: 'Update Priority',
      description: 'Change priority of selected missions',
      icon: AlertTriangle,
      color: 'orange',
      configFields: [
        {
          name: 'priority',
          label: 'New Priority',
          type: 'select',
          required: true,
          options: [
            { value: 'LOW', label: 'Low' },
            { value: 'MEDIUM', label: 'Medium' },
            { value: 'HIGH', label: 'High' },
            { value: 'URGENT', label: 'Urgent' },
            { value: 'CRITICAL', label: 'Critical' }
          ]
        }
      ]
    },
    {
      id: 'ADD_TAGS',
      name: 'Add Tags',
      description: 'Add tags to selected missions',
      icon: Tag,
      color: 'purple',
      configFields: [
        {
          name: 'tagIds',
          label: 'Tags to Add',
          type: 'tag-multi-select',
          required: true
        }
      ]
    },
    {
      id: 'REMOVE_TAGS',
      name: 'Remove Tags',
      description: 'Remove tags from selected missions',
      icon: Tag,
      color: 'red',
      configFields: [
        {
          name: 'tagIds',
          label: 'Tags to Remove',
          type: 'tag-multi-select',
          required: true
        }
      ]
    },
    {
      id: 'SET_DUE_DATE',
      name: 'Set Due Date',
      description: 'Set due date for selected missions',
      icon: Calendar,
      color: 'yellow',
      configFields: [
        {
          name: 'dueDate',
          label: 'Due Date',
          type: 'date',
          required: true
        }
      ]
    },
    {
      id: 'DELETE_MISSIONS',
      name: 'Delete Missions',
      description: 'Permanently delete selected missions',
      icon: Trash2,
      color: 'red',
      dangerous: true,
      configFields: []
    },
    {
      id: 'EXPORT_DATA',
      name: 'Export Data',
      description: 'Export selected missions data',
      icon: Download,
      color: 'gray',
      configFields: [
        {
          name: 'format',
          label: 'Export Format',
          type: 'select',
          required: true,
          options: [
            { value: 'csv', label: 'CSV' },
            { value: 'json', label: 'JSON' },
            { value: 'excel', label: 'Excel' }
          ]
        },
        {
          name: 'includeComments',
          label: 'Include Comments',
          type: 'checkbox'
        },
        {
          name: 'includeFiles',
          label: 'Include File Information',
          type: 'checkbox'
        }
      ]
    }
  ]

  useEffect(() => {
    fetchMetadata()
    fetchOperations()
  }, [])

  const fetchMetadata = async () => {
    try {
      const [agentsRes, usersRes, tagsRes] = await Promise.all([
        apiClient.get('/api/agents'),
        apiClient.get('/api/users'),
        apiClient.get('/api/tags')
      ])
      
      setAgents(agentsRes.data)
      setUsers(usersRes.data)
      setTags(tagsRes.data)
    } catch (error) {
      console.error('Failed to fetch metadata:', error)
    }
  }

  const fetchOperations = async () => {
    try {
      const response = await apiClient.get('/api/bulk-operations')
      setOperations(response.data)
    } catch (error) {
      console.error('Failed to fetch operations:', error)
    }
  }

  const handleSearchResults = (results) => {
    setSearchResults(results)
    setSelectedMissions([]) // Clear selection when new search results come in
  }

  const toggleMissionSelection = (missionId) => {
    if (selectedMissions.includes(missionId)) {
      setSelectedMissions(selectedMissions.filter(id => id !== missionId))
    } else {
      setSelectedMissions([...selectedMissions, missionId])
    }
  }

  const selectAllMissions = () => {
    const allMissionIds = searchResults.missions.map(m => m.id)
    setSelectedMissions(allMissionIds)
  }

  const clearSelection = () => {
    setSelectedMissions([])
  }

  const openOperationModal = (operationType) => {
    setCurrentOperation(operationType)
    setOperationConfig({})
    setShowOperationModal(true)
  }

  const updateOperationConfig = (field, value) => {
    setOperationConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const executeOperation = async () => {
    if (selectedMissions.length === 0) {
      alert('Please select at least one mission')
      return
    }

    if (currentOperation.dangerous) {
      const confirmed = confirm(
        `Are you sure you want to ${currentOperation.name.toLowerCase()} ${selectedMissions.length} mission(s)? This action cannot be undone.`
      )
      if (!confirmed) return
    }

    setLoading(true)
    try {
      // Create filters to match selected missions
      const filters = { id: { in: selectedMissions } }
      
      const response = await apiClient.post('/api/bulk-operations', {
        name: `${currentOperation.name} - ${selectedMissions.length} missions`,
        operation: currentOperation.id,
        filters,
        actions: operationConfig
      })

      // Execute the operation
      await apiClient.post(`/api/bulk-operations/${response.data.id}/execute`)
      
      setShowOperationModal(false)
      setSelectedMissions([])
      fetchOperations()
      
      // Refresh search results to show updated data
      if (searchResults.missions.length > 0) {
        // Re-run the search (this would need to be passed from the search component)
        // For now, we'll just show a success message
        alert('Operation completed successfully!')
      }
    } catch (error) {
      console.error('Operation failed:', error)
      alert('Operation failed: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  const getOperationIcon = (operation) => {
    const opType = operationTypes.find(t => t.id === operation.operation)
    return opType ? opType.icon : Settings
  }

  const getOperationColor = (operation) => {
    const opType = operationTypes.find(t => t.id === operation.operation)
    return opType ? opType.color : 'gray'
  }

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'yellow',
      RUNNING: 'blue',
      COMPLETED: 'green',
      FAILED: 'red',
      CANCELLED: 'gray'
    }
    return colors[status] || 'gray'
  }

  const renderConfigField = (field) => {
    switch (field.type) {
      case 'select':
        return (
          <select
            value={operationConfig[field.name] || ''}
            onChange={(e) => updateOperationConfig(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.required}
          >
            <option value="">Select {field.label}</option>
            {field.options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      
      case 'agent-select':
        return (
          <select
            value={operationConfig[field.name] || ''}
            onChange={(e) => updateOperationConfig(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.required}
          >
            <option value="">Select {field.label}</option>
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>
                {agent.name} ({agent.status})
              </option>
            ))}
          </select>
        )
      
      case 'tag-multi-select':
        return (
          <div className="space-y-2">
            <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
              {tags.map(tag => (
                <label key={tag.id} className="flex items-center p-1 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={(operationConfig[field.name] || []).includes(tag.id)}
                    onChange={(e) => {
                      const currentTags = operationConfig[field.name] || []
                      if (e.target.checked) {
                        updateOperationConfig(field.name, [...currentTags, tag.id])
                      } else {
                        updateOperationConfig(field.name, currentTags.filter(id => id !== tag.id))
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 mr-2"
                  />
                  <span
                    className="px-2 py-1 text-xs rounded-full"
                    style={{
                      backgroundColor: tag.color + '20',
                      color: tag.color
                    }}
                  >
                    {tag.name}
                  </span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Selected: {(operationConfig[field.name] || []).length} tags
            </p>
          </div>
        )
      
      case 'date':
        return (
          <input
            type="date"
            value={operationConfig[field.name] || ''}
            onChange={(e) => updateOperationConfig(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.required}
          />
        )
      
      case 'checkbox':
        return (
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={operationConfig[field.name] || false}
              onChange={(e) => updateOperationConfig(field.name, e.target.checked)}
              className="rounded border-gray-300 text-blue-600 mr-2"
            />
            {field.label}
          </label>
        )
      
      default:
        return (
          <input
            type="text"
            value={operationConfig[field.name] || ''}
            onChange={(e) => updateOperationConfig(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.required}
          />
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bulk Operations</h1>
          <p className="mt-2 text-gray-600">
            Perform actions on multiple missions at once to improve efficiency
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Search and Mission Selection */}
          <div className="xl:col-span-2 space-y-6">
            {/* Search Component */}
            <AdvancedSearch 
              onResults={handleSearchResults}
              onFilterChange={() => {}} // Not needed for bulk operations
            />

            {/* Selected Missions Summary */}
            {selectedMissions.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">
                      {selectedMissions.length} mission{selectedMissions.length !== 1 ? 's' : ''} selected
                    </h3>
                    <p className="text-xs text-blue-600 mt-1">
                      Ready for bulk operations
                    </p>
                  </div>
                  <button
                    onClick={clearSelection}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Mission Results */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Mission Results ({searchResults.pagination.totalCount || 0})
                  </h3>
                  {searchResults.missions.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={selectAllMissions}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Select All
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={clearSelection}
                        className="text-sm text-gray-600 hover:text-gray-800"
                      >
                        Clear Selection
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {searchResults.missions.map(mission => (
                  <div
                    key={mission.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedMissions.includes(mission.id) ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => toggleMissionSelection(mission.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedMissions.includes(mission.id)}
                        onChange={() => toggleMissionSelection(mission.id)}
                        className="rounded border-gray-300 text-blue-600"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {mission.title}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              mission.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              mission.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                              mission.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {mission.status}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              mission.priority === 'CRITICAL' ? 'bg-purple-100 text-purple-800' :
                              mission.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                              mission.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                              mission.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {mission.priority}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{mission.agent?.name || 'Unassigned'}</span>
                          <span>Progress: {mission.progress}%</span>
                          <span>Created: {new Date(mission.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {searchResults.missions.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    Use the search filters above to find missions for bulk operations
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Operations */}
          <div className="space-y-6">
            {/* Available Operations */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Available Operations</h3>
              <div className="space-y-3">
                {operationTypes.map(operation => {
                  const IconComponent = operation.icon
                  return (
                    <button
                      key={operation.id}
                      onClick={() => openOperationModal(operation)}
                      disabled={selectedMissions.length === 0}
                      className={`w-full flex items-center justify-between p-3 border rounded-lg text-left transition-colors ${
                        selectedMissions.length === 0
                          ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                          : operation.dangerous
                          ? 'border-red-200 bg-red-50 hover:bg-red-100 text-red-700'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <IconComponent className="w-5 h-5" />
                        <div>
                          <div className="font-medium">{operation.name}</div>
                          <div className="text-sm opacity-75">{operation.description}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Recent Operations */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Recent Operations</h3>
                <button
                  onClick={fetchOperations}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                {operations.slice(0, 5).map(operation => {
                  const IconComponent = getOperationIcon(operation)
                  const color = getOperationColor(operation)
                  return (
                    <div key={operation.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <IconComponent className={`w-4 h-4 text-${color}-600`} />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{operation.name}</div>
                          <div className="text-xs text-gray-500">
                            {operation.successfulItems}/{operation.totalItems} completed
                          </div>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        operation.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        operation.status === 'RUNNING' ? 'bg-blue-100 text-blue-800' :
                        operation.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {operation.status}
                      </span>
                    </div>
                  )
                })}
                
                {operations.length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No operations performed yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Operation Configuration Modal */}
        {showOperationModal && currentOperation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Configure {currentOperation.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  This will affect {selectedMissions.length} mission{selectedMissions.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="p-6 space-y-4">
                {currentOperation.configFields.length === 0 ? (
                  <p className="text-gray-600">
                    {currentOperation.dangerous 
                      ? 'This operation requires no configuration but cannot be undone.'
                      : 'This operation requires no additional configuration.'}
                  </p>
                ) : (
                  currentOperation.configFields.map(field => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {renderConfigField(field)}
                    </div>
                  ))
                )}
              </div>
              
              <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowOperationModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={executeOperation}
                  disabled={loading}
                  className={`px-6 py-2 rounded-md text-white font-medium ${
                    currentOperation.dangerous
                      ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
                      : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400'
                  }`}
                >
                  {loading ? 'Executing...' : `Execute ${currentOperation.name}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BulkOperations
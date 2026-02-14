import React, { useState, useEffect } from 'react'
import { 
  Plus, Play, Pause, Edit, Trash2, Settings, 
  Zap, AlertCircle, CheckCircle, Clock, 
  ArrowRight, Target, User, Bot, Calendar
} from 'lucide-react'
import apiClient from '../services/apiClient'

const WorkflowRules = () => {
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedRule, setSelectedRule] = useState(null)
  const [agents, setAgents] = useState([])
  const [users, setUsers] = useState([])
  const [tags, setTags] = useState([])

  const [ruleForm, setRuleForm] = useState({
    name: '',
    description: '',
    triggerEvent: '',
    conditions: [],
    actions: [],
    priority: 0,
    isActive: true
  })

  const triggerEvents = [
    {
      value: 'MISSION_CREATED',
      label: 'Mission Created',
      description: 'When a new mission is created'
    },
    {
      value: 'MISSION_UPDATED',
      label: 'Mission Updated',
      description: 'When a mission is modified'
    },
    {
      value: 'MISSION_COMPLETED',
      label: 'Mission Completed',
      description: 'When a mission is marked as completed'
    },
    {
      value: 'MISSION_FAILED',
      label: 'Mission Failed',
      description: 'When a mission fails'
    },
    {
      value: 'AGENT_STATUS_CHANGED',
      label: 'Agent Status Changed',
      description: 'When an agent status changes'
    },
    {
      value: 'USER_ACTION',
      label: 'User Action',
      description: 'When a user performs an action'
    },
    {
      value: 'SCHEDULED',
      label: 'Scheduled',
      description: 'At scheduled intervals'
    }
  ]

  const conditionTypes = [
    {
      value: 'mission_status',
      label: 'Mission Status',
      fields: [
        {
          name: 'operator',
          type: 'select',
          options: [
            { value: 'equals', label: 'Equals' },
            { value: 'not_equals', label: 'Not Equals' }
          ]
        },
        {
          name: 'value',
          type: 'select',
          options: [
            { value: 'PENDING', label: 'Pending' },
            { value: 'IN_PROGRESS', label: 'In Progress' },
            { value: 'COMPLETED', label: 'Completed' },
            { value: 'FAILED', label: 'Failed' },
            { value: 'CANCELLED', label: 'Cancelled' }
          ]
        }
      ]
    },
    {
      value: 'mission_priority',
      label: 'Mission Priority',
      fields: [
        {
          name: 'operator',
          type: 'select',
          options: [
            { value: 'equals', label: 'Equals' },
            { value: 'greater_than', label: 'Greater Than' }
          ]
        },
        {
          name: 'value',
          type: 'select',
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
      value: 'mission_progress',
      label: 'Mission Progress',
      fields: [
        {
          name: 'operator',
          type: 'select',
          options: [
            { value: 'greater_than', label: 'Greater Than' },
            { value: 'less_than', label: 'Less Than' },
            { value: 'equals', label: 'Equals' }
          ]
        },
        {
          name: 'value',
          type: 'number',
          placeholder: 'Progress percentage (0-100)'
        }
      ]
    },
    {
      value: 'mission_duration',
      label: 'Mission Duration',
      fields: [
        {
          name: 'operator',
          type: 'select',
          options: [
            { value: 'greater_than', label: 'Greater Than' },
            { value: 'less_than', label: 'Less Than' }
          ]
        },
        {
          name: 'value',
          type: 'number',
          placeholder: 'Duration in hours'
        }
      ]
    },
    {
      value: 'agent_status',
      label: 'Agent Status',
      fields: [
        {
          name: 'agent_id',
          type: 'agent-select'
        },
        {
          name: 'operator',
          type: 'select',
          options: [
            { value: 'equals', label: 'Equals' }
          ]
        },
        {
          name: 'value',
          type: 'select',
          options: [
            { value: 'IDLE', label: 'Idle' },
            { value: 'BUSY', label: 'Busy' },
            { value: 'OFFLINE', label: 'Offline' },
            { value: 'ERROR', label: 'Error' }
          ]
        }
      ]
    },
    {
      value: 'has_tag',
      label: 'Has Tag',
      fields: [
        {
          name: 'tag_id',
          type: 'tag-select'
        }
      ]
    }
  ]

  const actionTypes = [
    {
      value: 'update_status',
      label: 'Update Mission Status',
      icon: Target,
      fields: [
        {
          name: 'status',
          type: 'select',
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
      value: 'assign_agent',
      label: 'Assign Agent',
      icon: Bot,
      fields: [
        {
          name: 'agent_id',
          type: 'agent-select'
        }
      ]
    },
    {
      value: 'assign_user',
      label: 'Assign User',
      icon: User,
      fields: [
        {
          name: 'user_id',
          type: 'user-select'
        }
      ]
    },
    {
      value: 'update_priority',
      label: 'Update Priority',
      icon: AlertCircle,
      fields: [
        {
          name: 'priority',
          type: 'select',
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
      value: 'add_tag',
      label: 'Add Tag',
      icon: Target,
      fields: [
        {
          name: 'tag_id',
          type: 'tag-select'
        }
      ]
    },
    {
      value: 'send_notification',
      label: 'Send Notification',
      icon: AlertCircle,
      fields: [
        {
          name: 'recipient_type',
          type: 'select',
          options: [
            { value: 'assignee', label: 'Mission Assignee' },
            { value: 'creator', label: 'Mission Creator' },
            { value: 'specific_user', label: 'Specific User' }
          ]
        },
        {
          name: 'user_id',
          type: 'user-select',
          conditional: { field: 'recipient_type', value: 'specific_user' }
        },
        {
          name: 'message',
          type: 'text',
          placeholder: 'Notification message'
        }
      ]
    },
    {
      value: 'set_due_date',
      label: 'Set Due Date',
      icon: Calendar,
      fields: [
        {
          name: 'duration_hours',
          type: 'number',
          placeholder: 'Hours from now'
        }
      ]
    },
    {
      value: 'create_comment',
      label: 'Add Comment',
      icon: CheckCircle,
      fields: [
        {
          name: 'comment',
          type: 'text',
          placeholder: 'Comment text'
        },
        {
          name: 'type',
          type: 'select',
          options: [
            { value: 'NOTE', label: 'Note' },
            { value: 'SYSTEM', label: 'System' },
            { value: 'WARNING', label: 'Warning' },
            { value: 'SUCCESS', label: 'Success' }
          ]
        }
      ]
    }
  ]

  useEffect(() => {
    fetchRules()
    fetchMetadata()
  }, [])

  const fetchRules = async () => {
    try {
      const response = await apiClient.get('/api/workflow-rules')
      setRules(response.data)
    } catch (error) {
      console.error('Failed to fetch workflow rules:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const createRule = async (ruleData) => {
    try {
      const response = await apiClient.post('/api/workflow-rules', ruleData)
      setRules([response.data, ...rules])
      setShowCreateModal(false)
      resetForm()
    } catch (error) {
      console.error('Failed to create workflow rule:', error)
      alert('Failed to create workflow rule')
    }
  }

  const updateRule = async (id, ruleData) => {
    try {
      const response = await apiClient.put(`/api/workflow-rules/${id}`, ruleData)
      setRules(rules.map(r => r.id === id ? response.data : r))
      setShowEditModal(false)
      resetForm()
    } catch (error) {
      console.error('Failed to update workflow rule:', error)
      alert('Failed to update workflow rule')
    }
  }

  const deleteRule = async (id) => {
    if (!confirm('Are you sure you want to delete this workflow rule?')) return
    
    try {
      await apiClient.delete(`/api/workflow-rules/${id}`)
      setRules(rules.filter(r => r.id !== id))
    } catch (error) {
      console.error('Failed to delete workflow rule:', error)
      alert('Failed to delete workflow rule')
    }
  }

  const toggleRuleStatus = async (id, isActive) => {
    try {
      const response = await apiClient.put(`/api/workflow-rules/${id}`, { isActive })
      setRules(rules.map(r => r.id === id ? { ...r, isActive } : r))
    } catch (error) {
      console.error('Failed to toggle rule status:', error)
      alert('Failed to toggle rule status')
    }
  }

  const resetForm = () => {
    setRuleForm({
      name: '',
      description: '',
      triggerEvent: '',
      conditions: [],
      actions: [],
      priority: 0,
      isActive: true
    })
    setSelectedRule(null)
  }

  const openEditModal = (rule) => {
    setSelectedRule(rule)
    setRuleForm({
      name: rule.name,
      description: rule.description || '',
      triggerEvent: rule.triggerEvent,
      conditions: rule.conditions || [],
      actions: rule.actions || [],
      priority: rule.priority || 0,
      isActive: rule.isActive
    })
    setShowEditModal(true)
  }

  const addCondition = () => {
    setRuleForm(prev => ({
      ...prev,
      conditions: [...prev.conditions, { id: Date.now(), type: '', config: {} }]
    }))
  }

  const updateCondition = (index, field, value) => {
    setRuleForm(prev => ({
      ...prev,
      conditions: prev.conditions.map((cond, i) => 
        i === index 
          ? field === 'type' 
            ? { ...cond, [field]: value, config: {} } // Reset config when type changes
            : { ...cond, [field]: value }
          : cond
      )
    }))
  }

  const removeCondition = (index) => {
    setRuleForm(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }))
  }

  const addAction = () => {
    setRuleForm(prev => ({
      ...prev,
      actions: [...prev.actions, { id: Date.now(), type: '', config: {} }]
    }))
  }

  const updateAction = (index, field, value) => {
    setRuleForm(prev => ({
      ...prev,
      actions: prev.actions.map((action, i) => 
        i === index 
          ? field === 'type' 
            ? { ...action, [field]: value, config: {} } // Reset config when type changes
            : { ...action, [field]: value }
          : action
      )
    }))
  }

  const removeAction = (index) => {
    setRuleForm(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (selectedRule) {
      await updateRule(selectedRule.id, ruleForm)
    } else {
      await createRule(ruleForm)
    }
  }

  const renderFieldInput = (field, value, onChange, showConditional = true) => {
    // Check if field should be shown based on conditional logic
    if (showConditional && field.conditional) {
      const parentValue = ruleForm.actions?.[0]?.config?.[field.conditional.field]
      if (parentValue !== field.conditional.value) {
        return null
      }
    }

    switch (field.type) {
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={onChange}
            className="w-full px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select...</option>
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
            value={value || ''}
            onChange={onChange}
            className="w-full px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select Agent...</option>
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>
                {agent.name} ({agent.status})
              </option>
            ))}
          </select>
        )
      
      case 'user-select':
        return (
          <select
            value={value || ''}
            onChange={onChange}
            className="w-full px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select User...</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user.username}
              </option>
            ))}
          </select>
        )
      
      case 'tag-select':
        return (
          <select
            value={value || ''}
            onChange={onChange}
            className="w-full px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select Tag...</option>
            {tags.map(tag => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        )
      
      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={onChange}
            placeholder={field.placeholder}
            className="w-full px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        )
      
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={onChange}
            placeholder={field.placeholder}
            className="w-full px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        )
      
      default:
        return null
    }
  }

  const RuleCard = ({ rule }) => (
    <div className={`bg-white border-l-4 ${rule.isActive ? 'border-l-green-500' : 'border-l-gray-300'} border-r border-t border-b border-gray-200 rounded-r-lg p-6 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              rule.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {rule.isActive ? 'Active' : 'Inactive'}
            </span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              Priority: {rule.priority}
            </span>
          </div>
          
          {rule.description && (
            <p className="text-gray-600 text-sm mb-3">{rule.description}</p>
          )}
          
          <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
            <span className="flex items-center">
              <Zap className="w-4 h-4 mr-1" />
              {triggerEvents.find(e => e.value === rule.triggerEvent)?.label}
            </span>
            <span>
              {rule.conditions?.length || 0} conditions
            </span>
            <span>
              {rule.actions?.length || 0} actions
            </span>
            <span>
              Executed {rule.executionCount || 0} times
            </span>
          </div>

          {/* Rule Flow Preview */}
          <div className="flex items-center space-x-2 text-sm">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
              {triggerEvents.find(e => e.value === rule.triggerEvent)?.label}
            </span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
              {rule.conditions?.length || 0} conditions
            </span>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
              {rule.actions?.length || 0} actions
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => toggleRuleStatus(rule.id, !rule.isActive)}
            className={`p-2 rounded ${
              rule.isActive 
                ? 'text-orange-600 hover:bg-orange-50' 
                : 'text-green-600 hover:bg-green-50'
            }`}
            title={rule.isActive ? 'Deactivate' : 'Activate'}
          >
            {rule.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={() => openEditModal(rule)}
            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => deleteRule(rule.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )

  const RuleModal = ({ isEdit = false }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? 'Edit Workflow Rule' : 'Create Workflow Rule'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rule Name *
                </label>
                <input
                  type="text"
                  required
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  value={ruleForm.description}
                  onChange={(e) => setRuleForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trigger Event *
                </label>
                <select
                  required
                  value={ruleForm.triggerEvent}
                  onChange={(e) => setRuleForm(prev => ({ ...prev, triggerEvent: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select trigger event</option>
                  {triggerEvents.map(event => (
                    <option key={event.value} value={event.value}>
                      {event.label}
                    </option>
                  ))}
                </select>
                {ruleForm.triggerEvent && (
                  <p className="text-xs text-gray-500 mt-1">
                    {triggerEvents.find(e => e.value === ruleForm.triggerEvent)?.description}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <input
                  type="number"
                  value={ruleForm.priority}
                  onChange={(e) => setRuleForm(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">Higher numbers = higher priority</p>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={ruleForm.isActive}
                  onChange={(e) => setRuleForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 mr-2"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Rule is active
                </label>
              </div>
            </div>
          </div>
          
          {/* Conditions */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Conditions</h3>
              <button
                type="button"
                onClick={addCondition}
                className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Condition
              </button>
            </div>
            
            {ruleForm.conditions.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4 border border-gray-200 rounded-lg">
                No conditions added. Rule will trigger for all events.
              </div>
            ) : (
              <div className="space-y-3">
                {ruleForm.conditions.map((condition, index) => {
                  const condType = conditionTypes.find(ct => ct.value === condition.type)
                  return (
                    <div key={condition.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <select
                          value={condition.type}
                          onChange={(e) => updateCondition(index, 'type', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mr-3"
                        >
                          <option value="">Select condition type</option>
                          {conditionTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeCondition(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {condType && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {condType.fields.map(field => (
                            <div key={field.name}>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                {field.label || field.name}
                              </label>
                              {renderFieldInput(
                                field,
                                condition.config?.[field.name],
                                (e) => updateCondition(index, 'config', {
                                  ...condition.config,
                                  [field.name]: e.target.value
                                }),
                                false
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Actions</h3>
              <button
                type="button"
                onClick={addAction}
                className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Action
              </button>
            </div>
            
            {ruleForm.actions.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4 border border-gray-200 rounded-lg">
                No actions added. Rule will do nothing when triggered.
              </div>
            ) : (
              <div className="space-y-3">
                {ruleForm.actions.map((action, index) => {
                  const actionType = actionTypes.find(at => at.value === action.type)
                  return (
                    <div key={action.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <select
                          value={action.type}
                          onChange={(e) => updateAction(index, 'type', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mr-3"
                        >
                          <option value="">Select action type</option>
                          {actionTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeAction(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {actionType && (
                        <div className="space-y-3">
                          {actionType.fields.map(field => (
                            <div key={field.name}>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                {field.label || field.name}
                              </label>
                              {renderFieldInput(
                                field,
                                action.config?.[field.name],
                                (e) => updateAction(index, 'config', {
                                  ...action.config,
                                  [field.name]: e.target.value
                                })
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          
          {/* Submit */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                if (isEdit) setShowEditModal(false)
                else setShowCreateModal(false)
                resetForm()
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {isEdit ? 'Update Rule' : 'Create Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Workflow Rules</h1>
            <p className="mt-2 text-gray-600">
              Automate mission management with custom workflow rules and actions
            </p>
          </div>
          
          <div className="mt-4 lg:mt-0">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Rule
            </button>
          </div>
        </div>

        {/* Rules List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading workflow rules...</p>
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No workflow rules created yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Your First Rule
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {rules.map(rule => (
              <RuleCard key={rule.id} rule={rule} />
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && <RuleModal />}
        {showEditModal && <RuleModal isEdit />}
      </div>
    </div>
  )
}

export default WorkflowRules
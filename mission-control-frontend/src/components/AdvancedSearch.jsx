import React, { useState, useEffect } from 'react'
import { 
  Search, Filter, X, Calendar, Tag, User, 
  Bot, Target, Clock, FileText, Link,
  ChevronDown, SlidersHorizontal, Download,
  RefreshCw, BookmarkPlus
} from 'lucide-react'
import apiClient from '../services/apiClient'

const AdvancedSearch = ({ onResults, onFilterChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [savedSearches, setSavedSearches] = useState([])
  
  const [filters, setFilters] = useState({
    query: '',
    status: [],
    priority: [],
    agentId: '',
    assigneeId: '',
    tags: [],
    dateRange: {
      start: '',
      end: ''
    },
    progress: {
      min: 0,
      max: 100
    },
    hasFiles: null,
    hasDependencies: null,
    templateId: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 50
  })
  
  const [agents, setAgents] = useState([])
  const [users, setUsers] = useState([])
  const [tags, setTags] = useState([])
  const [templates, setTemplates] = useState([])
  
  const statusOptions = [
    { value: 'PENDING', label: 'Pending', color: 'yellow' },
    { value: 'IN_PROGRESS', label: 'In Progress', color: 'blue' },
    { value: 'COMPLETED', label: 'Completed', color: 'green' },
    { value: 'FAILED', label: 'Failed', color: 'red' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'gray' },
    { value: 'ON_HOLD', label: 'On Hold', color: 'orange' },
    { value: 'BLOCKED', label: 'Blocked', color: 'purple' }
  ]
  
  const priorityOptions = [
    { value: 'LOW', label: 'Low', color: 'green' },
    { value: 'MEDIUM', label: 'Medium', color: 'yellow' },
    { value: 'HIGH', label: 'High', color: 'orange' },
    { value: 'URGENT', label: 'Urgent', color: 'red' },
    { value: 'CRITICAL', label: 'Critical', color: 'purple' }
  ]

  useEffect(() => {
    fetchFilterData()
    loadSavedSearches()
  }, [])

  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(filters)
    }
  }, [filters])

  const fetchFilterData = async () => {
    try {
      const [agentsRes, usersRes, tagsRes, templatesRes] = await Promise.all([
        apiClient.get('/api/agents'),
        apiClient.get('/api/users'),
        apiClient.get('/api/tags'),
        apiClient.get('/api/templates')
      ])
      
      setAgents(agentsRes.data)
      setUsers(usersRes.data)
      setTags(tagsRes.data)
      setTemplates(templatesRes.data)
    } catch (error) {
      console.error('Failed to fetch filter data:', error)
    }
  }

  const loadSavedSearches = () => {
    const saved = localStorage.getItem('mission_saved_searches')
    if (saved) {
      setSavedSearches(JSON.parse(saved))
    }
  }

  const saveSearch = () => {
    const name = prompt('Enter a name for this search:')
    if (name) {
      const newSearch = {
        id: Date.now().toString(),
        name,
        filters: { ...filters },
        createdAt: new Date().toISOString()
      }
      
      const updated = [...savedSearches, newSearch]
      setSavedSearches(updated)
      localStorage.setItem('mission_saved_searches', JSON.stringify(updated))
    }
  }

  const loadSavedSearch = (search) => {
    setFilters({ ...search.filters })
    executeSearch({ ...search.filters })
  }

  const deleteSavedSearch = (id) => {
    const updated = savedSearches.filter(s => s.id !== id)
    setSavedSearches(updated)
    localStorage.setItem('mission_saved_searches', JSON.stringify(updated))
  }

  const executeSearch = async (searchFilters = filters) => {
    setLoading(true)
    try {
      const response = await apiClient.post('/api/missions/search', searchFilters)
      if (onResults) {
        onResults(response.data)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const updateNestedFilter = (parentKey, childKey, value) => {
    setFilters(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [childKey]: value
      }
    }))
  }

  const addToArrayFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: [...prev[key], value]
    }))
  }

  const removeFromArrayFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].filter(item => item !== value)
    }))
  }

  const clearAllFilters = () => {
    setFilters({
      query: '',
      status: [],
      priority: [],
      agentId: '',
      assigneeId: '',
      tags: [],
      dateRange: { start: '', end: '' },
      progress: { min: 0, max: 100 },
      hasFiles: null,
      hasDependencies: null,
      templateId: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
      limit: 50
    })
  }

  const exportResults = async () => {
    try {
      const response = await apiClient.post('/api/missions/search', {
        ...filters,
        limit: 10000 // Export all results
      })
      
      const csv = convertToCSV(response.data.missions)
      downloadCSV(csv, 'mission-search-results.csv')
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const convertToCSV = (missions) => {
    if (!missions.length) return ''
    
    const headers = [
      'ID', 'Title', 'Status', 'Priority', 'Agent', 'Assignee',
      'Progress', 'Created', 'Due Date', 'Tags'
    ]
    
    const rows = missions.map(mission => [
      mission.id,
      `"${mission.title}"`,
      mission.status,
      mission.priority,
      mission.agent?.name || '',
      mission.assignee?.username || '',
      mission.progress,
      new Date(mission.createdAt).toLocaleDateString(),
      mission.dueDate ? new Date(mission.dueDate).toLocaleDateString() : '',
      mission.tags.map(t => t.tag.name).join('; ')
    ])
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  }

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getStatusColor = (status) => {
    const option = statusOptions.find(opt => opt.value === status)
    return option ? option.color : 'gray'
  }

  const getPriorityColor = (priority) => {
    const option = priorityOptions.find(opt => opt.value === priority)
    return option ? option.color : 'gray'
  }

  const activeFiltersCount = () => {
    let count = 0
    if (filters.query) count++
    if (filters.status.length) count++
    if (filters.priority.length) count++
    if (filters.agentId) count++
    if (filters.assigneeId) count++
    if (filters.tags.length) count++
    if (filters.dateRange.start || filters.dateRange.end) count++
    if (filters.progress.min > 0 || filters.progress.max < 100) count++
    if (filters.hasFiles !== null) count++
    if (filters.hasDependencies !== null) count++
    if (filters.templateId) count++
    return count
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Search Bar */}
      <div className="flex items-center p-4 border-b border-gray-200">
        <div className="flex-1 flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search missions by title or description..."
              value={filters.query}
              onChange={(e) => updateFilter('query', e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && executeSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${
              isOpen || activeFiltersCount() > 0
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {activeFiltersCount() > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                {activeFiltersCount()}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 ml-2 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
          
          <button
            onClick={() => executeSearch()}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Search className="w-4 h-4 mr-2" />
            )}
            Search
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {isOpen && (
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Status Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <div className="space-y-1">
                {statusOptions.map(status => (
                  <label key={status.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(status.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          addToArrayFilter('status', status.value)
                        } else {
                          removeFromArrayFilter('status', status.value)
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 mr-2"
                    />
                    <span className={`px-2 py-1 text-xs font-medium rounded bg-${status.color}-100 text-${status.color}-800`}>
                      {status.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Priority
              </label>
              <div className="space-y-1">
                {priorityOptions.map(priority => (
                  <label key={priority.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.priority.includes(priority.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          addToArrayFilter('priority', priority.value)
                        } else {
                          removeFromArrayFilter('priority', priority.value)
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 mr-2"
                    />
                    <span className={`px-2 py-1 text-xs font-medium rounded bg-${priority.color}-100 text-${priority.color}-800`}>
                      {priority.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Agent Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Agent
              </label>
              <select
                value={filters.agentId}
                onChange={(e) => updateFilter('agentId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any Agent</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>
            </div>

            {/* Assignee Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Assignee
              </label>
              <select
                value={filters.assigneeId}
                onChange={(e) => updateFilter('assigneeId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any Assignee</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user.username}
                  </option>
                ))}
              </select>
            </div>

            {/* Template Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Template
              </label>
              <select
                value={filters.templateId}
                onChange={(e) => updateFilter('templateId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any Template</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Date Range
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => updateNestedFilter('dateRange', 'start', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => updateNestedFilter('dateRange', 'end', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Progress Range */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Progress Range
              </label>
              <div className="flex space-x-2 items-center">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.progress.min}
                  onChange={(e) => updateNestedFilter('progress', 'min', parseInt(e.target.value))}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.progress.max}
                  onChange={(e) => updateNestedFilter('progress', 'max', parseInt(e.target.value))}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <span className="text-gray-500">%</span>
              </div>
            </div>

            {/* Files Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Files
              </label>
              <select
                value={filters.hasFiles === null ? '' : filters.hasFiles.toString()}
                onChange={(e) => updateFilter('hasFiles', e.target.value === '' ? null : e.target.value === 'true')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any</option>
                <option value="true">Has Files</option>
                <option value="false">No Files</option>
              </select>
            </div>

            {/* Dependencies Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Dependencies
              </label>
              <select
                value={filters.hasDependencies === null ? '' : filters.hasDependencies.toString()}
                onChange={(e) => updateFilter('hasDependencies', e.target.value === '' ? null : e.target.value === 'true')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any</option>
                <option value="true">Has Dependencies</option>
                <option value="false">No Dependencies</option>
              </select>
            </div>
          </div>

          {/* Tags Filter */}
          <div className="mt-6 space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => {
                    if (filters.tags.includes(tag.id)) {
                      removeFromArrayFilter('tags', tag.id)
                    } else {
                      addToArrayFilter('tags', tag.id)
                    }
                  }}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    filters.tags.includes(tag.id)
                      ? 'bg-blue-100 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                  style={{
                    backgroundColor: filters.tags.includes(tag.id) ? tag.color + '20' : undefined,
                    borderColor: filters.tags.includes(tag.id) ? tag.color : undefined,
                    color: filters.tags.includes(tag.id) ? tag.color : undefined
                  }}
                >
                  <Tag className="w-3 h-3 mr-1 inline" />
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear All
              </button>
              <button
                onClick={saveSearch}
                className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md hover:bg-blue-50"
              >
                <BookmarkPlus className="w-4 h-4 mr-2" />
                Save Search
              </button>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={exportResults}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>

          {/* Saved Searches */}
          {savedSearches.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Saved Searches</h4>
              <div className="flex flex-wrap gap-2">
                {savedSearches.map(search => (
                  <div key={search.id} className="flex items-center bg-white border border-gray-300 rounded-md">
                    <button
                      onClick={() => loadSavedSearch(search)}
                      className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 rounded-l-md"
                    >
                      {search.name}
                    </button>
                    <button
                      onClick={() => deleteSavedSearch(search.id)}
                      className="px-2 py-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-r-md border-l border-gray-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sort Options */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">Sort by:</span>
          <select
            value={filters.sortBy}
            onChange={(e) => updateFilter('sortBy', e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="createdAt">Created Date</option>
            <option value="updatedAt">Updated Date</option>
            <option value="title">Title</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
            <option value="progress">Progress</option>
            <option value="dueDate">Due Date</option>
          </select>
          
          <select
            value={filters.sortOrder}
            onChange={(e) => updateFilter('sortOrder', e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>
    </div>
  )
}

export default AdvancedSearch
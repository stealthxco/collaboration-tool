import React, { useState, useEffect } from 'react'
import { 
  Plus, Edit, Trash2, Copy, Play, Search, Filter, 
  Tag, User, Calendar, BookTemplate, Star, 
  Eye, EyeOff, Settings, Download, Upload
} from 'lucide-react'
import apiClient from '../services/apiClient'

const MissionTemplates = () => {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [tags, setTags] = useState([])

  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category: '',
    isPublic: false,
    template: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      estimatedDuration: '',
      instructions: '',
      checklistItems: []
    },
    defaultConfig: {
      autoStart: false,
      requiresApproval: false,
      allowReassignment: true
    },
    tags: []
  })

  const categories = [
    'Development',
    'Testing',
    'Deployment',
    'Maintenance',
    'Analysis',
    'Documentation',
    'Training',
    'Research'
  ]

  const priorityOptions = [
    { value: 'LOW', label: 'Low', color: 'green' },
    { value: 'MEDIUM', label: 'Medium', color: 'yellow' },
    { value: 'HIGH', label: 'High', color: 'orange' },
    { value: 'URGENT', label: 'Urgent', color: 'red' },
    { value: 'CRITICAL', label: 'Critical', color: 'purple' }
  ]

  useEffect(() => {
    fetchTemplates()
    fetchTags()
  }, [searchTerm, selectedCategory])

  const fetchTemplates = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (selectedCategory) params.append('category', selectedCategory)
      
      const response = await apiClient.get(`/api/templates?${params}`)
      setTemplates(response.data)
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTags = async () => {
    try {
      const response = await apiClient.get('/api/tags')
      setTags(response.data)
    } catch (error) {
      console.error('Failed to fetch tags:', error)
    }
  }

  const createTemplate = async (templateData) => {
    try {
      const response = await apiClient.post('/api/templates', templateData)
      setTemplates([response.data, ...templates])
      setShowCreateModal(false)
      resetForm()
    } catch (error) {
      console.error('Failed to create template:', error)
      alert('Failed to create template')
    }
  }

  const updateTemplate = async (id, templateData) => {
    try {
      const response = await apiClient.put(`/api/templates/${id}`, templateData)
      setTemplates(templates.map(t => t.id === id ? response.data : t))
      setShowEditModal(false)
      resetForm()
    } catch (error) {
      console.error('Failed to update template:', error)
      alert('Failed to update template')
    }
  }

  const deleteTemplate = async (id) => {
    if (!confirm('Are you sure you want to delete this template?')) return
    
    try {
      await apiClient.delete(`/api/templates/${id}`)
      setTemplates(templates.filter(t => t.id !== id))
    } catch (error) {
      console.error('Failed to delete template:', error)
      alert('Failed to delete template')
    }
  }

  const duplicateTemplate = async (template) => {
    const duplicatedData = {
      ...template,
      name: `${template.name} (Copy)`,
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      user: undefined,
      _count: undefined
    }
    
    try {
      const response = await apiClient.post('/api/templates', duplicatedData)
      setTemplates([response.data, ...templates])
    } catch (error) {
      console.error('Failed to duplicate template:', error)
      alert('Failed to duplicate template')
    }
  }

  const createMissionFromTemplate = async (templateId) => {
    const customValues = prompt('Enter any custom values (JSON format) or leave empty:')
    let customData = {}
    
    if (customValues) {
      try {
        customData = JSON.parse(customValues)
      } catch (error) {
        alert('Invalid JSON format')
        return
      }
    }
    
    try {
      const response = await apiClient.post(`/api/templates/${templateId}/create-mission`, {
        customValues: customData
      })
      alert('Mission created successfully!')
      // You might want to redirect to the mission or show a success message
    } catch (error) {
      console.error('Failed to create mission from template:', error)
      alert('Failed to create mission from template')
    }
  }

  const exportTemplate = (template) => {
    const exportData = {
      name: template.name,
      description: template.description,
      category: template.category,
      template: template.template,
      defaultConfig: template.defaultConfig,
      tags: template.tags?.map(t => t.tag.name) || []
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `${template.name.replace(/\s+/g, '-').toLowerCase()}-template.json`
    link.click()
    
    URL.revokeObjectURL(url)
  }

  const importTemplate = (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target.result)
        setTemplateForm({
          ...templateForm,
          ...importData,
          name: `${importData.name} (Imported)`
        })
        setShowCreateModal(true)
      } catch (error) {
        alert('Invalid template file format')
      }
    }
    reader.readAsText(file)
  }

  const resetForm = () => {
    setTemplateForm({
      name: '',
      description: '',
      category: '',
      isPublic: false,
      template: {
        title: '',
        description: '',
        priority: 'MEDIUM',
        estimatedDuration: '',
        instructions: '',
        checklistItems: []
      },
      defaultConfig: {
        autoStart: false,
        requiresApproval: false,
        allowReassignment: true
      },
      tags: []
    })
    setSelectedTemplate(null)
  }

  const openEditModal = (template) => {
    setSelectedTemplate(template)
    setTemplateForm({
      name: template.name,
      description: template.description || '',
      category: template.category || '',
      isPublic: template.isPublic,
      template: template.template,
      defaultConfig: template.defaultConfig || {
        autoStart: false,
        requiresApproval: false,
        allowReassignment: true
      },
      tags: template.tags?.map(t => t.tag.id) || []
    })
    setShowEditModal(true)
  }

  const addChecklistItem = () => {
    setTemplateForm(prev => ({
      ...prev,
      template: {
        ...prev.template,
        checklistItems: [...prev.template.checklistItems, { id: Date.now(), text: '', required: false }]
      }
    }))
  }

  const updateChecklistItem = (index, field, value) => {
    setTemplateForm(prev => ({
      ...prev,
      template: {
        ...prev.template,
        checklistItems: prev.template.checklistItems.map((item, i) => 
          i === index ? { ...item, [field]: value } : item
        )
      }
    }))
  }

  const removeChecklistItem = (index) => {
    setTemplateForm(prev => ({
      ...prev,
      template: {
        ...prev.template,
        checklistItems: prev.template.checklistItems.filter((_, i) => i !== index)
      }
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (selectedTemplate) {
      await updateTemplate(selectedTemplate.id, templateForm)
    } else {
      await createTemplate(templateForm)
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchTerm || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const TemplateCard = ({ template }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
            {template.isPublic && (
              <div className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Public
              </div>
            )}
          </div>
          
          {template.description && (
            <p className="text-gray-600 text-sm mb-3">{template.description}</p>
          )}
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            {template.category && (
              <span className="flex items-center">
                <Tag className="w-4 h-4 mr-1" />
                {template.category}
              </span>
            )}
            <span className="flex items-center">
              <User className="w-4 h-4 mr-1" />
              {template.user.username}
            </span>
            <span className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {new Date(template.createdAt).toLocaleDateString()}
            </span>
          </div>
          
          {template.tags && template.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {template.tags.map((tagRelation) => (
                <span
                  key={tagRelation.tag.id}
                  className="px-2 py-1 text-xs rounded-full"
                  style={{
                    backgroundColor: tagRelation.tag.color + '20',
                    color: tagRelation.tag.color
                  }}
                >
                  {tagRelation.tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => createMissionFromTemplate(template.id)}
            className="p-2 text-green-600 hover:bg-green-50 rounded"
            title="Create Mission"
          >
            <Play className="w-4 h-4" />
          </button>
          <button
            onClick={() => duplicateTemplate(template)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
            title="Duplicate"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => exportTemplate(template)}
            className="p-2 text-purple-600 hover:bg-purple-50 rounded"
            title="Export"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => openEditModal(template)}
            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => deleteTemplate(template.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="border-t border-gray-200 pt-3">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Used {template._count?.missions || 0} times
          </span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            priorityOptions.find(p => p.value === template.template.priority)?.color === 'green' ? 'bg-green-100 text-green-800' :
            priorityOptions.find(p => p.value === template.template.priority)?.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
            priorityOptions.find(p => p.value === template.template.priority)?.color === 'orange' ? 'bg-orange-100 text-orange-800' :
            priorityOptions.find(p => p.value === template.template.priority)?.color === 'red' ? 'bg-red-100 text-red-800' :
            'bg-purple-100 text-purple-800'
          }`}>
            {priorityOptions.find(p => p.value === template.template.priority)?.label}
          </span>
        </div>
      </div>
    </div>
  )

  const TemplateModal = ({ isEdit = false }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? 'Edit Template' : 'Create Template'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={templateForm.category}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={templateForm.isPublic}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 mr-2"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-700">
                  Make this template public
                </label>
              </div>
            </div>
            
            {/* Mission Template */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Mission Template</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mission Title *
                </label>
                <input
                  type="text"
                  required
                  value={templateForm.template.title}
                  onChange={(e) => setTemplateForm(prev => ({
                    ...prev,
                    template: { ...prev.template, title: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mission Description
                </label>
                <textarea
                  rows="3"
                  value={templateForm.template.description}
                  onChange={(e) => setTemplateForm(prev => ({
                    ...prev,
                    template: { ...prev.template, description: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={templateForm.template.priority}
                    onChange={(e) => setTemplateForm(prev => ({
                      ...prev,
                      template: { ...prev.template, priority: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {priorityOptions.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Duration (hours)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={templateForm.template.estimatedDuration}
                    onChange={(e) => setTemplateForm(prev => ({
                      ...prev,
                      template: { ...prev.template, estimatedDuration: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instructions
                </label>
                <textarea
                  rows="4"
                  value={templateForm.template.instructions}
                  onChange={(e) => setTemplateForm(prev => ({
                    ...prev,
                    template: { ...prev.template, instructions: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          
          {/* Checklist */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Checklist Items</h3>
              <button
                type="button"
                onClick={addChecklistItem}
                className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </button>
            </div>
            
            {templateForm.template.checklistItems.map((item, index) => (
              <div key={item.id} className="flex items-center space-x-3 mb-3">
                <input
                  type="text"
                  placeholder="Checklist item..."
                  value={item.text}
                  onChange={(e) => updateChecklistItem(index, 'text', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={item.required}
                    onChange={(e) => updateChecklistItem(index, 'required', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 mr-1"
                  />
                  Required
                </label>
                <button
                  type="button"
                  onClick={() => removeChecklistItem(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          
          {/* Tags */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => {
                    const tagIds = templateForm.tags
                    if (tagIds.includes(tag.id)) {
                      setTemplateForm(prev => ({
                        ...prev,
                        tags: tagIds.filter(id => id !== tag.id)
                      }))
                    } else {
                      setTemplateForm(prev => ({
                        ...prev,
                        tags: [...tagIds, tag.id]
                      }))
                    }
                  }}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    templateForm.tags.includes(tag.id)
                      ? 'bg-blue-100 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                  style={{
                    backgroundColor: templateForm.tags.includes(tag.id) ? tag.color + '20' : undefined,
                    borderColor: templateForm.tags.includes(tag.id) ? tag.color : undefined,
                    color: templateForm.tags.includes(tag.id) ? tag.color : undefined
                  }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Default Configuration */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Default Configuration</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={templateForm.defaultConfig.autoStart}
                  onChange={(e) => setTemplateForm(prev => ({
                    ...prev,
                    defaultConfig: { ...prev.defaultConfig, autoStart: e.target.checked }
                  }))}
                  className="rounded border-gray-300 text-blue-600 mr-2"
                />
                Auto-start missions created from this template
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={templateForm.defaultConfig.requiresApproval}
                  onChange={(e) => setTemplateForm(prev => ({
                    ...prev,
                    defaultConfig: { ...prev.defaultConfig, requiresApproval: e.target.checked }
                  }))}
                  className="rounded border-gray-300 text-blue-600 mr-2"
                />
                Require approval before starting
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={templateForm.defaultConfig.allowReassignment}
                  onChange={(e) => setTemplateForm(prev => ({
                    ...prev,
                    defaultConfig: { ...prev.defaultConfig, allowReassignment: e.target.checked }
                  }))}
                  className="rounded border-gray-300 text-blue-600 mr-2"
                />
                Allow mission reassignment
              </label>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
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
              {isEdit ? 'Update Template' : 'Create Template'}
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
            <h1 className="text-3xl font-bold text-gray-900">Mission Templates</h1>
            <p className="mt-2 text-gray-600">
              Create and manage reusable mission templates for consistent workflows
            </p>
          </div>
          
          <div className="mt-4 lg:mt-0 flex items-center space-x-4">
            <label className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
              <Upload className="w-4 h-4 mr-2" />
              Import Template
              <input
                type="file"
                accept=".json"
                onChange={importTemplate}
                className="hidden"
              />
            </label>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-6 space-y-4 lg:space-y-0">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search templates by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <BookTemplate className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory 
                ? 'No templates match your search criteria'
                : 'No templates created yet'}
            </p>
            {!searchTerm && !selectedCategory && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Your First Template
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTemplates.map(template => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && <TemplateModal />}
        {showEditModal && <TemplateModal isEdit />}
      </div>
    </div>
  )
}

export default MissionTemplates
import React, { useState, useEffect, useCallback } from 'react'
import { 
  Upload, File, Image, Download, Trash2, Eye, 
  Search, Filter, Grid, List, FolderOpen,
  FileText, FileImage, FileVideo, FileAudio,
  MoreVertical, Share, Copy, Info
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import apiClient from '../services/apiClient'

const FileManager = ({ missionId = null, showMissionSelector = true }) => {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [filterType, setFilterType] = useState('')
  const [missions, setMissions] = useState([])
  const [selectedMission, setSelectedMission] = useState(missionId)
  const [showPreview, setShowPreview] = useState(false)
  const [previewFile, setPreviewFile] = useState(null)

  const fileTypes = {
    image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    video: ['mp4', 'webm', 'ogg', 'mov', 'avi'],
    audio: ['mp3', 'wav', 'ogg', 'flac'],
    document: ['pdf', 'doc', 'docx', 'txt', 'rtf'],
    spreadsheet: ['xls', 'xlsx', 'csv'],
    archive: ['zip', 'tar', 'gz', '7z', 'rar']
  }

  useEffect(() => {
    if (showMissionSelector) {
      fetchMissions()
    }
    if (selectedMission) {
      fetchFiles()
    }
  }, [selectedMission, sortBy, sortOrder])

  const fetchMissions = async () => {
    try {
      const response = await apiClient.get('/api/missions')
      setMissions(response.data.missions || [])
    } catch (error) {
      console.error('Failed to fetch missions:', error)
    }
  }

  const fetchFiles = async () => {
    setLoading(true)
    try {
      const url = selectedMission 
        ? `/api/missions/${selectedMission}/files`
        : '/api/files'
      
      const response = await apiClient.get(url)
      setFiles(response.data)
    } catch (error) {
      console.error('Failed to fetch files:', error)
    } finally {
      setLoading(false)
    }
  }

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!selectedMission) {
      alert('Please select a mission first')
      return
    }

    setUploading(true)
    
    for (const file of acceptedFiles) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await apiClient.post(
          `/api/missions/${selectedMission}/files`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        )
        
        setFiles(prev => [response.data, ...prev])
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error)
        alert(`Failed to upload ${file.name}`)
      }
    }
    
    setUploading(false)
  }, [selectedMission])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: 50 * 1024 * 1024 // 50MB
  })

  const deleteFile = async (fileId) => {
    if (!confirm('Are you sure you want to delete this file?')) return
    
    try {
      await apiClient.delete(`/api/files/${fileId}`)
      setFiles(files.filter(f => f.id !== fileId))
      setSelectedFiles(selectedFiles.filter(id => id !== fileId))
    } catch (error) {
      console.error('Failed to delete file:', error)
      alert('Failed to delete file')
    }
  }

  const downloadFile = async (file) => {
    try {
      const response = await apiClient.get(`/api/files/${file.id}/download`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = file.originalName
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download file:', error)
      alert('Failed to download file')
    }
  }

  const copyFileLink = (file) => {
    const link = `${window.location.origin}/api/files/${file.id}/download`
    navigator.clipboard.writeText(link)
    alert('File link copied to clipboard')
  }

  const getFileIcon = (file) => {
    const ext = file.originalName.split('.').pop()?.toLowerCase()
    
    if (fileTypes.image.includes(ext)) return FileImage
    if (fileTypes.video.includes(ext)) return FileVideo
    if (fileTypes.audio.includes(ext)) return FileAudio
    if (fileTypes.document.includes(ext)) return FileText
    
    return File
  }

  const getFileType = (file) => {
    const ext = file.originalName.split('.').pop()?.toLowerCase()
    
    for (const [type, extensions] of Object.entries(fileTypes)) {
      if (extensions.includes(ext)) return type
    }
    
    return 'other'
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const toggleFileSelection = (fileId) => {
    if (selectedFiles.includes(fileId)) {
      setSelectedFiles(selectedFiles.filter(id => id !== fileId))
    } else {
      setSelectedFiles([...selectedFiles, fileId])
    }
  }

  const selectAllFiles = () => {
    setSelectedFiles(filteredFiles.map(f => f.id))
  }

  const clearSelection = () => {
    setSelectedFiles([])
  }

  const deleteSelectedFiles = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedFiles.length} files?`)) return
    
    for (const fileId of selectedFiles) {
      try {
        await apiClient.delete(`/api/files/${fileId}`)
      } catch (error) {
        console.error('Failed to delete file:', error)
      }
    }
    
    setFiles(files.filter(f => !selectedFiles.includes(f.id)))
    setSelectedFiles([])
  }

  const handlePreviewFile = (file) => {
    const fileType = getFileType(file)
    
    if (fileType === 'image' || fileType === 'document') {
      setPreviewFile(file)
      setShowPreview(true)
    } else {
      downloadFile(file)
    }
  }

  const filteredFiles = files.filter(file => {
    const matchesSearch = !searchTerm || 
      file.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.mimeType.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = !filterType || getFileType(file) === filterType
    
    return matchesSearch && matchesType
  }).sort((a, b) => {
    let aValue = a[sortBy]
    let bValue = b[sortBy]
    
    if (sortBy === 'originalName') {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const FileCard = ({ file }) => {
    const FileIcon = getFileIcon(file)
    const isSelected = selectedFiles.includes(file.id)
    
    return (
      <div 
        className={`relative bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
        }`}
        onClick={() => toggleFileSelection(file.id)}
      >
        <div className="flex items-center justify-between mb-3">
          <FileIcon className={`w-8 h-8 ${
            getFileType(file) === 'image' ? 'text-green-600' :
            getFileType(file) === 'document' ? 'text-blue-600' :
            getFileType(file) === 'video' ? 'text-purple-600' :
            'text-gray-600'
          }`} />
          
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handlePreviewFile(file)
              }}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Preview"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                downloadFile(file)
              }}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                deleteFile(file.id)
              }}
              className="p-1 text-gray-400 hover:text-red-600"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-900 truncate mb-1">
            {file.originalName}
          </h4>
          <div className="text-xs text-gray-500 space-y-1">
            <div>{formatFileSize(file.size)}</div>
            <div>{new Date(file.createdAt).toLocaleDateString()}</div>
            <div className="capitalize">{getFileType(file)}</div>
          </div>
        </div>
        
        {isSelected && (
          <div className="absolute top-2 left-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    )
  }

  const FileRow = ({ file }) => {
    const FileIcon = getFileIcon(file)
    const isSelected = selectedFiles.includes(file.id)
    
    return (
      <tr 
        className={`hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
        onClick={() => toggleFileSelection(file.id)}
      >
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleFileSelection(file.id)}
              className="rounded border-gray-300 text-blue-600 mr-3"
              onClick={(e) => e.stopPropagation()}
            />
            <FileIcon className={`w-5 h-5 mr-3 ${
              getFileType(file) === 'image' ? 'text-green-600' :
              getFileType(file) === 'document' ? 'text-blue-600' :
              getFileType(file) === 'video' ? 'text-purple-600' :
              'text-gray-600'
            }`} />
            <div>
              <div className="text-sm font-medium text-gray-900">
                {file.originalName}
              </div>
              <div className="text-sm text-gray-500 capitalize">
                {getFileType(file)}
              </div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {formatFileSize(file.size)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {new Date(file.createdAt).toLocaleDateString()}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handlePreviewFile(file)
              }}
              className="text-indigo-600 hover:text-indigo-900"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                downloadFile(file)
              }}
              className="text-green-600 hover:text-green-900"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                copyFileLink(file)
              }}
              className="text-blue-600 hover:text-blue-900"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                deleteFile(file.id)
              }}
              className="text-red-600 hover:text-red-900"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">File Manager</h1>
            <p className="mt-2 text-gray-600">
              Upload, organize, and manage mission files
            </p>
          </div>
          
          <div className="mt-4 lg:mt-0 flex items-center space-x-4">
            {selectedFiles.length > 0 && (
              <>
                <span className="text-sm text-gray-600">
                  {selectedFiles.length} selected
                </span>
                <button
                  onClick={deleteSelectedFiles}
                  className="flex items-center px-3 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete Selected
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mission Selector */}
        {showMissionSelector && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Select Mission</h3>
            <select
              value={selectedMission || ''}
              onChange={(e) => setSelectedMission(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a mission...</option>
              {missions.map(mission => (
                <option key={mission.id} value={mission.id}>
                  {mission.title} ({mission.status})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Upload Area */}
        {selectedMission && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              
              {uploading ? (
                <div>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Uploading files...</p>
                </div>
              ) : isDragActive ? (
                <p className="text-blue-600">Drop the files here...</p>
              ) : (
                <div>
                  <p className="text-gray-600 mb-2">
                    Drag and drop files here, or click to select files
                  </p>
                  <p className="text-sm text-gray-500">
                    Max file size: 50MB
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-6 space-y-4 lg:space-y-0">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search files by name or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="image">Images</option>
                <option value="document">Documents</option>
                <option value="video">Videos</option>
                <option value="audio">Audio</option>
                <option value="archive">Archives</option>
                <option value="other">Other</option>
              </select>
              
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-')
                  setSortBy(field)
                  setSortOrder(order)
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="originalName-asc">Name A-Z</option>
                <option value="originalName-desc">Name Z-A</option>
                <option value="size-desc">Largest First</option>
                <option value="size-asc">Smallest First</option>
              </select>
              
              <div className="flex border border-gray-300 rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${
                    viewMode === 'grid' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 border-l border-gray-300 ${
                    viewMode === 'list' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          {filteredFiles.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-600">
                {filteredFiles.length} files found
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={selectAllFiles}
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
            </div>
          )}
        </div>

        {/* Files Display */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading files...</p>
          </div>
        ) : !selectedMission && showMissionSelector ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Select a mission to view its files</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <File className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchTerm || filterType ? 'No files match your search' : 'No files uploaded yet'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredFiles.map(file => (
              <FileCard key={file.id} file={file} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFiles.map(file => (
                  <FileRow key={file.id} file={file} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* File Preview Modal */}
        {showPreview && previewFile && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {previewFile.originalName}
                </h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-4 max-h-96 overflow-auto">
                {getFileType(previewFile) === 'image' ? (
                  <img
                    src={`/api/files/${previewFile.id}/download`}
                    alt={previewFile.originalName}
                    className="max-w-full h-auto"
                  />
                ) : (
                  <iframe
                    src={`/api/files/${previewFile.id}/download`}
                    className="w-full h-96 border-0"
                    title={previewFile.originalName}
                  />
                )}
              </div>
              
              <div className="flex items-center justify-end space-x-4 p-4 border-t border-gray-200">
                <button
                  onClick={() => downloadFile(previewFile)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FileManager
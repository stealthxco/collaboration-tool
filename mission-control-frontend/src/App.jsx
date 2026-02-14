import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import Dashboard from './components/Dashboard'
import AnalyticsDashboard from './components/AnalyticsDashboard'
import AdvancedSearch from './components/AdvancedSearch'
import MissionTemplates from './components/MissionTemplates'
import BulkOperations from './components/BulkOperations'
import WorkflowRules from './components/WorkflowRules'
import FileManager from './components/FileManager'
import ReportingDashboard from './components/ReportingDashboard'
import KanbanBoard from './components/KanbanBoard'
import IntegrationManager from './components/IntegrationManager'
import NotificationSystem from './components/NotificationSystem'

// Placeholder components for routes not yet implemented
const MissionsPage = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Missions</h1>
        <p className="text-gray-600 mb-8">Mission management and tracking interface</p>
        <KanbanBoard />
      </div>
    </div>
  </div>
)

const AgentsPage = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Agent Management</h1>
        <p className="text-gray-600 mb-8">Monitor and manage AI agents</p>
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <p className="text-gray-500">Agent management interface will be implemented here</p>
        </div>
      </div>
    </div>
  </div>
)

const UsersPage = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">User Management</h1>
        <p className="text-gray-600 mb-8">Manage users, roles, and permissions</p>
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <p className="text-gray-500">User management interface will be implemented here</p>
        </div>
      </div>
    </div>
  </div>
)

const SettingsPage = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">System Settings</h1>
        <p className="text-gray-600 mb-8">Configure system preferences and integrations</p>
        <div className="space-y-8">
          <IntegrationManager />
        </div>
      </div>
    </div>
  </div>
)

// Wrapper component for search with results display
const SearchPage = () => {
  const [searchResults, setSearchResults] = React.useState({ missions: [], pagination: {} })

  const handleSearchResults = (results) => {
    setSearchResults(results)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Advanced Search</h1>
          <p className="mt-2 text-gray-600">
            Search and filter missions with advanced criteria and bulk operations
          </p>
        </div>
        
        <div className="space-y-6">
          <AdvancedSearch onResults={handleSearchResults} />
          
          {/* Search Results Display */}
          {searchResults.missions.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Search Results ({searchResults.pagination.totalCount || 0} missions found)
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                {searchResults.missions.map(mission => (
                  <div key={mission.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-900 mb-1">{mission.title}</h4>
                        {mission.description && (
                          <p className="text-gray-600 text-sm mb-3">{mission.description}</p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            mission.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            mission.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                            mission.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {mission.status}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            mission.priority === 'CRITICAL' ? 'bg-purple-100 text-purple-800' :
                            mission.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                            mission.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                            mission.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {mission.priority}
                          </span>
                          <span>{mission.agent?.name || 'Unassigned'}</span>
                          <span>Progress: {mission.progress}%</span>
                          <span>{new Date(mission.createdAt).toLocaleDateString()}</span>
                        </div>
                        
                        {mission.tags && mission.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {mission.tags.map((tagRelation) => (
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
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {searchResults.pagination.totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-6">
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                    Previous
                  </button>
                  <span className="px-3 py-2 text-sm text-gray-600">
                    Page {searchResults.pagination.page} of {searchResults.pagination.totalPages}
                  </span>
                  <button className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <NotificationSystem />
        
        <main>
          <Routes>
            {/* Main Dashboard */}
            <Route path="/" element={<Dashboard />} />
            
            {/* Mission Management */}
            <Route path="/missions" element={<MissionsPage />} />
            
            {/* Advanced Features */}
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/templates" element={<MissionTemplates />} />
            <Route path="/bulk-operations" element={<BulkOperations />} />
            <Route path="/workflow-rules" element={<WorkflowRules />} />
            <Route path="/files" element={<FileManager showMissionSelector={true} />} />
            <Route path="/reports" element={<ReportingDashboard />} />
            
            {/* System Management */}
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            
            {/* File management for specific missions */}
            <Route path="/missions/:missionId/files" element={
              <FileManager showMissionSelector={false} />
            } />
            
            {/* Fallback route */}
            <Route path="*" element={
              <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                  <p className="text-gray-600 mb-8">Page not found</p>
                  <a 
                    href="/" 
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Go Home
                  </a>
                </div>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
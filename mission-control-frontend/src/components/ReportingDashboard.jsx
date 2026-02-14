import React, { useState, useEffect } from 'react'
import { 
  FileText, Download, Calendar, Clock, Settings, 
  Play, Pause, Trash2, Edit, Plus, BarChart3,
  PieChart, TrendingUp, Users, Target, Activity,
  Mail, Share, Filter, RefreshCw
} from 'lucide-react'
import { 
  BarChart, Bar, LineChart, Line, PieChart as RechartsPie, 
  Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, AreaChart, Area
} from 'recharts'
import apiClient from '../services/apiClient'

const ReportingDashboard = () => {
  const [reports, setReports] = useState([])
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [generateLoading, setGenerateLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)
  const [reportData, setReportData] = useState(null)
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    }
  })

  const [reportForm, setReportForm] = useState({
    name: '',
    description: '',
    reportType: '',
    filters: {},
    format: 'PDF',
    schedule: '',
    timezone: 'UTC',
    recipients: [],
    isActive: true
  })

  const reportTypes = [
    {
      id: 'MISSION_SUMMARY',
      name: 'Mission Summary Report',
      description: 'Overview of mission statuses, priorities, and completion rates',
      icon: Target,
      defaultFilters: {
        dateRange: true,
        status: true,
        priority: true
      }
    },
    {
      id: 'AGENT_PERFORMANCE',
      name: 'Agent Performance Report',
      description: 'Agent productivity metrics, success rates, and workload analysis',
      icon: Users,
      defaultFilters: {
        dateRange: true,
        agentIds: true
      }
    },
    {
      id: 'USER_PRODUCTIVITY',
      name: 'User Productivity Report',
      description: 'User activity, mission creation, and completion statistics',
      icon: Activity,
      defaultFilters: {
        dateRange: true,
        userIds: true
      }
    },
    {
      id: 'SYSTEM_OVERVIEW',
      name: 'System Overview Report',
      description: 'System performance, storage usage, and operational metrics',
      icon: BarChart3,
      defaultFilters: {
        dateRange: true
      }
    },
    {
      id: 'CUSTOM_QUERY',
      name: 'Custom Query Report',
      description: 'Custom SQL query for advanced reporting needs',
      icon: Settings,
      defaultFilters: {
        query: true
      }
    }
  ]

  const formatOptions = [
    { value: 'PDF', label: 'PDF Document' },
    { value: 'CSV', label: 'CSV Spreadsheet' },
    { value: 'EXCEL', label: 'Excel Workbook' },
    { value: 'JSON', label: 'JSON Data' }
  ]

  const scheduleOptions = [
    { value: '0 9 * * *', label: 'Daily at 9 AM' },
    { value: '0 9 * * 1', label: 'Weekly on Monday at 9 AM' },
    { value: '0 9 1 * *', label: 'Monthly on 1st at 9 AM' },
    { value: '0 9 1 1,4,7,10 *', label: 'Quarterly at 9 AM' },
    { value: 'custom', label: 'Custom Schedule' }
  ]

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16']

  useEffect(() => {
    fetchReports()
    fetchSchedules()
  }, [])

  const fetchReports = async () => {
    try {
      // For demo purposes, we'll create some sample reports
      setReports([])
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    }
  }

  const fetchSchedules = async () => {
    try {
      const response = await apiClient.get('/api/reports/schedules')
      setSchedules(response.data)
    } catch (error) {
      console.error('Failed to fetch schedules:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async (reportType, filters = {}) => {
    setGenerateLoading(true)
    try {
      const reportConfig = reportTypes.find(r => r.id === reportType)
      
      // Generate different types of reports
      switch (reportType) {
        case 'MISSION_SUMMARY':
          await generateMissionSummaryReport(filters)
          break
        case 'AGENT_PERFORMANCE':
          await generateAgentPerformanceReport(filters)
          break
        case 'USER_PRODUCTIVITY':
          await generateUserProductivityReport(filters)
          break
        case 'SYSTEM_OVERVIEW':
          await generateSystemOverviewReport(filters)
          break
        default:
          alert('Report type not implemented')
      }
    } catch (error) {
      console.error('Failed to generate report:', error)
      alert('Failed to generate report')
    } finally {
      setGenerateLoading(false)
    }
  }

  const generateMissionSummaryReport = async (filters) => {
    const dateRangeParam = `${dateRange.start},${dateRange.end}`
    
    const [dashboard, missions] = await Promise.all([
      apiClient.get(`/api/analytics/dashboard?dateRange=${dateRangeParam}`),
      apiClient.post('/api/missions/search', {
        dateRange: { start: dateRange.start, end: dateRange.end },
        ...filters,
        limit: 1000
      })
    ])
    
    setReportData({
      type: 'MISSION_SUMMARY',
      title: 'Mission Summary Report',
      generatedAt: new Date().toISOString(),
      dateRange,
      data: {
        overview: dashboard.data.overview,
        distributions: dashboard.data.distributions,
        missions: missions.data.missions,
        trends: dashboard.data.trends
      }
    })
  }

  const generateAgentPerformanceReport = async (filters) => {
    const dateRangeParam = `${dateRange.start},${dateRange.end}`
    
    const response = await apiClient.get(`/api/analytics/agents?dateRange=${dateRangeParam}`)
    
    setReportData({
      type: 'AGENT_PERFORMANCE',
      title: 'Agent Performance Report',
      generatedAt: new Date().toISOString(),
      dateRange,
      data: response.data
    })
  }

  const generateUserProductivityReport = async (filters) => {
    const dateRangeParam = `${dateRange.start},${dateRange.end}`
    
    const response = await apiClient.get(`/api/analytics/users?dateRange=${dateRangeParam}`)
    
    setReportData({
      type: 'USER_PRODUCTIVITY',
      title: 'User Productivity Report',
      generatedAt: new Date().toISOString(),
      dateRange,
      data: response.data
    })
  }

  const generateSystemOverviewReport = async (filters) => {
    const dateRangeParam = `${dateRange.start},${dateRange.end}`
    
    const response = await apiClient.get(`/api/analytics/system?dateRange=${dateRangeParam}`)
    
    setReportData({
      type: 'SYSTEM_OVERVIEW',
      title: 'System Overview Report',
      generatedAt: new Date().toISOString(),
      dateRange,
      data: response.data
    })
  }

  const exportReport = (format = 'PDF') => {
    if (!reportData) {
      alert('Please generate a report first')
      return
    }
    
    // In a real implementation, this would call an API to generate the file
    const dataStr = JSON.stringify(reportData, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `${reportData.title.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    
    URL.revokeObjectURL(url)
  }

  const createSchedule = async () => {
    try {
      const response = await apiClient.post('/api/reports/schedules', reportForm)
      setSchedules([response.data, ...schedules])
      setShowScheduleModal(false)
      resetForm()
    } catch (error) {
      console.error('Failed to create schedule:', error)
      alert('Failed to create schedule')
    }
  }

  const deleteSchedule = async (id) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return
    
    try {
      await apiClient.delete(`/api/reports/schedules/${id}`)
      setSchedules(schedules.filter(s => s.id !== id))
    } catch (error) {
      console.error('Failed to delete schedule:', error)
      alert('Failed to delete schedule')
    }
  }

  const toggleSchedule = async (id, isActive) => {
    try {
      await apiClient.put(`/api/reports/schedules/${id}`, { isActive })
      setSchedules(schedules.map(s => s.id === id ? { ...s, isActive } : s))
    } catch (error) {
      console.error('Failed to toggle schedule:', error)
      alert('Failed to toggle schedule')
    }
  }

  const resetForm = () => {
    setReportForm({
      name: '',
      description: '',
      reportType: '',
      filters: {},
      format: 'PDF',
      schedule: '',
      timezone: 'UTC',
      recipients: [],
      isActive: true
    })
  }

  const ReportTypeCard = ({ reportType }) => {
    const IconComponent = reportType.icon
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center mb-4">
          <IconComponent className="w-8 h-8 text-blue-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">{reportType.name}</h3>
        </div>
        <p className="text-gray-600 text-sm mb-4">{reportType.description}</p>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => generateReport(reportType.id)}
            disabled={generateLoading}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {generateLoading ? (
              <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-1" />
            )}
            Generate
          </button>
          <button
            onClick={() => {
              setReportForm(prev => ({ ...prev, reportType: reportType.id, name: reportType.name }))
              setShowScheduleModal(true)
            }}
            className="flex items-center px-3 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
          >
            <Calendar className="w-4 h-4 mr-1" />
            Schedule
          </button>
        </div>
      </div>
    )
  }

  const MissionSummaryReport = ({ data }) => (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-700">{data.overview.totalMissions}</div>
          <div className="text-sm text-blue-600">Total Missions</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-700">{data.overview.completedMissions}</div>
          <div className="text-sm text-green-600">Completed</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-700">{data.overview.activeMissions}</div>
          <div className="text-sm text-yellow-600">Active</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-700">{data.overview.overdueMissions}</div>
          <div className="text-sm text-red-600">Overdue</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold mb-4">Status Distribution</h4>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPie>
              <RechartsPie
                data={data.distributions.status}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                dataKey="_count.id"
                nameKey="status"
              >
                {data.distributions.status.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </RechartsPie>
              <Tooltip />
              <Legend />
            </RechartsPie>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold mb-4">Creation Trend</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.trends.dailyCreations}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Missions Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-lg font-semibold">Recent Missions</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.missions.slice(0, 10).map((mission) => (
                <tr key={mission.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {mission.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      mission.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      mission.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                      mission.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {mission.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      mission.priority === 'CRITICAL' ? 'bg-purple-100 text-purple-800' :
                      mission.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                      mission.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                      mission.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {mission.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {mission.agent?.name || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(mission.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const AgentPerformanceReport = ({ data }) => (
    <div className="space-y-6">
      {/* Top Performers */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold mb-4">Top Performing Agents</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Success Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Duration
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.topPerformers.map((agent) => (
                <tr key={agent.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {agent.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {agent.completed_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      agent.success_rate >= 90 ? 'bg-green-100 text-green-800' :
                      agent.success_rate >= 70 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {agent.success_rate?.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {agent.avg_duration ? `${agent.avg_duration.toFixed(1)}h` : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Productivity Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold mb-4">Agent Productivity Trend</h4>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data.productivity}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="missions_completed" 
              stackId="1"
              stroke="#10B981" 
              fill="#10B981"
              fillOpacity={0.6}
              name="Completed"
            />
            <Area 
              type="monotone" 
              dataKey="missions_created" 
              stackId="1"
              stroke="#3B82F6" 
              fill="#3B82F6"
              fillOpacity={0.6}
              name="Created"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )

  const ScheduleModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Schedule Report</h3>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Name
            </label>
            <input
              type="text"
              value={reportForm.name}
              onChange={(e) => setReportForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Schedule
            </label>
            <select
              value={reportForm.schedule}
              onChange={(e) => setReportForm(prev => ({ ...prev, schedule: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select schedule</option>
              {scheduleOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Format
            </label>
            <select
              value={reportForm.format}
              onChange={(e) => setReportForm(prev => ({ ...prev, format: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {formatOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Recipients (comma-separated)
            </label>
            <input
              type="text"
              placeholder="user@example.com, admin@example.com"
              onChange={(e) => setReportForm(prev => ({ 
                ...prev, 
                recipients: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200">
          <button
            onClick={() => setShowScheduleModal(false)}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={createSchedule}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Schedule
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reporting Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Generate comprehensive reports and schedule automated deliveries
            </p>
          </div>
          
          <div className="mt-4 lg:mt-0 flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Report Types */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Available Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportTypes.map(reportType => (
              <ReportTypeCard key={reportType.id} reportType={reportType} />
            ))}
          </div>
        </div>

        {/* Generated Report */}
        {reportData && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{reportData.title}</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Generated on {new Date(reportData.generatedAt).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Period: {new Date(reportData.dateRange.start).toLocaleDateString()} - {new Date(reportData.dateRange.end).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {formatOptions.map(format => (
                      <button
                        key={format.value}
                        onClick={() => exportReport(format.value)}
                        className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        {format.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {reportData.type === 'MISSION_SUMMARY' && <MissionSummaryReport data={reportData.data} />}
                {reportData.type === 'AGENT_PERFORMANCE' && <AgentPerformanceReport data={reportData.data} />}
                {reportData.type === 'USER_PRODUCTIVITY' && (
                  <div className="text-center py-8 text-gray-600">User Productivity Report visualization would be implemented here</div>
                )}
                {reportData.type === 'SYSTEM_OVERVIEW' && (
                  <div className="text-center py-8 text-gray-600">System Overview Report visualization would be implemented here</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Scheduled Reports */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Scheduled Reports</h2>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Schedule
            </button>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading schedules...</p>
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No scheduled reports</p>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Your First Schedule
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Report
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Schedule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Format
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipients
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {schedules.map((schedule) => (
                    <tr key={schedule.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{schedule.name}</div>
                          <div className="text-sm text-gray-500 capitalize">{schedule.reportType.replace('_', ' ').toLowerCase()}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {scheduleOptions.find(opt => opt.value === schedule.schedule)?.label || schedule.schedule}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {schedule.format}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {schedule.recipients.length} recipients
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          schedule.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {schedule.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleSchedule(schedule.id, !schedule.isActive)}
                            className={`p-1 rounded ${
                              schedule.isActive 
                                ? 'text-orange-600 hover:bg-orange-50' 
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                          >
                            {schedule.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => deleteSchedule(schedule.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Schedule Modal */}
        {showScheduleModal && <ScheduleModal />}
      </div>
    </div>
  )
}

export default ReportingDashboard
import React, { useState, useEffect } from 'react'
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'
import { 
  Calendar, Clock, TrendingUp, TrendingDown, Users, 
  Target, Activity, AlertCircle, CheckCircle, 
  Download, Filter, RefreshCw
} from 'lucide-react'
import apiClient from '../services/apiClient'

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    }
  })
  
  const [dashboardData, setDashboardData] = useState(null)
  const [agentData, setAgentData] = useState(null)
  const [velocityData, setVelocityData] = useState(null)
  const [systemData, setSystemData] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const dateRangeParam = `${dateRange.start},${dateRange.end}`
      
      const [dashboard, agents, velocity, system] = await Promise.all([
        apiClient.get(`/api/analytics/dashboard?dateRange=${dateRangeParam}`),
        apiClient.get(`/api/analytics/agents?dateRange=${dateRangeParam}`),
        apiClient.get(`/api/analytics/velocity?dateRange=${dateRangeParam}&groupBy=day`),
        apiClient.get(`/api/analytics/system?dateRange=${dateRangeParam}`)
      ])
      
      setDashboardData(dashboard.data)
      setAgentData(agents.data)
      setVelocityData(velocity.data)
      setSystemData(system.data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const MetricCard = ({ title, value, icon: Icon, trend, trendValue, color = 'blue' }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              {trendValue}
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg bg-${color}-100 flex items-center justify-center`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  )

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Missions"
          value={dashboardData?.overview.totalMissions || 0}
          icon={Target}
          color="blue"
        />
        <MetricCard
          title="Completion Rate"
          value={`${(dashboardData?.overview.completionRate || 0).toFixed(1)}%`}
          icon={CheckCircle}
          color="green"
        />
        <MetricCard
          title="Active Missions"
          value={dashboardData?.overview.activeMissions || 0}
          icon={Activity}
          color="yellow"
        />
        <MetricCard
          title="Overdue Missions"
          value={dashboardData?.overview.overdueMissions || 0}
          icon={AlertCircle}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mission Status Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mission Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dashboardData?.distributions.status || []}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                dataKey="_count.id"
                nameKey="status"
              >
                {(dashboardData?.distributions.status || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Mission Trends */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mission Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardData?.trends.dailyCreations || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="Created"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )

  const AgentsTab = () => (
    <div className="space-y-6">
      {/* Top Performing Agents */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Agents</h3>
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
              {(agentData?.topPerformers || []).map((agent) => (
                <tr key={agent.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {agent.completed_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      agent.success_rate >= 90 ? 'bg-green-100 text-green-800' :
                      agent.success_rate >= 70 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {agent.success_rate?.toFixed(1) || 0}%
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

      {/* Agent Productivity Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Productivity Over Time</h3>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={agentData?.productivity || []}>
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

  const VelocityTab = () => (
    <div className="space-y-6">
      {/* Velocity Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Avg Lead Time"
          value={`${(velocityData?.leadCycleTime?.[0]?.avg_lead_time_hours || 0).toFixed(1)}h`}
          icon={Clock}
          color="blue"
        />
        <MetricCard
          title="Avg Cycle Time"
          value={`${(velocityData?.leadCycleTime?.[0]?.avg_cycle_time_hours || 0).toFixed(1)}h`}
          icon={Activity}
          color="green"
        />
        <MetricCard
          title="Throughput"
          value={velocityData?.velocity?.reduce((sum, item) => sum + item.completed, 0) || 0}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Velocity Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Mission Velocity</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={velocityData?.velocity || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="created" fill="#3B82F6" name="Created" />
            <Bar dataKey="completed" fill="#10B981" name="Completed" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cumulative Flow Diagram */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cumulative Flow</h3>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={velocityData?.cumulativeFlow || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="PENDING" 
              stackId="1"
              stroke="#F59E0B" 
              fill="#F59E0B"
              fillOpacity={0.8}
            />
            <Area 
              type="monotone" 
              dataKey="IN_PROGRESS" 
              stackId="1"
              stroke="#3B82F6" 
              fill="#3B82F6"
              fillOpacity={0.8}
            />
            <Area 
              type="monotone" 
              dataKey="COMPLETED" 
              stackId="1"
              stroke="#10B981" 
              fill="#10B981"
              fillOpacity={0.8}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )

  const SystemTab = () => (
    <div className="space-y-6">
      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Total Operations"
          value={systemData?.systemMetrics?.reduce((sum, item) => sum + item.total_operations, 0) || 0}
          icon={Activity}
          color="blue"
        />
        <MetricCard
          title="Storage Used"
          value={`${((systemData?.storageMetrics?.[0]?.total_size_bytes || 0) / 1024 / 1024).toFixed(1)} MB`}
          icon={Download}
          color="green"
        />
        <MetricCard
          title="Total Files"
          value={systemData?.storageMetrics?.[0]?.total_files || 0}
          icon={Target}
          color="purple"
        />
      </div>

      {/* System Activity Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Activity</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={systemData?.systemMetrics || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="total_operations" 
              stroke="#3B82F6" 
              strokeWidth={2}
              name="Total Operations"
            />
            <Line 
              type="monotone" 
              dataKey="mission_operations" 
              stroke="#10B981" 
              strokeWidth={2}
              name="Mission Operations"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Error Rates */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Error Rates</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={systemData?.errorRates || []}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              dataKey="_count.id"
              nameKey="status"
            >
              {(systemData?.errorRates || []).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Target },
    { id: 'agents', name: 'Agents', icon: Users },
    { id: 'velocity', name: 'Velocity', icon: TrendingUp },
    { id: 'system', name: 'System', icon: Activity }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Comprehensive insights into mission performance and system metrics
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
            
            <button
              onClick={fetchAnalytics}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="p-6">
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'agents' && <AgentsTab />}
            {activeTab === 'velocity' && <VelocityTab />}
            {activeTab === 'system' && <SystemTab />}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsDashboard
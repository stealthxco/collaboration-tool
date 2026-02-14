import React from 'react';
import { useHealthStatus, useAgents, useMissions } from '../hooks/useApiQueries.js';
import { useConnectionState, useRealTimeData, useNotifications } from '../store/appStore.js';
import { Activity, Server, Users, Target, Zap, AlertCircle, CheckCircle, Clock } from 'lucide-react';

function Dashboard() {
  const { data: healthStatus, isLoading: healthLoading, error: healthError } = useHealthStatus();
  const { data: agents, isLoading: agentsLoading } = useAgents({ page: 1, limit: 5 });
  const { data: missions, isLoading: missionsLoading } = useMissions({ page: 1, limit: 5 });
  
  const connection = useConnectionState();
  const realTimeData = useRealTimeData();
  const { notifications, unreadCount } = useNotifications();

  // Stats calculations
  const agentStats = {
    total: agents?.data?.length || 0,
    active: agents?.data?.filter(a => a.status === 'BUSY').length || 0,
    idle: agents?.data?.filter(a => a.status === 'IDLE').length || 0,
    offline: agents?.data?.filter(a => a.status === 'OFFLINE').length || 0,
  };

  const missionStats = {
    total: missions?.data?.length || 0,
    pending: missions?.data?.filter(m => m.status === 'PENDING').length || 0,
    inProgress: missions?.data?.filter(m => m.status === 'IN_PROGRESS').length || 0,
    completed: missions?.data?.filter(m => m.status === 'COMPLETED').length || 0,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mission Control Dashboard</h1>
          <p className="text-gray-600">Real-time monitoring and management</p>
        </div>
        
        {/* Connection Status */}
        <ConnectionStatusBadge connection={connection} />
      </div>

      {/* System Health */}
      <SystemHealthCard 
        health={healthStatus} 
        loading={healthLoading} 
        error={healthError} 
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Agents"
          value={agentStats.total}
          subtitle={`${agentStats.active} active`}
          icon={Users}
          color="blue"
          loading={agentsLoading}
        />
        <StatsCard
          title="Missions"
          value={missionStats.total}
          subtitle={`${missionStats.inProgress} in progress`}
          icon={Target}
          color="green"
          loading={missionsLoading}
        />
        <StatsCard
          title="Real-time Updates"
          value={Object.keys(realTimeData.agents).length + Object.keys(realTimeData.missions).length}
          subtitle="Live connections"
          icon={Zap}
          color="yellow"
        />
        <StatsCard
          title="Notifications"
          value={notifications.length}
          subtitle={`${unreadCount} unread`}
          icon={AlertCircle}
          color="purple"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentAgents agents={agents?.data || []} loading={agentsLoading} />
        <RecentMissions missions={missions?.data || []} loading={missionsLoading} />
      </div>

      {/* Real-time Updates Section */}
      <RealTimeUpdatesSection realTimeData={realTimeData} />
    </div>
  );
}

function ConnectionStatusBadge({ connection }) {
  const getStatusConfig = () => {
    if (!connection.isOnline) {
      return { color: 'bg-red-500', text: 'Offline', icon: '🔴' };
    }
    if (connection.socketConnected) {
      return { color: 'bg-green-500', text: 'Connected', icon: '🟢' };
    }
    return { color: 'bg-yellow-500', text: 'Connecting...', icon: '🟡' };
  };

  const { color, text, icon } = getStatusConfig();

  return (
    <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-100">
      <div className={`w-2 h-2 rounded-full ${color}`}></div>
      <span className="text-sm font-medium">{icon} {text}</span>
      {connection.socketId && (
        <span className="text-xs text-gray-500">({connection.socketId.slice(0, 8)})</span>
      )}
    </div>
  );
}

function SystemHealthCard({ health, loading, error }) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <div>
            <h3 className="text-lg font-semibold text-red-800">System Health Check Failed</h3>
            <p className="text-red-600">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  const healthData = health?.data;
  const isHealthy = health?.success && healthData?.services;
  const allServicesHealthy = healthData?.services && 
    Object.values(healthData.services).every(status => status === 'healthy');

  return (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${
      isHealthy && allServicesHealthy ? 'border-green-500' : 'border-yellow-500'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            isHealthy && allServicesHealthy ? 'bg-green-100' : 'bg-yellow-100'
          }`}>
            <Server className={`w-6 h-6 ${
              isHealthy && allServicesHealthy ? 'text-green-600' : 'text-yellow-600'
            }`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">System Health</h3>
            <p className="text-gray-600">
              {isHealthy && allServicesHealthy ? 'All systems operational' : 'Some services degraded'}
            </p>
          </div>
        </div>
        <div className="text-right text-sm text-gray-500">
          <div>Uptime: {healthData?.uptime ? Math.round(healthData.uptime / 3600) : 0}h</div>
          <div>Memory: {healthData?.memory?.used || 'N/A'}</div>
        </div>
      </div>
      
      {healthData?.services && (
        <div className="mt-4 grid grid-cols-3 gap-4">
          {Object.entries(healthData.services).map(([service, status]) => (
            <div key={service} className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm capitalize">{service}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatsCard({ title, value, subtitle, icon: Icon, color, loading }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="h-6 bg-gray-200 rounded w-12"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function RecentAgents({ agents, loading }) {
  if (loading) {
    return <ListLoadingSkeleton title="Recent Agents" />;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Recent Agents
        </h3>
      </div>
      <div className="divide-y divide-gray-200">
        {agents.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No agents found</div>
        ) : (
          agents.slice(0, 5).map((agent) => (
            <AgentListItem key={agent.id} agent={agent} />
          ))
        )}
      </div>
    </div>
  );
}

function RecentMissions({ missions, loading }) {
  if (loading) {
    return <ListLoadingSkeleton title="Recent Missions" />;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold flex items-center">
          <Target className="w-5 h-5 mr-2" />
          Recent Missions
        </h3>
      </div>
      <div className="divide-y divide-gray-200">
        {missions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No missions found</div>
        ) : (
          missions.slice(0, 5).map((mission) => (
            <MissionListItem key={mission.id} mission={mission} />
          ))
        )}
      </div>
    </div>
  );
}

function AgentListItem({ agent }) {
  const statusColors = {
    IDLE: 'bg-gray-100 text-gray-800',
    BUSY: 'bg-blue-100 text-blue-800',
    OFFLINE: 'bg-red-100 text-red-800',
    ERROR: 'bg-red-100 text-red-800',
  };

  return (
    <div className="p-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium">{agent.name.charAt(0).toUpperCase()}</span>
        </div>
        <div>
          <p className="font-medium">{agent.name}</p>
          <p className="text-sm text-gray-600">{agent.description || 'No description'}</p>
        </div>
      </div>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[agent.status]}`}>
        {agent.status}
      </span>
    </div>
  );
}

function MissionListItem({ mission }) {
  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  };

  const StatusIcon = {
    PENDING: Clock,
    IN_PROGRESS: Activity,
    COMPLETED: CheckCircle,
    FAILED: AlertCircle,
    CANCELLED: AlertCircle,
  }[mission.status];

  return (
    <div className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-medium">{mission.title}</p>
          <p className="text-sm text-gray-600 mt-1">{mission.description || 'No description'}</p>
          {mission.agent && (
            <p className="text-xs text-gray-500 mt-2">Assigned to: {mission.agent.name}</p>
          )}
        </div>
        <div className="flex flex-col items-end space-y-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${statusColors[mission.status]}`}>
            <StatusIcon className="w-3 h-3" />
            <span>{mission.status.replace('_', ' ')}</span>
          </span>
          {mission.progress > 0 && (
            <div className="text-xs text-gray-500">{mission.progress}%</div>
          )}
        </div>
      </div>
    </div>
  );
}

function RealTimeUpdatesSection({ realTimeData }) {
  const lastUpdate = realTimeData.lastUpdate 
    ? new Date(realTimeData.lastUpdate).toLocaleTimeString() 
    : 'Never';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Zap className="w-5 h-5 mr-2 text-yellow-500" />
          Real-time Data
        </h3>
        <span className="text-sm text-gray-500">Last update: {lastUpdate}</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium mb-2">Live Agent Updates</h4>
          <div className="space-y-2">
            {realTimeData.agents.size === 0 ? (
              <p className="text-gray-500 text-sm">No real-time agent data</p>
            ) : (
              Array.from(realTimeData.agents.entries()).map(([agentId, data]) => (
                <div key={agentId} className="text-sm flex justify-between">
                  <span>{agentId.slice(0, 8)}...</span>
                  <span className="text-gray-600">{data.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Live Mission Updates</h4>
          <div className="space-y-2">
            {realTimeData.missions.size === 0 ? (
              <p className="text-gray-500 text-sm">No real-time mission data</p>
            ) : (
              Array.from(realTimeData.missions.entries()).map(([missionId, data]) => (
                <div key={missionId} className="text-sm flex justify-between">
                  <span>{missionId.slice(0, 8)}...</span>
                  <span className="text-gray-600">{data.status} ({data.progress || 0}%)</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ListLoadingSkeleton({ title }) {
  return (
    <div className="bg-white rounded-lg shadow animate-pulse">
      <div className="p-6 border-b border-gray-200">
        <div className="h-6 bg-gray-200 rounded w-32"></div>
      </div>
      <div className="divide-y divide-gray-200">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 flex items-center space-x-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-3 bg-gray-200 rounded w-48"></div>
            </div>
            <div className="w-16 h-6 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
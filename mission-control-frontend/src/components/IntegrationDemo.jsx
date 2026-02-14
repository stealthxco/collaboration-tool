import React, { useState } from 'react';
import { 
  useHealthStatus, 
  useAgents, 
  useMissions,
  useCreateMission,
  useUpdateMission,
  useCreateAgent,
  useUpdateAgent 
} from '../hooks/useApiQueries.js';
import { 
  useSocket, 
  useSocketConnection, 
  useAgentStatusUpdates, 
  useMissionUpdates, 
  useSystemNotifications 
} from '../hooks/useSocket.js';
import { 
  useConnectionState, 
  useRealTimeData, 
  useNotifications, 
  useUIActions 
} from '../store/appStore.js';
import { Wifi, WifiOff, Play, Square, Users, Target, Zap, AlertCircle } from 'lucide-react';

/**
 * Integration Demo Component
 * Demonstrates the full integration layer:
 * - API queries with React Query
 * - Real-time WebSocket updates
 * - State management with Zustand
 * - Error handling and loading states
 */
function IntegrationDemo() {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedMission, setSelectedMission] = useState(null);

  // API queries
  const { data: health, isLoading: healthLoading, error: healthError } = useHealthStatus();
  const { data: agents, isLoading: agentsLoading, refetch: refetchAgents } = useAgents();
  const { data: missions, isLoading: missionsLoading, refetch: refetchMissions } = useMissions();

  // Mutations
  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();
  const createMission = useCreateMission();
  const updateMission = useUpdateMission();

  // WebSocket connection
  const socket = useSocket();
  const connection = useSocketConnection();

  // Store state
  const connectionState = useConnectionState();
  const realTimeData = useRealTimeData();
  const { notifications, addNotification } = useNotifications();
  const { setLoading } = useUIActions();

  // Real-time event handlers
  useAgentStatusUpdates(selectedAgent?.id, (data) => {
    console.log('Agent status update received:', data);
  });

  useMissionUpdates(selectedMission?.id, (data) => {
    console.log('Mission update received:', data);
  });

  useSystemNotifications((notification) => {
    console.log('System notification received:', notification);
  });

  // Demo actions
  const handleCreateDemoAgent = async () => {
    try {
      setLoading(true);
      const result = await createAgent.mutateAsync({
        name: `Demo Agent ${Date.now()}`,
        description: 'A demo agent for testing real-time features',
        capabilities: ['demo', 'testing'],
        metadata: { demo: true, created: new Date().toISOString() }
      });
      addNotification({
        type: 'success',
        message: `Created demo agent: ${result.data.data.name}`
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Failed to create agent: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDemoMission = async () => {
    if (!selectedAgent) {
      addNotification({
        type: 'warning',
        message: 'Please select an agent first'
      });
      return;
    }

    try {
      setLoading(true);
      const result = await createMission.mutateAsync({
        title: `Demo Mission ${Date.now()}`,
        description: 'A demo mission for testing real-time updates',
        priority: 'MEDIUM',
        agentId: selectedAgent.id,
        metadata: { demo: true, created: new Date().toISOString() }
      });
      addNotification({
        type: 'success',
        message: `Created demo mission: ${result.data.data.title}`
      });
      setSelectedMission(result.data.data);
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Failed to create mission: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAgentStatus = async (agentId, status) => {
    try {
      await updateAgent.mutateAsync({
        id: agentId,
        data: { status }
      });
      addNotification({
        type: 'info',
        message: `Updated agent status to ${status}`
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Failed to update agent: ${error.message}`
      });
    }
  };

  const handleUpdateMissionProgress = async (missionId, progress, status) => {
    try {
      await updateMission.mutateAsync({
        id: missionId,
        data: { progress, status }
      });
      addNotification({
        type: 'info',
        message: `Updated mission progress to ${progress}%`
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Failed to update mission: ${error.message}`
      });
    }
  };

  const handlePingSocket = () => {
    socket.ping((response) => {
      addNotification({
        type: 'info',
        message: `Socket ping: ${response}`,
        duration: 2000
      });
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <Zap className="w-6 h-6 mr-2 text-yellow-500" />
          Integration Layer Demo
        </h2>
        <p className="text-gray-600 mb-6">
          This demo shows the complete integration between frontend and backend with real-time updates.
        </p>

        {/* Connection Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <ConnectionStatusCard connection={connectionState} />
          <SystemHealthCard health={health} loading={healthLoading} error={healthError} />
          <RealTimeDataCard realTimeData={realTimeData} />
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <button
            onClick={handleCreateDemoAgent}
            disabled={createAgent.isLoading}
            className="btn btn-primary"
          >
            <Users className="w-4 h-4 mr-2" />
            Create Demo Agent
          </button>
          
          <button
            onClick={handleCreateDemoMission}
            disabled={createMission.isLoading || !selectedAgent}
            className="btn btn-secondary"
          >
            <Target className="w-4 h-4 mr-2" />
            Create Demo Mission
          </button>
          
          <button
            onClick={handlePingSocket}
            disabled={!connectionState.socketConnected}
            className="btn btn-secondary"
          >
            <Wifi className="w-4 h-4 mr-2" />
            Ping Socket
          </button>
          
          <button
            onClick={() => {
              refetchAgents();
              refetchMissions();
            }}
            className="btn btn-secondary"
          >
            🔄 Refresh Data
          </button>
        </div>

        {/* Data Display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AgentsSection
            agents={agents?.data || []}
            loading={agentsLoading}
            selectedAgent={selectedAgent}
            onSelectAgent={setSelectedAgent}
            onUpdateStatus={handleUpdateAgentStatus}
            realTimeData={realTimeData}
          />
          
          <MissionsSection
            missions={missions?.data || []}
            loading={missionsLoading}
            selectedMission={selectedMission}
            onSelectMission={setSelectedMission}
            onUpdateProgress={handleUpdateMissionProgress}
            realTimeData={realTimeData}
          />
        </div>

        {/* Recent Notifications */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Recent Notifications ({notifications.length})</h3>
          <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-sm">No notifications</p>
            ) : (
              <div className="space-y-2">
                {notifications.slice(0, 10).map((notification) => (
                  <div key={notification.id} className="text-sm flex justify-between">
                    <span className={notification.read ? 'text-gray-500' : 'text-gray-900'}>
                      {notification.message}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConnectionStatusCard({ connection }) {
  const isConnected = connection.isOnline && connection.socketConnected;
  const Icon = isConnected ? Wifi : WifiOff;
  const color = isConnected ? 'text-green-600' : 'text-red-600';
  const bgColor = isConnected ? 'bg-green-50' : 'bg-red-50';

  return (
    <div className={`${bgColor} rounded-lg p-4`}>
      <div className="flex items-center">
        <Icon className={`w-8 h-8 ${color}`} />
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-900">Connection</p>
          <p className={`text-xs ${color}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </p>
          {connection.socketId && (
            <p className="text-xs text-gray-500">ID: {connection.socketId.slice(0, 8)}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function SystemHealthCard({ health, loading, error }) {
  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 animate-pulse">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gray-200 rounded"></div>
          <div className="ml-3 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="w-8 h-8 text-red-600" />
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">Health Check</p>
            <p className="text-xs text-red-600">Error</p>
          </div>
        </div>
      </div>
    );
  }

  const isHealthy = health?.success;
  const color = isHealthy ? 'text-green-600' : 'text-yellow-600';
  const bgColor = isHealthy ? 'bg-green-50' : 'bg-yellow-50';

  return (
    <div className={`${bgColor} rounded-lg p-4`}>
      <div className="flex items-center">
        <div className={`w-8 h-8 rounded-full ${isHealthy ? 'bg-green-100' : 'bg-yellow-100'} flex items-center justify-center`}>
          <div className={`w-4 h-4 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-900">System Health</p>
          <p className={`text-xs ${color}`}>
            {isHealthy ? 'Healthy' : 'Degraded'}
          </p>
        </div>
      </div>
    </div>
  );
}

function RealTimeDataCard({ realTimeData }) {
  const totalUpdates = realTimeData.agents.size + realTimeData.missions.size;
  const lastUpdate = realTimeData.lastUpdate 
    ? new Date(realTimeData.lastUpdate).toLocaleTimeString()
    : 'None';

  return (
    <div className="bg-blue-50 rounded-lg p-4">
      <div className="flex items-center">
        <Zap className="w-8 h-8 text-blue-600" />
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-900">Real-time Data</p>
          <p className="text-xs text-blue-600">{totalUpdates} live updates</p>
          <p className="text-xs text-gray-500">Last: {lastUpdate}</p>
        </div>
      </div>
    </div>
  );
}

function AgentsSection({ agents, loading, selectedAgent, onSelectAgent, onUpdateStatus, realTimeData }) {
  if (loading) {
    return (
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Agents (Loading...)</h3>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-semibold mb-3">Agents ({agents.length})</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {agents.map((agent) => {
          const realtimeData = realTimeData.agents.get(agent.id);
          const isSelected = selectedAgent?.id === agent.id;
          
          return (
            <div
              key={agent.id}
              onClick={() => onSelectAgent(agent)}
              className={`p-3 border rounded cursor-pointer transition-colors ${
                isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium">{agent.name}</p>
                  <p className="text-sm text-gray-600">{agent.description}</p>
                  {realtimeData?.lastUpdate && (
                    <p className="text-xs text-green-600">
                      🔴 Live: {new Date(realtimeData.lastUpdate).toLocaleTimeString()}
                    </p>
                  )}
                </div>
                <div className="flex flex-col space-y-1">
                  <span className={`status-badge ${getStatusColor(agent.status)}`}>
                    {agent.status}
                  </span>
                  <select
                    value={agent.status}
                    onChange={(e) => {
                      e.stopPropagation();
                      onUpdateStatus(agent.id, e.target.value);
                    }}
                    className="text-xs border border-gray-300 rounded px-1 py-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="IDLE">IDLE</option>
                    <option value="BUSY">BUSY</option>
                    <option value="OFFLINE">OFFLINE</option>
                    <option value="ERROR">ERROR</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MissionsSection({ missions, loading, selectedMission, onSelectMission, onUpdateProgress, realTimeData }) {
  if (loading) {
    return (
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Missions (Loading...)</h3>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-semibold mb-3">Missions ({missions.length})</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {missions.map((mission) => {
          const realtimeData = realTimeData.missions.get(mission.id);
          const isSelected = selectedMission?.id === mission.id;
          const currentProgress = realtimeData?.progress ?? mission.progress;
          
          return (
            <div
              key={mission.id}
              onClick={() => onSelectMission(mission)}
              className={`p-3 border rounded cursor-pointer transition-colors ${
                isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium">{mission.title}</p>
                    <p className="text-sm text-gray-600">{mission.description}</p>
                    {mission.agent && (
                      <p className="text-xs text-gray-500">Agent: {mission.agent.name}</p>
                    )}
                    {realtimeData?.lastUpdate && (
                      <p className="text-xs text-green-600">
                        🔴 Live: {new Date(realtimeData.lastUpdate).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                  <span className={`status-badge ${getStatusColor(mission.status)}`}>
                    {mission.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Progress</span>
                    <span>{currentProgress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${currentProgress}%` }}
                    ></div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateProgress(mission.id, 25, 'IN_PROGRESS');
                      }}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded"
                    >
                      25%
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateProgress(mission.id, 50, 'IN_PROGRESS');
                      }}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded"
                    >
                      50%
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateProgress(mission.id, 100, 'COMPLETED');
                      }}
                      className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded"
                    >
                      Complete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getStatusColor(status) {
  const colors = {
    IDLE: 'neutral',
    BUSY: 'info',
    OFFLINE: 'error',
    ERROR: 'error',
    PENDING: 'warning',
    IN_PROGRESS: 'info',
    COMPLETED: 'success',
    FAILED: 'error',
    CANCELLED: 'neutral',
  };
  return colors[status] || 'neutral';
}

export default IntegrationDemo;
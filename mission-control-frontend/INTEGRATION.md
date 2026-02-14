# Mission Control Integration Layer

This document describes the integration layer that connects the Mission Control frontend to the backend with real-time capabilities.

## Architecture Overview

The integration layer consists of several key components:

1. **API Client** - HTTP communication with error handling and retry logic
2. **React Query Integration** - API state management with caching and synchronization
3. **WebSocket Client** - Real-time bidirectional communication
4. **State Management** - Zustand store for UI state and real-time data
5. **Integration Manager** - Central coordinator for all integrations
6. **Error Handling** - Consistent error handling and user feedback

## Components

### 1. API Configuration (`src/config/api.js`)

Centralizes all API configuration:

```javascript
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};
```

### 2. API Client (`src/services/apiClient.js`)

Axios-based HTTP client with:
- Request/response interceptors
- Error transformation
- Retry mechanism with exponential backoff
- Request timing and logging

### 3. API Services (`src/services/api.js`)

Service functions for each resource:
- Health API (`healthApi`)
- Agents API (`agentsApi`)
- Missions API (`missionsApi`)
- Comments API (`commentsApi`)

### 4. React Query Hooks (`src/hooks/useApiQueries.js`)

Custom hooks for data fetching:
- `useHealthStatus()` - System health monitoring
- `useAgents()`, `useAgent()` - Agent data management
- `useMissions()`, `useMission()` - Mission data management
- `useCreateAgent()`, `useUpdateAgent()` - Agent mutations
- `useCreateMission()`, `useUpdateMission()` - Mission mutations

### 5. WebSocket Client (`src/services/socketClient.js`)

Socket.io client with:
- Automatic connection management
- Room subscription support
- Event handler management
- Reconnection with exponential backoff
- Health monitoring

### 6. WebSocket Hooks (`src/hooks/useSocket.js`)

React hooks for WebSocket integration:
- `useSocket()` - Basic socket operations
- `useSocketConnection()` - Connection status monitoring
- `useAgentStatusUpdates()` - Real-time agent updates
- `useMissionUpdates()` - Real-time mission updates
- `useSystemNotifications()` - System-wide notifications

### 7. State Store (`src/store/appStore.js`)

Zustand store managing:
- Connection state
- UI state (theme, sidebar, modals)
- Real-time data cache
- Notifications
- Filters and preferences

### 8. Integration Manager (`src/components/IntegrationManager.jsx`)

Central component that:
- Manages WebSocket connection lifecycle
- Synchronizes real-time updates with React Query cache
- Handles connection state changes
- Provides system-wide error handling

## Usage Examples

### Basic Data Fetching

```jsx
import { useHealthStatus, useAgents } from '../hooks/useApiQueries.js';

function Dashboard() {
  const { data: health, isLoading, error } = useHealthStatus();
  const { data: agents } = useAgents();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>System Status: {health.success ? 'Healthy' : 'Issues'}</h1>
      <p>Agents: {agents?.data?.length || 0}</p>
    </div>
  );
}
```

### Real-time Updates

```jsx
import { useMissionUpdates } from '../hooks/useSocket.js';

function MissionProgress({ missionId }) {
  const [progress, setProgress] = useState(0);

  useMissionUpdates(missionId, (update) => {
    if (update.progress !== undefined) {
      setProgress(update.progress);
    }
  });

  return (
    <div>
      <div>Progress: {progress}%</div>
      <div className="progress-bar">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${progress}%` }} 
        />
      </div>
    </div>
  );
}
```

### Creating Data with Mutations

```jsx
import { useCreateMission } from '../hooks/useApiQueries.js';

function CreateMissionForm() {
  const createMission = useCreateMission();

  const handleSubmit = async (formData) => {
    try {
      const result = await createMission.mutateAsync({
        title: formData.title,
        description: formData.description,
        agentId: formData.agentId,
      });
      console.log('Mission created:', result.data);
    } catch (error) {
      console.error('Failed to create mission:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button 
        type="submit" 
        disabled={createMission.isLoading}
      >
        {createMission.isLoading ? 'Creating...' : 'Create Mission'}
      </button>
    </form>
  );
}
```

### Using Store State

```jsx
import { useConnectionState, useNotifications } from '../store/appStore.js';

function ConnectionStatus() {
  const connection = useConnectionState();
  const { notifications, unreadCount } = useNotifications();

  return (
    <div>
      <div>Status: {connection.socketConnected ? 'Connected' : 'Disconnected'}</div>
      <div>Notifications: {unreadCount} unread</div>
    </div>
  );
}
```

## Setup and Installation

### 1. Install Dependencies

The required dependencies are already in `package.json`:

```json
{
  "dependencies": {
    "react-query": "^3.39.3",
    "socket.io-client": "^4.7.2",
    "zustand": "^4.4.1",
    "axios": "^1.5.0"
  }
}
```

### 2. Wrap App with Providers

```jsx
import QueryProvider from './providers/QueryProvider.jsx';
import IntegrationManager from './components/IntegrationManager.jsx';

function App() {
  return (
    <QueryProvider>
      <IntegrationManager>
        {/* Your app components */}
      </IntegrationManager>
    </QueryProvider>
  );
}
```

### 3. Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

## Error Handling

The integration layer provides comprehensive error handling:

### API Errors

- Network errors are automatically retried
- 4xx errors are not retried (client errors)
- 5xx errors are retried with exponential backoff
- Errors are transformed into consistent format

### WebSocket Errors

- Automatic reconnection with exponential backoff
- Connection state tracking and notifications
- Graceful degradation when disconnected

### User Feedback

- Toast notifications for real-time updates
- Error boundaries for component errors
- Loading states throughout the application

## Real-time Event Types

The backend emits these WebSocket events:

1. **agentStatusUpdate** - Agent status changes
2. **missionUpdate** - Mission status/progress changes  
3. **newComment** - New comments added
4. **systemNotification** - System-wide notifications

Example event payloads:

```javascript
// Agent status update
{
  agentId: 'agent-123',
  status: 'BUSY'
}

// Mission update
{
  missionId: 'mission-456', 
  status: 'IN_PROGRESS',
  progress: 75
}

// System notification
{
  type: 'success',
  message: 'System backup completed',
  timestamp: '2023-12-07T10:30:00Z'
}
```

## Performance Considerations

### React Query Optimizations

- Stale time: 30 seconds (data considered fresh)
- Cache time: 5 minutes (data kept in memory)
- Background refetching on window focus disabled
- Retry logic with exponential backoff

### WebSocket Optimizations

- Room-based subscriptions (join specific agent/mission rooms)
- Event debouncing to prevent excessive updates
- Automatic cleanup on component unmount

### Store Optimizations

- Selective subscriptions to prevent unnecessary re-renders
- Immer integration for immutable updates
- Persistence for user preferences

## Testing

### API Testing

```javascript
import { renderHook } from '@testing-library/react';
import { useHealthStatus } from '../hooks/useApiQueries.js';

test('health status hook', async () => {
  const { result, waitFor } = renderHook(() => useHealthStatus());
  
  await waitFor(() => {
    expect(result.current.data).toBeTruthy();
  });
});
```

### WebSocket Testing

```javascript
import { renderHook } from '@testing-library/react';
import { useSocket } from '../hooks/useSocket.js';

test('socket connection', () => {
  const { result } = renderHook(() => useSocket());
  
  expect(result.current.getStatus).toBeDefined();
});
```

## Debugging

### Enable Debug Logging

```javascript
// In development, enable verbose logging
localStorage.setItem('debug', 'socket.io-client:socket');
```

### React Query Devtools

The QueryProvider includes React Query Devtools in development:

```jsx
{process.env.NODE_ENV === 'development' && (
  <ReactQueryDevtools initialIsOpen={false} />
)}
```

### Zustand Devtools

The store is configured with Redux DevTools integration:

```javascript
devtools(
  // store configuration
  {
    name: 'mission-control-store',
  }
)
```

## Best Practices

1. **Always handle loading and error states** in components
2. **Use optimistic updates** for better user experience
3. **Implement proper cleanup** in useEffect hooks
4. **Handle offline scenarios** gracefully
5. **Use TypeScript** for better type safety (recommended upgrade)
6. **Implement proper test coverage** for critical paths
7. **Monitor real-time event performance** in production

## Future Enhancements

1. **Offline Support** - Cache updates and sync when reconnected
2. **Message Queuing** - Queue failed requests for retry
3. **Performance Monitoring** - Track API response times and WebSocket latency
4. **Advanced Caching** - Implement service worker for offline-first approach
5. **TypeScript Migration** - Add full TypeScript support for better DX
6. **E2E Testing** - Implement comprehensive integration tests
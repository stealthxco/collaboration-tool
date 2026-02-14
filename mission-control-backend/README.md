# Mission Control Backend

A robust backend foundation for Mission Control built with **Fastify**, **TypeScript**, **PostgreSQL**, **Redis**, and **Socket.io**.

## 🚀 Features

- **Fastify Framework**: High-performance HTTP server
- **TypeScript**: Full type safety and modern JavaScript features
- **PostgreSQL + Prisma**: Robust database with type-safe ORM
- **Redis**: Caching and session management
- **Socket.io**: Real-time WebSocket communication
- **Comprehensive API**: RESTful endpoints for agents, missions, and comments
- **Health Monitoring**: Built-in health checks and system monitoring
- **Error Handling**: Graceful error handling and logging

## 📁 Project Structure

```
src/
├── routes/           # API route handlers
│   ├── agents.ts     # Agent management endpoints
│   ├── missions.ts   # Mission management endpoints
│   ├── comments.ts   # Comment system endpoints
│   └── health.ts     # Health check endpoints
├── services/         # Business logic and external services
│   ├── database.ts   # Database service (Prisma)
│   └── redis.ts      # Redis caching service
├── websocket/        # WebSocket implementation
│   └── socket.ts     # Socket.io server setup
├── types/            # TypeScript type definitions
│   └── index.ts      # Shared types and interfaces
├── server.ts         # Main Fastify server setup
└── index.ts          # Application entry point

prisma/
└── schema.prisma     # Database schema definition
```

## 🗄️ Database Schema

### Agents
- `id`: Unique identifier
- `name`: Agent name (unique)
- `description`: Optional description
- `status`: IDLE | BUSY | OFFLINE | ERROR
- `capabilities`: Array of agent capabilities
- `metadata`: Flexible JSON metadata

### Missions
- `id`: Unique identifier
- `title`: Mission title
- `description`: Optional description
- `status`: PENDING | IN_PROGRESS | COMPLETED | FAILED | CANCELLED
- `priority`: LOW | MEDIUM | HIGH | URGENT
- `progress`: 0-100 completion percentage
- `agentId`: Optional assigned agent
- `metadata`: Flexible JSON metadata

### Comments
- `id`: Unique identifier
- `content`: Comment text
- `type`: NOTE | SYSTEM | ERROR | WARNING | SUCCESS
- `agentId`: Optional related agent
- `missionId`: Optional related mission
- `metadata`: Flexible JSON metadata

## 🛠️ Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Redis server (optional but recommended)

### Installation

1. **Clone and install dependencies:**
```bash
cd mission-control-backend
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your database and Redis URLs
```

3. **Set up the database:**
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# Or run migrations (for production)
npm run db:migrate
```

4. **Build the project:**
```bash
npm run build
```

5. **Start the server:**
```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start
```

## 📡 API Endpoints

### Health Checks
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system information
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe

### Agents
- `GET /api/agents` - List agents (with pagination)
- `GET /api/agents/:id` - Get specific agent
- `POST /api/agents` - Create new agent
- `PATCH /api/agents/:id` - Update agent
- `DELETE /api/agents/:id` - Delete agent

### Missions
- `GET /api/missions` - List missions (with pagination and filters)
- `GET /api/missions/:id` - Get specific mission
- `POST /api/missions` - Create new mission
- `PATCH /api/missions/:id` - Update mission
- `DELETE /api/missions/:id` - Delete mission
- `GET /api/missions/:id/progress` - Get mission progress

### Comments
- `GET /api/comments` - List comments (with pagination and filters)
- `GET /api/comments/:id` - Get specific comment
- `POST /api/comments` - Create new comment
- `PATCH /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

## 🔌 WebSocket Events

### Server to Client Events
- `agentStatusUpdate` - Agent status changes
- `missionUpdate` - Mission status/progress updates
- `newComment` - New comments created
- `systemNotification` - System-wide notifications

### Client to Server Events
- `joinRoom` - Join a specific room (agent:id or mission:id)
- `leaveRoom` - Leave a room
- `ping` - Connection health check

## 🏗️ Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio
```

### Environment Variables
```env
DATABASE_URL="postgresql://username:password@localhost:5432/mission_control"
REDIS_URL="redis://localhost:6379"
PORT=3000
HOST=localhost
JWT_SECRET="your-secret-key"
NODE_ENV=development
```

## 📊 Monitoring

The application includes comprehensive health monitoring:

- **Service Health**: Database, Redis, and WebSocket status
- **System Metrics**: Memory usage, uptime, connections
- **Application Stats**: Record counts and performance metrics
- **Real-time Updates**: WebSocket connection monitoring

## 🔧 Architecture Decisions

1. **Fastify over Express**: Better performance and TypeScript support
2. **Prisma ORM**: Type-safe database access with excellent tooling
3. **Redis Caching**: Improved API response times
4. **Socket.io**: Reliable real-time communication
5. **Service Layer Pattern**: Clean separation of concerns
6. **Comprehensive Error Handling**: Graceful degradation and proper logging

## 🚀 Production Deployment

1. **Environment Setup**: Configure production environment variables
2. **Database Migration**: Run `npm run db:migrate` 
3. **Build Application**: Run `npm run build`
4. **Start Server**: Use PM2 or similar process manager
5. **Health Monitoring**: Set up health check endpoints for load balancers

## 📝 License

MIT License - see LICENSE file for details.
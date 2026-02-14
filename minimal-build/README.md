# Mission Control - Minimal Build

This is a **minimal viable build** of Mission Control designed for quick Railway deployment.

## 🎯 What This Is

**Option A: Minimal Viable Build Strategy** - A simplified, single-service version that:
- ✅ Deploys successfully to Railway
- ✅ Has working login functionality 
- ✅ Serves both frontend and API from one service
- ✅ Uses simple file-based authentication
- ✅ Focuses on basic functionality over features

## 🚀 Quick Deploy to Railway

1. **Clone and navigate:**
   ```bash
   git clone https://github.com/stealthxco/collaboration-tool.git
   cd collaboration-tool/minimal-build
   ```

2. **Deploy to Railway:**
   ```bash
   railway login
   railway new mission-control-minimal
   railway up
   ```

3. **Set environment variable (optional):**
   ```bash
   railway variables set JWT_SECRET="$(openssl rand -base64 32)"
   ```

That's it! Your app should be live with working login.

## 🔐 Demo Credentials

- **Admin:** admin@missioncontrol.com / admin123
- **User:** user@missioncontrol.com / user123

## 📂 What's Different

This minimal build removes:
- Complex monorepo structure
- Database dependencies (PostgreSQL, Redis)
- WebSocket complications
- Multiple build steps
- TypeScript compilation
- Complex frontend build process

This minimal build includes:
- Single Express.js server
- Simple static file serving
- JWT authentication
- In-memory user storage
- Basic responsive UI
- Health check endpoint

## 🔧 Technology Stack

- **Backend:** Node.js + Express
- **Frontend:** Vanilla HTML/CSS/JavaScript
- **Auth:** JWT + bcrypt
- **Storage:** In-memory (easily upgradeable)
- **Deployment:** Railway-optimized

## 🎨 Features

- ✅ User authentication (login/register)
- ✅ Protected dashboard
- ✅ Responsive design
- ✅ Health check endpoint
- ✅ JWT token management
- ✅ Session persistence
- ✅ Error handling

## 🔄 Future Expansion

This minimal build is designed to be easily expandable:

1. **Add Database:** Replace in-memory storage with PostgreSQL
2. **Add Features:** Build on the solid foundation
3. **Add WebSockets:** For real-time functionality
4. **Split Services:** Separate frontend/backend when needed

## 📊 Health Check

The app includes a health check at `/health`:

```bash
curl https://your-app.railway.app/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-14T15:01:00.000Z",
  "version": "1.0.0",
  "service": "mission-control-minimal"
}
```

## 🛠 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# The app will be available at http://localhost:3000
```

## 📝 Notes

- This build prioritizes deployment success over feature completeness
- Perfect for getting something live quickly on Railway
- Easily extensible when you need more features
- All authentication is functional and secure
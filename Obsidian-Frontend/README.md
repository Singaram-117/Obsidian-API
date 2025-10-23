# Obsidian-Frontend

Modern, real-time dashboard for the Obsidian Microservice Resilience & Observability Platform (MROP).

## Features

- **Real-Time Dashboard** - Live updates via Socket.IO
- **Service Management** - Register, monitor, and manage microservices
- **Event Monitoring** - View and filter system events in real-time
- **Metrics Visualization** - Charts and graphs for performance metrics
- **Chaos Engineering** - Run controlled failure scenarios to test resilience
- **Circuit Breaker Visualization** - Monitor circuit breaker status
- **Modern UI** - Built with React, Tailwind CSS, and custom components

## Tech Stack

- **Framework**: React 18 with Vite
- **State Management**: TanStack Query (React Query)
- **Real-Time**: Socket.IO Client
- **UI Framework**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Routing**: React Router DOM

## Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running on http://localhost:5000

## Installation

```bash
# Install dependencies
npm install
```

## Running the Application

```bash
# Development mode (runs on http://localhost:8080)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:5000
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.jsx       # Main layout with navigation
│   ├── Card.jsx         # Card components
│   ├── Badge.jsx        # Badge component
│   ├── Button.jsx       # Button component
│   ├── StatusIndicator.jsx
│   ├── StatCard.jsx
│   └── EventFeed.jsx    # Real-time event feed
├── contexts/            # React contexts
│   └── SocketContext.jsx # Socket.IO context
├── lib/                 # Utilities and API clients
│   ├── api.js           # API client
│   └── utils.js         # Helper functions
├── pages/               # Application pages
│   ├── Dashboard.jsx    # Main dashboard
│   ├── Services.jsx     # Service management
│   ├── Events.jsx       # Event monitoring
│   ├── Metrics.jsx      # Metrics visualization
│   └── ChaosEngineering.jsx # Chaos testing
├── App.jsx              # Main app component
├── main.jsx             # Entry point
└── index.css            # Global styles
```

## Pages

### Dashboard
- Overview of all services
- Real-time event feed
- System health metrics
- Quick stats

### Services
- Register new services
- View service details
- Monitor circuit breaker status
- Test service calls
- View metrics and statistics
- Manually control circuit breakers

### Events
- View all system events
- Filter by severity, type, and service
- Real-time event updates
- Event statistics

### Metrics
- Service performance metrics
- Response time charts
- Request statistics
- Success rate tracking

### Chaos Engineering
- Run controlled failure scenarios
- Test circuit breaker behavior
- Monitor resilience patterns
- View test results history

## Features in Detail

### Real-Time Updates
The dashboard uses Socket.IO to receive real-time updates from the backend:
- New events are displayed immediately
- Circuit breaker status changes are reflected instantly
- Service status updates in real-time

### Service Registration
Register services with the following configuration:
- Service name
- Service URL
- Health check endpoint
- Health check interval
- Health check timeout

### Chaos Testing
Available chaos tests:
1. **Cascade Failure** - 100% failure rate to test circuit breaker
2. **Intermittent Failures** - Random failures to test resilience
3. **Latency Injection** - Add delays to test timeout handling
4. **Network Partition** - Simulate network issues

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Lint the code
npm run lint
```

## Building for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

The build output will be in the `dist/` directory.

## Usage

1. **Start the backend API** (port 5000)
2. **Start the mock microservice** (port 3001)
3. **Start the frontend** (port 8080)
4. **Register the mock service** in the Services page
5. **Monitor in real-time** on the Dashboard
6. **Run chaos tests** to validate resilience

## Integration with Backend

The frontend communicates with the backend API via:
- **HTTP/REST API** - For data fetching and mutations
- **Socket.IO** - For real-time updates

All API calls go through the centralized API client in `src/lib/api.js`.

## Customization

### Theming
The application uses Tailwind CSS with a custom color scheme. Edit `tailwind.config.js` to customize colors.

### Adding New Pages
1. Create a new component in `src/pages/`
2. Add route in `src/App.jsx`
3. Add navigation item in `src/components/Layout.jsx`

## License

MIT


# Backend Integration Guide

This document describes the integration between the React frontend and FastAPI backend for the Cricket Auction system.

## Setup Instructions

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
```

Update `.env` with MongoDB connection:
```
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=calcutta_cricket_league
```

Start the backend:
```bash
python main.py
```

Backend will be available at: `http://localhost:8000`
API Docs: `http://localhost:8000/docs`

### 2. Frontend Setup

The frontend is pre-configured to communicate with the backend API.

**Environment Variable** (`src/.env.local`):
```
VITE_API_URL=http://localhost:8000/api
```

The frontend already has the API client configured in `src/lib/api.ts`.

## API Integration Points

### 1. **RegisterPlayer Page** (`src/pages/RegisterPlayer.tsx`)
- Uses: `registrationAPI.createRegistration()`
- Submits player registration to backend
- Data flows to MongoDB `registrations` collection
- Status: ✅ Integrated

### 2. **Players Page** (`src/pages/Players.tsx`)
- Uses: `playerAPI.getAllPlayers()`
- Fetches registered players from backend
- Displays all players with pagination
- Status: ✅ Integrated

### 3. **Teams Page** (`src/pages/Teams.tsx`)
- Uses: `teamAPI.getAllTeams()`, `teamAPI.createTeam()`
- Fetches all teams
- Creates new teams via dialog form
- Status: ✅ Integrated

### 4. **AuctionControl Page** (`src/pages/AuctionControl.tsx`)
- Status: ⏳ Needs Integration
- Will use: `auctionAPI.*`, `bidAPI.*`
- Actions to implement:
  - Load auction players
  - Place bids
  - Update auction status
  - Finalize sales

### 5. **AuctionSummary Page** (`src/pages/AuctionSummary.tsx`)
- Status: ⏳ Needs Integration
- Will use: `auctionAPI.getAuctionSummary()`
- Actions to implement:
  - Show auction statistics
  - Display team-wise progress
  - Show player listings by status

### 6. **AuctionDisplay Page** (`src/pages/AuctionDisplay.tsx`)
- Status: ⏳ Needs Integration
- Will use: `auctionAPI.getAuctionPlayersByStatus()`, `bidAPI.getBidsForPlayer()`
- Actions to implement:
  - Show current live player
  - Display highest bid
  - Show bidding team info
  - Auto-refresh every 2 seconds

## API Service Structure

### API Client (`src/lib/api.ts`)

#### playerAPI
```typescript
playerAPI.createPlayer(data)
playerAPI.getPlayer(id)
playerAPI.getAllPlayers(skip, limit, search?)
playerAPI.updatePlayer(id, data)
playerAPI.deletePlayer(id)
playerAPI.getPlayersByRole(role, skip, limit)
```

#### teamAPI
```typescript
teamAPI.createTeam(data)
teamAPI.getTeam(id)
teamAPI.getAllTeams(skip, limit, search?)
teamAPI.updateTeam(id, data)
teamAPI.deleteTeam(id)
teamAPI.getTeamStats(id)
```

#### bidAPI
```typescript
bidAPI.createBid(data)
bidAPI.getBid(id)
bidAPI.getBidsForPlayer(playerId, skip, limit)
bidAPI.getBidsForTeam(teamId, skip, limit)
bidAPI.getHighestBid(playerId)
bidAPI.deleteBid(id)
```

#### auctionAPI
```typescript
auctionAPI.createAuctionPlayer(data)
auctionAPI.getAuctionPlayer(id)
auctionAPI.getAllAuctionPlayers(skip, limit)
auctionAPI.getAuctionPlayersByStatus(status, skip, limit)
auctionAPI.updateAuctionStatus(id, newStatus)
auctionAPI.finalizePlayerSale(playerId, teamId, salePrice)
auctionAPI.markPlayerUnsold(playerId)
auctionAPI.getAuctionSummary()
```

#### registrationAPI
```typescript
registrationAPI.createRegistration(data)
registrationAPI.getRegistration(id)
registrationAPI.getAllRegistrations(skip, limit, status?)
registrationAPI.updateRegistration(id, data)
registrationAPI.deleteRegistration(id)
registrationAPI.approveRegistration(id)
registrationAPI.rejectRegistration(id, rejectionReason)
```

### Custom Hook (`src/hooks/useApi.ts`)

#### useApi Hook
```typescript
const { data, loading, error, execute } = useApi(apiFunction, options);
```

Usage example:
```typescript
const { data, loading, error, execute } = useApi(playerAPI.getPlayer);
await execute(playerId);
```

#### useApiList Hook
```typescript
const { data, total, loading, error, fetchData } = useApiList(apiFunction);
await fetchData(skip, limit);
```

## Data Flow Examples

### Example 1: Register Player

```typescript
// Component
const { execute, loading } = useApi(registrationAPI.createRegistration);

// User submits form
const handleSubmit = async (formData) => {
  try {
    await execute({
      player_name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      place: formData.place,
      payment_screenshot_url: base64Image,
    });
    toast.success("Registration submitted!");
  } catch (error) {
    toast.error("Failed to submit");
  }
};
```

### Example 2: Fetch Players

```typescript
// Component
const [players, setPlayers] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchPlayers = async () => {
    try {
      const data = await playerAPI.getAllPlayers(0, 10);
      setPlayers(data.players);
    } catch (error) {
      toast.error("Failed to load players");
    } finally {
      setLoading(false);
    }
  };

  fetchPlayers();
}, []);
```

### Example 3: Create Team

```typescript
const handleCreateTeam = async (teamData) => {
  try {
    const newTeam = await teamAPI.createTeam({
      name: teamData.name,
      owner_name: teamData.owner_name,
      owner_contact: teamData.owner_contact,
      icon_url: teamData.icon_url,
    });

    setTeams(prev => [newTeam, ...prev]);
    toast.success("Team created!");
  } catch (error) {
    toast.error("Failed to create team");
  }
};
```

## Error Handling

All API calls include automatic error handling:

```typescript
try {
  const data = await playerAPI.getAllPlayers();
  // Success handling
} catch (error) {
  // Error details
  console.error(error.response?.data?.detail);
  console.error(error.message);
}
```

Response errors follow this format:
```json
{
  "status": 400,
  "message": "Error description",
  "error": true,
  "timestamp": "2024-01-01T12:00:00"
}
```

## CORS Configuration

Frontend origins are whitelisted in the backend:
- `http://localhost:3000`
- `http://localhost:5173`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:5173`

To add more origins, update `backend/config.py`:
```python
ALLOWED_ORIGINS: list[str] = [
    "http://yourdomain.com",
    # ...
]
```

## Docker Setup (Recommended)

Run both frontend and backend together:

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend with Docker Compose
cd backend
docker-compose up
```

This will:
- Start MongoDB on port 27017
- Start FastAPI on port 8000
- Create network bridge between services

## Testing API Endpoints

### Using Browser DevTools
Open `http://localhost:8000/docs` for interactive API documentation

### Using cURL
```bash
# Get all teams
curl http://localhost:8000/api/teams/

# Create team
curl -X POST http://localhost:8000/api/teams/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Team",
    "owner_name": "John",
    "owner_contact": "+91..."
  }'

# Get player
curl http://localhost:8000/api/players/PLAYER_ID
```

## Remaining Integration Tasks

### AuctionControl Page
- [ ] Load auction players on mount
- [ ] Implement player drawing from API
- [ ] Implement bid placement with validation
- [ ] Implement player sale finalization
- [ ] Implement mark as unsold functionality
- [ ] Update auction status in real-time

### AuctionSummary Page
- [ ] Fetch auction summary statistics
- [ ] Fetch team-wise progress
- [ ] Display dynamic player listings
- [ ] Show auction value breakdown
- [ ] Implement filtering by status

### AuctionDisplay Page
- [ ] Fetch current live player
- [ ] Fetch highest bid for player
- [ ] Implement auto-refresh (2-second interval)
- [ ] Show bidding team information
- [ ] Display recent bid history

## Troubleshooting

### Connection Refused
- Ensure backend is running on `localhost:8000`
- Check `VITE_API_URL` in `.env.local`
- Verify MongoDB is running

### CORS Errors
- Check browser console for error details
- Verify frontend URL is in `ALLOWED_ORIGINS`
- Restart backend after config changes

### Authentication Errors
- Check if auth tokens are stored in localStorage
- Clear localStorage and retry
- Verify JWT settings in backend config

## Performance Tips

1. **Pagination**: Always use pagination for large lists
```typescript
const data = await playerAPI.getAllPlayers(0, 20); // Skip 0, limit 20
```

2. **Caching**: Cache data when possible
```typescript
const [cache, setCache] = useState({});
if (!cache[playerId]) {
  const data = await playerAPI.getPlayer(playerId);
  setCache(prev => ({ ...prev, [playerId]: data }));
}
```

3. **Debouncing**: Debounce search queries
```typescript
const debouncedSearch = useCallback(
  debounce((query) => {
    playerAPI.getAllPlayers(0, 10, query);
  }, 300),
  []
);
```

4. **Request Cancellation**: Cancel requests on component unmount
```typescript
useEffect(() => {
  const controller = new AbortController();
  // Use controller.signal in requests
  return () => controller.abort();
}, []);
```

## Additional Resources

- Backend README: `backend/README.md`
- API Documentation: `http://localhost:8000/docs`
- Environment Configuration: `.env.local`
- API Client: `src/lib/api.ts`
- Custom Hooks: `src/hooks/useApi.ts`

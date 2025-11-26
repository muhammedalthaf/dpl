# Calcutta Cricket League API

FastAPI backend for the cricket auction system with MongoDB integration.

## Project Structure

```
backend/
├── main.py                      # Application entry point
├── config.py                    # Configuration settings
├── database.py                  # MongoDB connection
├── schemas.py                   # Pydantic models
├── utils.py                     # Utility functions
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment variables template
├── controllers/                 # Business logic
│   ├── __init__.py
│   ├── player_controller.py
│   ├── team_controller.py
│   ├── bid_controller.py
│   ├── auction_controller.py
│   └── registration_controller.py
└── routes/                      # API endpoints
    ├── __init__.py
    ├── players.py
    ├── teams.py
    ├── bids.py
    ├── auction.py
    └── registrations.py
```

## Setup Instructions

### Prerequisites
- Python 3.9+
- MongoDB 4.0+

### Installation

1. **Clone the project and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create .env file from template**
   ```bash
   cp .env.example .env
   ```

5. **Update .env with your MongoDB connection string**
   ```
   MONGODB_URL=mongodb://localhost:27017
   DATABASE_NAME=calcutta_cricket_league
   ```

### Running the Application

```bash
python main.py
```

The API will be available at `http://localhost:8000`

**Interactive API Documentation:** `http://localhost:8000/docs`

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Players
- `POST /api/players/` - Create player
- `GET /api/players/` - Get all players (with pagination)
- `GET /api/players/{player_id}` - Get player by ID
- `PUT /api/players/{player_id}` - Update player
- `DELETE /api/players/{player_id}` - Delete player
- `GET /api/players/role/{role}` - Get players by role

### Teams
- `POST /api/teams/` - Create team
- `GET /api/teams/` - Get all teams (with pagination)
- `GET /api/teams/{team_id}` - Get team by ID
- `PUT /api/teams/{team_id}` - Update team
- `DELETE /api/teams/{team_id}` - Delete team
- `GET /api/teams/{team_id}/stats` - Get team statistics

### Bids
- `POST /api/bids/` - Create bid
- `GET /api/bids/{bid_id}` - Get bid by ID
- `GET /api/bids/player/{player_id}` - Get all bids for player
- `GET /api/bids/team/{team_id}` - Get bids placed by team
- `GET /api/bids/player/{player_id}/highest` - Get highest bid
- `DELETE /api/bids/{bid_id}` - Delete bid

### Auction
- `POST /api/auction/players` - Add player to auction
- `GET /api/auction/players` - Get all auction players
- `GET /api/auction/players/{player_id}` - Get auction player
- `GET /api/auction/players/status/{status}` - Get players by status
- `PUT /api/auction/players/{player_id}/status/{new_status}` - Update status
- `POST /api/auction/players/{player_id}/finalize` - Finalize sale
- `PUT /api/auction/players/{player_id}/unsold` - Mark as unsold
- `GET /api/auction/summary` - Get auction statistics

### Registrations
- `POST /api/registrations/` - Submit registration
- `GET /api/registrations/` - Get all registrations
- `GET /api/registrations/{registration_id}` - Get registration by ID
- `PUT /api/registrations/{registration_id}` - Update registration
- `DELETE /api/registrations/{registration_id}` - Delete registration
- `POST /api/registrations/{registration_id}/approve` - Approve registration
- `POST /api/registrations/{registration_id}/reject` - Reject registration

## Request Examples

### Create a Player
```json
POST /api/players/
{
  "name": "Akhil Nair",
  "email": "akhil.nair@example.com",
  "phone": "+91 98765 43210",
  "role": "bat",
  "place": "Kozhikode",
  "image_url": null
}
```

### Create a Team
```json
POST /api/teams/
{
  "name": "Calicut Strikers",
  "owner_name": "Ravi Menon",
  "owner_contact": "+91 94000 12345",
  "owner_details": "Local entrepreneur",
  "icon_url": null
}
```

### Create an Auction Player
```json
POST /api/auction/players
{
  "name": "Akhil Nair",
  "email": "akhil.nair@example.com",
  "phone": "+91 98765 43210",
  "role": "bat",
  "place": "Kozhikode",
  "base_price": 50000,
  "auction_status": "pending"
}
```

### Place a Bid
```json
POST /api/bids/
{
  "player_id": "507f1f77bcf86cd799439011",
  "team_id": "507f1f77bcf86cd799439012",
  "amount": 75000
}
```

### Submit Registration
```json
POST /api/registrations/
{
  "player_name": "John Doe",
  "email": "john@example.com",
  "phone": "+91 98765 43210",
  "role": "ball",
  "place": "Kozhikode",
  "payment_screenshot_url": "https://example.com/payment.jpg"
}
```

## Database Models

### Players Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,
  role: String,
  place: String,
  image_url: String,
  created_at: DateTime,
  updated_at: DateTime
}
```

### Auction Players Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,
  role: String,
  place: String,
  base_price: Integer,
  auction_status: String,
  sold_price: Integer,
  sold_to_team_id: String,
  created_at: DateTime,
  updated_at: DateTime
}
```

### Teams Collection
```javascript
{
  _id: ObjectId,
  name: String,
  owner_name: String,
  owner_contact: String,
  owner_details: String,
  icon_url: String,
  created_at: DateTime,
  updated_at: DateTime
}
```

### Bids Collection
```javascript
{
  _id: ObjectId,
  player_id: String,
  team_id: String,
  team_name: String,
  amount: Integer,
  timestamp: DateTime,
  created_at: DateTime
}
```

### Registrations Collection
```javascript
{
  _id: ObjectId,
  player_name: String,
  email: String,
  phone: String,
  role: String,
  place: String,
  payment_screenshot_url: String,
  status: String,
  rejection_reason: String,
  created_at: DateTime,
  updated_at: DateTime
}
```

## Environment Variables

```bash
MONGODB_URL          # MongoDB connection string
DATABASE_NAME        # Database name
API_TITLE           # API title
API_VERSION         # API version
API_DESCRIPTION     # API description
JWT_SECRET_KEY      # JWT secret key
JWT_ALGORITHM       # JWT algorithm (default: HS256)
JWT_EXPIRATION_HOURS # JWT expiration hours
ALLOWED_ORIGINS     # CORS allowed origins
```

## Error Handling

All endpoints return standardized responses:

**Success Response (200):**
```json
{
  "status": 200,
  "message": "Success message",
  "data": { /* response data */ },
  "timestamp": "2024-01-01T12:00:00.000000"
}
```

**Error Response (400/404/500):**
```json
{
  "status": 400,
  "message": "Error message",
  "error": true,
  "timestamp": "2024-01-01T12:00:00.000000"
}
```

## Development

### Adding New Endpoints

1. Create schema in `schemas.py`
2. Create controller method in `controllers/`
3. Create route in `routes/`
4. Include router in `main.py`

### Testing

Use the interactive API docs at `/docs` to test endpoints.

## Deployment

For production deployment:

1. Update environment variables
2. Set `DEBUG=False`
3. Use production MongoDB instance
4. Update JWT secret key
5. Configure proper CORS origins
6. Use a production ASGI server (gunicorn + uvicorn)

```bash
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker
```

## License

MIT License

## Support

For issues and questions, please contact the development team.

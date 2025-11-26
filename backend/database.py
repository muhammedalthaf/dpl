import motor.motor_asyncio
from config import settings
from pymongo import ASCENDING, DESCENDING
from typing import Optional, Any

# Create motor client
client: Optional[Any] = None


async def connect_to_mongo():
    """Connect to MongoDB"""
    global client
    client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGODB_URL)
    print(f"Connected to MongoDB: {settings.MONGODB_URL}")

    # Create indexes
    await create_indexes()


async def close_mongo_connection():
    """Close MongoDB connection"""
    global client
    if client is not None:
        client.close()
        print("MongoDB connection closed")


def get_database():
    """Get database instance"""
    return client[settings.DATABASE_NAME]


async def create_indexes():
    """Create necessary indexes for collections"""
    db = get_database()

    # Players collection indexes
    players = db["players"]
    # Drop old email index if exists, then create phone unique index
    try:
        await players.drop_index("email_1")
    except Exception:
        pass
    try:
        await players.drop_index("phone_1")
    except Exception:
        pass
    await players.create_index("phone", unique=True)

    # Teams collection indexes
    teams = db["teams"]
    await teams.create_index("name", unique=True)

    # Bids collection indexes
    bids = db["bids"]
    await bids.create_index([("playerId", ASCENDING), ("timestamp", DESCENDING)])
    await bids.create_index("teamId")

    # Auction status indexes
    auction_status = db["auction_status"]
    await auction_status.create_index("playerId", unique=True)

    # Registrations indexes - drop old conflicting indexes first
    registrations = db["registrations"]
    try:
        await registrations.drop_index("email_1")
    except Exception:
        pass  # Index might not exist
    try:
        await registrations.drop_index("phone_1")
    except Exception:
        pass  # Index might not exist

    await registrations.create_index("phone", unique=True)
    await registrations.create_index("status")

    print("Database indexes created successfully")

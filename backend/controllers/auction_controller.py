from fastapi import HTTPException, status
from database import get_database
from schemas import AuctionPlayerCreate, AuctionPlayerUpdate, AuctionStatus
from utils import object_id_to_string, validate_object_id
from datetime import datetime
from bson import ObjectId
from typing import Optional


class AuctionController:
    """Controller for auction operations"""

    @staticmethod
    async def create_auction_player(player_data: AuctionPlayerCreate) -> dict:
        """Create a new player for auction"""
        db = get_database()
        auction_players = db["auction_players"]

        # Check if email already exists
        if player_data.email:
            existing = await auction_players.find_one({"email": player_data.email})
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered",
                )

        player_doc = {
            **player_data.model_dump(),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }

        result = await auction_players.insert_one(player_doc)
        created_player = await auction_players.find_one({"_id": result.inserted_id})

        return object_id_to_string(created_player)

    @staticmethod
    async def get_auction_player(player_id: str) -> dict:
        """Get auction player by ID"""
        if not validate_object_id(player_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid player ID",
            )

        db = get_database()
        auction_players = db["auction_players"]

        player = await auction_players.find_one({"_id": ObjectId(player_id)})
        if not player:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Player not found",
            )

        return object_id_to_string(player)

    @staticmethod
    async def get_auction_players_by_status(
        status: AuctionStatus, skip: int = 0, limit: int = 10
    ) -> dict:
        """Get players filtered by auction status"""
        db = get_database()
        auction_players = db["auction_players"]

        total = await auction_players.count_documents({"auction_status": status.value})
        players = await auction_players.find(
            {"auction_status": status.value}
        ).skip(skip).limit(limit).to_list(length=None)

        return {
            "status": status.value,
            "players": [object_id_to_string(p) for p in players],
            "total": total,
            "skip": skip,
            "limit": limit,
        }

    @staticmethod
    async def update_auction_status(player_id: str, new_status: AuctionStatus) -> dict:
        """Update auction status of a player"""
        if not validate_object_id(player_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid player ID",
            )

        db = get_database()
        auction_players = db["auction_players"]

        result = await auction_players.update_one(
            {"_id": ObjectId(player_id)},
            {
                "$set": {
                    "auction_status": new_status.value,
                    "updated_at": datetime.utcnow(),
                }
            },
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Player not found",
            )

        updated_player = await auction_players.find_one({"_id": ObjectId(player_id)})
        return object_id_to_string(updated_player)

    @staticmethod
    async def finalize_player_sale(
        player_id: str,
        team_id: str,
        sale_price: int
    ) -> dict:
        """Finalize a player sale"""
        if not validate_object_id(player_id) or not validate_object_id(team_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid player or team ID",
            )

        db = get_database()
        auction_players = db["auction_players"]

        update_data = {
            "auction_status": "sold",
            "sold_to_team_id": team_id,
            "sold_price": sale_price,
            "updated_at": datetime.utcnow(),
        }

        result = await auction_players.update_one(
            {"_id": ObjectId(player_id)},
            {"$set": update_data}
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Player not found",
            )

        updated_player = await auction_players.find_one({"_id": ObjectId(player_id)})
        return object_id_to_string(updated_player)

    @staticmethod
    async def mark_player_unsold(player_id: str) -> dict:
        """Mark a player as unsold"""
        if not validate_object_id(player_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid player ID",
            )

        db = get_database()
        auction_players = db["auction_players"]

        update_data = {
            "auction_status": "unsold",
            "sold_price": None,
            "sold_to_team_id": None,
            "updated_at": datetime.utcnow(),
        }

        result = await auction_players.update_one(
            {"_id": ObjectId(player_id)},
            {"$set": update_data}
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Player not found",
            )

        updated_player = await auction_players.find_one({"_id": ObjectId(player_id)})
        return object_id_to_string(updated_player)

    @staticmethod
    async def get_auction_summary() -> dict:
        """Get auction summary statistics"""
        db = get_database()
        auction_players = db["auction_players"]

        total_players = await auction_players.count_documents({})
        pending = await auction_players.count_documents({"auction_status": "pending"})
        live = await auction_players.count_documents({"auction_status": "live"})
        sold = await auction_players.count_documents({"auction_status": "sold"})
        unsold = await auction_players.count_documents({"auction_status": "unsold"})

        # Calculate total value
        sold_players = await auction_players.find(
            {"auction_status": "sold"}
        ).to_list(length=None)
        total_value = sum(p.get("sold_price", 0) for p in sold_players)

        return {
            "total_players": total_players,
            "pending": pending,
            "live": live,
            "sold": sold,
            "unsold": unsold,
            "total_auction_value": total_value,
            "average_player_value": total_value // sold if sold > 0 else 0,
        }

    @staticmethod
    async def get_all_auction_players(skip: int = 0, limit: int = 10) -> dict:
        """Get all players in auction"""
        db = get_database()
        auction_players = db["auction_players"]

        total = await auction_players.count_documents({})
        players = await auction_players.find({}).skip(skip).limit(limit).to_list(length=None)

        return {
            "players": [object_id_to_string(p) for p in players],
            "total": total,
            "skip": skip,
            "limit": limit,
        }

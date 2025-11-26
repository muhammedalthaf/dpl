from fastapi import HTTPException, status
from database import get_database
from schemas import PlayerCreate, PlayerUpdate, Player
from utils import object_id_to_string, convert_to_object_id, validate_object_id
from datetime import datetime
from bson import ObjectId
from typing import List, Optional


class PlayerController:
    """Controller for player operations"""

    @staticmethod
    async def create_player(player_data: PlayerCreate) -> dict:
        """Create a new player"""
        db = get_database()
        players_collection = db["players"]

        # Check if email already exists
        if player_data.email:
            existing = await players_collection.find_one({"email": player_data.email})
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered",
                )

        # Check if phone already exists
        existing_phone = await players_collection.find_one({"phone": player_data.phone})
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already registered",
            )

        player_doc = {
            **player_data.model_dump(),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }

        result = await players_collection.insert_one(player_doc)
        created_player = await players_collection.find_one({"_id": result.inserted_id})

        return object_id_to_string(created_player)

    @staticmethod
    async def get_player(player_id: str) -> dict:
        """Get player by ID"""
        if not validate_object_id(player_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid player ID",
            )

        db = get_database()
        players_collection = db["players"]

        player = await players_collection.find_one({"_id": ObjectId(player_id)})
        if not player:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Player not found",
            )

        return object_id_to_string(player)

    @staticmethod
    async def get_all_players(
        skip: int = 0, limit: int = 10, search: Optional[str] = None
    ) -> dict:
        """Get all players with pagination"""
        db = get_database()
        players_collection = db["players"]

        query = {}
        if search:
            query = {
                "$or": [
                    {"name": {"$regex": search, "$options": "i"}},
                    {"place": {"$regex": search, "$options": "i"}},
                ]
            }

        total = await players_collection.count_documents(query)
        players = await players_collection.find(query).skip(skip).limit(limit).to_list(
            length=None
        )

        return {
            "players": [object_id_to_string(p) for p in players],
            "total": total,
            "skip": skip,
            "limit": limit,
        }

    @staticmethod
    async def update_player(player_id: str, player_data: PlayerUpdate) -> dict:
        """Update player"""
        if not validate_object_id(player_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid player ID",
            )

        db = get_database()
        players_collection = db["players"]

        # Check email uniqueness if being updated
        if player_data.email:
            existing = await players_collection.find_one(
                {"email": player_data.email, "_id": {"$ne": ObjectId(player_id)}}
            )
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already in use",
                )

        update_data = {k: v for k, v in player_data.model_dump().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()

        result = await players_collection.update_one(
            {"_id": ObjectId(player_id)}, {"$set": update_data}
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Player not found",
            )

        updated_player = await players_collection.find_one({"_id": ObjectId(player_id)})
        return object_id_to_string(updated_player)

    @staticmethod
    async def delete_player(player_id: str) -> dict:
        """Delete player"""
        if not validate_object_id(player_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid player ID",
            )

        db = get_database()
        players_collection = db["players"]

        result = await players_collection.delete_one({"_id": ObjectId(player_id)})

        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Player not found",
            )

        return {"message": "Player deleted successfully"}

    @staticmethod
    async def get_players_by_role(role: str, skip: int = 0, limit: int = 10) -> dict:
        """Get players filtered by role"""
        db = get_database()
        players_collection = db["players"]

        total = await players_collection.count_documents({"role": role})
        players = await players_collection.find({"role": role}).skip(skip).limit(limit).to_list(
            length=None
        )

        return {
            "players": [object_id_to_string(p) for p in players],
            "total": total,
            "role": role,
        }

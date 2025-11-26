from fastapi import HTTPException, status
from database import get_database
from schemas import TeamCreate, TeamUpdate
from utils import object_id_to_string, validate_object_id
from datetime import datetime
from bson import ObjectId
from typing import Optional


class TeamController:
    """Controller for team operations"""

    @staticmethod
    async def create_team(team_data: TeamCreate) -> dict:
        """Create a new team"""
        db = get_database()
        teams_collection = db["teams"]

        # Check if team name already exists
        existing = await teams_collection.find_one({"name": team_data.name})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Team name already exists",
            )

        team_doc = {
            **team_data.model_dump(),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }

        result = await teams_collection.insert_one(team_doc)
        created_team = await teams_collection.find_one({"_id": result.inserted_id})

        return object_id_to_string(created_team)

    @staticmethod
    async def get_team(team_id: str) -> dict:
        """Get team by ID"""
        if not validate_object_id(team_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid team ID",
            )

        db = get_database()
        teams_collection = db["teams"]

        team = await teams_collection.find_one({"_id": ObjectId(team_id)})
        if not team:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team not found",
            )

        return object_id_to_string(team)

    @staticmethod
    async def get_all_teams(skip: int = 0, limit: int = 10, search: Optional[str] = None) -> dict:
        """Get all teams with pagination"""
        db = get_database()
        teams_collection = db["teams"]

        query = {}
        if search:
            query = {
                "$or": [
                    {"name": {"$regex": search, "$options": "i"}},
                    {"owner_name": {"$regex": search, "$options": "i"}},
                ]
            }

        total = await teams_collection.count_documents(query)
        teams = await teams_collection.find(query).skip(skip).limit(limit).to_list(
            length=None
        )

        return {
            "teams": [object_id_to_string(t) for t in teams],
            "total": total,
            "skip": skip,
            "limit": limit,
        }

    @staticmethod
    async def update_team(team_id: str, team_data: TeamUpdate) -> dict:
        """Update team"""
        if not validate_object_id(team_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid team ID",
            )

        db = get_database()
        teams_collection = db["teams"]

        # Check name uniqueness if being updated
        if team_data.name:
            existing = await teams_collection.find_one(
                {"name": team_data.name, "_id": {"$ne": ObjectId(team_id)}}
            )
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Team name already in use",
                )

        update_data = {k: v for k, v in team_data.model_dump().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()

        result = await teams_collection.update_one(
            {"_id": ObjectId(team_id)}, {"$set": update_data}
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team not found",
            )

        updated_team = await teams_collection.find_one({"_id": ObjectId(team_id)})
        return object_id_to_string(updated_team)

    @staticmethod
    async def delete_team(team_id: str) -> dict:
        """Delete team"""
        if not validate_object_id(team_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid team ID",
            )

        db = get_database()
        teams_collection = db["teams"]

        result = await teams_collection.delete_one({"_id": ObjectId(team_id)})

        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team not found",
            )

        return {"message": "Team deleted successfully"}

    @staticmethod
    async def get_team_stats(team_id: str) -> dict:
        """Get team statistics"""
        if not validate_object_id(team_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid team ID",
            )

        db = get_database()
        auction_players = db["auction_players"]

        # Get players bought by this team
        team_players = await auction_players.find(
            {"sold_to_team_id": team_id, "auction_status": "sold"}
        ).to_list(length=None)

        total_spent = sum(p.get("sold_price", 0) for p in team_players)

        return {
            "team_id": team_id,
            "players_bought": len(team_players),
            "total_spent": total_spent,
            "players": [object_id_to_string(p) for p in team_players],
        }

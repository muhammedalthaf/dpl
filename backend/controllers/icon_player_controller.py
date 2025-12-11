from fastapi import HTTPException, status
from database import get_database
from schemas import (
    IconPlayerAssign,
    AuctionOrderUpdate,
    DEFAULT_PURSE_BALANCE,
    ICON_PLAYER_COST,
    MAX_ICON_PLAYERS,
)
from utils import object_id_to_string, validate_object_id
from datetime import datetime
from bson import ObjectId
from typing import Optional


class IconPlayerController:
    """Controller for icon player operations - uses players collection directly"""

    @staticmethod
    async def assign_icon_player(data: IconPlayerAssign) -> dict:
        """
        Assign a player as an icon player to a team.
        - Icon players cost 1500 points
        - Maximum 2 icon players per team
        - Deducts from team's purse balance
        """
        if not validate_object_id(data.player_id) or not validate_object_id(data.team_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid player or team ID",
            )

        db = get_database()
        players = db["players"]
        teams = db["teams"]

        # Check if player exists
        player = await players.find_one({"_id": ObjectId(data.player_id)})
        if not player:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Player not found",
            )

        # Check if player is already an icon player
        if player.get("is_icon_player"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Player is already an icon player",
            )

        # Check if team exists
        team = await teams.find_one({"_id": ObjectId(data.team_id)})
        if not team:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team not found",
            )

        # Check if team already has max icon players
        icon_player_ids = team.get("icon_player_ids", [])
        if len(icon_player_ids) >= MAX_ICON_PLAYERS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Team already has {MAX_ICON_PLAYERS} icon players (maximum)",
            )

        # Update player as icon player
        await players.update_one(
            {"_id": ObjectId(data.player_id)},
            {
                "$set": {
                    "is_icon_player": True,
                    "icon_player_team_id": data.team_id,
                    "updated_at": datetime.utcnow(),
                }
            },
        )

        # Update team's icon_player_ids and recalculate purse balance
        icon_player_ids.append(data.player_id)
        new_purse_balance = DEFAULT_PURSE_BALANCE - (len(icon_player_ids) * ICON_PLAYER_COST)

        await teams.update_one(
            {"_id": ObjectId(data.team_id)},
            {
                "$set": {
                    "icon_player_ids": icon_player_ids,
                    "purse_balance": new_purse_balance,
                    "updated_at": datetime.utcnow(),
                }
            },
        )

        updated_player = await players.find_one({"_id": ObjectId(data.player_id)})
        updated_team = await teams.find_one({"_id": ObjectId(data.team_id)})

        return {
            "player": object_id_to_string(updated_player),
            "team": object_id_to_string(updated_team),
            "message": f"Player assigned as icon player. Team purse balance: {new_purse_balance}",
        }

    @staticmethod
    async def unassign_icon_player(player_id: str) -> dict:
        """Remove icon player status from a player"""
        if not validate_object_id(player_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid player ID",
            )

        db = get_database()
        players = db["players"]
        teams = db["teams"]

        # Check if player exists and is an icon player
        player = await players.find_one({"_id": ObjectId(player_id)})
        if not player:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Player not found",
            )

        if not player.get("is_icon_player"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Player is not an icon player",
            )

        team_id = player.get("icon_player_team_id")

        # Update player
        await players.update_one(
            {"_id": ObjectId(player_id)},
            {
                "$set": {
                    "is_icon_player": False,
                    "icon_player_team_id": None,
                    "updated_at": datetime.utcnow(),
                }
            },
        )

        # Update team if exists
        if team_id and validate_object_id(team_id):
            team = await teams.find_one({"_id": ObjectId(team_id)})
            if team:
                icon_player_ids = team.get("icon_player_ids", [])
                if player_id in icon_player_ids:
                    icon_player_ids.remove(player_id)
                new_purse_balance = DEFAULT_PURSE_BALANCE - (len(icon_player_ids) * ICON_PLAYER_COST)

                await teams.update_one(
                    {"_id": ObjectId(team_id)},
                    {
                        "$set": {
                            "icon_player_ids": icon_player_ids,
                            "purse_balance": new_purse_balance,
                            "updated_at": datetime.utcnow(),
                        }
                    },
                )

        updated_player = await players.find_one({"_id": ObjectId(player_id)})
        return {
            "player": object_id_to_string(updated_player),
            "message": "Icon player status removed",
        }

    @staticmethod
    async def get_icon_players_by_team(team_id: str) -> dict:
        """Get all icon players for a team"""
        if not validate_object_id(team_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid team ID",
            )

        db = get_database()
        players = db["players"]
        teams = db["teams"]

        team = await teams.find_one({"_id": ObjectId(team_id)})
        if not team:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team not found",
            )

        icon_players = await players.find(
            {"icon_player_team_id": team_id, "is_icon_player": True}
        ).to_list(length=None)

        return {
            "team_id": team_id,
            "team_name": team.get("name"),
            "purse_balance": team.get("purse_balance", DEFAULT_PURSE_BALANCE),
            "icon_players": [object_id_to_string(p) for p in icon_players],
            "icon_player_count": len(icon_players),
            "max_icon_players": MAX_ICON_PLAYERS,
        }

    @staticmethod
    async def get_all_icon_players() -> dict:
        """Get all icon players across all teams"""
        db = get_database()
        players = db["players"]

        icon_players = await players.find(
            {"is_icon_player": True}
        ).to_list(length=None)

        return {
            "icon_players": [object_id_to_string(p) for p in icon_players],
            "total": len(icon_players),
        }


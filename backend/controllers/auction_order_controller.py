import random
from fastapi import HTTPException, status
from database import get_database
from schemas import AuctionOrderUpdate
from utils import object_id_to_string, validate_object_id
from datetime import datetime
from bson import ObjectId
from typing import Optional


class AuctionOrderController:
    """Controller for auction order management - uses players collection directly"""

    @staticmethod
    async def initialize_auction_for_all_players(base_price: int = 100) -> dict:
        """Initialize auction fields for all players who don't have them set"""
        db = get_database()
        players = db["players"]

        # Get all players without auction_status (not yet in auction)
        players_not_in_auction = await players.find(
            {"$or": [{"auction_status": None}, {"auction_status": {"$exists": False}}]}
        ).to_list(length=None)

        if not players_not_in_auction:
            return {"message": "All players already have auction status set", "initialized": 0}

        # Get current max auction order
        max_order_player = await players.find_one(
            {"auction_order": {"$ne": None}},
            sort=[("auction_order", -1)]
        )
        current_max_order = max_order_player.get("auction_order", 0) if max_order_player else 0

        initialized_count = 0
        for player in players_not_in_auction:
            current_max_order += 1
            await players.update_one(
                {"_id": player["_id"]},
                {
                    "$set": {
                        "base_price": base_price,
                        "auction_status": "pending",
                        "is_icon_player": False,
                        "icon_player_team_id": None,
                        "auction_order": current_max_order,
                        "sold_price": None,
                        "sold_to_team_id": None,
                        "updated_at": datetime.utcnow(),
                    }
                }
            )
            initialized_count += 1

        return {
            "message": f"Initialized auction for {initialized_count} players",
            "initialized": initialized_count,
            "total_players": len(players_not_in_auction),
        }

    @staticmethod
    async def initialize_auction_order() -> dict:
        """Initialize auction order for players who have auction_status but no order"""
        db = get_database()
        players = db["players"]

        # Get players with auction_status but without auction_order
        players_without_order = await players.find(
            {
                "auction_status": {"$ne": None},
                "$or": [{"auction_order": None}, {"auction_order": {"$exists": False}}]
            }
        ).to_list(length=None)

        if not players_without_order:
            return {"message": "All auction players already have order", "updated": 0}

        # Get current max order
        max_order_player = await players.find_one(
            {"auction_order": {"$ne": None}},
            sort=[("auction_order", -1)]
        )
        current_max = max_order_player.get("auction_order", 0) if max_order_player else 0

        # Assign order to players
        for i, player in enumerate(players_without_order):
            new_order = current_max + i + 1
            await players.update_one(
                {"_id": player["_id"]},
                {"$set": {"auction_order": new_order, "updated_at": datetime.utcnow()}}
            )

        return {
            "message": f"Initialized auction order for {len(players_without_order)} players",
            "updated": len(players_without_order),
        }

    @staticmethod
    async def randomize_auction_order(only_pending: bool = True) -> dict:
        """Randomize auction order for players (only those with auction_status set)"""
        db = get_database()
        players = db["players"]

        # Get players to randomize (must have auction_status set)
        if only_pending:
            query = {"auction_status": "pending"}
        else:
            query = {"auction_status": {"$ne": None}}

        player_list = await players.find(query).to_list(length=None)

        if not player_list:
            return {"message": "No players to randomize", "randomized": 0}

        # Create a list of player IDs and shuffle them
        player_ids = [p["_id"] for p in player_list]
        random.shuffle(player_ids)

        # Assign new sequential order based on shuffled list
        for i, player_id in enumerate(player_ids):
            new_order = i + 1
            await players.update_one(
                {"_id": player_id},
                {"$set": {"auction_order": new_order, "updated_at": datetime.utcnow()}}
            )

        return {
            "message": f"Randomized auction order for {len(player_list)} players",
            "randomized": len(player_list),
        }

    @staticmethod
    async def update_auction_order(data: AuctionOrderUpdate) -> dict:
        """
        Update auction order for a player.
        If another player has that order, swap the orders.
        """
        if not validate_object_id(data.player_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid player ID",
            )

        db = get_database()
        players = db["players"]

        # Check if player exists
        player = await players.find_one({"_id": ObjectId(data.player_id)})
        if not player:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Player not found",
            )

        current_order = player.get("auction_order")

        # Find player with target order
        player_with_target_order = await players.find_one(
            {"auction_order": data.new_order, "_id": {"$ne": ObjectId(data.player_id)}}
        )

        # If another player has this order, swap
        if player_with_target_order:
            # Update the other player with current player's order
            await players.update_one(
                {"_id": player_with_target_order["_id"]},
                {"$set": {"auction_order": current_order, "updated_at": datetime.utcnow()}}
            )

        # Update the current player with new order
        await players.update_one(
            {"_id": ObjectId(data.player_id)},
            {"$set": {"auction_order": data.new_order, "updated_at": datetime.utcnow()}}
        )

        updated_player = await players.find_one({"_id": ObjectId(data.player_id)})

        result = {
            "player": object_id_to_string(updated_player),
            "message": f"Player order updated to {data.new_order}",
        }

        if player_with_target_order:
            swapped_player = await players.find_one({"_id": player_with_target_order["_id"]})
            result["swapped_with"] = object_id_to_string(swapped_player)
            result["message"] = f"Swapped order: Player moved to {data.new_order}, swapped player moved to {current_order}"

        return result

    @staticmethod
    async def get_players_by_auction_order(
        skip: int = 0,
        limit: int = 100,
        include_sold: bool = False
    ) -> dict:
        """Get all players ordered by auction_order (only those with auction_status set)"""
        db = get_database()
        players = db["players"]

        # Must have auction_status set (i.e., in auction)
        query = {"auction_status": {"$ne": None}}
        if not include_sold:
            query["auction_status"] = {"$nin": ["sold", None]}

        total = await players.count_documents(query)
        player_list = await players.find(query).sort(
            "auction_order", 1
        ).skip(skip).limit(limit).to_list(length=None)

        return {
            "players": [object_id_to_string(p) for p in player_list],
            "total": total,
            "skip": skip,
            "limit": limit,
        }

    @staticmethod
    async def get_all_players_with_order(only_in_auction: bool = False) -> dict:
        """Get all players ordered by auction_order for management"""
        db = get_database()
        players = db["players"]

        # If only_in_auction, filter for players with auction_status set
        # Otherwise show all players (for management page)
        if only_in_auction:
            query = {"auction_status": {"$ne": None}}
        else:
            query = {}

        total = await players.count_documents(query)
        # Sort by auction_order (None values will be at the end)
        player_list = await players.find(query).sort([("auction_order", 1)]).to_list(length=None)

        return {
            "players": [object_id_to_string(p) for p in player_list],
            "total": total,
        }


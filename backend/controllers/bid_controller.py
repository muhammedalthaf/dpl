from fastapi import HTTPException, status
from database import get_database
from schemas import BidCreate
from utils import object_id_to_string, validate_object_id
from datetime import datetime
from bson import ObjectId
from typing import Optional, List


class BidController:
    """Controller for bid operations"""

    @staticmethod
    async def create_bid(bid_data: BidCreate) -> dict:
        """Create a new bid"""
        db = get_database()

        # Validate player and team exist
        players = db["players"]
        teams = db["teams"]

        if not validate_object_id(bid_data.player_id) or not validate_object_id(bid_data.team_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid player or team ID",
            )

        player = await players.find_one({"_id": ObjectId(bid_data.player_id)})
        if not player:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Player not found",
            )

        team = await teams.find_one({"_id": ObjectId(bid_data.team_id)})
        if not team:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team not found",
            )

        # Check team has enough purse balance
        purse_balance = team.get("purse_balance", 8000)
        if bid_data.amount > purse_balance:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient purse balance. Team has ₹{purse_balance}, bid amount is ₹{bid_data.amount}",
            )

        # Get highest bid for validation
        bids_collection = db["bids"]
        highest_bid = await bids_collection.find_one(
            {"player_id": bid_data.player_id},
            sort=[("amount", -1)]
        )

        base_price = player.get("base_price", 100)

        # First bid: must be >= base price
        # Subsequent bids: must be > highest bid
        if not highest_bid:
            if bid_data.amount < base_price:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"First bid must be at least {base_price} (base price)",
                )
        else:
            if bid_data.amount <= highest_bid.get("amount", 0):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Bid amount must be greater than {highest_bid.get('amount', 0)}",
                )

        bid_doc = {
            **bid_data.model_dump(),
            "team_name": team.get("name"),
            "timestamp": datetime.utcnow(),
            "created_at": datetime.utcnow(),
        }

        result = await bids_collection.insert_one(bid_doc)

        # Update player auction status to live
        await players.update_one(
            {"_id": ObjectId(bid_data.player_id)},
            {
                "$set": {
                    "auction_status": "live",
                    "updated_at": datetime.utcnow(),
                }
            },
        )

        created_bid = await bids_collection.find_one({"_id": result.inserted_id})
        return object_id_to_string(created_bid)

    @staticmethod
    async def get_bid(bid_id: str) -> dict:
        """Get bid by ID"""
        if not validate_object_id(bid_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid bid ID",
            )

        db = get_database()
        bids_collection = db["bids"]

        bid = await bids_collection.find_one({"_id": ObjectId(bid_id)})
        if not bid:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bid not found",
            )

        return object_id_to_string(bid)

    @staticmethod
    async def get_bids_for_player(player_id: str, skip: int = 0, limit: int = 50) -> dict:
        """Get all bids for a specific player"""
        if not validate_object_id(player_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid player ID",
            )

        db = get_database()
        bids_collection = db["bids"]

        total = await bids_collection.count_documents({"player_id": player_id})
        bids = await bids_collection.find(
            {"player_id": player_id}
        ).sort("amount", -1).skip(skip).limit(limit).to_list(length=None)

        return {
            "player_id": player_id,
            "bids": [object_id_to_string(b) for b in bids],
            "total": total,
            "highest_bid": object_id_to_string(bids[0]) if bids else None,
        }

    @staticmethod
    async def get_bids_for_team(team_id: str, skip: int = 0, limit: int = 50) -> dict:
        """Get all bids placed by a specific team"""
        if not validate_object_id(team_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid team ID",
            )

        db = get_database()
        bids_collection = db["bids"]

        total = await bids_collection.count_documents({"team_id": team_id})
        bids = await bids_collection.find(
            {"team_id": team_id}
        ).sort("timestamp", -1).skip(skip).limit(limit).to_list(length=None)

        return {
            "team_id": team_id,
            "bids": [object_id_to_string(b) for b in bids],
            "total": total,
        }

    @staticmethod
    async def delete_bid(bid_id: str) -> dict:
        """Delete a bid"""
        if not validate_object_id(bid_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid bid ID",
            )

        db = get_database()
        bids_collection = db["bids"]

        # Get the bid before deleting
        bid = await bids_collection.find_one({"_id": ObjectId(bid_id)})
        if not bid:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bid not found",
            )

        await bids_collection.delete_one({"_id": ObjectId(bid_id)})

        return {"message": "Bid deleted successfully", "bid_id": bid_id}

    @staticmethod
    async def get_highest_bid(player_id: str) -> Optional[dict]:
        """Get the highest bid for a player"""
        if not validate_object_id(player_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid player ID",
            )

        db = get_database()
        bids_collection = db["bids"]

        highest_bid = await bids_collection.find_one(
            {"player_id": player_id},
            sort=[("amount", -1)]
        )

        if not highest_bid:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No bids found for this player",
            )

        return object_id_to_string(highest_bid)

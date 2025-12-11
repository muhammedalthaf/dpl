from fastapi import HTTPException, status
from database import get_database
from schemas import PlayerCreate, PlayerUpdate, AuctionStatus
from utils import object_id_to_string, validate_object_id
from datetime import datetime
from bson import ObjectId
from typing import Optional


class AuctionController:
    """Controller for auction operations - uses players collection"""

    @staticmethod
    async def create_auction_player(player_data: PlayerCreate) -> dict:
        """Create a new player with auction fields initialized"""
        db = get_database()
        players = db["players"]

        # Get current max auction order
        max_order_player = await players.find_one(
            {"auction_order": {"$ne": None}},
            sort=[("auction_order", -1)]
        )
        next_order = (max_order_player.get("auction_order", 0) if max_order_player else 0) + 1

        player_dict = player_data.model_dump()
        player_dict["created_at"] = datetime.utcnow()
        player_dict["updated_at"] = datetime.utcnow()
        # Set auction fields
        player_dict["base_price"] = player_dict.get("base_price") or 100
        player_dict["auction_status"] = player_dict.get("auction_status") or "pending"
        player_dict["is_icon_player"] = player_dict.get("is_icon_player", False)
        player_dict["icon_player_team_id"] = player_dict.get("icon_player_team_id")
        player_dict["auction_order"] = player_dict.get("auction_order") or next_order
        player_dict["sold_price"] = None
        player_dict["sold_to_team_id"] = None

        result = await players.insert_one(player_dict)
        created_player = await players.find_one({"_id": result.inserted_id})
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
        players = db["players"]

        player = await players.find_one({"_id": ObjectId(player_id)})
        if not player:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Player not found",
            )

        return object_id_to_string(player)

    @staticmethod
    async def get_auction_players_by_status(
        auction_status: AuctionStatus, skip: int = 0, limit: int = 10
    ) -> dict:
        """Get players filtered by auction status"""
        db = get_database()
        players = db["players"]

        total = await players.count_documents({"auction_status": auction_status.value})
        player_list = await players.find(
            {"auction_status": auction_status.value}
        ).skip(skip).limit(limit).to_list(length=None)

        return {
            "status": auction_status.value,
            "players": [object_id_to_string(p) for p in player_list],
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
        players = db["players"]

        result = await players.update_one(
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

        updated_player = await players.find_one({"_id": ObjectId(player_id)})
        return object_id_to_string(updated_player)

    @staticmethod
    async def finalize_player_sale(
        player_id: str,
        team_id: str,
        sale_price: int
    ) -> dict:
        """Finalize a player sale and deduct from team's purse balance"""
        if not validate_object_id(player_id) or not validate_object_id(team_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid player or team ID",
            )

        db = get_database()
        players = db["players"]
        teams = db["teams"]

        # Verify team exists and has enough balance
        team = await teams.find_one({"_id": ObjectId(team_id)})
        if not team:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team not found",
            )

        current_balance = team.get("purse_balance", 8000)
        if sale_price > current_balance:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Team does not have enough purse balance. Current balance: {current_balance}, Sale price: {sale_price}",
            )

        # Update player status
        update_data = {
            "auction_status": "sold",
            "sold_to_team_id": team_id,
            "sold_price": sale_price,
            "updated_at": datetime.utcnow(),
        }

        result = await players.update_one(
            {"_id": ObjectId(player_id)},
            {"$set": update_data}
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Player not found",
            )

        # Deduct sale price from team's purse balance
        new_balance = current_balance - sale_price
        await teams.update_one(
            {"_id": ObjectId(team_id)},
            {"$set": {"purse_balance": new_balance, "updated_at": datetime.utcnow()}}
        )

        updated_player = await players.find_one({"_id": ObjectId(player_id)})
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
        players = db["players"]

        update_data = {
            "auction_status": "unsold",
            "sold_price": None,
            "sold_to_team_id": None,
            "updated_at": datetime.utcnow(),
        }

        result = await players.update_one(
            {"_id": ObjectId(player_id)},
            {"$set": update_data}
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Player not found",
            )

        updated_player = await players.find_one({"_id": ObjectId(player_id)})
        return object_id_to_string(updated_player)

    @staticmethod
    async def get_auction_summary() -> dict:
        """Get comprehensive auction summary with recent activity and team progress"""
        db = get_database()
        players = db["players"]
        teams_collection = db["teams"]
        bids_collection = db["bids"]

        # Only count players that have auction_status set (i.e. in auction) and exclude icon players
        query_in_auction = {"auction_status": {"$ne": None}, "is_icon_player": {"$ne": True}}
        total_players = await players.count_documents(query_in_auction)
        pending = await players.count_documents({"auction_status": "pending", "is_icon_player": {"$ne": True}})
        live = await players.count_documents({"auction_status": "live"})
        sold = await players.count_documents({"auction_status": "sold"})
        unsold = await players.count_documents({"auction_status": "unsold"})

        # Get sold players with details
        sold_players = await players.find(
            {"auction_status": "sold"}
        ).to_list(length=None)
        total_value = sum(p.get("sold_price", 0) for p in sold_players)

        # Get live players with their highest bids
        live_players_list = await players.find(
            {"auction_status": "live"}
        ).to_list(length=None)

        live_players_with_bids = []
        for player in live_players_list:
            player_id = str(player["_id"])
            highest_bid = await bids_collection.find_one(
                {"player_id": player_id},
                sort=[("amount", -1)]
            )
            live_players_with_bids.append({
                **object_id_to_string(player),
                "highest_bid": object_id_to_string(highest_bid) if highest_bid else None
            })

        # Get latest bid per player (last 10 unique players)
        # Use aggregation to get only the most recent bid for each player
        pipeline = [
            {"$sort": {"timestamp": -1}},
            {"$group": {
                "_id": "$player_id",
                "bid_id": {"$first": "$_id"},
                "amount": {"$first": "$amount"},
                "team_name": {"$first": "$team_name"},
                "team_id": {"$first": "$team_id"},
                "timestamp": {"$first": "$timestamp"},
            }},
            {"$sort": {"timestamp": -1}},
            {"$limit": 10}
        ]
        recent_bids = await bids_collection.aggregate(pipeline).to_list(length=None)
        recent_activity = []
        for bid in recent_bids:
            player_id = bid.get("_id")  # _id is player_id from grouping
            player = await players.find_one({"_id": ObjectId(player_id)}) if player_id else None
            recent_activity.append({
                "_id": str(bid.get("bid_id")),
                "player_id": player_id,
                "amount": bid.get("amount"),
                "team_name": bid.get("team_name"),
                "team_id": bid.get("team_id"),
                "timestamp": bid.get("timestamp"),
                "player_name": player.get("name") if player else "Unknown",
                "player_status": player.get("auction_status") if player else None,
                "player_image": player.get("image_url") if player else None,
            })

        # Get all teams with their auction progress (including icon players)
        all_teams = await teams_collection.find().to_list(length=None)
        team_progress = []
        for team in all_teams:
            team_id = str(team["_id"])

            # Get sold players for this team
            sold_players_list = await players.find({
                "sold_to_team_id": team_id,
                "auction_status": "sold"
            }).to_list(length=None)

            # Get icon players for this team
            icon_players_list = await players.find({
                "icon_player_team_id": team_id,
                "is_icon_player": True
            }).to_list(length=None)

            # Combine both lists (avoid duplicates if any)
            all_team_players = []
            seen_ids = set()
            for p in icon_players_list:
                all_team_players.append({**object_id_to_string(p), "is_icon_player": True})
                seen_ids.add(str(p["_id"]))
            for p in sold_players_list:
                if str(p["_id"]) not in seen_ids:
                    all_team_players.append({**object_id_to_string(p), "is_icon_player": False})

            total_spent = sum(p.get("sold_price", 0) for p in sold_players_list)
            purse_balance = team.get("purse_balance", 8000)

            team_progress.append({
                "_id": team_id,
                "name": team.get("name"),
                "icon_url": team.get("icon_url"),
                "owner_name": team.get("owner_name"),
                "purse_balance": purse_balance,
                "total_spent": total_spent,
                "players_count": len(all_team_players),
                "icon_players_count": len(icon_players_list),
                "sold_players_count": len(sold_players_list),
                "players": all_team_players
            })

        return {
            "stats": {
                "total_players": total_players,
                "pending": pending,
                "live": live,
                "sold": sold,
                "unsold": unsold,
                "total_auction_value": total_value,
                "average_player_value": total_value // sold if sold > 0 else 0,
            },
            "live_players": live_players_with_bids,
            "recent_activity": recent_activity,
            "team_progress": team_progress,
        }

    @staticmethod
    async def get_all_auction_players(skip: int = 0, limit: int = 1000) -> dict:
        """Get all players in auction (with auction_status set)"""
        db = get_database()
        players = db["players"]

        # Only get players that have auction_status set
        query = {"auction_status": {"$ne": None}}
        total = await players.count_documents(query)
        player_list = await players.find(query).sort("auction_order", 1).skip(skip).limit(limit).to_list(length=None)

        return {
            "players": [object_id_to_string(p) for p in player_list],
            "total": total,
            "skip": skip,
            "limit": limit,
        }

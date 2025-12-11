from fastapi import APIRouter, Query
from schemas import IconPlayerAssign, AuctionOrderUpdate
from controllers.icon_player_controller import IconPlayerController
from controllers.auction_order_controller import AuctionOrderController
from utils import create_response, create_error_response

router = APIRouter(prefix="/icon-players", tags=["Icon Players"])


# ===================== ICON PLAYER ROUTES =====================
@router.post("/assign", summary="Assign icon player to team")
async def assign_icon_player(data: IconPlayerAssign):
    """Assign a player as an icon player to a team (costs 1500 from purse)"""
    try:
        result = await IconPlayerController.assign_icon_player(data)
        return create_response(result, "Icon player assigned successfully", 201)
    except Exception as e:
        return create_error_response(str(e), 400)


@router.post("/unassign/{player_id}", summary="Unassign icon player")
async def unassign_icon_player(player_id: str):
    """Remove icon player status from a player"""
    try:
        result = await IconPlayerController.unassign_icon_player(player_id)
        return create_response(result, "Icon player unassigned successfully")
    except Exception as e:
        return create_error_response(str(e), 400)


@router.get("/team/{team_id}", summary="Get icon players by team")
async def get_icon_players_by_team(team_id: str):
    """Get all icon players for a specific team"""
    try:
        result = await IconPlayerController.get_icon_players_by_team(team_id)
        return create_response(result, "Icon players retrieved successfully")
    except Exception as e:
        return create_error_response(str(e), 400)


@router.get("/", summary="Get all icon players")
async def get_all_icon_players():
    """Get all icon players across all teams"""
    try:
        result = await IconPlayerController.get_all_icon_players()
        return create_response(result, "All icon players retrieved successfully")
    except Exception as e:
        return create_error_response(str(e), 400)


# ===================== AUCTION ORDER ROUTES =====================
auction_order_router = APIRouter(prefix="/auction-order", tags=["Auction Order"])


@auction_order_router.post("/initialize-all", summary="Initialize auction for all players")
async def initialize_auction_for_all(base_price: int = Query(100, ge=1)):
    """Initialize auction fields (base_price, auction_status, auction_order) for all players"""
    try:
        result = await AuctionOrderController.initialize_auction_for_all_players(base_price)
        return create_response(result, "Auction initialized for players successfully")
    except Exception as e:
        return create_error_response(str(e), 400)


@auction_order_router.post("/initialize-order", summary="Initialize auction order")
async def initialize_auction_order():
    """Initialize auction order for players with auction_status but no order"""
    try:
        result = await AuctionOrderController.initialize_auction_order()
        return create_response(result, "Auction order initialized successfully")
    except Exception as e:
        return create_error_response(str(e), 400)


@auction_order_router.post("/randomize", summary="Randomize auction order")
async def randomize_auction_order(only_pending: bool = Query(True)):
    """Randomize auction order for players (by default only pending players)"""
    try:
        result = await AuctionOrderController.randomize_auction_order(only_pending)
        return create_response(result, "Auction order randomized successfully")
    except Exception as e:
        return create_error_response(str(e), 400)


@auction_order_router.put("/update", summary="Update player auction order")
async def update_auction_order(data: AuctionOrderUpdate):
    """Update auction order for a player (swaps if another player has that order)"""
    try:
        result = await AuctionOrderController.update_auction_order(data)
        return create_response(result, "Auction order updated successfully")
    except Exception as e:
        return create_error_response(str(e), 400)


@auction_order_router.get("/players", summary="Get players by auction order")
async def get_players_by_auction_order(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    include_sold: bool = Query(False),
):
    """Get all players ordered by auction order"""
    try:
        result = await AuctionOrderController.get_players_by_auction_order(skip, limit, include_sold)
        return create_response(result, "Players retrieved by auction order")
    except Exception as e:
        return create_error_response(str(e), 400)


@auction_order_router.get("/all", summary="Get all players with order for management")
async def get_all_players_with_order(only_in_auction: bool = Query(False)):
    """Get all players for management screen (optionally filter to only those in auction)"""
    try:
        result = await AuctionOrderController.get_all_players_with_order(only_in_auction)
        return create_response(result, "All players retrieved")
    except Exception as e:
        return create_error_response(str(e), 400)


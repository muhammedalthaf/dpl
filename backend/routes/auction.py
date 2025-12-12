from fastapi import APIRouter, Query
from schemas import AuctionPlayerCreate, AuctionStatus
from controllers.auction_controller import AuctionController
from utils import create_response, create_error_response

router = APIRouter(prefix="/auction", tags=["Auction"])


@router.post("/players", summary="Create auction player")
async def create_auction_player(player: AuctionPlayerCreate):
    """Add a new player to auction"""
    try:
        result = await AuctionController.create_auction_player(player)
        return create_response(result, "Auction player created successfully", 201)
    except Exception as e:
        return create_error_response(str(e), 400)


@router.get("/players/{player_id}", summary="Get auction player")
async def get_auction_player(player_id: str):
    """Get auction player by ID"""
    try:
        result = await AuctionController.get_auction_player(player_id)
        return create_response(result, "Auction player retrieved successfully")
    except Exception as e:
        return create_error_response(str(e), 404)


@router.get("/players", summary="Get all auction players")
async def get_all_auction_players(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=500),
):
    """Get all players in auction"""
    try:
        result = await AuctionController.get_all_auction_players(skip, limit)
        return create_response(result, "Auction players retrieved successfully")
    except Exception as e:
        return create_error_response(str(e), 400)


@router.get("/players/status/{status}", summary="Get players by status")
async def get_auction_players_by_status(
    status: AuctionStatus,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
):
    """Get players filtered by auction status"""
    try:
        result = await AuctionController.get_auction_players_by_status(status, skip, limit)
        return create_response(result, f"Players with status {status.value} retrieved successfully")
    except Exception as e:
        return create_error_response(str(e), 400)


@router.put("/players/{player_id}/status/{new_status}", summary="Update auction status")
async def update_auction_status(player_id: str, new_status: AuctionStatus):
    """Update auction status of a player"""
    try:
        result = await AuctionController.update_auction_status(player_id, new_status)
        return create_response(result, f"Player status updated to {new_status.value}")
    except Exception as e:
        return create_error_response(str(e), 400)


@router.post("/players/{player_id}/finalize", summary="Finalize player sale")
async def finalize_player_sale(
    player_id: str,
    team_id: str,
    sale_price: int,
):
    """Finalize a player sale"""
    try:
        result = await AuctionController.finalize_player_sale(player_id, team_id, sale_price)
        return create_response(result, "Player sale finalized successfully")
    except Exception as e:
        return create_error_response(str(e), 400)


@router.put("/players/{player_id}/unsold", summary="Mark player as unsold")
async def mark_player_unsold(player_id: str):
    """Mark a player as unsold"""
    try:
        result = await AuctionController.mark_player_unsold(player_id)
        return create_response(result, "Player marked as unsold")
    except Exception as e:
        return create_error_response(str(e), 400)


@router.post("/players/{player_id}/reopen", summary="Reopen player for auction")
async def reopen_player(player_id: str):
    """Reopen a player for auction - clears bids, refunds team if sold, resets sold fields"""
    try:
        result = await AuctionController.reopen_player(player_id)
        return create_response(result, "Player reopened for auction")
    except Exception as e:
        return create_error_response(str(e), 400)


@router.get("/summary", summary="Get auction summary")
async def get_auction_summary():
    """Get auction summary and statistics"""
    try:
        result = await AuctionController.get_auction_summary()
        return create_response(result, "Auction summary retrieved successfully")
    except Exception as e:
        return create_error_response(str(e), 400)

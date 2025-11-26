from fastapi import APIRouter, Query
from schemas import BidCreate
from controllers.bid_controller import BidController
from utils import create_response, create_error_response

router = APIRouter(prefix="/bids", tags=["Bids"])


@router.post("/", summary="Create a new bid")
async def create_bid(bid: BidCreate):
    """Create a new bid for a player"""
    try:
        result = await BidController.create_bid(bid)
        return create_response(result, "Bid created successfully", 201)
    except Exception as e:
        return create_error_response(str(e), 400)


@router.get("/{bid_id}", summary="Get bid by ID")
async def get_bid(bid_id: str):
    """Get bid by ID"""
    try:
        result = await BidController.get_bid(bid_id)
        return create_response(result, "Bid retrieved successfully")
    except Exception as e:
        return create_error_response(str(e), 404)


@router.get("/player/{player_id}", summary="Get bids for a player")
async def get_bids_for_player(
    player_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """Get all bids for a specific player"""
    try:
        result = await BidController.get_bids_for_player(player_id, skip, limit)
        return create_response(result, "Player bids retrieved successfully")
    except Exception as e:
        return create_error_response(str(e), 400)


@router.get("/team/{team_id}", summary="Get bids by team")
async def get_bids_for_team(
    team_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """Get all bids placed by a specific team"""
    try:
        result = await BidController.get_bids_for_team(team_id, skip, limit)
        return create_response(result, "Team bids retrieved successfully")
    except Exception as e:
        return create_error_response(str(e), 400)


@router.delete("/{bid_id}", summary="Delete a bid")
async def delete_bid(bid_id: str):
    """Delete a bid"""
    try:
        result = await BidController.delete_bid(bid_id)
        return create_response(result, "Bid deleted successfully")
    except Exception as e:
        return create_error_response(str(e), 400)


@router.get("/player/{player_id}/highest", summary="Get highest bid")
async def get_highest_bid(player_id: str):
    """Get the highest bid for a player"""
    try:
        result = await BidController.get_highest_bid(player_id)
        return create_response(result, "Highest bid retrieved successfully")
    except Exception as e:
        return create_error_response(str(e), 400)

from fastapi import APIRouter, Query, File, UploadFile
from schemas import PlayerCreate, PlayerUpdate, PlayerRole
from controllers.player_controller import PlayerController
from utils import create_response, create_error_response
import os
import aiofiles
import time

router = APIRouter(prefix="/players", tags=["Players"])

# Create upload directory for player images
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads", "players")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/", summary="Create a new player")
async def create_player(player: PlayerCreate):
    """Create a new player"""
    try:
        result = await PlayerController.create_player(player)
        return create_response(result, "Player created successfully", 201)
    except Exception as e:
        return create_error_response(str(e), 400)


@router.get("/{player_id}", summary="Get player by ID")
async def get_player(player_id: str):
    """Get player by ID"""
    try:
        result = await PlayerController.get_player(player_id)
        return create_response(result, "Player retrieved successfully")
    except Exception as e:
        return create_error_response(str(e), 404)


@router.get("/", summary="Get all players")
async def get_all_players(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: str = Query(None),
):
    """Get all players with pagination and search"""
    try:
        result = await PlayerController.get_all_players(skip, limit, search)
        return create_response(result, "Players retrieved successfully")
    except Exception as e:
        return create_error_response(str(e), 400)


@router.put("/{player_id}", summary="Update player")
async def update_player(player_id: str, player: PlayerUpdate):
    """Update player details"""
    try:
        result = await PlayerController.update_player(player_id, player)
        return create_response(result, "Player updated successfully")
    except Exception as e:
        return create_error_response(str(e), 400)


@router.delete("/{player_id}", summary="Delete player")
async def delete_player(player_id: str):
    """Delete a player"""
    try:
        result = await PlayerController.delete_player(player_id)
        return create_response(result, "Player deleted successfully")
    except Exception as e:
        return create_error_response(str(e), 400)


@router.get("/role/{role}", summary="Get players by role")
async def get_players_by_role(
    role: PlayerRole,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
):
    """Get players filtered by role"""
    try:
        result = await PlayerController.get_players_by_role(role.value, skip, limit)
        return create_response(result, f"Players with role {role.value} retrieved successfully")
    except Exception as e:
        return create_error_response(str(e), 400)


@router.post("/{player_id}/upload-image", summary="Upload player image")
async def upload_player_image(player_id: str, image: UploadFile = File(...)):
    """Upload or update player image"""
    try:
        # Get current player to ensure it exists
        player = await PlayerController.get_player(player_id)

        # Save new image
        img_ext = image.filename.split(".")[-1].lower()
        img_filename = f"{player['name'].replace(' ', '_')}_{int(time.time())}.{img_ext}"
        img_path = os.path.join(UPLOAD_DIR, img_filename)

        async with aiofiles.open(img_path, "wb") as f:
            contents = await image.read()
            await f.write(contents)

        image_url = f"/uploads/players/{img_filename}"

        # Update player with new image URL
        from schemas import PlayerUpdate
        result = await PlayerController.update_player(player_id, PlayerUpdate(image_url=image_url))
        return create_response(result, "Player image uploaded successfully")
    except Exception as e:
        return create_error_response(str(e), 400)

from fastapi import APIRouter, Query, File, UploadFile, Form
import os
import aiofiles
from schemas import TeamCreate, TeamUpdate
from controllers.team_controller import TeamController
from utils import create_response, create_error_response

router = APIRouter(prefix="/teams", tags=["Teams"])

# Create upload directory if it doesn't exist
UPLOAD_DIR = "/tmp/cvcl_uploads/teams"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/", summary="Create a new team")
async def create_team(
    name: str = Form(...),
    owner_name: str = Form(...),
    owner_contact: str = Form(...),
    owner_details: str = Form(None),
    icon_file: UploadFile = File(None),
):
    """Create a new team with optional logo file"""
    try:
        icon_url = None

        if icon_file:
            file_extension = icon_file.filename.split(".")[-1]
            file_name = f"{name.replace(' ', '_')}_{int(__import__('time').time())}.{file_extension}"
            file_path = os.path.join(UPLOAD_DIR, file_name)

            async with aiofiles.open(file_path, "wb") as f:
                contents = await icon_file.read()
                await f.write(contents)

            icon_url = f"/uploads/teams/{file_name}"

        team_data = TeamCreate(
            name=name,
            owner_name=owner_name,
            owner_contact=owner_contact,
            owner_details=owner_details,
            icon_url=icon_url,
        )

        result = await TeamController.create_team(team_data)
        return create_response(result, "Team created successfully", 201)
    except Exception as e:
        return create_error_response(str(e), 400)


@router.get("/{team_id}", summary="Get team by ID")
async def get_team(team_id: str):
    """Get team by ID"""
    try:
        result = await TeamController.get_team(team_id)
        return create_response(result, "Team retrieved successfully")
    except Exception as e:
        return create_error_response(str(e), 404)


@router.get("/", summary="Get all teams")
async def get_all_teams(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: str = Query(None),
):
    """Get all teams with pagination and search"""
    try:
        result = await TeamController.get_all_teams(skip, limit, search)
        return create_response(result, "Teams retrieved successfully")
    except Exception as e:
        return create_error_response(str(e), 400)


@router.put("/{team_id}", summary="Update team")
async def update_team(team_id: str, team: TeamUpdate):
    """Update team details"""
    try:
        result = await TeamController.update_team(team_id, team)
        return create_response(result, "Team updated successfully")
    except Exception as e:
        return create_error_response(str(e), 400)


@router.delete("/{team_id}", summary="Delete team")
async def delete_team(team_id: str):
    """Delete a team"""
    try:
        result = await TeamController.delete_team(team_id)
        return create_response(result, "Team deleted successfully")
    except Exception as e:
        return create_error_response(str(e), 400)


@router.get("/{team_id}/stats", summary="Get team statistics")
async def get_team_stats(team_id: str):
    """Get team auction statistics"""
    try:
        result = await TeamController.get_team_stats(team_id)
        return create_response(result, "Team statistics retrieved successfully")
    except Exception as e:
        return create_error_response(str(e), 400)

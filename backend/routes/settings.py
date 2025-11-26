from fastapi import APIRouter
from controllers.settings_controller import SettingsController
from utils import create_response

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("/", summary="Get application settings")
async def get_settings():
    """Get current application settings including registration status"""
    settings = await SettingsController.get_settings()
    return create_response(data=settings, message="Settings retrieved successfully")


@router.put("/registration-status", summary="Update registration status")
async def update_registration_status(is_open: bool):
    """Open or close player registration"""
    result = await SettingsController.update_registration_status(is_open)
    status_text = "opened" if is_open else "closed"
    return create_response(data=result, message=f"Registration {status_text} successfully")


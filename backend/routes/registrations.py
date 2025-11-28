from fastapi import APIRouter, Query, File, UploadFile, Form, HTTPException
from fastapi.encoders import jsonable_encoder
import os
import aiofiles
from schemas import RegistrationCreate, RegistrationUpdate, RegistrationStatus, PlayerRole, IDProofType
from controllers.registration_controller import RegistrationController
from utils import create_response, create_error_response

router = APIRouter(prefix="/registrations", tags=["Registrations"])

# Create upload directory if it doesn't exist (relative to application directory)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads", "registrations")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Valid role values
VALID_ROLES = [role.value for role in PlayerRole]
VALID_ID_PROOF_TYPES = [id_type.value for id_type in IDProofType]


@router.post("/", summary="Create a new registration")
async def create_registration(
    player_name: str = Form(..., min_length=2, max_length=100, description="Player's full name"),
    phone: str = Form(..., min_length=10, max_length=15, description="Phone number"),
    role: str = Form(..., description="Player role: bat, ball, wk, or all-rounder"),
    place: str = Form(..., min_length=2, max_length=100, description="Player's place/village"),
    panchayat: str = Form(..., min_length=1, max_length=100, description="Player's panchayat"),
    player_image: UploadFile = File(..., description="Player photo"),
    payment_screenshot: UploadFile = File(..., description="Payment screenshot file"),
    email: str = Form(None, description="Optional email address"),
    id_proof_type: str = Form(None, description="ID proof type: aadhar, driving_license, voter_id, or passport"),
    id_proof_file: UploadFile = File(None, description="ID proof file upload"),
):
    """Submit a new player registration with player photo, payment screenshot and optional ID proof file"""
    import time
    import re

    try:
        # Validate role
        if role not in VALID_ROLES:
            return create_error_response(
                f"Invalid role '{role}'. Must be one of: {', '.join(VALID_ROLES)}", 400
            )

        # Validate id_proof_type if provided
        if id_proof_type and id_proof_type not in VALID_ID_PROOF_TYPES:
            return create_error_response(
                f"Invalid id_proof_type '{id_proof_type}'. Must be one of: {', '.join(VALID_ID_PROOF_TYPES)}", 400
            )

        # Validate email format if provided
        if email:
            email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_regex, email):
                return create_error_response("Invalid email format", 400)

        # Validate player image
        if not player_image or not player_image.filename:
            return create_error_response("Player photo is required", 400)

        # Validate payment screenshot
        if not payment_screenshot or not payment_screenshot.filename:
            return create_error_response("Payment screenshot is required", 400)

        # Save player image
        player_img_ext = player_image.filename.split(".")[-1].lower()
        player_img_filename = f"{player_name.replace(' ', '_')}_photo_{int(time.time())}.{player_img_ext}"
        player_img_path = os.path.join(UPLOAD_DIR, player_img_filename)

        async with aiofiles.open(player_img_path, "wb") as f:
            contents = await player_image.read()
            await f.write(contents)

        player_image_url = f"/uploads/registrations/{player_img_filename}"

        # Save payment screenshot
        payment_ext = payment_screenshot.filename.split(".")[-1].lower()
        payment_filename = f"{player_name.replace(' ', '_')}_payment_{int(time.time())}.{payment_ext}"
        payment_path = os.path.join(UPLOAD_DIR, payment_filename)

        async with aiofiles.open(payment_path, "wb") as f:
            contents = await payment_screenshot.read()
            await f.write(contents)

        payment_screenshot_url = f"/uploads/registrations/{payment_filename}"

        # Save ID proof if provided
        id_proof_url = None
        if id_proof_file and id_proof_file.filename:
            id_ext = id_proof_file.filename.split(".")[-1].lower()
            id_filename = f"{player_name.replace(' ', '_')}_{id_proof_type}_{int(time.time())}.{id_ext}"
            id_path = os.path.join(UPLOAD_DIR, id_filename)

            async with aiofiles.open(id_path, "wb") as f:
                contents = await id_proof_file.read()
                await f.write(contents)

            id_proof_url = f"/uploads/registrations/{id_filename}"

        registration_data = RegistrationCreate(
            player_name=player_name,
            email=email if email else None,
            phone=phone,
            role=role,
            place=place,
            panchayat=panchayat,
            player_image_url=player_image_url,
            payment_screenshot_url=payment_screenshot_url,
            id_proof_type=id_proof_type if id_proof_type else None,
            id_proof_url=id_proof_url,
        )

        result = await RegistrationController.create_registration(registration_data)
        return create_response(result, "Registration created successfully", 201)
    except HTTPException as e:
        return create_error_response(e.detail, e.status_code)
    except Exception as e:
        return create_error_response(str(e), 400)


@router.get("/{registration_id}", summary="Get registration by ID")
async def get_registration(registration_id: str):
    """Get registration by ID"""
    try:
        result = await RegistrationController.get_registration(registration_id)
        return create_response(result, "Registration retrieved successfully")
    except Exception as e:
        return create_error_response(str(e), 404)


@router.get("/", summary="Get all registrations")
async def get_all_registrations(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    status: RegistrationStatus = Query(None),
):
    """Get all registrations with pagination"""
    try:
        result = await RegistrationController.get_all_registrations(skip, limit, status)
        return create_response(result, "Registrations retrieved successfully")
    except Exception as e:
        return create_error_response(str(e), 400)


@router.put("/{registration_id}", summary="Update registration")
async def update_registration(registration_id: str, registration: RegistrationUpdate):
    """Update registration status"""
    try:
        result = await RegistrationController.update_registration(registration_id, registration)
        return create_response(result, "Registration updated successfully")
    except Exception as e:
        return create_error_response(str(e), 400)


@router.delete("/{registration_id}", summary="Delete registration")
async def delete_registration(registration_id: str):
    """Delete a registration"""
    try:
        result = await RegistrationController.delete_registration(registration_id)
        return create_response(result, "Registration deleted successfully")
    except Exception as e:
        return create_error_response(str(e), 400)


@router.post("/{registration_id}/approve", summary="Approve registration")
async def approve_registration(registration_id: str, payment_reference: str):
    """Approve a player registration with payment reference"""
    try:
        result = await RegistrationController.approve_registration(registration_id, payment_reference)
        return create_response(result, "Registration approved successfully")
    except HTTPException as e:
        return create_error_response(e.detail, e.status_code)
    except Exception as e:
        return create_error_response(str(e), 400)


@router.post("/{registration_id}/reject", summary="Reject registration")
async def reject_registration(registration_id: str, rejection_reason: str):
    """Reject a player registration"""
    try:
        result = await RegistrationController.reject_registration(registration_id, rejection_reason)
        return create_response(result, "Registration rejected successfully")
    except Exception as e:
        return create_error_response(str(e), 400)

from fastapi import HTTPException, status
from database import get_database
from schemas import RegistrationCreate, RegistrationUpdate, RegistrationStatus
from utils import object_id_to_string, validate_object_id
from datetime import datetime
from bson import ObjectId
from typing import Optional


class RegistrationController:
    """Controller for registration operations"""

    @staticmethod
    async def create_registration(registration_data: RegistrationCreate) -> dict:
        """Create a new registration"""
        db = get_database()
        registrations = db["registrations"]

        # Check if phone number already exists in registrations
        existing_phone = await registrations.find_one({"phone": registration_data.phone})
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This mobile number is already registered. Please use a different number.",
            )

        # Also check if phone exists in players collection (already approved)
        players = db["players"]
        existing_player_phone = await players.find_one({"phone": registration_data.phone})
        if existing_player_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This mobile number is already registered as a player.",
            )

        registration_doc = {
            **registration_data.model_dump(),
            "status": RegistrationStatus.PENDING.value,
            "rejection_reason": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }

        result = await registrations.insert_one(registration_doc)
        created_registration = await registrations.find_one({"_id": result.inserted_id})

        return object_id_to_string(created_registration)

    @staticmethod
    async def get_registration(registration_id: str) -> dict:
        """Get registration by ID"""
        if not validate_object_id(registration_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid registration ID",
            )

        db = get_database()
        registrations = db["registrations"]

        registration = await registrations.find_one({"_id": ObjectId(registration_id)})
        if not registration:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Registration not found",
            )

        return object_id_to_string(registration)

    @staticmethod
    async def get_all_registrations(
        skip: int = 0,
        limit: int = 10,
        status_filter: Optional[RegistrationStatus] = None,
    ) -> dict:
        """Get all registrations with optional status filter"""
        db = get_database()
        registrations = db["registrations"]

        query = {}
        if status_filter:
            query = {"status": status_filter.value}

        total = await registrations.count_documents(query)
        items = await registrations.find(query).skip(skip).limit(limit).to_list(length=None)

        return {
            "registrations": [object_id_to_string(r) for r in items],
            "total": total,
            "skip": skip,
            "limit": limit,
        }

    @staticmethod
    async def update_registration(
        registration_id: str, registration_data: RegistrationUpdate
    ) -> dict:
        """Update registration"""
        if not validate_object_id(registration_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid registration ID",
            )

        db = get_database()
        registrations = db["registrations"]

        update_data = {k: v for k, v in registration_data.model_dump().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()

        result = await registrations.update_one(
            {"_id": ObjectId(registration_id)}, {"$set": update_data}
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Registration not found",
            )

        updated_registration = await registrations.find_one({"_id": ObjectId(registration_id)})
        return object_id_to_string(updated_registration)

    @staticmethod
    async def delete_registration(registration_id: str) -> dict:
        """Delete registration"""
        if not validate_object_id(registration_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid registration ID",
            )

        db = get_database()
        registrations = db["registrations"]

        result = await registrations.delete_one({"_id": ObjectId(registration_id)})

        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Registration not found",
            )

        return {"message": "Registration deleted successfully"}

    @staticmethod
    async def approve_registration(registration_id: str, payment_reference: str) -> dict:
        """Approve a registration with payment reference validation"""
        if not validate_object_id(registration_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid registration ID",
            )

        if not payment_reference or not payment_reference.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment reference number is required",
            )

        payment_reference = payment_reference.strip()

        db = get_database()
        registrations = db["registrations"]

        # Check if payment reference is already used
        existing_payment = await registrations.find_one({
            "payment_reference": payment_reference,
            "status": RegistrationStatus.APPROVED.value
        })
        if existing_payment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This payment reference is already processed",
            )

        # Get registration details
        registration = await registrations.find_one({"_id": ObjectId(registration_id)})
        if not registration:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Registration not found",
            )

        # Update status with payment reference
        update_data = {
            "status": RegistrationStatus.APPROVED.value,
            "rejection_reason": None,
            "payment_reference": payment_reference,
            "updated_at": datetime.utcnow(),
        }

        await registrations.update_one(
            {"_id": ObjectId(registration_id)}, {"$set": update_data}
        )

        # Create player from registration
        players = db["players"]
        player_doc = {
            "name": registration.get("player_name"),
            "email": registration.get("email"),
            "phone": registration.get("phone"),
            "role": registration.get("role"),
            "place": registration.get("place"),
            "image_url": registration.get("player_image_url"),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }

        await players.insert_one(player_doc)

        updated_registration = await registrations.find_one({"_id": ObjectId(registration_id)})
        return object_id_to_string(updated_registration)

    @staticmethod
    async def reject_registration(registration_id: str, rejection_reason: str) -> dict:
        """Reject a registration"""
        if not validate_object_id(registration_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid registration ID",
            )

        db = get_database()
        registrations = db["registrations"]

        update_data = {
            "status": RegistrationStatus.REJECTED.value,
            "rejection_reason": rejection_reason,
            "updated_at": datetime.utcnow(),
        }

        result = await registrations.update_one(
            {"_id": ObjectId(registration_id)}, {"$set": update_data}
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Registration not found",
            )

        updated_registration = await registrations.find_one({"_id": ObjectId(registration_id)})
        return object_id_to_string(updated_registration)

from datetime import datetime
from database import get_database


class SettingsController:
    """Controller for application settings"""

    SETTINGS_KEY = "app_settings"

    @staticmethod
    async def get_settings():
        """Get application settings"""
        db = get_database()
        settings = db["settings"]

        doc = await settings.find_one({"key": SettingsController.SETTINGS_KEY})

        if not doc:
            # Create default settings if not exists
            default_settings = {
                "key": SettingsController.SETTINGS_KEY,
                "registration_open": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
            await settings.insert_one(default_settings)
            return {
                "registration_open": True,
            }

        return {
            "registration_open": doc.get("registration_open", True),
        }

    @staticmethod
    async def update_registration_status(is_open: bool):
        """Update registration open/close status"""
        db = get_database()
        settings = db["settings"]

        result = await settings.update_one(
            {"key": SettingsController.SETTINGS_KEY},
            {
                "$set": {
                    "registration_open": is_open,
                    "updated_at": datetime.utcnow(),
                },
                "$setOnInsert": {
                    "key": SettingsController.SETTINGS_KEY,
                    "created_at": datetime.utcnow(),
                },
            },
            upsert=True,
        )

        return {
            "registration_open": is_open,
            "updated": result.modified_count > 0 or result.upserted_id is not None,
        }


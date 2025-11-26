from datetime import datetime
from bson import ObjectId
from typing import List, Dict, Any
from fastapi.responses import JSONResponse


def object_id_to_string(obj: Any) -> Any:
    """Convert ObjectId to string in MongoDB documents"""
    if isinstance(obj, dict):
        return {
            key: object_id_to_string(value) if key != "_id" else str(value)
            for key, value in obj.items()
        }
    elif isinstance(obj, list):
        return [object_id_to_string(item) for item in obj]
    elif isinstance(obj, ObjectId):
        return str(obj)
    return obj


def create_response(data: Any = None, message: str = "Success", status: int = 200):
    """Create a standardized response"""
    return {
        "status": status,
        "message": message,
        "data": data,
        "timestamp": datetime.utcnow().isoformat(),
    }


def create_error_response(message: str, status: int = 400):
    """Create a standardized error response with proper HTTP status code"""
    return JSONResponse(
        status_code=status,
        content={
            "status": status,
            "message": message,
            "error": True,
            "timestamp": datetime.utcnow().isoformat(),
        }
    )


def validate_object_id(obj_id: str) -> bool:
    """Validate if string is a valid MongoDB ObjectId"""
    try:
        ObjectId(obj_id)
        return True
    except:
        return False


def convert_to_object_id(obj_id: str) -> ObjectId:
    """Convert string to ObjectId"""
    return ObjectId(obj_id)


def get_pagination_params(page: int = 1, page_size: int = 10) -> tuple:
    """Get pagination skip and limit values"""
    if page < 1:
        page = 1
    if page_size < 1:
        page_size = 10
    if page_size > 100:
        page_size = 100

    skip = (page - 1) * page_size
    return skip, page_size


async def paginate_response(
    items: List[Dict],
    total: int,
    page: int = 1,
    page_size: int = 10,
):
    """Create paginated response"""
    skip, limit = get_pagination_params(page, page_size)
    total_pages = (total + limit - 1) // limit

    return {
        "items": items,
        "pagination": {
            "page": page,
            "page_size": limit,
            "total": total,
            "total_pages": total_pages,
        },
    }

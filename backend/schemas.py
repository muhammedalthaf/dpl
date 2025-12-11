from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class PlayerRole(str, Enum):
    BAT = "bat"
    BALL = "ball"
    WK = "wk"
    ALL_ROUNDER = "all-rounder"


class AuctionStatus(str, Enum):
    PENDING = "pending"
    LIVE = "live"
    SOLD = "sold"
    UNSOLD = "unsold"


class RegistrationStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class IDProofType(str, Enum):
    AADHAR = "aadhar"
    DRIVING_LICENSE = "driving_license"
    VOTER_ID = "voter_id"
    PASSPORT = "passport"


# ===================== PLAYER SCHEMAS =====================
class PlayerBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: str = Field(..., min_length=10, max_length=15)
    role: PlayerRole
    place: str = Field(..., min_length=1, max_length=100)
    image_url: Optional[str] = None
    # Auction-related fields (optional - players can exist without being in auction)
    base_price: Optional[int] = Field(default=None, gt=0)
    auction_status: Optional[AuctionStatus] = None
    is_icon_player: bool = False
    icon_player_team_id: Optional[str] = None
    auction_order: Optional[int] = None
    sold_price: Optional[int] = None
    sold_to_team_id: Optional[str] = None


class PlayerCreate(PlayerBase):
    pass


class PlayerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: Optional[PlayerRole] = None
    place: Optional[str] = None
    image_url: Optional[str] = None
    # Auction-related fields
    base_price: Optional[int] = None
    auction_status: Optional[AuctionStatus] = None
    is_icon_player: Optional[bool] = None
    icon_player_team_id: Optional[str] = None
    auction_order: Optional[int] = None
    sold_price: Optional[int] = None
    sold_to_team_id: Optional[str] = None


class Player(PlayerBase):
    id: str = Field(alias="_id")
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True


# ===================== AUCTION PLAYER SCHEMAS (Aliases for backward compatibility) =====================
# These now just reference the Player schemas since auction fields are in Player
AuctionPlayerCreate = PlayerCreate
AuctionPlayerUpdate = PlayerUpdate
AuctionPlayer = Player


# ===================== AUCTION ORDER SCHEMAS =====================
class AuctionOrderUpdate(BaseModel):
    player_id: str
    new_order: int = Field(..., ge=1)


# ===================== TEAM SCHEMAS =====================
# Constants for team purse and icon players
DEFAULT_PURSE_BALANCE = 8000
ICON_PLAYER_COST = 1500
MAX_ICON_PLAYERS = 2


class TeamBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    owner_name: str = Field(..., min_length=1, max_length=100)
    owner_contact: str = Field(..., min_length=10, max_length=15)
    owner_details: Optional[str] = None
    icon_url: Optional[str] = None
    purse_balance: int = Field(default=DEFAULT_PURSE_BALANCE)
    icon_player_ids: List[str] = Field(default_factory=list)


class TeamCreate(TeamBase):
    pass


class TeamUpdate(BaseModel):
    name: Optional[str] = None
    owner_name: Optional[str] = None
    owner_contact: Optional[str] = None
    owner_details: Optional[str] = None
    icon_url: Optional[str] = None
    purse_balance: Optional[int] = None
    icon_player_ids: Optional[List[str]] = None


class Team(TeamBase):
    id: str = Field(alias="_id")
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True


# ===================== ICON PLAYER SCHEMAS =====================
class IconPlayerAssign(BaseModel):
    player_id: str
    team_id: str


# ===================== BID SCHEMAS =====================
class BidBase(BaseModel):
    player_id: str
    team_id: str
    amount: int = Field(..., gt=0)


class BidCreate(BidBase):
    pass


class Bid(BidBase):
    id: str = Field(alias="_id")
    team_name: str
    timestamp: datetime
    created_at: datetime

    class Config:
        populate_by_name = True


# ===================== AUCTION STATUS SCHEMAS =====================
class AuctionStatusBase(BaseModel):
    player_id: str
    current_bid: int = 0
    current_bidding_team_id: Optional[str] = None
    total_bids: int = 0
    status: AuctionStatus = AuctionStatus.PENDING


class AuctionStatusCreate(AuctionStatusBase):
    pass


class AuctionStatusUpdate(BaseModel):
    current_bid: Optional[int] = None
    current_bidding_team_id: Optional[str] = None
    total_bids: Optional[int] = None
    status: Optional[AuctionStatus] = None


class AuctionStatusResponse(AuctionStatusBase):
    id: str = Field(alias="_id")
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True


# ===================== REGISTRATION SCHEMAS =====================
class RegistrationBase(BaseModel):
    player_name: str = Field(..., min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    phone: str = Field(..., min_length=10, max_length=15)
    role: PlayerRole
    place: str = Field(..., min_length=2, max_length=100)
    panchayat: str = Field(..., min_length=1, max_length=100)
    player_image_url: Optional[str] = None
    payment_screenshot_url: Optional[str] = None
    id_proof_type: Optional[IDProofType] = None
    id_proof_url: Optional[str] = None


class RegistrationCreate(RegistrationBase):
    pass


class RegistrationUpdate(BaseModel):
    status: Optional[RegistrationStatus] = None
    rejection_reason: Optional[str] = None


class Registration(RegistrationBase):
    id: str = Field(alias="_id")
    status: RegistrationStatus = RegistrationStatus.PENDING
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True


# ===================== RESPONSE SCHEMAS =====================
class MessageResponse(BaseModel):
    message: str
    success: bool = True


class ErrorResponse(BaseModel):
    detail: str
    success: bool = False


class PaginatedResponse(BaseModel):
    items: List
    total: int
    page: int
    page_size: int
    total_pages: int

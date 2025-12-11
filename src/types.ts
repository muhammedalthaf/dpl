export type PlayerRole = "bat" | "ball" | "wk" | "all-rounder";

export interface Player {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: PlayerRole;
  place: string;
  image_url: string | null;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  owner_name: string;
  owner_contact: string;
  owner_details: string | null;
  icon_url: string | null;
  created_at: string;
}

export type TeamPlayerMap = Record<string, string[]>;

export interface PaymentConfig {
  upiId: string;
  gpayNumber: string;
  qrCodeImage: string;
  note?: string;
}

export type AuctionStatus = "pending" | "live" | "sold" | "unsold";

export interface AuctionPlayer extends Player {
  // Snake case (from API)
  base_price?: number;
  auction_status?: AuctionStatus;
  sold_price?: number | null;
  sold_to_team_id?: string | null;
  is_icon_player?: boolean;
  icon_player_team_id?: string | null;
  auction_order?: number | null;
  player_id?: string;
  // Camel case (legacy/mock data)
  basePrice?: number;
  auctionStatus?: AuctionStatus;
  soldPrice?: number | null;
  soldToTeamId?: string | null;
}

export interface AuctionBid {
  id?: string;
  _id?: string;
  playerId?: string;
  player_id?: string;
  teamId?: string;
  team_id?: string;
  teamName?: string;
  team_name?: string;
  amount: number;
  timestamp: string;
}

export interface AuctionState {
  players: AuctionPlayer[];
  bids: AuctionBid[];
}


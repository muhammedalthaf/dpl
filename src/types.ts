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
  basePrice: number;
  auctionStatus: AuctionStatus;
  soldPrice?: number | null;
  soldToTeamId?: string | null;
}

export interface AuctionBid {
  id: string;
  playerId: string;
  teamId: string;
  teamName: string;
  amount: number;
  timestamp: string;
}

export interface AuctionState {
  players: AuctionPlayer[];
  bids: AuctionBid[];
}


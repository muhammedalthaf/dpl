import { AuctionPlayer, AuctionState, AuctionBid } from "@/types";
import { mockPlayers } from "@/data/mockData";

const STORAGE_KEY = "cvcl-auction-state";

const getBlankState = (): AuctionState => ({
  players: mockPlayers.map((player) => ({ ...player })),
  bids: [],
});

export const loadAuctionState = (): AuctionState => {
  if (typeof window === "undefined") {
    return getBlankState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getBlankState();
    }
    const parsed = JSON.parse(raw) as AuctionState;
    if (!parsed.players?.length) {
      return getBlankState();
    }
    return {
      players: parsed.players,
      bids: parsed.bids || [],
    };
  } catch (error) {
    console.warn("Failed to load auction state, using defaults.", error);
    return getBlankState();
  }
};

export const persistAuctionState = (state: AuctionState) => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to persist auction state", error);
  }
};

export const resetAuctionState = () => {
  const blank = getBlankState();
  persistAuctionState(blank);
  return blank;
};

export const upsertPlayer = (
  players: AuctionPlayer[],
  playerId: string,
  updater: (player: AuctionPlayer) => AuctionPlayer
): AuctionPlayer[] =>
  players.map((player) =>
    player.id === playerId ? updater(player) : player
  );

export const addBid = (
  bids: AuctionBid[],
  bid: AuctionBid
): AuctionBid[] => [bid, ...bids];

export const removeBid = (bids: AuctionBid[], bidId: string) =>
  bids.filter((bid) => bid.id !== bidId);


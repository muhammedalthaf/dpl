import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import clubLogo from "@/assets/club-logo.png";
import { auctionConfig } from "@/config/auction";
import {
  AuctionBid,
  AuctionPlayer,
} from "@/types";
import {
  ArrowLeft,
  RefreshCcw,
  Shuffle,
  Hammer,
  Trash2,
  Edit,
  Undo2,
} from "lucide-react";
import { auctionAPI, bidAPI, teamAPI } from "@/lib/api";
import { Loader2 } from "lucide-react";

// Backend server URL for resolving uploaded file paths
const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';

const fallbackId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}`);

// Resolve file URL - handles both base64 data URLs and server-relative paths
const resolveFileUrl = (url: string): string => {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `${BACKEND_URL}${url}`;
};

// Helper to format role display
const getRoleLabel = (role: string) => {
  switch (role) {
    case 'bat': return 'Batsman';
    case 'ball': return 'Bowler';
    case 'wk': return 'Wicket Keeper';
    case 'all-rounder': return 'All-Rounder';
    default: return role;
  }
};

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case 'bat': return 'bg-blue-500';
    case 'ball': return 'bg-green-500';
    case 'wk': return 'bg-purple-500';
    case 'all-rounder': return 'bg-orange-500';
    default: return 'bg-gray-500';
  }
};

const AuctionControl = () => {
  const [auctionPlayers, setAuctionPlayers] = useState<AuctionPlayer[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [bids, setBids] = useState<AuctionBid[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [bidInputs, setBidInputs] = useState<Record<string, string>>({});
  const [selectedBidTeamId, setSelectedBidTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidLoading, setBidLoading] = useState(false);
  const [manualSale, setManualSale] = useState<{ teamId: string; amount: string }>({
    teamId: "",
    amount: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [playersData, teamsData] = await Promise.all([
          auctionAPI.getAllAuctionPlayers(0, 100),
          teamAPI.getAllTeams(0, 100),
        ]);
        setAuctionPlayers(Array.isArray(playersData) ? playersData : playersData.players || []);
        setTeams(Array.isArray(teamsData) ? teamsData : teamsData.teams || []);
      } catch (error: any) {
        toast.error("Failed to load auction data");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const currentPlayer = auctionPlayers.find((player) => player._id === currentPlayerId) || null;

  // Get remaining players: pending or live status, not icon players, ordered by auction_order
  const remainingPlayers = useMemo(() => {
    return auctionPlayers
      .filter((player) =>
        (player.auction_status === "pending" || player.auction_status === "live") &&
        !player.is_icon_player
      )
      .sort((a, b) => (a.auction_order ?? 9999) - (b.auction_order ?? 9999));
  }, [auctionPlayers]);

  const bidsForCurrent = useMemo(
    () => bids.filter((bid) => (bid.player_id || bid.playerId) === currentPlayerId),
    [bids, currentPlayerId]
  );

  const leadingBid = bidsForCurrent
    .slice()
    .sort((a, b) => b.amount - a.amount)[0];

  useEffect(() => {
    if (!currentPlayer) {
      setManualSale({ teamId: "", amount: "" });
      return;
    }
    if (leadingBid) {
      const teamId = leadingBid.team_id || leadingBid.teamId;
      setManualSale({ teamId, amount: String(leadingBid.amount) });
    } else {
      setManualSale({ teamId: "", amount: "" });
    }
  }, [leadingBid, currentPlayer?._id]);

  useEffect(() => {
    if (currentPlayerId) {
      const fetchBids = async () => {
        try {
          const bidsData = await bidAPI.getBidsForPlayer(currentPlayerId, 0, 50);
          setBids(Array.isArray(bidsData) ? bidsData : bidsData.bids || []);
        } catch (error: any) {
          console.error("Failed to fetch bids", error);
        }
      };
      fetchBids();
    }
  }, [currentPlayerId]);

  // Current bid is 0 until first bid is placed, then it's the leading bid amount
  const currentBid = leadingBid?.amount ?? 0;
  // Base price for validation
  const basePrice = currentPlayer?.base_price ?? auctionConfig.basePrice;

  const handleDrawRandomPlayer = () => {
    if (remainingPlayers.length === 0) {
      toast.info("All players have been auctioned.");
      return;
    }
    // Pick the first player in auction order (already sorted)
    const nextPlayer = remainingPlayers[0];
    setCurrentPlayerId(nextPlayer._id);
    setManualSale({ teamId: "", amount: "" });
    setBidInputs({});
    toast.success(`Next player: ${nextPlayer.name} (Order #${nextPlayer.auction_order})`);
  };

  const handleBidInputChange = (teamId: string, value: string) => {
    setBidInputs((prev) => ({ ...prev, [teamId]: value }));
  };

  const handlePlaceBid = async (teamId: string, bidAmount?: number) => {
    if (!currentPlayer) {
      toast.error("Select a player before placing bids.");
      return;
    }
    // Use passed bidAmount or get from input
    const amount = bidAmount ?? Number(bidInputs[teamId]);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid bid amount.");
      return;
    }

    const playerBasePrice = currentPlayer.base_price ?? auctionConfig.basePrice;
    const hasExistingBids = bidsForCurrent.length > 0;

    // First bid: must be >= base price
    // Subsequent bids: must be > current highest bid
    if (!hasExistingBids) {
      if (amount < playerBasePrice) {
        toast.error(`First bid must be at least ₹${playerBasePrice.toLocaleString()} (base price).`);
        return;
      }
    } else {
      if (amount <= currentBid) {
        toast.error(`Bid must be above ₹${currentBid.toLocaleString()} (current highest bid).`);
        return;
      }
    }

    try {
      setBidLoading(true);
      const newBid = await bidAPI.createBid({
        player_id: currentPlayer._id,
        team_id: teamId,
        amount,
      });

      setBids([...bids, newBid]);

      if (currentPlayer.auction_status === "pending") {
        const updatedPlayer = await auctionAPI.updateAuctionStatus(currentPlayer._id, "live");
        setAuctionPlayers(auctionPlayers.map(p => p._id === currentPlayer._id ? updatedPlayer : p));
      }

      setBidInputs((prev) => ({ ...prev, [teamId]: "" }));
      toast.success("Bid placed successfully!");
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to place bid");
    } finally {
      setBidLoading(false);
    }
  };

  const handleRemoveBid = async (bidId: string) => {
    try {
      await bidAPI.deleteBid(bidId);
      setBids(bids.filter(b => (b._id || b.id) !== bidId));
      toast.success("Bid removed");
    } catch (error: any) {
      toast.error("Failed to remove bid");
    }
  };

  const handleEditBid = async (bid: AuctionBid) => {
    const nextAmount = window.prompt("Update bid amount", String(bid.amount));
    if (!nextAmount) return;
    const parsed = Number(nextAmount);
    if (!parsed || parsed <= 0) {
      toast.error("Invalid bid amount");
      return;
    }

    const bidId = bid._id || bid.id;
    const playerId = bid.player_id || bid.playerId;
    const teamId = bid.team_id || bid.teamId;

    try {
      await bidAPI.deleteBid(bidId!);
      const newBid = await bidAPI.createBid({
        player_id: playerId!,
        team_id: teamId!,
        amount: parsed,
      });
      const updatedBids = bids.filter(b => (b._id || b.id) !== bidId);
      setBids([...updatedBids, newBid]);
      toast.success("Bid updated");
    } catch (error: any) {
      toast.error("Failed to update bid");
    }
  };

  const handleManualSaleChange = (field: "teamId" | "amount", value: string) => {
    setManualSale((prev) => ({ ...prev, [field]: value }));
  };

  const handleQuickBid = (teamId: string, increment: number) => {
    // If no bids yet, start from base price; otherwise add to current bid
    const startingAmount = currentBid > 0 ? currentBid : basePrice;
    const newAmount = startingAmount + increment;
    setBidInputs((prev) => ({ ...prev, [teamId]: String(newAmount) }));
  };

  const resolveSaleDetails = () => {
    const teamId = manualSale.teamId || leadingBid?.team_id || leadingBid?.teamId || null;
    const amount =
      manualSale.amount !== ""
        ? Number(manualSale.amount)
        : leadingBid?.amount ?? null;

    return {
      teamId,
      amount,
    };
  };

  const finalizeSale = async (status: "sold" | "unsold") => {
    if (!currentPlayer) {
      toast.error("Select a player first.");
      return;
    }

    try {
      setBidLoading(true);
      if (status === "unsold") {
        await auctionAPI.markPlayerUnsold(currentPlayer._id);
        setAuctionPlayers(auctionPlayers.map(p =>
          p._id === currentPlayer._id
            ? { ...p, auction_status: "unsold" }
            : p
        ));
        toast.success(`${currentPlayer.name} marked as unsold.`);
        return;
      }

      const { teamId, amount } = resolveSaleDetails();
      if (!teamId || !amount || amount <= 0) {
        toast.error("Provide a valid winning team and amount.");
        return;
      }

      await auctionAPI.finalizePlayerSale(currentPlayer._id, teamId, amount);
      setAuctionPlayers(auctionPlayers.map(p =>
        p._id === currentPlayer._id
          ? { ...p, auction_status: "sold", sold_to_team_id: teamId, sold_price: amount }
          : p
      ));

      // Update the team's purse balance in local state
      setTeams(teams.map(t =>
        t._id === teamId
          ? { ...t, purse_balance: (t.purse_balance ?? 8000) - amount }
          : t
      ));

      toast.success(`${currentPlayer.name} sold!`);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to finalize sale");
    } finally {
      setBidLoading(false);
    }
  };

  const reopenPlayer = async () => {
    if (!currentPlayer) return;
    try {
      setBidLoading(true);
      await auctionAPI.updateAuctionStatus(currentPlayer._id, "pending");
      setAuctionPlayers(auctionPlayers.map(p =>
        p._id === currentPlayer._id
          ? { ...p, auction_status: "pending" }
          : p
      ));
      toast.info(`${currentPlayer.name} moved back to pool.`);
    } catch (error: any) {
      toast.error("Failed to reopen player");
    } finally {
      setBidLoading(false);
    }
  };

  const clearCurrentSelection = () => {
    setCurrentPlayerId(null);
    setManualSale({ teamId: "", amount: "" });
    setSelectedBidTeamId(null);
    setBidInputs({});
  };

  return (
    <div className="page-container bg-gradient-primary">
      <div className="content-container space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/admin"
            className="inline-flex items-center text-primary-foreground hover:text-primary-foreground/80 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin
          </Link>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  setLoading(true);
                  const [playersData, teamsData] = await Promise.all([
                    auctionAPI.getAllAuctionPlayers(0, 100),
                    teamAPI.getAllTeams(0, 100),
                  ]);
                  setAuctionPlayers(Array.isArray(playersData) ? playersData : playersData.players || []);
                  setTeams(Array.isArray(teamsData) ? teamsData : teamsData.teams || []);
                  toast.success("Data reloaded");
                } catch (error) {
                  toast.error("Failed to reload");
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              <RefreshCcw className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Reload</span>
            </Button>
            <Button asChild size="sm">
              <a href="/auction-summary" target="_blank" rel="noopener noreferrer">
                <span className="hidden sm:inline">View Summary</span>
                <span className="sm:hidden">Summary</span>
              </a>
            </Button>
          </div>
        </div>

        <div className="text-center text-primary-foreground space-y-2">
          <p className="uppercase tracking-wide text-xs sm:text-sm text-primary-foreground/70">Live Room</p>
          <h1 className="text-2xl sm:text-4xl font-bold flex items-center justify-center gap-2 sm:gap-3">
            <Hammer className="h-8 w-8" />
            Auction Control
          </h1>
          <p className="text-primary-foreground/80">
            Draw players, accept bids, and finalize results – live auction management.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary-foreground" />
              <p className="text-primary-foreground">Loading auction data...</p>
            </div>
          </div>
        ) : (
          <>
          <div className="grid lg:grid-cols-3 gap-5">
          <Card className="lg:col-span-2 shadow-card">
            <CardHeader>
              <CardTitle>Player Queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={handleDrawRandomPlayer}>
                  <Shuffle className="h-4 w-4 mr-2" />
                  Draw Next Player ({remainingPlayers.length} left)
                </Button>
                <Button variant="ghost" size="sm" onClick={clearCurrentSelection}>
                  <Undo2 className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>

              {currentPlayer ? (
                <Card className="bg-card/80 overflow-hidden">
                  {/* Banner Image Section */}
                  <div className="relative">
                    {/* Large Player Image as Banner */}
                    <div className="w-full h-64 sm:h-80 md:h-96 bg-gradient-to-b from-primary/20 to-primary/5 relative overflow-hidden">
                      <img
                        src={resolveFileUrl(currentPlayer.image_url || "")}
                        alt={currentPlayer.name}
                        className="w-full h-full object-contain object-center"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      {/* Fallback when no image */}
                      {!currentPlayer.image_url && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-8xl font-bold text-primary/20">
                            {currentPlayer.name.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Overlay with player name and role */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 sm:p-6">
                      <div className="flex items-end justify-between">
                        <div>
                          <h2 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg">
                            {currentPlayer.name}
                          </h2>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={`${getRoleBadgeColor(currentPlayer.role)} text-white text-sm px-3 py-1`}>
                              {getRoleLabel(currentPlayer.role)}
                            </Badge>
                            <span className="text-white/80 text-lg">{currentPlayer.place}</span>
                          </div>
                        </div>
                        <Badge
                          variant={
                            currentPlayer.auction_status === "sold"
                              ? "default"
                              : currentPlayer.auction_status === "live"
                              ? "secondary"
                              : currentPlayer.auction_status === "unsold"
                              ? "destructive"
                              : "outline"
                          }
                          className="text-sm px-3 py-1"
                        >
                          {currentPlayer.auction_status?.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <CardContent className="pt-4 space-y-4">
                    {/* Bid Stats Row */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-primary/10 p-4 rounded-lg text-center">
                        <p className="text-muted-foreground text-xs uppercase tracking-wider">Base Price</p>
                        <p className="text-2xl font-bold text-primary">₹{(currentPlayer.base_price ?? auctionConfig.basePrice).toLocaleString()}</p>
                      </div>
                      <div className="bg-green-500/10 p-4 rounded-lg text-center">
                        <p className="text-muted-foreground text-xs uppercase tracking-wider">Current Bid</p>
                        <p className="text-2xl font-bold text-green-600">₹{currentBid.toLocaleString()}</p>
                      </div>
                      <div className="bg-blue-500/10 p-4 rounded-lg text-center">
                        <p className="text-muted-foreground text-xs uppercase tracking-wider">Total Bids</p>
                        <p className="text-2xl font-bold text-blue-600">{bidsForCurrent.length}</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Manual Winning Entry</p>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>Team</Label>
                          <select
                            className="w-full border rounded-md px-3 py-2 bg-background"
                            value={manualSale.teamId}
                            onChange={(event) => handleManualSaleChange("teamId", event.target.value)}
                          >
                            <option value="">Select team</option>
                            {teams.map((team) => (
                              <option key={team._id} value={team._id}>
                                {team.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label>Winning Amount</Label>
                          <Input
                            type="number"
                            min={currentBid > 0 ? currentBid : basePrice}
                            value={manualSale.amount}
                            onChange={(event) => handleManualSaleChange("amount", event.target.value)}
                            placeholder="₹"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Leave blank to auto-pick highest bid.
                      </p>
                      {leadingBid && (
                        <p className="text-xs text-muted-foreground">
                          Last bid:{" "}
                          {teams.find((team) => team._id === (leadingBid.team_id || leadingBid.teamId))?.name ?? leadingBid.team_name ?? leadingBid.teamName}{" "}
                          at ₹{leadingBid.amount.toLocaleString()}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3 flex-wrap">
                      <Button onClick={() => finalizeSale("sold")}>Sold</Button>
                      <Button variant="secondary" onClick={() => finalizeSale("unsold")}>
                        Unsold
                      </Button>
                      <Button variant="ghost" onClick={reopenPlayer}>
                        Re-open Player
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <p className="text-muted-foreground">Draw or select a player to begin bidding.</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Place Bid</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Select Team</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {teams.map((team) => {
                    const purseBalance = team.purse_balance ?? 8000;
                    // For first bid, check against base price; for counter bids, check against next minimum bid
                    const minBidRequired = bidsForCurrent.length === 0 ? basePrice : currentBid + 1;
                    const hasEnoughBalance = purseBalance >= minBidRequired;

                    return (
                      <button
                        key={team._id}
                        onClick={() => hasEnoughBalance && setSelectedBidTeamId(team._id)}
                        disabled={!hasEnoughBalance}
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                          !hasEnoughBalance
                            ? "border-destructive/50 bg-destructive/10 opacity-60 cursor-not-allowed"
                            : selectedBidTeamId === team._id
                              ? "border-primary bg-primary/10"
                              : "border-muted bg-background hover:border-primary/50"
                        }`}
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={team.icon_url ? resolveFileUrl(team.icon_url) : clubLogo} alt={team.name} style={{ objectFit: "cover" }}/>
                          <AvatarFallback>{team.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="text-center">
                          <p className="text-sm font-semibold leading-tight">{team.name}</p>
                          <p className={`text-xs font-medium ${hasEnoughBalance ? "text-green-600" : "text-destructive"}`}>
                            ₹{purseBalance.toLocaleString()}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* First bid: Just show Place Bid button at base price */}
              {bidsForCurrent.length === 0 ? (
                <div className="space-y-3">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">First bid will be placed at</p>
                    <p className="text-2xl font-bold text-primary">₹{basePrice.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">(Base Price)</p>
                  </div>
                  <Button
                    onClick={() => {
                      if (selectedBidTeamId) {
                        // Pass base price directly to handlePlaceBid
                        handlePlaceBid(selectedBidTeamId, basePrice);
                      }
                    }}
                    disabled={!selectedBidTeamId || bidLoading}
                    className="w-full text-lg py-6"
                    size="lg"
                  >
                    {bidLoading ? "Placing..." : `Place Bid @ ₹${basePrice.toLocaleString()}`}
                  </Button>
                </div>
              ) : (
                /* Counter bids: Show amount input and quick bid buttons */
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="bid-amount" className="text-base font-semibold">
                      Counter Bid Amount
                    </Label>
                    <div className="space-y-2">
                      <Input
                        id="bid-amount"
                        type="number"
                        placeholder={`Enter amount > ₹${currentBid.toLocaleString()}`}
                        className="text-lg"
                        value={selectedBidTeamId ? bidInputs[selectedBidTeamId] ?? "" : ""}
                        onChange={(event) => {
                          if (selectedBidTeamId) {
                            handleBidInputChange(selectedBidTeamId, event.target.value);
                          }
                        }}
                        disabled={!selectedBidTeamId}
                      />
                      <div className="flex flex-wrap gap-2">
                        {auctionConfig.quickBidSteps.map((step) => (
                          <Button
                            key={`quick-${step}`}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (selectedBidTeamId) {
                                handleQuickBid(selectedBidTeamId, step);
                              }
                            }}
                            disabled={!selectedBidTeamId}
                          >
                            +₹{step}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      if (selectedBidTeamId) {
                        handlePlaceBid(selectedBidTeamId);
                      }
                    }}
                    disabled={!selectedBidTeamId || !bidInputs[selectedBidTeamId] || bidLoading}
                    className="w-full"
                  >
                    {bidLoading ? "Placing..." : "Place Counter Bid"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Current Bids</CardTitle>
          </CardHeader>
          <CardContent>
            {currentPlayer ? (
              bidsForCurrent.length > 0 ? (
                <div className="space-y-3">
                  {bidsForCurrent.map((bid) => {
                    const bidId = bid._id || bid.id || "";
                    const bidTeamId = bid.team_id || bid.teamId || "";
                    const bidTeamName = bid.team_name || bid.teamName || "Unknown";
                    return (
                      <div
                        key={bidId}
                        className="flex items-center justify-between rounded-md border bg-background/70 px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage
                              src={teams.find((team) => team._id === bidTeamId)?.icon_url || clubLogo}
                              alt={bidTeamName}
                              style={{ objectFit: "cover" }}
                            />
                            <AvatarFallback>{bidTeamName.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{bidTeamName}</p>
                            <p className="text-sm text-muted-foreground">
                              ₹{bid.amount.toLocaleString()} · {new Date(bid.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditBid(bid)}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveBid(bidId)}>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">No bids yet for {currentPlayer.name}.</p>
              )
            ) : (
              <p className="text-muted-foreground">Select a player to view live bids.</p>
            )}
          </CardContent>
        </Card>
        </>
        )}
      </div>
    </div>
  );
};

export default AuctionControl;


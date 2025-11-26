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

const fallbackId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}`);

const AuctionControl = () => {
  const [auctionPlayers, setAuctionPlayers] = useState<AuctionPlayer[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [bids, setBids] = useState<AuctionBid[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [bidInputs, setBidInputs] = useState<Record<string, string>>({});
  const [selectedBidTeamId, setSelectedBidTeamId] = useState<string | null>(null);
  const [playerSearchInput, setPlayerSearchInput] = useState("");
  const [showPlayerDropdown, setShowPlayerDropdown] = useState(false);
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#playerSearch") && !target.closest("[role='option']")) {
        setShowPlayerDropdown(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const currentPlayer = auctionPlayers.find((player) => player._id === currentPlayerId) || null;

  const remainingPlayers = auctionPlayers.filter((player) => player.auction_status === "pending");

  const filteredPlayers = useMemo(() => {
    return auctionPlayers
      .filter((player) => player.auction_status !== "sold")
      .filter((player) =>
        player.name.toLowerCase().includes(playerSearchInput.toLowerCase())
      );
  }, [auctionPlayers, playerSearchInput]);

  const bidsForCurrent = useMemo(
    () => bids.filter((bid) => bid.playerId === currentPlayerId),
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
      setManualSale({ teamId: leadingBid.teamId, amount: String(leadingBid.amount) });
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

  const currentBidFloor = currentPlayer
    ? leadingBid?.amount ?? currentPlayer.base_price ?? auctionConfig.basePrice
    : auctionConfig.basePrice;

  const handleDrawRandomPlayer = () => {
    if (remainingPlayers.length === 0) {
      toast.info("All players have been auctioned.");
      return;
    }
    const randomIndex = Math.floor(Math.random() * remainingPlayers.length);
    const randomPlayer = remainingPlayers[randomIndex];
    setCurrentPlayerId(randomPlayer._id);
    setManualSale({ teamId: "", amount: "" });
    setBidInputs({});
    toast.success(`Next player: ${randomPlayer.name}`);
  };

  const handleBidInputChange = (teamId: string, value: string) => {
    setBidInputs((prev) => ({ ...prev, [teamId]: value }));
  };

  const handlePlaceBid = async (teamId: string) => {
    if (!currentPlayer) {
      toast.error("Select a player before placing bids.");
      return;
    }
    const amountValue = bidInputs[teamId];
    const amount = Number(amountValue);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid bid amount.");
      return;
    }
    if (amount <= currentBidFloor) {
      toast.error("Bid must be above the current bid.");
      return;
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
      setBids(bids.filter(b => b.id !== bidId));
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

    try {
      await bidAPI.deleteBid(bid.id);
      const newBid = await bidAPI.createBid({
        player_id: bid.playerId,
        team_id: bid.teamId,
        amount: parsed,
      });
      const updatedBids = bids.filter(b => b.id !== bid.id);
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
    const newAmount = currentBidFloor + increment;
    setBidInputs((prev) => ({ ...prev, [teamId]: String(newAmount) }));
  };

  const resolveSaleDetails = () => {
    const teamId = manualSale.teamId || leadingBid?.teamId || null;
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
    <div className="min-h-screen bg-gradient-primary py-10 px-4">
      <div className="container mx-auto space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/admin"
            className="inline-flex items-center text-primary-foreground hover:text-primary-foreground/80 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin
          </Link>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <Button
              variant="outline"
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
              className="w-full sm:w-auto"
              disabled={loading}
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Reload
            </Button>
            <Button asChild className="w-full sm:w-auto">
              <Link to="/admin/auction/summary">View Summary</Link>
            </Button>
          </div>
        </div>

        <div className="text-center text-primary-foreground space-y-2">
          <p className="uppercase tracking-wide text-sm text-primary-foreground/70">Live Room</p>
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
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
                  Draw Random Player ({remainingPlayers.length} left)
                </Button>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <Label htmlFor="playerSearch" className="text-sm mb-1 block">
                      Or search & select
                    </Label>
                    <div className="relative">
                      <Input
                        id="playerSearch"
                        type="text"
                        placeholder="Search player by name..."
                        value={playerSearchInput}
                        onChange={(event) => {
                          setPlayerSearchInput(event.target.value);
                          setShowPlayerDropdown(true);
                        }}
                        onFocus={() => setShowPlayerDropdown(true)}
                        className="text-sm"
                      />
                      {showPlayerDropdown && filteredPlayers.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                          {filteredPlayers.map((player) => (
                            <button
                              key={player.id}
                              role="option"
                              onClick={() => {
                                setCurrentPlayerId(player.id);
                                setPlayerSearchInput("");
                                setShowPlayerDropdown(false);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-accent flex items-center justify-between border-b last:border-b-0"
                            >
                              <div>
                                <p className="text-sm font-medium">{player.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {player.role} • {player.place}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  player.auctionStatus === "sold"
                                    ? "default"
                                    : player.auctionStatus === "live"
                                    ? "secondary"
                                    : player.auctionStatus === "unsold"
                                    ? "destructive"
                                    : "outline"
                                }
                                className="text-xs"
                              >
                                {player.auctionStatus}
                              </Badge>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={clearCurrentSelection}>
                    <Undo2 className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>

              {currentPlayer ? (
                <Card className="bg-card/80">
                  <CardHeader>
                    <CardTitle className="text-2xl">{currentPlayer.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-4 flex-wrap text-sm text-muted-foreground">
                      <span>Role: {currentPlayer.role}</span>
                      <span>Place: {currentPlayer.place}</span>
                      <span>
                        Base Price: ₹
                        {(currentPlayer.basePrice ?? auctionConfig.basePrice).toLocaleString()}
                      </span>
                      <span>Current Bid: ₹{currentBidFloor.toLocaleString()}</span>
                      <span>
                        Status:{" "}
                        <Badge
                          variant={
                            currentPlayer.auctionStatus === "sold"
                              ? "default"
                              : currentPlayer.auctionStatus === "live"
                              ? "secondary"
                              : currentPlayer.auctionStatus === "unsold"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {currentPlayer.auctionStatus}
                        </Badge>
                      </span>
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
                            {mockTeams.map((team) => (
                              <option key={team.id} value={team.id}>
                                {team.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label>Winning Amount</Label>
                          <Input
                            type="number"
                            min={currentBidFloor}
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
                          {mockTeams.find((team) => team.id === leadingBid.teamId)?.name ?? leadingBid.teamName}{" "}
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
                  {teams.map((team) => (
                    <button
                      key={team._id}
                      onClick={() => setSelectedBidTeamId(team._id)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                        selectedBidTeamId === team._id
                          ? "border-primary bg-primary/10"
                          : "border-muted bg-background hover:border-primary/50"
                      }`}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={team.icon_url || clubLogo} alt={team.name} style={{    objectFit: "cover"}}/>
                        <AvatarFallback>{team.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="text-center">
                        <p className="text-sm font-semibold leading-tight">{team.name}</p>
                        <p className="text-xs text-muted-foreground">{team.owner_name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="bid-amount" className="text-base font-semibold">
                  Bid Amount
                </Label>
                <div className="space-y-2">
                  <Input
                    id="bid-amount"
                    type="number"
                    placeholder="Enter bid amount"
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
                disabled={!selectedBidTeamId || !bidInputs[selectedBidTeamId]}
                className="w-full"
              >
                Place Bid
              </Button>
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
                  {bidsForCurrent.map((bid) => (
                    <div
                      key={bid.id}
                      className="flex items-center justify-between rounded-md border bg-background/70 px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={teams.find((team) => team._id === bid.teamId)?.icon_url || clubLogo}
                            alt={bid.teamName}
                            style={{ objectFit: "cover" }}
                          />
                          <AvatarFallback>{bid.teamName.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{bid.teamName}</p>
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
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveBid(bid.id)}>
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
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


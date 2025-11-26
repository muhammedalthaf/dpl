import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, BarChart3, RefreshCcw, Users, Loader2 } from "lucide-react";
import { AuctionPlayer } from "@/types";
import { auctionAPI, teamAPI } from "@/lib/api";
import { toast } from "sonner";
import clubLogo from "@/assets/club-logo.png";

type StatusFilter = "pending" | "live" | "sold" | "unsold";

const statusLabels: Record<StatusFilter, string> = {
  pending: "Remaining Players",
  live: "In Auction",
  sold: "Sold Players",
  unsold: "Unsold Players",
};

const AuctionSummary = () => {
  const [auctionPlayers, setAuctionPlayers] = useState<AuctionPlayer[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; status: StatusFilter }>({
    open: false,
    status: "pending",
  });
  const [teamDialog, setTeamDialog] = useState<{ open: boolean; teamId: string | null }>({
    open: false,
    teamId: null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [playersData, teamsData] = await Promise.all([
          auctionAPI.getAllAuctionPlayers(0, 200),
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

  const refreshState = async () => {
    try {
      const [playersData, teamsData] = await Promise.all([
        auctionAPI.getAllAuctionPlayers(0, 200),
        teamAPI.getAllTeams(0, 100),
      ]);
      setAuctionPlayers(Array.isArray(playersData) ? playersData : playersData.players || []);
      setTeams(Array.isArray(teamsData) ? teamsData : teamsData.teams || []);
      toast.success("Auction data refreshed");
    } catch (error) {
      toast.error("Failed to refresh");
    }
  };

  const groupedByStatus = useMemo(() => {
    return auctionPlayers.reduce<Record<StatusFilter, AuctionPlayer[]>>(
      (acc, player) => {
        const status = (player.auction_status as StatusFilter) || "pending";
        if (!acc[status]) acc[status] = [];
        acc[status].push(player);
        return acc;
      },
      {
        pending: [],
        live: [],
        sold: [],
        unsold: [],
      }
    );
  }, [auctionPlayers]);

  const totalPlayers = auctionPlayers.length;
  const remainingPlayers = groupedByStatus.pending.length;
  const livePlayers = groupedByStatus.live.length;
  const soldPlayers = groupedByStatus.sold.length;

  const teamSummaries = teams.map((team) => {
    const players = auctionPlayers.filter((player) => player.sold_to_team_id === team._id);
    const totalBid = players.reduce((sum, player) => sum + (player.sold_price || 0), 0);
    return {
      team,
      count: players.length,
      totalBid,
      players,
    };
  });

  const renderPlayerList = (players: AuctionPlayer[]) => (
    <ScrollArea className="h-64">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Player</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Base Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sold Price</TableHead>
            <TableHead>Team</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No players in this list
              </TableCell>
            </TableRow>
          ) : (
            players.map((player) => (
              <TableRow key={player._id}>
                <TableCell className="font-medium">{player.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{player.role}</Badge>
                </TableCell>
                <TableCell>₹{player.base_price.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      player.auction_status === "sold"
                        ? "default"
                        : player.auction_status === "live"
                        ? "secondary"
                        : player.auction_status === "unsold"
                        ? "destructive"
                        : "outline"
                    }
                  >
                    {player.auction_status}
                  </Badge>
                </TableCell>
                <TableCell>{player.sold_price ? `₹${player.sold_price.toLocaleString()}` : "-"}</TableCell>
                <TableCell>
                  {player.sold_to_team_id ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={
                            teams.find((team) => team._id === player.sold_to_team_id)?.icon_url || clubLogo
                          }
                          alt="Team logo"
                          style={{ objectFit: "cover" }}
                        />
                        <AvatarFallback>TM</AvatarFallback>
                      </Avatar>
                      <span>
                        {teams.find((team) => team._id === player.sold_to_team_id)?.name ?? "-"}
                      </span>
                    </div>
                  ) : (
                    "-"
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </ScrollArea>
  );

  const selectedStatusPlayers = groupedByStatus[statusDialog.status] || [];

  const selectedTeamPlayers =
    teamDialog.teamId === null
      ? []
      : auctionState.players.filter((player) => player.soldToTeamId === teamDialog.teamId);

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
            <Button variant="outline" onClick={refreshState} className="w-full sm:w-auto" disabled={loading}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button asChild className="w-full sm:w-auto">
              <Link to="/admin/auction/control">Go to Auction Room</Link>
            </Button>
          </div>
        </div>

        <div className="text-center text-primary-foreground space-y-2">
          <p className="uppercase tracking-wide text-sm text-primary-foreground/70">Live Overview</p>
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <BarChart3 className="h-8 w-8" />
            Auction Summary
          </h1>
          <p className="text-primary-foreground/80">
            Track player availability, bids, and team purse utilization in real-time.
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
        <div>
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="shadow-card bg-card/80">
            <CardHeader>
              <CardTitle>Total Players</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{totalPlayers}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {soldPlayers} sold · {remainingPlayers} remaining
              </p>
            </CardContent>
          </Card>

          {(["pending", "live", "sold"] as StatusFilter[]).map((status) => (
            <Card
              key={status}
              className="shadow-card bg-card/90 cursor-pointer hover:shadow-hover transition"
              onClick={() => setStatusDialog({ open: true, status })}
            >
              <CardHeader>
                <CardTitle>{statusLabels[status]}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">{groupedByStatus[status]?.length ?? 0}</p>
                <p className="text-sm text-muted-foreground mt-2">Tap to view list</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Team-wise Auction Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {teamSummaries.map(({ team, count, totalBid }) => (
                <Card key={team._id} className="bg-card/80 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={team.icon_url || clubLogo} alt={team.name} style={{ objectFit: "cover" }}/>
                        <AvatarFallback>{team.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {team.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Players won</p>
                      <button
                        className="text-3xl font-bold text-left hover:text-primary transition"
                        onClick={() => setTeamDialog({ open: true, teamId: team.id })}
                      >
                        {count}
                      </button>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Spent</p>
                      <p className="text-2xl font-semibold">
                        ₹{totalBid.toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
        </div>
        )}
      </div>

      <Dialog open={statusDialog.open} onOpenChange={(open) => setStatusDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{statusLabels[statusDialog.status]}</DialogTitle>
            <DialogDescription>
              Showing {groupedByStatus[statusDialog.status]?.length ?? 0} player(s) marked as{" "}
              {statusDialog.status}.
            </DialogDescription>
          </DialogHeader>
          {renderPlayerList(selectedStatusPlayers)}
        </DialogContent>
      </Dialog>

      <Dialog open={teamDialog.open} onOpenChange={(open) => setTeamDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {teamDialog.teamId
                ? teams.find((team) => team._id === teamDialog.teamId)?.name ?? "Team"
                : "Team"}
            </DialogTitle>
            <DialogDescription>
              {selectedTeamPlayers.length} player(s) purchased in this auction.
            </DialogDescription>
          </DialogHeader>
          {renderPlayerList(selectedTeamPlayers)}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuctionSummary;


import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { BarChart3, Users, Loader2, TrendingUp, Clock, Gavel } from "lucide-react";
import { auctionAPI } from "@/lib/api";
import clubLogo from "@/assets/club-logo.png";

// Helper to resolve file URL
const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';
const resolveFileUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("http")) return url;
  return `${BACKEND_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

interface AuctionStats {
  total_players: number;
  pending: number;
  live: number;
  sold: number;
  unsold: number;
  total_auction_value: number;
  average_player_value: number;
}

interface LivePlayer {
  _id: string;
  name: string;
  role: string;
  image_url?: string;
  base_price: number;
  auction_status: string;
  highest_bid?: {
    amount: number;
    team_name: string;
    team_id: string;
  } | null;
}

interface RecentActivity {
  _id: string;
  player_id: string;
  player_name: string;
  player_status: string;
  player_image?: string;
  team_name: string;
  amount: number;
  timestamp: string;
}

interface TeamProgress {
  _id: string;
  name: string;
  icon_url?: string;
  owner_name: string;
  purse_balance: number;
  total_spent: number;
  players_count: number;
  players: any[];
}

interface SummaryData {
  stats: AuctionStats;
  live_players: LivePlayer[];
  recent_activity: RecentActivity[];
  team_progress: TeamProgress[];
}

const AUTO_REFRESH_INTERVAL = 10000; // 10 seconds

const AuctionSummary = () => {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamDialog, setTeamDialog] = useState<{ open: boolean; team: TeamProgress | null }>({
    open: false,
    team: null,
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const data = await auctionAPI.getAuctionSummary();
      setSummaryData(data);
      setLastUpdated(new Date());
    } catch (error: any) {
      console.error("Failed to load auction data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Set up auto-refresh
    intervalRef.current = setInterval(() => {
      fetchData(false); // Don't show loading spinner on auto-refresh
    }, AUTO_REFRESH_INTERVAL);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const stats = summaryData?.stats;
  const livePlayers = summaryData?.live_players || [];
  const recentActivity = summaryData?.recent_activity || [];
  const teamProgress = summaryData?.team_progress || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sold":
        return <Badge className="bg-green-500">SOLD</Badge>;
      case "live":
        return <Badge className="bg-yellow-500">LIVE</Badge>;
      case "unsold":
        return <Badge variant="destructive">UNSOLD</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="page-container bg-gradient-primary">
      <div className="content-container space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="text-center text-primary-foreground space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-2 sm:gap-3">
            <BarChart3 className="h-6 w-6 sm:h-7 sm:w-7" />
            Auction Summary
          </h1>
          {lastUpdated && (
            <p className="text-xs text-primary-foreground/60">
              Auto-refreshes every 10s · Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-6 w-6 mx-auto mb-1 opacity-80" />
                  <p className="text-2xl font-bold">₹{(stats?.total_auction_value || 0).toLocaleString()}</p>
                  <p className="text-xs opacity-80">Total Value</p>
                </CardContent>
              </Card>
              <Card className="bg-card/90">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold">{stats?.total_players || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Players</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 dark:bg-blue-950/30">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">{stats?.pending || 0}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </CardContent>
              </Card>
              <Card className="bg-yellow-50 dark:bg-yellow-950/30">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-yellow-600">{stats?.live || 0}</p>
                  <p className="text-xs text-muted-foreground">Live</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50 dark:bg-green-950/30">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">{stats?.sold || 0}</p>
                  <p className="text-xs text-muted-foreground">Sold</p>
                </CardContent>
              </Card>
              <Card className="bg-red-50 dark:bg-red-950/30">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-red-600">{stats?.unsold || 0}</p>
                  <p className="text-xs text-muted-foreground">Unsold</p>
                </CardContent>
              </Card>
            </div>

            {/* Live Players & Recent Activity Row */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Live Players */}
              <Card className="shadow-card overflow-hidden">
                <CardHeader className="pb-3 px-3 sm:px-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Gavel className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0" />
                    Live Auction ({livePlayers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  {livePlayers.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8 text-sm">No players currently in auction</p>
                  ) : (
                    <div className="space-y-3">
                      {livePlayers.map((player) => (
                        <div key={player._id} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
                          <Avatar className="h-10 w-10 sm:h-14 sm:w-14 border-2 border-yellow-400 flex-shrink-0">
                            <AvatarImage src={resolveFileUrl(player.image_url || "")} alt={player.name} />
                            <AvatarFallback>{player.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate text-sm sm:text-base">{player.name}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">{player.role} · Base: ₹{player.base_price}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {player.highest_bid ? (
                              <>
                                <p className="text-base sm:text-xl font-bold text-green-600">₹{player.highest_bid.amount.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-[80px]">{player.highest_bid.team_name}</p>
                              </>
                            ) : (
                              <p className="text-xs sm:text-sm text-muted-foreground">No bids</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="shadow-card overflow-hidden">
                <CardHeader className="pb-3 px-3 sm:px-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
                    Recent Bids
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  {recentActivity.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8 text-sm">No recent activity</p>
                  ) : (
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2">
                        {recentActivity.map((activity) => (
                          <div key={activity._id} className="flex items-center gap-2 sm:gap-3 p-2 rounded-lg hover:bg-muted/50">
                            <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                              <AvatarImage src={resolveFileUrl(activity.player_image || "")} alt={activity.player_name} />
                              <AvatarFallback>{activity.player_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                                <p className="font-medium truncate text-sm">{activity.player_name}</p>
                                {getStatusBadge(activity.player_status)}
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                {activity.team_name} · <span className="font-semibold text-foreground">₹{activity.amount.toLocaleString()}</span>
                              </p>
                            </div>
                            <p className="text-[10px] sm:text-xs text-muted-foreground flex-shrink-0">
                              {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Team Progress */}
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Team Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                {teamProgress.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No teams found</p>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {teamProgress.map((team) => (
                      <Card
                        key={team._id}
                        className="bg-card/80 cursor-pointer hover:shadow-md transition"
                        onClick={() => setTeamDialog({ open: true, team })}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={resolveFileUrl(team.icon_url || "")} alt={team.name} style={{ objectFit: "cover" }} />
                              <AvatarFallback>{team.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{team.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{team.owner_name}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-blue-50 dark:bg-blue-950/30 rounded p-2">
                              <p className="text-lg font-bold text-blue-600">{team.players_count}</p>
                              <p className="text-[10px] text-muted-foreground">Players</p>
                            </div>
                            <div className="bg-red-50 dark:bg-red-950/30 rounded p-2">
                              <p className="text-sm font-bold text-red-600">₹{(team.total_spent / 1000).toFixed(1)}k</p>
                              <p className="text-[10px] text-muted-foreground">Spent</p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-950/30 rounded p-2">
                              <p className="text-sm font-bold text-green-600">₹{(team.purse_balance / 1000).toFixed(1)}k</p>
                              <p className="text-[10px] text-muted-foreground">Left</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Team Dialog */}
      <Dialog open={teamDialog.open} onOpenChange={(open) => setTeamDialog({ open, team: open ? teamDialog.team : null })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={resolveFileUrl(teamDialog.team?.icon_url || "")} alt={teamDialog.team?.name} />
                <AvatarFallback>{teamDialog.team?.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              {teamDialog.team?.name}
            </DialogTitle>
            <DialogDescription>
              {teamDialog.team?.players_count} player(s)
              {teamDialog.team?.icon_players_count ? ` (${teamDialog.team.icon_players_count} icon)` : ""}
              · Spent: ₹{teamDialog.team?.total_spent.toLocaleString()}
              · Balance: ₹{teamDialog.team?.purse_balance.toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            {teamDialog.team?.players && teamDialog.team.players.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamDialog.team.players.map((player: any) => (
                    <TableRow key={player._id} className={player.is_icon_player ? "bg-purple-50 dark:bg-purple-950/20" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={resolveFileUrl(player.image_url || "")} alt={player.name} />
                            <AvatarFallback>{player.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{player.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{player.role}</Badge>
                      </TableCell>
                      <TableCell>
                        {player.is_icon_player ? (
                          <Badge className="bg-purple-500 hover:bg-purple-600">
                            ⭐ ICON
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Auction</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        {player.is_icon_player ? "-" : `₹${(player.sold_price || 0).toLocaleString()}`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">No players purchased yet</p>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuctionSummary;


import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Loader, Star, Users, Wallet, X } from "lucide-react";
import clubLogo from "@/assets/club-logo.png";
import { auctionAPI, teamAPI, iconPlayerAPI } from "@/lib/api";
import { toast } from "sonner";

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';
const ICON_PLAYER_COST = 1500;
const DEFAULT_PURSE_BALANCE = 8000;
const MAX_ICON_PLAYERS = 2;

interface AuctionPlayer {
  _id: string;
  name: string;
  phone: string;
  role: string;
  place: string;
  base_price: number;
  auction_status: string;
  is_icon_player: boolean;
  icon_player_team_id?: string;
}

interface Team {
  _id: string;
  name: string;
  owner_name: string;
  icon_url?: string;
  purse_balance?: number;
  icon_player_ids?: string[];
}

const IconPlayers = () => {
  const [players, setPlayers] = useState<AuctionPlayer[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [selectedTeamForPlayer, setSelectedTeamForPlayer] = useState<Record<string, string>>({});

  const resolveFileUrl = (url: string): string => {
    if (!url) return "";
    if (url.startsWith("data:") || url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${BACKEND_URL}${url}`;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [playersData, teamsData] = await Promise.all([
        auctionAPI.getAllAuctionPlayers(0, 100),
        teamAPI.getAllTeams(0, 100),
      ]);
      setPlayers(Array.isArray(playersData) ? playersData : playersData.players || []);
      setTeams(Array.isArray(teamsData) ? teamsData : teamsData.teams || []);
    } catch (error: any) {
      toast.error("Failed to load data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const getIconPlayersForTeam = (teamId: string) => {
    return players.filter(p => p.is_icon_player && p.icon_player_team_id === teamId);
  };

  const getTeamPurseBalance = (team: Team) => {
    const iconCount = getIconPlayersForTeam(team._id).length;
    return DEFAULT_PURSE_BALANCE - (iconCount * ICON_PLAYER_COST);
  };

  const canAssignIconPlayer = (teamId: string) => {
    return getIconPlayersForTeam(teamId).length < MAX_ICON_PLAYERS;
  };

  const handleAssignIconPlayer = async (playerId: string) => {
    const teamId = selectedTeamForPlayer[playerId];
    if (!teamId) {
      toast.error("Please select a team first");
      return;
    }
    if (!canAssignIconPlayer(teamId)) {
      toast.error(`Team already has ${MAX_ICON_PLAYERS} icon players (maximum)`);
      return;
    }
    try {
      setAssigning(playerId);
      await iconPlayerAPI.assignIconPlayer(playerId, teamId);
      toast.success("Icon player assigned successfully");
      setSelectedTeamForPlayer(prev => ({ ...prev, [playerId]: "" }));
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to assign icon player");
    } finally {
      setAssigning(null);
    }
  };

  const handleUnassignIconPlayer = async (playerId: string) => {
    try {
      setAssigning(playerId);
      await iconPlayerAPI.unassignIconPlayer(playerId);
      toast.success("Icon player unassigned successfully");
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to unassign icon player");
    } finally {
      setAssigning(null);
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

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'bat': return 'Batsman';
      case 'ball': return 'Bowler';
      case 'wk': return 'Wicket Keeper';
      case 'all-rounder': return 'All-Rounder';
      default: return role;
    }
  };

  const iconPlayers = players.filter(p => p.is_icon_player);
  const availablePlayers = players.filter(p => !p.is_icon_player && p.auction_status === 'pending');

  return (
    <div className="min-h-screen bg-gradient-primary py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <Link to="/admin" className="inline-flex items-center text-primary-foreground hover:text-primary-foreground/80 mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin
        </Link>

        <div className="text-center mb-8">
          <img src={clubLogo} alt="Club Logo" className="mx-auto mb-4" style={{height:"15vh", objectFit: "cover"}}/>
          <h1 className="text-3xl font-bold text-primary-foreground mb-2">Icon Players Management</h1>
          <p className="text-primary-foreground/80">
            Assign icon players to teams (₹{ICON_PLAYER_COST} each, max {MAX_ICON_PLAYERS} per team)
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center min-h-96">
            <Loader className="h-8 w-8 text-primary-foreground animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Team Purse Balances */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" /> Team Purse Balances
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {teams.map((team) => {
                    const iconCount = getIconPlayersForTeam(team._id).length;
                    const balance = getTeamPurseBalance(team);
                    return (
                      <div key={team._id} className="flex items-center gap-3 p-3 rounded-lg border bg-white">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={team.icon_url ? resolveFileUrl(team.icon_url) : clubLogo} />
                          <AvatarFallback>{team.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{team.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {iconCount}/{MAX_ICON_PLAYERS} icons • ₹{balance.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Current Icon Players */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" /> Current Icon Players ({iconPlayers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {iconPlayers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No icon players assigned yet</p>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {iconPlayers.map((player) => {
                      const team = teams.find(t => t._id === player.icon_player_team_id);
                      return (
                        <div key={player._id} className="flex items-center justify-between p-3 rounded-lg border bg-amber-50 border-amber-300">
                          <div className="flex items-center gap-3">
                            <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                            <div>
                              <p className="font-medium">{player.name}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge className={`${getRoleBadgeColor(player.role)} text-white text-xs`}>
                                  {getRoleLabel(player.role)}
                                </Badge>
                                {team && <span>→ {team.name}</span>}
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-700 hover:bg-red-100"
                            onClick={() => handleUnassignIconPlayer(player._id)}
                            disabled={assigning === player._id}
                          >
                            {assigning === player._id ? <Loader className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Available Players to Assign */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" /> Available Players ({availablePlayers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {availablePlayers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No available players to assign</p>
                ) : (
                  <div className="space-y-2">
                    {availablePlayers.map((player) => (
                      <div key={player._id} className="flex items-center justify-between p-3 rounded-lg border bg-white">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">{player.name}</p>
                            <div className="flex items-center gap-2">
                              <Badge className={`${getRoleBadgeColor(player.role)} text-white text-xs`}>
                                {getRoleLabel(player.role)}
                              </Badge>
                              <span className="text-sm text-muted-foreground">{player.place}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={selectedTeamForPlayer[player._id] || ""}
                            onValueChange={(value) => setSelectedTeamForPlayer(prev => ({ ...prev, [player._id]: value }))}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Select team" />
                            </SelectTrigger>
                            <SelectContent>
                              {teams.map((team) => (
                                <SelectItem
                                  key={team._id}
                                  value={team._id}
                                  disabled={!canAssignIconPlayer(team._id)}
                                >
                                  {team.name} {!canAssignIconPlayer(team._id) && "(Full)"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            onClick={() => handleAssignIconPlayer(player._id)}
                            disabled={!selectedTeamForPlayer[player._id] || assigning === player._id}
                          >
                            {assigning === player._id ? <Loader className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4 mr-1" />}
                            Assign
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default IconPlayers;


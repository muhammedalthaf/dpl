import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { teamAPI, playerAPI } from "@/lib/api";
import { Loader2, FileDown, List } from "lucide-react";
import clubLogo from "@/assets/club-logo.png";

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';

const resolveFileUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("http")) return url;
  return `${BACKEND_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

interface Player {
  _id: string;
  name: string;
  role: string;
  place: string;
  image_url?: string;
  is_icon_player?: boolean;
  icon_player_team_id?: string;
  sold_to_team_id?: string;
  sold_price?: number;
}

interface Team {
  _id: string;
  name: string;
  owner_name: string;
  icon_url?: string;
  purse_balance?: number;
}

// Unique color themes for each team - inspired by IPL teams
const teamThemes: Record<number, {
  primary: string;
  secondary: string;
  accent: string;
  gradient: string;
  cardBg: string;
  textAccent: string;
}> = {
  0: { // Royal Blue & Gold - like Mumbai Indians
    primary: "#004BA0", secondary: "#D4AF37", accent: "#1A237E",
    gradient: "from-blue-900 via-blue-700 to-blue-500",
    cardBg: "from-blue-950 to-blue-900", textAccent: "text-yellow-400"
  },
  1: { // Red & Gold - like RCB
    primary: "#D50032", secondary: "#C9B037", accent: "#8B0000",
    gradient: "from-red-900 via-red-700 to-red-500",
    cardBg: "from-red-950 to-red-900", textAccent: "text-yellow-300"
  },
  2: { // Purple & Gold - like KKR
    primary: "#3A225D", secondary: "#FDB913", accent: "#2D1B4E",
    gradient: "from-purple-900 via-purple-700 to-purple-500",
    cardBg: "from-purple-950 to-purple-900", textAccent: "text-yellow-400"
  },
  3: { // Orange & Black - like SRH
    primary: "#FF6B00", secondary: "#000000", accent: "#CC5500",
    gradient: "from-orange-700 via-orange-500 to-amber-400",
    cardBg: "from-orange-950 to-orange-900", textAccent: "text-black"
  },
  4: { // Teal & Gold - like GT
    primary: "#1C3F5E", secondary: "#B4975A", accent: "#0D2137",
    gradient: "from-slate-900 via-teal-800 to-cyan-700",
    cardBg: "from-slate-950 to-slate-900", textAccent: "text-amber-400"
  },
  5: { // Yellow & Blue - like CSK
    primary: "#FFFF00", secondary: "#0081E9", accent: "#FFD700",
    gradient: "from-yellow-500 via-yellow-400 to-amber-300",
    cardBg: "from-yellow-600 to-yellow-500", textAccent: "text-blue-900"
  },
  6: { // Pink & Blue - like RR
    primary: "#EA1A85", secondary: "#254AA5", accent: "#C71585",
    gradient: "from-pink-700 via-pink-500 to-rose-400",
    cardBg: "from-pink-950 to-pink-900", textAccent: "text-blue-300"
  },
  7: { // Navy & Silver - like DC
    primary: "#004C93", secondary: "#EF1B23", accent: "#003366",
    gradient: "from-blue-950 via-blue-800 to-indigo-600",
    cardBg: "from-slate-950 to-blue-950", textAccent: "text-red-400"
  },
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case "bat": return "BAT";
    case "ball": return "BOWL";
    case "wk": return "WK";
    case "all-rounder": return "ALL";
    default: return role.toUpperCase().slice(0, 3);
  }
};

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case "bat": return "bg-amber-500";
    case "ball": return "bg-emerald-500";
    case "wk": return "bg-violet-500";
    case "all-rounder": return "bg-blue-500";
    default: return "bg-gray-500";
  }
};

const TeamBanners = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teamsData, playersData] = await Promise.all([
          teamAPI.getAllTeams(0, 100),
          playerAPI.getAllPlayers(0, 100)
        ]);
        setTeams(teamsData.teams || []);
        setPlayers(playersData.players || []);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getTeamPlayers = (teamId: string) => {
    const iconPlayers = players.filter(p => p.is_icon_player && p.icon_player_team_id === teamId);
    const soldPlayers = players.filter(p => !p.is_icon_player && p.sold_to_team_id === teamId);
    return { iconPlayers, soldPlayers, allPlayers: [...iconPlayers, ...soldPlayers] };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-4 px-2 sm:p-6 print:p-0 print:bg-white">
      {/* Screen Header */}
      <div className="text-center mb-8 print:hidden">
        <img src={clubLogo} alt="DPL" className="h-20 mx-auto mb-4" />
        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
          DEVERKOVIL PREMIER LEAGUE
        </h1>
        <p className="text-gray-400 text-lg">Team Banners - {teams.length} Teams</p>
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:opacity-90 transition"
          >
            Print / Export PDF
          </button>
          <Link
            to="/team-banners-pdf"
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:opacity-90 transition flex items-center gap-2"
          >
            <FileDown className="h-4 w-4" />
            PDF Export (1 per page)
          </Link>
          <Link
            to="/team-squad-list"
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-violet-500 text-white font-bold rounded-xl hover:opacity-90 transition flex items-center gap-2"
          >
            <List className="h-4 w-4" />
            Squad List (Names Only)
          </Link>
        </div>
      </div>

      {/* Team Banners */}
      <div className="space-y-8 max-w-6xl mx-auto">
        {teams.map((team, index) => {
          const theme = teamThemes[index % 8];
          const { iconPlayers, soldPlayers } = getTeamPlayers(team._id);

          return (
            <div
              key={team._id}
              className="relative overflow-hidden rounded-3xl shadow-2xl print:break-inside-avoid print:mb-8"
              style={{ minHeight: "600px" }}
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`} />

              {/* Decorative Elements */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-black/30 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-5">
                  {team.icon_url && (
                    <img src={resolveFileUrl(team.icon_url)} alt="" className="w-full h-full object-contain" />
                  )}
                </div>
                {/* Diagonal stripes */}
                <div className="absolute inset-0" style={{
                  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 100px, rgba(255,255,255,0.03) 100px, rgba(255,255,255,0.03) 200px)'
                }} />
              </div>

              <div className="relative p-6 sm:p-8">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    {/* Team Logo */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-white/20 blur-xl rounded-full" />
                      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white/10 backdrop-blur-sm border-4 border-white/30 overflow-hidden flex items-center justify-center shadow-2xl">
                        <img
                          src={team.icon_url ? resolveFileUrl(team.icon_url) : clubLogo}
                          alt={team.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight drop-shadow-lg">
                        {team.name}
                      </h2>
                      <p className="text-white/70 text-sm font-medium mt-1">
                        Owner: {team.owner_name}
                      </p>
                    </div>
                  </div>
                  {/* DPL Logo */}
                  <div className="hidden sm:block">
                    <img src={clubLogo} alt="DPL" className="h-16 opacity-80" />
                  </div>
                </div>

                {/* Icon Players Section */}
                {iconPlayers.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`h-1 w-12 ${theme.textAccent.replace('text-', 'bg-')} rounded`} />
                      <h3 className={`text-lg font-black uppercase tracking-widest ${theme.textAccent}`}>
                        ★ Icon Players ★
                      </h3>
                      <div className={`h-1 flex-1 ${theme.textAccent.replace('text-', 'bg-')} rounded opacity-30`} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {iconPlayers.map((player) => (
                        <div
                          key={player._id}
                          className={`relative bg-gradient-to-br ${theme.cardBg} rounded-2xl p-4 border-2 border-yellow-400/50 shadow-xl overflow-hidden group`}
                        >
                          <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-400/10 rounded-bl-full" />
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="absolute inset-0 bg-yellow-400/30 blur-lg rounded-full" />
                              {player.image_url ? (
                                <img
                                  src={resolveFileUrl(player.image_url)}
                                  alt={player.name}
                                  className="relative w-20 h-20 rounded-full object-cover border-3 border-yellow-400 shadow-lg"
                                />
                              ) : (
                                <div className="relative w-20 h-20 rounded-full bg-yellow-400/20 border-3 border-yellow-400 flex items-center justify-center">
                                  <span className="text-2xl font-black text-yellow-400">
                                    {player.name.slice(0, 2).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                                <span className="text-xs">⭐</span>
                              </div>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-xl font-black text-white uppercase tracking-tight">
                                {player.name}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 ${getRoleBadgeColor(player.role)} rounded text-xs font-bold text-white`}>
                                  {getRoleLabel(player.role)}
                                </span>
                                <span className="text-yellow-400 text-sm font-bold">₹1500</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Team Players Grid */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-1 w-12 bg-white/50 rounded" />
                    <h3 className="text-lg font-black text-white uppercase tracking-widest">
                      Squad ({soldPlayers.length} Players)
                    </h3>
                    <div className="h-1 flex-1 bg-white/20 rounded" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {soldPlayers.map((player, playerIndex) => (
                      <div
                        key={player._id}
                        className={`relative bg-gradient-to-br ${theme.cardBg} rounded-xl p-3 border border-white/10 shadow-lg hover:border-white/30 transition-all group`}
                      >
                        <div className="flex flex-col items-center text-center">
                          {/* Player Number */}
                          <div className="absolute top-2 left-2 w-6 h-6 bg-white/10 rounded-full flex items-center justify-center">
                            <span className="text-white/60 text-xs font-bold">
                              {playerIndex + 1}
                            </span>
                          </div>
                          {/* Player Image */}
                          {player.image_url ? (
                            <img
                              src={resolveFileUrl(player.image_url)}
                              alt={player.name}
                              className="w-16 h-16 rounded-full object-cover border-2 border-white/20 shadow-md mb-2"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center mb-2">
                              <span className="text-lg font-bold text-white/70">
                                {player.name.slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                          )}
                          {/* Player Info */}
                          <h4 className="text-sm font-bold text-white uppercase tracking-tight leading-tight line-clamp-2">
                            {player.name}
                          </h4>
                          <div className="flex items-center gap-1 mt-1">
                            <span className={`px-1.5 py-0.5 ${getRoleBadgeColor(player.role)} rounded text-[10px] font-bold text-white`}>
                              {getRoleLabel(player.role)}
                            </span>
                          </div>
                          {player.sold_price && (
                            <span className={`text-xs font-bold mt-1 ${theme.textAccent}`}>
                              ₹{player.sold_price}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Stats */}
                <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className={`text-3xl font-black ${theme.textAccent}`}>
                        {iconPlayers.length + soldPlayers.length}
                      </p>
                      <p className="text-white/50 text-xs uppercase tracking-wider">Players</p>
                    </div>
                    <div className="w-px h-10 bg-white/20" />
                    <div className="text-center">
                      <p className={`text-3xl font-black ${theme.textAccent}`}>
                        {iconPlayers.length}
                      </p>
                      <p className="text-white/50 text-xs uppercase tracking-wider">Icons</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white/40 text-[10px] font-bold tracking-[0.2em] uppercase">
                      Deverkovil Premier League 2025
                    </p>
                    <div className="flex gap-1 justify-end mt-2">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className={`w-2 h-2 ${theme.textAccent.replace('text-', 'bg-')} rounded-full opacity-60`} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamBanners;

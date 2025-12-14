import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Printer, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { teamAPI, playerAPI } from "@/lib/api";
import clubLogo from "@/assets/club-logo.png";

interface Player {
  _id: string;
  name: string;
  role: string;
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
}

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';

const resolveFileUrl = (url: string): string => {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${BACKEND_URL}${url}`;
};

// Team color themes
const teamThemes: Record<number, { gradient: string; accent: string; accentBg: string }> = {
  0: { gradient: "from-blue-900 via-blue-700 to-blue-500", accent: "text-yellow-400", accentBg: "bg-yellow-400" },
  1: { gradient: "from-red-900 via-red-700 to-red-500", accent: "text-yellow-300", accentBg: "bg-yellow-300" },
  2: { gradient: "from-purple-900 via-purple-700 to-purple-500", accent: "text-yellow-400", accentBg: "bg-yellow-400" },
  3: { gradient: "from-orange-700 via-orange-500 to-amber-400", accent: "text-black", accentBg: "bg-black" },
  4: { gradient: "from-slate-900 via-teal-800 to-cyan-700", accent: "text-amber-400", accentBg: "bg-amber-400" },
  5: { gradient: "from-yellow-500 via-yellow-400 to-amber-300", accent: "text-blue-900", accentBg: "bg-blue-900" },
  6: { gradient: "from-pink-700 via-pink-500 to-rose-400", accent: "text-blue-300", accentBg: "bg-blue-300" },
  7: { gradient: "from-blue-950 via-blue-800 to-indigo-600", accent: "text-red-400", accentBg: "bg-red-400" },
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case "bat": return "BAT";
    case "ball": return "BOWL";
    case "wk": return "WK";
    case "all-rounder": return "ALL";
    default: return role?.toUpperCase()?.slice(0, 3) || "";
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

const TeamBannersPDF = () => {
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
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getTeamPlayers = (teamId: string) => {
    const iconPlayers = players.filter(p => p.is_icon_player && p.icon_player_team_id === teamId);
    const soldPlayers = players.filter(p => !p.is_icon_player && p.sold_to_team_id === teamId);
    return { iconPlayers, soldPlayers };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader className="h-12 w-12 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gray-900">
      {/* Header - Hidden in print */}
      <div className="print:hidden sticky top-0 z-50 bg-gray-900 border-b border-gray-700 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/team-banners" className="inline-flex items-center text-white hover:text-gray-300">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Link>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">Team Banners - PDF Export</h1>
            <p className="text-gray-400 text-sm">{teams.length} teams</p>
          </div>
          <Button onClick={() => window.print()} className="bg-green-600 hover:bg-green-700">
            <Printer className="h-4 w-4 mr-2" /> Export PDF
          </Button>
        </div>
        <p className="text-center text-yellow-400 text-xs mt-2">
          💡 Tip: In print dialog, enable "Background graphics" and set paper size to A4 for best results
        </p>
      </div>

      {/* Team Banners */}
      <div className="pdf-banners">
        {teams.map((team, index) => {
          const theme = teamThemes[index % 8];
          const { iconPlayers, soldPlayers } = getTeamPlayers(team._id);

          return (
            <div
              key={team._id}
              className={`team-page relative w-full bg-gradient-to-br ${theme.gradient} overflow-hidden`}
            >
              {/* Decorative Elements */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-white/10" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-black/20" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-5">
                  {team.icon_url && <img src={resolveFileUrl(team.icon_url)} alt="" className="w-full h-full object-contain" />}
                </div>
                <div className="absolute inset-0" style={{
                  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 60px, rgba(255,255,255,0.02) 60px, rgba(255,255,255,0.02) 120px)'
                }} />
              </div>

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-3 border-white/40 overflow-hidden shadow-xl">
                      <img src={team.icon_url ? resolveFileUrl(team.icon_url) : clubLogo} alt={team.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-white uppercase tracking-tight drop-shadow-lg">{team.name}</h2>
                      <p className="text-white/70 text-sm">Owner: {team.owner_name}</p>
                    </div>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm p-2">
                    <img src={clubLogo} alt="DPL" className="w-full h-full object-contain" />
                  </div>
                </div>

                {/* Icon Players */}
                {iconPlayers.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`h-0.5 w-8 ${theme.accentBg} rounded`} />
                      <h3 className={`text-sm font-black uppercase tracking-widest ${theme.accent}`}>★ Icon Players ★</h3>
                      <div className={`h-0.5 flex-1 ${theme.accentBg} rounded opacity-30`} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {iconPlayers.map((player) => (
                        <div key={player._id} className="flex items-center gap-3 bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-yellow-400/40">
                          {player.image_url ? (
                            <img src={resolveFileUrl(player.image_url)} alt={player.name} className="w-14 h-14 rounded-full object-cover border-2 border-yellow-400 shadow-lg" />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-yellow-400/20 border-2 border-yellow-400 flex items-center justify-center">
                              <span className="text-xl font-black text-yellow-400">{player.name.slice(0, 2).toUpperCase()}</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base font-black text-white uppercase tracking-tight truncate">{player.name}</h4>
                            <div className="flex items-center gap-2">
                              <span className={`px-1.5 py-0.5 ${getRoleBadgeColor(player.role)} rounded text-[10px] font-bold text-white`}>{getRoleLabel(player.role)}</span>
                              <span className="text-yellow-400 text-xs font-bold">₹1500</span>
                            </div>
                          </div>
                          <span className="text-lg">⭐</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Squad */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-0.5 w-8 bg-white/50 rounded" />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Squad ({soldPlayers.length} Players)</h3>
                    <div className="h-0.5 flex-1 bg-white/20 rounded" />
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {soldPlayers.map((player, idx) => (
                      <div key={player._id} className="flex flex-col items-center text-center bg-black/20 backdrop-blur-sm rounded-lg p-2 border border-white/10">
                        <div className="relative">
                          {player.image_url ? (
                            <img src={resolveFileUrl(player.image_url)} alt={player.name} className="w-12 h-12 rounded-full object-cover border border-white/30" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-white/10 border border-white/30 flex items-center justify-center">
                              <span className="text-sm font-bold text-white/70">{player.name.slice(0, 2).toUpperCase()}</span>
                            </div>
                          )}
                          <div className="absolute -top-1 -left-1 w-4 h-4 bg-white/20 rounded-full flex items-center justify-center">
                            <span className="text-[8px] text-white/80 font-bold">{idx + 1}</span>
                          </div>
                        </div>
                        <h4 className="text-[10px] font-bold text-white uppercase mt-1 leading-tight line-clamp-2">{player.name}</h4>
                        <span className={`px-1 py-0.5 ${getRoleBadgeColor(player.role)} rounded text-[8px] font-bold text-white mt-0.5`}>{getRoleLabel(player.role)}</span>
                        {player.sold_price && <span className={`text-[9px] font-bold ${theme.accent}`}>₹{player.sold_price}</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className={`text-2xl font-black ${theme.accent}`}>{iconPlayers.length + soldPlayers.length}</p>
                      <p className="text-white/50 text-[10px] uppercase tracking-wider">Total</p>
                    </div>
                    <div className="w-px h-8 bg-white/20" />
                    <div className="text-center">
                      <p className={`text-2xl font-black ${theme.accent}`}>{iconPlayers.length}</p>
                      <p className="text-white/50 text-[10px] uppercase tracking-wider">Icons</p>
                    </div>
                  </div>
                  <p className="text-white/40 text-[9px] font-bold tracking-[0.15em] uppercase">Deverkovil Premier League 2025</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .pdf-banners {
            display: block;
          }
          .team-page {
            width: 297mm;
            height: 210mm;
            page-break-after: always;
            page-break-inside: avoid;
            break-after: page;
            break-inside: avoid;
          }
          .team-page:last-child {
            page-break-after: auto;
          }
        }
        @media screen {
          .team-page {
            width: 100%;
            max-width: 900px;
            height: 640px;
            margin: 20px auto;
            border-radius: 16px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
        }
      `}</style>
    </div>
  );
};

export default TeamBannersPDF;


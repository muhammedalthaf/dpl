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
  is_icon_player?: boolean;
  icon_player_team_id?: string;
  sold_to_team_id?: string;
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
const teamThemes: Record<number, { gradient: string; accent: string; accentBg: string; lightBg: string }> = {
  0: { gradient: "from-blue-900 via-blue-700 to-blue-500", accent: "text-yellow-400", accentBg: "bg-yellow-400", lightBg: "bg-blue-900/30" },
  1: { gradient: "from-red-900 via-red-700 to-red-500", accent: "text-yellow-300", accentBg: "bg-yellow-300", lightBg: "bg-red-900/30" },
  2: { gradient: "from-purple-900 via-purple-700 to-purple-500", accent: "text-yellow-400", accentBg: "bg-yellow-400", lightBg: "bg-purple-900/30" },
  3: { gradient: "from-orange-700 via-orange-500 to-amber-400", accent: "text-black", accentBg: "bg-black", lightBg: "bg-orange-900/30" },
  4: { gradient: "from-slate-900 via-teal-800 to-cyan-700", accent: "text-amber-400", accentBg: "bg-amber-400", lightBg: "bg-teal-900/30" },
  5: { gradient: "from-yellow-500 via-yellow-400 to-amber-300", accent: "text-blue-900", accentBg: "bg-blue-900", lightBg: "bg-yellow-600/30" },
  6: { gradient: "from-pink-700 via-pink-500 to-rose-400", accent: "text-blue-300", accentBg: "bg-blue-300", lightBg: "bg-pink-900/30" },
  7: { gradient: "from-blue-950 via-blue-800 to-indigo-600", accent: "text-red-400", accentBg: "bg-red-400", lightBg: "bg-blue-950/30" },
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case "bat": return "Batsman";
    case "ball": return "Bowler";
    case "wk": return "Wicket Keeper";
    case "all-rounder": return "All-Rounder";
    default: return role || "";
  }
};

const TeamSquadList = () => {
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
    <div className="bg-gray-900 min-h-screen">
      {/* Header - Hidden in print */}
      <div className="print:hidden sticky top-0 z-50 bg-gray-900 border-b border-gray-700 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/team-banners" className="inline-flex items-center text-white hover:text-gray-300">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Link>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">Team Squad List</h1>
            <p className="text-gray-400 text-sm">{teams.length} teams</p>
          </div>
          <Button onClick={() => window.print()} className="bg-green-600 hover:bg-green-700">
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
        </div>
      </div>

      {/* Team Cards */}
      <div className="pdf-list">
        {teams.map((team, index) => {
          const theme = teamThemes[index % 8];
          const { iconPlayers, soldPlayers } = getTeamPlayers(team._id);

          return (
            <div
              key={team._id}
              className={`team-card relative bg-gradient-to-br ${theme.gradient} overflow-hidden`}
            >
              {/* Decorative */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/5" />
                <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-black/10" />
                {team.icon_url && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-5">
                    <img src={resolveFileUrl(team.icon_url)} alt="" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>

              <div className="relative z-10 h-full flex flex-col p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 overflow-hidden">
                      <img src={team.icon_url ? resolveFileUrl(team.icon_url) : clubLogo} alt={team.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight">{team.name}</h2>
                      <p className="text-white/60 text-sm">{iconPlayers.length + soldPlayers.length} Players</p>
                    </div>
                  </div>
                  <img src={clubLogo} alt="DPL" className="h-12 opacity-70" />
                </div>

                {/* Players Layout - Icons on top sides, Squad below */}
                <div className="flex-1 flex flex-col gap-4">
                  {/* Icon Players Row */}
                  <div className="flex gap-4">
                    {/* Left Icon Player */}
                    {iconPlayers[0] && (
                      <div className="flex-1 flex items-center gap-4 bg-yellow-400/20 backdrop-blur-sm rounded-xl p-4 border-2 border-yellow-400/50">
                        <span className="text-yellow-400 text-4xl">★</span>
                        <div>
                          <p className="text-white font-black text-xl uppercase leading-tight">{iconPlayers[0].name}</p>
                          <p className="text-yellow-400/80 text-sm mt-1">{getRoleLabel(iconPlayers[0].role)}</p>
                        </div>
                      </div>
                    )}

                    {/* Right Icon Player */}
                    {iconPlayers[1] && (
                      <div className="flex-1 flex items-center justify-end gap-4 bg-yellow-400/20 backdrop-blur-sm rounded-xl p-4 border-2 border-yellow-400/50">
                        <div className="text-right">
                          <p className="text-white font-black text-xl uppercase leading-tight">{iconPlayers[1].name}</p>
                          <p className="text-yellow-400/80 text-sm mt-1">{getRoleLabel(iconPlayers[1].role)}</p>
                        </div>
                        <span className="text-yellow-400 text-4xl">★</span>
                      </div>
                    )}
                  </div>

                  {/* Squad Players */}
                  <div className="flex-1">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="h-px flex-1 bg-white/20" />
                      <h3 className="text-sm font-black text-white uppercase tracking-widest px-4">Squad ({soldPlayers.length} Players)</h3>
                      <div className="h-px flex-1 bg-white/20" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {soldPlayers.map((player, idx) => (
                        <div
                          key={player._id}
                          className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/10"
                        >
                          <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold text-white/70">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-bold text-base uppercase truncate">{player.name}</p>
                            <p className="text-white/50 text-xs">{getRoleLabel(player.role)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
                  <p className="text-white/40 text-xs font-bold tracking-wider uppercase">Deverkovil Premier League 2025</p>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`w-1.5 h-1.5 ${theme.accentBg} rounded-full opacity-60`} />
                    ))}
                  </div>
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
            size: A4 portrait;
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
          .pdf-list {
            display: block;
          }
          .team-card {
            width: 210mm;
            height: 297mm;
            page-break-after: always;
            page-break-inside: avoid;
            break-after: page;
            break-inside: avoid;
          }
          .team-card:last-child {
            page-break-after: auto;
          }
        }
        @media screen {
          .team-card {
            width: 100%;
            max-width: 500px;
            height: 700px;
            margin: 20px auto;
            border-radius: 16px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
        }
      `}</style>
    </div>
  );
};

export default TeamSquadList;


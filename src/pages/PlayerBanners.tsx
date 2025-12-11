import { useEffect, useState } from "react";
import { playerAPI } from "@/lib/api";
import { Loader2 } from "lucide-react";
import clubLogo from "@/assets/club-logo.png";

// Backend server URL for resolving uploaded file paths
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
}

const getRoleLabel = (role: string) => {
  switch (role) {
    case "bat": return "BATSMAN";
    case "ball": return "BOWLER";
    case "wk": return "WICKET KEEPER";
    case "all-rounder": return "ALL ROUNDER";
    default: return role.toUpperCase();
  }
};

const getRoleGradient = (role: string) => {
  switch (role) {
    case "bat": return "from-amber-500 via-orange-500 to-red-500";
    case "ball": return "from-emerald-500 via-teal-500 to-cyan-500";
    case "wk": return "from-violet-500 via-purple-500 to-fuchsia-500";
    case "all-rounder": return "from-blue-500 via-indigo-500 to-purple-500";
    default: return "from-gray-500 via-gray-600 to-gray-700";
  }
};

const PlayerBanners = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const data = await playerAPI.getAllPlayers(0, 100);
        // Filter out icon players
        const nonIconPlayers = (data.players || []).filter(
          (p: Player) => !p.is_icon_player
        );
        setPlayers(nonIconPlayers);
      } catch (error) {
        console.error("Failed to fetch players", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlayers();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 print:p-0 print:bg-white">
      {/* Screen Header - Hidden in Print */}
      <div className="text-center mb-8 print:hidden">
        <img src={clubLogo} alt="DPL" className="h-20 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-white mb-2">
          Deverkovil Premier League
        </h1>
        <p className="text-gray-400">Player Banners - {players.length} Players</p>
        <button
          onClick={() => window.print()}
          className="mt-4 px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg hover:opacity-90 transition"
        >
          Print / Export PDF
        </button>
      </div>

      {/* Player Banners Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-1 print:gap-4 max-w-6xl mx-auto">
        {players.map((player, index) => (
          <div
            key={player._id}
            className="relative overflow-hidden rounded-2xl shadow-2xl print:rounded-lg print:shadow-md print:break-inside-avoid group"
            style={{ minHeight: "280px" }}
          >
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-r ${getRoleGradient(player.role)}`} />

            {/* Animated Shimmer Effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>

            {/* Decorative Circles */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-xl" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-black/20 rounded-full blur-xl" />
            <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-white/5 rounded-full blur-2xl" />

            {/* Diagonal Stripe */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -right-20 top-0 w-40 h-full bg-white/5 rotate-12 transform origin-top-right" />
            </div>

            {/* Content Layout - Horizontal */}
            <div className="relative h-full flex">
              {/* Left Side - Player Image */}
              <div className="relative w-2/5 flex items-center justify-center p-4">
                {/* Glow behind image */}
                <div className="absolute inset-4 bg-black/20 blur-2xl rounded-lg" />

                {player.image_url ? (
                  <img
                    src={resolveFileUrl(player.image_url)}
                    alt={player.name}
                    className="relative w-full h-56 object-cover object-top rounded-xl border-2 border-white/30 shadow-2xl group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="relative w-full h-56 rounded-xl border-2 border-white/30 bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-2xl">
                    <span className="text-6xl font-black text-white/80">
                      {player.name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Player Number Badge */}
                <div className="absolute top-2 left-2 w-10 h-10 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/30">
                  <span className="text-white font-bold text-sm">#{index + 1}</span>
                </div>
              </div>

              {/* Right Side - Info */}
              <div className="flex-1 flex flex-col justify-between p-6 pl-2">
                {/* Logo and Role */}
                <div className="flex items-start justify-between">
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/30 blur-xl rounded-full" />
                    <img
                      src={clubLogo}
                      alt="DPL"
                      className="relative h-16 w-16 object-contain drop-shadow-2xl"
                    />
                  </div>
                  <div className="bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                    <span className="text-white text-xs font-black tracking-widest uppercase">
                      {getRoleLabel(player.role)}
                    </span>
                  </div>
                </div>

                {/* Player Name */}
                <div className="space-y-3">
                  <div>
                    <p className="text-white/60 text-xs font-semibold tracking-widest uppercase mb-1">
                      Player Name
                    </p>
                    <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight leading-none drop-shadow-lg">
                      {player.name}
                    </h2>
                  </div>

                  {/* Location with fancy styling */}
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 w-fit border border-white/20">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white font-semibold text-sm tracking-wide">
                      {player.place}
                    </span>
                  </div>
                </div>

                {/* Bottom branding */}
                <div className="flex items-center justify-between">
                  <p className="text-white/40 text-[10px] font-bold tracking-[0.2em] uppercase">
                    Deverkovil Premier League
                  </p>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerBanners;


import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Printer, Loader, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { playerAPI } from "@/lib/api";
import clubLogo from "@/assets/club-logo.png";

interface Player {
  _id: string;
  name: string;
  phone: string;
  role: string;
  place: string;
  image_url?: string;
  is_icon_player?: boolean;
}

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';

const PlayerBannersPDF = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  const resolveFileUrl = (url: string): string => {
    if (!url) return "";
    if (url.startsWith("data:") || url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${BACKEND_URL}${url}`;
  };

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const data = await playerAPI.getAllPlayers(0, 100);
        const allPlayers = data.players || [];
        // Filter out icon players and sort alphabetically by name
        const filtered = allPlayers.filter((p: Player) => !p.is_icon_player);
        filtered.sort((a: Player, b: Player) => a.name.localeCompare(b.name));
        setPlayers(filtered);
      } catch (error) {
        console.error("Failed to fetch players:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlayers();
  }, []);

  const getRoleGradient = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'batsman': return 'from-amber-500 via-orange-500 to-red-600';
      case 'bowler': return 'from-emerald-500 via-teal-500 to-cyan-600';
      case 'wicket keeper': return 'from-violet-500 via-purple-500 to-fuchsia-600';
      case 'all-rounder': return 'from-blue-500 via-indigo-500 to-purple-600';
      default: return 'from-gray-500 via-slate-500 to-zinc-600';
    }
  };

  const getRoleAccent = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'batsman': return 'bg-amber-400';
      case 'bowler': return 'bg-emerald-400';
      case 'wicket keeper': return 'bg-violet-400';
      case 'all-rounder': return 'bg-blue-400';
      default: return 'bg-gray-400';
    }
  };

  const formatRole = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'batsman': return 'BATSMAN';
      case 'bowler': return 'BOWLER';
      case 'wicket keeper': return 'WICKET KEEPER';
      case 'all-rounder': return 'ALL-ROUNDER';
      default: return role?.toUpperCase() || 'PLAYER';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <Loader className="h-12 w-12 text-primary-foreground animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gray-900">
      {/* Header - Hidden in print */}
      <div className="print:hidden sticky top-0 z-50 bg-gray-900 border-b border-gray-700 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="inline-flex items-center text-white hover:text-gray-300">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Link>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">Player Banners - PDF Export</h1>
            <p className="text-gray-400 text-sm">{players.length} players</p>
          </div>
          <Button onClick={() => window.print()} className="bg-green-600 hover:bg-green-700">
            <Printer className="h-4 w-4 mr-2" /> Export PDF
          </Button>
        </div>
        <p className="text-center text-yellow-400 text-xs mt-2">
          💡 Tip: In print dialog, enable "Background graphics" and set paper size to A5 for best results
        </p>
      </div>

      {/* Player Banners */}
      <div className="pdf-banners">
        {players.map((player, index) => (
          <div
            key={player._id}
            className={`player-page relative w-full bg-gradient-to-br ${getRoleGradient(player.role)} overflow-hidden`}
          >
            {/* Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden">
              {/* Large circle top-right */}
              <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10" />
              {/* Medium circle bottom-left */}
              <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-black/10" />
              {/* Small circles */}
              <div className="absolute top-1/4 left-10 w-8 h-8 rounded-full bg-white/20" />
              <div className="absolute top-1/3 right-16 w-6 h-6 rounded-full bg-white/15" />
              <div className="absolute bottom-1/4 right-10 w-10 h-10 rounded-full bg-black/10" />
              {/* Diagonal lines */}
              <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-20 -left-10 w-[150%] h-1 bg-white/10 rotate-[15deg]" />
                <div className="absolute top-32 -left-10 w-[150%] h-0.5 bg-white/5 rotate-[15deg]" />
                <div className="absolute bottom-32 -left-10 w-[150%] h-1 bg-black/10 rotate-[-10deg]" />
              </div>
              {/* Dotted pattern */}
              <div className="absolute top-10 right-10 grid grid-cols-4 gap-2 opacity-20">
                {[...Array(16)].map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-white" />
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col items-center justify-between p-6 text-white">
              {/* Top: Logo and Player Number */}
              <div className="w-full flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-28 h-28 rounded-full bg-white/20 backdrop-blur-sm p-2 shadow-lg">
                    <img src={clubLogo} alt="DPL" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <p className="text-sm font-medium tracking-wider opacity-80">DEVERKOVIL</p>
                    <p className="text-base font-bold tracking-widest">PREMIER LEAGUE</p>
                  </div>
                </div>
                <div className={`${getRoleAccent(player.role)} text-gray-900 px-4 py-1.5 rounded-full font-bold text-lg shadow-lg`}>
                  #{String(index + 1).padStart(2, '0')}
                </div>
              </div>

              {/* Center: Player Image */}
              <div className="flex-1 flex items-center justify-center py-2">
                <div className="relative">
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-xl bg-white/30 blur-2xl scale-110" />
                  {/* Image container - rectangular (80% bigger) */}
                  <div className="relative w-72 h-[380px] rounded-xl border-4 border-white/50 shadow-2xl overflow-hidden bg-white/20">
                    {player.image_url ? (
                      <img
                        src={resolveFileUrl(player.image_url)}
                        alt={player.name}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-white/50">
                        {player.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  {/* Role badge on image */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-1 rounded-full text-xs font-bold tracking-wider whitespace-nowrap">
                    {formatRole(player.role)}
                  </div>
                </div>
              </div>

              {/* Bottom: Player Info */}
              <div className="w-full text-center space-y-3">
                {/* Name */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-transparent px-4">
                      <h2 className="text-3xl font-black tracking-wide uppercase drop-shadow-lg">
                        {player.name}
                      </h2>
                    </span>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center justify-center gap-2 text-white/90">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm font-medium tracking-wide">{player.place || 'Location N/A'}</span>
                </div>

                {/* Bottom accent bar */}
                <div className="pt-4 flex items-center justify-center gap-2">
                  <div className="w-8 h-1 rounded-full bg-white/40" />
                  <div className="w-3 h-3 rounded-full bg-white/60" />
                  <div className="w-8 h-1 rounded-full bg-white/40" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A5 portrait;
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

          .player-page {
            width: 148mm;
            height: 210mm;
            page-break-after: always;
            page-break-inside: avoid;
            break-after: page;
            break-inside: avoid;
          }

          .player-page:last-child {
            page-break-after: auto;
          }
        }

        @media screen {
          .player-page {
            width: 100%;
            max-width: 400px;
            height: 560px;
            margin: 20px auto;
            border-radius: 12px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
        }
      `}</style>
    </div>
  );
};

export default PlayerBannersPDF;


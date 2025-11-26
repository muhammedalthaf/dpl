import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Phone, MapPin, User, Loader } from "lucide-react";
import clubLogo from "@/assets/club-logo.png";
import { playerAPI } from "@/lib/api";
import { toast } from "sonner";

// Backend server URL for resolving uploaded file paths
const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';

interface Player {
  _id: string;
  name: string;
  email?: string;
  phone: string;
  role: string;
  place: string;
  image_url?: string;
  created_at: string;
}

const Players = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  // Resolve file URL - handles both base64 data URLs and server-relative paths
  const resolveFileUrl = (url: string): string => {
    if (!url) return "";
    // If it's already a data URL (base64) or absolute URL, return as-is
    if (url.startsWith("data:") || url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    // If it's a relative path (e.g., /uploads/...), prepend the backend URL
    return `${BACKEND_URL}${url}`;
  };

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        const data = await playerAPI.getAllPlayers(0, 100);
        setPlayers(data.players || []);
      } catch (error: any) {
        toast.error("Failed to load players");
        console.error(error);
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'bat':
        return 'bg-blue-500';
      case 'ball':
        return 'bg-green-500';
      case 'wk':
        return 'bg-purple-500';
      case 'all-rounder':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'bat':
        return 'Batsman';
      case 'ball':
        return 'Bowler';
      case 'wk':
        return 'Wicket Keeper';
      case 'all-rounder':
        return 'All-Rounder';
      default:
        return role;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary py-12 px-4">
      <div className="container mx-auto">
        <Link to="/admin" className="inline-flex items-center text-primary-foreground hover:text-primary-foreground/80 mb-6 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin
        </Link>

        <div className="text-center mb-8">
          <img src={clubLogo}  alt="Club Logo" className="mx-auto mb-4" style={{height:"20vh", objectFit: "cover"}}/>
          <h1 className="text-4xl font-bold text-primary-foreground mb-2">Registered Players</h1>
          <p className="text-primary-foreground/80">
            {loading ? "Loading..." : `${players.length} ${players.length === 1 ? 'player' : 'players'} registered`}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center min-h-96">
            <Loader className="h-8 w-8 text-primary-foreground animate-spin" />
          </div>
        ) : players.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">No players registered yet</p>
              <Link to="/register" className="text-primary hover:underline">
                Be the first to register!
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {players.map((player) => (
              <Card key={player._id} className="shadow-card hover:shadow-hover transition-all duration-300 overflow-hidden">
                <CardHeader className="bg-gradient-accent pb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center overflow-hidden shadow-lg">
                      {player.image_url ? (
                        <img
                          src={resolveFileUrl(player.image_url)}
                          alt={player.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-10 h-10 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2 text-card">{player.name}</CardTitle>
                      <Badge className={`${getRoleBadgeColor(player.role)} text-white`}>
                        {getRoleLabel(player.role)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-card-foreground">{player.place}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-card-foreground">{player.phone}</span>
                  </div>
                  {player.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-card-foreground truncate">{player.email}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Players;

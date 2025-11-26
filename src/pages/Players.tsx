import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Mail, Phone, MapPin, User } from "lucide-react";
import clubLogo from "@/assets/club-logo.png";

type Player = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: string;
  place: string;
  image_url: string | null;
  created_at: string;
};

const Players = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  };

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
        <Link to="/" className="inline-flex items-center text-primary-foreground hover:text-primary-foreground/80 mb-6 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        <div className="text-center mb-8">
          <img src={clubLogo} alt="Club Logo" className="w-24 h-24 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-primary-foreground mb-2">Registered Players</h1>
          <p className="text-primary-foreground/80">
            {players.length} {players.length === 1 ? 'player' : 'players'} registered
          </p>
        </div>

        {loading ? (
          <div className="text-center text-primary-foreground">Loading players...</div>
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
              <Card key={player.id} className="shadow-card hover:shadow-hover transition-all duration-300 overflow-hidden">
                <CardHeader className="bg-gradient-accent pb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center overflow-hidden shadow-lg">
                      {player.image_url ? (
                        <img 
                          src={player.image_url} 
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

import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader, RefreshCw, Star, ArrowUpDown, Users, Shuffle } from "lucide-react";
import clubLogo from "@/assets/club-logo.png";
import { auctionOrderAPI } from "@/lib/api";
import { toast } from "sonner";

interface AuctionPlayer {
  _id: string;
  name: string;
  phone: string;
  role: string;
  place: string;
  base_price: number;
  auction_status: string;
  auction_order: number | null;
  is_icon_player: boolean;
  icon_player_team_id?: string;
}

const AuctionOrder = () => {
  const [players, setPlayers] = useState<AuctionPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [populating, setPopulating] = useState(false);
  const [randomizing, setRandomizing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newOrderValue, setNewOrderValue] = useState<string>("");
  const [updating, setUpdating] = useState(false);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const data = await auctionOrderAPI.getAllPlayersWithOrder();
      setPlayers(data.players || []);
    } catch (error: any) {
      toast.error("Failed to load players");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const handleInitializeAuction = async () => {
    try {
      setPopulating(true);
      const result = await auctionOrderAPI.initializeAuctionForAll(100);
      toast.success(`${result.message} (Initialized: ${result.initialized})`);
      fetchPlayers();
    } catch (error: any) {
      toast.error("Failed to initialize auction for players");
    } finally {
      setPopulating(false);
    }
  };

  const handleInitializeOrder = async () => {
    try {
      setInitializing(true);
      const result = await auctionOrderAPI.initializeOrder();
      toast.success(result.message);
      fetchPlayers();
    } catch (error: any) {
      toast.error("Failed to initialize order");
    } finally {
      setInitializing(false);
    }
  };

  const handleRandomizeOrder = async () => {
    try {
      setRandomizing(true);
      const result = await auctionOrderAPI.randomizeOrder(true);
      toast.success(result.message);
      fetchPlayers();
    } catch (error: any) {
      toast.error("Failed to randomize order");
    } finally {
      setRandomizing(false);
    }
  };

  const handleUpdateOrder = async (playerId: string) => {
    const newOrder = parseInt(newOrderValue);
    if (isNaN(newOrder) || newOrder < 1) {
      toast.error("Please enter a valid order number (>= 1)");
      return;
    }

    try {
      setUpdating(true);
      const result = await auctionOrderAPI.updateOrder(playerId, newOrder);
      toast.success(result.message);
      setEditingId(null);
      setNewOrderValue("");
      fetchPlayers();
    } catch (error: any) {
      toast.error("Failed to update order");
    } finally {
      setUpdating(false);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline">Pending</Badge>;
      case 'live': return <Badge className="bg-yellow-500">Live</Badge>;
      case 'sold': return <Badge className="bg-green-600">Sold</Badge>;
      case 'unsold': return <Badge variant="destructive">Unsold</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <Link to="/admin" className="inline-flex items-center text-primary-foreground hover:text-primary-foreground/80 mb-6 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin
        </Link>

        <div className="text-center mb-8">
          <img src={clubLogo} alt="Club Logo" className="mx-auto mb-4" style={{height:"15vh", objectFit: "cover"}}/>
          <h1 className="text-3xl font-bold text-primary-foreground mb-2">Auction Order Management</h1>
          <p className="text-primary-foreground/80 mb-4">
            {loading ? "Loading..." : `${players.length} players`}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              onClick={handleInitializeAuction}
              disabled={populating}
              variant="default"
            >
              {populating ? <Loader className="h-4 w-4 animate-spin mr-2" /> : <Users className="h-4 w-4 mr-2" />}
              Initialize Auction
            </Button>
            <Button
              onClick={handleInitializeOrder}
              disabled={initializing}
              variant="secondary"
            >
              {initializing ? <Loader className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Initialize Order
            </Button>
            <Button
              onClick={handleRandomizeOrder}
              disabled={randomizing}
              variant="secondary"
            >
              {randomizing ? <Loader className="h-4 w-4 animate-spin mr-2" /> : <Shuffle className="h-4 w-4 mr-2" />}
              Randomize Order
            </Button>
            <Button onClick={fetchPlayers} variant="outline" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center min-h-96">
            <Loader className="h-8 w-8 text-primary-foreground animate-spin" />
          </div>
        ) : players.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No auction players found. Click "Initialize Auction" to set up players for auction.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5" />
                Player Auction Order
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {players.map((player) => (
                  <div
                    key={player._id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      player.is_icon_player ? 'bg-amber-50 border-amber-300' : 'bg-white border-gray-200'
                    } ${player.auction_status === 'sold' ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-lg">
                        {player.auction_order ?? '-'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{player.name}</span>
                          {player.is_icon_player && (
                            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                          )}
                          <Badge className={`${getRoleBadgeColor(player.role)} text-white text-xs`}>
                            {getRoleLabel(player.role)}
                          </Badge>
                          {getStatusBadge(player.auction_status)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {player.place} • Base: ₹{player.base_price}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {editingId === player._id ? (
                        <>
                          <Input
                            type="number"
                            min="1"
                            value={newOrderValue}
                            onChange={(e) => setNewOrderValue(e.target.value)}
                            className="w-20 h-8"
                            placeholder="Order"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={() => handleUpdateOrder(player._id)}
                            disabled={updating}
                          >
                            {updating ? <Loader className="h-3 w-3 animate-spin" /> : 'Save'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingId(null);
                              setNewOrderValue("");
                            }}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingId(player._id);
                            setNewOrderValue(player.auction_order?.toString() || "");
                          }}
                          disabled={player.auction_status === 'sold'}
                        >
                          Change Order
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 text-center text-primary-foreground/60 text-sm">
          <p>💡 Tip: Click "Change Order" to swap a player's position with another player.</p>
          <p>When you set a new order number, the player at that position will swap places.</p>
        </div>
      </div>
    </div>
  );
};

export default AuctionOrder;


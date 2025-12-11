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
    <div className="page-container bg-gradient-primary">
      <div className="content-container-sm">
        <Link to="/admin" className="inline-flex items-center text-primary-foreground hover:text-primary-foreground/80 mb-4 sm:mb-6 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin
        </Link>

        <div className="text-center mb-6 sm:mb-8">
          <img src={clubLogo} alt="Club Logo" className="mx-auto mb-3 sm:mb-4" style={{height:"12vh", objectFit: "cover"}}/>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-foreground mb-2">Auction Order Management</h1>
          <p className="text-primary-foreground/80 mb-4 text-sm sm:text-base">
            {loading ? "Loading..." : `${players.length} players`}
          </p>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-center gap-2">
            <Button
              onClick={handleInitializeAuction}
              disabled={populating}
              variant="default"
              size="sm"
              className="text-xs sm:text-sm"
            >
              {populating ? <Loader className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1 sm:mr-2" /> : <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />}
              <span className="hidden sm:inline">Initialize</span> Auction
            </Button>
            <Button
              onClick={handleInitializeOrder}
              disabled={initializing}
              variant="secondary"
              size="sm"
              className="text-xs sm:text-sm"
            >
              {initializing ? <Loader className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1 sm:mr-2" /> : <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />}
              <span className="hidden sm:inline">Initialize</span> Order
            </Button>
            <Button
              onClick={handleRandomizeOrder}
              disabled={randomizing}
              variant="secondary"
              size="sm"
              className="text-xs sm:text-sm"
            >
              {randomizing ? <Loader className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1 sm:mr-2" /> : <Shuffle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />}
              Randomize
            </Button>
            <Button onClick={fetchPlayers} variant="outline" disabled={loading} size="sm" className="text-xs sm:text-sm">
              <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
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
            <CardContent className="p-2 sm:p-6">
              <div className="space-y-2">
                {players.map((player) => (
                  <div
                    key={player._id}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 rounded-lg border gap-2 ${
                      player.is_icon_player ? 'bg-amber-50 border-amber-300' : 'bg-white border-gray-200'
                    } ${player.auction_status === 'sold' ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-sm sm:text-lg flex-shrink-0">
                        {player.auction_order ?? '-'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                          <span className="font-medium text-sm sm:text-base">{player.name}</span>
                          {player.is_icon_player && (
                            <Star className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500 fill-amber-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap mt-1">
                          <Badge className={`${getRoleBadgeColor(player.role)} text-white text-[10px] sm:text-xs`}>
                            {getRoleLabel(player.role)}
                          </Badge>
                          {getStatusBadge(player.auction_status)}
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            {player.place} • ₹{player.base_price}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-10 sm:ml-0">
                      {editingId === player._id ? (
                        <>
                          <Input
                            type="number"
                            min="1"
                            value={newOrderValue}
                            onChange={(e) => setNewOrderValue(e.target.value)}
                            className="w-16 sm:w-20 h-8 text-sm"
                            placeholder="#"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={() => handleUpdateOrder(player._id)}
                            disabled={updating}
                            className="h-8 px-2 sm:px-3"
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
                            className="h-8 px-2 sm:px-3"
                          >
                            <span className="hidden sm:inline">Cancel</span>
                            <span className="sm:hidden">X</span>
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
                          className="h-8 text-xs sm:text-sm"
                        >
                          <span className="hidden sm:inline">Change Order</span>
                          <span className="sm:hidden">Edit</span>
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


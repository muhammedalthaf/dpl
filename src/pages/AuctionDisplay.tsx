import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Hammer, RefreshCcw, Loader2 } from "lucide-react";
import { auctionAPI, bidAPI, teamAPI } from "@/lib/api";
import clubLogo from "@/assets/club-logo.png";

const AuctionDisplay = () => {
  const [livePlayer, setLivePlayer] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [useSampleData, setUseSampleData] = useState(false);

  const fetchLiveData = async () => {
    try {
      setLoading(true);
      const [playersData, teamsData] = await Promise.all([
        auctionAPI.getAuctionPlayersByStatus("live", 0, 10),
        teamAPI.getAllTeams(0, 100),
      ]);

      const players = Array.isArray(playersData) ? playersData : playersData.players || [];
      const teamsList = Array.isArray(teamsData) ? teamsData : teamsData.teams || [];

      setTeams(teamsList);

      if (players.length > 0) {
        const player = players[0];
        setLivePlayer(player);

        const bidsData = await bidAPI.getBidsForPlayer(player._id, 0, 50);
        const bidsList = Array.isArray(bidsData) ? bidsData : bidsData.bids || [];
        setBids(bidsList.sort((a: any, b: any) => b.amount - a.amount));
      } else {
        setLivePlayer(null);
        setBids([]);
      }
    } catch (error: any) {
      console.error("Failed to fetch live data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveData();
  }, []);

  useEffect(() => {
    if (useSampleData) return;
    const interval = setInterval(() => {
      fetchLiveData();
    }, 2000);
    return () => clearInterval(interval);
  }, [useSampleData]);

  // Sample data for demo mode
  const samplePlayer = {
    _id: "sample-player-1",
    name: "Akhil Nair",
    email: "akhil.nair@example.com",
    phone: "+91 98765 43210",
    role: "bat",
    place: "Kozhikode",
    image_url: "https://i.ibb.co/9cQJ8Xv/player-sample.jpg",
    base_price: 50000,
    auction_status: "live",
  };

  const sampleBids = [
    {
      id: "bid-1",
      playerId: "sample-player-1",
      teamId: "team-1",
      teamName: "Calicut Strikers",
      amount: 75000,
      timestamp: new Date().toISOString(),
    },
    {
      id: "bid-2",
      playerId: "sample-player-1",
      teamId: "team-2",
      teamName: "Beachside Blazers",
      amount: 65000,
      timestamp: new Date(Date.now() - 10000).toISOString(),
    },
    {
      id: "bid-3",
      playerId: "sample-player-1",
      teamId: "team-3",
      teamName: "Harbor Hawks",
      amount: 55000,
      timestamp: new Date(Date.now() - 20000).toISOString(),
    },
  ];

  const currentPlayer = useSampleData ? samplePlayer : livePlayer;
  const bidsForCurrent = useSampleData ? sampleBids : bids;
  const highestBid = bidsForCurrent[0] || null;
  const winningTeam = highestBid
    ? teams.find((team) => team._id === highestBid.teamId)
    : null;

  const basePrice = currentPlayer?.base_price || 5000;

  return (
    <div className="min-h-screen bg-gradient-primary py-10 px-4">
      <div className="container mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <Link
            to="/"
            className="inline-flex items-center text-primary-foreground hover:text-primary-foreground/80 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Home
          </Link>
          <div className="flex gap-2">
            <Button
              variant={useSampleData ? "default" : "outline"}
              size="sm"
              onClick={() => setUseSampleData(!useSampleData)}
              className={useSampleData ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {useSampleData ? "Demo ON" : "Demo OFF"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLiveData}
              className="text-primary-foreground border-primary-foreground hover:bg-primary-foreground/10"
              disabled={loading || useSampleData}
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Title */}
        <div className="text-center text-primary-foreground space-y-2">
          <p className="uppercase tracking-wide text-sm text-primary-foreground/70">
            Live Auction
          </p>
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <Hammer className="h-8 w-8" />
            Current Bid
          </h1>
        </div>

        {/* Loading State */}
        {loading && !useSampleData ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary-foreground" />
              <p className="text-primary-foreground">Loading live auction...</p>
            </div>
          </div>
        ) : currentPlayer ? (
          <Card className="shadow-card overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white pb-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="text-sm text-blue-100 uppercase tracking-wide mb-2 font-semibold">
                    Currently Bidding
                  </p>
                  <CardTitle className="text-5xl font-bold text-white">
                    {currentPlayer.name}
                  </CardTitle>
                </div>
                <Badge
                  className={`text-lg px-4 py-2 font-bold ${
                    currentPlayer.auctionStatus === "live"
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-yellow-500 text-black"
                  }`}
                >
                  {currentPlayer.auctionStatus === "live" ? "🔴 LIVE" : "⏳ PENDING"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Player Info with Image */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Player Image */}
                <div className="flex justify-center sm:justify-start">
                  <div className="w-48 h-56 rounded-lg overflow-hidden border-4 border-blue-600 shadow-lg bg-gray-200">
                    {currentPlayer.image_url ? (
                      <img
                        src={currentPlayer.image_url}
                        alt={currentPlayer.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
                        <span className="text-6xl font-bold text-white">
                          {currentPlayer.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Player Info */}
                <div className="grid grid-cols-2 gap-4 auto-rows-max">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Role</p>
                    <p className="text-3xl font-bold text-blue-600">{currentPlayer.role}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Place</p>
                    <p className="text-2xl font-semibold text-blue-600">
                      {currentPlayer.place}
                    </p>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Base Price</p>
                    <p className="text-3xl font-bold text-green-600">
                      ₹{basePrice.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Bid Section */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-6 space-y-4 border-2 border-amber-300 shadow-lg">
                <p className="text-sm text-amber-900 uppercase tracking-widest font-bold">
                  ⚡ Current Highest Bid
                </p>

                {highestBid && winningTeam ? (
                  <div className="space-y-5">
                    {/* Bid Amount - PROMINENT */}
                    <div className="text-center bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg p-6 shadow-lg">
                      <p className="text-xs text-orange-100 uppercase tracking-widest font-bold mb-2">
                        Leading Bid
                      </p>
                      <p className="text-7xl font-black">
                        ₹{highestBid.amount.toLocaleString()}
                      </p>
                    </div>

                    {/* Winning Team - PROMINENT */}
                    <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg border-2 border-blue-400 shadow-lg">
                      <Avatar className="h-20 w-20 border-4 border-white">
                        <AvatarImage
                          src={winningTeam.icon_url || clubLogo}
                          alt={winningTeam.name}
                          style={{ objectFit: "cover" }}
                        />
                        <AvatarFallback>{winningTeam.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm text-blue-100 uppercase tracking-wide font-bold">Bidding Team</p>
                        <p className="text-3xl font-bold text-white leading-tight">
                          {winningTeam.name}
                        </p>
                        <p className="text-sm text-blue-100 mt-1">
                          Owner: {winningTeam.owner_name}
                        </p>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-4 border border-amber-200">
                        <p className="text-xs text-amber-900 uppercase tracking-widest font-bold mb-1">Time</p>
                        <p className="text-lg font-semibold text-amber-900">
                          {new Date(highestBid.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-amber-200">
                        <p className="text-xs text-amber-900 uppercase tracking-widest font-bold mb-1">Total Bids</p>
                        <p className="text-3xl font-bold text-red-600">
                          {bidsForCurrent.length}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-white rounded-lg border border-dashed border-amber-300">
                    <p className="text-xl font-bold text-amber-900">
                      🔔 No bids yet
                    </p>
                    <p className="text-amber-700 mt-2">
                      Auction is ready to start. Teams can begin bidding!
                    </p>
                  </div>
                )}
              </div>

              {/* Other Bid Info */}
              {bidsForCurrent.length > 1 && (
                <div className="space-y-3 pt-4 border-t-2 border-gray-300">
                  <p className="text-sm font-bold uppercase tracking-widest text-gray-700">
                    📊 Other Recent Bids
                  </p>
                  <div className="space-y-2">
                    {bidsForCurrent.slice(1, 4).map((bid, idx) => (
                      <div
                        key={bid.id}
                        className={`flex items-center justify-between p-4 rounded-lg font-semibold transition ${
                          idx === 1
                            ? "bg-gradient-to-r from-silver-100 to-gray-100 border-2 border-gray-400"
                            : idx === 2
                            ? "bg-gradient-to-r from-orange-100 to-yellow-100 border-2 border-orange-300"
                            : "bg-gray-50 border border-gray-200"
                        }`}
                      >
                        <span className="text-lg font-bold text-gray-700">
                          #{idx + 2}
                        </span>
                        <span className="text-sm text-gray-600 flex-1 text-center">
                          {bid.teamName}
                        </span>
                        <span className={`text-2xl font-black ${
                          idx === 1
                            ? "text-gray-600"
                            : idx === 2
                            ? "text-orange-600"
                            : "text-gray-500"
                        }`}>
                          ₹{bid.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-card overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
              <CardTitle className="text-center text-2xl">Coming Soon...</CardTitle>
            </CardHeader>
            <CardContent className="pt-12 pb-12 text-center space-y-6">
              <Hammer className="h-24 w-24 text-purple-400 mx-auto animate-bounce" />
              <div>
                <p className="text-2xl font-bold text-gray-800 mb-3">
                  ⏳ Auction Not Started
                </p>
                <p className="text-gray-600 text-lg">
                  No players are currently being auctioned. <br />
                  <span className="font-semibold">Please wait for the next player to be drawn.</span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Auto-refresh Info */}
        <div className="text-center">
          <p className="text-sm font-semibold text-primary-foreground/80">
            🔄 This page auto-refreshes every 2 seconds
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuctionDisplay;

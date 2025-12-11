import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Loader, Search, MessageCircle } from "lucide-react";
import clubLogo from "@/assets/club-logo.png";
import { registrationAPI } from "@/lib/api";

interface ApprovedPlayer {
  _id: string;
  player_name: string;
  phone: string;
  payment_reference: string;
  approved_at: string;
}

const ApprovedPayments = () => {
  const [approvedPlayers, setApprovedPlayers] = useState<ApprovedPlayer[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<ApprovedPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchApprovedPlayers = async () => {
    try {
      setLoading(true);
      const data = await registrationAPI.getApprovedWithPayments(0, 100);
      setApprovedPlayers(data.approved_players || []);
      setFilteredPlayers(data.approved_players || []);
    } catch (error: any) {
      toast.error("Failed to load approved players");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedPlayers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = approvedPlayers.filter(
        (player) =>
          player.player_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          player.phone.includes(searchTerm) ||
          player.payment_reference?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPlayers(filtered);
    } else {
      setFilteredPlayers(approvedPlayers);
    }
  }, [searchTerm, approvedPlayers]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openWhatsApp = (phone: string, playerName: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const phoneWithCode = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
    const message = `Hi ${playerName}, your DPL registration has been approved!`;
    window.open(`https://wa.me/${phoneWithCode}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="page-container bg-gradient-primary">
      <div className="content-container">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <Link to="/admin">
            <Button variant="outline" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/30">
              <ArrowLeft className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Back</span>
            </Button>
          </Link>
          <img src={clubLogo} alt="Club Logo" className="h-10 sm:h-12" />
        </div>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl">Approved Payments</CardTitle>
            <p className="text-muted-foreground text-sm sm:text-base">List of approved players with their transaction details</p>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone or transaction ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredPlayers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchTerm ? "No matching records found" : "No approved payments yet"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Player Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Approved On</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPlayers.map((player, index) => (
                      <TableRow key={player._id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{player.player_name}</TableCell>
                        <TableCell>{player.phone}</TableCell>
                        <TableCell className="font-mono text-sm">{player.payment_reference || "N/A"}</TableCell>
                        <TableCell>{formatDate(player.approved_at)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => openWhatsApp(player.phone, player.player_name)}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="mt-4 text-sm text-muted-foreground">
              Total: {filteredPlayers.length} approved players
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApprovedPayments;


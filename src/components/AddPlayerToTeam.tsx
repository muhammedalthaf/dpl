import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserPlus, User, X } from "lucide-react";
import { Player } from "@/types";

interface AddPlayerToTeamProps {
  teamId: string;
  teamName: string;
  players: Player[];
  teamPlayers: Player[];
  onAddPlayer: (teamId: string, playerId: string) => void;
  onRemovePlayer: (teamId: string, playerId: string) => void;
}

const AddPlayerToTeam = ({
  teamId,
  teamName,
  players,
  teamPlayers,
  onAddPlayer,
  onRemovePlayer,
}: AddPlayerToTeamProps) => {
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const availablePlayers = players.filter(
    (player) => !teamPlayers.some((tp) => tp.id === player.id)
  );

  const handleAddPlayer = () => {
    if (!selectedPlayer) {
      toast.error("Please select a player");
      return;
    }

    onAddPlayer(teamId, selectedPlayer);
    toast.success("Player linked locally.");
    setSelectedPlayer("");
  };

  const handleRemovePlayer = (playerId: string) => {
    onRemovePlayer(teamId, playerId);
    toast.success("Player removed locally.");
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "bat":
        return "Batsman";
      case "ball":
        return "Bowler";
      case "wk":
        return "Wicket Keeper";
      case "all-rounder":
        return "All-Rounder";
      default:
        return role;
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <UserPlus className="mr-2 h-4 w-4" />
          Manage Players ({teamPlayers.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Players - {teamName}</DialogTitle>
          <DialogDescription>
            Add or remove players from the team (demo data only)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <Label>Add New Player</Label>
            <div className="flex gap-2">
              <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a player" />
                </SelectTrigger>
                <SelectContent>
                  {availablePlayers.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No more players available
                    </div>
                  ) : (
                    availablePlayers.map((player) => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.name} - {getRoleLabel(player.role)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button onClick={handleAddPlayer} disabled={!selectedPlayer}>
                Add
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Current Team Players ({teamPlayers.length})</Label>
            {teamPlayers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No players in this team yet</p>
            ) : (
              <div className="space-y-2">
                {teamPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{player.name}</p>
                        <Badge variant="outline" className="mt-1">
                          {getRoleLabel(player.role)}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePlayer(player.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddPlayerToTeam;

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, User, X } from "lucide-react";

type Player = {
  id: string;
  name: string;
  role: string;
};

type TeamPlayer = {
  id: string;
  players: Player;
};

interface AddPlayerToTeamProps {
  teamId: string;
  teamName: string;
}

const AddPlayerToTeam = ({ teamId, teamName }: AddPlayerToTeamProps) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamPlayers, setTeamPlayers] = useState<TeamPlayer[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isDialogOpen) {
      fetchPlayers();
      fetchTeamPlayers();
    }
  }, [isDialogOpen, teamId]);

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('id, name, role');

      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const fetchTeamPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_players')
        .select('id, players(id, name, role)')
        .eq('team_id', teamId);

      if (error) throw error;
      setTeamPlayers(data || []);
    } catch (error) {
      console.error('Error fetching team players:', error);
    }
  };

  const handleAddPlayer = async () => {
    if (!selectedPlayer) {
      toast.error("Please select a player");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('team_players')
        .insert([
          {
            team_id: teamId,
            player_id: selectedPlayer,
          },
        ]);

      if (error) {
        if (error.code === '23505') {
          toast.error("This player is already in the team");
        } else {
          throw error;
        }
      } else {
        toast.success("Player added to team successfully!");
        setSelectedPlayer("");
        fetchTeamPlayers();
      }
    } catch (error) {
      console.error('Error adding player to team:', error);
      toast.error("Failed to add player to team");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePlayer = async (teamPlayerId: string) => {
    try {
      const { error } = await supabase
        .from('team_players')
        .delete()
        .eq('id', teamPlayerId);

      if (error) throw error;

      toast.success("Player removed from team");
      fetchTeamPlayers();
    } catch (error) {
      console.error('Error removing player:', error);
      toast.error("Failed to remove player");
    }
  };

  const availablePlayers = players.filter(
    (player) => !teamPlayers.some((tp) => tp.players.id === player.id)
  );

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
            Add or remove players from the team
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
              <Button 
                onClick={handleAddPlayer} 
                disabled={isLoading || !selectedPlayer}
              >
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
                {teamPlayers.map((teamPlayer) => (
                  <div
                    key={teamPlayer.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{teamPlayer.players.name}</p>
                        <Badge variant="outline" className="mt-1">
                          {getRoleLabel(teamPlayer.players.role)}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePlayer(teamPlayer.id)}
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

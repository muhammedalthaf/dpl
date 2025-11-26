import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, Trophy, Users, User } from "lucide-react";
import clubLogo from "@/assets/club-logo.png";
import TeamForm from "@/components/TeamForm";
import AddPlayerToTeam from "@/components/AddPlayerToTeam";

type Team = {
  id: string;
  name: string;
  owner_name: string;
  owner_contact: string;
  owner_details: string | null;
  icon_url: string | null;
  created_at: string;
};

const Teams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamCreated = () => {
    setIsDialogOpen(false);
    fetchTeams();
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
          <h1 className="text-4xl font-bold text-primary-foreground mb-2">Team Management</h1>
          <p className="text-primary-foreground/80">
            {teams.length} {teams.length === 1 ? 'team' : 'teams'} registered
          </p>
        </div>

        <div className="flex justify-end mb-6">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                <Plus className="mr-2 h-4 w-4" />
                Create New Team
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
                <DialogDescription>
                  Fill in the team details to create a new team
                </DialogDescription>
              </DialogHeader>
              <TeamForm onSuccess={handleTeamCreated} />
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center text-primary-foreground">Loading teams...</div>
        ) : teams.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No teams created yet</p>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">Create First Team</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Team</DialogTitle>
                    <DialogDescription>
                      Fill in the team details to create a new team
                    </DialogDescription>
                  </DialogHeader>
                  <TeamForm onSuccess={handleTeamCreated} />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <Card key={team.id} className="shadow-card hover:shadow-hover transition-all duration-300">
                <CardHeader className="bg-gradient-accent pb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center overflow-hidden shadow-lg">
                      {team.icon_url ? (
                        <img 
                          src={team.icon_url} 
                          alt={team.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Trophy className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl text-card">{team.name}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Team Owner</h4>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-card-foreground">{team.owner_name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">Contact:</span>
                      <span className="text-sm text-card-foreground">{team.owner_contact}</span>
                    </div>
                    {team.owner_details && (
                      <p className="text-sm text-muted-foreground mt-2">{team.owner_details}</p>
                    )}
                  </div>

                  <AddPlayerToTeam teamId={team.id} teamName={team.name} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Teams;

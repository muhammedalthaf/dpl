import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Trophy, Loader, Pencil, Upload, X } from "lucide-react";
import clubLogo from "@/assets/club-logo.png";
import TeamForm, { TeamFormResult } from "@/components/TeamForm";
import { teamAPI } from "@/lib/api";
import { toast } from "sonner";

// Backend server URL for resolving uploaded file paths
const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';

interface Team {
  _id: string;
  name: string;
  owner_name: string;
  owner_contact: string;
  owner_details?: string;
  icon_url?: string;
  created_at: string;
}

const Teams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ owner_name: "", owner_contact: "" });
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Resolve file URL - handles both base64 data URLs and server-relative paths
  const resolveFileUrl = (url: string): string => {
    if (!url) return "";
    if (url.startsWith("data:") || url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `${BACKEND_URL}${url}`;
  };

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const data = await teamAPI.getAllTeams(0, 100);
        setTeams(data.teams || []);
      } catch (error: any) {
        toast.error("Failed to load teams");
        console.error(error);
        setTeams([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const handleTeamCreated = async (teamData: TeamFormResult) => {
    try {
      let apiData: any = {
        name: teamData.name,
        owner_name: teamData.owner_name,
        owner_contact: teamData.owner_contact,
        owner_details: teamData.owner_details || null,
      };

      let newTeam;

      if (teamData.logo_file) {
        const formData = new FormData();
        formData.append("name", teamData.name);
        formData.append("owner_name", teamData.owner_name);
        formData.append("owner_contact", teamData.owner_contact);
        if (teamData.owner_details) {
          formData.append("owner_details", teamData.owner_details);
        }
        formData.append("icon_file", teamData.logo_file);

        newTeam = await teamAPI.createTeamWithLogo(formData);
      } else {
        newTeam = await teamAPI.createTeam(apiData);
      }

      if (newTeam.icon_url || teamData.logo_preview) {
        newTeam.icon_url = newTeam.icon_url || teamData.logo_preview;
      }

      setTeams((prev) => [newTeam, ...prev]);
      setIsDialogOpen(false);
      toast.success("Team created successfully!");
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || "Failed to create team";
      toast.error(errorMessage);
    }
  };

  const openEditDialog = (team: Team) => {
    setEditingTeam(team);
    setEditForm({
      owner_name: team.owner_name,
      owner_contact: team.owner_contact,
    });
    setEditLogoFile(null);
    setEditLogoPreview(null);
    setIsEditDialogOpen(true);
  };

  const handleEditLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Logo file must be less than 5MB");
        return;
      }
      setEditLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateTeam = async () => {
    if (!editingTeam) return;

    setIsUpdating(true);
    try {
      const formData = new FormData();
      if (editForm.owner_name !== editingTeam.owner_name) {
        formData.append("owner_name", editForm.owner_name);
      }
      if (editForm.owner_contact !== editingTeam.owner_contact) {
        formData.append("owner_contact", editForm.owner_contact);
      }
      if (editLogoFile) {
        formData.append("icon_file", editLogoFile);
      }

      const updatedTeam = await teamAPI.updateTeamWithLogo(editingTeam._id, formData);

      setTeams((prev) =>
        prev.map((t) => (t._id === editingTeam._id ? updatedTeam : t))
      );
      setIsEditDialogOpen(false);
      setEditingTeam(null);
      toast.success("Team updated successfully!");
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || "Failed to update team";
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
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
          <img src={clubLogo} alt="Club Logo" className="mx-auto mb-4" style={{height:"20vh", objectFit: "cover"}} />
          <h1 className="text-4xl font-bold text-primary-foreground mb-2">Team Management</h1>
          <p className="text-primary-foreground/80">
            {loading ? "Loading..." : `${teams.length} ${teams.length === 1 ? 'team' : 'teams'} registered`}
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
          <div className="flex justify-center items-center min-h-96">
            <Loader className="h-8 w-8 text-primary-foreground animate-spin" />
          </div>
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
              <Card key={team._id} className="shadow-card hover:shadow-hover transition-all duration-300">
                <CardHeader className="bg-gradient-accent pb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center overflow-hidden shadow-lg">
                      <img
                        src={team.icon_url ? resolveFileUrl(team.icon_url) : clubLogo}
                        alt={team.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl text-card">{team.name}</CardTitle>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-card hover:bg-white/20"
                      onClick={() => openEditDialog(team)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Team Owner</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-card-foreground font-semibold">{team.owner_name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">Contact:</span>
                      <span className="text-sm text-card-foreground">{team.owner_contact}</span>
                    </div>
                    {team.owner_details && (
                      <p className="text-sm text-muted-foreground mt-2">{team.owner_details}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Team Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Team</DialogTitle>
              <DialogDescription>
                Update {editingTeam?.name} details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Team Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-muted-foreground/30">
                    {editLogoPreview ? (
                      <img src={editLogoPreview} alt="New logo" className="w-full h-full object-cover" />
                    ) : editingTeam?.icon_url ? (
                      <img src={resolveFileUrl(editingTeam.icon_url)} alt="Current logo" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleEditLogoChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => editFileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {editLogoPreview ? "Change Logo" : "Upload New Logo"}
                    </Button>
                    {editLogoPreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditLogoFile(null);
                          setEditLogoPreview(null);
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Owner Name */}
              <div className="space-y-2">
                <Label htmlFor="edit_owner_name">Owner Name</Label>
                <Input
                  id="edit_owner_name"
                  value={editForm.owner_name}
                  onChange={(e) => setEditForm({ ...editForm, owner_name: e.target.value })}
                  placeholder="Enter owner name"
                />
              </div>

              {/* Owner Contact */}
              <div className="space-y-2">
                <Label htmlFor="edit_owner_contact">Owner Contact</Label>
                <Input
                  id="edit_owner_contact"
                  value={editForm.owner_contact}
                  onChange={(e) => setEditForm({ ...editForm, owner_contact: e.target.value })}
                  placeholder="Enter contact number"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateTeam} disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Team"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Teams;

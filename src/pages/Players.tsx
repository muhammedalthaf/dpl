import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Mail, Phone, MapPin, User, Loader, Search, Pencil, Upload, X } from "lucide-react";
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
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", role: "", place: "" });
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image preview dialog
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState("");
  const [imageTitle, setImageTitle] = useState("");

  // Resolve file URL - handles both base64 data URLs and server-relative paths
  const resolveFileUrl = (url: string): string => {
    if (!url) return "";
    if (url.startsWith("data:") || url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `${BACKEND_URL}${url}`;
  };

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const data = await playerAPI.getAllPlayers(0, 500);
      setPlayers(data.players || []);
      setFilteredPlayers(data.players || []);
    } catch (error: any) {
      toast.error("Failed to load players");
      console.error(error);
      setPlayers([]);
      setFilteredPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  // Filter players based on search
  useEffect(() => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const filtered = players.filter(
        (player) =>
          player.name.toLowerCase().includes(term) ||
          player.phone.includes(term)
      );
      setFilteredPlayers(filtered);
    } else {
      setFilteredPlayers(players);
    }
  }, [searchTerm, players]);

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

  const openEditDialog = (player: Player) => {
    setSelectedPlayer(player);
    setEditForm({
      name: player.name,
      email: player.email || "",
      phone: player.phone,
      role: player.role,
      place: player.place,
    });
    setNewImageFile(null);
    setNewImagePreview(null);
    setEditDialogOpen(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewImageFile(file);
      setNewImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSavePlayer = async () => {
    if (!selectedPlayer) return;
    try {
      setSaving(true);

      // Update player details
      await playerAPI.updatePlayer(selectedPlayer._id, {
        name: editForm.name,
        email: editForm.email || null,
        phone: editForm.phone,
        role: editForm.role,
        place: editForm.place,
      });

      // Upload new image if selected
      if (newImageFile) {
        await playerAPI.uploadPlayerImage(selectedPlayer._id, newImageFile);
      }

      toast.success("Player updated successfully");
      setEditDialogOpen(false);
      fetchPlayers();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update player");
    } finally {
      setSaving(false);
    }
  };

  const viewImage = (url: string, title: string) => {
    setCurrentImage(resolveFileUrl(url));
    setImageTitle(title);
    setImageDialogOpen(true);
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
            {loading ? "Loading..." : `${filteredPlayers.length} of ${players.length} ${players.length === 1 ? 'player' : 'players'}`}
          </p>
        </div>

        {/* Search Box */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
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
        ) : filteredPlayers.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "No players match your search" : "No players registered yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlayers.map((player) => (
              <Card key={player._id} className="shadow-card hover:shadow-hover transition-all duration-300 overflow-hidden">
                <CardHeader className="bg-gradient-accent pb-4">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-20 h-20 rounded-full bg-card flex items-center justify-center overflow-hidden shadow-lg cursor-pointer"
                      onClick={() => player.image_url && viewImage(player.image_url, `${player.name}'s Photo`)}
                    >
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={() => openEditDialog(player)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
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

        {/* Edit Player Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Player</DialogTitle>
              <DialogDescription>Update player details and image</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Image Section */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {newImagePreview ? (
                    <img src={newImagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : selectedPlayer?.image_url ? (
                    <img src={resolveFileUrl(selectedPlayer.image_url)} alt={selectedPlayer.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageSelect} className="hidden" />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" /> Change Photo
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input id="edit-phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-place">Place</Label>
                <Input id="edit-place" value={editForm.place} onChange={(e) => setEditForm({ ...editForm, place: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bat">Batsman</SelectItem>
                    <SelectItem value="ball">Bowler</SelectItem>
                    <SelectItem value="wk">Wicket Keeper</SelectItem>
                    <SelectItem value="all-rounder">All-Rounder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSavePlayer} disabled={saving}>
                {saving ? <Loader className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Image View Dialog */}
        <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{imageTitle}</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              <img src={currentImage} alt={imageTitle} className="max-h-[70vh] object-contain rounded-lg" />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Players;

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Users, Trophy, Hammer, BarChart3, ClipboardList, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { settingsAPI } from "@/lib/api";
import { toast } from "sonner";
import clubLogo from "@/assets/club-logo.png";

const AdminHome = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const settings = await settingsAPI.getSettings();
      setRegistrationOpen(settings.registration_open);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    }
  };

  const handleRegistrationToggle = async (checked: boolean) => {
    setIsUpdating(true);
    try {
      await settingsAPI.updateRegistrationStatus(checked);
      setRegistrationOpen(checked);
      toast.success(`Registration ${checked ? "opened" : "closed"} successfully`);
    } catch (error) {
      console.error("Failed to update registration status:", error);
      toast.error("Failed to update registration status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-primary">
      {/* Logout Button */}
      <div className="absolute top-4 right-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="bg-white/10 hover:bg-white/20 text-white border-white/30"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-in fade-in duration-700">
          <img
            src={clubLogo}
            alt="Riverstar Devarkovil Cricket Club"
            className="mx-auto mb-6 drop-shadow-2xl"
            style={{height:"20vh", objectFit: "cover"}}
          />
          <h1 className="text-5xl font-bold text-primary-foreground mb-4">
            DPL Admin Panel
          </h1>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            Manage registrations, players, teams, and auctions
          </p>
        </div>

        {/* Registration Toggle */}
        <div className="max-w-md mx-auto mb-8">
          <div className="bg-card rounded-xl p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">
                  Player Registration
                </h3>
                <p className="text-sm text-muted-foreground">
                  {registrationOpen ? "Registration is currently open" : "Registration is currently closed"}
                </p>
              </div>
              <Switch
                checked={registrationOpen}
                onCheckedChange={handleRegistrationToggle}
                disabled={isUpdating}
                className="data-[state=checked]:bg-green-500"
              />
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-12">
          <Link to="/admin/registrations" className="group">
            <div className="bg-card rounded-xl p-8 shadow-card hover:shadow-hover transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-gradient-accent rounded-full w-16 h-16 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                <ClipboardList className="w-8 h-8 text-card" />
              </div>
              <h3 className="text-2xl font-bold text-card-foreground mb-2 text-center">
                Registrations
              </h3>
              <p className="text-muted-foreground text-center">
                Review and approve player registrations
              </p>
            </div>
          </Link>

          <Link to="/admin/players" className="group">
            <div className="bg-card rounded-xl p-8 shadow-card hover:shadow-hover transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-gradient-accent rounded-full w-16 h-16 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-card" />
              </div>
              <h3 className="text-2xl font-bold text-card-foreground mb-2 text-center">
                Players
              </h3>
              <p className="text-muted-foreground text-center">
                View approved players
              </p>
            </div>
          </Link>

          <Link to="/admin/teams" className="group">
            <div className="bg-card rounded-xl p-8 shadow-card hover:shadow-hover transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-gradient-accent rounded-full w-16 h-16 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                <Trophy className="w-8 h-8 text-card" />
              </div>
              <h3 className="text-2xl font-bold text-card-foreground mb-2 text-center">
                Teams
              </h3>
              <p className="text-muted-foreground text-center">
                Create and manage teams
              </p>
            </div>
          </Link>

          <Link to="/admin/auction/summary" className="group">
            <div className="bg-card rounded-xl p-8 shadow-card hover:shadow-hover transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-gradient-accent rounded-full w-16 h-16 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                <BarChart3 className="w-8 h-8 text-card" />
              </div>
              <h3 className="text-2xl font-bold text-card-foreground mb-2 text-center">
                Auction Summary
              </h3>
              <p className="text-muted-foreground text-center">
                Track progress and team spends
              </p>
            </div>
          </Link>

          <Link to="/admin/auction/control" className="group">
            <div className="bg-card rounded-xl p-8 shadow-card hover:shadow-hover transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-gradient-accent rounded-full w-16 h-16 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                <Hammer className="w-8 h-8 text-card" />
              </div>
              <h3 className="text-2xl font-bold text-card-foreground mb-2 text-center">
                Auction Room
              </h3>
              <p className="text-muted-foreground text-center">
                Manage live bids and results
              </p>
            </div>
          </Link>
        </div>

        {/* Back to Public Home */}
        <div className="text-center mt-16">
          <Link to="/">
            <Button 
              variant="outline"
              size="lg" 
              className="text-lg px-8 py-6"
            >
              Back to Public Site
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;


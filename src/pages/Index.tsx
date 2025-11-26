import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, Trophy, UserPlus } from "lucide-react";
import clubLogo from "@/assets/club-logo.png";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-primary">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-in fade-in duration-700">
          <img 
            src={clubLogo} 
            alt="Riverstar Devarkovil Cricket Club" 
            className="w-48 h-48 mx-auto mb-6 drop-shadow-2xl"
          />
          <h1 className="text-5xl font-bold text-primary-foreground mb-4">
            Deverkovil Premier League
          </h1>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            Welcome to Calicut Village Cricket League Registration Portal
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-12">
          <Link to="/register" className="group">
            <div className="bg-card rounded-xl p-8 shadow-card hover:shadow-hover transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-gradient-accent rounded-full w-16 h-16 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                <UserPlus className="w-8 h-8 text-card" />
              </div>
              <h3 className="text-2xl font-bold text-card-foreground mb-2 text-center">
                Register Player
              </h3>
              <p className="text-muted-foreground text-center">
                Sign up for the cricket league
              </p>
            </div>
          </Link>

          <Link to="/players" className="group">
            <div className="bg-card rounded-xl p-8 shadow-card hover:shadow-hover transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-gradient-accent rounded-full w-16 h-16 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-card" />
              </div>
              <h3 className="text-2xl font-bold text-card-foreground mb-2 text-center">
                View Players
              </h3>
              <p className="text-muted-foreground text-center">
                Browse registered players
              </p>
            </div>
          </Link>

          <Link to="/teams" className="group">
            <div className="bg-card rounded-xl p-8 shadow-card hover:shadow-hover transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-gradient-accent rounded-full w-16 h-16 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                <Trophy className="w-8 h-8 text-card" />
              </div>
              <h3 className="text-2xl font-bold text-card-foreground mb-2 text-center">
                Manage Teams
              </h3>
              <p className="text-muted-foreground text-center">
                Create and view teams
              </p>
            </div>
          </Link>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <Link to="/register">
            <Button 
              size="lg" 
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
            >
              Register Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;

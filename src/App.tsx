import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicHome from "./pages/PublicHome";
import AdminHome from "./pages/AdminHome";
import AdminLogin from "./pages/AdminLogin";
import RegisterPlayer from "./pages/RegisterPlayer";
import Players from "./pages/Players";
import Teams from "./pages/Teams";
import NotFound from "./pages/NotFound";
import AuctionSummary from "./pages/AuctionSummary";
import AuctionControl from "./pages/AuctionControl";
import AuctionDisplay from "./pages/AuctionDisplay";
import Registrations from "./pages/Registrations";
import ApprovedPayments from "./pages/ApprovedPayments";
import AuctionOrder from "./pages/AuctionOrder";
import IconPlayers from "./pages/IconPlayers";
import PlayerBanners from "./pages/PlayerBanners";
import PlayerBannersPDF from "./pages/PlayerBannersPDF";
import TeamBanners from "./pages/TeamBanners";
import TeamBannersPDF from "./pages/TeamBannersPDF";
import TeamSquadList from "./pages/TeamSquadList";

const App = () => (
  <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicHome />} />
          <Route path="/register" element={<RegisterPlayer />} />
          <Route path="/auction-summary" element={<AuctionSummary />} />
          <Route path="/player-banners" element={<PlayerBanners />} />
          <Route path="/player-banners-pdf" element={<PlayerBannersPDF />} />
          <Route path="/team-banners" element={<TeamBanners />} />
          <Route path="/team-banners-pdf" element={<TeamBannersPDF />} />
          <Route path="/team-squad-list" element={<TeamSquadList />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute><AdminHome /></ProtectedRoute>} />
          <Route path="/admin/registrations" element={<ProtectedRoute><Registrations /></ProtectedRoute>} />
          <Route path="/admin/players" element={<ProtectedRoute><Players /></ProtectedRoute>} />
          <Route path="/admin/approved-payments" element={<ProtectedRoute><ApprovedPayments /></ProtectedRoute>} />
          <Route path="/admin/teams" element={<ProtectedRoute><Teams /></ProtectedRoute>} />
          <Route path="/admin/auction/control" element={<ProtectedRoute><AuctionControl /></ProtectedRoute>} />
          <Route path="/admin/auction/display" element={<ProtectedRoute><AuctionDisplay /></ProtectedRoute>} />
          <Route path="/admin/auction/order" element={<ProtectedRoute><AuctionOrder /></ProtectedRoute>} />
          <Route path="/admin/auction/icon-players" element={<ProtectedRoute><IconPlayers /></ProtectedRoute>} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </AuthProvider>
);

export default App;

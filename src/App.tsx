import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import InstallPrompt from "@/components/InstallPrompt";
import Index from "./pages/Index";
import SpanishWordle from "./pages/SpanishWordle";
import VerbMatch from "./pages/VerbMatch";
import VerbFishing from "./pages/VerbFishing";
import PalabraSurge from "./pages/PalabraSurge";
import DueloPalabras from "./pages/DueloPalabras";
import MemoriaMagica from "./pages/MemoriaMagica";
import Auth from "./pages/Auth";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import Classroom from "./pages/Classroom";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";
import CopyProtection from "./components/CopyProtection";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <InstallPrompt />
        <CopyProtection />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/wordle" element={<SpanishWordle />} />
            <Route path="/verb-match" element={<VerbMatch />} />
            <Route path="/verb-fishing" element={<VerbFishing />} />
            <Route path="/palabra-surge" element={<PalabraSurge />} />
            <Route path="/duelo" element={<DueloPalabras />} />
            <Route path="/memoria" element={<MemoriaMagica />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/classroom" element={<Classroom />} />
            <Route path="/user/:userId" element={<UserProfile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

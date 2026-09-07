import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AssignmentProvider } from "@/contexts/AssignmentContext";
import Index from "./pages/Index";
import Calendar from "./pages/Calendar";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Privacy from "./pages/Privacy";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AssignmentProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {/* Strip the trailing slash: BASE_URL is "/Calendar/" but the app is
            reached at "/Calendar" (no slash). React Router fails to strip a
            basename with a trailing slash and renders nothing → blank page. */}
        <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/+$/, "") || "/"}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </AssignmentProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

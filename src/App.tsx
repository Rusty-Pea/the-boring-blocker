import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";
import { Toaster } from "@/components/ui/sonner";
import { AppProvider, ToastContext } from "@/context/AppContext";
import { toast } from "sonner";

function App() {
  // Provide toast function to avoid circular dependency
  const toastValue = {
    toast: (args: { title: string; description?: string; duration?: number }) => {
      toast(args.title, {
        description: args.description,
        duration: args.duration,
      });
    },
  };

  return (
    <ToastContext.Provider value={toastValue}>
      <AppProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </Router>
      </AppProvider>
    </ToastContext.Provider>
  );
}

export default App;

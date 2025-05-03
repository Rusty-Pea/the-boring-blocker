
import { useToast } from "@/components/ui/use-toast";
import { AppProvider, ToastContext } from "@/context/AppContext";
import MainLayout from "@/components/MainLayout";

const Index = () => {
  const toastUtils = useToast();

  return (
    <ToastContext.Provider value={toastUtils}>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </ToastContext.Provider>
  );
};

export default Index;

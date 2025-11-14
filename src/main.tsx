import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { EmpresaProvider } from "@/contexts/EmpresaContext";

// Crear una instancia de QueryClient
const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="lipoout-ui-theme">
      <EmpresaProvider>
        <App />
      </EmpresaProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

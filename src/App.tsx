import { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import LoadingSpinner from './components/LoadingSpinner';
import { useEmpresa } from '@/contexts/EmpresaContext';
import { EmpresaSelector } from '@/components/EmpresaSelector';

// Lazy loading de las páginas
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Agenda = lazy(() => import('./pages/Agenda'));
const Clientes = lazy(() => import('./pages/Clientes'));
const Empleados = lazy(() => import('./pages/Empleados'));
const Articulos = lazy(() => import('./pages/Articulos'));
const Facturacion = lazy(() => import('./pages/Facturacion'));
const TPV = lazy(() => import('./pages/TPV'));
const Configuracion = lazy(() => import('./pages/Configuracion'));
const Marketing = lazy(() => import('./pages/Marketing'));
const MarketingWaha = lazy(() => import('./pages/MarketingWaha'));
const NotFound = lazy(() => import('./pages/NotFound'));

const App = () => {
  const { empresaActiva, empresasDisponibles, isLoading } = useEmpresa();

  // Mostrar selector si no hay empresa activa y hay múltiples empresas disponibles
  const mostrarSelector = !isLoading && !empresaActiva && empresasDisponibles.length > 1;

  return (
    <>
      <Toaster />
      <EmpresaSelector open={mostrarSelector} />
      <HashRouter>
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-screen">
              <LoadingSpinner />
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="agenda" element={<Agenda />} />
              <Route path="clientes" element={<Clientes />} />
              <Route path="empleados" element={<Empleados />} />
              <Route path="articulos" element={<Articulos />} />
              <Route path="facturacion" element={<Facturacion />} />
              <Route path="tpv" element={<TPV />} />
              <Route path="configuracion" element={<Configuracion />} />
              <Route path="marketing" element={<Marketing />} />
              <Route path="marketing-waha" element={<MarketingWaha />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </HashRouter>
    </>
  );
};

export default App;

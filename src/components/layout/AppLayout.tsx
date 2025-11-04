
import { Outlet } from 'react-router-dom';
import Header from './Header';
import { useUser } from '@/hooks/useAuth';
import AuthForm from '@/components/AuthForm';
import LoadingSpinner from '../LoadingSpinner';

export const AppLayout = () => {
  const { data: user, isLoading: isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <LoadingSpinner />
        <p className="mt-2 text-muted-foreground">Cargando sesión...</p>
      </div>
    );
  }

  if (!user) {
    // Si no hay usuario, el hook useUser redirigirá, 
    // pero mostramos un formulario de login como fallback.
    return <AuthForm onLoginSuccess={() => {}} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <Header />
      <main className="flex-1 p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
};

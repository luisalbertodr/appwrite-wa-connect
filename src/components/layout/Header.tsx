import { LogOut, User, Settings, Home, Calendar, Users, Archive, ShoppingCart, BarChart3, Mail, MessageCircle } from 'lucide-react';
import { useGetConfiguration } from '@/hooks/useConfiguration';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLogout, useUser } from '@/hooks/useAuth';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { NotificationsPopover } from './NotificationsPopover';
// Importamos las dependencias de Appwrite Storage
import { client, CONFIG_BUCKET_ID } from '@/lib/appwrite'; 

const navItems = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/agenda', label: 'Agenda', icon: Calendar },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/articulos', label: 'Artículos', icon: Archive },
  { href: '/tpv', label: 'TPV', icon: ShoppingCart },
  { href: '/facturacion', label: 'Facturas', icon: BarChart3 },
  { href: '/marketing', label: 'Marketing', icon: Mail },
  { href: '/marketing-waha', label: 'Marketing WhatsApp', icon: MessageCircle },
  { href: '/configuracion', label: 'Ajustes', icon: Settings },
];

// Componente para renderizar el logo usando la URL de Appwrite Storage
const LogoComponent = ({ logoUrl, logoText }: { logoUrl?: string, logoText?: string }) => {
  if (logoUrl && CONFIG_BUCKET_ID && client.config.endpoint && client.config.project) {
    
    // Construcción de la URL de visualización pública
    const fileViewUrl = `${client.config.endpoint}/storage/buckets/${CONFIG_BUCKET_ID}/files/${logoUrl}/view?project=${client.config.project}`;
    
    // CAMBIO DE ESTILO: h-full y w-auto para ocupar todo el alto manteniendo el aspecto
    return <img src={fileViewUrl} alt={logoText || "Logo de la Clínica"} className="h-full object-contain w-auto" />;
  }
  
  // Si no hay URL, o faltan constantes, usamos el icono SVG por defecto.
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" /></svg>;
};

const Header = () => {
  const { mutate: logoutUser, isPending: isLoggingOut } = useLogout();
  const { data: user } = useUser();
  const { data: clinicConfig } = useGetConfiguration(); // Obtenemos la configuración
  const location = useLocation();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Actualizar fecha y hora cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formattedDate = format(currentDateTime, "EEEE, d 'de' MMMM", { locale: es });
  const formattedTime = format(currentDateTime, 'HH:mm:ss');
  
  // Usamos los valores de configuración para el logo y el texto
  const logoUrl = clinicConfig?.logoUrl;
  const logoText = clinicConfig?.logoText || 'Lipoout'; // Fallback a 'Lipoout'
  const hideLogoText = clinicConfig?.hideLogoText ?? false; // NUEVO

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      {/* Logo */}
      {/* CAMBIO DE ESTILO: Se añade pt-2 (8px padding-top) para un pequeño margen superior */}
      <div className="flex items-center h-full pt-2"> 
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-primary h-full"> 
          <LogoComponent logoUrl={logoUrl} logoText={logoText} />
          
          {/* NUEVA LÓGICA: Ocultar si hideLogoText es true */}
          {!hideLogoText && (
             <span className="hidden sm:inline">{logoText}</span>
          )}
          
        </Link>
      </div>

      {/* Navegación Central */}
      <nav className="flex items-center gap-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.label}
              to={item.href}
              className={cn(
                'flex items-center justify-center p-2 rounded-lg transition-colors',
                isActive 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
              )}
              title={item.label}
            >
              <item.icon className="w-5 h-5" />
            </Link>
          );
        })}
      </nav>

      {/* Fecha/Hora, Notificaciones y Menú de Usuario */}
      <div className="flex items-center gap-4">
        {/* Fecha y Hora */}
        <div className="hidden md:flex flex-col items-end">
          <div className="text-sm font-semibold capitalize">
            {formattedDate}
          </div>
          <div className="text-lg font-bold tabular-nums">
            {formattedTime}
          </div>
        </div>

        {/* Notificaciones */}
        {user && <NotificationsPopover empleadoId={user.$id} />}

        {/* Menú de Usuario */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
               <Link to="/configuracion" className="flex items-center cursor-pointer w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuración</span>
               </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logoutUser()} disabled={isLoggingOut} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>{isLoggingOut ? 'Cerrando...' : 'Cerrar Sesión'}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
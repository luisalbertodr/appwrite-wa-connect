import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    // Estructura de botones reducida y compacta
    <div className="flex gap-2">
      <Button
        variant={theme === 'light' ? 'default' : 'outline'}
        size="sm" // Modo reducido
        onClick={() => setTheme('light')}
      >
        <Sun className="w-4 h-4 mr-1" />
        Claro
      </Button>
      <Button
        variant={theme === 'dark' ? 'default' : 'outline'}
        size="sm" // Modo reducido
        onClick={() => setTheme('dark')}
      >
        <Moon className="w-4 h-4 mr-1" />
        Oscuro
      </Button>
      <Button
        variant={theme === 'system' ? 'default' : 'outline'}
        size="sm" // Modo reducido
        onClick={() => setTheme('system')}
      >
        <Monitor className="w-4 h-4 mr-1" />
        Sistema
      </Button>
    </div>
  );
}
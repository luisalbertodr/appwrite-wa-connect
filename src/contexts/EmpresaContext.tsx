import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { databases, account, DATABASE_ID, USUARIO_EMPRESAS_COLLECTION_ID, EMPRESAS_COLLECTION_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { Empresa, UsuarioEmpresa } from '@/types';

interface EmpresaContextType {
  empresaActiva: Empresa | null;
  empresasDisponibles: Empresa[];
  isLoading: boolean;
  error: string | null;
  cambiarEmpresa: (empresaId: string) => Promise<void>;
  recargarEmpresas: () => Promise<void>;
}

const EmpresaContext = createContext<EmpresaContextType | undefined>(undefined);

const EMPRESA_ACTIVA_KEY = 'lipoout_empresa_activa_id';

interface EmpresaProviderProps {
  children: ReactNode;
}

export const EmpresaProvider: React.FC<EmpresaProviderProps> = ({ children }) => {
  const [empresaActiva, setEmpresaActiva] = useState<Empresa | null>(null);
  const [empresasDisponibles, setEmpresasDisponibles] = useState<Empresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar empresas disponibles para el usuario actual
  const cargarEmpresasDisponibles = async (): Promise<Empresa[]> => {
    try {
      // Obtener el usuario actual
      const user = await account.get();
      
      // Consultar las relaciones usuario-empresa
      const usuarioEmpresasResponse = await databases.listDocuments<UsuarioEmpresa>(
        DATABASE_ID,
        USUARIO_EMPRESAS_COLLECTION_ID,
        [
          Query.equal('user_id', user.$id),
          Query.equal('activo', true)
        ]
      );

      if (usuarioEmpresasResponse.documents.length === 0) {
        // Si no hay empresas asignadas, retornar array vacío en lugar de lanzar error
        // Esto permite que el usuario pueda crear una empresa si tiene permisos
        return [];
      }

      // Obtener los IDs de empresas
      const empresaIds = usuarioEmpresasResponse.documents.map(rel => rel.empresa_id);

      // Consultar las empresas completas
      const empresasResponse = await databases.listDocuments<Empresa>(
        DATABASE_ID,
        EMPRESAS_COLLECTION_ID,
        [
          Query.equal('$id', empresaIds),
          Query.equal('activa', true)
        ]
      );

      return empresasResponse.documents;
    } catch (err) {
      console.error('Error al cargar empresas disponibles:', err);
      throw err;
    }
  };

  // Cargar empresa por ID
  const cargarEmpresaPorId = async (empresaId: string): Promise<Empresa | null> => {
    try {
      const empresa = await databases.getDocument<Empresa>(
        DATABASE_ID,
        EMPRESAS_COLLECTION_ID,
        empresaId
      );
      return empresa;
    } catch (err) {
      console.error('Error al cargar empresa por ID:', err);
      return null;
    }
  };

  // Validar que el usuario tiene acceso a una empresa
  const validarAccesoEmpresa = async (empresaId: string): Promise<boolean> => {
    try {
      const user = await account.get();
      
      const response = await databases.listDocuments<UsuarioEmpresa>(
        DATABASE_ID,
        USUARIO_EMPRESAS_COLLECTION_ID,
        [
          Query.equal('user_id', user.$id),
          Query.equal('empresa_id', empresaId),
          Query.equal('activo', true)
        ]
      );

      return response.documents.length > 0;
    } catch (err) {
      console.error('Error al validar acceso a empresa:', err);
      return false;
    }
  };

  // Cambiar empresa activa
  const cambiarEmpresa = async (empresaId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Validar que el usuario tiene acceso
      const tieneAcceso = await validarAccesoEmpresa(empresaId);
      if (!tieneAcceso) {
        throw new Error('No tienes acceso a esta empresa');
      }

      // Cargar la empresa
      const empresa = await cargarEmpresaPorId(empresaId);
      if (!empresa) {
        throw new Error('Empresa no encontrada');
      }

      // Actualizar estado y localStorage
      setEmpresaActiva(empresa);
      localStorage.setItem(EMPRESA_ACTIVA_KEY, empresaId);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cambiar empresa';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Recargar lista de empresas disponibles
  const recargarEmpresas = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const empresas = await cargarEmpresasDisponibles();
      setEmpresasDisponibles(empresas);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al recargar empresas';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Inicializar al montar el componente
  useEffect(() => {
    const inicializar = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Verificar si hay un usuario autenticado
        try {
          await account.get();
        } catch {
          // No hay usuario autenticado, no hacer nada
          setIsLoading(false);
          return;
        }

        // Cargar empresas disponibles
        const empresas = await cargarEmpresasDisponibles();
        setEmpresasDisponibles(empresas);

        if (empresas.length === 0) {
          // No mostrar error crítico, simplemente permitir que el usuario cree una empresa
          // El error solo se mostrará si hay un problema real de permisos o conexión
          setError(null);
          setIsLoading(false);
          return;
        }

        // Intentar cargar empresa activa desde localStorage
        const empresaIdGuardada = localStorage.getItem(EMPRESA_ACTIVA_KEY);
        
        if (empresaIdGuardada) {
          // Verificar que la empresa guardada está en las disponibles
          const empresaGuardada = empresas.find(e => e.$id === empresaIdGuardada);
          if (empresaGuardada) {
            setEmpresaActiva(empresaGuardada);
            setIsLoading(false);
            return;
          }
        }

        // Si solo hay una empresa, seleccionarla automáticamente
        if (empresas.length === 1) {
          setEmpresaActiva(empresas[0]);
          localStorage.setItem(EMPRESA_ACTIVA_KEY, empresas[0].$id);
        }
        // Si hay múltiples empresas y no hay ninguna seleccionada,
        // dejar empresaActiva como null para que el usuario seleccione

      } catch (err) {
        console.error('Error al inicializar EmpresaContext:', err);
        const errorMsg = err instanceof Error ? err.message : 'Error al inicializar';
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    inicializar();
  }, []);

  const value: EmpresaContextType = {
    empresaActiva,
    empresasDisponibles,
    isLoading,
    error,
    cambiarEmpresa,
    recargarEmpresas,
  };

  return (
    <EmpresaContext.Provider value={value}>
      {children}
    </EmpresaContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useEmpresa = (): EmpresaContextType => {
  const context = useContext(EmpresaContext);
  if (context === undefined) {
    throw new Error('useEmpresa debe ser usado dentro de un EmpresaProvider');
  }
  return context;
};

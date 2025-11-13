import { LipooutDocument } from './index';

/**
 * Define una entidad de Empresa/Centro
 */
export interface Empresa extends LipooutDocument {
  nombre: string;
  nombre_legal: string;
  cif2: string;
  activa: boolean;
  // ID del documento de configuración que le pertenece (1:1)
  configuracion_id: string; 
  // Opcional: información de contacto para login/selección
  telefono?: string;
  email?: string;
}

export type EmpresaInput = Omit<Empresa, keyof LipooutDocument | 'configuracion_id'>;

import { LipooutDocument } from './index';

/**
 * Relación many-to-many entre usuarios y empresas
 */
export interface UsuarioEmpresa extends LipooutDocument {
  user_id: string;
  empresa_id: string;
  rol_empresa: 'propietario' | 'administrador' | 'empleado';
  activo: boolean;
}

export type UsuarioEmpresaInput = Omit<UsuarioEmpresa, keyof LipooutDocument>;

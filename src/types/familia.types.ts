import { LipooutDocument } from './index';

export interface Familia extends LipooutDocument {
  nombre: string;
  descripcion?: string;
  color: string; // Color primario para TPV/Agenda
  icono?: string;
}

export interface FamiliaInput {
  nombre: string;
  descripcion?: string;
  color: string;
  icono?: string;
}

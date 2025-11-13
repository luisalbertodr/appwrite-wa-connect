import { LipooutDocument } from './index';

export interface Familia extends LipooutDocument {
  nombre: string;
  descripcion?: string;
  color: string; // Color primario para TPV/Agenda
  icono?: string; 
  empresa_id: string; // <--- AÑADIDO: Requerido por la estructura DB (soluciona Error 2353 en Familia)
}

export interface FamiliaInput {
  nombre: string;
  descripcion?: string;
  color: string;
  icono?: string;
}
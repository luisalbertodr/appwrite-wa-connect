import { LipooutDocument } from './index';

// Tipo para registro en historial de citas
export interface HistorialCita {
  cita_id: string;
  fecha_hora: string;
  estado: string;
  articulos?: string; // JSON string con los artículos/servicios
  precio_total?: number;
  comentarios?: string;
  empleado_id?: string;
  fecha_eliminacion?: string; // Solo para citas eliminadas
  motivo_eliminacion?: string; // Solo para citas eliminadas
}

export interface Cliente extends LipooutDocument {
  codcli: string;
  nomcli?: string;
  ape1cli?: string;
  nombre_completo?: string;
  search_unified?: string; // Campo concatenado para búsqueda multi-campo
  email?: string;
  dnicli?: string;
  dircli?: string;
  codposcli?: string;
  pobcli?: string;
  procli?: string;
  tel1cli?: string;
  tel2cli?: string;
  fecnac?: string; // Formato YYYY-MM-DD
  enviar?: 0 | 1;
  sexo?: 'H' | 'M' | 'Otro';
  fecalta?: string; // Formato YYYY-MM-DD
  edad?: number;
  facturacion: number;
  intereses?: string[];
  importErrors?: string[];
  antecedentes_personales?: string; // Antecedentes personales del cliente (campo clínico)
  historial_citas?: HistorialCita[]; // Historial de citas del cliente
}

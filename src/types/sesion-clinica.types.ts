import { LipooutDocument } from './index';

export interface FotoSesion {
  foto_id: string;
  url: string;
  anotaciones?: string;
  descripcion?: string;
  fecha_captura: string;
}

export interface DocumentoFirmado {
  documento_id: string;
  plantilla_id?: string;
  nombre_documento: string;
  url: string;
  firma_cliente: string;
  fecha_firma: string;
}

export interface ArticuloAplicado {
  articulo_id: string;
  articulo_nombre: string;
  articulo_tipo: 'servicio' | 'producto';
  cantidad: number;
  precio_unitario: number;
  precio_total: number;
  desde_bono: boolean;
  bono_cliente_id?: string;
}

export interface SesionClinica extends LipooutDocument {
  cliente_id: string;
  cita_id?: string;
  empleado_id: string;

  fecha_sesion: string;
  edad_en_sesion: number;
  antecedentes_personales: string;
  motivo_consulta: string;
  tratamiento: string;
  proxima_cita?: string;

  articulos_aplicados: string; // JSON de ArticuloAplicado[]

  documentos_ids: string; // JSON de string[]
  fotos_ids: string; // JSON de string[]

  notas_adicionales?: string;
  visible_para_cliente: boolean;
}

export interface SesionClinicaInput {
  cliente_id: string;
  cita_id?: string;
  empleado_id: string;

  fecha_sesion: string;
  edad_en_sesion: number;
  antecedentes_personales: string;
  motivo_consulta: string;
  tratamiento: string;
  proxima_cita?: string;

  articulos_aplicados: string;
  documentos_ids: string;
  fotos_ids: string;

  notas_adicionales?: string;
  visible_para_cliente: boolean;
}

export interface SesionClinicaConDatos extends Omit<SesionClinica, 'articulos_aplicados' | 'documentos_ids' | 'fotos_ids'> {
  articulos_aplicados_data: ArticuloAplicado[];
  documentos_urls: string[];
  fotos_urls: string[];
}

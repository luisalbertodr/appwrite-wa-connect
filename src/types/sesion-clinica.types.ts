import { LipooutDocument } from './index';

// Tipo para fotos con anotaciones
export interface FotoSesion {
  foto_id: string; // ID del archivo en Appwrite Storage
  url: string; // URL pública del archivo
  anotaciones?: string; // JSON con datos de anotaciones de react-konva
  descripcion?: string;
  fecha_captura: string; // ISO 8601
}

// Tipo para documentos firmados
export interface DocumentoFirmado {
  documento_id: string; // ID del archivo PDF en Appwrite Storage
  plantilla_id?: string; // Referencia a plantilla si se usó una
  nombre_documento: string;
  url: string; // URL pública del documento
  firma_cliente: string; // Base64 de la firma del cliente
  fecha_firma: string; // ISO 8601
}

// Tipo para artículos aplicados o vendidos en la sesión
export interface ArticuloAplicado {
  articulo_id: string;
  articulo_nombre: string;
  articulo_tipo: 'servicio' | 'producto';
  cantidad: number;
  precio_unitario: number;
  precio_total: number;
  desde_bono: boolean; // Si se aplicó desde un bono (precio 0)
  bono_cliente_id?: string; // Referencia al bono usado si desde_bono es true
}

// Tipo para LEER sesiones clínicas desde Appwrite
export interface SesionClinica extends LipooutDocument {
  cliente_id: string;
  cita_id?: string; // Referencia a la cita si procede
  empleado_id: string; // Quien registró la sesión
  
  // Datos clínicos
  fecha_sesion: string; // ISO 8601
  edad_en_sesion: number; // Edad del cliente en el momento de la sesión
  antecedentes_personales: string; // Snapshot del AP del cliente en ese momento
  motivo_consulta: string;
  tratamiento: string; // Descripción del tratamiento realizado
  proxima_cita?: string; // Notas sobre próxima cita
  
  // Artículos aplicados/vendidos (JSON)
  articulos_aplicados: string; // JSON de ArticuloAplicado[]
  
  // IDs de archivos en Storage (JSON de arrays de strings)
  documentos_ids: string; // JSON de string[] - IDs de archivos en bucket documentos_firmados
  fotos_ids: string; // JSON de string[] - IDs de archivos en bucket fotos_sesiones
  
  // Metadatos
  notas_adicionales?: string;
  visible_para_cliente: boolean; // Si el cliente puede ver esta sesión en su portal
}

// Tipo para CREAR/ACTUALIZAR sesiones
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
  
  articulos_aplicados: string; // JSON de ArticuloAplicado[]
  documentos_ids: string; // JSON de string[] - IDs de archivos en Storage
  fotos_ids: string; // JSON de string[] - IDs de archivos en Storage
  
  notas_adicionales?: string;
  visible_para_cliente: boolean;
}

// Tipo auxiliar para trabajar con datos parseados (incluyendo URLs de Storage)
export interface SesionClinicaConDatos extends Omit<SesionClinica, 'articulos_aplicados' | 'documentos_ids' | 'fotos_ids'> {
  articulos_aplicados_data: ArticuloAplicado[];
  documentos_urls: string[]; // URLs de los documentos desde Storage
  fotos_urls: string[]; // URLs de las fotos desde Storage
}

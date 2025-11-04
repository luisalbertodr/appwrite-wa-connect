import { LipooutDocument } from './index';

// Tipos de plantillas disponibles
export type TipoPlantilla = 
  | 'consentimiento_informado'
  | 'autorizacion_tratamiento'
  | 'politica_privacidad'
  | 'contrato_servicio'
  | 'prescripcion_medica'
  | 'plan_tratamiento'
  | 'otro';

// Campos que pueden ser completados dinámicamente en la plantilla
export interface CampoPlantilla {
  nombre: string; // ej: "nombre_cliente", "fecha_sesion", "tratamiento"
  etiqueta: string; // Texto descriptivo para mostrar al usuario
  tipo: 'texto' | 'fecha' | 'numero' | 'lista' | 'texto_largo';
  obligatorio: boolean;
  valor_defecto?: string;
  opciones?: string[]; // Para tipo 'lista'
}

// Tipo para LEER plantillas desde Appwrite
export interface PlantillaDocumento extends LipooutDocument {
  nombre: string;
  tipo: TipoPlantilla;
  descripcion?: string;
  
  // Contenido de la plantilla (puede ser HTML o Markdown)
  contenido: string;
  
  // Campos dinámicos que se pueden completar (JSON)
  campos: string; // JSON de CampoPlantilla[]
  
  // Archivo PDF base (opcional, si se usa plantilla PDF existente)
  archivo_base_id?: string; // ID en Appwrite Storage
  archivo_base_url?: string;
  
  // Metadatos
  activa: boolean;
  requiere_firma: boolean;
  version: string; // ej: "1.0", "2.1"
  fecha_creacion?: string; // ISO 8601 (opcional - usar $createdAt de Appwrite)
  creado_por?: string; // empleado_id (opcional)
  ultima_modificacion?: string; // ISO 8601 (opcional - usar $updatedAt de Appwrite)
  modificado_por?: string; // empleado_id (opcional)
  
  // Uso
  veces_utilizada?: number; // (opcional)
}

// Tipo para CREAR/ACTUALIZAR plantillas
export interface PlantillaDocumentoInput {
  nombre: string;
  tipo: TipoPlantilla;
  descripcion?: string;
  contenido: string;
  campos: string; // JSON de CampoPlantilla[]
  archivo_base_id?: string;
  archivo_base_url?: string;
  activa?: boolean;
  requiere_firma?: boolean;
  version?: string;
  fecha_creacion?: string;
  creado_por?: string;
  ultima_modificacion?: string;
  modificado_por?: string;
  veces_utilizada?: number;
}

// Tipo auxiliar para trabajar con plantillas parseadas
export interface PlantillaDocumentoConDatos extends Omit<PlantillaDocumento, 'campos'> {
  campos_data: CampoPlantilla[];
}

// Tipo para los valores completados de una plantilla
export interface ValoresPlantilla {
  plantilla_id: string;
  valores: Record<string, string>; // { campo_nombre: valor }
}

// Plantillas predefinidas del sistema
export const PLANTILLAS_PREDEFINIDAS: Partial<PlantillaDocumentoInput>[] = [
  {
    nombre: 'Consentimiento Informado General',
    tipo: 'consentimiento_informado',
    descripcion: 'Consentimiento informado estándar para tratamientos estéticos',
    contenido: `
      <h1>CONSENTIMIENTO INFORMADO</h1>
      <p>Yo, <strong>{{nombre_cliente}}</strong>, con DNI <strong>{{dni_cliente}}</strong>, 
      declaro que he sido informado/a de manera clara y comprensible sobre el tratamiento 
      <strong>{{tratamiento}}</strong> que se me va a realizar.</p>
      
      <h2>Información del tratamiento</h2>
      <p>{{descripcion_tratamiento}}</p>
      
      <h2>Riesgos y complicaciones</h2>
      <p>{{riesgos}}</p>
      
      <h2>Consentimiento</h2>
      <p>He comprendido toda la información proporcionada y acepto someterme al tratamiento 
      descrito anteriormente.</p>
      
      <p>Fecha: {{fecha_sesion}}</p>
      <p>Firma del paciente:</p>
    `,
    campos: JSON.stringify([
      { nombre: 'nombre_cliente', etiqueta: 'Nombre completo del cliente', tipo: 'texto', obligatorio: true },
      { nombre: 'dni_cliente', etiqueta: 'DNI del cliente', tipo: 'texto', obligatorio: true },
      { nombre: 'tratamiento', etiqueta: 'Nombre del tratamiento', tipo: 'texto', obligatorio: true },
      { nombre: 'descripcion_tratamiento', etiqueta: 'Descripción del tratamiento', tipo: 'texto_largo', obligatorio: true },
      { nombre: 'riesgos', etiqueta: 'Riesgos y complicaciones', tipo: 'texto_largo', obligatorio: true },
      { nombre: 'fecha_sesion', etiqueta: 'Fecha de la sesión', tipo: 'fecha', obligatorio: true }
    ]),
    activa: true,
    requiere_firma: true,
    version: '1.0',
    veces_utilizada: 0
  },
  {
    nombre: 'Autorización Fotográfica',
    tipo: 'autorizacion_tratamiento',
    descripcion: 'Autorización para toma de fotografías antes/después',
    contenido: `
      <h1>AUTORIZACIÓN PARA FOTOGRAFÍAS</h1>
      <p>Yo, <strong>{{nombre_cliente}}</strong>, autorizo a la clínica a realizar fotografías 
      de mi tratamiento con fines de:</p>
      <ul>
        <li>Seguimiento médico del tratamiento</li>
        <li>Archivo clínico</li>
        <li>{{uso_fotografias}}</li>
      </ul>
      
      <p>Comprendo que las fotografías serán tratadas de forma confidencial según la normativa 
      de protección de datos.</p>
      
      <p>Fecha: {{fecha_sesion}}</p>
      <p>Firma del paciente:</p>
    `,
    campos: JSON.stringify([
      { nombre: 'nombre_cliente', etiqueta: 'Nombre completo del cliente', tipo: 'texto', obligatorio: true },
      { nombre: 'uso_fotografias', etiqueta: 'Uso adicional de fotografías', tipo: 'lista', obligatorio: true, 
        opciones: ['Solo archivo clínico', 'Publicación en redes sociales (anónimo)', 'Material promocional', 'Formación interna'] },
      { nombre: 'fecha_sesion', etiqueta: 'Fecha', tipo: 'fecha', obligatorio: true }
    ]),
    activa: true,
    requiere_firma: true,
    version: '1.0',
    veces_utilizada: 0
  }
];

import { Client, Databases, Account, Storage } from 'appwrite';

// Appwrite configuration - Los valores se leen desde window (configurados en index.html)
const APPWRITE_ENDPOINT = (window as any).VITE_APP_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = (window as any).VITE_APP_PROJECT_ID || 'YOUR_PROJECT_ID';

// Validar que las credenciales estén configuradas
if (!APPWRITE_PROJECT_ID || APPWRITE_PROJECT_ID === 'YOUR_PROJECT_ID') {
  console.error(
    '⚠️ Appwrite no configurado. Por favor, configura tus credenciales de Appwrite en index.html:\n' +
    '1. Crea un proyecto en https://cloud.appwrite.io\n' +
    '2. Añade estas líneas en el <head> de index.html:\n' +
    '   <script>\n' +
    '     window.VITE_APP_ENDPOINT = "https://cloud.appwrite.io/v1";\n' +
    '     window.VITE_APP_PROJECT_ID = "tu-project-id";\n' +
    '   </script>'
  );
}

export const client = new Client();

client
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

export const databases = new Databases(client);
export const account = new Account(client);
export const storage = new Storage(client);

export const PROJECT_ID = APPWRITE_PROJECT_ID;

// === IDS BASE DE DATOS ===
// Base de datos unificada Lipoout (incluye funcionalidad WAHA y gestión de clínica)
export const DATABASE_ID = '68b1d7530028045d94d3'; // Lipoout Database

// Colecciones consolidadas
export const CLIENTS_COLLECTION_ID = 'clientes';
export const CAMPAIGNS_COLLECTION_ID = 'campaigns';
export const TEMPLATES_COLLECTION_ID = 'templates';
export const CONFIG_COLLECTION_ID = 'configuracion';
export const WAHA_CONFIG_COLLECTION_ID = 'configuracion'; // Alias para claridad en funcionalidad WAHA
export const IMPORT_BUCKET_ID = 'lipoout';
export const IMPORT_LOGS_COLLECTION_ID = 'import_logs';
export const MESSAGE_LOGS_COLLECTION_ID = 'message_logs';
export const CAMPAIGN_PROGRESS_COLLECTION_ID = 'campaign_progress';

// Colecciones de gestión de clínica
export const CLIENTES_COLLECTION_ID = 'clientes';
export const EMPLEADOS_COLLECTION_ID = 'empleados';
export const ARTICULOS_COLLECTION_ID = 'articulos';
export const FAMILIAS_COLLECTION_ID = 'familias';
export const CITAS_COLLECTION_ID = 'citas';
export const FACTURAS_COLLECTION_ID = 'facturas';
export const CONFIGURATION_COLLECTION_ID = 'configuracion';
export const RECURSOS_COLLECTION_ID = 'recursos';
export const APARATOS_COLLECTION_ID = 'aparatos';
export const PROVEEDORES_COLLECTION_ID = 'proveedores';

// Colecciones clínicas (historial médico)
export const HISTORIAL_CLINICO_COLLECTION_ID = 'historial_clinico';
export const DOCUMENTOS_CLINICOS_COLLECTION_ID = 'documentos_clinicos';
export const CONSENTIMIENTOS_COLLECTION_ID = 'consentimientos';

// Storage buckets
export const LIPOOUT_BUCKET_ID = 'lipoout';

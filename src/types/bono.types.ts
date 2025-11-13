import { LipooutDocument } from './index';
import { TipoArticulo } from './articulo.types'; // Importación necesaria

/**
 * Composición de artículos dentro de un bono
 * Define qué servicios/productos incluye y cuántas sesiones/unidades
 */
export interface ComposicionBono {
  articulo_id: string;
  articulo_nombre: string;
  articulo_tipo: TipoArticulo; // MODIFICADO: Puede ser servicio, producto o bono
  cantidad: number; // Sesiones o unidades incluidas (usado en composicion_comprada)
  cantidad_restante: number; // Sesiones o unidades restantes (usado en composicion_restante)
  precio_unitario: number; // Precio por unidad/sesión
}

/**
 * Bono comprado por un cliente
 * Registra la compra y el consumo de bonos
 */
export interface BonoCliente extends LipooutDocument {
  // --- AÑADIDO PARA MULTIEMPRESA ---
  empresa_id: string; // <--- AÑADIDO: Causa raíz de los errores 2339 y 2353
  
  cliente_id: string;
  bono_articulo_id: string;
  bono_nombre: string;
  
  fecha_compra: string; // ISO 8601
  fecha_vencimiento?: string; // ISO 8601 (opcional)
  
  // Composición original al momento de compra
  composicion_comprada: string; // JSON de ComposicionBono[]
  // Composición actual (va disminuyendo con el uso)
  composicion_restante: string; // JSON de ComposicionBono[]
  
  factura_id?: string; // Referencia a factura de compra
  activo: boolean; // false si está agotado o vencido
  precio_pagado: number;
  usos_restantes: number; // Total de sesiones/unidades restantes
  
  // Metadata
  notas?: string;
  creado_por?: string; // empleado_id que vendió
}

/**
 * Tipo para crear/actualizar bonos de cliente (sin empresa_id, se inyecta en el servicio)
 */
export interface BonoClienteInput {
  cliente_id: string;
  bono_articulo_id: string;
  bono_nombre: string;
  fecha_compra: string;
  fecha_vencimiento?: string;
  composicion_comprada: string;
  composicion_restante: string;
  factura_id?: string;
  activo: boolean;
  precio_pagado: number;
  usos_restantes: number;
  notas?: string;
  creado_por?: string;
}

/**
 * Tipo extendido para visualización con datos parseados
 */
export interface BonoClienteConDatos extends Omit<BonoCliente, 'composicion_comprada' | 'composicion_restante'> {
  composicion_comprada_parsed: ComposicionBono[];
  composicion_restante_parsed: ComposicionBono[];
  dias_para_vencer?: number;
  porcentaje_usado: number;
  total_sesiones_originales: number;
  total_sesiones_restantes: number;
}

/**
 * Resultado de verificación de bono disponible
 */
export interface BonoDisponible {
  bono: BonoCliente;
  articulo_id: string;
  sesiones_disponibles: number;
  puede_usar: boolean;
  mensaje?: string;
}
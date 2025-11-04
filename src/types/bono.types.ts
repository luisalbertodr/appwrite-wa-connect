import { LipooutDocument } from './index';

export interface ComposicionBono {
  articulo_id: string;
  articulo_nombre: string;
  articulo_tipo: 'servicio' | 'producto';
  cantidad: number;
  cantidad_restante: number;
  precio_unitario: number;
}

export interface BonoCliente extends LipooutDocument {
  cliente_id: string;
  bono_articulo_id: string;
  bono_nombre: string;

  fecha_compra: string;
  fecha_vencimiento?: string;

  composicion_comprada: string; // JSON de ComposicionBono[]
  composicion_restante: string; // JSON de ComposicionBono[]

  factura_id?: string;
  activo: boolean;
  precio_pagado: number;
  usos_restantes: number;

  notas?: string;
  creado_por?: string;
}

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

export interface BonoClienteConDatos extends Omit<BonoCliente, 'composicion_comprada' | 'composicion_restante'> {
  composicion_comprada_parsed: ComposicionBono[];
  composicion_restante_parsed: ComposicionBono[];
  dias_para_vencer?: number;
  porcentaje_usado: number;
  total_sesiones_originales: number;
  total_sesiones_restantes: number;
}

export interface BonoDisponible {
  bono: BonoCliente;
  articulo_id: string;
  sesiones_disponibles: number;
  puede_usar: boolean;
  mensaje?: string;
}

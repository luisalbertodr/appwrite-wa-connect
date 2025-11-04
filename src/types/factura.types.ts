import { LipooutDocument, LipooutUserInput } from './index';
import { Cliente } from './cliente.types';
import { Articulo } from './articulo.types';
import { Empleado } from './empleado.types';

export type EstadoFactura = 'borrador' | 'finalizada' | 'cobrada' | 'anulada' | 'presupuesto';

export interface LineaFactura {
  [x: string]: any;
  id: string;
  articulo?: Articulo;
  articulo_id: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  tipoIva: number;
  ivaImporte: number;
  descuentoPorcentaje: number;
  totalSinIva: number;
  totalConIva: number;
}

export interface Factura extends LipooutDocument {
  numeroFactura: string;
  fechaEmision: string;
  fechaVencimiento?: string;
  estado: EstadoFactura;

  cliente_id: string;
  empleado_id?: string;

  lineas: string; // JSON.stringify(LineaFactura[])

  baseImponible: number;
  totalIva: number;
  totalFactura: number;
  descuentoGlobalPorcentaje?: number;
  importeDescuentoGlobal?: number;
  totalAPagar: number;

  metodoPago?: string;
  notas?: string;
  facturaRectificada_id?: string;
}

export interface FacturaInputData {
    numeroFactura: string;
    fechaEmision: string;
    fechaVencimiento?: string;
    estado: EstadoFactura;
    cliente_id: string;
    empleado_id?: string;
    lineas: string;
    baseImponible: number;
    totalIva: number;
    totalFactura: number;
    descuentoGlobalPorcentaje?: number;
    importeDescuentoGlobal?: number;
    totalAPagar: number;
    metodoPago?: string;
    notas?: string;
    facturaRectificada_id?: string;
}

export type CreateFacturaInput = LipooutUserInput<FacturaInputData>;
export type UpdateFacturaInput = Partial<CreateFacturaInput>;

export interface FacturaConDatos extends Omit<Factura, 'lineas'> {
  cliente?: Cliente;
  empleado?: Empleado;
  lineas: LineaFactura[];
}

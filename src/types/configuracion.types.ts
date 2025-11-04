export type DiaSemana = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';

export interface HorarioApertura {
  dia: DiaSemana;
  abierto: boolean;
  horaInicio: string; // Formato "HH:mm" (ej: "08:00")
  horaFin: string;    // Formato "HH:mm" (ej: "21:00")
}

export interface Configuracion {
  nombreClinica: string;
  direccion: string;
  cif: string;
  emailContacto: string;
  telefonoContacto: string;
  serieFactura: string;
  seriePresupuesto: string;
  ultimoNumeroFactura: number;
  ultimoNumeroPresupuesto: number;
  tipoIvaPredeterminado: number;
  horarios?: HorarioApertura[];
}

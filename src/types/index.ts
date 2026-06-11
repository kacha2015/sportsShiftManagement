import { Rol, EstadoTurno, DiaSemana } from "@prisma/client";

export type { Rol, EstadoTurno, DiaSemana };

export interface SessionUser {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
}

export interface TurnoWithDetails {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: EstadoTurno;
  notas: string | null;
  createdAt: string;
  usuario: {
    id: string;
    nombre: string;
    email: string;
  };
  instalacion: {
    id: string;
    nombre: string;
    deporte: string;
  };
}

export interface InstalacionWithSchedules {
  id: string;
  nombre: string;
  deporte: string;
  capacidad: number;
  activo: boolean;
  horarios: HorarioHabilitado[];
}

export interface HorarioHabilitado {
  id: string;
  instalacionId: string;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;
  slotMinutos: number;
}

export interface AvailableSlot {
  horaInicio: string;
  horaFin: string;
  disponible: boolean;
}

export interface DashboardStats {
  totalTurnos: number;
  turnosPendientes: number;
  turnosConfirmados: number;
  turnosCancelados: number;
  totalInstalaciones: number;
  totalUsuarios: number;
}

import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const registerSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export const bookingSchema = z.object({
  instalacionId: z.string().min(1, "Seleccioná una instalación"),
  fecha: z.string().min(1, "Seleccioná una fecha"),
  horaInicio: z.string().min(1, "Seleccioná un horario"),
});

export const facilitySchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  deporte: z.string().min(2, "El deporte es requerido"),
  capacidad: z.number().int().min(1, "La capacidad debe ser al menos 1"),
  activo: z.boolean(),
});

export const scheduleSchema = z.object({
  instalacionId: z.string().min(1, "Seleccioná una instalación"),
  diaSemana: z.string().min(1, "Seleccioná un día"),
  horaInicio: z.string().min(1, "Hora de inicio requerida"),
  horaFin: z.string().min(1, "Hora de fin requerida"),
  slotMinutos: z.number().int().min(15, "Mínimo 15 minutos").max(480, "Máximo 480 minutos"),
});

export const updateBookingStatusSchema = z.object({
  estado: z.enum(["PENDIENTE", "CONFIRMADO", "CANCELADO", "COMPLETADO"]),
});

export const updateBookingSchema = z.object({
  fecha: z.string().optional(),
  horaInicio: z.string().optional(),
  horaFin: z.string().optional(),
  estado: z.enum(["PENDIENTE", "CONFIRMADO", "CANCELADO", "COMPLETADO"]).optional(),
  notas: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;
export type FacilityInput = z.infer<typeof facilitySchema>;
export type ScheduleInput = z.infer<typeof scheduleSchema>;

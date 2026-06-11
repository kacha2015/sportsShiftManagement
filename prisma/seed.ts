import { PrismaClient, Rol, DiaSemana, EstadoTurno } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const adminPassword = await bcrypt.hash("admin123", 12);
  const userPassword = await bcrypt.hash("user123", 12);

  const admin = await prisma.usuario.upsert({
    where: { email: "admin@sports.com" },
    update: {},
    create: {
      nombre: "Administrador",
      email: "admin@sports.com",
      passwordHash: adminPassword,
      rol: Rol.ADMIN,
    },
  });

  const user = await prisma.usuario.upsert({
    where: { email: "usuario@sports.com" },
    update: {},
    create: {
      nombre: "Juan Pérez",
      email: "usuario@sports.com",
      passwordHash: userPassword,
      rol: Rol.USUARIO,
    },
  });

  console.log("Users created:", { admin: admin.email, user: user.email });

  const futbol = await prisma.instalacion.upsert({
    where: { id: "futbol-1" },
    update: {},
    create: {
      id: "futbol-1",
      nombre: "Cancha de Fútbol 1",
      deporte: "Fútbol",
      capacidad: 14,
      activo: true,
    },
  });

  const basquet = await prisma.instalacion.upsert({
    where: { id: "basquet-1" },
    update: {},
    create: {
      id: "basquet-1",
      nombre: "Cancha de Básquet",
      deporte: "Básquet",
      capacidad: 10,
      activo: true,
    },
  });

  const tenis = await prisma.instalacion.upsert({
    where: { id: "tenis-1" },
    update: {},
    create: {
      id: "tenis-1",
      nombre: "Cancha de Tenis 1",
      deporte: "Tenis",
      capacidad: 4,
      activo: true,
    },
  });

  const natacion = await prisma.instalacion.upsert({
    where: { id: "natacion-1" },
    update: {},
    create: {
      id: "natacion-1",
      nombre: "Piscina Olímpica",
      deporte: "Natación",
      capacidad: 30,
      activo: true,
    },
  });

  console.log("Facilities created");

  const scheduleData = [
    { instalacionId: "futbol-1", diaSemana: DiaSemana.LUNES, horaInicio: "08:00", horaFin: "22:00", slotMinutos: 60 },
    { instalacionId: "futbol-1", diaSemana: DiaSemana.MARTES, horaInicio: "08:00", horaFin: "22:00", slotMinutos: 60 },
    { instalacionId: "futbol-1", diaSemana: DiaSemana.MIERCOLES, horaInicio: "08:00", horaFin: "22:00", slotMinutos: 60 },
    { instalacionId: "futbol-1", diaSemana: DiaSemana.JUEVES, horaInicio: "08:00", horaFin: "22:00", slotMinutos: 60 },
    { instalacionId: "futbol-1", diaSemana: DiaSemana.VIERNES, horaInicio: "08:00", horaFin: "22:00", slotMinutos: 60 },
    { instalacionId: "futbol-1", diaSemana: DiaSemana.SABADO, horaInicio: "09:00", horaFin: "20:00", slotMinutos: 60 },
    { instalacionId: "basquet-1", diaSemana: DiaSemana.LUNES, horaInicio: "09:00", horaFin: "21:00", slotMinutos: 60 },
    { instalacionId: "basquet-1", diaSemana: DiaSemana.MARTES, horaInicio: "09:00", horaFin: "21:00", slotMinutos: 60 },
    { instalacionId: "basquet-1", diaSemana: DiaSemana.MIERCOLES, horaInicio: "09:00", horaFin: "21:00", slotMinutos: 60 },
    { instalacionId: "basquet-1", diaSemana: DiaSemana.JUEVES, horaInicio: "09:00", horaFin: "21:00", slotMinutos: 60 },
    { instalacionId: "basquet-1", diaSemana: DiaSemana.VIERNES, horaInicio: "09:00", horaFin: "21:00", slotMinutos: 60 },
    { instalacionId: "tenis-1", diaSemana: DiaSemana.LUNES, horaInicio: "10:00", horaFin: "20:00", slotMinutos: 90 },
    { instalacionId: "tenis-1", diaSemana: DiaSemana.MARTES, horaInicio: "10:00", horaFin: "20:00", slotMinutos: 90 },
    { instalacionId: "tenis-1", diaSemana: DiaSemana.MIERCOLES, horaInicio: "10:00", horaFin: "20:00", slotMinutos: 90 },
    { instalacionId: "tenis-1", diaSemana: DiaSemana.JUEVES, horaInicio: "10:00", horaFin: "20:00", slotMinutos: 90 },
    { instalacionId: "tenis-1", diaSemana: DiaSemana.VIERNES, horaInicio: "10:00", horaFin: "20:00", slotMinutos: 90 },
    { instalacionId: "natacion-1", diaSemana: DiaSemana.LUNES, horaInicio: "06:00", horaFin: "22:00", slotMinutos: 60 },
    { instalacionId: "natacion-1", diaSemana: DiaSemana.MARTES, horaInicio: "06:00", horaFin: "22:00", slotMinutos: 60 },
    { instalacionId: "natacion-1", diaSemana: DiaSemana.MIERCOLES, horaInicio: "06:00", horaFin: "22:00", slotMinutos: 60 },
    { instalacionId: "natacion-1", diaSemana: DiaSemana.JUEVES, horaInicio: "06:00", horaFin: "22:00", slotMinutos: 60 },
    { instalacionId: "natacion-1", diaSemana: DiaSemana.VIERNES, horaInicio: "06:00", horaFin: "22:00", slotMinutos: 60 },
    { instalacionId: "natacion-1", diaSemana: DiaSemana.SABADO, horaInicio: "08:00", horaFin: "18:00", slotMinutos: 60 },
  ];

  for (const schedule of scheduleData) {
    await prisma.horarioHabilitado.upsert({
      where: {
        instalacionId_diaSemana_horaInicio: {
          instalacionId: schedule.instalacionId,
          diaSemana: schedule.diaSemana,
          horaInicio: schedule.horaInicio,
        },
      },
      update: {},
      create: schedule,
    });
  }

  console.log("Schedules created");

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const sampleBookings = [
    {
      usuarioId: user.id,
      instalacionId: "futbol-1",
      fecha: tomorrow,
      horaInicio: "10:00",
      horaFin: "11:00",
      estado: EstadoTurno.CONFIRMADO,
    },
    {
      usuarioId: user.id,
      instalacionId: "basquet-1",
      fecha: nextWeek,
      horaInicio: "14:00",
      horaFin: "15:00",
      estado: EstadoTurno.PENDIENTE,
    },
  ];

  for (const booking of sampleBookings) {
    await prisma.turno.upsert({
      where: {
        instalacionId_fecha_horaInicio: {
          instalacionId: booking.instalacionId,
          fecha: booking.fecha,
          horaInicio: booking.horaInicio,
        },
      },
      update: {},
      create: booking,
    });
  }

  console.log("Sample bookings created");
  console.log("Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

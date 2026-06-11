import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bookingSchema } from "@/lib/validations";
import { sendEmail, bookingCreatedEmail } from "@/lib/email";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const estado = searchParams.get("estado");
    const fecha = searchParams.get("fecha");
    const instalacionId = searchParams.get("instalacionId");

    const where: any = {};

    if ((session.user as any).rol === "USUARIO") {
      where.usuarioId = (session.user as any).id;
    } else if (userId) {
      where.usuarioId = userId;
    }

    if (estado) where.estado = estado;
    if (instalacionId) where.instalacionId = instalacionId;
    if (fecha) {
      const date = new Date(fecha);
      where.fecha = date;
    }

    const turnos = await prisma.turno.findMany({
      where,
      include: {
        usuario: { select: { id: true, nombre: true, email: true } },
        instalacion: { select: { id: true, nombre: true, deporte: true } },
      },
      orderBy: [{ fecha: "desc" }, { horaInicio: "asc" }],
    });

    return NextResponse.json(turnos);
  } catch (error) {
    console.error("GET bookings error:", error);
    return NextResponse.json(
      { error: "Error al obtener turnos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const result = bookingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { instalacionId, fecha, horaInicio } = result.data;
    const userId = (session.user as any).id;

    const instalacion = await prisma.instalacion.findUnique({
      where: { id: instalacionId },
    });

    if (!instalacion || !instalacion.activo) {
      return NextResponse.json(
        { error: "La instalación no existe o está inactiva" },
        { status: 400 }
      );
    }

    const bookingDate = new Date(fecha);
    const dayOfWeek = bookingDate.getDay();
    const diaSemanaMap: Record<number, string> = {
      0: "DOMINGO",
      1: "LUNES",
      2: "MARTES",
      3: "MIERCOLES",
      4: "JUEVES",
      5: "VIERNES",
      6: "SABADO",
    };

    const horarioHabilitado = await prisma.horarioHabilitado.findFirst({
      where: {
        instalacionId,
        diaSemana: diaSemanaMap[dayOfWeek] as any,
        horaInicio: { lte: horaInicio },
        horaFin: { gt: horaInicio },
      },
    });

    if (!horarioHabilitado) {
      return NextResponse.json(
        { error: "La instalación no está habilitada en ese horario" },
        { status: 400 }
      );
    }

    const [hour, minutes] = horaInicio.split(":").map(Number);
    const endMinutes = minutes + (horarioHabilitado.slotMinutos || 60);
    const endHour = hour + Math.floor(endMinutes / 60);
    const finalMinutes = endMinutes % 60;
    const horaFin = `${String(endHour).padStart(2, "0")}:${String(finalMinutes).padStart(2, "0")}`;

    const existingBooking = await prisma.turno.findUnique({
      where: {
        instalacionId_fecha_horaInicio: {
          instalacionId,
          fecha: bookingDate,
          horaInicio,
        },
      },
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: "Ya existe una reserva en ese horario" },
        { status: 400 }
      );
    }

    const maxBookings = parseInt(process.env.MAX_BOOKINGS_PER_WEEK || "5");
    const weekStart = new Date(bookingDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weeklyBookings = await prisma.turno.count({
      where: {
        usuarioId: userId,
        fecha: { gte: weekStart, lte: weekEnd },
        estado: { not: "CANCELADO" },
      },
    });

    if (weeklyBookings >= maxBookings) {
      return NextResponse.json(
        { error: `Máximo ${maxBookings} reservas por semana` },
        { status: 400 }
      );
    }

    const turno = await prisma.turno.create({
      data: {
        usuarioId: userId,
        instalacionId,
        fecha: bookingDate,
        horaInicio,
        horaFin,
        estado: "PENDIENTE",
      },
      include: {
        usuario: { select: { id: true, nombre: true, email: true } },
        instalacion: { select: { id: true, nombre: true, deporte: true } },
      },
    });

    const admins = await prisma.usuario.findMany({
      where: { rol: "ADMIN" },
      select: { email: true },
    });

    if (admins.length > 0 && process.env.EMAIL_SERVER_HOST) {
      const dateFormatted = format(bookingDate, "dd/MM/yyyy", { locale: es });
      const html = bookingCreatedEmail({
        userName: turno.usuario.nombre,
        userEmail: turno.usuario.email,
        facilityName: turno.instalacion.nombre,
        sport: turno.instalacion.deporte,
        date: dateFormatted,
        time: `${horaInicio} - ${horaFin}`,
      });

      for (const admin of admins) {
        await sendEmail({
          to: admin.email,
          subject: `Nueva reserva - ${turno.instalacion.nombre}`,
          html,
        });
      }
    }

    return NextResponse.json(turno, { status: 201 });
  } catch (error) {
    console.error("POST booking error:", error);
    return NextResponse.json(
      { error: "Error al crear turno" },
      { status: 500 }
    );
  }
}

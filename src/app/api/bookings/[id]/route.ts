import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateBookingSchema, updateBookingStatusSchema } from "@/lib/validations";
import { sendEmail, bookingStatusEmail } from "@/lib/email";
import { format } from "date-fns";
import { es } from "date-fns/locale";

async function sendStatusEmail(turno: any, newStatus: string) {
  if (!process.env.EMAIL_SERVER_HOST) return;

  const dateFormatted = format(new Date(turno.fecha), "dd/MM/yyyy", { locale: es });
  const html = bookingStatusEmail({
    userName: turno.usuario.nombre,
    facilityName: turno.instalacion.nombre,
    sport: turno.instalacion.deporte,
    date: dateFormatted,
    time: `${turno.horaInicio} - ${turno.horaFin}`,
    status: newStatus,
  });

  await sendEmail({
    to: turno.usuario.email,
    subject: `Reserva ${newStatus.toLowerCase()} - ${turno.instalacion.nombre}`,
    html,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const turno = await prisma.turno.findUnique({
      where: { id: params.id },
      include: {
        usuario: { select: { id: true, nombre: true, email: true } },
        instalacion: { select: { id: true, nombre: true, deporte: true } },
      },
    });

    if (!turno) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }

    if ((session.user as any).rol === "USUARIO" && turno.usuarioId !== (session.user as any).id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    return NextResponse.json(turno);
  } catch (error) {
    console.error("GET booking error:", error);
    return NextResponse.json({ error: "Error al obtener turno" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const turno = await prisma.turno.findUnique({
      where: { id: params.id },
      include: {
        usuario: { select: { id: true, nombre: true, email: true } },
        instalacion: { select: { id: true, nombre: true, deporte: true } },
      },
    });
    if (!turno) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }

    const isAdmin = (session.user as any).rol === "ADMIN";
    const isOwner = turno.usuarioId === (session.user as any).id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();

    if (isAdmin) {
      const result = updateBookingSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error.issues[0].message },
          { status: 400 }
        );
      }

      const updateData: any = {};
      if (result.data.fecha) updateData.fecha = new Date(result.data.fecha);
      if (result.data.horaInicio) updateData.horaInicio = result.data.horaInicio;
      if (result.data.horaFin) updateData.horaFin = result.data.horaFin;
      if (result.data.estado) updateData.estado = result.data.estado;
      if (result.data.notas !== undefined) updateData.notas = result.data.notas;

      const updatedTurno = await prisma.turno.update({
        where: { id: params.id },
        data: updateData,
        include: {
          usuario: { select: { id: true, nombre: true, email: true } },
          instalacion: { select: { id: true, nombre: true, deporte: true } },
        },
      });

      if (result.data.estado && result.data.estado !== turno.estado) {
        await sendStatusEmail(updatedTurno, result.data.estado);
      }

      return NextResponse.json(updatedTurno);
    }

    const result = updateBookingStatusSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    if (result.data.estado !== "CANCELADO") {
      return NextResponse.json(
        { error: "Solo podés cancelar tu turno" },
        { status: 403 }
      );
    }

    const advanceDays = parseInt(process.env.BOOKING_ADVANCE_DAYS || "1");
    const bookingDateTime = new Date(turno.fecha);
    const [hour, min] = turno.horaInicio.split(":").map(Number);
    bookingDateTime.setHours(hour, min, 0, 0);

    const now = new Date();
    const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilBooking < advanceDays * 24) {
      return NextResponse.json(
        { error: `No podés cancelar con menos de ${advanceDays} día(s) de anticipación` },
        { status: 400 }
      );
    }

    const updatedTurno = await prisma.turno.update({
      where: { id: params.id },
      data: { estado: "CANCELADO" },
      include: {
        usuario: { select: { id: true, nombre: true, email: true } },
        instalacion: { select: { id: true, nombre: true, deporte: true } },
      },
    });

    await sendStatusEmail(updatedTurno, "CANCELADO");

    return NextResponse.json(updatedTurno);
  } catch (error) {
    console.error("PATCH booking error:", error);
    return NextResponse.json({ error: "Error al actualizar turno" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).rol !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await prisma.turno.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Turno eliminado" });
  } catch (error) {
    console.error("DELETE booking error:", error);
    return NextResponse.json({ error: "Error al eliminar turno" }, { status: 500 });
  }
}

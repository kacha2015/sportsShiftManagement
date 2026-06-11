import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const instalacionId = searchParams.get("instalacionId");
    const fecha = searchParams.get("fecha");

    if (!instalacionId || !fecha) {
      return NextResponse.json(
        { error: "instalacionId y fecha son requeridos" },
        { status: 400 }
      );
    }

    const date = new Date(fecha);
    const dayOfWeek = date.getDay();
    const diaSemanaMap: Record<number, string> = {
      0: "DOMINGO",
      1: "LUNES",
      2: "MARTES",
      3: "MIERCOLES",
      4: "JUEVES",
      5: "VIERNES",
      6: "SABADO",
    };

    const horarios = await prisma.horarioHabilitado.findMany({
      where: {
        instalacionId,
        diaSemana: diaSemanaMap[dayOfWeek] as any,
      },
    });

    if (horarios.length === 0) {
      return NextResponse.json([]);
    }

    const existingBookings = await prisma.turno.findMany({
      where: {
        instalacionId,
        fecha: date,
        estado: { not: "CANCELADO" },
      },
      select: { horaInicio: true, horaFin: true },
    });

    const slots: { horaInicio: string; horaFin: string; disponible: boolean }[] = [];

    for (const horario of horarios) {
      const [startH, startM] = horario.horaInicio.split(":").map(Number);
      const [endH, endM] = horario.horaFin.split(":").map(Number);
      const slotMinutes = horario.slotMinutos || 60;

      let currentMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      while (currentMinutes + slotMinutes <= endMinutes) {
        const slotStart = `${String(Math.floor(currentMinutes / 60)).padStart(2, "0")}:${String(currentMinutes % 60).padStart(2, "0")}`;
        const slotEndMinutes = currentMinutes + slotMinutes;
        const slotEnd = `${String(Math.floor(slotEndMinutes / 60)).padStart(2, "0")}:${String(slotEndMinutes % 60).padStart(2, "0")}`;

        const isBooked = existingBookings.some(
          (b) => b.horaInicio === slotStart
        );

        slots.push({
          horaInicio: slotStart,
          horaFin: slotEnd,
          disponible: !isBooked,
        });

        currentMinutes += slotMinutes;
      }
    }

    return NextResponse.json(slots);
  } catch (error) {
    console.error("GET available-slots error:", error);
    return NextResponse.json(
      { error: "Error al obtener slots disponibles" },
      { status: 500 }
    );
  }
}

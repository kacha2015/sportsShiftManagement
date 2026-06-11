import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scheduleSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const instalacionId = searchParams.get("instalacionId");

    const where: any = {};
    if (instalacionId) where.instalacionId = instalacionId;

    const horarios = await prisma.horarioHabilitado.findMany({
      where,
      include: {
        instalacion: { select: { id: true, nombre: true, deporte: true } },
      },
      orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }],
    });

    return NextResponse.json(horarios);
  } catch (error) {
    console.error("GET schedules error:", error);
    return NextResponse.json(
      { error: "Error al obtener horarios" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).rol !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const result = scheduleSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const existing = await prisma.horarioHabilitado.findFirst({
      where: {
        instalacionId: result.data.instalacionId,
        diaSemana: result.data.diaSemana as any,
        horaInicio: result.data.horaInicio,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un horario para esa instalación, día y hora" },
        { status: 400 }
      );
    }

    const horario = await prisma.horarioHabilitado.create({
      data: {
        instalacionId: result.data.instalacionId,
        diaSemana: result.data.diaSemana as any,
        horaInicio: result.data.horaInicio,
        horaFin: result.data.horaFin,
        slotMinutos: result.data.slotMinutos,
      },
    });

    return NextResponse.json(horario, { status: 201 });
  } catch (error) {
    console.error("POST schedule error:", error);
    return NextResponse.json(
      { error: "Error al crear horario" },
      { status: 500 }
    );
  }
}

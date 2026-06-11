import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scheduleSchema } from "@/lib/validations";
import { DiaSemana } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const horario = await prisma.horarioHabilitado.findUnique({
      where: { id: params.id },
      include: {
        instalacion: { select: { id: true, nombre: true, deporte: true } },
      },
    });

    if (!horario) {
      return NextResponse.json(
        { error: "Horario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(horario);
  } catch (error) {
    console.error("GET schedule error:", error);
    return NextResponse.json(
      { error: "Error al obtener horario" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).rol !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const result = scheduleSchema.partial().safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const existing = await prisma.horarioHabilitado.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Horario no encontrado" },
        { status: 404 }
      );
    }

    if (result.data.instalacionId || result.data.diaSemana || result.data.horaInicio) {
      const checkInstalacion = result.data.instalacionId || existing.instalacionId;
      const checkDia = result.data.diaSemana || existing.diaSemana;
      const checkHora = result.data.horaInicio || existing.horaInicio;

      const duplicate = await prisma.horarioHabilitado.findFirst({
        where: {
          instalacionId: checkInstalacion,
          diaSemana: checkDia as DiaSemana,
          horaInicio: checkHora,
          id: { not: params.id },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "Ya existe un horario para esa instalación, día y hora" },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (result.data.instalacionId) updateData.instalacionId = result.data.instalacionId;
    if (result.data.diaSemana) updateData.diaSemana = result.data.diaSemana;
    if (result.data.horaInicio) updateData.horaInicio = result.data.horaInicio;
    if (result.data.horaFin) updateData.horaFin = result.data.horaFin;
    if (result.data.slotMinutos) updateData.slotMinutos = result.data.slotMinutos;

    const horario = await prisma.horarioHabilitado.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(horario);
  } catch (error) {
    console.error("PATCH schedule error:", error);
    return NextResponse.json(
      { error: "Error al actualizar horario" },
      { status: 500 }
    );
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

    await prisma.horarioHabilitado.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Horario eliminado" });
  } catch (error) {
    console.error("DELETE schedule error:", error);
    return NextResponse.json(
      { error: "Error al eliminar horario" },
      { status: 500 }
    );
  }
}

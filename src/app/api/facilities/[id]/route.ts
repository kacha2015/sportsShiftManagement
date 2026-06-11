import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { facilitySchema } from "@/lib/validations";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const instalacion = await prisma.instalacion.findUnique({
      where: { id: params.id },
      include: { horarios: true },
    });

    if (!instalacion) {
      return NextResponse.json(
        { error: "Instalación no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(instalacion);
  } catch (error) {
    console.error("GET facility error:", error);
    return NextResponse.json(
      { error: "Error al obtener instalación" },
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
    const result = facilitySchema.partial().safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const instalacion = await prisma.instalacion.update({
      where: { id: params.id },
      data: result.data,
    });

    return NextResponse.json(instalacion);
  } catch (error) {
    console.error("PATCH facility error:", error);
    return NextResponse.json(
      { error: "Error al actualizar instalación" },
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

    await prisma.instalacion.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Instalación eliminada" });
  } catch (error) {
    console.error("DELETE facility error:", error);
    return NextResponse.json(
      { error: "Error al eliminar instalación" },
      { status: 500 }
    );
  }
}

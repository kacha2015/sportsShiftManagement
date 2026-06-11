import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { facilitySchema } from "@/lib/validations";

export async function GET() {
  try {
    const instalaciones = await prisma.instalacion.findMany({
      include: { horarios: true },
      orderBy: { nombre: "asc" },
    });

    return NextResponse.json(instalaciones);
  } catch (error) {
    console.error("GET facilities error:", error);
    return NextResponse.json(
      { error: "Error al obtener instalaciones" },
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
    const result = facilitySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const instalacion = await prisma.instalacion.create({
      data: result.data,
    });

    return NextResponse.json(instalacion, { status: 201 });
  } catch (error) {
    console.error("POST facility error:", error);
    return NextResponse.json(
      { error: "Error al crear instalación" },
      { status: 500 }
    );
  }
}

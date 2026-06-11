"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TurnoWithDetails } from "@/types";
import { Calendar, X } from "lucide-react";

export default function MyBookingsPage() {
  useSession();
  const [turnos, setTurnos] = useState<TurnoWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelDialog, setCancelDialog] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchTurnos();
  }, []);

  async function fetchTurnos() {
    try {
      const res = await fetch("/api/bookings");
      if (res.ok) {
        const data = await res.json();
        setTurnos(data);
      }
    } catch {
      toast.error("Error al cargar turnos");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(id: string) {
    setCancelling(true);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "CANCELADO" }),
      });

      if (!res.ok) {
        const result = await res.json();
        toast.error(result.error || "Error al cancelar turno");
        return;
      }

      toast.success("Turno cancelado");
      setCancelDialog(null);
      fetchTurnos();
    } catch {
      toast.error("Error al cancelar turno");
    } finally {
      setCancelling(false);
    }
  }

  function getEstadoBadge(estado: string) {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      PENDIENTE: "outline",
      CONFIRMADO: "default",
      CANCELADO: "destructive",
      COMPLETADO: "secondary",
    };
    const colors: Record<string, string> = {
      PENDIENTE: "border-yellow-500 text-yellow-700",
      CONFIRMADO: "bg-green-100 text-green-700 border-green-300",
      CANCELADO: "bg-red-100 text-red-700 border-red-300",
      COMPLETADO: "bg-blue-100 text-blue-700 border-blue-300",
    };
    return (
      <Badge variant={variants[estado] || "outline"} className={colors[estado]}>
        {estado}
      </Badge>
    );
  }

  function canCancel(turno: TurnoWithDetails) {
    if (turno.estado !== "PENDIENTE" && turno.estado !== "CONFIRMADO") {
      return false;
    }
    const bookingDate = new Date(turno.fecha);
    const [hour, min] = turno.horaInicio.split(":").map(Number);
    bookingDate.setHours(hour, min, 0, 0);
    const advanceDays = parseInt(process.env.NEXT_PUBLIC_BOOKING_ADVANCE_DAYS || "1");
    const hoursUntil = (bookingDate.getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntil >= advanceDays * 24;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando turnos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis Turnos</h1>
        <p className="text-gray-500">Gestioná tus reservas de turnos</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Mis Reservas ({turnos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {turnos.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No tenés turnos reservados
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instalación</TableHead>
                    <TableHead>Deporte</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Horario</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {turnos.map((turno) => (
                    <TableRow key={turno.id}>
                      <TableCell className="font-medium">
                        {turno.instalacion.nombre}
                      </TableCell>
                      <TableCell>{turno.instalacion.deporte}</TableCell>
                      <TableCell>
                        {format(new Date(turno.fecha), "dd/MM/yyyy", {
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell>
                        {turno.horaInicio} - {turno.horaFin}
                      </TableCell>
                      <TableCell>{getEstadoBadge(turno.estado)}</TableCell>
                      <TableCell className="text-right">
                        {canCancel(turno) && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setCancelDialog(turno.id)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancelar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!cancelDialog}
        onOpenChange={() => setCancelDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Turno</DialogTitle>
            <DialogDescription>
              ¿Estás seguro que querés cancelar este turno? Esta acción no se
              puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialog(null)}>
              No, mantener
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelDialog && handleCancel(cancelDialog)}
              disabled={cancelling}
            >
              {cancelling ? "Cancelando..." : "Sí, cancelar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

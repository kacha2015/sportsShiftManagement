"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TurnoWithDetails } from "@/types";
import { Calendar, Check, X, Edit } from "lucide-react";

export default function AdminBookingsPage() {
  const [turnos, setTurnos] = useState<TurnoWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    estado: "",
    fecha: "",
    instalacionId: "",
  });
  const [editDialog, setEditDialog] = useState<TurnoWithDetails | null>(null);
  const [editData, setEditData] = useState({
    fecha: "",
    horaInicio: "",
    estado: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTurnos();
  }, [filters]);

  async function fetchTurnos() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.estado) params.set("estado", filters.estado);
      if (filters.fecha) params.set("fecha", filters.fecha);
      if (filters.instalacionId) params.set("instalacionId", filters.instalacionId);

      const res = await fetch(`/api/bookings?${params}`);
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

  async function handleUpdateStatus(id: string, estado: string) {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });

      if (!res.ok) {
        const result = await res.json();
        toast.error(result.error || "Error al actualizar turno");
        return;
      }

      toast.success("Turno actualizado");
      fetchTurnos();
    } catch {
      toast.error("Error al actualizar turno");
    }
  }

  async function handleEdit() {
    if (!editDialog) return;
    setSaving(true);

    try {
      const body: any = {};
      if (editData.fecha) body.fecha = editData.fecha;
      if (editData.horaInicio) body.horaInicio = editData.horaInicio;
      if (editData.estado) body.estado = editData.estado;

      const res = await fetch(`/api/bookings/${editDialog.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const result = await res.json();
        toast.error(result.error || "Error al actualizar turno");
        return;
      }

      toast.success("Turno actualizado");
      setEditDialog(null);
      fetchTurnos();
    } catch {
      toast.error("Error al actualizar turno");
    } finally {
      setSaving(false);
    }
  }

  function getEstadoBadge(estado: string) {
    const colors: Record<string, string> = {
      PENDIENTE: "border-yellow-500 text-yellow-700",
      CONFIRMADO: "bg-green-100 text-green-700 border-green-300",
      CANCELADO: "bg-red-100 text-red-700 border-red-300",
      COMPLETADO: "bg-blue-100 text-blue-700 border-blue-300",
    };
    return (
      <Badge variant="outline" className={colors[estado]}>
        {estado}
      </Badge>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Turnos</h1>
        <p className="text-gray-500">
          Administrá todas las reservas del sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={filters.estado}
                onValueChange={(value) =>
                  setFilters({ ...filters, estado: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                  <SelectItem value="CONFIRMADO">Confirmado</SelectItem>
                  <SelectItem value="CANCELADO">Cancelado</SelectItem>
                  <SelectItem value="COMPLETADO">Completado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input
                type="date"
                value={filters.fecha}
                onChange={(e) =>
                  setFilters({ ...filters, fecha: e.target.value })
                }
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() =>
                  setFilters({ estado: "", fecha: "", instalacionId: "" })
                }
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Turnos ({turnos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-500">Cargando turnos...</div>
            </div>
          ) : turnos.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No se encontraron turnos
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Instalación</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Horario</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {turnos.map((turno) => (
                    <TableRow key={turno.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{turno.usuario.nombre}</p>
                          <p className="text-xs text-gray-500">
                            {turno.usuario.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {turno.instalacion.nombre}
                          </p>
                          <p className="text-xs text-gray-500">
                            {turno.instalacion.deporte}
                          </p>
                        </div>
                      </TableCell>
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
                        <div className="flex items-center justify-end gap-1">
                          {turno.estado === "PENDIENTE" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleUpdateStatus(turno.id, "CONFIRMADO")
                              }
                              className="text-green-600 hover:text-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          {(turno.estado === "PENDIENTE" ||
                            turno.estado === "CONFIRMADO") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleUpdateStatus(turno.id, "CANCELADO")
                              }
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditDialog(turno);
                              setEditData({
                                fecha: format(new Date(turno.fecha), "yyyy-MM-dd"),
                                horaInicio: turno.horaInicio,
                                estado: turno.estado,
                              });
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editDialog} onOpenChange={() => setEditDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Turno</DialogTitle>
            <DialogDescription>
              Modificá los datos del turno
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input
                type="date"
                value={editData.fecha}
                onChange={(e) =>
                  setEditData({ ...editData, fecha: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Hora Inicio</Label>
              <Input
                type="time"
                value={editData.horaInicio}
                onChange={(e) =>
                  setEditData({ ...editData, horaInicio: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={editData.estado}
                onValueChange={(value) =>
                  setEditData({ ...editData, estado: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                  <SelectItem value="CONFIRMADO">Confirmado</SelectItem>
                  <SelectItem value="CANCELADO">Cancelado</SelectItem>
                  <SelectItem value="COMPLETADO">Completado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(null)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

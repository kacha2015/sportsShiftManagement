"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { scheduleSchema, ScheduleInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";
import { InstalacionWithSchedules, HorarioHabilitado } from "@/types";
import { Clock, Plus, Trash2, Edit } from "lucide-react";

const DIAS_SEMANA = [
  { value: "LUNES", label: "Lunes" },
  { value: "MARTES", label: "Martes" },
  { value: "MIERCOLES", label: "Miércoles" },
  { value: "JUEVES", label: "Jueves" },
  { value: "VIERNES", label: "Viernes" },
  { value: "SABADO", label: "Sábado" },
  { value: "DOMINGO", label: "Domingo" },
];

export default function SchedulesPage() {
  const [instalaciones, setInstalaciones] = useState<InstalacionWithSchedules[]>([]);
  const [horarios, setHorarios] = useState<(HorarioHabilitado & { instalacion: { nombre: string; deporte: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ScheduleInput>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      slotMinutos: 60,
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [instRes, horRes] = await Promise.all([
        fetch("/api/facilities"),
        fetch("/api/schedules"),
      ]);

      if (instRes.ok) {
        const instData = await instRes.json();
        setInstalaciones(instData);
      }

      if (horRes.ok) {
        const horData = await horRes.json();
        setHorarios(horData);
      }
    } catch {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingId(null);
    reset({ instalacionId: "", diaSemana: "", horaInicio: "", horaFin: "", slotMinutos: 60 });
    setDialogOpen(true);
  }

  function openEditDialog(horario: HorarioHabilitado & { instalacion: { nombre: string; deporte: string } }) {
    setEditingId(horario.id);
    reset({
      instalacionId: horario.instalacionId,
      diaSemana: horario.diaSemana,
      horaInicio: horario.horaInicio,
      horaFin: horario.horaFin,
      slotMinutos: horario.slotMinutos,
    });
    setDialogOpen(true);
  }

  async function onSubmit(data: ScheduleInput) {
    setSaving(true);
    try {
      const url = editingId ? `/api/schedules/${editingId}` : "/api/schedules";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        toast.error(result.error || "Error al guardar horario");
        return;
      }

      toast.success(editingId ? "Horario actualizado" : "Horario creado");
      setDialogOpen(false);
      reset();
      fetchData();
    } catch {
      toast.error("Error al guardar horario");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar este horario?")) return;

    try {
      const res = await fetch(`/api/schedules/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Error al eliminar horario");
        return;
      }
      toast.success("Horario eliminado");
      fetchData();
    } catch {
      toast.error("Error al eliminar horario");
    }
  }

  function getDiaLabel(dia: string) {
    return DIAS_SEMANA.find((d) => d.value === dia)?.label || dia;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando horarios...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Horarios Habilitados
          </h1>
          <p className="text-gray-500">
            Configurá los horarios disponibles por instalación
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Horario
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horarios ({horarios.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {horarios.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No hay horarios configurados
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instalación</TableHead>
                    <TableHead>Día</TableHead>
                    <TableHead>Hora Inicio</TableHead>
                    <TableHead>Hora Fin</TableHead>
                    <TableHead>Slot (min)</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {horarios.map((horario) => (
                    <TableRow key={horario.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {horario.instalacion.nombre}
                          </p>
                          <p className="text-xs text-gray-500">
                            {horario.instalacion.deporte}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getDiaLabel(horario.diaSemana)}
                        </Badge>
                      </TableCell>
                      <TableCell>{horario.horaInicio}</TableCell>
                      <TableCell>{horario.horaFin}</TableCell>
                      <TableCell>{horario.slotMinutos} min</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(horario)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(horario.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Horario" : "Nuevo Horario Habilitado"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Modificá los datos del horario"
                : "Configurá un nuevo horario para una instalación"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Instalación</Label>
                <Select
                  value={watch("instalacionId") || ""}
                  onValueChange={(value) => setValue("instalacionId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccioná una instalación" />
                  </SelectTrigger>
                  <SelectContent>
                    {instalaciones.map((inst) => (
                      <SelectItem key={inst.id} value={inst.id}>
                        {inst.nombre} - {inst.deporte}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" {...register("instalacionId")} />
                {errors.instalacionId && (
                  <p className="text-sm text-red-500">
                    {errors.instalacionId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Día de la Semana</Label>
                <Select
                  value={watch("diaSemana") || ""}
                  onValueChange={(value) => setValue("diaSemana", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccioná un día" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIAS_SEMANA.map((dia) => (
                      <SelectItem key={dia.value} value={dia.value}>
                        {dia.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" {...register("diaSemana")} />
                {errors.diaSemana && (
                  <p className="text-sm text-red-500">
                    {errors.diaSemana.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hora Inicio</Label>
                  <Input type="time" {...register("horaInicio")} />
                  {errors.horaInicio && (
                    <p className="text-sm text-red-500">
                      {errors.horaInicio.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Hora Fin</Label>
                  <Input type="time" {...register("horaFin")} />
                  {errors.horaFin && (
                    <p className="text-sm text-red-500">
                      {errors.horaFin.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Duración del Slot (minutos)</Label>
                <Input
                  type="number"
                  min="15"
                  max="480"
                  {...register("slotMinutos", { valueAsNumber: true })}
                />
                {errors.slotMinutos && (
                  <p className="text-sm text-red-500">
                    {errors.slotMinutos.message}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : editingId ? "Actualizar" : "Crear Horario"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}



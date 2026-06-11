"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { facilitySchema, FacilityInput } from "@/lib/validations";
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
import toast from "react-hot-toast";
import { InstalacionWithSchedules } from "@/types";
import { Building2, Plus, Edit, Trash2 } from "lucide-react";

export default function FacilitiesPage() {
  const [instalaciones, setInstalaciones] = useState<InstalacionWithSchedules[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FacilityInput>({
    resolver: zodResolver(facilitySchema),
  });

  useEffect(() => {
    fetchInstalaciones();
  }, []);

  async function fetchInstalaciones() {
    try {
      const res = await fetch("/api/facilities");
      if (res.ok) {
        const data = await res.json();
        setInstalaciones(data);
      }
    } catch {
      toast.error("Error al cargar instalaciones");
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingId(null);
    reset({ nombre: "", deporte: "", capacidad: 1, activo: true });
    setDialogOpen(true);
  }

  function openEditDialog(inst: InstalacionWithSchedules) {
    setEditingId(inst.id);
    reset({
      nombre: inst.nombre,
      deporte: inst.deporte,
      capacidad: inst.capacidad,
      activo: inst.activo,
    });
    setDialogOpen(true);
  }

  async function onSubmit(data: FacilityInput) {
    setSaving(true);
    try {
      const url = editingId ? `/api/facilities/${editingId}` : "/api/facilities";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        toast.error(result.error || "Error al guardar instalación");
        return;
      }

      toast.success(editingId ? "Instalación actualizada" : "Instalación creada");
      setDialogOpen(false);
      fetchInstalaciones();
    } catch {
      toast.error("Error al guardar instalación");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Estás seguro de eliminar esta instalación?")) return;

    try {
      const res = await fetch(`/api/facilities/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Error al eliminar instalación");
        return;
      }
      toast.success("Instalación eliminada");
      fetchInstalaciones();
    } catch {
      toast.error("Error al eliminar instalación");
    }
  }

  async function toggleActive(id: string, currentActive: boolean) {
    try {
      const res = await fetch(`/api/facilities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !currentActive }),
      });

      if (!res.ok) {
        toast.error("Error al actualizar instalación");
        return;
      }

      toast.success(
        currentActive ? "Instalación desactivada" : "Instalación activada"
      );
      fetchInstalaciones();
    } catch {
      toast.error("Error al actualizar instalación");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando instalaciones...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Instalaciones</h1>
          <p className="text-gray-500">
            Gestioná las instalaciones deportivas
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Instalación
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Instalaciones ({instalaciones.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Deporte</TableHead>
                  <TableHead>Capacidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Horarios</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instalaciones.map((inst) => (
                  <TableRow key={inst.id}>
                    <TableCell className="font-medium">{inst.nombre}</TableCell>
                    <TableCell>{inst.deporte}</TableCell>
                    <TableCell>{inst.capacidad}</TableCell>
                    <TableCell>
                      <Badge
                        variant={inst.activo ? "default" : "secondary"}
                        className={
                          inst.activo
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }
                      >
                        {inst.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {inst.horarios.length} horario(s)
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(inst)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActive(inst.id, inst.activo)}
                          className={
                            inst.activo
                              ? "text-yellow-600"
                              : "text-green-600"
                          }
                        >
                          {inst.activo ? "Desactivar" : "Activar"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(inst.id)}
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
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Instalación" : "Nueva Instalación"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Modificá los datos de la instalación"
                : "Completá los datos para crear una instalación"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Cancha de Fútbol 1"
                  {...register("nombre")}
                />
                {errors.nombre && (
                  <p className="text-sm text-red-500">
                    {errors.nombre.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="deporte">Deporte</Label>
                <Input
                  id="deporte"
                  placeholder="Ej: Fútbol"
                  {...register("deporte")}
                />
                {errors.deporte && (
                  <p className="text-sm text-red-500">
                    {errors.deporte.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacidad">Capacidad</Label>
                <Input
                  id="capacidad"
                  type="number"
                  min="1"
                  {...register("capacidad", { valueAsNumber: true })}
                />
                {errors.capacidad && (
                  <p className="text-sm text-red-500">
                    {errors.capacidad.message}
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
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

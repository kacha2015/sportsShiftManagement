"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bookingSchema, BookingInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";
import { format } from "date-fns";

interface Instalacion {
  id: string;
  nombre: string;
  deporte: string;
  capacidad: number;
  activo: boolean;
}

interface AvailableSlot {
  horaInicio: string;
  horaFin: string;
  disponible: boolean;
}

export default function BookingsPage() {
  const [instalaciones, setInstalaciones] = useState<Instalacion[]>([]);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
  });

  const selectedInstalacion = watch("instalacionId");
  const selectedFecha = watch("fecha");

  useEffect(() => {
    fetch("/api/facilities")
      .then((res) => res.json())
      .then((data) => setInstalaciones(data.filter((i: Instalacion) => i.activo)))
      .catch(() => toast.error("Error al cargar instalaciones"));
  }, []);

  useEffect(() => {
    if (selectedInstalacion && selectedFecha) {
      setLoadingSlots(true);
      setSlots([]);
      fetch(
        `/api/available-slots?instalacionId=${selectedInstalacion}&fecha=${selectedFecha}`
      )
        .then((res) => res.json())
        .then((data) => setSlots(data))
        .catch(() => toast.error("Error al cargar horarios"))
        .finally(() => setLoadingSlots(false));
    } else {
      setSlots([]);
    }
  }, [selectedInstalacion, selectedFecha]);

  const onSubmit = async (data: BookingInput) => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Error al reservar turno");
        return;
      }

      toast.success("Turno reservado exitosamente");
      setValue("instalacionId", "");
      setValue("fecha", "");
      setValue("horaInicio", "");
      setSlots([]);
    } catch {
      toast.error("Error al reservar turno");
    } finally {
      setLoading(false);
    }
  };

  const minDate = format(new Date(), "yyyy-MM-dd");
  const maxDate = format(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    "yyyy-MM-dd"
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reservar Turno</h1>
        <p className="text-gray-500">
          Elegí la instalación, fecha y horario disponible
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Nueva Reserva</CardTitle>
          <CardDescription>
            Completá los datos para reservar tu turno
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Instalación</Label>
              <Select
                value={selectedInstalacion || ""}
                onValueChange={(value) => {
                  setValue("instalacionId", value, { shouldValidate: true });
                  setValue("horaInicio", "");
                }}
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
              {errors.instalacionId && (
                <p className="text-sm text-red-500">
                  {errors.instalacionId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                id="fecha"
                type="date"
                min={minDate}
                max={maxDate}
                value={selectedFecha || ""}
                onChange={(e) => {
                  setValue("fecha", e.target.value, { shouldValidate: true });
                  setValue("horaInicio", "");
                }}
              />
              {errors.fecha && (
                <p className="text-sm text-red-500">{errors.fecha.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Horario Disponible</Label>
              {loadingSlots ? (
                <p className="text-sm text-gray-500">Cargando horarios...</p>
              ) : slots.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.horaInicio}
                      type="button"
                      disabled={!slot.disponible}
                      onClick={() =>
                        setValue("horaInicio", slot.horaInicio, {
                          shouldValidate: true,
                        })
                      }
                      className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
                        watch("horaInicio") === slot.horaInicio
                          ? "bg-blue-600 text-white border-blue-600"
                          : slot.disponible
                          ? "bg-white border-gray-200 hover:border-blue-300"
                          : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                      }`}
                    >
                      {slot.horaInicio}
                    </button>
                  ))}
                </div>
              ) : selectedInstalacion && selectedFecha ? (
                <p className="text-sm text-gray-500">
                  No hay horarios disponibles para esta fecha
                </p>
              ) : (
                <p className="text-sm text-gray-500">
                  Seleccioná una instalación y fecha primero
                </p>
              )}
              {errors.horaInicio && (
                <p className="text-sm text-red-500">
                  {errors.horaInicio.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Reservando..." : "Reservar Turno"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    try {
      // Simular envío de email
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSent(true);
      toast.success("Si el email existe, recibirás un enlace de recuperación");
    } catch {
      toast.error("Error al enviar el email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-blue-600">
          SportsBook
        </CardTitle>
        <CardDescription>Recuperá tu contraseña</CardDescription>
      </CardHeader>
      {sent ? (
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            Si el email{" "}
            <strong>existe en nuestro sistema</strong>, recibirás un enlace para
            restablecer tu contraseña.
          </p>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              Volver al Login
            </Button>
          </Link>
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Ingresá tu email y te enviaremos un enlace para restablecer tu
              contraseña.
            </p>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enviando..." : "Enviar Enlace"}
            </Button>
            <Link
              href="/login"
              className="text-sm text-blue-600 hover:underline"
            >
              Volver al Login
            </Link>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}

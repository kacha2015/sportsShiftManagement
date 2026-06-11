import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
  secure: process.env.EMAIL_SERVER_SECURE === "true",
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASS,
  },
});

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "SportsBook <noreply@sportsbooking.com>",
      to,
      subject,
      html,
    });
    console.log("Email enviado a " + to + ": " + subject);
    return true;
  } catch (error) {
    console.error("Error enviando email:", error);
    return false;
  }
}

export function bookingCreatedEmail(data: {
  userName: string;
  userEmail: string;
  facilityName: string;
  sport: string;
  date: string;
  time: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .body { padding: 24px; }
        .info-box { background: #f0f7ff; border-left: 4px solid #2563eb; padding: 16px; margin: 16px 0; border-radius: 0 4px 4px 0; }
        .info-row { margin: 8px 0; }
        .label { font-weight: bold; color: #374151; }
        .value { color: #1f2937; }
        .badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
        .footer { padding: 16px 24px; background: #f9fafb; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>SportsBook</h1>
        </div>
        <div class="body">
          <h2>Nueva Reserva Recibida</h2>
          <p>Se ha registrado una nueva reserva en el sistema.</p>
          <div class="info-box">
            <div class="info-row">
              <span class="label">Usuario:</span>
              <span class="value">${data.userName} (${data.userEmail})</span>
            </div>
            <div class="info-row">
              <span class="label">Instalación:</span>
              <span class="value">${data.facilityName}</span>
            </div>
            <div class="info-row">
              <span class="label">Deporte:</span>
              <span class="value">${data.sport}</span>
            </div>
            <div class="info-row">
              <span class="label">Fecha:</span>
              <span class="value">${data.date}</span>
            </div>
            <div class="info-row">
              <span class="label">Horario:</span>
              <span class="value">${data.time}</span>
            </div>
          </div>
          <p><span class="badge">PENDIENTE</span></p>
          <p>Podés confirmar o cancelar esta reserva desde el panel de administración.</p>
        </div>
        <div class="footer">
          <p>SportsBook - Sistema de Reservas Deportivas</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function bookingStatusEmail(data: {
  userName: string;
  facilityName: string;
  sport: string;
  date: string;
  time: string;
  status: string;
}) {
  const statusStyles: Record<string, { color: string; bg: string; message: string }> = {
    CONFIRMADO: {
      color: "#065f46",
      bg: "#d1fae5",
      message: "Tu reserva ha sido confirmada. ¡Te esperamos!",
    },
    CANCELADO: {
      color: "#991b1b",
      bg: "#fee2e2",
      message: "Tu reserva ha sido cancelada.",
    },
    COMPLETADO: {
      color: "#1e40af",
      bg: "#dbeafe",
      message: "Tu reserva ha sido completada. ¡Esperamos que la hayas disfrutado!",
    },
  };

  const config = statusStyles[data.status] || statusStyles.CONFIRMADO;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .body { padding: 24px; }
        .info-box { background: #f0f7ff; border-left: 4px solid #2563eb; padding: 16px; margin: 16px 0; border-radius: 0 4px 4px 0; }
        .info-row { margin: 8px 0; }
        .label { font-weight: bold; color: #374151; }
        .value { color: #1f2937; }
        .status-badge { display: inline-block; background: ${config.bg}; color: ${config.color}; padding: 6px 16px; border-radius: 12px; font-size: 14px; font-weight: bold; }
        .message { font-size: 16px; color: #374151; margin: 16px 0; }
        .footer { padding: 16px 24px; background: #f9fafb; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>SportsBook</h1>
        </div>
        <div class="body">
          <h2>Estado de tu Reserva</h2>
          <p class="message">${config.message}</p>
          <div class="info-box">
            <div class="info-row">
              <span class="label">Instalación:</span>
              <span class="value">${data.facilityName}</span>
            </div>
            <div class="info-row">
              <span class="label">Deporte:</span>
              <span class="value">${data.sport}</span>
            </div>
            <div class="info-row">
              <span class="label">Fecha:</span>
              <span class="value">${data.date}</span>
            </div>
            <div class="info-row">
              <span class="label">Horario:</span>
              <span class="value">${data.time}</span>
            </div>
          </div>
          <p>Estado: <span class="status-badge">${data.status}</span></p>
        </div>
        <div class="footer">
          <p>SportsBook - Sistema de Reservas Deportivas</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

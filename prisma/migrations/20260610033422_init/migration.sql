-- CreateEnum
CREATE TYPE "TipoConfirmacion" AS ENUM ('AUTOMATICA', 'MANUAL');

-- CreateTable
CREATE TABLE "usuario_administrador" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_administrador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipo_evento" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "duracion" INTEGER NOT NULL,
    "descripcion" TEXT,
    "confirmacion" "TipoConfirmacion" NOT NULL DEFAULT 'AUTOMATICA',
    "antelacionMinima" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "administradorId" INTEGER NOT NULL,

    CONSTRAINT "tipo_evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estado_reserva" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "estado_reserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reserva" (
    "id" SERIAL NOT NULL,
    "fechaHoraInicio" TIMESTAMP(3) NOT NULL,
    "duracion" INTEGER NOT NULL,
    "nombreInvitado" TEXT NOT NULL,
    "emailInvitado" TEXT NOT NULL,
    "telefonoInvitado" TEXT,
    "notaInvitado" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tipoEventoId" INTEGER NOT NULL,
    "administradorId" INTEGER NOT NULL,
    "estadoReservaId" INTEGER NOT NULL,

    CONSTRAINT "reserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reserva_estado_historial" (
    "id" SERIAL NOT NULL,
    "fechaCambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivo" TEXT,
    "reservaId" INTEGER NOT NULL,
    "estadoReservaId" INTEGER NOT NULL,

    CONSTRAINT "reserva_estado_historial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disponibilidad_semanal" (
    "id" SERIAL NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horaInicio" INTEGER NOT NULL,
    "horaFin" INTEGER NOT NULL,
    "administradorId" INTEGER NOT NULL,

    CONSTRAINT "disponibilidad_semanal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloqueo_agenda" (
    "id" SERIAL NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT,
    "administradorId" INTEGER NOT NULL,

    CONSTRAINT "bloqueo_agenda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_administrador_email_key" ON "usuario_administrador"("email");

-- CreateIndex
CREATE INDEX "tipo_evento_administradorId_idx" ON "tipo_evento"("administradorId");

-- CreateIndex
CREATE UNIQUE INDEX "estado_reserva_nombre_key" ON "estado_reserva"("nombre");

-- CreateIndex
CREATE INDEX "reserva_tipoEventoId_idx" ON "reserva"("tipoEventoId");

-- CreateIndex
CREATE INDEX "reserva_administradorId_idx" ON "reserva"("administradorId");

-- CreateIndex
CREATE INDEX "reserva_estadoReservaId_idx" ON "reserva"("estadoReservaId");

-- CreateIndex
CREATE INDEX "reserva_estado_historial_reservaId_idx" ON "reserva_estado_historial"("reservaId");

-- CreateIndex
CREATE INDEX "reserva_estado_historial_estadoReservaId_idx" ON "reserva_estado_historial"("estadoReservaId");

-- CreateIndex
CREATE INDEX "disponibilidad_semanal_administradorId_idx" ON "disponibilidad_semanal"("administradorId");

-- CreateIndex
CREATE INDEX "bloqueo_agenda_administradorId_idx" ON "bloqueo_agenda"("administradorId");

-- AddForeignKey
ALTER TABLE "tipo_evento" ADD CONSTRAINT "tipo_evento_administradorId_fkey" FOREIGN KEY ("administradorId") REFERENCES "usuario_administrador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_tipoEventoId_fkey" FOREIGN KEY ("tipoEventoId") REFERENCES "tipo_evento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_administradorId_fkey" FOREIGN KEY ("administradorId") REFERENCES "usuario_administrador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva" ADD CONSTRAINT "reserva_estadoReservaId_fkey" FOREIGN KEY ("estadoReservaId") REFERENCES "estado_reserva"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva_estado_historial" ADD CONSTRAINT "reserva_estado_historial_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "reserva"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reserva_estado_historial" ADD CONSTRAINT "reserva_estado_historial_estadoReservaId_fkey" FOREIGN KEY ("estadoReservaId") REFERENCES "estado_reserva"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disponibilidad_semanal" ADD CONSTRAINT "disponibilidad_semanal_administradorId_fkey" FOREIGN KEY ("administradorId") REFERENCES "usuario_administrador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloqueo_agenda" ADD CONSTRAINT "bloqueo_agenda_administradorId_fkey" FOREIGN KEY ("administradorId") REFERENCES "usuario_administrador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

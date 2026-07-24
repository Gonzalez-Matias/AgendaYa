# AgendaYa

Sistema de gestión de agenda y reserva de turnos para profesionales. Permite a usuarios invitados reservar turnos online y a administradores gestionar su agenda de forma eficiente.

## Stack

- **Framework**: Next.js 15 (App Router)
- **Base de datos**: PostgreSQL 16 (Docker)
- **ORM**: Prisma 7 con adapter `@prisma/adapter-pg`
- **Testing**: Jest + @swc/jest (92 tests, 14 suites)
- **CI**: GitHub Actions
- **Code Review**: CodeRabbit (AI)

## Setup

```bash
# 1. Clonar el repo
git clone <repo-url>
cd agendaya

# 2. Instalar dependencias
npm install

# 3. Levantar PostgreSQL
docker compose up -d

# 4. Configurar .env
cp .env.example .env
# DATABASE_URL por defecto: postgresql://postgres:postgres@localhost:5432/agendaya

# 5. Generar cliente Prisma
npx prisma generate

# 6. Crear la base de datos y migrar
npx prisma db push

# 7. Crear base de datos de test
docker exec agendaya_postgres psql -U postgres -c "CREATE DATABASE agendaya_test;"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/agendaya_test" npx prisma db push

# 8. Cargar datos de prueba
npx prisma db seed

# 9. Ejecutar tests
npm test

# 10. Levantar servidor de desarrollo
npm run dev
```

## Comandos

| Comando | Descripción |
|---------|-------------|
| `npm test` | Ejecuta todos los tests con Jest (usa DB de test separada) |
| `npm run dev` | Inicia el servidor de desarrollo en http://localhost:3000 |
| `npx prisma db seed` | Ejecuta el seed de la DB (idempotente) |
| `npx prisma db push` | Sincroniza el schema de Prisma con la DB |
| `npx prisma studio` | Abre el explorador de Prisma |
| `docker compose up -d` | Levanta PostgreSQL |
| `docker compose down` | Detiene PostgreSQL |

## API Endpoints

Base URL: `http://localhost:3000`

### Administradores

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/administradores` | Listar todos los administradores |
| `GET` | `/api/administradores/:id/tipos-evento` | Listar tipos de evento de un administrador |

### Reservas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/reservas/:id` | Obtener detalle de una reserva |
| `POST` | `/api/visualizacion` | Listar reservas con paginación (body: `{ administradorId, fechaDesde, fechaHasta, modoVista }`) |
| `POST` | `/api/disponibilidad` | Consultar slots disponibles (body: `{ tipoEventoId, fechaDesde, fechaHasta }`) |
| `POST` | `/api/reservas/cancelar` | Cancelar una reserva (body: `{ reservaId, motivo? }`) |
| `POST` | `/api/reservas/completar` | Completar una reserva confirmada (body: `{ reservaId }`) |
| `POST` | `/api/reservas/confirmar` | Confirmar una reserva pendiente (body: `{ reservaId }`) |
| `POST` | `/api/reservas/reagendar` | Reagendar una reserva (body: `{ reservaId, nuevaFechaHoraInicio, motivo? }`) |

Todos los endpoints de mutación de reservas aceptan un `adminId` opcional en el body/query. Si se envía, validan que la reserva pertenezca a ese administrador. Sin `adminId`, el comportamiento es sin restricciones (compatibilidad hacia atrás mientras no hay auth).

### Ejemplos de uso con curl

```bash
# Obtener administradores
curl http://localhost:3000/api/administradores

# Listar reservas de un administrador
curl -X POST http://localhost:3000/api/visualizacion \
  -H "Content-Type: application/json" \
  -d '{"administradorId": 1, "fechaDesde": "2026-07-20T00:00:00.000Z", "fechaHasta": "2026-08-30T23:59:59.999Z", "modoVista": "lista"}'

# Consultar disponibilidad
curl -X POST http://localhost:3000/api/disponibilidad \
  -H "Content-Type: application/json" \
  -d '{"tipoEventoId": 1, "fechaDesde": "2026-07-24T00:00:00.000Z", "fechaHasta": "2026-07-25T23:59:59.999Z"}'

# Cancelar una reserva
curl -X POST http://localhost:3000/api/reservas/cancelar \
  -H "Content-Type: application/json" \
  -d '{"reservaId": 1, "motivo": "Cliente no puede asistir"}'
```

## Arquitectura

```
src/
├── app/
│   ├── api/                    ← HTTP endpoints (8 rutas)
│   │   ├── administradores/
│   │   │   └── [id]/tipos-evento/
│   │   ├── disponibilidad/
│   │   ├── reservas/
│   │   │   ├── [id]/
│   │   │   ├── cancelar/
│   │   │   ├── completar/
│   │   │   ├── confirmar/
│   │   │   └── reagendar/
│   │   └── visualizacion/
│   ├── layout.tsx
│   └── page.tsx                ← Landing page con documentación de API
├── services/                   ← Lógica de negocio (7 archivos)
│   ├── cancelarReserva.ts
│   ├── completarReserva.ts
│   ├── confirmacion.ts
│   ├── detalleReserva.ts
│   ├── disponibilidad.ts
│   ├── reagendarReserva.ts
│   └── visualizacion.ts
├── repositories/               ← Acceso a datos (8 archivos)
│   ├── db.ts                   ← PrismaClient singleton
│   ├── cancelarReserva.ts
│   ├── completarReserva.ts
│   ├── confirmarReserva.ts
│   ├── detalleReserva.ts
│   ├── disponibilidad.ts
│   ├── reserva.ts
│   ├── tipoEvento.ts
│   └── visualizacion.ts
└── types/                      ← Tipos compartidos
    ├── disponibilidad.ts
    └── reserva.ts
```

### Flujo de capas

```
API Route  →  Service  →  Repository  →  Prisma  →  PostgreSQL
   │              │            │
   │              │            └── Solo queries, sin lógica de negocio
   │              └── Zod validation + reglas de negocio
   └── HTTP request/response, extrae params, maneja errores
```

## Base de datos

### Esquema (7 modelos)

| Modelo | Tabla | Descripción |
|--------|-------|-------------|
| `UsuarioAdministrador` | `usuario_administrador` | Administradores del sistema |
| `TipoEvento` | `tipo_evento` | Tipos de evento (Reunión, Consulta, etc.) |
| `EstadoReserva` | `estado_reserva` | Estados posibles de una reserva |
| `Reserva` | `reserva` | Reservas de turnos |
| `ReservaEstadoHistorial` | `reserva_estado_historial` | Historial de cambios de estado |
| `DisponibilidadSemanal` | `disponibilidad_semanal` | Franjas horarias semanales por admin |
| `BloqueoAgenda` | `bloqueo_agenda` | Períodos de bloqueo de agenda |

### Estados de reserva

```
PendienteDeConfirmacion → Confirmada → Completada
                        → Cancelada
PendienteDeReagendar    → Confirmada (al reagendar)
```

### Datos de prueba (seed)

El seed es idempotente: limpia los datos previos antes de insertar. Crea:

| Tabla | Cantidad |
|-------|----------|
| `estado_reserva` | 5 |
| `usuario_administrador` | 3 |
| `tipo_evento` | 9 |
| `disponibilidad_semanal` | 15 |
| `reserva` | 6 |
| `reserva_estado_historial` | 6 |
| `bloqueo_agenda` | 3 |

## Testing

### Estrategia

```
1. RED    → Escribir test que falle
2. GREEN  → Implementar mínimo código para que pase
3. REFACTOR → Refactorizar manteniendo tests verdes
```

### Bases de datos separadas

- **Desarrollo**: `agendaya` (DATABASE_URL en `.env`)
- **Tests**: `agendaya_test` (DATABASE_URL en `.env.test`)

Jest carga `.env.test` automáticamente vía `tests/setup.ts`. Los tests nunca tocan la base de datos de desarrollo.

### Tests por capa

| Capa | Suite | Tests |
|------|-------|-------|
| DB | `tests/db.test.ts` | Verifica counts del seed |
| Repositories | `tests/repositories/*.test.ts` | Queries Prisma (4 suites) |
| Services | `tests/services/*.test.ts` | Lógica de negocio + validación + auth (9 suites) |

### Ejecución

```bash
npm test                          # Todos los tests
npx jest tests/services/          # Solo services
npx jest --no-coverage            # Sin reporte HTML
```

## CI/CD

### GitHub Actions

Al abrir un PR:
1. Checkout + instalar dependencias
2. `prisma generate`
3. `npx prisma db push` (DB de test)
4. `npm test`
5. Publicar reporte HTML en GitHub Pages

### CodeRabbit

Revisión automática de código en cada PR siguiendo las reglas de `.coderabbit.yaml`.

## Integrantes

- Alario Rocio
- Gonzalez Enzo Matias
- Manucha Juan Pablo
- Martinez Jairo
- Obredor Tomas
- Wengorra Santiago
- Lucca Ferrero
- Andres Mortensen

**Grupo N° 8** - Ingeniería y Calidad de Software

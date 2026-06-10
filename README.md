# AgendaYa

Sistema de gestión de agenda y reserva de turnos para profesionales. Permite a usuarios invitados reservar turnos online y a administradores gestionar su agenda de forma eficiente.

## Módulos

- **MOD 04 - Proceso de Reserva**: Flujo de booking para usuarios invitados (mobile-first, max 4 pasos, booking < 10s en 4G)
- **MOD 05 - Gestión de Agenda y Reserva**: Panel del administrador (desktop) para gestionar reservas, calendaristas y configuración

## Requisitos Destacados

### Módulo 04 (Reserva de Turnos)

| ID | Requisito | Tipo |
|----|-----------|------|
| M04-RF01 | Reserva de turnos para usuarios invitados (sin registro) | Funcional |
| M04-RF02 | Consultar disponibilidad con slots diferidos 30min | Funcional |
| M04-RNF01 | Booking completo en < 10s (4G) | No Funcional |
| M04-RNF02 | Máximo 4 pasos para crear una reserva | No Funcional |
| M04-RNF03 | Operabilidad con una sola mano (thumb zone) | No Funcional |

### Módulo 05 (Gestión de Agenda)

| ID | Requisito | Tipo |
|----|-----------|------|
| M05-RF01 | Re-agendar una reserva | Funcional |
| M05-RF02 | Marcar reserva como completada | Funcional |
| M05-RF03 | Vista calendario semanal/mensual | Funcional |
| M05-RF04 | Cancelar una reserva | Funcional |
| M05-RF05 | Mostrar detalle de reserva | Funcional |
| M05-RF06 | Alternar vista lista/calendario | Funcional |
| M05-RF07 | Auto-cancelación de reservas sin confirmar (4hs) | Funcional |
| M05-RF08 | Confirmar manualmente una reserva | Funcional |
| M05-RNF01 | Compatibilidad Chrome 136+, Firefox 137+, Safari 17+ | No Funcional |
| M05-RNF02 | Atajos de teclado para acciones frecuentes | No Funcional |
| M05-RNF03 | Simbología según UI_Kit_AgendaYA | No Funcional |
| M05-RNF04 | Colores adaptables por locale | No Funcional |

## Stack

- **Framework**: Next.js 15 (App Router) — por ahora solo scaffolding, el foco actual es la capa backend
- **Base de datos**: PostgreSQL 16 (Docker)
- **ORM**: Prisma 7 con adapter `@prisma/adapter-pg`
- **Testing**: Jest + @swc/jest
- **CI**: GitHub Actions
- **Code Review**: CodeRabbit (AI)
## Metodología - TDD

El proyecto sigue un enfoque **Test-Driven Development (TDD)** donde los tests validan la capa de base de datos antes de implementar la lógica de negocio.

### Ciclo TDD

```
1. RED    → Escribir test que falle (describe el comportamiento esperado)
2. GREEN  → Implementar la mínima cantidad de código para que pase
3. REFACTOR → Refactorizar manteniendo los tests verdes
```

### Flujo por feature

```
┌─────────────────────────────────────────────────┐
│  1. Definir requisito (User Story del TP)       │
│  2. Escribir test en tests/ que falle           │
│  3. Ejecutar npm test → veo el fallo (RED)      │
│  4. Implementar repository/service              │
│  5. Ejecutar npm test → veo el pase (GREEN)     │
│  6. Refactorizar si es necesario                │
│  7. Commit con mensaje descriptivo              │
└─────────────────────────────────────────────────┘
```

### Flujo de Git

Cada alumno trabaja en su propia branch. No hay subdivisiones por feature.

1. Crear tu branch personal (una sola vez)
   ```bash
   git checkout -b tu-nombre
   ```

2. Hacer cambios y commitear
   ```bash
   git add .
   git commit -m "Descripción del cambio"
   ```

3. Push a tu branch
   ```bash
   git push -u origin tu-nombre
   ```

4. Abrir PR en GitHub cuando quieras merge a main

5. Esperar a que pasen:
   - **Tests** (GitHub Actions)
   - **CodeRabbit** (review automático)

6. Si ambos pasan → merge habilitado

**Convenciones:**
- **Commits**: mensajes descriptivos en español ("Agregar validación de email", "Fix en schema de Prisma")
- **PRs**: título claro + descripción breve de qué se hizo

### Estrategia de Testing

| Nivel | Directorio | Qué testea | Estado |
|-------|-----------|-----------|--------|
| **DB** | `tests/db.test.ts` | Que el seed inserta la cantidad correcta de registros | ✅ |
| **Repository** | `tests/repositories/*.test.ts` | Queries Prisma (findById, create, count) | Pendiente |
| **Service** | `tests/services/*.test.ts` | Lógica de negocio y validaciones | Pendiente |
| **Actions** | `tests/actions/*.test.ts` | Entry points, permisos, respuesta | Pendiente |

Todos los tests usan `cleanDB()` + `seed()` en `beforeAll` y son **read-only** (solo `count()` o `findMany()`).

## Requisitos

- Node.js 20+
- Docker y Docker Compose
- npm

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
# Editar DATABASE_URL si es necesario

# 5. Generar cliente Prisma
npx prisma generate

# 6. Ejecutar migraciones
npx prisma migrate dev

# 7. Cargar datos de prueba
npx prisma db seed

# 8. Ejecutar tests
npm test
```
## Comandos

| Comando | Descripción |
|---------|-------------|
| `npm test` | Ejecuta todos los tests con Jest |
| `npm run dev` | Inicia el servidor de desarrollo |
| `npx prisma migrate dev` | Crea/aplica migraciones |
| `npx prisma db seed` | Ejecuta el seed de la DB |
| `npx prisma studio` | Abre el explorador de Prisma |
| `docker compose up -d` | Levanta PostgreSQL |
| `docker compose down` | Detiene PostgreSQL |

## Estructura del Proyecto

```
agendaya/
├── prisma/
│   ├── schema.prisma          # Schema de la DB (7 modelos)
│   ├── seed.ts                # Datos de prueba (47 registros)
│   └── migrations/            # Migraciones SQL
├── src/
│   ├── app/                   # Next.js App Router (pages y layouts)
│   ├── actions/               # Server Actions (entry points)
│   ├── services/              # Lógica de negocio
│   ├── repositories/          # Acceso a datos (Prisma)
│   ├── types/                 # Tipos compartidos
│   ├── utils/                 # Utilidades
│   └── generated/             # Cliente Prisma generado (no commitear)
├── tests/
│   ├── helpers.ts             # PrismaClient, cleanDB(), seed()
│   ├── db.test.ts             # Tests de verificación de seed
│   ├── repositories/          # Tests de acceso a datos (futuro)
│   ├── services/              # Tests de lógica de negocio (futuro)
│   └── actions/               # Tests de entry points (futuro)
├── documents/
│   └── TP Nº1_ *.pdf          # Documento de requisitos del TP
├── docker-compose.yml         # PostgreSQL 16
├── jest.config.ts             # Config de Jest con @swc/jest
├── prisma.config.ts           # Config de Prisma (seed, datasource)
└── .github/workflows/ci.yml   # Pipeline de CI
```

## Arquitectura

El proyecto sigue una arquitectura por capas. CodeRabbit verifica estas reglas en cada PR:

```
Actions → Services → Repositories → Prisma → PostgreSQL
```

| Capa | Responsabilidad | Regla |
|------|----------------|-------|
| `src/actions/**` | Entry points (Server Actions) | Solo recibir datos, validar y llamar al service. Sin lógica de negocio. |
| `src/services/**` | Lógica de negocio | Validar con Zod. No importar Prisma directamente. |
| `src/repositories/**` | Acceso a datos | Solo queries Prisma. Sin lógica de negocio. |
| `src/types/**` | Tipos compartidos | Solo interfaces y types. Sin lógica ni dependencias. |
| `src/utils/**` | Helpers reutilizables | Funciones puras. Sin dependencias de Prisma ni Next.js. |
| `tests/**` | Tests | Usar `cleanDB()` + `seed()` en `beforeAll`. Read-only. |

## CI

Cuando se abre un PR, se ejecutan dos flujos en paralelo:

### GitHub Actions (ci.yml)
1. Checkout del código
2. Instalación de dependencias
3. `prisma generate`
4. `prisma migrate deploy`
5. `npm test`

Si algún test falla, el PR no se puede mergear.

### CodeRabbit (review automático)
- Review de código con AI basado en `.coderabbit.yaml`
- Reglas específicas por capa: actions, services, repositories, types, utils y tests
- Comenta suggestions directamente en el PR

Si pide cambios, el PR no se puede mergear (branch protection habilitado)

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

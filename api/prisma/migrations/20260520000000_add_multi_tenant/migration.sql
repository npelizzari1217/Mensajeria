-- ============================================================================
-- Migration: Multi-Tenant Empresas
-- ============================================================================
-- Paso 1: Crear tabla empresas
-- Paso 2: Insertar empresa default
-- Paso 3: Agregar empresa_id nullable a tablas existentes
-- Paso 4: Asignar empresa default a todos los registros
-- Paso 5: Crear tabla user_empresas y asignar usuarios
-- Paso 6: Hacer empresa_id NOT NULL y agregar FK

-- Paso 1: Crear tabla empresas
CREATE TABLE "empresas" (
    "empresa_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("empresa_id")
);

-- Paso 2: Insertar empresa default
INSERT INTO "empresas" ("empresa_id", "nombre")
VALUES ('00000000-0000-0000-0000-000000000001', 'Default');

-- Paso 3: Agregar empresa_id nullable
ALTER TABLE "messages" ADD COLUMN "empresa_id" UUID;
ALTER TABLE "groups" ADD COLUMN "empresa_id" UUID;
ALTER TABLE "drafts" ADD COLUMN "empresa_id" UUID;
ALTER TABLE "conversation_threads" ADD COLUMN "empresa_id" UUID;
ALTER TABLE "refresh_tokens" ADD COLUMN "empresa_id" UUID;

-- Paso 4: Asignar default a todos los registros existentes
UPDATE "messages" SET "empresa_id" = '00000000-0000-0000-0000-000000000001';
UPDATE "groups" SET "empresa_id" = '00000000-0000-0000-0000-000000000001';
UPDATE "drafts" SET "empresa_id" = '00000000-0000-0000-0000-000000000001';
UPDATE "conversation_threads" SET "empresa_id" = '00000000-0000-0000-0000-000000000001';
UPDATE "refresh_tokens" SET "empresa_id" = '00000000-0000-0000-0000-000000000001';

-- Paso 5: Crear tabla user_empresas
CREATE TABLE "user_empresas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "empresa_id" UUID NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USUARIO',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "user_empresas_pkey" PRIMARY KEY ("id")
);

INSERT INTO "user_empresas" ("user_id", "empresa_id", "role")
SELECT "user_id", '00000000-0000-0000-0000-000000000001', "role"
FROM "users";

CREATE UNIQUE INDEX "user_empresas_user_id_empresa_id_key"
    ON "user_empresas"("user_id", "empresa_id");

-- Paso 6: Hacer empresa_id NOT NULL y agregar FK
ALTER TABLE "messages" ALTER COLUMN "empresa_id" SET NOT NULL;
ALTER TABLE "messages" ADD CONSTRAINT "messages_empresa_id_fkey"
    FOREIGN KEY ("empresa_id") REFERENCES "empresas"("empresa_id");

ALTER TABLE "groups" ALTER COLUMN "empresa_id" SET NOT NULL;
ALTER TABLE "groups" ADD CONSTRAINT "groups_empresa_id_fkey"
    FOREIGN KEY ("empresa_id") REFERENCES "empresas"("empresa_id");

ALTER TABLE "drafts" ALTER COLUMN "empresa_id" SET NOT NULL;
ALTER TABLE "drafts" ADD CONSTRAINT "drafts_empresa_id_fkey"
    FOREIGN KEY ("empresa_id") REFERENCES "empresas"("empresa_id");

ALTER TABLE "conversation_threads" ALTER COLUMN "empresa_id" SET NOT NULL;
ALTER TABLE "conversation_threads" ADD CONSTRAINT "conversation_threads_empresa_id_fkey"
    FOREIGN KEY ("empresa_id") REFERENCES "empresas"("empresa_id");

ALTER TABLE "refresh_tokens" ALTER COLUMN "empresa_id" SET NOT NULL;
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_empresa_id_fkey"
    FOREIGN KEY ("empresa_id") REFERENCES "empresas"("empresa_id");

ALTER TABLE "user_empresas" ADD CONSTRAINT "user_empresas_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE;
ALTER TABLE "user_empresas" ADD CONSTRAINT "user_empresas_empresa_id_fkey"
    FOREIGN KEY ("empresa_id") REFERENCES "empresas"("empresa_id") ON DELETE CASCADE;

-- Índices para filtros por empresa
CREATE INDEX "messages_empresa_id_idx" ON "messages"("empresa_id");
CREATE INDEX "groups_empresa_id_idx" ON "groups"("empresa_id");
CREATE INDEX "drafts_empresa_id_idx" ON "drafts"("empresa_id");
CREATE INDEX "conversation_threads_empresa_id_idx" ON "conversation_threads"("empresa_id");
CREATE INDEX "refresh_tokens_empresa_id_idx" ON "refresh_tokens"("empresa_id");

-- Create roles table
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- Unique index on name
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- Insert seed roles
INSERT INTO "roles" (id, name, description) VALUES
    (1, 'Admin', 'Acceso total al sistema'),
    (2, 'Supervisor', 'Gestion de usuarios de su empresa'),
    (3, 'Tecnico', 'Soporte tecnico'),
    (4, 'Usuario', 'Usuario basico');

-- Add roleId column to users (nullable first to avoid NOT NULL on existing rows)
ALTER TABLE "users" ADD COLUMN "roleId" INTEGER;

-- Migrate existing user role data
UPDATE "users" SET "roleId" = 1 WHERE "role" = 'ADMIN';
UPDATE "users" SET "roleId" = 2 WHERE "role" = 'SUPERVISOR';
UPDATE "users" SET "roleId" = 3 WHERE "role" = 'TECNICO';
UPDATE "users" SET "roleId" = 4 WHERE "role" = 'USUARIO';

-- If no role matched, default to Usuario (4)
UPDATE "users" SET "roleId" = 4 WHERE "roleId" IS NULL;

-- Make roleId NOT NULL after data migration
ALTER TABLE "users" ALTER COLUMN "roleId" SET NOT NULL;

-- Add FK constraint
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add roleId column to user_empresas
ALTER TABLE "user_empresas" ADD COLUMN "roleId" INTEGER;

-- Migrate existing user_empresas role data
UPDATE "user_empresas" SET "roleId" = 1 WHERE "role" = 'ADMIN';
UPDATE "user_empresas" SET "roleId" = 2 WHERE "role" = 'SUPERVISOR';
UPDATE "user_empresas" SET "roleId" = 3 WHERE "role" = 'TECNICO';
UPDATE "user_empresas" SET "roleId" = 4 WHERE "role" = 'USUARIO';

-- If no role matched, default to Usuario (4)
UPDATE "user_empresas" SET "roleId" = 4 WHERE "roleId" IS NULL;

-- Make roleId NOT NULL after data migration
ALTER TABLE "user_empresas" ALTER COLUMN "roleId" SET NOT NULL;

-- Add FK constraint
ALTER TABLE "user_empresas" ADD CONSTRAINT "user_empresas_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Drop old role enum columns
ALTER TABLE "users" DROP COLUMN "role";
ALTER TABLE "user_empresas" DROP COLUMN "role";

-- Drop the Role enum type
DROP TYPE "Role";

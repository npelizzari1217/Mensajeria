-- Re-create the Role enum type
CREATE TYPE "Role" AS ENUM ('ADMIN', 'SUPERVISOR', 'TECNICO', 'USUARIO');

-- Re-add role column to users
ALTER TABLE "users" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'USUARIO';

-- Migrate data back from roleId to role
UPDATE "users" SET "role" = 'ADMIN' WHERE "roleId" = 1;
UPDATE "users" SET "role" = 'SUPERVISOR' WHERE "roleId" = 2;
UPDATE "users" SET "role" = 'TECNICO' WHERE "roleId" = 3;
UPDATE "users" SET "role" = 'USUARIO' WHERE "roleId" = 4;

-- Re-add role column to user_empresas
ALTER TABLE "user_empresas" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'USUARIO';

-- Migrate data back from roleId to role
UPDATE "user_empresas" SET "role" = 'ADMIN' WHERE "roleId" = 1;
UPDATE "user_empresas" SET "role" = 'SUPERVISOR' WHERE "roleId" = 2;
UPDATE "user_empresas" SET "role" = 'TECNICO' WHERE "roleId" = 3;
UPDATE "user_empresas" SET "role" = 'USUARIO' WHERE "roleId" = 4;

-- Drop FK constraints
ALTER TABLE "users" DROP CONSTRAINT "users_roleId_fkey";
ALTER TABLE "user_empresas" DROP CONSTRAINT "user_empresas_roleId_fkey";

-- Drop roleId columns
ALTER TABLE "users" DROP COLUMN "roleId";
ALTER TABLE "user_empresas" DROP COLUMN "roleId";

-- Drop roles table
DROP TABLE "roles";

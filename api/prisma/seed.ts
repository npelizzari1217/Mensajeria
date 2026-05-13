import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin1234', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@mensajeria.com' },
    update: {},
    create: {
      email: 'admin@mensajeria.com',
      password: passwordHash,
      name: 'Admin',
      role: Role.ADMIN,
    },
  });

  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@mensajeria.com' },
    update: {},
    create: {
      email: 'supervisor@mensajeria.com',
      password: passwordHash,
      name: 'Supervisor',
      role: Role.SUPERVISOR,
    },
  });

  const tecnico = await prisma.user.upsert({
    where: { email: 'tecnico@mensajeria.com' },
    update: {},
    create: {
      email: 'tecnico@mensajeria.com',
      password: passwordHash,
      name: 'Técnico',
      role: Role.TECNICO,
    },
  });

  const usuario = await prisma.user.upsert({
    where: { email: 'usuario@mensajeria.com' },
    update: {},
    create: {
      email: 'usuario@mensajeria.com',
      password: passwordHash,
      name: 'Usuario',
      role: Role.USUARIO,
    },
  });

  console.log('✅ Seed completed:');
  console.log(`  - ${admin.email} (${admin.role})`);
  console.log(`  - ${supervisor.email} (${supervisor.role})`);
  console.log(`  - ${tecnico.email} (${tecnico.role})`);
  console.log(`  - ${usuario.email} (${usuario.role})`);
  console.log('\nDefault password for all users: Admin1234');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

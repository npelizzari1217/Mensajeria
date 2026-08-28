import { PrismaClient } from '@prisma/client';
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
      roleId: 1,
    },
  });

  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@mensajeria.com' },
    update: {},
    create: {
      email: 'supervisor@mensajeria.com',
      password: passwordHash,
      name: 'Supervisor',
      roleId: 2,
    },
  });

  const tecnico = await prisma.user.upsert({
    where: { email: 'tecnico@mensajeria.com' },
    update: {},
    create: {
      email: 'tecnico@mensajeria.com',
      password: passwordHash,
      name: 'Técnico',
      roleId: 3,
    },
  });

  const usuario = await prisma.user.upsert({
    where: { email: 'usuario@mensajeria.com' },
    update: {},
    create: {
      email: 'usuario@mensajeria.com',
      password: passwordHash,
      name: 'Usuario',
      roleId: 4,
    },
  });

  console.log('✅ Seed completed:');
  console.log(`  - ${admin.email} (roleId: ${admin.roleId})`);
  console.log(`  - ${supervisor.email} (roleId: ${supervisor.roleId})`);
  console.log(`  - ${tecnico.email} (roleId: ${tecnico.roleId})`);
  console.log(`  - ${usuario.email} (roleId: ${usuario.roleId})`);
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

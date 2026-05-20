import { PrismaClient, Role, MessageStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin1234', 12);

  // ── Users ──────────────────────────────────────────────────────────
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

  // ── Messages ───────────────────────────────────────────────────────

  // Mensaje 1: Admin → Supervisor
  const msg1 = await prisma.message.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      senderId: admin.id,
      subject: 'Bienvenido al sistema',
      body: 'Este es un mensaje de bienvenida para el Supervisor.',
      empresaId: '00000000-0000-0000-0000-000000000001',
      createdAt: new Date('2026-01-15T10:00:00Z'),
    },
  });

  await prisma.messageRecipient.upsert({
    where: {
      messageId_recipientId: {
        messageId: msg1.id,
        recipientId: supervisor.id,
      },
    },
    update: {},
    create: {
      messageId: msg1.id,
      recipientId: supervisor.id,
      status: MessageStatus.READ,
      readAt: new Date('2026-01-15T11:00:00Z'),
      createdAt: new Date('2026-01-15T10:00:00Z'),
    },
  });

  // Mensaje 2: Supervisor → Técnico
  const msg2 = await prisma.message.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      senderId: supervisor.id,
      subject: 'Revisión de equipos',
      body: 'Por favor revisa los equipos del laboratorio 3.',
      empresaId: '00000000-0000-0000-0000-000000000001',
      createdAt: new Date('2026-01-16T09:00:00Z'),
    },
  });

  await prisma.messageRecipient.upsert({
    where: {
      messageId_recipientId: {
        messageId: msg2.id,
        recipientId: tecnico.id,
      },
    },
    update: {},
    create: {
      messageId: msg2.id,
      recipientId: tecnico.id,
      status: MessageStatus.DELIVERED,
      createdAt: new Date('2026-01-16T09:00:00Z'),
    },
  });

  // Mensaje 3: Admin → Usuario (con respuesta)
  const msg3 = await prisma.message.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      senderId: admin.id,
      subject: 'Nueva política',
      body: 'Se ha actualizado la política de seguridad.',
      empresaId: '00000000-0000-0000-0000-000000000001',
      createdAt: new Date('2026-01-17T08:00:00Z'),
    },
  });

  await prisma.messageRecipient.upsert({
    where: {
      messageId_recipientId: {
        messageId: msg3.id,
        recipientId: usuario.id,
      },
    },
    update: {},
    create: {
      messageId: msg3.id,
      recipientId: usuario.id,
      status: MessageStatus.PENDING,
      createdAt: new Date('2026-01-17T08:00:00Z'),
    },
  });

  // Mensaje 4: Respuesta de Usuario → Admin (reply a msg3)
  const msg4 = await prisma.message.upsert({
    where: { id: '00000000-0000-0000-0000-000000000004' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000004',
      senderId: usuario.id,
      subject: 'Re: Nueva política',
      body: 'Gracias, lo revisaré a la brevedad.',
      parentMessageId: msg3.id,
      empresaId: '00000000-0000-0000-0000-000000000001',
      createdAt: new Date('2026-01-17T09:30:00Z'),
    },
  });

  await prisma.messageRecipient.upsert({
    where: {
      messageId_recipientId: {
        messageId: msg4.id,
        recipientId: admin.id,
      },
    },
    update: {},
    create: {
      messageId: msg4.id,
      recipientId: admin.id,
      status: MessageStatus.READ,
      readAt: new Date('2026-01-17T10:00:00Z'),
      createdAt: new Date('2026-01-17T09:30:00Z'),
    },
  });

  console.log('✅ Seed completed:');
  console.log(`  - ${admin.email} (${admin.role})`);
  console.log(`  - ${supervisor.email} (${supervisor.role})`);
  console.log(`  - ${tecnico.email} (${tecnico.role})`);
  console.log(`  - ${usuario.email} (${usuario.role})`);
  console.log('  - 4 mensajes de ejemplo');
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

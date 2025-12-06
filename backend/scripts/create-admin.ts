import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  const email = 'admin@clinica.com';
  const password = 'Password123!!';
  const name = 'Administrador';

  try {
    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('⚠️  El usuario admin ya existe');
      return;
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario admin
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN',
      },
    });

    console.log('✅ Usuario admin creado exitosamente');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Nombre: ${admin.name}`);
    console.log(`   Rol: ${admin.role}`);
  } catch (error: any) {
    console.error('❌ Error al crear usuario admin:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin()
  .then(() => {
    console.log('✨ Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });


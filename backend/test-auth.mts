import prisma from './src/config/database.js';
import bcrypt from 'bcryptjs';

const user = await prisma.user.findFirst({ where: { email: 'admin@clinica.com' } });
if (!user) { console.log('USER NOT FOUND'); process.exit(1); }
console.log('email:', user.email);
console.log('hash prefix:', user.password.substring(0, 7));
const ok = await bcrypt.compare('Admin123!', user.password);
console.log('password matches:', ok);
await prisma.$disconnect();

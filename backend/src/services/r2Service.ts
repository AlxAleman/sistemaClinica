import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { env } from '../config/env';

// R2 es compatible con S3, usa el endpoint de Cloudflare
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

const CATEGORY_FOLDERS: Record<string, string> = {
  receta:      'recetas',
  radiografia: 'radiografias',
  laboratorio: 'laboratorio',
  referencia:  'referencias',
  informe:     'informes',
  otro:        'otros',
};

/**
 * Construye la key en R2: patients/{patientId}/recetas/filename.ext
 */
export const buildR2Key = (
  patientId: string,
  patientName: string,
  category: string,
  originalFileName: string,
): string => {
  // Normalizar nombre del paciente: sin espacios ni caracteres especiales
  const safeName = patientName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')  // quitar tildes
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const folder = CATEGORY_FOLDERS[category] ?? 'otros';
  const timestamp = Date.now();
  const ext = originalFileName.split('.').pop() ?? '';
  const baseName = originalFileName
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .slice(0, 50);

  const fileName = `${timestamp}-${baseName}.${ext}`;
  return `patients/${patientId}-${safeName}/${folder}/${fileName}`;
};

/**
 * Sube un archivo (Buffer) a R2 y retorna la URL pública
 */
export const uploadToR2 = async (
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> => {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  // URL pública usando el dominio público del bucket
  return `${env.R2_PUBLIC_URL}/${key}`;
};

/**
 * Elimina un archivo de R2 dado su key (extraída de la URL)
 */
export const deleteFromR2 = async (fileUrl: string): Promise<void> => {
  const publicBase = env.R2_PUBLIC_URL.replace(/\/$/, '');
  if (!fileUrl.startsWith(publicBase)) return; // no es un archivo R2

  const key = fileUrl.slice(publicBase.length + 1);
  try {
    await r2Client.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET, Key: key }));
  } catch {
    // Si no existe, no es error crítico
  }
};

export const r2Enabled = (): boolean =>
  !!(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET);

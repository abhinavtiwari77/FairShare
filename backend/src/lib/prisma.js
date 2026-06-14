import { PrismaClient } from '@prisma/client';

const url = process.env.DATABASE_URL;
const dbUrl = url ? (url.includes('?') ? `${url}&connection_limit=5&pool_timeout=10` : `${url}?connection_limit=5&pool_timeout=10`) : undefined;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl
    }
  }
});

export default prisma;

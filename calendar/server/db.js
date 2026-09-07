// Lazy, non-fatal Prisma singleton — a DB hiccup must never stop the server
// from listening (so Railway's healthcheck still passes and logs are readable).
let prisma = null;
let dbReady = false;

export async function initPrisma() {
  try {
    const { PrismaClient } = await import("@prisma/client");
    prisma = new PrismaClient();
    await prisma.$connect();
    dbReady = true;
    console.log("[db] Prisma connected");
  } catch (err) {
    dbReady = false;
    console.error("[db] Prisma init failed (server stays up):", err?.message || err);
  }
  return prisma;
}

export function getPrisma() {
  return prisma;
}

export function isDbReady() {
  return dbReady;
}

import "server-only";

import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function isStaleConnection(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P1017";
  }
  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return (
      error.message.includes("Closed") ||
      error.message.includes("connection closed")
    );
  }
  return false;
}

function createPrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn"] : ["error"],
  });

  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          try {
            return await query(args);
          } catch (error) {
            if (!isStaleConnection(error)) {
              throw error;
            }

            await client.$disconnect();
            await client.$connect();
            return await query(args);
          }
        },
      },
    },
  });
}

export const db = (globalForPrisma.prisma ?? createPrismaClient()) as PrismaClient;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

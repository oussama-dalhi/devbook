import { prisma } from "./db/prisma.js";

const main = async () => {
  try {
    await prisma.$connect();
    console.log("Connection established");
    
    const users = await prisma.user.findMany();
    console.log("users:", JSON.stringify(users, null, 2));
  } finally {
    await prisma.$disconnect();
  }
};

main().catch((error) => {
  console.error("DB script failed:", error);
  process.exitCode = 1;
});

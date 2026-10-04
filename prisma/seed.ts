import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Keep the legacy singleton available so the first real authenticated user
  // can claim an existing local profile without losing its data.
  await prisma.profile.upsert({
    where: { id: "me" },
    update: {},
    create: {
      id: "me",
      fullName: "",
      email: "",
      summary: "",
      minFitScore: 8,
      autoApply: false,
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

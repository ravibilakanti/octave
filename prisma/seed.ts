import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
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

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const amateurPw = process.env.AMATEUR_PASSWORD ?? "changeme-amateur";
  const nxtmvPw = process.env.NXTMV_PASSWORD ?? "changeme-nxtmv";

  await prisma.user.upsert({
    where: { username: "Amateur" },
    update: { password: await bcrypt.hash(amateurPw, 10) },
    create: { username: "Amateur", name: "Amateur", isExpert: false, password: await bcrypt.hash(amateurPw, 10) },
  });
  await prisma.user.upsert({
    where: { username: "nxtmv" },
    update: { password: await bcrypt.hash(nxtmvPw, 10) },
    create: { username: "nxtmv", name: "nxtmv", isExpert: true, password: await bcrypt.hash(nxtmvPw, 10) },
  });

  console.log("Seeded users: Amateur, nxtmv");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());

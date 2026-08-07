import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Nonagonal Fecha 1: Atenas (Río Cuarto) vs Villa Mitre — 2 de agosto 2026
  const match = await prisma.match.updateMany({
    where: {
      phase: "NONAGONAL",
      fixtureRound: 1,
      homeTeam: "Atenas (Río Cuarto)",
      awayTeam: "Villa Mitre",
    },
    data: {
      goalsVM: 1,
      goalsOpponent: 0,
      scorers: ["Leonel Monti"],
    },
  });

  console.log(`✅ Partido actualizado. Filas modificadas: ${match.count}`);
  console.log("   Resultado: Atenas 0 - 1 Villa Mitre (Monti)");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

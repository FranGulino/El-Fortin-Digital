import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import PartidosClient from "./PartidosClient";
import Header from "@/components/Header";

export const revalidate = 0; // Respuesta instantánea al registrar asistencia

export default async function PartidosPage() {
  const { userId } = await auth();

  // Obtenemos los partidos
  const matches = await prisma.match.findMany({
    orderBy: [
      { date: "asc" },
      { fixtureRound: "asc" }
    ],
    include: {
      attendances: true,
    },
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#111412] text-[#e1e3de]">
      <Header />

      <main className="flex-1">
        <PartidosClient matches={matches} userId={userId} />
      </main>
    </div>
  );
}

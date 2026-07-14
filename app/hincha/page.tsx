import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import Header from "@/components/Header";
import Image from "next/image";
import HinchaHistorial from "@/components/HinchaHistorial";

export const revalidate = 0; // Respuesta instantánea al registrar asistencia

export default async function HinchaPage() {
  const { userId } = await auth();
  const user = await currentUser();

  // 1. Obtenemos los partidos
  const matches = await prisma.match.findMany({
    orderBy: [
      { date: "asc" },
      { fixtureRound: "asc" }
    ],
    include: {
      attendances: true,
    },
  });

  const playedMatches = matches.filter((m) => m.goalsVM !== null && m.goalsOpponent !== null);
  
  // 2. Filtramos la asistencia del usuario actual
  const userAttendances = playedMatches.filter((match) =>
    match.attendances.some((att) => att.userId === userId)
  );

  // 3. Estadísticas de Localía (🏟️ Partidos en El Fortín)
  const localPlayedMatches = playedMatches.filter((m) => m.homeTeam === "Villa Mitre");
  const userLocalAttendances = localPlayedMatches.filter((match) =>
    match.attendances.some((att) => att.userId === userId && att.type === "PRESENCIAL")
  );

  let stats = {
    localPlayed: localPlayedMatches.length,
    localAttended: userLocalAttendances.length,
    localWins: 0,
    localDraws: 0,
    localLosses: 0,
    goalsScored: 0,
    cleanSheets: 0,
    winPercentage: 0,
    attendancePercentage: 0,
    rank: "Hincha a la Distancia",
  };

  userLocalAttendances.forEach((match) => {
    const goalsVM = match.goalsVM!;
    const goalsOpponent = match.goalsOpponent!;

    stats.goalsScored += goalsVM;

    if (goalsVM > goalsOpponent) {
      stats.localWins += 1;
    } else if (goalsVM === goalsOpponent) {
      stats.localDraws += 1;
    } else {
      stats.localLosses += 1;
    }

    if (goalsOpponent === 0) {
      stats.cleanSheets += 1;
    }
  });

  // Porcentaje de Victorias y Asistencia de Local
  if (stats.localAttended > 0) {
    stats.winPercentage = Math.round((stats.localWins / stats.localAttended) * 100);
  }
  if (stats.localPlayed > 0) {
    stats.attendancePercentage = Math.round((stats.localAttended / stats.localPlayed) * 100);
  }

  // Rango del Hincha en El Fortín
  if (stats.localAttended >= 8) {
    stats.rank = "Abonado de Corazón";
  } else if (stats.localAttended >= 4) {
    stats.rank = "Grito de Popular";
  } else if (stats.localAttended >= 1) {
    stats.rank = "Hincha de Tribuna";
  }

  // 4. Estadísticas comparativas a la distancia (Remoto o visitante)
  const userDistanciaAttendances = playedMatches.filter((match) => {
    const isLocal = match.homeTeam === "Villa Mitre";
    const userAtt = match.attendances.find((att) => att.userId === userId);
    return userAtt && (userAtt.type === "A_LA_DISTANCIA" || !isLocal);
  });

  let distanciaWins = 0;
  userDistanciaAttendances.forEach((match) => {
    if (match.goalsVM! > match.goalsOpponent!) {
      distanciaWins += 1;
    }
  });

  const distanciaWinPercentage = userDistanciaAttendances.length > 0
    ? Math.round((distanciaWins / userDistanciaAttendances.length) * 100)
    : 0;

  // 5. Ranking de Goleadores Presenciados de Local
  const scorersMap: Record<string, number> = {};
  userLocalAttendances.forEach((match) => {
    match.scorers.forEach((scorer) => {
      const cleanName = scorer.trim();
      if (cleanName) {
        scorersMap[cleanName] = (scorersMap[cleanName] || 0) + 1;
      }
    });
  });

  const topScorers = Object.entries(scorersMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const fullName = user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.username || "Hincha Tricolor"
    : "Hincha Tricolor";

  return (
    <div className="flex flex-col min-h-screen bg-[#111412] text-[#e1e3de] relative overflow-hidden">
      
      {/* Header envuelto de forma limpia */}
      <Header />

      <main className="relative z-10 flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-16 space-y-8 font-sans">
        
        {/* Cabecera de Página */}
        <div className="border-b border-[#414942]/20 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans uppercase">
            {"Perfil del Hincha"}
          </h1>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
            {"Estadísticas de efectividad y asistencia en El Fortín"}
          </p>
        </div>

        {/* Layout en Grid de 2 columnas simétricas con alturas alineadas de 195px */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          
          {/* Fila 1 Izquierda: Credencial Digital */}
          <div className="relative overflow-hidden rounded-[8px] border border-[#2d6a4f]/50 bg-gradient-to-br from-[#1d211e] via-[#1d211e] to-[#105238]/30 p-6 shadow-xl flex flex-col justify-between min-h-[195px]">
            {/* Escudo marca de agua original */}
            <div className="absolute right-4 bottom-4 h-28 w-28 opacity-[0.03] pointer-events-none">
              <Image
                src="/club-villa-mitre-bahia-580x580.webp"
                alt="Villa Mitre Watermark"
                width={112}
                height={112}
              />
            </div>

            <div className="flex justify-between items-center gap-6 pb-4 border-b border-[#414942]/30">
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14 overflow-hidden rounded-full border border-[#2d6a4f]/60 bg-zinc-900 shadow-inner">
                  {user?.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt={fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-lg font-bold text-zinc-500">
                      {fullName[0]}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-start gap-1.5">
                  <h2 className="text-base font-bold text-white tracking-tight leading-none font-sans">
                    {fullName}
                  </h2>
                  <span className="inline-flex items-center rounded-full bg-green-950/60 px-2.5 py-0.5 text-[9px] font-bold text-green-400 border border-green-800/30 uppercase tracking-wider">
                    {stats.rank}
                  </span>
                </div>
              </div>

              <div className="text-right space-y-0.5">
                <span className="text-[8px] text-zinc-500 font-bold tracking-widest block uppercase">
                  {"Código de Hincha"}
                </span>
                <span className="text-[10px] font-mono font-bold text-zinc-350 block">
                  {userId?.slice(-12).toUpperCase() ?? "CVM-HINCHA-2026"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 text-zinc-400">
              <div>
                <span className="text-[8px] text-zinc-500 font-bold tracking-widest block uppercase font-sans">{"Partidos Local"}</span>
                <span className="text-sm font-extrabold text-white">{stats.localAttended}</span>
              </div>
              <div>
                <span className="text-[8px] text-zinc-500 font-bold tracking-widest block uppercase font-sans">{"Goles Gritados"}</span>
                <span className="text-sm font-extrabold text-white">{stats.goalsScored}</span>
              </div>
              <div>
                <span className="text-[8px] text-zinc-500 font-bold tracking-widest block uppercase font-sans">{"Vallas Invictas"}</span>
                <span className="text-sm font-extrabold text-white">{stats.cleanSheets}</span>
              </div>
            </div>
          </div>

          {/* Fila 1 Derecha: Historial en El Fortín (Desglose) */}
          <div className="p-6 rounded-[8px] bg-[#1d211e] border border-zinc-800 flex flex-col justify-between min-h-[195px]">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2">
              {"Historial en El Fortín"}
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center my-auto">
              <div className="p-3.5 rounded-[8px] bg-green-950/20 border border-green-900/30">
                <span className="text-[9px] text-green-400 font-bold uppercase tracking-wider block">{"Victorias"}</span>
                <span className="text-xl font-black text-white mt-1 block">{stats.localWins}</span>
              </div>
              <div className="p-3.5 rounded-[8px] bg-zinc-950/30 border border-zinc-850">
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">{"Empates"}</span>
                <span className="text-xl font-black text-white mt-1 block">{stats.localDraws}</span>
              </div>
              <div className="p-3.5 rounded-[8px] bg-red-950/15 border border-red-900/20">
                <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider block">{"Derrotas"}</span>
                <span className="text-xl font-black text-white mt-1 block">{stats.localLosses}</span>
              </div>
            </div>
          </div>

          {/* Fila 2 Izquierda: Asistencia a El Fortín (Fidelidad con Números Gigantes Resaltados) */}
          <div className="p-6 rounded-[8px] bg-gradient-to-br from-[#1d211e] to-zinc-900/30 border border-zinc-800 flex flex-col justify-between min-h-[200px]">
            <div>
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2 mb-3">
                {"Asistencia a El Fortín"}
              </h3>
            </div>
            
            <div className="flex justify-between items-center py-2">
              <div className="space-y-1">
                <span className="text-[9px] text-zinc-500 font-bold uppercase block tracking-wider">{"Partidos Asistidos"}</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white tracking-tight">{stats.localAttended}</span>
                  <span className="text-zinc-650 text-xl">{"/"}</span>
                  <span className="text-zinc-550 text-xl font-medium">{stats.localPlayed}</span>
                </div>
              </div>

              <div className="text-right space-y-1">
                <span className="text-[9px] text-zinc-500 font-bold uppercase block tracking-wider">{"Fidelidad"}</span>
                <span className="text-4xl font-extrabold text-[#2d6a4f] tracking-tighter">{stats.attendancePercentage}%</span>
              </div>
            </div>

            <div className="pt-2">
              <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#2d6a4f]" 
                  style={{ width: `${stats.attendancePercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Fila 2 Derecha: Efectividad de Victorias de Local (Números Gigantes Resaltados) */}
          <div className="p-6 rounded-[8px] bg-gradient-to-br from-[#1d211e] to-zinc-900/30 border border-zinc-800 flex flex-col justify-between min-h-[200px]">
            <div>
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2 mb-3">
                {"Rendimiento de Local"}
              </h3>
            </div>

            <div className="flex justify-between items-center py-2">
              <div className="space-y-1">
                <span className="text-[9px] text-zinc-500 font-bold uppercase block tracking-wider">{"Puntos Obtenidos"}</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white tracking-tight">
                    {stats.localWins * 3 + stats.localDraws}
                  </span>
                  <span className="text-zinc-650 text-xl">{"/"}</span>
                  <span className="text-zinc-550 text-xl font-medium">{stats.localAttended * 3}</span>
                </div>
              </div>

              <div className="text-right space-y-1">
                <span className="text-[9px] text-zinc-500 font-bold uppercase block tracking-wider">{"Efectividad"}</span>
                <span className="text-4xl font-extrabold text-[#2d6a4f] tracking-tighter">{stats.winPercentage}%</span>
              </div>
            </div>

            <div className="pt-2">
              <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#2d6a4f]" 
                  style={{ width: `${stats.winPercentage}%` }}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Fila 3: Ranking de Goleadores de Local (Ancho Completo) */}
        <div className="p-6 rounded-[8px] bg-[#1d211e] border border-zinc-850 space-y-4 w-full">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2">
            {"Tus Goles Presenciados de Local"}
          </h3>
          {topScorers.length === 0 ? (
            <p className="text-xs text-zinc-500 italic py-4 text-center">
              {"Registrá partidos con goles a favor de Villa Mitre de local para armar tu ranking de goleadores presenciados."}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {topScorers.map((scorer, idx) => (
                <div key={scorer.name} className="relative p-4 rounded-[8px] bg-zinc-950/30 border border-zinc-900 flex flex-col justify-between items-center text-center">
                  <span className="absolute top-2 left-2 text-[10px] font-mono text-zinc-700">
                    {"#"} {idx + 1}
                  </span>
                  <span className="text-2xl mt-1">{"⚽"}</span>
                  <div className="mt-2 text-center">
                    <span className="text-xs font-bold text-white block truncate max-w-[150px]">{scorer.name}</span>
                    <span className="text-[10px] text-green-500 font-extrabold block mt-0.5 uppercase tracking-wider">
                      {scorer.count} {scorer.count === 1 ? "Gol" : "Goles"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Tabla del Historial de Asistencia General con pestañas de Local y Visitante/TV */}
        <HinchaHistorial matches={matches as any} userId={userId} />

      </main>

      <footer className="border-t border-zinc-900 bg-zinc-950 py-8 text-center">
        <p className="text-[10px] text-zinc-600 font-bold tracking-wider uppercase">
          {"El Fortín Digital — Bitácora Personal de Villa Mitre © 2026"}
        </p>
      </footer>
    </div>
  );
}

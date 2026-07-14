import { AttendanceType } from "@prisma/client";
import Image from "next/image";
import AttendanceButtons from "./AttendanceButtons";

interface MatchCardProps {
  match: {
    id: string;
    date: Date;
    fixtureRound: number;
    phase: string;
    homeTeam: string;
    awayTeam: string;
    goalsVM: number | null;
    goalsOpponent: number | null;
    scorers: string[];
    attendances: {
      type: AttendanceType;
      userId: string;
    }[];
  };
  currentUserId: string | null;
}

export default function MatchCard({ match, currentUserId }: MatchCardProps) {
  const isPlayed = match.goalsVM !== null && match.goalsOpponent !== null;

  // Deducimos el resultado del partido desde la perspectiva de Villa Mitre
  let resultType: "VICTORIA" | "EMPATE" | "DERROTA" | "FUTURO" = "FUTURO";

  if (isPlayed) {
    const goalsVM = match.goalsVM!;
    const goalsOpponent = match.goalsOpponent!;
    if (goalsVM > goalsOpponent) {
      resultType = "VICTORIA";
    } else if (goalsVM === goalsOpponent) {
      resultType = "EMPATE";
    } else {
      resultType = "DERROTA";
    }
  }

  // Buscamos si el usuario actual asistió y el tipo de asistencia
  const userAttendance = currentUserId
    ? match.attendances.find((att) => att.userId === currentUserId)
    : null;

  const activeAttendanceType = userAttendance ? userAttendance.type : null;

  // Formateamos la fecha en español (ej. "Dom, 12 de Jul")
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-AR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
  };

  // Badge de resultado (Win/Draw/Loss) según especificación técnica (colores del club)
  const badgeClasses = () => {
    switch (resultType) {
      case "VICTORIA":
        return "bg-green-700 text-white border border-green-600/30 font-black";
      case "DERROTA":
        return "bg-[#8a2c2c] text-white border border-[#8a2c2c]/30 font-black";
      case "EMPATE":
        return "bg-[#414942] text-zinc-200 border border-zinc-700/50 font-black";
      case "FUTURO":
      default:
        return "bg-zinc-900 text-zinc-500 border border-zinc-800 font-bold";
    }
  };

  // Clases condicionales facheras para el fondo y bordes
  const cardClasses = () => {
    let base = "flex flex-col justify-between p-6 rounded-[8px] border transition-all duration-300 hover:scale-[1.01] group ";
    
    switch (resultType) {
      case "VICTORIA":
        return base + "border-[#2d6a4f]/30 bg-gradient-to-br from-[#105238]/15 via-[#1d211e] to-[#111412] hover:border-green-500/50 hover:shadow-lg hover:shadow-green-950/10";
      case "DERROTA":
        return base + "border-red-950/50 bg-gradient-to-br from-red-950/10 via-[#1d211e] to-[#111412] hover:border-red-900/30";
      case "EMPATE":
        return base + "border-zinc-850 bg-[#1d211e] hover:border-zinc-700/60";
      case "FUTURO":
      default:
        return base + "border-dashed border-zinc-800 bg-zinc-950/10 hover:border-[#2d6a4f]/30";
    }
  };

  const resultLabel = () => {
    switch (resultType) {
      case "VICTORIA":
        return "V";
      case "DERROTA":
        return "D";
      case "EMPATE":
        return "E";
      case "FUTURO":
        return "PROX";
    }
  };

  // Componente interno para dibujar el escudo del club de forma premium
  const TeamShield = ({ teamName }: { teamName: string }) => {
    const isVM = teamName === "Villa Mitre";

    if (isVM) {
      return (
        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-zinc-900 p-1 border border-zinc-800">
          <Image
            src="/club-villa-mitre-bahia-580x580.webp"
            alt="Villa Mitre"
            fill
            className="object-contain p-1"
          />
        </div>
      );
    }

    // Escudo genérico premium para los rivales utilizando sus siglas
    const initials = teamName
      .replace("(MdP)", "")
      .trim()
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return (
      <div className="relative h-12 w-12 flex-shrink-0 rounded-full bg-[#111412] border border-zinc-800 flex items-center justify-center shadow-inner group-hover:border-zinc-700 transition-colors">
        <span className="text-xs font-extrabold text-zinc-400 tracking-wider font-sans">
          {initials}
        </span>
      </div>
    );
  };

  return (
    <div className={cardClasses()}>
      <div>
        {/* Cabecera de la Tarjeta (Fecha e Indicador de resultado) */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-white tracking-wide uppercase">
            {"Fecha"} {match.fixtureRound}
          </span>
          <span className={`text-[10px] font-black tracking-wider px-3 py-0.5 rounded-full ${badgeClasses()}`}>
            {resultLabel()}
          </span>
        </div>

        {/* Sección de Escudos Enfrentados y Marcador Central */}
        <div className="flex items-center justify-between py-2 mb-4">
          {/* Equipo Local */}
          <div className="flex flex-col items-center gap-2 w-5/12 text-center">
            <TeamShield teamName={match.homeTeam} />
            <span className={`text-xs font-bold tracking-tight truncate w-full ${match.homeTeam === "Villa Mitre" ? "text-white" : "text-zinc-400"}`}>
              {match.homeTeam}
            </span>
          </div>

          {/* Marcador Central */}
          <div className="flex flex-col items-center justify-center w-2/12">
            {isPlayed ? (
              <div className="text-2xl font-black text-white tracking-tighter tabular-nums font-sans">
                {match.goalsVM !== null && match.goalsOpponent !== null ? (
                  match.homeTeam === "Villa Mitre" ? (
                    `${match.goalsVM} - ${match.goalsOpponent}`
                  ) : (
                    `${match.goalsOpponent} - ${match.goalsVM}`
                  )
                ) : (
                  "VS"
                )}
              </div>
            ) : (
              <div className="text-xs font-extrabold text-zinc-600 tracking-wider">
                {"VS"}
              </div>
            )}
            <span className="text-[9px] font-bold text-zinc-500 tracking-wider mt-1 whitespace-nowrap">
              {formatDate(match.date)}
            </span>
          </div>

          {/* Equipo Visitante */}
          <div className="flex flex-col items-center gap-2 w-5/12 text-center">
            <TeamShield teamName={match.awayTeam} />
            <span className={`text-xs font-bold tracking-tight truncate w-full ${match.awayTeam === "Villa Mitre" ? "text-white" : "text-zinc-400"}`}>
              {match.awayTeam}
            </span>
          </div>
        </div>

        {/* Detalle de Goleadores (si aplica) */}
        {isPlayed && match.scorers.length > 0 && (
          <div className="text-[10px] text-zinc-500 italic text-center mb-4 leading-relaxed">
            {"⚽"} {match.scorers.join(", ")}
          </div>
        )}
      </div>

      {/* Footer de Tarjeta (Sede, Competición y Botones de Asistencia) */}
      <div className="mt-2 space-y-3">
        {/* Metadato del Estadio y Competición */}
        <div className="pt-3 border-t border-[#414942]/30 flex items-center justify-between text-[9px] font-bold text-zinc-500 tracking-wider uppercase">
          <span>
            {match.homeTeam === "Villa Mitre" ? "🏟️ El Fortín" : "✈️ Visitante"}
          </span>
          <span>
            {match.phase.replace("_", " ")}
          </span>
        </div>

        {/* Botones Interactivos de Asistencia */}
        <AttendanceButtons matchId={match.id} activeType={activeAttendanceType} isHome={match.homeTeam === "Villa Mitre"} />
      </div>
    </div>
  );
}

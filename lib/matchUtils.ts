export function getMatchRoundLabel(
  phase: string,
  fixtureRound: number,
  options?: { short?: boolean }
): string {
  if (phase === "ETAPA_ELIMINATORIA") {
    switch (fixtureRound) {
      case 1:
        return options?.short ? "16avos (Ida)" : "16avos de Final (Ida)";
      case 2:
        return options?.short ? "16avos (Vuelta)" : "16avos de Final (Vuelta)";
      case 3:
        return options?.short ? "Octavos (Ida)" : "Octavos de Final (Ida)";
      case 4:
        return options?.short ? "Octavos (Vuelta)" : "Octavos de Final (Vuelta)";
      case 5:
        return options?.short ? "Cuartos (Ida)" : "Cuartos de Final (Ida)";
      case 6:
        return options?.short ? "Cuartos (Vuelta)" : "Cuartos de Final (Vuelta)";
      case 7:
        return options?.short ? "Semifinal (Ida)" : "Semifinales (Ida)";
      case 8:
        return options?.short ? "Semifinal (Vuelta)" : "Semifinales (Vuelta)";
      case 9:
        return options?.short ? "Final (Ida)" : "Final (Ida)";
      case 10:
        return options?.short ? "Final (Vuelta)" : "Final (Vuelta)";
      default:
        return options?.short ? `Cruce ${fixtureRound}` : `Cruce Eliminatorio (${fixtureRound})`;
    }
  }

  return `Fecha ${fixtureRound}`;
}

export function getPhaseLabel(phase: string): string {
  switch (phase) {
    case "FASE_1":
      return "Fase 1 (Zona A)";
    case "NONAGONAL":
      return "Nonagonal";
    case "ETAPA_ELIMINATORIA":
      return "Reválida";
    default:
      return phase.replace("_", " ");
  }
}

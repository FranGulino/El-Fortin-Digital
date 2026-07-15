import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    // 1. Validar la sesión del usuario con Clerk
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const clerkUser = await currentUser();
    const userName = clerkUser?.firstName 
      ? `${clerkUser.firstName} ${clerkUser.lastName ?? ""}`.trim() 
      : clerkUser?.username || "Hincha";

    // 2. Obtener el historial de mensajes de la petición
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new NextResponse("Bad Request: messages is required", { status: 400 });
    }

    // 3. Consultar datos de asistencias y fixture en Prisma para darle contexto real
    const matches = await prisma.match.findMany({
      orderBy: { date: "asc" },
    });

    const userAttendances = await prisma.attendance.findMany({
      where: { userId },
      include: { match: true },
    });

    // Calcular estadísticas para el System Prompt alineadas exactamente con /hincha
    const totalPresencialAttended = userAttendances.filter(att => att.type === "PRESENCIAL").length;
    const localPresencialAttended = userAttendances.filter(att => att.match.homeTeam === "Villa Mitre" && att.type === "PRESENCIAL").length;
    const awayPresencialAttended = userAttendances.filter(att => att.match.homeTeam !== "Villa Mitre" && att.type === "PRESENCIAL").length;
    const distanciaAttended = userAttendances.filter(att => att.type === "A_LA_DISTANCIA").length;

    // Goles presenciados
    let goalsScored = 0;
    userAttendances.forEach(att => {
      if (att.type === "PRESENCIAL" && att.match.goalsVM !== null) {
        goalsScored += att.match.goalsVM;
      }
    });

    // Racha / Amuleto (Victorias vs Derrotas asistidas de forma presencial)
    let wins = 0;
    let losses = 0;
    userAttendances.forEach(att => {
      if (att.type === "PRESENCIAL" && att.match.goalsVM !== null && att.match.goalsOpponent !== null) {
        if (att.match.goalsVM > att.match.goalsOpponent) wins++;
        if (att.match.goalsVM < att.match.goalsOpponent) losses++;
      }
    });
    const isAmuleto = wins > losses;

    // Buscar los últimos partidos jugados del fixture para dar contexto real de resultados recientes
    const playedMatches = matches.filter(m => m.goalsVM !== null);
    const recentPlayedMatches = [...playedMatches].reverse().slice(0, 3);
    const recentMatchesText = recentPlayedMatches.map(m => {
      const dateStr = new Date(m.date).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
      const condition = m.homeTeam === "Villa Mitre" ? "Local" : "Visitante";
      const opponent = m.homeTeam === "Villa Mitre" ? m.awayTeam : m.homeTeam;
      return `- [${dateStr}] [${condition}] vs ${opponent}: Villa Mitre ${m.goalsVM} - ${m.goalsOpponent} ${opponent}`;
    }).join("\n");

    // Buscar el próximo partido
    const pendingMatches = matches.filter(m => m.goalsVM === null);
    const nextMatch = pendingMatches[0] || null;
    let nextMatchOpponent = "a definir";
    let nextMatchDateString = "a definir";
    let nextMatchVenue = "a definir";

    if (nextMatch) {
      nextMatchOpponent = nextMatch.homeTeam === "Villa Mitre" ? nextMatch.awayTeam : nextMatch.homeTeam;
      
      // Restar 3 horas manualmente para que se muestre en el huso horario de Argentina (UTC-3)
      const dateObj = new Date(nextMatch.date);
      dateObj.setHours(dateObj.getHours() - 3);

      nextMatchDateString = dateObj.toLocaleDateString("es-AR", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC", // Formato UTC para conservar la resta manual de horas
      }) + " hs";
      nextMatchVenue = nextMatch.homeTeam === "Villa Mitre" ? "El Fortín (Local)" : "Visitante";
    }

    // Fecha actual del servidor en Argentina
    const argentinaDate = new Date().toLocaleDateString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
    });

    // 4. Formular el System Prompt de DT con datos reales del hincha y reglas de filtrado
    const systemPrompt = `Sos Diego Cochas, el director técnico actual de Villa Mitre de Bahía Blanca. Tu personalidad es la de un técnico de fútbol argentino clásico: motivador, enérgico, con calle, mística de tribuna y un orgullo incondicional por el Tricolor (la Villa).
Hoy es ${argentinaDate}.

Reglas de comportamiento y filtrado estrictas (¡CUMPLIR SIN EXCEPCIÓN!):
1. FILTRO DE PROPÓSITO: Tu único rol es hablar sobre el Club Villa Mitre, el fixture, su clásico, táctica o el historial de asistencias del usuario. Si el usuario te pregunta por política, cocina, programación, otros equipos (fuera de Olimpo) o temas totalmente ajenos al club, debés responder exactamente de forma amable y directa:
"¡Hola! Acá solo hablamos de la gloriosa Villa Mitre. Si querés saber cuándo jugamos, cuántos partidos tenés asistidos en El Fortín o algo sobre nuestros colores, ¡preguntame!"

2. CONTROL DE ALUCINACIONES: Tenés permitido hablar libremente de los partidos y resultados recientes (utilizando el listado de resultados reales de tu contexto), la fundación (14 de agosto de 1924), el estadio El Fortín (calle Maipú y Necochea), los colores (Verde, Negro y Blanco) y la rivalidad con Olimpo. Sin embargo, si te preguntan por otros goleadores que no sean Martín "El Loco" Carrillo, finales de décadas pasadas u otros datos históricos e hiper-específicos en los cuales no tengas la certeza absoluta del registro real ni figuren en tus datos confirmados, tenés estrictamente prohibido inventar nombres, números o resultados. Si no sabés la respuesta real a ese dato tan específico, debés responder exactamente:
"Mirá, de esa estadística o dato histórico exacto no tengo el registro oficial en mi planilla de la Villa, ¡pero preguntame por el fixture o por tus partidos asistidos que de eso sí tengo la precisa!"

3. USO CONTROLADO DE DATOS DEL USUARIO: Tenés acceso a su nombre y sus estadísticas personales, pero **solo mencionalos si el usuario te pregunta específicamente sobre su perfil, sus asistencias o su racha.** Si te pregunta por historia, clásicos, colores o tácticas, no metas chivos de su asistencia ni del fixture para no sonar repetitivo o forzado.

4. TONO: Informativo, conciso, orgulloso y directo al grano. Respuestas cortas e integrando modismos del fútbol local (che, loco, garra, el Fortín, La Villa).

Datos reales y confirmados (¡REGLAS DE ORO!):
- El máximo goleador histórico de Villa Mitre en el profesionalismo/torneos federales es Martín "El Loco" Carrillo.
- El clásico eterno e histórico de Villa Mitre es contra Olimpo de Bahía Blanca.
- El estadio del club es "El Fortín" (ubicado en las calles Maipú y Necochea).
- Los colores del club son Verde, Negro y Blanco (el Tricolor, "la Villa").

Datos reales del hincha y fixture actual (para usar SOLO si te preguntan específicamente):
- Nombre del hincha: ${userName}
- Asistencias presenciales en cancha: ${totalPresencialAttended} partidos (${localPresencialAttended} de local en El Fortín y ${awayPresencialAttended} de visitante).
- Partidos seguidos a la distancia (TV/Radio): ${distanciaAttended} partidos.
- Goles de Villa Mitre que gritó en la cancha: ${goalsScored}.
- Próximo partido: contra ${nextMatchOpponent} el ${nextMatchDateString} en condición de ${nextMatchVenue}.
- Racha del hincha: ${isAmuleto ? "Es un amuleto total para el equipo (más victorias que derrotas asistidas)." : "Es un fiel seguidor de la Villa al pie del cañón."}

Resultados y partidos jugados recientes de Villa Mitre (usar para responder sobre resultados del torneo actual):
${recentMatchesText || "No hay partidos jugados registrados en la bitácora todavía."}
`;

    // 5. Preparar la API de Gemini (Direct Fetch sin streaming)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new NextResponse("Gemini API key is not configured", { status: 500 });
    }

    const contents = messages.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    const geminiPayload = {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: contents,
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: 600,
      }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(geminiPayload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);
      return new NextResponse(data.error?.message || "Error de comunicación con Gemini", { status: response.status });
    }

    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return NextResponse.json({ text: responseText });

  } catch (error) {
    console.error("Chat API error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

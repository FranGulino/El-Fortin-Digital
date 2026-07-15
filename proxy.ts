import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  
  // Proteger las secciones privadas del hincha
  if (
    pathname.startsWith("/partidos") || 
    pathname.startsWith("/hincha") || 
    pathname.startsWith("/asistente")
  ) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Ignorar las llamadas internas de Next.js y los archivos estáticos
    "/((?!_next|[^?]*\\.[\\w]+$|_next/image|_next/video|favicon\\.ico).*)",
    // Ejecutar siempre para las rutas de API
    "/(api|trpc)(.*)",
  ],
};

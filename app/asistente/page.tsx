"use client";

import { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function AsistentePage() {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `¡Hola, loco! ¿Cómo andás? Pasá, ponete cómodo acá en el vestuario de la Villa. 
      
Soy tu DT de confianza y estoy acá para analizar tu fidelidad con el Tricolor, debatir sobre tácticas, gritar los goles o palpitar el próximo partido que se nos viene. ¿De qué querés hablar hoy? ¡De local en Maipú y Necochea no nos pasa nadie! ⚽🟢⚫⚪`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([
    { id: "proximo", text: "¿Cuándo jugamos?", query: "¿Cuándo jugamos?" },
    { id: "asistencias", text: "¿Cuántos partidos fui?", query: "¿Cuántos partidos fui a ver?" },
    { id: "goleador", text: "¿Goleador histórico?", query: "¿Quién es el goleador histórico del club?" },
    { id: "clasico", text: "¿Clásico rival?", query: "¿Quién es nuestro clásico rival?" },
  ]);

  const handleSuggestionClick = async (id: string, query: string) => {
    if (isLoading) return;
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
    await sendMessage(query);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final con cada mensaje nuevo o stream de texto
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    const assistantMessageId = crypto.randomUUID();
    const newAssistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, newAssistantMessage]);

    try {
      const apiMessages = updatedMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!response.ok) {
        throw new Error("Fallo al conectar con el servidor.");
      }

      const data = await response.json();

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: data.text }
            : msg
        )
      );
    } catch (error) {
      console.error("Chat fetch error:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content:
                  "¡Che, loco! Se me cortó la señal del vestuario. Esperate un minuto y volvé a mandarme el mensaje, dale.",
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(input);
  };

  return (
    <div className="h-screen flex flex-col bg-[#111412] text-[#e1e3de] relative overflow-hidden font-sans">
      {/* Fondo decorativo místico del club */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,106,79,0.08),transparent_50%)] pointer-events-none" />

      {/* Header del Chat con Botón de Retroceso (WhatsApp-style) */}
      <div className="pt-10 md:pt-4 pb-3 px-4 border-b border-zinc-900 bg-zinc-950/40 backdrop-blur-sm z-10 flex-shrink-0">
        <div className="max-w-3xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Botón Volver Atrás */}
            <button
              onClick={() => window.history.back()}
              className="text-xs font-semibold tracking-wider uppercase text-zinc-400 hover:text-zinc-200 transition-colors mr-6 cursor-pointer active:scale-95 pb-0.5"
              title="Volver"
            >
              {"Volver"}
            </button>

            <div className="relative h-8 w-8 rounded-full border border-[#2d6a4f]/30 bg-[#1d211e] flex items-center justify-center overflow-hidden flex-shrink-0">
              <span className="text-base">👔</span>
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-extrabold text-white tracking-wider uppercase leading-none flex items-center gap-1.5 font-sans">
                {"El DT Inteligente"}
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              </h1>
              <p className="text-[8px] sm:text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                {"Táctica, Mística y Fidelidad Tricolor"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Área del Chat */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-3xl mx-auto w-full scrollbar-thin"
      >
        {messages.map((message) => {
          const isUser = message.role === "user";
          return (
            <div
              key={message.id}
              className={`flex ${isUser ? "justify-end" : "justify-start"} w-full animate-fade-in`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-[12px] p-3.5 text-xs leading-relaxed shadow-lg ${
                  isUser
                    ? "bg-[#2d6a4f] text-white border border-[#377e5e] rounded-tr-none font-medium"
                    : "bg-[#1d211e] text-zinc-200 border border-zinc-850 rounded-tl-none"
                }`}
              >
                {/* Nombre de cabecera */}
                <span className="block text-[8px] font-black uppercase tracking-wider mb-1 text-zinc-400/80">
                  {isUser ? (user?.firstName || "Vos") : "DT Tricolor"}
                </span>
                
                {/* Mensaje con saltos de línea limpios */}
                <p className="whitespace-pre-line font-sans">{message.content}</p>
              </div>
            </div>
          );
        })}
        {isLoading && messages[messages.length - 1]?.content === "" && (
          <div className="flex justify-start w-full">
            <div className="bg-[#1d211e] text-zinc-555 border border-zinc-850 rounded-[12px] rounded-tl-none p-3.5 text-xs italic tracking-wide animate-pulse">
              {"El DT está pensando la táctica..."}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Contenedor del Input de Chat (Ubicado en la parte inferior con padding estándar) */}
      <div className="w-full bg-zinc-950/70 backdrop-blur-md border-t border-zinc-900 p-4 pb-4 md:pb-4 flex-shrink-0 z-10">
        {/* Sugerencias Rápidas de Preguntas */}
        {suggestions.length > 0 && (
          <div className="max-w-3xl mx-auto mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none flex-nowrap whitespace-nowrap">
            {suggestions.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSuggestionClick(s.id, s.query)}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-full border border-zinc-850 bg-[#1b1e1c] hover:bg-[#252a26] text-[10px] font-bold text-zinc-450 hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 active:scale-95"
              >
                {s.text}
              </button>
            ))}
          </div>
        )}

        <form 
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto bg-[#1d211e] border border-zinc-850 p-2 rounded-[12px] shadow-lg flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Preguntale por tácticas, asistencias o el próximo partido..."
            className="flex-1 bg-transparent px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="h-9 px-4 rounded-[8px] bg-[#2d6a4f] hover:bg-[#2d6a4f]/90 active:scale-95 transition-all text-xs font-bold text-white uppercase tracking-wider flex items-center justify-center gap-1 disabled:bg-zinc-800 disabled:text-zinc-650 cursor-pointer"
          >
            {"Enviar"}
          </button>
        </form>
      </div>
    </div>
  );
}

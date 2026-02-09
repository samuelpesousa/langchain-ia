import { useState, useEffect, useRef } from "react";

interface Message {
  content: string;
  type: "human" | "ai";
}

export default function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setError(null);
    const userMsg: Message = { content: input, type: "human" };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) throw new Error("Erro ao conectar com o servidor");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      setMessages((prev) => [...prev, { content: "", type: "ai" }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        lines.forEach((line) => {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.replace("data: ", ""));
              const content = data.content;

              setMessages((prev) => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                updated[lastIdx].content = content;
                return updated;
              });
            } catch (e) {
              console.error("Erro ao processar chunk:", e);
            }
          }
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[650px] w-full max-w-2xl border border-slate-800 rounded-2xl bg-slate-900 shadow-2xl overflow-hidden">
      <div className="bg-slate-800/50 p-4 border-b border-slate-800 flex justify-between items-center">
        <h2 className="text-slate-100 font-semibold text-sm flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Agente CODEXA IA
        </h2>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-950/50"
      >
        {messages.map((message, idx) => (
          <div
            key={idx}
            className={`flex ${message.type === "human" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-lg ${
                message.type === "human"
                  ? "bg-blue-700 text-white rounded-tr-none"
                  : "bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none"
              }`}
            >
              <span
                className={`font-bold text-[10px] block mb-2 uppercase tracking-widest ${
                  message.type === "human" ? "text-blue-200" : "text-slate-400"
                }`}
              >
                {message.type === "human" ? "Pessoa" : "Agente"}
              </span>
              <div className="leading-relaxed whitespace-pre-wrap">
                {message.content}
              </div>
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.type === "human" && (
          <div className="flex items-center gap-2 text-xs text-slate-500 italic">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce"></span>
            </div>
            O agente está escrevendo...
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-4 bg-slate-900 border-t border-slate-800"
      >
        <div className="flex gap-3">
          <input
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte algo sobre câmbio..."
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white px-5 py-2 rounded-xl text-sm font-bold disabled:opacity-50 transition-all shadow-lg"
            disabled={isLoading}
          >
            {isLoading ? "..." : "Enviar"}
          </button>
        </div>
        {error && (
          <div className="bg-red-900/20 border border-red-900/50 text-red-400 text-xs mt-3 p-2 rounded-lg text-center">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}

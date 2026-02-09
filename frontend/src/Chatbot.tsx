import { useState } from "react";
import { useStream } from "@langchain/langgraph-sdk/react";

export default function Chat() {
  const [input, setInput] = useState("");
  const stream = useStream({
    assistantId: "agent",
    apiUrl: "http://localhost:2024",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || stream.isLoading) return;
    stream.submit({
      messages: [{ content: input, type: "human" }],
    });
    setInput("");
  };

  const getErrorMessage = (): string => {
    if (stream.error instanceof Error) {
      return stream.error.message || "Erro desconhecido";
    }
    if (typeof stream.error === "string") {
      return stream.error;
    }
    if (stream.error !== undefined && stream.error !== null) {
      return String(stream.error);
    }
    return "Erro na conexão com o agente";
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-2xl border rounded-lg bg-white shadow-sm overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {stream.messages.map((message, idx) => (
          <div
            key={message.id ?? idx}
            className={`flex ${message.type === "human" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg text-sm ${
                message.type === "human"
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-800"
              }`}
            >
              <span className="font-bold text-[10px] block mb-1 uppercase opacity-60">
                {message.type === "human" ? "Samuel" : "Agente"}
              </span>
              {String(message.content)}
            </div>
          </div>
        ))}
        {stream.isLoading && (
          <div className="text-xs text-gray-400 italic animate-pulse">
            Processando...
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <input
            className="flex-1 border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
            disabled={stream.isLoading}
          >
            Enviar
          </button>
        </div>
        {stream.isLoading && (
          <div className="text-xs text-gray-400 italic animate-pulse">
            Processando...
          </div>
        )}
        {typeof stream.error !== "undefined" && (
          <p className="text-red-500 text-xs mt-2 text-center">
            {getErrorMessage()}
          </p>
        )}
      </form>
    </div>
  );
}

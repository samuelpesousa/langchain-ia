import { useCallback } from "react";
import { useStickToBottom } from "use-stick-to-bottom";
import { AlertCircle, Brain } from "lucide-react";
import { useStream } from "@langchain/langgraph-sdk/react";

import { registerExample } from "../registry";
import { LoadingIndicator } from "../../components/Loading";
import { EmptyState } from "../../components/States";
import { MessageInput } from "../../components/MessageInput";
import { MessageBubble } from "../../components/MessageBubble";

import type { agent } from "./agent";

const REASONING_SUGGESTIONS = [
  "Um bastão e uma bola custam R$ 1,10 no total. O bastão custa R$ 1,00 a mais que a bola. Quanto custa a bola?",
  "Se 5 máquinas levam 5 minutos para fazer 5 itens, quanto tempo levaria para 100 máquinas fazerem 100 itens?",
];

export function ReasoningAgent() {
  const stream = useStream<typeof agent>({
    assistantId: "reasoning-agent",
    apiUrl: "http://localhost:2024",
  });

  const { scrollRef, contentRef } = useStickToBottom();

  const hasMessages = stream.messages.length > 0;

  const handleSubmit = useCallback(
    (content: string) => {
      stream.submit({ messages: [{ content, type: "human" }] });
    },
    [stream],
  );

  return (
    <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 transition-colors">
      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-800"
      >
        <div ref={contentRef} className="max-w-2xl mx-auto px-4 py-8">
          {!hasMessages ? (
            <EmptyState
              icon={Brain}
              title="Agente de Raciocínio"
              description="Observe o modelo resolver problemas complexos com raciocínio estendido. O processo de pensamento é transmitido em tempo real, mostrando como a IA chega às suas conclusões."
              suggestions={REASONING_SUGGESTIONS}
              onSuggestionClick={handleSubmit}
            />
          ) : (
            <div className="flex flex-col gap-6">
              {stream.messages.map((message, idx) => (
                <MessageBubble key={message.id ?? idx} message={message} />
              ))}

              {stream.isLoading && stream.messages.length <= 2 && (
                <div className="flex items-center gap-3 text-blue-900/70 dark:text-blue-400/70 animate-pulse">
                  <LoadingIndicator />
                  <span className="text-xs font-medium italic">
                    O assistente está pensando...
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {stream.error != null && (
        <div className="max-w-2xl mx-auto px-4 pb-3">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-600 dark:text-red-400 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                {stream.error instanceof Error
                  ? stream.error.message
                  : "Ocorreu um erro. Verifique se a sua API_KEY está configurada corretamente."}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <MessageInput
          disabled={stream.isLoading}
          placeholder="Faça uma pergunta complexa de lógica..."
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}

registerExample({
  id: "reasoning-agent",
  title: "Agente de Raciocínio",
  description: "Streaming de tokens de raciocínio (pensamento) em tempo real",
  category: "advanced",
  icon: "code",
  ready: true,
  component: ReasoningAgent,
});

export default ReasoningAgent;

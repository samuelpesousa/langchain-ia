import { useCallback, useMemo, useState } from "react";
import { useStickToBottom } from "use-stick-to-bottom";
import { AlertCircle, Layers, Sparkles } from "lucide-react";
import { useStream } from "@langchain/langgraph-sdk/react";
import type { Message } from "@langchain/langgraph-sdk";

import { LoadingIndicator } from "../../components/Loading";
import { EmptyState } from "../../components/States";
import { MessageBubble } from "../../components/MessageBubble";
import { MessageInput } from "../../components/MessageInput";
import { SubagentPipeline } from "./components/SubagentPipeline";

import type { agent } from "./agent";

const EXAMPLE_SUGGESTIONS = [
  "Pesquise o estado atual da IA na saúde e crie um relatório resumido",
  "Analise as tendências de mercado para veículos elétricos e rascunhe as descobertas",
  "Colete informações sobre energia sustentável e apresente os dados",
  "Pesquise estudos sobre produtividade no trabalho remoto e escreva uma análise",
];

function hasContent(message: Message): boolean {
  if (typeof message.content === "string") {
    return message.content.trim().length > 0;
  }
  if (Array.isArray(message.content)) {
    return message.content.some(
      (c) => c.type === "text" && c.text.trim().length > 0,
    );
  }
  return false;
}

function useThreadIdParam() {
  const [threadId, setThreadId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return params.get("threadId");
  });

  const updateThreadId = useCallback((newThreadId: string | null) => {
    setThreadId(newThreadId);

    const url = new URL(window.location.href);
    if (newThreadId == null) {
      url.searchParams.delete("threadId");
    } else {
      url.searchParams.set("threadId", newThreadId);
    }
    window.history.replaceState({}, "", url.toString());
  }, []);

  return [threadId, updateThreadId] as const;
}

export function DeepAgentToolsDemo() {
  const { scrollRef, contentRef } = useStickToBottom();
  const [threadId, onThreadId] = useThreadIdParam();

  const stream = useStream<typeof agent>({
    assistantId: "deepagent-tools",
    apiUrl: "http://localhost:2024",
    filterSubagentMessages: true,
    threadId,
    onThreadId,
    reconnectOnMount: true,
    onError: (error) => {
      console.error("Erro no stream:", error);
    },
  });

  const hasMessages = stream.messages.length > 0;
  const hasSubagents = stream.subagents.size > 0;

  const allSubagentsDone =
    hasSubagents &&
    [...stream.subagents.values()].every(
      (s) => s.status === "complete" || s.status === "error",
    );

  const displayMessages = useMemo(() => {
    return stream.messages.filter((message) => {
      if (message.type === "human") return true;
      if (message.type === "tool") return false;
      if (message.type === "ai") {
        return hasContent(message);
      }
      return false;
    });
  }, [stream.messages]);

  const handleSubmit = useCallback(
    (content: string) => {
      stream.submit(
        { messages: [{ content, type: "human" }] },
        {
          streamSubgraphs: true,
          config: {
            recursion_limit: 100,
          },
        },
      );
    },
    [stream],
  );

  const subagentsByHumanMessage = useMemo(() => {
    const result = new Map<
      string,
      ReturnType<typeof stream.getSubagentsByMessage>
    >();
    const msgs = stream.messages;

    for (let i = 0; i < msgs.length; i++) {
      if (msgs[i].type !== "human") continue;

      const next = msgs[i + 1];
      if (!next || next.type !== "ai" || !next.id) continue;

      const subagents = stream.getSubagentsByMessage(next.id);
      if (subagents.length > 0) {
        result.set(msgs[i].id!, subagents);
      }
    }
    return result;
  }, [stream.messages, stream.subagents]);

  return (
    <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 transition-colors">
      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-800"
      >
        <div ref={contentRef} className="max-w-4xl mx-auto px-8 py-8">
          {!hasMessages && !hasSubagents ? (
            <EmptyState
              icon={Layers}
              title="Agente Profundo com Ferramentas"
              description="Veja subagentes especializados trabalharem na sua tarefa, cada um usando suas próprias ferramentas. Você verá a pesquisa, análise e redação acontecerem em tempo real."
              suggestions={EXAMPLE_SUGGESTIONS}
              onSuggestionClick={handleSubmit}
            />
          ) : (
            <div className="flex flex-col gap-6">
              {displayMessages.map((message, idx) => {
                const messageKey = message.id ?? `msg-${idx}`;
                const turnSubagents =
                  message.type === "human"
                    ? subagentsByHumanMessage.get(messageKey)
                    : undefined;

                return (
                  <div key={messageKey}>
                    <MessageBubble message={message} />

                    {turnSubagents && turnSubagents.length > 0 && (
                      <div className="mt-6">
                        <SubagentPipeline
                          subagents={turnSubagents}
                          isLoading={stream.isLoading && !allSubagentsDone}
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {stream.isLoading && !hasSubagents && <LoadingIndicator />}

              {stream.isLoading && allSubagentsDone && (
                <div className="flex items-center gap-3 text-blue-800 dark:text-blue-400 animate-pulse">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    Sintetizando resultados de todos os agentes...
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {stream.error != null && (
        <div className="max-w-4xl mx-auto px-4 pb-3">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-600 dark:text-red-400 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                {stream.error instanceof Error
                  ? stream.error.message
                  : "Ocorreu um erro. Verifique se a OPENAI_API_KEY está configurada corretamente."}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 transition-colors">
        <MessageInput
          disabled={stream.isLoading}
          placeholder="Peça-me para pesquisar, analisar ou escrever algo..."
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
export default DeepAgentToolsDemo;

import { useCallback, useMemo, useState } from "react";
import { useStickToBottom } from "use-stick-to-bottom";
import { AlertCircle, Plane, Sparkles } from "lucide-react";
import { useStream } from "@langchain/langgraph-sdk/react";
import type { Message } from "@langchain/langgraph-sdk";

import { registerExample } from "../registry";
import { LoadingIndicator } from "../../components/Loading";
import { EmptyState } from "../../components/States";
import { MessageBubble } from "../../components/MessageBubble";
import { MessageInput } from "../../components/MessageInput";
import { SubagentPipeline } from "./components/SubagentPipeline";

import type { agent } from "./agent";

const VACATION_SUGGESTIONS = [
  "Planeje uma viagem romântica para Paris, 2 pessoas, 5 noites, orçamento médio",
  "Férias em família para Tóquio com 4 pessoas por uma semana, econômico",
  "Viagem de aventura para a Costa Rica focada em natureza e vida selvagem",
  "Passeio de fim de semana em Barcelona na primavera",
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

export function DeepAgentDemo() {
  const { scrollRef, contentRef } = useStickToBottom();
  const [threadId, onThreadId] = useThreadIdParam();

  const stream = useStream<typeof agent>({
    assistantId: "deepagent",
    apiUrl: "http://localhost:2024",
    filterSubagentMessages: true,
    threadId,
    onThreadId,
    reconnectOnMount: true,
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
        if ("tool_calls" in message && message.tool_calls?.length) {
          return hasContent(message);
        }
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
      <main ref={scrollRef} className="flex-1 overflow-y-auto">
        <div ref={contentRef} className="max-w-6xl mx-auto px-8 py-8">
          {!hasMessages && !hasSubagents ? (
            <EmptyState
              icon={Plane}
              title="Planejador de Viagens dos Sonhos"
              description="Diga-me para onde quer ir e eu coordenarei três agentes especialistas para planejar sua viagem: um Explorador de Clima, um Curador de Experiências e um Otimizador de Orçamento!"
              suggestions={VACATION_SUGGESTIONS}
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

              {stream.values.todos && stream.values.todos.length > 0 && (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-blue-900/10 dark:bg-blue-900/20 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-blue-900 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-200">
                          Tarefas do Agente Profundo
                        </h4>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">
                          {stream.values.todos.length} ativas
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {stream.values.todos.map((todo, idx) => (
                      <div
                        key={`todo-${idx}`}
                        className="flex items-start gap-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 px-3 py-2 text-sm"
                      >
                        <div className="mt-1.5 h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                        <div className="flex-1 text-zinc-700 dark:text-zinc-300">
                          <div className="font-medium">{todo.content}</div>
                          <div className="text-[10px] text-zinc-500 mt-1 uppercase font-bold">
                            Status:{" "}
                            {todo.status === "complete"
                              ? "Concluído"
                              : "Em andamento"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {stream.isLoading && !hasSubagents && <LoadingIndicator />}

              {stream.isLoading && allSubagentsDone && (
                <div className="flex items-center gap-3 text-blue-900 dark:text-blue-400 animate-pulse px-4 py-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/20 w-fit">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-sm font-semibold">
                    Sintetizando seu plano de férias personalizado...
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {stream.error != null && (
        <div className="max-w-6xl mx-auto px-4 pb-3">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-600 dark:text-red-400 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                {stream.error instanceof Error
                  ? stream.error.message
                  : "Ocorreu um erro. Verifique se a OPENAI_API_KEY está configurada."}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <MessageInput
          disabled={stream.isLoading}
          placeholder="Para onde você gostaria de ir? (Ex: 'Planeje uma viagem para o Japão')"
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}

registerExample({
  id: "deepagent",
  title: "Agente Profundo (Subagentes)",
  description:
    "Assista a 3 agentes de IA especializados planejando sua viagem em paralelo",
  category: "agents",
  icon: "tool",
  ready: true,
  component: DeepAgentDemo,
});

export default DeepAgentDemo;

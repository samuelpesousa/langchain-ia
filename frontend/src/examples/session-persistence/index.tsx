import { useState, useCallback, useEffect } from "react";
import { useStickToBottom } from "use-stick-to-bottom";
import {
  AlertCircle,
  RotateCcw,
  Wifi,
  Hash,
  RefreshCw,
  Zap,
  CheckCircle2,
  Radio,
} from "lucide-react";
import { useStream } from "@langchain/langgraph-sdk/react";

import { registerExample } from "../registry";
import { LoadingIndicator } from "../../components/Loading";
import { EmptyState } from "../../components/States";
import { MessageInput } from "../../components/MessageInput";
import { MessageBubble } from "../../components/MessageBubble";

import type { agent } from "./agent";

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

function ConnectionStatus({
  isLoading,
  isReconnecting,
  threadId,
}: {
  isLoading: boolean;
  isReconnecting: boolean;
  threadId: string | null;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-zinc-100/80 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 transition-colors">
      <div className="flex items-center gap-2">
        {isReconnecting ? (
          <>
            <Radio className="w-4 h-4 text-amber-500 animate-pulse" />
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
              Reconectando...
            </span>
          </>
        ) : isLoading ? (
          <>
            <Radio className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
              Transmitindo
            </span>
          </>
        ) : (
          <>
            <Wifi className="w-4 h-4 text-zinc-500" />
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Pronto
            </span>
          </>
        )}
      </div>

      {threadId && (
        <>
          <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700" />
          <div className="flex items-center gap-1.5">
            <Hash className="w-3 h-3 text-zinc-400" />
            <code className="text-xs text-zinc-500 dark:text-zinc-500 font-mono font-bold">
              {threadId.slice(0, 8)}...
            </code>
          </div>
        </>
      )}
    </div>
  );
}

function ReconnectedBanner({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 animate-fade-in shadow-sm">
      <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      <div className="flex-1">
        <div className="text-sm font-bold text-blue-900 dark:text-blue-100">
          Stream Reconectado
        </div>
        <div className="text-xs text-blue-700/70 dark:text-blue-400/70">
          Retomou com sucesso o fluxo em andamento após a atualização da página.
        </div>
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  "Escreva uma história longa sobre um robô aprendendo a pintar",
  "Explique computação quântica em detalhes com exemplos",
  "Crie um guia abrangente para aprender TypeScript",
];

export function SessionPersistence() {
  const [threadId, setThreadId] = useThreadIdParam();
  const [showReconnectedBanner, setShowReconnectedBanner] = useState(false);
  const [hasReconnected, setHasReconnected] = useState(false);

  const stream = useStream<typeof agent>({
    assistantId: "session-persistence",
    apiUrl: "http://localhost:2024",
    threadId: threadId ?? undefined,
    onThreadId: setThreadId,
    reconnectOnMount: true,
    onFinish: () => {
      if (hasReconnected) {
        setShowReconnectedBanner(true);
        setHasReconnected(false);
      }
    },
  });

  useEffect(() => {
    if (stream.isLoading && threadId) {
      const storedRunId = window.sessionStorage.getItem(
        `lg:stream:${threadId}`,
      );
      if (storedRunId) {
        setHasReconnected(true);
      }
    }
  }, [stream.isLoading, threadId]);

  const { scrollRef, contentRef } = useStickToBottom();

  const handleSubmit = useCallback(
    (content: string) => {
      stream.submit({ messages: [{ content, type: "human" }] });
    },
    [stream],
  );

  const handleSimulateRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  const hasMessages = stream.messages.length > 0;

  return (
    <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 transition-colors">
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-8 py-2 flex items-center justify-between transition-colors">
        <ConnectionStatus
          isLoading={stream.isLoading}
          isReconnecting={hasReconnected && stream.isLoading}
          threadId={threadId}
        />

        {stream.isLoading && (
          <button
            onClick={handleSimulateRefresh}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition-all shadow-sm"
            title="Atualize a página para testar a reconexão do stream"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Atualizar para Testar Reconexão
          </button>
        )}
      </div>

      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-800"
      >
        <div ref={contentRef} className="max-w-2xl mx-auto px-4 py-8">
          {!hasMessages ? (
            <EmptyState
              icon={RotateCcw}
              title="Demo de Reconexão de Stream"
              description="Este exemplo demonstra o 'reconnectOnMount' - a capacidade de retomar um fluxo em andamento após atualizar a página. Inicie uma resposta longa e clique em 'Atualizar para Testar' durante a transmissão."
              suggestions={SUGGESTIONS}
              onSuggestionClick={handleSubmit}
            />
          ) : (
            <div className="flex flex-col gap-6">
              {showReconnectedBanner && (
                <ReconnectedBanner
                  onDismiss={() => setShowReconnectedBanner(false)}
                />
              )}

              {hasMessages && stream.messages.length <= 2 && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/20 animate-fade-in shadow-sm">
                  <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-1">
                      Tente atualizar durante a resposta!
                    </div>
                    <div className="text-xs text-blue-700/70 dark:text-blue-400/70 leading-relaxed">
                      A opção{" "}
                      <code className="px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 font-bold">
                        reconnectOnMount: true
                      </code>{" "}
                      retoma automaticamente o stream. O ID da execução é
                      armazenado no sessionStorage.
                    </div>
                  </div>
                </div>
              )}

              {stream.messages.map((message, idx) => (
                <MessageBubble key={message.id ?? idx} message={message} />
              ))}

              {stream.isLoading && <LoadingIndicator />}
            </div>
          )}
        </div>
      </main>

      {stream.error != null && (
        <div className="max-w-2xl mx-auto px-4 pb-3">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              {stream.error instanceof Error
                ? stream.error.message
                : "Ocorreu um erro inesperado."}
            </span>
          </div>
        </div>
      )}

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <MessageInput
          disabled={stream.isLoading}
          placeholder="Peça uma resposta longa e atualize a página no meio do caminho..."
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}

registerExample({
  id: "session-persistence",
  title: "Reconexão de Stream",
  description:
    "Retoma um stream em andamento após atualizar a página com reconnectOnMount",
  category: "langgraph",
  icon: "graph",
  ready: true,
  component: SessionPersistence,
});

export default SessionPersistence;

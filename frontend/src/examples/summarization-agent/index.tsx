import { useEffect, useCallback, useState } from "react";
import { useStickToBottom } from "use-stick-to-bottom";
import {
  AlertCircle,
  Sparkles,
  MessageSquare,
  Layers,
  Zap,
  RefreshCw,
} from "lucide-react";
import { useStream } from "@langchain/langgraph-sdk/react";
import type { Message } from "@langchain/langgraph-sdk";
import { ToolCallCard } from "../../components/ToolCallCard";

import { registerExample } from "../registry";
import { LoadingIndicator } from "../../components/Loading";
import { MessageInput } from "../../components/MessageInput";

import type { agent } from "./agent";
import { getPrefilledMessages } from "./prefilled-messages";

function getContent(message: Message): string {
  if (typeof message.content === "string") {
    return message.content;
  }
  if (Array.isArray(message.content)) {
    return message.content
      .filter((c): c is { type: "text"; text: string } => c.type === "text")
      .map((c) => c.text)
      .join("");
  }
  return "";
}

function isSummaryMessage(message: Message): boolean {
  const content = getContent(message);
  return (
    content.includes("📋 **Resumo da Conversa:**") ||
    content.includes("Resumo da Conversa:") ||
    content.toLowerCase().includes("resumo da nossa conversa")
  );
}

function SummarizationToast({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed top-24 right-4 z-100 animate-fade-in">
      <div className="bg-zinc-900/95 backdrop-blur-md border border-blue-500/40 rounded-xl px-4 py-3 shadow-2xl shadow-blue-500/10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
          <Layers className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-blue-100 flex items-center gap-1.5">
            Conversa Resumida
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
          </div>
          <p className="text-xs text-zinc-400">
            Mensagens antigas condensadas para manter o contexto
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
        >
          <XIcon />
        </button>
      </div>
    </div>
  );
}

function XIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function SummaryMessageCard({ message }: { message: Message }) {
  const content = getContent(message);

  return (
    <div className="bg-gradient-to-br from-blue-950/40 to-zinc-900/30 border border-blue-500/20 rounded-xl p-5 animate-fade-in">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
          <Layers className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-blue-400 mb-1 flex items-center gap-1">
            <span>Contexto Resumido</span>
            <Sparkles className="w-3 h-3 text-blue-300" />
          </div>
          <div className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
            {content.replace(/📋 \*\*Resumo da Conversa:\*\*\n\n?/, "")}
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isHuman = message.type === "human";
  const content = getContent(message);

  if (!content) return null;

  if (!isHuman && isSummaryMessage(message)) {
    return <SummaryMessageCard message={message} />;
  }

  return (
    <div className="animate-fade-in">
      {!isHuman && (
        <div className="text-xs font-medium text-zinc-500 mb-2 flex items-center gap-1">
          <MessageSquare className="w-3 h-3" />
          <span>Assistente</span>
        </div>
      )}

      <div
        className={`${
          isHuman
            ? "bg-blue-900 text-blue-50 rounded-2xl px-4 py-2.5 ml-auto max-w-[85%] md:max-w-[70%] w-fit shadow-sm"
            : "text-zinc-900 dark:text-zinc-100"
        }`}
      >
        <div className="whitespace-pre-wrap leading-relaxed text-[15px]">
          {content}
        </div>
      </div>
    </div>
  );
}

function ConversationStats({
  messageCount,
  hasSummary,
}: {
  messageCount: number;
  hasSummary: boolean;
}) {
  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 bg-white dark:bg-zinc-900/95 backdrop-blur-sm rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-xl w-52 transition-colors">
      <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3 font-bold">
        Status do Contexto
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">Mensagens</span>
          <span className="text-sm font-mono font-bold text-zinc-900 dark:text-zinc-200">
            {messageCount}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">Status</span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${
              hasSummary
                ? "bg-blue-500/20 text-blue-600 dark:text-blue-300"
                : messageCount >= 6
                ? "bg-amber-500/20 text-amber-600 dark:text-amber-300"
                : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300"
            }`}
          >
            {hasSummary
              ? "Resumido"
              : messageCount >= 6
              ? "No Limite"
              : "Normal"}
          </span>
        </div>

        {!hasSummary && messageCount >= 4 && (
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-[10px] text-amber-600 dark:text-amber-400/80">
              <RefreshCw className="w-3 h-3" />
              <span>Resumo em ~8 mensagens</span>
            </div>
          </div>
        )}

        {hasSummary && (
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-[10px] text-blue-600 dark:text-blue-400/80">
              <Sparkles className="w-3 h-3" />
              <span>Contexto comprimido</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  onPrefill,
  onSuggestionClick,
  isPrefilling,
}: {
  onPrefill: () => void;
  onSuggestionClick: (text: string) => void;
  isPrefilling: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 px-4 transition-colors">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-900/10 to-zinc-200/50 dark:from-blue-900/20 dark:to-zinc-800/30 border border-blue-900/20 dark:border-blue-800/30 flex items-center justify-center mb-6 shadow-sm">
        <Layers className="w-8 h-8 text-blue-900 dark:text-blue-400" />
      </div>

      <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
        Demo de Middleware de Resumo
      </h2>

      <p className="text-zinc-600 dark:text-zinc-400 text-center max-w-md mb-8 leading-relaxed">
        Veja como o middleware de resumo condensa automaticamente conversas
        longas enquanto preserva o contexto. Comece com uma conversa
        pré-preenchida para disparar o resumo.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        <button
          onClick={onPrefill}
          disabled={isPrefilling}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold transition-all disabled:opacity-50 shadow-md"
        >
          {isPrefilling ? (
            <>
              <LoadingIndicator />
              <span className="ml-2">Carregando conversa...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>Carregar Conversa Pré-preenchida</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-2 text-zinc-400 text-xs py-2 uppercase tracking-widest font-bold">
          <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
          <span>ou comece do zero</span>
          <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {[
            "Conte-me sobre Tóquio",
            "Ajude-me a planejar uma viagem",
            "Quanto é 1500 * 0.85?",
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => onSuggestionClick(suggestion)}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-blue-900/40 text-zinc-600 dark:text-zinc-300 text-sm transition-all shadow-sm"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SummarizationAgent() {
  const stream = useStream<typeof agent>({
    assistantId: "summarization-agent",
    apiUrl: "http://localhost:2024",
  });

  const { scrollRef, contentRef } = useStickToBottom();
  const [isPrefilling, setIsPrefilling] = useState(false);
  const [showSummarizationBanner, setShowSummarizationBanner] = useState(false);

  const hasSummary = stream.messages.some((m) => isSummaryMessage(m));

  useEffect(() => {
    if (hasSummary && !showSummarizationBanner) {
      setShowSummarizationBanner(true);
      const timer = setTimeout(() => setShowSummarizationBanner(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [hasSummary, showSummarizationBanner]);

  const hasMessages = stream.messages.length > 0;

  const handleSubmit = useCallback(
    (content: string) => {
      stream.submit({ messages: [{ content, type: "human" }] });
    },
    [stream],
  );

  const handlePrefill = useCallback(async () => {
    setIsPrefilling(true);
    try {
      const prefilledMessages = getPrefilledMessages();
      stream.submit({
        messages: [
          ...prefilledMessages,
          {
            content:
              "Obrigado por todas essas informações! Agora eu gostaria de saber mais sobre os requisitos de visto para brasileiros visitando o Japão.",
            type: "human",
          },
        ],
      });
    } finally {
      setIsPrefilling(false);
    }
  }, [stream]);

  return (
    <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 transition-colors">
      {showSummarizationBanner && (
        <SummarizationToast onClose={() => setShowSummarizationBanner(false)} />
      )}

      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-800"
      >
        <div ref={contentRef} className="max-w-2xl mx-auto px-4 py-8">
          {hasMessages && (
            <ConversationStats
              messageCount={
                stream.messages.filter((m) => m.type !== "tool").length
              }
              hasSummary={hasSummary}
            />
          )}

          {!hasMessages ? (
            <EmptyState
              onPrefill={handlePrefill}
              onSuggestionClick={handleSubmit}
              isPrefilling={isPrefilling}
            />
          ) : (
            <div className="flex flex-col gap-6">
              {stream.messages.map((message, idx) => {
                if (message.type === "ai") {
                  const toolCalls = stream.getToolCalls(message);
                  if (toolCalls.length > 0) {
                    return (
                      <div key={message.id} className="flex flex-col gap-3">
                        {toolCalls.map((toolCall) => (
                          <ToolCallCard key={toolCall.id} toolCall={toolCall} />
                        ))}
                      </div>
                    );
                  }
                  if (getContent(message).trim().length === 0) return null;
                }
                return (
                  <MessageBubble key={message.id ?? idx} message={message} />
                );
              })}
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
                : "Ocorreu um erro inesperado"}
            </span>
          </div>
        </div>
      )}

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <MessageInput
          disabled={stream.isLoading || isPrefilling}
          placeholder="Pergunte-me qualquer coisa sobre planejamento de viagens..."
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}

registerExample({
  id: "summarization-agent",
  title: "Middleware de Resumo",
  description:
    "Agente com resumo automático de contexto quando a conversa fica longa",
  category: "middleware",
  icon: "middleware",
  ready: true,
  component: SummarizationAgent,
});

export default SummarizationAgent;

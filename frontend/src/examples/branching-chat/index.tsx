import { useState, useCallback } from "react";
import { useStickToBottom } from "use-stick-to-bottom";
import {
  AlertCircle,
  GitBranch,
  Pencil,
  RefreshCw,
  X,
  Check,
} from "lucide-react";
import { useStream } from "@langchain/langgraph-sdk/react";
import type { Message } from "@langchain/langgraph-sdk";
import type { InferAgentToolCalls } from "@langchain/langgraph-sdk/react";

import { LoadingIndicator } from "../../components/Loading";
import { EmptyState } from "../../components/States";
import { MessageInput } from "../../components/MessageInput";
import { ToolCallCard } from "../../components/ToolCallCard";

import type { agent } from "./agent";
import { BranchSwitcher } from "./components/BranchSwitcher";

const BRANCHING_SUGGESTIONS = [
  "Conte-me um fato científico interessante",
  "Quanto é 15% de 230?",
  "Dê-me um fato histórico aleatório",
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

function getTextContent(message: Message): string {
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

function EditableMessage({
  content,
  onSave,
  onCancel,
}: {
  content: string;
  onSave: (newContent: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(content);

  return (
    <div className="flex flex-col gap-2 w-full">
      <textarea
        value={value}
        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-900/40 focus:border-blue-900 transition-all"
        rows={3}
        autoFocus
      />
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-1"
        >
          <X className="w-3 h-3" />
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => onSave(value)}
          className="px-3 py-1.5 text-xs rounded-lg bg-blue-900 hover:bg-blue-800 text-white transition-colors flex items-center gap-1"
        >
          <Check className="w-3 h-3" />
          Salvar e Ramificar
        </button>
      </div>
    </div>
  );
}

export function BranchingChat() {
  const stream = useStream<typeof agent>({
    assistantId: "agent",
    apiUrl: "http://localhost:2024",
    fetchStateHistory: true,
  });

  const { scrollRef, contentRef } = useStickToBottom();
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  const hasMessages = stream.messages.length > 0;

  const handleSubmit = useCallback(
    (content: string) => {
      stream.submit({ messages: [{ content, type: "human" }] });
    },
    [stream],
  );

  const handleEditMessage = useCallback(
    (
      message: Message<InferAgentToolCalls<typeof agent>>,
      newContent: string,
    ) => {
      const meta = stream.getMessagesMetadata(message);
      const parentCheckpoint = meta?.firstSeenState?.parent_checkpoint;
      stream.submit(
        { messages: [{ content: newContent, type: "human" }] },
        { checkpoint: parentCheckpoint },
      );
      setEditingMessageId(null);
    },
    [stream],
  );

  const handleRegenerate = useCallback(
    (message: Message<InferAgentToolCalls<typeof agent>>) => {
      const meta = stream.getMessagesMetadata(message);
      const parentCheckpoint = meta?.firstSeenState?.parent_checkpoint;
      stream.submit(undefined, { checkpoint: parentCheckpoint });
    },
    [stream],
  );

  return (
    <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      <main ref={scrollRef} className="flex-1 overflow-y-auto">
        <div ref={contentRef} className="max-w-2xl mx-auto px-4 py-8">
          {!hasMessages ? (
            <EmptyState
              icon={GitBranch}
              title="Chat com Ramificações"
              description="Explore caminhos alternativos! Edite qualquer mensagem para ramificar a conversa ou regenere as respostas da IA para ver resultados diferentes."
              suggestions={BRANCHING_SUGGESTIONS}
              onSuggestionClick={handleSubmit}
            />
          ) : (
            <div className="flex flex-col gap-6">
              {stream.messages.map((message, idx) => {
                const meta = stream.getMessagesMetadata(message);
                const isEditing = editingMessageId === message.id;

                if (message.type === "ai") {
                  const toolCalls = stream.getToolCalls(message);

                  if (toolCalls.length > 0) {
                    return (
                      <div key={message.id} className="flex flex-col gap-3">
                        {toolCalls.map((toolCall) => (
                          <ToolCallCard key={toolCall.id} toolCall={toolCall} />
                        ))}
                        <div className="flex items-center gap-2">
                          <BranchSwitcher
                            branch={meta?.branch}
                            branchOptions={meta?.branchOptions}
                            onSelect={(branch) => stream.setBranch(branch)}
                          />
                          <button
                            type="button"
                            onClick={() => handleRegenerate(message)}
                            disabled={stream.isLoading}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-zinc-500 hover:text-blue-900 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
                            title="Regenerar (cria uma nova ramificação)"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Regenerar
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (!hasContent(message)) return null;

                  return (
                    <div key={message.id ?? idx} className="animate-fade-in">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-zinc-500">
                          Assistente
                        </span>
                        <BranchSwitcher
                          branch={meta?.branch}
                          branchOptions={meta?.branchOptions}
                          onSelect={(branch) => stream.setBranch(branch)}
                        />
                      </div>
                      <div className="text-zinc-900 dark:text-zinc-100 leading-relaxed text-[15px]">
                        {getTextContent(message)}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRegenerate(message)}
                          disabled={stream.isLoading}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-zinc-500 hover:text-blue-900 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
                          title="Regenerar resposta"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Regenerar
                        </button>
                      </div>
                    </div>
                  );
                }

                if (message.type === "human") {
                  return (
                    <div key={message.id ?? idx} className="animate-fade-in">
                      <div className="flex items-center gap-2 mb-2 justify-end">
                        <BranchSwitcher
                          branch={meta?.branch}
                          branchOptions={meta?.branchOptions}
                          onSelect={(branch) => stream.setBranch(branch)}
                        />
                      </div>
                      <div className="flex justify-end">
                        {isEditing ? (
                          <div className="w-full max-w-[85%]">
                            <EditableMessage
                              content={getTextContent(message)}
                              onSave={(newContent) =>
                                handleEditMessage(message, newContent)
                              }
                              onCancel={() => setEditingMessageId(null)}
                            />
                          </div>
                        ) : (
                          <div className="group relative max-w-[85%]">
                            {/* Balão humano em Azul Marinho sutil */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 border border-blue-100 dark:border-blue-900/30 rounded-2xl px-4 py-2.5">
                              <div className="whitespace-pre-wrap leading-relaxed text-[15px]">
                                {getTextContent(message)}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setEditingMessageId(message.id!)}
                              disabled={stream.isLoading}
                              className="absolute -left-8 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-blue-900 dark:hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all"
                              title="Editar mensagem"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                if (message.type === "tool") return null;

                return (
                  <div key={message.id ?? idx} className="animate-fade-in">
                    <div className="text-xs font-medium text-zinc-500 mb-2">
                      Sistema
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 rounded-lg px-4 py-3 text-[15px]">
                      {getTextContent(message)}
                    </div>
                  </div>
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
            <AlertCircle className="w-4 h-4" />
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
          disabled={stream.isLoading || editingMessageId !== null}
          placeholder={
            editingMessageId
              ? "Finalize a edição primeiro..."
              : "Pergunte qualquer coisa..."
          }
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}

export default BranchingChat;

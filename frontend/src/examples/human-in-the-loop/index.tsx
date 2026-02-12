import { useState, useCallback } from "react";
import { useStickToBottom } from "use-stick-to-bottom";
import { AlertCircle, UserCheck } from "lucide-react";
import {
  useStream,
  type ToolCallWithResult,
} from "@langchain/langgraph-sdk/react";
import type { Message } from "@langchain/langgraph-sdk";
import type { HITLRequest, HITLResponse } from "langchain";

import { registerExample } from "../registry";
import { LoadingIndicator } from "../../components/Loading";
import { EmptyState } from "../../components/States";
import { MessageBubble } from "../../components/MessageBubble";
import { MessageInput } from "../../components/MessageInput";

import type { agent } from "./agent";
import { ToolCallCard } from "./components/ToolCallCard";
import type { AgentToolCalls } from "./types";
import { PendingApprovalCard } from "./components/PendingApprovalCard";

const HITL_SUGGESTIONS = [
  "Enviar e-mail para joao@exemplo.com",
  "Excluir o arquivo fatura_antiga.pdf",
  "Ler o conteúdo de regras_cambio.json",
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

export function HumanInTheLoop() {
  const stream = useStream<typeof agent, { InterruptType: HITLRequest }>({
    assistantId: "human-in-the-loop",
    apiUrl: "http://localhost:2024",
  });

  const { scrollRef, contentRef } = useStickToBottom();
  const [isProcessing, setIsProcessing] = useState(false);

  const hitlRequest = stream.interrupt?.value as HITLRequest | undefined;

  const handleSubmit = useCallback(
    (content: string) => {
      stream.submit({ messages: [{ content, type: "human" }] });
    },
    [stream],
  );

  const handleApprove = async (index: number) => {
    if (!hitlRequest) return;
    setIsProcessing(true);
    try {
      const decisions: HITLResponse["decisions"] =
        hitlRequest.actionRequests.map((_, i) => {
          if (i === index) {
            return { type: "approve" as const };
          }
          return { type: "approve" as const };
        });

      await stream.submit(null, {
        command: {
          resume: { decisions } as HITLResponse,
        },
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (index: number, reason: string) => {
    if (!hitlRequest) return;
    setIsProcessing(true);
    try {
      const decisions: HITLResponse["decisions"] =
        hitlRequest.actionRequests.map((_, i) => {
          if (i === index) {
            return {
              type: "reject" as const,
              message: reason || "Ação rejeitada pelo usuário.",
            };
          }
          return {
            type: "reject" as const,
            message: "Rejeitado junto com outras ações",
          };
        });

      await stream.submit(null, {
        command: {
          resume: { decisions } as HITLResponse,
        },
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = async (
    index: number,
    editedArgs: Record<string, unknown>,
  ) => {
    if (!hitlRequest) return;
    setIsProcessing(true);
    try {
      const originalAction = hitlRequest.actionRequests[index];
      const decisions: HITLResponse["decisions"] =
        hitlRequest.actionRequests.map((_, i) => {
          if (i === index) {
            return {
              type: "edit" as const,
              editedAction: {
                name: originalAction.name,
                args: editedArgs,
              },
            };
          }
          return { type: "approve" as const };
        });

      await stream.submit(null, {
        command: {
          resume: { decisions } as HITLResponse,
        },
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const hasMessages = stream.messages.length > 0;

  return (
    <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 transition-colors">
      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-800"
      >
        <div ref={contentRef} className="max-w-2xl mx-auto px-4 py-8">
          {!hasMessages && !stream.interrupt ? (
            <EmptyState
              icon={UserCheck}
              title="Aprovação Humana (HITL)"
              description="Um agente que exige sua aprovação para ações sensíveis. Tente enviar um e-mail, excluir um arquivo ou ler documentos de câmbio."
              suggestions={HITL_SUGGESTIONS}
              onSuggestionClick={handleSubmit}
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
                          <ToolCallCard
                            key={toolCall.id}
                            toolCall={
                              toolCall as ToolCallWithResult<AgentToolCalls>
                            }
                          />
                        ))}
                      </div>
                    );
                  }

                  if (!hasContent(message)) return null;
                }

                return (
                  <MessageBubble key={message.id ?? idx} message={message} />
                );
              })}

              {hitlRequest && hitlRequest.actionRequests.length > 0 && (
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {hitlRequest.actionRequests.map((actionRequest, idx) => (
                    <PendingApprovalCard
                      key={idx}
                      actionRequest={actionRequest}
                      reviewConfig={hitlRequest.reviewConfigs[idx]}
                      onApprove={() => handleApprove(idx)}
                      onReject={(reason) => handleReject(idx, reason)}
                      onEdit={(editedArgs) => handleEdit(idx, editedArgs)}
                      isProcessing={isProcessing}
                    />
                  ))}
                </div>
              )}

              {stream.isLoading &&
                !stream.interrupt &&
                !stream.messages.some(hasContent) &&
                stream.toolCalls.length === 0 && <LoadingIndicator />}
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

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-colors">
        <MessageInput
          disabled={stream.isLoading || isProcessing || !!stream.interrupt}
          placeholder={
            stream.interrupt
              ? "Por favor, aprove ou rejeite a ação pendente..."
              : "Peça para enviar um e-mail ou gerenciar arquivos..."
          }
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}

registerExample({
  id: "human-in-the-loop",
  title: "Aprovação Humana",
  description:
    "Agente ReAct com interrupções para aprovar, editar ou rejeitar chamadas de ferramentas",
  category: "agents",
  icon: "chat",
  ready: true,
  component: HumanInTheLoop,
});

export default HumanInTheLoop;

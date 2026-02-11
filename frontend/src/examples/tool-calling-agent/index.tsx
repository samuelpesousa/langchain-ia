import { useCallback } from "react";
import { useStickToBottom } from "use-stick-to-bottom";
import { AlertCircle, Wrench } from "lucide-react";
import {
  FetchStreamTransport,
  useStream,
} from "@langchain/langgraph-sdk/react";
import type { Message } from "@langchain/langgraph-sdk";

import { registerExample } from "../registry";
import { LoadingIndicator } from "../../components/Loading";
import { EmptyState } from "../../components/States";
import { MessageBubble } from "../../components/MessageBubble";
import { MessageInput } from "../../components/MessageInput";
import { ToolCallCard } from "../../components/ToolCallCard";

const TOOL_AGENT_SUGGESTIONS = [
  "Consultar cotação do dólar comercial",
  "Solicitar status de despacho aduaneiro",
  "Buscar fornecedores de serviços logísticos",
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

export function ToolCallingAgent() {
  const { scrollRef, contentRef } = useStickToBottom();
  const stream = useStream({
    transport: new FetchStreamTransport({
      apiUrl: "http://localhost:8080/api/stream",
    }),
  });
  const hasMessages = stream.messages.length > 0;

  const handleSubmit = useCallback(
    (content: string) => {
      stream.submit({ messages: [{ content, type: "human" }] });
    },
    [stream],
  );

  return (
    <div className="h-full flex flex-col">
      <main ref={scrollRef} className="flex-1 overflow-y-auto">
        <div ref={contentRef} className="max-w-2xl mx-auto px-4 py-8">
          {!hasMessages ? (
            <EmptyState
              icon={Wrench}
              title="Assistente de Câmbio e Despacho"
              description="Um assistente inteligente para consultas de câmbio, status de despacho e busca de fornecedores. Faça perguntas sobre operações de câmbio, despacho aduaneiro ou fornecedores do setor."
              suggestions={TOOL_AGENT_SUGGESTIONS}
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
                          <ToolCallCard key={toolCall.id} toolCall={toolCall} />
                        ))}
                      </div>
                    );
                  }

                  if (!hasContent(message)) {
                    return null;
                  }
                }

                return (
                  <MessageBubble key={message.id ?? idx} message={message} />
                );
              })}

              {stream.isLoading &&
                !stream.messages.some(
                  (m) => m.type === "ai" && hasContent(m),
                ) &&
                stream.toolCalls.length === 0 && <LoadingIndicator />}
            </div>
          )}
        </div>
      </main>

      {stream.error != null && (
        <div className="max-w-2xl mx-auto px-4 pb-3">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                {stream.error instanceof Error
                  ? stream.error.message
                  : "An error occurred"}
              </span>
            </div>
          </div>
        </div>
      )}

      <MessageInput
        disabled={stream.isLoading}
        placeholder="Pergunte sobre câmbio, despacho ou fornecedores..."
        onSubmit={handleSubmit}
      />
    </div>
  );
}

registerExample({
  id: "tool-calling-agent",
  title: "Assistente de Câmbio e Despacho",
  description:
    "Assistente para corretora de câmbio, despacho aduaneiro e fornecedores, demonstrando integração com ferramentas do setor.",
  category: "agents",
  icon: "tool",
  ready: true,
  component: ToolCallingAgent,
});

export default ToolCallingAgent;

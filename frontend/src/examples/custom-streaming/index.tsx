import { useCallback, useState } from "react";
import { useStickToBottom } from "use-stick-to-bottom";
import { AlertCircle, Radio } from "lucide-react";
import { useStream } from "@langchain/langgraph-sdk/react";
import type { Message } from "@langchain/langgraph-sdk";

import { registerExample } from "../registry";
import { LoadingIndicator } from "../../components/Loading";
import { EmptyState } from "../../components/States";
import { MessageBubble } from "../../components/MessageBubble";
import { MessageInput } from "../../components/MessageInput";

import type { agent } from "./agent";
import {
  isProgressData,
  isStatusData,
  isFileStatusData,
  type ProgressData,
  type StatusData,
  type FileStatusData,
} from "./types";
import { ProgressCard } from "./components/ProgressCard";
import { StatusBadge } from "./components/StatusBadge";
import { FileOperationCard } from "./components/FileOperationCard";

const CUSTOM_STREAMING_SUGGESTIONS = [
  "Analisar dados de vendas para tendências",
  "Processar e comprimir relatório_cambio.pdf",
  "Analisar inventário em busca de anomalias",
  "Validar config.json e transformar dados.csv",
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

export function CustomStreaming() {
  const [customEvents, setCustomEvents] = useState<{
    progressData: Map<string, ProgressData>;
    statusData: Map<string, StatusData>;
    fileStatusData: Map<string, FileStatusData>;
  }>({
    progressData: new Map(),
    statusData: new Map(),
    fileStatusData: new Map(),
  });

  const handleCustomEvent = useCallback((data: unknown) => {
    setCustomEvents((prev) => {
      if (isProgressData(data)) {
        const newProgressData = new Map(prev.progressData);
        newProgressData.set(data.id, data);
        return { ...prev, progressData: newProgressData };
      } else if (isStatusData(data)) {
        const newStatusData = new Map(prev.statusData);
        newStatusData.set(data.id, data);
        return { ...prev, statusData: newStatusData };
      } else if (isFileStatusData(data)) {
        const newFileStatusData = new Map(prev.fileStatusData);
        newFileStatusData.set(data.id, data);
        return { ...prev, fileStatusData: newFileStatusData };
      }
      return prev;
    });
  }, []);

  const stream = useStream<typeof agent>({
    assistantId: "custom-streaming",
    apiUrl: "http://localhost:2024",
    onCustomEvent: handleCustomEvent,
  });

  const { scrollRef, contentRef } = useStickToBottom();

  const handleSubmit = useCallback(
    (content: string) => {
      setCustomEvents({
        progressData: new Map(),
        statusData: new Map(),
        fileStatusData: new Map(),
      });
      stream.submit({ messages: [{ content, type: "human" } as any] });
    },
    [stream],
  );

  const hasMessages = stream.messages.length > 0;

  const progressDataArray = Array.from(customEvents.progressData.values());
  const statusDataArray = Array.from(customEvents.statusData.values());
  const fileStatusDataArray = Array.from(customEvents.fileStatusData.values());

  const hasCustomData =
    progressDataArray.length > 0 ||
    statusDataArray.length > 0 ||
    fileStatusDataArray.length > 0;

  const isProgressComplete =
    progressDataArray.length > 0 &&
    progressDataArray.every((p) => p.progress === 100);

  const getEventsForToolCall = useCallback(
    (toolCallId: string) => {
      const status = statusDataArray.filter(
        (d) => d.toolCall?.id === toolCallId,
      );
      const progress = progressDataArray.filter(
        (d) =>
          d.toolCall?.id === toolCallId &&
          (status.length === 0 || status.some((s) => s.status !== "complete")),
      );
      const fileStatus = fileStatusDataArray.filter(
        (d) => d.toolCall?.id === toolCallId,
      );
      return { progress, status, fileStatus };
    },
    [progressDataArray, statusDataArray, fileStatusDataArray],
  );

  return (
    <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 transition-colors">
      <main ref={scrollRef} className="flex-1 overflow-y-auto">
        <div ref={contentRef} className="max-w-2xl mx-auto px-4 py-8">
          {!hasMessages ? (
            <EmptyState
              icon={Radio}
              title="Eventos de Streaming Customizados"
              description="Demonstração de envio de dados customizados dos nós do LangGraph para a interface. Observe barras de progresso, atualizações de status e operações de arquivo em tempo real."
              suggestions={CUSTOM_STREAMING_SUGGESTIONS}
              onSuggestionClick={handleSubmit}
            />
          ) : (
            <div className="flex flex-col gap-6">
              {stream.messages.map((message, idx) => {
                const customCards =
                  message.type === "ai"
                    ? message.tool_calls?.map((toolCall) => {
                        const { progress, status, fileStatus } =
                          getEventsForToolCall(toolCall.id!);
                        return (
                          <div key={toolCall.id} className="space-y-3">
                            {progress.map((data) => (
                              <ProgressCard key={data.id} data={data} />
                            ))}
                            {status.map((data) => (
                              <StatusBadge key={data.id} data={data} />
                            ))}
                            {fileStatus.map((data) => (
                              <FileOperationCard key={data.id} data={data} />
                            ))}
                          </div>
                        );
                      }) ?? []
                    : [];

                return [
                  <MessageBubble key={message.id ?? idx} message={message} />,
                  ...customCards,
                ];
              })}

              {stream.isLoading &&
                !stream.messages.some(
                  (m) => m.type === "ai" && hasContent(m),
                ) &&
                !hasCustomData && <LoadingIndicator />}

              {stream.isLoading && hasCustomData && !isProgressComplete && (
                <div className="flex items-center gap-3 text-blue-900 dark:text-blue-400 font-medium">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-ping" />
                    <span className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-ping [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-ping [animation-delay:300ms]" />
                  </div>
                  <span className="text-sm">
                    Transmitindo eventos customizados...
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
                  : "Ocorreu um erro. Verifique se a sua OPENAI_API_KEY está configurada."}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <MessageInput
          disabled={stream.isLoading}
          placeholder="Peça-me para analisar dados ou processar arquivos..."
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}

registerExample({
  id: "custom-streaming",
  title: "Eventos de Streaming Customizados",
  description:
    "Transmita dados customizados, como barras de progresso e atualizações de status, diretamente das ferramentas do LangGraph",
  category: "advanced",
  icon: "code",
  ready: true,
  component: CustomStreaming,
});

export default CustomStreaming;

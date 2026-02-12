import { useRef, useCallback, useState, useMemo } from "react";
import {
  AlertCircle,
  BarChart3,
  Sparkles,
  Wrench,
  GitFork,
  Loader2,
} from "lucide-react";

import { useStream } from "@langchain/langgraph-sdk/react";

import { registerExample } from "../registry";
import { EmptyState } from "../../components/States";
import { MessageInput } from "../../components/MessageInput";

import { ResearchCard } from "./components/ResearchCard";
import { TopicBar } from "./components/TopicBar";
import { SelectedResearchDisplay } from "./components/SelectedResearchDisplay";
import type { ResearchContents, ResearchId, ResearchConfig } from "./types";
import type { agent } from "./agent";

const RESEARCH_CONFIGS: ResearchConfig[] = [
  {
    id: "analytical",
    name: "Analítico",
    nodeName: "researcher_analytical",
    icon: <BarChart3 className="w-5 h-5" />,
    description:
      "Análise estruturada baseada em dados com insights fundamentados",
    gradient: "from-blue-700/20 to-blue-900/20",
    borderColor: "border-blue-700/40",
    bgColor: "bg-blue-950/30",
    iconBg: "bg-blue-700/20",
    accentColor: "text-blue-400",
  },
  {
    id: "creative",
    name: "Criativo",
    nodeName: "researcher_creative",
    icon: <Sparkles className="w-5 h-5" />,
    description: "Narrativa envolvente com perspectivas inovadoras e criativas",
    gradient: "from-sky-600/20 to-blue-800/20",
    borderColor: "border-sky-500/40",
    bgColor: "bg-sky-950/30",
    iconBg: "bg-sky-500/20",
    accentColor: "text-sky-400",
  },
  {
    id: "practical",
    name: "Prático",
    nodeName: "researcher_practical",
    icon: <Wrench className="w-5 h-5" />,
    description: "Guia orientado à ação com recomendações práticas",
    gradient: "from-indigo-700/20 to-blue-900/20",
    borderColor: "border-indigo-500/40",
    bgColor: "bg-indigo-950/30",
    iconBg: "bg-indigo-500/20",
    accentColor: "text-indigo-400",
  },
];

const PARALLEL_RESEARCH_SUGGESTIONS = [
  "O futuro das energias renováveis",
  "Como a IA está transformando o setor de câmbio",
  "Melhores práticas para trabalho remoto",
  "Impacto da blockchain no comércio exterior",
];

export function ParallelResearch() {
  const stream = useStream<typeof agent>({
    assistantId: "parallel-research",
    apiUrl: "http://localhost:2024",
  });

  const [selectedResearch, setSelectedResearch] = useState<ResearchId | null>(
    null,
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const streamingContents = useMemo((): ResearchContents => {
    const contents: ResearchContents = {
      analytical: "",
      creative: "",
      practical: "",
    };

    for (const message of stream.messages) {
      if (message.type !== "ai") continue;

      const metadata = stream.getMessagesMetadata?.(message);
      const nodeFromMetadata = metadata?.streamMetadata?.langgraph_node as
        | string
        | undefined;

      const nodeName = (message as { name?: string }).name;
      const node = nodeFromMetadata || nodeName;

      if (!node) continue;

      const content =
        typeof message.content === "string" ? message.content : "";

      if (node === "researcher_analytical" && content) {
        contents.analytical = content;
      } else if (node === "researcher_creative" && content) {
        contents.creative = content;
      } else if (node === "researcher_practical" && content) {
        contents.practical = content;
      }
    }

    return contents;
  }, [stream.messages, stream.getMessagesMetadata]);

  const researchContents = useMemo((): ResearchContents => {
    return {
      analytical:
        streamingContents.analytical || stream.values?.analyticalResearch || "",
      creative:
        streamingContents.creative || stream.values?.creativeResearch || "",
      practical:
        streamingContents.practical || stream.values?.practicalResearch || "",
    };
  }, [
    streamingContents,
    stream.values?.analyticalResearch,
    stream.values?.creativeResearch,
    stream.values?.practicalResearch,
  ]);

  const currentTopic = stream.values?.topic || null;

  const loadingStates = useMemo(() => {
    const activeNodes = new Set<ResearchId>();
    const currentNode = stream.values?.currentNode || "";

    if (stream.isLoading && currentTopic && currentNode !== "collector") {
      activeNodes.add("analytical");
      activeNodes.add("creative");
      activeNodes.add("practical");
    }

    return activeNodes;
  }, [stream.isLoading, currentTopic, stream.values?.currentNode]);

  const isResearchComplete = useMemo(() => {
    const currentNode = stream.values?.currentNode || "";
    return (
      !stream.isLoading &&
      currentNode === "collector" &&
      Boolean(researchContents.analytical) &&
      Boolean(researchContents.creative) &&
      Boolean(researchContents.practical)
    );
  }, [stream.isLoading, stream.values?.currentNode, researchContents]);

  const hasStarted = Boolean(stream.values?.topic);

  const handleSubmit = useCallback(
    (content: string) => {
      setSelectedResearch(null);
      stream.submit({ messages: [{ content, type: "human" } as any] });
    },
    [stream],
  );

  const handleSelectResearch = useCallback((researchId: ResearchId) => {
    setSelectedResearch(researchId);
  }, []);

  return (
    <div className="h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 transition-colors">
      <main className="flex-1 overflow-y-auto" ref={containerRef}>
        <div className="max-w-6xl mx-auto px-4 py-8">
          {!hasStarted ? (
            <EmptyState
              icon={GitFork}
              title="Explorador de Pesquisa Paralela"
              description="Digite um tópico e veja três modelos de IA diferentes analisarem-no simultaneamente. Cada um traz uma perspectiva única para o seu trabalho: analítica, criativa e prática."
              suggestions={PARALLEL_RESEARCH_SUGGESTIONS}
              onSuggestionClick={handleSubmit}
            />
          ) : (
            <>
              {currentTopic && <TopicBar topic={currentTopic} />}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                {RESEARCH_CONFIGS.map((config) => (
                  <div key={config.id} className="h-[500px]">
                    <ResearchCard
                      config={config}
                      content={researchContents[config.id] || ""}
                      isLoading={loadingStates.has(config.id)}
                      isSelected={selectedResearch === config.id}
                      onSelect={() => handleSelectResearch(config.id)}
                      disabled={!isResearchComplete}
                    />
                  </div>
                ))}
              </div>

              {selectedResearch && (
                <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <SelectedResearchDisplay
                    config={
                      RESEARCH_CONFIGS.find((c) => c.id === selectedResearch)!
                    }
                    content={researchContents[selectedResearch] || ""}
                  />
                </div>
              )}

              {stream.isLoading && !isResearchComplete && (
                <div className="mt-6 flex items-center justify-center gap-3 text-blue-900 dark:text-blue-400 animate-pulse">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-medium">
                    Pesquisa sendo processada em paralelo...
                  </span>
                </div>
              )}
            </>
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
                  : "Ocorreu um erro inesperado na pesquisa."}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <MessageInput
          disabled={stream.isLoading}
          placeholder="Digite um tópico de pesquisa (Ex: Câmbio no Brasil)..."
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}

registerExample({
  id: "parallel-research",
  title: "Pesquisa Paralela",
  description:
    "Veja 3 modelos de IA pesquisarem um tópico em paralelo e escolha seu resultado favorito",
  category: "langgraph",
  icon: "graph",
  ready: true,
  component: ParallelResearch,
});

export default ParallelResearch;

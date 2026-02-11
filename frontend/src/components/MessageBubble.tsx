import { Brain } from "lucide-react";
import type { ContentBlock } from "langchain";
import type { Message } from "@langchain/langgraph-sdk";

const BUBBLE_STYLES = {
  human:
    "bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 rounded-2xl px-4 py-2.5 ml-auto max-w-[85%] md:max-w-[70%] w-fit shadow-sm border border-blue-100 dark:border-blue-900/30",
  system:
    "bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/20 dark:border-amber-900/30 text-amber-800 dark:text-amber-200 rounded-lg px-4 py-3",
  ai: "text-zinc-900 dark:text-zinc-100",
} as const;

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

export function MessageBubble({ message }: { message: Message }) {
  const content = getTextContent(message);

  if (message.type === "tool") {
    return null;
  }

  if (message.type === "system") {
    return <SystemBubble content={content} />;
  }

  if (message.type === "human") {
    return <HumanBubble content={content} />;
  }

  return <AssistantBubble message={message} />;
}

function HumanBubble({ content }: { content: string }) {
  return (
    <div className="animate-fade-in">
      <div className={BUBBLE_STYLES.human}>
        <div className="whitespace-pre-wrap leading-relaxed text-[15px]">
          {content}
        </div>
      </div>
    </div>
  );
}

function SystemBubble({ content }: { content: string }) {
  return (
    <div className="animate-fade-in">
      <div className="text-xs font-medium text-zinc-500 dark:text-zinc-500 mb-2">
        Sistema
      </div>
      <div className={BUBBLE_STYLES.system}>
        <div className="whitespace-pre-wrap leading-relaxed text-[15px]">
          {content}
        </div>
      </div>
    </div>
  );
}

function AssistantBubble({ message }: { message: Message }) {
  const content = getTextContent(message);
  const reasoning = getReasoningFromMessage(message);

  return (
    <div className="flex flex-col gap-4">
      {reasoning && <ReasoningBubble content={reasoning} />}

      {content && (
        <div className="animate-fade-in">
          <div className="text-xs font-medium text-zinc-500 mb-2">
            Assistente
          </div>
          <div className={BUBBLE_STYLES.ai}>
            <div className="whitespace-pre-wrap leading-relaxed text-[15px]">
              {content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReasoningBubble({ content }: { content: string }) {
  return (
    <div className="animate-fade-in">
      {/* Rótulo de raciocínio com cor de destaque suave */}
      <div className="text-xs font-medium text-amber-600 dark:text-amber-400/80 mb-2 flex items-center gap-1.5">
        <Brain className="w-3 h-3" />
        <span>Raciocínio</span>
      </div>

      <div className="bg-gradient-to-br from-amber-50 dark:from-amber-950/50 to-amber-100/50 dark:to-orange-950/40 border border-amber-200 dark:border-amber-500/20 rounded-2xl px-4 py-3 max-w-[95%] shadow-sm">
        <div className="text-sm text-amber-900 dark:text-amber-100/90 whitespace-pre-wrap leading-relaxed italic">
          {content}
        </div>
      </div>
    </div>
  );
}

export function getReasoningFromMessage(message: Message): string | undefined {
  if (Array.isArray(message.content)) {
    const reasoningContent = (message.content as ContentBlock[])
      .filter(
        (block): block is ContentBlock.Reasoning =>
          typeof block === "object" &&
          block !== null &&
          "type" in block &&
          block.type === "reasoning" &&
          "reasoning" in block &&
          typeof block.reasoning === "string",
      )
      .map((block) => block.reasoning)
      .join("");

    if (reasoningContent.trim()) {
      return reasoningContent;
    }
  }

  return undefined;
}

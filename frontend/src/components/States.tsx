import { MessageCircle, type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
}

export function EmptyState({
  icon: Icon = MessageCircle,
  title = "Como posso ajudar você hoje?",
  description = "Envie uma mensagem para iniciar uma conversa com o assistente de IA.",
  suggestions = [],
  onSuggestionClick,
}: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24 transition-colors">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-900/10 to-zinc-200/50 dark:from-blue-900/20 dark:to-zinc-800/30 border border-blue-900/20 dark:border-blue-800/30 flex items-center justify-center mb-6">
        <Icon
          className="w-8 h-8 text-blue-900 dark:text-blue-400"
          strokeWidth={1.5}
        />
      </div>

      <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
        {title}
      </h2>
      <p className="text-zinc-600 dark:text-zinc-400 max-w-md mb-8 leading-relaxed">
        {description}
      </p>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => onSuggestionClick?.(suggestion)}
              className="px-4 py-2 rounded-full bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition-all border border-zinc-200 dark:border-zinc-800 hover:border-blue-900/40 dark:hover:border-blue-800/40 cursor-pointer shadow-sm"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

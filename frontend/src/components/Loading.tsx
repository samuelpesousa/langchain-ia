export function LoadingIndicator() {
  return (
    <div className="animate-fade-in">
      <div className="text-xs font-medium text-zinc-500 mb-2">Assistente</div>

      <div className="flex items-center gap-1.5 ml-1">
        <span
          className="w-1.5 h-1.5 bg-blue-900 dark:bg-blue-400 rounded-full animate-pulse-subtle"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="w-1.5 h-1.5 bg-blue-900 dark:bg-blue-400 rounded-full animate-pulse-subtle"
          style={{ animationDelay: "300ms" }}
        />
        <span
          className="w-1.5 h-1.5 bg-blue-900 dark:bg-blue-400 rounded-full animate-pulse-subtle"
          style={{ animationDelay: "600ms" }}
        />
      </div>
    </div>
  );
}

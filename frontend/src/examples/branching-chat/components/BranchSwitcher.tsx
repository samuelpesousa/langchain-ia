import { ChevronLeft, ChevronRight, GitBranch } from "lucide-react";

interface BranchSwitcherProps {
  branch: string | undefined;
  branchOptions: string[] | undefined;
  onSelect: (branch: string) => void;
}

export function BranchSwitcher({
  branch,
  branchOptions,
  onSelect,
}: BranchSwitcherProps) {
  if (!branchOptions || branchOptions.length <= 1 || !branch) {
    return null;
  }

  const index = branchOptions.indexOf(branch);
  const hasPrev = index > 0;
  const hasNext = index < branchOptions.length - 1;

  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-100/60 dark:bg-zinc-800/60 border border-zinc-200/50 dark:border-zinc-700/50 transition-colors">
      <GitBranch className="w-3 h-3 text-blue-900 dark:text-blue-400" />

      <button
        type="button"
        disabled={!hasPrev}
        onClick={() => {
          const prevBranch = branchOptions[index - 1];
          if (prevBranch) onSelect(prevBranch);
        }}
        className="p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Ramificação anterior"
      >
        <ChevronLeft className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
      </button>

      <span className="text-[10px] text-zinc-600 dark:text-zinc-400 font-bold min-w-[3ch] text-center">
        {index + 1}/{branchOptions.length}
      </span>

      <button
        type="button"
        disabled={!hasNext}
        onClick={() => {
          const nextBranch = branchOptions[index + 1];
          if (nextBranch) onSelect(nextBranch);
        }}
        className="p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Próxima ramificação"
      >
        <ChevronRight className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
      </button>
    </div>
  );
}

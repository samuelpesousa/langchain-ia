import { ArrowUp } from "lucide-react";

interface MessageInputProps {
  onSubmit: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSubmit,
  disabled = false,
  placeholder = "Envie uma mensagem...",
}: MessageInputProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const content = formData.get("content") as string;

    if (!content.trim()) return;

    form.reset();
    onSubmit(content);
  };

  return (
    <footer className=" border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-colors">
      <div className="max-w-2xl mx-auto px-4 py-4">
        <form className="relative" onSubmit={handleSubmit}>
          <div className="relative bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 focus-within:border-blue-900/50 dark:focus-within:border-blue-800/50 transition-all shadow-sm">
            <textarea
              name="content"
              placeholder={placeholder}
              rows={1}
              disabled={disabled}
              className="w-full bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 px-4 py-3 pr-12 resize-none focus:outline-none text-sm leading-relaxed max-h-[200px] disabled:opacity-50 field-sizing-content"
              onKeyDown={(e) => {
                const target = e.target as HTMLTextAreaElement;

                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  target.form?.requestSubmit();
                }
              }}
            />

            <button
              type="submit"
              disabled={disabled}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-blue-900 dark:bg-blue-900 hover:bg-blue-800 text-white disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed disabled:text-zinc-500 transition-colors shadow-sm"
            >
              <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>

          <p className="text-center text-xs text-zinc-500 dark:text-zinc-500 mt-3">
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono text-[10px] uppercase">
              Enter
            </kbd>{" "}
            para enviar ·{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono text-[10px] uppercase">
              Shift + Enter
            </kbd>{" "}
            para nova linha
          </p>
        </form>
      </div>
    </footer>
  );
}

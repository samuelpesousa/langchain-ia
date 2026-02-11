import {
  Wrench,
  GitBranch,
  Layers,
  Code,
  MessageCircle,
  X,
  Menu,
  BookOpen,
  ExternalLink,
  Sun,
  Moon,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  CATEGORIES,
  getExamplesByCategory,
  type ExampleMeta,
} from "../examples/registry";

interface SidebarProps {
  selectedExample: string | null;
  onSelectExample: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const ICONS: Record<ExampleMeta["icon"], React.ReactNode> = {
  tool: <Wrench className="w-4 h-4" strokeWidth={1.5} />,
  graph: <GitBranch className="w-4 h-4" strokeWidth={1.5} />,
  middleware: <Layers className="w-4 h-4" strokeWidth={1.5} />,
  code: <Code className="w-4 h-4" strokeWidth={1.5} />,
  chat: <MessageCircle className="w-4 h-4" strokeWidth={1.5} />,
};

export function Sidebar({
  selectedExample,
  onSelectExample,
  isOpen,
  onToggle,
}: SidebarProps) {
  const examplesByCategory = getExamplesByCategory();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-72 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800
          transform transition-transform duration-200 ease-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          flex flex-col transition-colors duration-300
        `}
      >
        <div className="flex items-center gap-3 px-4 py-5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-blue-900 overflow-hidden shadow-sm">
            <img
              src="/assets/logo.png"
              alt="Logo"
              className="h-8 w-8 object-contain"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
              CODEXA
            </h1>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
              Câmbio & Despacho
            </p>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden ml-auto p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
          {Array.from(examplesByCategory.entries()).map(
            ([category, examples]) => {
              if (examples.length === 0) return null;

              const categoryMeta = CATEGORIES[category];

              return (
                <div key={category} className="mb-6">
                  <div className="px-2 mb-2">
                    <h2 className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                      {categoryMeta.label}
                    </h2>
                  </div>

                  <div className="space-y-1">
                    {examples.map((example) => {
                      const isSelected = selectedExample === example.id;

                      return (
                        <button
                          key={example.id}
                          onClick={() =>
                            example.ready && onSelectExample(example.id)
                          }
                          disabled={!example.ready}
                          className={`
                          w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left
                          transition-all duration-150 border cursor-pointer
                          ${
                            isSelected
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-900/40"
                              : example.ready
                              ? "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 border-transparent"
                              : "text-zinc-400 dark:text-zinc-600 cursor-not-allowed border-transparent opacity-60"
                          }
                        `}
                        >
                          <span
                            className={`
                            mt-0.5 shrink-0
                            ${
                              isSelected
                                ? "text-blue-700 dark:text-blue-400"
                                : "text-zinc-400 dark:text-zinc-500"
                            }
                          `}
                          >
                            {ICONS[example.icon]}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold truncate">
                                {example.title}
                              </span>
                              {!example.ready && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-500 font-bold uppercase tracking-tighter">
                                  Em breve
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-500 mt-0.5 line-clamp-2 leading-snug">
                              {example.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            },
          )}
        </nav>

        <div className="px-4 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/50">
          <a
            href="#"
            className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-blue-900 dark:hover:text-blue-400 transition-colors"
          >
            <BookOpen className="w-4 h-4" strokeWidth={1.5} />
            <span>Minha conta</span>
            <ExternalLink className="w-3 h-3 opacity-50" />
          </a>
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}

export function SidebarToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden fixed top-4 left-4 z-30 p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-blue-900 dark:hover:text-blue-400 shadow-sm transition-all"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark((d) => !d)}
      className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all border border-zinc-200 dark:border-zinc-800"
      title={dark ? "Mudar para tema claro" : "Mudar para tema escuro"}
    >
      {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

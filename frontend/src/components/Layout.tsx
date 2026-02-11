import { useState, useEffect } from "react";
import { Zap } from "lucide-react";
import { Sidebar, SidebarToggle } from "./Sidebar";
import { EXAMPLES, getExample } from "../examples/registry";

import "../examples/tool-calling-agent";
import "../examples/human-in-the-loop";
import "../examples/summarization-agent";
import "../examples/parallel-research";
import "../examples/reasoning-agent";
import "../examples/custom-streaming";
import "../examples/branching-chat";
import "../examples/session-persistence";
import "../examples/deepagent";
import "../examples/deepagent-tools";

function WelcomeScreen() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-8 bg-zinc-50 dark:bg-zinc-950 transition-colors">
      <div className="w-16 h-16 mb-6 rounded-2xl bg-blue-900 flex items-center justify-center animate-fade-in shadow-lg">
        <span className="text-2xl">🦜🔗</span>
      </div>

      <h1
        className="text-2xl font-semibold text-zinc-900 dark:text-white mb-3 animate-fade-in"
        style={{ animationDelay: "100ms" }}
      >
        Exemplos de Streaming LangGraph
      </h1>

      <p
        className="text-zinc-600 dark:text-zinc-400 max-w-md mb-8 animate-fade-in"
        style={{ animationDelay: "200ms" }}
      >
        Explore diferentes padrões de streaming com LangGraph. Selecione um
        exemplo na barra lateral para começar.
      </p>

      <div
        className="grid gap-4 w-full max-w-md animate-fade-in"
        style={{ animationDelay: "300ms" }}
      >
        {EXAMPLES.filter((e) => e.ready)
          .slice(0, 3)
          .map((example) => (
            <div
              key={example.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-900/40 dark:hover:border-blue-800/50 transition-all text-left shadow-sm"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-blue-900 dark:text-blue-400">
                <Zap className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-zinc-900 dark:text-white">
                  {example.title}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-500 truncate">
                  {example.description}
                </p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

function getExampleFromHash(): string | null {
  const hash = window.location.hash.slice(1);
  if (hash && EXAMPLES.some((e) => e.id === hash && e.ready)) {
    return hash;
  }
  return null;
}

export function Layout() {
  const [selectedExample, setSelectedExample] = useState<string | null>(() =>
    getExampleFromHash(),
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      const exampleFromHash = getExampleFromHash();
      if (exampleFromHash) {
        setSelectedExample(exampleFromHash);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    if (!selectedExample && EXAMPLES.length > 0) {
      const firstReady = EXAMPLES.find((e) => e.ready);
      if (firstReady) {
        setSelectedExample(firstReady.id);
        window.location.hash = firstReady.id;
      }
    }
  }, [selectedExample]);

  const currentExample = selectedExample ? getExample(selectedExample) : null;
  const ExampleComponent = currentExample?.component;

  return (
    <div className="h-screen flex bg-zinc-50 dark:bg-zinc-950 transition-colors">
      <Sidebar
        selectedExample={selectedExample}
        onSelectExample={(id) => {
          setSelectedExample(id);
          window.location.hash = id;
          setSidebarOpen(false);
        }}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className="flex-1 flex flex-col min-w-0 relative">
        <SidebarToggle onClick={() => setSidebarOpen(true)} />

        {currentExample && (
          <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 py-3.5 flex items-center gap-4 lg:px-8 transition-colors">
            <div className="lg:hidden w-8" />
            <div>
              <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {currentExample.title}
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {currentExample.description}
              </p>
            </div>
          </header>
        )}

        <div className="flex-1 overflow-hidden">
          {ExampleComponent ? <ExampleComponent /> : <WelcomeScreen />}
        </div>
      </main>
    </div>
  );
}

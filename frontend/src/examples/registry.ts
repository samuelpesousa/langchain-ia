import type { ComponentType } from "react";
export interface ExampleMeta {

  id: string;
  title: string;
  description: string;
  category: "agents" | "middleware" | "langgraph" | "advanced";
  icon: "tool" | "graph" | "middleware" | "code" | "chat";
  ready: boolean;
}


export interface ExampleDefinition extends ExampleMeta {
  component: ComponentType;
}

export const CATEGORIES: Record<
  ExampleMeta["category"],
  { label: string; description: string }
> = {
  agents: {
    label: "Agentes Inteligentes",
    description: "Workflows de agentes e chamadas de ferramentas",
  },
  langgraph: {
    label: "Fluxos LangGraph",
    description: "Fluxos de conversação baseados em grafos",
  },
  middleware: {
    label: "Middleware & Lógica",
    description: "Padrões de middleware customizados",
  },
  advanced: {
    label: "Padrões Avançados",
    description: "Cenários complexos de streaming",
  },
};


export const EXAMPLES: ExampleDefinition[] = [];


export function registerExample(example: ExampleDefinition): void {
  EXAMPLES.push(example);
}

export function getExample(id: string): ExampleDefinition | undefined {
  return EXAMPLES.find((e) => e.id === id);
}


export function getExamplesByCategory(): Map<
  ExampleMeta["category"],
  ExampleDefinition[]
> {
  const grouped = new Map<ExampleMeta["category"], ExampleDefinition[]>();

  for (const category of Object.keys(CATEGORIES) as ExampleMeta["category"][]) {
    grouped.set(category, []);
  }

  for (const example of EXAMPLES) {
    const categoryExamples = grouped.get(example.category) || [];
    categoryExamples.push(example);
    grouped.set(example.category, categoryExamples);
  }

  return grouped;
}
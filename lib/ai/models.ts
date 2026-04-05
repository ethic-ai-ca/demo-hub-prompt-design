export const DEFAULT_CHAT_MODEL = "gpt-4o";

export const titleModel = {
  id: "gpt-4o-mini",
  name: "GPT-4o mini",
  provider: "openai",
  description: "Fast model for title generation",
};

export type ModelCapabilities = {
  tools: boolean;
  vision: boolean;
  reasoning: boolean;
};

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
};

const staticCapabilities: Record<string, ModelCapabilities> = {
  "gpt-4o": { tools: true, vision: true, reasoning: false },
  "gpt-4o-mini": { tools: true, vision: true, reasoning: false },
};

export const chatModels: ChatModel[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    description: "Most capable multimodal model",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o mini",
    provider: "openai",
    description: "Fast and affordable",
  },
];

export function getCapabilities(): Record<string, ModelCapabilities> {
  return Object.fromEntries(
    chatModels.map((model) => [
      model.id,
      staticCapabilities[model.id] ?? {
        tools: true,
        vision: false,
        reasoning: false,
      },
    ])
  );
}

export function getActiveModels(): ChatModel[] {
  return chatModels;
}

export const allowedModelIds = new Set(chatModels.map((m) => m.id));

export const modelsByProvider = chatModels.reduce(
  (acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  },
  {} as Record<string, ChatModel[]>
);

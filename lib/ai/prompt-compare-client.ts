"use client";

import type { UIMessage } from "ai";
import {
  parseJsonEventStream,
  readUIMessageStream,
  uiMessageChunkSchema,
} from "ai";
import type { Dispatch, SetStateAction } from "react";
import type { CompareLab } from "@/lib/ai/prompts";
import { ChatbotError } from "@/lib/errors";
import type { ChatMessage } from "@/lib/types";
import { fetchWithErrorHandlers } from "@/lib/utils";

export type PromptCompareColumnState = {
  variantIndex: number;
  scenarioIndex: number;
  compareLab: CompareLab;
  label: string;
  text: string;
  status: "pending" | "streaming" | "done" | "error";
  errorMessage?: string;
};

function getTextFromUIMessage(message: UIMessage): string {
  if (!message.parts) {
    return "";
  }
  let out = "";
  for (const part of message.parts) {
    if (part.type === "text" && "text" in part && part.text) {
      out += part.text;
    }
  }
  return out;
}

export async function streamPromptCompareVariant({
  variantIndex,
  scenarioIndex,
  compareLab,
  chatId,
  messages,
  modelId,
  visibilityType,
  signal,
  onUpdate,
}: {
  variantIndex: number;
  scenarioIndex: number;
  compareLab: CompareLab;
  chatId: string;
  messages: ChatMessage[];
  modelId: string;
  visibilityType: "public" | "private";
  signal: AbortSignal;
  onUpdate: (text: string) => void;
}): Promise<void> {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const response = await fetchWithErrorHandlers(
    `${basePath}/api/chat/prompt-compare`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: chatId,
        messages,
        selectedChatModel: modelId,
        selectedVisibilityType: visibilityType,
        variantIndex,
        scenarioIndex,
        compareLab,
      }),
      signal,
    }
  );

  if (!response.body) {
    throw new Error("Empty response body");
  }

  const chunkStream = parseJsonEventStream({
    stream: response.body,
    schema: uiMessageChunkSchema,
  }).pipeThrough(
    new TransformStream({
      transform(chunk, controller) {
        if (!chunk.success) {
          throw chunk.error;
        }
        controller.enqueue(chunk.value);
      },
    })
  );

  for await (const msg of readUIMessageStream({ stream: chunkStream })) {
    if (signal.aborted) {
      return;
    }
    onUpdate(getTextFromUIMessage(msg));
  }
}

export function runPromptCompareVariants({
  chatId,
  messages,
  modelId,
  scenarioIndex,
  compareLab,
  visibilityType,
  signal,
  setColumns,
}: {
  chatId: string;
  messages: ChatMessage[];
  modelId: string;
  scenarioIndex: number;
  compareLab: CompareLab;
  visibilityType: "public" | "private";
  signal: AbortSignal;
  setColumns: Dispatch<SetStateAction<PromptCompareColumnState[]>>;
}): Promise<void> {
  const runners = [0, 1, 2].map((variantIndex) =>
    streamPromptCompareVariant({
      variantIndex,
      scenarioIndex,
      compareLab,
      chatId,
      messages,
      modelId,
      visibilityType,
      signal,
      onUpdate: (text) => {
        setColumns((prev) =>
          prev.map((col, i) =>
            i === variantIndex
              ? { ...col, text, status: "streaming" as const }
              : col
          )
        );
      },
    })
      .then(() => {
        setColumns((prev) =>
          prev.map((col, i) =>
            i === variantIndex ? { ...col, status: "done" as const } : col
          )
        );
      })
      .catch((error: unknown) => {
        if (signal.aborted) {
          return;
        }
        let message = "Something went wrong";
        if (error instanceof ChatbotError) {
          message = error.message;
        } else if (error instanceof Error) {
          message = error.message;
        }
        setColumns((prev) =>
          prev.map((col, i) =>
            i === variantIndex
              ? { ...col, status: "error" as const, errorMessage: message }
              : col
          )
        );
      })
  );

  return Promise.all(runners).then(() => undefined);
}

import { geolocation, ipAddress } from "@vercel/functions";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
} from "ai";
import { checkBotId } from "botid/server";
import {
  allowedModelIds,
  DEFAULT_CHAT_MODEL,
  getCapabilities,
} from "@/lib/ai/models";
import { compareSystemPrompt, type RequestHints } from "@/lib/ai/prompts";
import { getLanguageModel } from "@/lib/ai/providers";
import { isProductionEnvironment } from "@/lib/constants";
import { ChatbotError } from "@/lib/errors";
import { checkIpRateLimit } from "@/lib/ratelimit";
import type { ChatMessage } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import {
  type PromptCompareRequestBody,
  promptCompareRequestSchema,
} from "./schema";

export const maxDuration = 60;

export async function POST(request: Request) {
  let requestBody: PromptCompareRequestBody;

  try {
    const json = await request.json();
    requestBody = promptCompareRequestSchema.parse(json);
  } catch (_) {
    return new ChatbotError("bad_request:api").toResponse();
  }

  try {
    const {
      messages,
      selectedChatModel,
      variantIndex,
      scenarioIndex,
      compareLab,
    } = requestBody;

    await checkBotId().catch(() => null);

    const chatModel = allowedModelIds.has(selectedChatModel)
      ? selectedChatModel
      : DEFAULT_CHAT_MODEL;

    await checkIpRateLimit(ipAddress(request));

    if (!process.env.OPENAI_API_KEY) {
      return new ChatbotError("offline:chat").toResponse();
    }

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    const modelCapabilities = getCapabilities();
    const capabilities = modelCapabilities[chatModel];
    const isReasoningModel = capabilities?.reasoning === true;

    const uiMessages = messages as ChatMessage[];
    const modelMessages = await convertToModelMessages(uiMessages);

    const stream = createUIMessageStream({
      execute: ({ writer: dataStream }) => {
        const result = streamText({
          model: getLanguageModel(chatModel),
          system: compareSystemPrompt({
            variantIndex,
            scenarioIndex,
            requestHints,
            compareLab,
          }),
          messages: modelMessages,
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: "stream-text-prompt-compare",
          },
        });

        dataStream.merge(
          result.toUIMessageStream({ sendReasoning: isReasoningModel })
        );
      },
      generateId: generateUUID,
      onError: () => "Oops, an error occurred!",
    });

    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    const vercelId = request.headers.get("x-vercel-id");

    if (error instanceof ChatbotError) {
      return error.toResponse();
    }

    console.error("Unhandled error in prompt-compare API:", error, {
      vercelId,
    });
    return new ChatbotError("offline:chat").toResponse();
  }
}

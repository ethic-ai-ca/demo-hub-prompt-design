import { geolocation, ipAddress } from "@vercel/functions";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { checkBotId } from "botid/server";
import {
  allowedModelIds,
  DEFAULT_CHAT_MODEL,
  getCapabilities,
} from "@/lib/ai/models";
import { type RequestHints, systemPrompt } from "@/lib/ai/prompts";
import { getLanguageModel } from "@/lib/ai/providers";
import { createDocument } from "@/lib/ai/tools/create-document";
import { editDocument } from "@/lib/ai/tools/edit-document";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { isEphemeralChatMode, isProductionEnvironment } from "@/lib/constants";
import { ChatbotError } from "@/lib/errors";
import { anonymousToolSession } from "@/lib/tool-session";
import { checkIpRateLimit } from "@/lib/ratelimit";
import type { ChatMessage } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";
import { type PostRequestBody, postRequestBodySchema } from "./schema";

export const maxDuration = 60;

function hasToolApprovalContinuation(messages: ChatMessage[]): boolean {
  const last = messages.at(-1);
  if (last && last.role !== "user") {
    return true;
  }
  return messages.some((msg) =>
    msg.parts?.some((part) => {
      const state = (part as { state?: string }).state;
      return state === "approval-responded" || state === "output-denied";
    })
  );
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatbotError("bad_request:api").toResponse();
  }

  try {
    const { id, messages, selectedChatModel } = requestBody;

    await checkBotId().catch(() => null);

    const session = anonymousToolSession;

    const chatModel = allowedModelIds.has(selectedChatModel)
      ? selectedChatModel
      : DEFAULT_CHAT_MODEL;

    await checkIpRateLimit(ipAddress(request));

    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set");
      return new ChatbotError("offline:chat").toResponse();
    }

    const isToolApprovalFlow = hasToolApprovalContinuation(
      messages as ChatMessage[]
    );

    const uiMessages = messages as ChatMessage[];

    let titlePromise: Promise<string> | null = null;
    if (
      messages.length === 1 &&
      messages[0].role === "user" &&
      !isToolApprovalFlow
    ) {
      titlePromise = generateTitleFromUserMessage({
        message: messages[0] as UIMessage,
      });
    }

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    const modelCapabilities = await getCapabilities();
    const capabilities = modelCapabilities[chatModel];
    const isReasoningModel = capabilities?.reasoning === true;
    const supportsTools = capabilities?.tools === true;

    const modelMessages = await convertToModelMessages(uiMessages);

    const ephemeralToolsOnly = isEphemeralChatMode;

    const stream = createUIMessageStream({
      originalMessages: isToolApprovalFlow ? uiMessages : undefined,
      execute: async ({ writer: dataStream }) => {
        const result = streamText({
          model: getLanguageModel(chatModel),
          system: systemPrompt({ requestHints, supportsTools }),
          messages: modelMessages,
          stopWhen: stepCountIs(5),
          experimental_activeTools:
            isReasoningModel && !supportsTools
              ? []
              : ephemeralToolsOnly
                ? ["getWeather", "createDocument"]
                : [
                    "getWeather",
                    "createDocument",
                    "editDocument",
                    "updateDocument",
                    "requestSuggestions",
                  ],
          tools: ephemeralToolsOnly
            ? {
                getWeather,
                createDocument: createDocument({
                  session,
                  dataStream,
                  modelId: chatModel,
                }),
              }
            : {
                getWeather,
                createDocument: createDocument({
                  session,
                  dataStream,
                  modelId: chatModel,
                }),
                editDocument: editDocument({ dataStream, session }),
                updateDocument: updateDocument({
                  session,
                  dataStream,
                  modelId: chatModel,
                }),
                requestSuggestions: requestSuggestions({
                  session,
                  dataStream,
                  modelId: chatModel,
                }),
              },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: "stream-text",
          },
        });

        dataStream.merge(
          result.toUIMessageStream({ sendReasoning: isReasoningModel })
        );

        if (titlePromise) {
          const title = await titlePromise;
          dataStream.write({ type: "data-chat-title", data: title });
        }
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

    console.error("Unhandled error in chat API:", error, { vercelId });
    return new ChatbotError("offline:chat").toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatbotError("bad_request:api").toResponse();
  }

  return Response.json({ id }, { status: 200 });
}

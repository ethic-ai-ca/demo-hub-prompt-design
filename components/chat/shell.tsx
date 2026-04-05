"use client";

import { usePathname, useSelectedLayoutSegment } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useActiveChat } from "@/hooks/use-active-chat";
import {
  initialArtifactData,
  useArtifact,
  useArtifactSelector,
} from "@/hooks/use-artifact";
import {
  type PromptCompareColumnState,
  runPromptCompareVariants,
} from "@/lib/ai/prompt-compare-client";
import type { CompareLab } from "@/lib/ai/prompts";
import {
  pathnameToCompareLab,
  persistCompareLabForNavigation,
} from "@/lib/chat-home-path";
import {
  CHAT_STARTER_SUGGESTIONS,
  GC_HOME_PATH,
  GC_STARTER_SUGGESTIONS,
  PI_HOME_PATH,
} from "@/lib/constants";
import type { Attachment, ChatMessage } from "@/lib/types";
import { cn, generateUUID } from "@/lib/utils";
import { Artifact } from "./artifact";
import { ChatHeader } from "./chat-header";
import { useOptionalCompareLabFromRoute } from "./compare-lab-route-context";
import { DataStreamHandler } from "./data-stream-handler";
import { submitEditedMessage } from "./message-editor";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";
import { buildInitialCompareColumns } from "./prompt-compare-grid";

export function ChatShell() {
  const pathname = usePathname();
  const selectedSegment = useSelectedLayoutSegment();
  const labFromRoute = useOptionalCompareLabFromRoute();
  const routeCompareLab =
    selectedSegment === "gc" ? "gc" : selectedSegment === "pi" ? "pi" : null;
  const compareLab =
    routeCompareLab ?? labFromRoute ?? pathnameToCompareLab(pathname);

  useEffect(() => {
    if (pathname === PI_HOME_PATH) {
      persistCompareLabForNavigation("pi");
    } else if (pathname === GC_HOME_PATH) {
      persistCompareLabForNavigation("gc");
    }
  }, [pathname]);

  const starterSuggestions =
    compareLab === "gc" ? GC_STARTER_SUGGESTIONS : CHAT_STARTER_SUGGESTIONS;

  const {
    chatId,
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    addToolApprovalResponse,
    input,
    setInput,
    visibilityType,
    isReadonly,
    isLoading,
    votes,
    currentModelId,
  } = useActiveChat();

  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(
    null
  );
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [promptCompareSession, setPromptCompareSession] = useState<null | {
    id: string;
    requestMessages: ChatMessage[];
    modelId: string;
    scenarioIndex: number;
    compareLab: CompareLab;
  }>(null);
  const [promptCompareColumns, setPromptCompareColumns] = useState<
    PromptCompareColumnState[]
  >([]);
  const [isPromptCompareStreaming, setIsPromptCompareStreaming] =
    useState(false);
  const shouldHidePromptInput =
    routeCompareLab === "pi" || promptCompareSession?.compareLab === "pi";
  const compareAbortRef = useRef<AbortController | null>(null);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);
  const { setArtifact } = useArtifact();

  const clearPromptCompare = useCallback(() => {
    compareAbortRef.current?.abort();
    compareAbortRef.current = null;
    setPromptCompareSession(null);
    setPromptCompareColumns([]);
    setIsPromptCompareStreaming(false);
  }, []);

  const startPromptCompare = useCallback(
    (text: string, scenarioIndex: number) => {
      persistCompareLabForNavigation(compareLab);
      window.history.pushState(
        {},
        "",
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/chat/${chatId}`
      );
      const userMsg: ChatMessage = {
        id: generateUUID(),
        role: "user",
        parts: [{ type: "text", text }],
      };
      setMessages([userMsg]);
      setPromptCompareColumns(
        buildInitialCompareColumns(scenarioIndex, compareLab)
      );
      setPromptCompareSession({
        id: generateUUID(),
        requestMessages: [userMsg],
        modelId: currentModelId,
        scenarioIndex,
        compareLab,
      });
    },
    [chatId, compareLab, currentModelId, setMessages]
  );

  useEffect(() => {
    if (!promptCompareSession) {
      return;
    }
    const ac = new AbortController();
    compareAbortRef.current = ac;
    setIsPromptCompareStreaming(true);
    const {
      requestMessages,
      modelId,
      scenarioIndex,
      compareLab: sessionLab,
    } = promptCompareSession;

    const compareRun = runPromptCompareVariants({
      chatId,
      messages: requestMessages,
      modelId,
      scenarioIndex,
      compareLab: sessionLab,
      visibilityType,
      signal: ac.signal,
      setColumns: setPromptCompareColumns,
    });
    compareRun.finally(() => {
      if (compareAbortRef.current === ac) {
        compareAbortRef.current = null;
      }
      setIsPromptCompareStreaming(false);
    });

    return () => {
      ac.abort();
    };
  }, [promptCompareSession, chatId, visibilityType]);

  const combinedStop = useCallback(async () => {
    compareAbortRef.current?.abort();
    compareAbortRef.current = null;
    setIsPromptCompareStreaming(false);
    await stop();
  }, [stop]);

  const stopRef = useRef(stop);
  stopRef.current = combinedStop;

  const clearPromptCompareRef = useRef(clearPromptCompare);
  clearPromptCompareRef.current = clearPromptCompare;

  const prevChatIdRef = useRef(chatId);
  useEffect(() => {
    if (prevChatIdRef.current !== chatId) {
      prevChatIdRef.current = chatId;
      stopRef.current();
      clearPromptCompareRef.current();
      setArtifact(initialArtifactData);
      setEditingMessage(null);
      setAttachments([]);
    }
  }, [chatId, setArtifact]);

  return (
    <>
      <div className="flex h-dvh w-full flex-row overflow-hidden">
        <div
          className={cn(
            "flex min-w-0 flex-col bg-sidebar transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
            isArtifactVisible ? "w-[40%]" : "w-full"
          )}
        >
          <ChatHeader
            chatId={chatId}
            isReadonly={isReadonly}
            selectedVisibilityType={visibilityType}
          />

          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background md:rounded-tl-[12px]">
            <Messages
              addToolApprovalResponse={addToolApprovalResponse}
              chatId={chatId}
              compareLab={compareLab}
              isArtifactVisible={isArtifactVisible}
              isLoading={isLoading}
              isReadonly={isReadonly}
              messages={messages}
              onEditMessage={(msg) => {
                const text = msg.parts
                  ?.filter((p) => p.type === "text")
                  .map((p) => p.text)
                  .join("");
                setInput(text ?? "");
                setEditingMessage(msg);
              }}
              promptCompareColumns={
                promptCompareColumns.length > 0
                  ? promptCompareColumns
                  : undefined
              }
              regenerate={regenerate}
              selectedModelId={currentModelId}
              setMessages={setMessages}
              status={status}
              votes={votes}
            />

            <div className="sticky bottom-0 z-1 mx-auto flex w-full max-w-4xl gap-2 border-t-0 bg-background px-2 pb-3 md:px-4 md:pb-4">
              {!isReadonly && (
                <MultimodalInput
                  attachments={attachments}
                  chatId={chatId}
                  editingMessage={editingMessage}
                  hidePromptInput={shouldHidePromptInput}
                  input={input}
                  isLoading={isLoading}
                  isPromptCompareStreaming={isPromptCompareStreaming}
                  messages={messages}
                  onCancelEdit={() => {
                    setEditingMessage(null);
                    setInput("");
                  }}
                  onClearPromptCompare={clearPromptCompare}
                  onSelectSuggestedForPromptCompare={startPromptCompare}
                  selectedVisibilityType={visibilityType}
                  sendMessage={
                    editingMessage
                      ? async () => {
                          const msg = editingMessage;
                          setEditingMessage(null);
                          await submitEditedMessage({
                            message: msg,
                            text: input,
                            setMessages,
                            regenerate,
                          });
                          setInput("");
                        }
                      : sendMessage
                  }
                  setAttachments={setAttachments}
                  setInput={setInput}
                  setMessages={setMessages}
                  starterSuggestions={starterSuggestions}
                  status={status}
                  stop={combinedStop}
                />
              )}
            </div>
          </div>
        </div>

        <Artifact
          addToolApprovalResponse={addToolApprovalResponse}
          attachments={attachments}
          chatId={chatId}
          input={input}
          isReadonly={isReadonly}
          messages={messages}
          regenerate={regenerate}
          selectedModelId={currentModelId}
          selectedVisibilityType={visibilityType}
          sendMessage={sendMessage}
          setAttachments={setAttachments}
          setInput={setInput}
          setMessages={setMessages}
          status={status}
          stop={combinedStop}
          votes={votes}
        />
      </div>

      <DataStreamHandler />
    </>
  );
}

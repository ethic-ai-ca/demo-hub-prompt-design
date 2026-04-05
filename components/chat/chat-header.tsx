"use client";

import { PenSquareIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { getChatHomePathForPathname } from "@/lib/chat-home-path";
import { isEphemeralChatMode } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { VisibilitySelector, type VisibilityType } from "./visibility-selector";

function PureChatHeader({
  chatId,
  selectedVisibilityType,
  isReadonly,
}: {
  chatId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { state, isMobile, setOpenMobile } = useSidebar();

  const hideOnCollapsedDesktop = state === "collapsed" && !isMobile;

  return (
    <header
      className={cn(
        "sticky top-0 flex h-14 items-center gap-2 bg-sidebar px-3",
        hideOnCollapsedDesktop && "hidden"
      )}
    >
      <Button
        aria-label="New chat"
        className="size-8"
        onClick={() => {
          setOpenMobile(false);
          router.push(getChatHomePathForPathname(pathname));
        }}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <PenSquareIcon className="size-4" />
      </Button>

      {!isReadonly && !isEphemeralChatMode && (
        <VisibilitySelector
          chatId={chatId}
          selectedVisibilityType={selectedVisibilityType}
        />
      )}
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return (
    prevProps.chatId === nextProps.chatId &&
    prevProps.selectedVisibilityType === nextProps.selectedVisibilityType &&
    prevProps.isReadonly === nextProps.isReadonly
  );
});

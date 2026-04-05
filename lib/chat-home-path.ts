import type { CompareLab } from "@/lib/ai/prompts";
import { GC_HOME_PATH, PI_HOME_PATH } from "@/lib/constants";

const STORAGE_KEY = "ethicai-compare-lab";

export function persistCompareLabForNavigation(lab: CompareLab): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.setItem(STORAGE_KEY, lab);
}

export function getChatHomePathForPathname(pathname: string | null): string {
  if (!pathname) {
    return PI_HOME_PATH;
  }
  if (pathname === GC_HOME_PATH || pathname.startsWith(`${GC_HOME_PATH}/`)) {
    return GC_HOME_PATH;
  }
  if (pathname.startsWith("/chat/") && typeof window !== "undefined") {
    const lab = sessionStorage.getItem(STORAGE_KEY);
    if (lab === "gc") {
      return GC_HOME_PATH;
    }
  }
  return PI_HOME_PATH;
}

/**
 * Lab for UI tied to the URL only (SSR-safe). Do not read sessionStorage here —
 * that diverges server vs client and causes hydration mismatches.
 * For "New chat" targets after `/chat/...`, use `getChatHomePathForPathname`.
 */
export function pathnameToCompareLab(pathname: string | null): CompareLab {
  if (!pathname) {
    return "pi";
  }
  if (pathname === GC_HOME_PATH || pathname.startsWith(`${GC_HOME_PATH}/`)) {
    return "gc";
  }
  if (pathname === PI_HOME_PATH || pathname.startsWith(`${PI_HOME_PATH}/`)) {
    return "pi";
  }
  return "pi";
}

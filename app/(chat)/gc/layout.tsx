import type { ReactNode } from "react";
import { CompareLabRouteProvider } from "@/components/chat/compare-lab-route-context";

export default function GcLabLayout({ children }: { children: ReactNode }) {
  return <CompareLabRouteProvider lab="gc">{children}</CompareLabRouteProvider>;
}

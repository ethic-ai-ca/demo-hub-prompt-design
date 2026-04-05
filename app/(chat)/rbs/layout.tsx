import type { ReactNode } from "react";
import { CompareLabRouteProvider } from "@/components/chat/compare-lab-route-context";

export default function RbsLabLayout({ children }: { children: ReactNode }) {
  return <CompareLabRouteProvider lab="rbs">{children}</CompareLabRouteProvider>;
}

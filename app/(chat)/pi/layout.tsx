import type { ReactNode } from "react";
import { CompareLabRouteProvider } from "@/components/chat/compare-lab-route-context";

export default function PiLabLayout({ children }: { children: ReactNode }) {
  return <CompareLabRouteProvider lab="pi">{children}</CompareLabRouteProvider>;
}

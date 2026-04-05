"use client";

import { createContext, useContext } from "react";
import type { CompareLab } from "@/lib/ai/prompts";

const CompareLabRouteContext = createContext<CompareLab | null>(null);

export function CompareLabRouteProvider({
  lab,
  children,
}: {
  lab: CompareLab;
  children: React.ReactNode;
}) {
  return (
    <CompareLabRouteContext.Provider value={lab}>
      {children}
    </CompareLabRouteContext.Provider>
  );
}

export function useOptionalCompareLabFromRoute(): CompareLab | null {
  return useContext(CompareLabRouteContext);
}

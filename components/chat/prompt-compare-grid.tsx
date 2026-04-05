"use client";

import { ChevronDownIcon } from "lucide-react";
import { MessageResponse } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { PromptCompareColumnState } from "@/lib/ai/prompt-compare-client";
import {
  type CompareLab,
  getPromptCompareVariantsForScenario,
} from "@/lib/ai/prompts";
import { cn } from "@/lib/utils";

type PromptCompareGridProps = {
  columns: PromptCompareColumnState[];
};

export function PromptCompareGrid({ columns }: PromptCompareGridProps) {
  return (
    <div
      className="mt-4 w-full border-t border-border/40 pt-4"
      data-testid="prompt-compare-grid"
    >
      <p className="mb-3 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        Same question, three system prompts
      </p>
      <div className="grid min-h-0 w-full gap-2 md:grid-cols-3 md:gap-3">
        {columns.map((col) => {
          const scenarioVariants = getPromptCompareVariantsForScenario(
            col.scenarioIndex,
            col.compareLab
          );
          const variant = scenarioVariants[col.variantIndex];
          const systemText = variant?.system ?? "";
          return (
            <div
              className="flex min-h-[180px] min-w-0 flex-col rounded-xl border border-border/40 bg-card/40 shadow-[var(--shadow-card)]"
              key={col.variantIndex}
            >
              <div className="border-b border-border/30 bg-muted/30 px-3 py-2.5">
                <h3 className="text-[13px] font-semibold text-foreground">
                  {col.label}
                </h3>
                <Collapsible className="group mt-2 w-full">
                  <CollapsibleTrigger
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-md border border-border/40 bg-background/60 px-2 py-1.5 text-left text-[11px] font-medium text-muted-foreground outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring"
                    )}
                    type="button"
                  >
                    <span className="font-mono text-[10px] tracking-tight">
                      systemPrompt
                    </span>
                    <ChevronDownIcon
                      aria-hidden
                      className="size-3.5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent
                    className={cn(
                      "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1 overflow-hidden outline-none data-[state=closed]:animate-out data-[state=open]:animate-in"
                    )}
                  >
                    <pre className="mt-2 max-h-[200px] overflow-y-auto whitespace-pre-wrap rounded-md border border-border/30 bg-background/80 p-2 font-mono text-[10px] leading-relaxed text-foreground">
                      {systemText}
                    </pre>
                  </CollapsibleContent>
                </Collapsible>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
                {col.status === "error" && (
                  <p className="text-[12px] text-destructive">
                    {col.errorMessage ?? "Request failed"}
                  </p>
                )}
                {(col.status === "pending" || col.status === "streaming") &&
                  col.text.length === 0 && (
                    <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                      <Shimmer duration={1.2}>Thinking</Shimmer>
                    </div>
                  )}
                {col.text.length > 0 && (
                  <MessageResponse className="text-[13px] leading-[1.65] text-foreground">
                    {col.text}
                  </MessageResponse>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function buildInitialCompareColumns(
  scenarioIndex: number,
  compareLab: CompareLab
): PromptCompareColumnState[] {
  const variants = getPromptCompareVariantsForScenario(
    scenarioIndex,
    compareLab
  );
  return variants.map((v, variantIndex) => ({
    variantIndex,
    scenarioIndex,
    compareLab,
    label: v.label,
    text: "",
    status: "pending" as const,
  }));
}

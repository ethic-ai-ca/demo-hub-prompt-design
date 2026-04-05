import { z } from "zod";
import {
  GC_PROMPT_COMPARE_SCENARIO_COUNT,
  PROMPT_COMPARE_SCENARIO_COUNT,
} from "@/lib/ai/prompts";

const uiMessageSchema = z.object({
  id: z.string(),
  role: z.string(),
  parts: z.array(z.unknown()),
});

export const promptCompareRequestSchema = z
  .object({
    id: z.string().uuid(),
    messages: z.array(uiMessageSchema).min(1),
    selectedChatModel: z.string(),
    selectedVisibilityType: z.enum(["public", "private"]),
    variantIndex: z.number().int().min(0).max(2),
    scenarioIndex: z.number().int().min(0),
    compareLab: z.enum(["pi", "gc"]).default("pi"),
  })
  .superRefine((data, ctx) => {
    const max =
      data.compareLab === "gc"
        ? GC_PROMPT_COMPARE_SCENARIO_COUNT - 1
        : PROMPT_COMPARE_SCENARIO_COUNT - 1;
    if (data.scenarioIndex > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "scenarioIndex out of range for compareLab",
        path: ["scenarioIndex"],
      });
    }
  });

export type PromptCompareRequestBody = z.infer<
  typeof promptCompareRequestSchema
>;

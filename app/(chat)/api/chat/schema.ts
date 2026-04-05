import { z } from "zod";

const uiMessageSchema = z.object({
  id: z.string(),
  role: z.string(),
  parts: z.array(z.unknown()),
});

export const postRequestBodySchema = z.object({
  id: z.string().uuid(),
  messages: z.array(uiMessageSchema).min(1),
  selectedChatModel: z.string(),
  selectedVisibilityType: z.enum(["public", "private"]),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;

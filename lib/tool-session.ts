import { ANONYMOUS_USER_ID } from "@/lib/constants";

export type ToolSessionUser = {
  id: string;
  type: "guest";
  email?: string | null;
  name?: string | null;
};

export type ToolSession = {
  user: ToolSessionUser;
  expires: string;
};

export const anonymousToolSession: ToolSession = {
  user: {
    id: ANONYMOUS_USER_ID,
    type: "guest",
    email: null,
    name: null,
  },
  expires: new Date(Date.now() + 86_400_000).toISOString(),
};

import type { NextRequest } from "next/server";
import { ChatbotError } from "@/lib/errors";

export function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const startingAfter = searchParams.get("starting_after");
  const endingBefore = searchParams.get("ending_before");

  if (startingAfter && endingBefore) {
    return new ChatbotError(
      "bad_request:api",
      "Only one of starting_after or ending_before can be provided."
    ).toResponse();
  }

  return Response.json({ chats: [], hasMore: false });
}

export function DELETE() {
  return Response.json({ ok: true }, { status: 200 });
}

import { NextRequest } from "next/server";

export function isAuthorizedAgentRequest(request: NextRequest) {
  const token = process.env.AGENT_API_TOKEN;

  if (!token) {
    return false;
  }

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${token}`;
}

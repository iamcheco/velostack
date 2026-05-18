import { NextResponse } from "next/server";

export async function GET() {
  const clientId     = process.env.STRAVA_CLIENT_ID;
  const baseUrl      = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const redirectUri  = `${baseUrl}/api/strava/callback`;
  const scope        = "activity:read";

  if (!clientId) {
    return NextResponse.json({ error: "STRAVA_CLIENT_ID not configured" }, { status: 500 });
  }

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: "code",
    approval_prompt: "auto",
    scope,
  });

  return NextResponse.redirect(`https://www.strava.com/oauth/authorize?${params.toString()}`);
}

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { accessToken, refreshToken, expiresAt, page = 1, perPage = 30 } = await req.json();

    if (!accessToken) {
      return NextResponse.json({ error: "accessToken required" }, { status: 400 });
    }

    // Refresh token if expired
    let token = accessToken;
    if (Date.now() / 1000 > expiresAt - 60) {
      const refreshRes = await fetch("https://www.strava.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id:     process.env.STRAVA_CLIENT_ID,
          client_secret: process.env.STRAVA_CLIENT_SECRET,
          grant_type:    "refresh_token",
          refresh_token: refreshToken,
        }),
      });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        token = refreshData.access_token;
      }
    }

    const activitiesRes = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?page=${page}&per_page=${perPage}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!activitiesRes.ok) {
      throw new Error(`Strava API error: ${activitiesRes.statusText}`);
    }

    const activities = await activitiesRes.json();

    // Map Strava activity fields to what the UI needs
    const mapped = activities
      .filter((a: any) => ["Ride", "GravelRide", "MountainBikeRide", "EBikeRide", "VirtualRide"].includes(a.sport_type))
      .map((a: any) => ({
        id:             a.id,
        name:           a.name,
        date:           a.start_date.slice(0, 10),
        distanceKm:     Math.round((a.distance / 1000) * 10) / 10,
        elevationM:     Math.round(a.total_elevation_gain),
        terrain:        mapTerrain(a.sport_type),
        effort:         mapEffort(a.suffer_score),
        sufferScore:    a.suffer_score,
        averageWatts:   a.average_watts ?? null,
      }));

    return NextResponse.json({ activities: mapped });
  } catch (err: any) {
    console.error("strava/activities error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function mapTerrain(sportType: string): "road" | "gravel" | "trail" {
  if (sportType === "MountainBikeRide") return "trail";
  if (sportType === "GravelRide")       return "gravel";
  return "road";
}

function mapEffort(sufferScore: number | null): "easy" | "moderate" | "hard" {
  if (sufferScore == null) return "moderate";
  if (sufferScore < 30)    return "easy";
  if (sufferScore < 80)    return "moderate";
  return "hard";
}

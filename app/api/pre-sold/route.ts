import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  readListings,
  readReservations,
  upsertListing,
  createReservation,
  updateReservationStatus,
} from "@/lib/pre-sold";

const upgradeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  buyerPrice: z.number().nonnegative(),
  flipperCost: z.number().nonnegative(),
});

const listingSchema = z.object({
  bikeId: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["road", "gravel", "mtb", "city", "ebike"]),
  description: z.string().min(1),
  targetBasePrice: z.number().nonnegative(),
  estimatedCompletionDate: z.string().min(1),
  upgrades: z.array(upgradeSchema),
  publishedAt: z.string().optional(),
});

const reservationSchema = z.object({
  bikeId: z.string().min(1),
  buyerName: z.string().min(1),
  buyerEmail: z.string().email(),
  buyerPhone: z.string().min(5),
  selectedUpgradeIds: z.array(z.string()),
  totalPrice: z.string().min(1),
  status: z.enum(["pending_deposit", "deposit_confirmed", "completed", "cancelled"]),
  createdAt: z.string().min(1),
  notes: z.string().optional(),
});

const updateStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["pending_deposit", "deposit_confirmed", "completed", "cancelled"]),
});

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  if (action === "listings") {
    const listings = await readListings();
    return NextResponse.json({ listings });
  }

  if (action === "reservations") {
    const bikeId = url.searchParams.get("bikeId");
    if (!bikeId) {
      return NextResponse.json({ error: "bikeId is required" }, { status: 400 });
    }
    const reservations = await readReservations();
    const bikeReservations = reservations.filter((reservation) => reservation.bikeId === bikeId);
    return NextResponse.json({ reservations: bikeReservations });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const action = (payload.action as string) || "";

  if (action === "publish") {
    const result = listingSchema.safeParse(payload.listing);
    if (!result.success) {
      return NextResponse.json({ error: result.error.format() }, { status: 400 });
    }
    const savedListing = await upsertListing({
      ...result.data,
      publishedAt: result.data.publishedAt || new Date().toISOString(),
    });
    return NextResponse.json({ listing: savedListing });
  }

  if (action === "reserve") {
    const result = reservationSchema.safeParse(payload.reservation);
    if (!result.success) {
      return NextResponse.json({ error: result.error.format() }, { status: 400 });
    }
    const reservation = await createReservation(result.data);
    return NextResponse.json({ reservation });
  }

  if (action === "update-status") {
    const result = updateStatusSchema.safeParse(payload);
    if (!result.success) {
      return NextResponse.json({ error: result.error.format() }, { status: 400 });
    }
    const updated = await updateReservationStatus(result.data.id, result.data.status);
    if (!updated) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }
    return NextResponse.json({ reservation: updated });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}

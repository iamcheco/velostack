import fs from "node:fs/promises";
import path from "node:path";
import { BikeType } from "./tracker-types";

const SCRATCH_DIR = path.join(process.cwd(), "scratch");
const LISTINGS_FILE = path.join(SCRATCH_DIR, "pre_sold_listings.json");
const RESERVATIONS_FILE = path.join(SCRATCH_DIR, "pre_sold_reservations.json");

export interface UpgradeOption {
  id: string;
  name: string;
  category: string;
  buyerPrice: number;
  flipperCost: number;
}

export interface ComingSoonListing {
  bikeId: string;
  name: string;
  type: BikeType;
  description: string;
  targetBasePrice: number;
  estimatedCompletionDate: string;
  upgrades: UpgradeOption[];
  publishedAt: string;
}

export interface BuyerReservation {
  id: string;
  bikeId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  selectedUpgradeIds: string[];
  totalPrice: string;
  status: "pending_deposit" | "deposit_confirmed" | "completed" | "cancelled";
  createdAt: string;
  notes?: string;
}

async function ensureScratchFolder() {
  await fs.mkdir(SCRATCH_DIR, { recursive: true });
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    await ensureScratchFolder();
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(filePath: string, payload: T) {
  await ensureScratchFolder();
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
}

export async function readListings(): Promise<ComingSoonListing[]> {
  return readJson<ComingSoonListing[]>(LISTINGS_FILE, []);
}

export async function writeListings(listings: ComingSoonListing[]) {
  return writeJson(LISTINGS_FILE, listings);
}

export async function readReservations(): Promise<BuyerReservation[]> {
  return readJson<BuyerReservation[]>(RESERVATIONS_FILE, []);
}

export async function writeReservations(reservations: BuyerReservation[]) {
  return writeJson(RESERVATIONS_FILE, reservations);
}

export async function upsertListing(listing: ComingSoonListing): Promise<ComingSoonListing> {
  const listings = await readListings();
  const now = new Date().toISOString();
  const existingIndex = listings.findIndex(item => item.bikeId === listing.bikeId);
  const savedListing: ComingSoonListing = {
    ...listing,
    publishedAt: listing.publishedAt || now,
  };

  if (existingIndex >= 0) {
    listings[existingIndex] = savedListing;
  } else {
    listings.unshift(savedListing);
  }

  await writeListings(listings);
  return savedListing;
}

export async function createReservation(reservation: Omit<BuyerReservation, "id">): Promise<BuyerReservation> {
  const reservations = await readReservations();
  const newReservation: BuyerReservation = {
    ...reservation,
    id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  };
  reservations.unshift(newReservation);
  await writeReservations(reservations);
  return newReservation;
}

export async function updateReservationStatus(id: string, status: BuyerReservation["status"]): Promise<BuyerReservation | null> {
  const reservations = await readReservations();
  const index = reservations.findIndex((reservation) => reservation.id === id);
  if (index < 0) return null;
  reservations[index] = { ...reservations[index], status };
  await writeReservations(reservations);
  return reservations[index];
}

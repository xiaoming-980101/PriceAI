import { enqueueOfficialPriceCollectionJob } from "@/lib/official-price-jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return enqueueOfficialPriceCollectionJob(request, "weekly_full");
}

export async function POST(request: Request) {
  return enqueueOfficialPriceCollectionJob(request, "weekly_full");
}

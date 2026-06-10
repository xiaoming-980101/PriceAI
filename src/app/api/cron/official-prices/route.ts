import { enqueueOfficialPriceCollectionJob, officialModeFromRequest } from "@/lib/official-price-jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return enqueueOfficialPriceCollectionJob(request, officialModeFromRequest(request));
}

export async function POST(request: Request) {
  return enqueueOfficialPriceCollectionJob(request, officialModeFromRequest(request));
}

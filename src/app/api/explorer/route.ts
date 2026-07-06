import { NextRequest, NextResponse } from "next/server";
import { publicPriceApiErrorResponse } from "@/lib/api-errors";
import { priceDataCacheHeadersForResult } from "@/lib/cache-headers";
import { getExplorerData } from "@/lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const result = await getExplorerData({
      delivery: request.nextUrl.searchParams.get("delivery"),
    });

    return NextResponse.json(result, {
      headers: priceDataCacheHeadersForResult(result),
    });
  } catch (error) {
    return publicPriceApiErrorResponse("public explorer API", error);
  }
}

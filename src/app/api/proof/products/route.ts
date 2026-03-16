import {
  buildInstrumentsUrl,
  buildProductsUrl,
  normalizeInstruments,
  normalizeProducts,
} from "@/lib/abaxx";

export async function GET() {
  const sourceUrl = buildProductsUrl();

  try {
    const response = await fetch(sourceUrl, {
      headers: {
        accept: "application/json",
        "user-agent": "abaxx-dashboard-proof/0.1",
      },
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") ?? "";
    const rawBody = await response.text();

    let normalizedCount = 0;
    let firstProduct: string | null = null;
    let firstProductInstruments = 0;

    if (response.ok && contentType.includes("application/json")) {
      try {
        const normalized = normalizeProducts(JSON.parse(rawBody));
        normalizedCount = normalized.length;
        firstProduct = normalized[0]?.id ?? null;

        if (firstProduct) {
          const instrumentsResponse = await fetch(buildInstrumentsUrl(firstProduct), {
            headers: {
              accept: "application/json",
              "user-agent": "abaxx-dashboard-proof/0.1",
            },
            cache: "no-store",
          });

          if (instrumentsResponse.ok) {
            const instrumentsPayload = await instrumentsResponse.json();
            firstProductInstruments = normalizeInstruments(instrumentsPayload).length;
          }
        }
      } catch {
        normalizedCount = 0;
      }
    }

    return Response.json(
      {
        ok: response.ok,
        status: response.status,
        sourceUrl,
        contentType,
        normalizedCount,
        firstProduct,
        firstProductInstruments,
        bodyPreview: rawBody.slice(0, 400),
      },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown server-side request failure";

    return Response.json(
      {
        ok: false,
        status: null,
        sourceUrl,
        contentType: null,
        normalizedCount: 0,
        firstProduct: null,
        firstProductInstruments: 0,
        bodyPreview: null,
        error: message,
      },
      { status: 200 },
    );
  }
}

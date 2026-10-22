import { NextResponse } from "next/server";
import { mediaKitChannels } from "@/content/desktop";

/**
 * Media kit numbers, straight from Buffer.
 *
 * Needs BUFFER_ACCESS_TOKEN and BUFFER_ORGANIZATION_ID in the environment.
 * Without them the route returns a labelled snapshot so the page still renders.
 * Buffer's API exposes aggregated post metrics, not follower totals, so the
 * follower line in the media kit is kept by hand in content/folders/work-with-me.ts.
 */

export const revalidate = 3600; // one hour is plenty; brands don't need it live to the minute

const BUFFER_API_URL = process.env.BUFFER_API_URL ?? "https://api.buffer.com";
const DAYS = 30;

type Metric = { type: string; name: string; unit: "count" | "percentage"; value: number; description: string };

export type StatsPayload = {
  sample: boolean;
  windowDays: number;
  updatedAt: string | null;
  totals: Metric[];
  channels: { bufferChannelId: string; metrics: Metric[] }[];
};

const QUERY = `
  query MediaKit($input: AggregatedPostMetricsInput!) {
    aggregatedPostMetrics(input: $input) {
      metricsUpdatedAt
      metrics { name type unit value description }
    }
  }
`;

// Snapshot taken 22 Sep 2026 from the live API, used when no token is configured.
const SNAPSHOT: StatsPayload = {
  sample: true,
  windowDays: DAYS,
  updatedAt: "2026-09-22T13:56:26.355Z",
  totals: [
    { name: "Posts", type: "postCount", unit: "count", value: 93, description: "Number of posts published" },
    { name: "Reach", type: "reach", unit: "count", value: 49702, description: "How many unique people saw a post." },
    { name: "Reactions", type: "reactions", unit: "count", value: 3304, description: "Likes and reactions." },
    { name: "Comments", type: "comments", unit: "count", value: 232, description: "Comments received." },
    { name: "Shares", type: "shares", unit: "count", value: 185, description: "Times a post was shared." },
  ],
  channels: [],
};

async function aggregate(token: string, orgId: string, channelIds?: string[]) {
  const end = new Date();
  const start = new Date(end.getTime() - DAYS * 24 * 60 * 60 * 1000);
  const res = await fetch(BUFFER_API_URL, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({
      query: QUERY,
      variables: {
        input: {
          organizationId: orgId,
          startDateTime: start.toISOString(),
          endDateTime: end.toISOString(),
          ...(channelIds ? { channelIds } : {}),
        },
      },
    }),
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`Buffer API ${res.status}`);
  const json = (await res.json()) as {
    data?: { aggregatedPostMetrics?: { metricsUpdatedAt: string | null; metrics: Metric[] } };
    errors?: { message: string }[];
  };
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("; "));
  const agg = json.data?.aggregatedPostMetrics;
  if (!agg) throw new Error("No aggregatedPostMetrics in response");
  return agg;
}

export async function GET() {
  const token = process.env.BUFFER_ACCESS_TOKEN;
  const orgId = process.env.BUFFER_ORGANIZATION_ID;
  if (!token || !orgId) return NextResponse.json(SNAPSHOT);

  try {
    const totals = await aggregate(token, orgId);
    const channels = await Promise.all(
      mediaKitChannels.map(async (c) => {
        try {
          const m = await aggregate(token, orgId, [c.bufferChannelId]);
          return { bufferChannelId: c.bufferChannelId, metrics: m.metrics };
        } catch {
          return { bufferChannelId: c.bufferChannelId, metrics: [] };
        }
      }),
    );
    const payload: StatsPayload = {
      sample: false,
      windowDays: DAYS,
      updatedAt: totals.metricsUpdatedAt,
      totals: totals.metrics,
      channels,
    };
    return NextResponse.json(payload);
  } catch (err) {
    console.error("[stats] falling back to snapshot:", err);
    return NextResponse.json({ ...SNAPSHOT, sample: true });
  }
}

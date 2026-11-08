import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

// This legacy importer inferred rows and provisioned placeholder staff records.
// Keep the endpoint explicit so old clients fail safely instead of corrupting schedules.
export async function POST() {
  const authorization = await requireAdmin();
  if (!authorization.ok) {
    return NextResponse.json({ success: false, error: authorization.error }, { status: authorization.status });
  }

  return NextResponse.json(
    {
      success: false,
      error: "This legacy importer is disabled because it generated timetable values. Use the Excel or PDF import in Admin instead.",
    },
    { status: 410 }
  );
}

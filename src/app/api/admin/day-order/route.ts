import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getDayOrderInfo } from "@/utils/dayOrder";


export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const { doIndex } = await getDayOrderInfo();
    return NextResponse.json({ success: true, data: { baseIndex: doIndex } });
  } catch (error: any) {
    console.error("Day Order GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const { index } = await request.json();

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}T00:00:00`;

    await prisma.systemSetting.upsert({
      where: { key: 'DAY_ORDER_BASE_DATE' },
      update: { value: dateStr },
      create: { key: 'DAY_ORDER_BASE_DATE', value: dateStr }
    });

    await prisma.systemSetting.upsert({
      where: { key: 'DAY_ORDER_BASE_INDEX' },
      update: { value: index.toString() },
      create: { key: 'DAY_ORDER_BASE_INDEX', value: index.toString() }
    });

    return NextResponse.json({ success: true, date: dateStr, index });
  } catch (error: any) {
    console.error("Day Order POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

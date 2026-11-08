import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

const formatDate = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const settings = await prisma.systemSetting.findMany({
      where: {
        key: { in: ['HOLIDAYS', 'WORKING_WEEKENDS'] }
      }
    });

    const holidaysSetting = settings.find((s: { key: string }) => s.key === 'HOLIDAYS');
    const workingWeekendsSetting = settings.find((s: { key: string }) => s.key === 'WORKING_WEEKENDS');

    let holidays: string[] = [];
    let workingWeekends: string[] = [];

    if (holidaysSetting) {
      try { holidays = JSON.parse(holidaysSetting.value); } catch(e) {}
    }
    if (workingWeekendsSetting) {
      try { workingWeekends = JSON.parse(workingWeekendsSetting.value); } catch(e) {}
    }

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStr = formatDate(today);
    const tomorrowStr = formatDate(tomorrow);

    const getStatus = (dateStr: string) => {
      if (holidays.includes(dateStr)) return "LEAVE";
      if (workingWeekends.includes(dateStr)) return "WORKING_DAY";
      return "REGULAR";
    };

    return NextResponse.json({
      success: true,
      data: {
        today: getStatus(todayStr),
        tomorrow: getStatus(tomorrowStr),
        todayDate: todayStr,
        tomorrowDate: tomorrowStr
      }
    });
  } catch (error: any) {
    console.error("Leaves GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    // target = 'today' | 'tomorrow'
    // status = 'LEAVE' | 'WORKING_DAY' | 'REGULAR'
    const { target, status } = await request.json();

    const date = new Date();
    if (target === 'tomorrow') {
      date.setDate(date.getDate() + 1);
    }
    const dateStr = formatDate(date);

    const settings = await prisma.systemSetting.findMany({
      where: {
        key: { in: ['HOLIDAYS', 'WORKING_WEEKENDS'] }
      }
    });

    const holidaysSetting = settings.find((s: { key: string }) => s.key === 'HOLIDAYS');
    const workingWeekendsSetting = settings.find((s: { key: string }) => s.key === 'WORKING_WEEKENDS');

    let holidays: string[] = [];
    let workingWeekends: string[] = [];

    if (holidaysSetting) {
      try { holidays = JSON.parse(holidaysSetting.value); } catch(e) {}
    }
    if (workingWeekendsSetting) {
      try { workingWeekends = JSON.parse(workingWeekendsSetting.value); } catch(e) {}
    }

    // Remove from both lists first
    holidays = holidays.filter(d => d !== dateStr);
    workingWeekends = workingWeekends.filter(d => d !== dateStr);

    // Add back if needed
    if (status === 'LEAVE') {
      holidays.push(dateStr);
    } else if (status === 'WORKING_DAY') {
      workingWeekends.push(dateStr);
    }

    await prisma.systemSetting.upsert({
      where: { key: 'HOLIDAYS' },
      update: { value: JSON.stringify(holidays) },
      create: { key: 'HOLIDAYS', value: JSON.stringify(holidays) }
    });

    await prisma.systemSetting.upsert({
      where: { key: 'WORKING_WEEKENDS' },
      update: { value: JSON.stringify(workingWeekends) },
      create: { key: 'WORKING_WEEKENDS', value: JSON.stringify(workingWeekends) }
    });

    return NextResponse.json({ success: true, date: dateStr, status });
  } catch (error: any) {
    console.error("Leaves POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

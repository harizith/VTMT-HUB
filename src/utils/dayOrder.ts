import prisma from "@/lib/prisma";
import { DayOrderInfo } from "@/types/academic";

export async function getDayOrderInfo(): Promise<DayOrderInfo> {
  let baseDateStr = '2026-09-13T00:00:00';
  let baseIndex = 2; // Day Order III (0-based: I=0, II=1, III=2, IV=3, V=4)
  
  let holidays: string[] = [];
  let workingWeekends: string[] = [];

  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: { in: ['DAY_ORDER_BASE_DATE', 'DAY_ORDER_BASE_INDEX', 'HOLIDAYS', 'WORKING_WEEKENDS'] }
      }
    });

    const baseDateSetting = settings.find((s: { key: string }) => s.key === 'DAY_ORDER_BASE_DATE');
    const baseIndexSetting = settings.find((s: { key: string }) => s.key === 'DAY_ORDER_BASE_INDEX');
    const holidaysSetting = settings.find((s: { key: string }) => s.key === 'HOLIDAYS');
    const workingWeekendsSetting = settings.find((s: { key: string }) => s.key === 'WORKING_WEEKENDS');

    if (baseDateSetting) baseDateStr = baseDateSetting.value;
    if (baseIndexSetting) baseIndex = parseInt(baseIndexSetting.value, 10);
    
    if (holidaysSetting) {
      try { holidays = JSON.parse(holidaysSetting.value); } catch(e) {}
    }
    if (workingWeekendsSetting) {
      try { workingWeekends = JSON.parse(workingWeekendsSetting.value); } catch(e) {}
    }
  } catch (e) {
    console.error("Failed to fetch day order settings", e);
  }

  const baseDate = new Date(baseDateStr);
  baseDate.setHours(0, 0, 0, 0);

  // Use IST (Asia/Kolkata) explicitly so it works correctly on Vercel (which uses UTC by default)
  const istTimeStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const now = new Date(istTimeStr);
  
  // Shift "today" to the next day if the current IST time is 4:00 PM (16:00) or later
  if (now.getHours() >= 16) {
    now.setDate(now.getDate() + 1);
  }

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const formatDate = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const isWorkingDay = (d: Date) => {
    const dateStr = formatDate(d);
    const day = d.getDay();
    const isWeekend = day === 0 || day === 6;
    
    if (holidays.includes(dateStr)) return false;
    if (workingWeekends.includes(dateStr)) return true;
    return !isWeekend;
  };

  let current = new Date(baseDate);
  let weekdays = 0;
  
  // Count working days between base date and today
  while (current < today) {
    current.setDate(current.getDate() + 1);
    if (isWorkingDay(current)) {
      weekdays++;
    }
  }
  // Handle past dates if server time is earlier than baseDate
  while (current > today) {
    current.setDate(current.getDate() - 1);
    if (isWorkingDay(current)) {
      weekdays--;
    }
  }

  const roman = ["I", "II", "III", "IV", "V"];

  // Calculate Today
  let currentDayOrder = "Leave";
  let doIndex = 0;
  if (isWorkingDay(today)) {
    doIndex = (((baseIndex + weekdays) % 5) + 5) % 5;
    currentDayOrder = roman[doIndex];
  }

  // Calculate Tomorrow
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  let tomorrowDayOrder = "Leave";
  if (isWorkingDay(tomorrow)) {
    // Tomorrow is a working day, so its index is the total working days up to today + 1
    const tomorrowIndex = (((baseIndex + weekdays + 1) % 5) + 5) % 5;
    tomorrowDayOrder = roman[tomorrowIndex];
  }

  return {
    currentDayOrder,
    tomorrowDayOrder,
    doIndex: currentDayOrder === "Leave" ? -1 : doIndex 
  };
}

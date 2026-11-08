import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'HOD' && (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Aggregate attendance by department
  // This is a simplified approach, assuming we can map classId to departments.
  // We'll fetch all attendance and count present/total.
  
  const attendance = await prisma.attendance.findMany({
    select: {
      status: true,
      classId: true
    }
  });

  // Simple mapping function, assuming classId format contains dept code (e.g., IICSEA)
  const getDeptFromClassId = (classId: string) => {
    if (classId.includes('CSE')) return 'CSE';
    if (classId.includes('ECE')) return 'ECE';
    if (classId.includes('MECH')) return 'MECH';
    if (classId.includes('IT')) return 'IT';
    return 'OTHER';
  };

  const stats: Record<string, { present: number, total: number }> = {};

  attendance.forEach(a => {
    const dept = getDeptFromClassId(a.classId);
    if (!stats[dept]) stats[dept] = { present: 0, total: 0 };
    stats[dept].total++;
    if (a.status === 'PRESENT') stats[dept].present++;
  });

  const result = Object.keys(stats).map(dept => ({
    department: dept,
    percentage: (stats[dept].present / stats[dept].total) * 100
  }));

  return NextResponse.json({ success: true, data: result });
}

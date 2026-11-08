import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'individual';

    const filename = type === 'class'
      ? 'master-class-timetable-template.pdf'
      : 'individual-faculty-timetable-template.pdf';

    const filePath = path.join(process.cwd(), 'public', 'templates', filename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ success: false, error: 'Template file not found' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('Error serving template PDF:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

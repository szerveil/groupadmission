import { NextResponse } from 'next/server';
import { sql } from '../../lib/db'; // Adjust path if your db.ts is elsewhere

export async function GET() {
  try {
    const logEntries = await sql`
      SELECT id, log_user AS user, log_type AS type, log_timestamp AS timestamp, log_description AS description, raw_data
      FROM activity_log
      ORDER BY log_timestamp DESC;
    `;

    const changes = logEntries.map(entry => ({
      id: entry.id,
      user: entry.user,
      type: entry.type,
      timestamp: entry.timestamp.toISOString(),
      description: entry.description,
    }));

    const lastModified = changes.length > 0
      ? changes[0].timestamp
      : new Date().toISOString();

    return NextResponse.json({
      changes: changes,
      lastModified: lastModified,
    });

  } catch (error) {
    console.error("Error fetching activity logs from database:", error);
    return NextResponse.json(
      { error: "Failed to retrieve activity logs", changes: [] },
      { status: 500 }
    );
  }
}
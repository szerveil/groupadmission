import { FileChangesDisplay } from "./components/file-changes-display";
import { sql } from './lib/db';

async function getFileData() {
  try {
    const logEntries = await sql`
      SELECT
        id,
        log_user AS user,
        log_type AS type,
        log_timestamp AS timestamp,
        log_description AS description
      FROM activity_log
      ORDER BY log_timestamp DESC
      LIMIT 100;
    `;

    const changes = logEntries.map(entry => ({
      id: entry.id,
      user: entry.user,
      type: entry.type,
      timestamp: entry.timestamp instanceof Date ? entry.timestamp.toISOString() : String(entry.timestamp),
      description: entry.description,
    }));

    const lastModified = changes.length > 0
      ? changes[0].timestamp
      : undefined;

    return {
      changes: changes,
      lastModified: lastModified,
    };

  } catch (error) {
    console.error("Error fetching activity logs for display:", error);
    return { changes: [], lastModified: undefined };
  }
}

export default async function Page() {
  const fileData = await getFileData();

  return (
    <div className="container max-w-screen">
      {/* Pass the structured data to your component */}
      <FileChangesDisplay initialData={fileData} />
    </div>
  );
}
import { sql } from '../../../lib/db'; // Make sure this path is correct relative to this route

export async function GET() {
  const encoder = new TextEncoder();
  let lastSentTimestamp: string | null = null; // To track the last timestamp sent to the client

  const stream = new ReadableStream({
    async start(controller) {
      const sendData = async () => {
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

          const currentLatestTimestamp = logEntries.length > 0
            ? (logEntries[0].timestamp instanceof Date ? logEntries[0].timestamp.toISOString() : String(logEntries[0].timestamp))
            : null;

          if (currentLatestTimestamp !== lastSentTimestamp || logEntries.length === 0) {
            const changes = logEntries.map(entry => ({
              id: entry.id,
              user: entry.user,
              type: entry.type,
              timestamp: entry.timestamp instanceof Date ? entry.timestamp.toISOString() : String(entry.timestamp),
              description: entry.description,
            }));

            const dataToSend = {
              changes: changes,
              lastModified: currentLatestTimestamp || new Date().toISOString(),
            };

            const message = `data: ${JSON.stringify(dataToSend)}\n\n`;
            controller.enqueue(encoder.encode(message));
            lastSentTimestamp = currentLatestTimestamp;
          }

        } catch (error) {
          console.error("Error fetching activity logs for stream:", error);
        }
      };

      await sendData();

      const pollInterval = setInterval(sendData, 5000);

      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(": keepalive\n\n"));
      }, 30000);

      return () => {
        clearInterval(pollInterval);
        clearInterval(keepAlive);
        console.log("SSE stream closed. Cleaned up intervals.");
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
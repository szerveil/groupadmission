import { NextResponse } from 'next/server';
import * as noblox from 'noblox.js';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set.');
}
const sql = neon(process.env.DATABASE_URL);

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('id'));

    try {
        await sql`
            CREATE TABLE IF NOT EXISTS activity_log (
                id SERIAL PRIMARY KEY,
                log_user TEXT NOT NULL,
                log_type TEXT NOT NULL,
                log_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                log_description TEXT NOT NULL,
                raw_data JSONB -- Optional: store the full JSON object if needed
            );
        `;
        console.log("activity_log table ensured to exist.");
    } catch (dbError) {
        console.error("Error ensuring activity_log table exists:", dbError);
    }
    // ----------------------------------------------------------------------------------------------------

    if (!process.env.COOKIE) return NextResponse.json({ message: 'COOKIE environment variable not set.' });

    try {
        await noblox.setCookie(process.env.COOKIE);

        if (!userId) return NextResponse.json({ message: 'UserId not given.' });

        const User = await noblox.getUsernameFromId(userId);
        const UserRank = await noblox.getRankInGroup(10533277, userId);

        if (UserRank === 0 || UserRank >= 3) return NextResponse.json({ message: 'User is not in group or is already ranked.' });

        const result = await noblox.setRank(10533277, userId, 3);
        const UserRankName = await noblox.getRankNameInGroup(10533277, userId);

        if (result) {
            const logEntry = {
                user: User,
                type: 'modified',
                timestamp: new Date().toISOString(),
                description: `${User}'s rank was updated to ${UserRankName}.`,
            };

            await sql`
                INSERT INTO activity_log (log_user, log_type, log_description, raw_data)
                VALUES (${logEntry.user}, ${logEntry.type}, ${logEntry.description}, ${JSON.stringify(logEntry)})
            `;
            console.log("Log entry successfully inserted into Neon DB.");

            return NextResponse.json({ message: 'User rank updated.' });
        } else {
            return NextResponse.json({ message: 'Failed to update rank.' });
        }
    } catch (error) {
        console.error('Error in rank update process:', error);
        return NextResponse.json({ message: 'An internal server error occurred.', error: error.message }, { status: 500 });
    }
}
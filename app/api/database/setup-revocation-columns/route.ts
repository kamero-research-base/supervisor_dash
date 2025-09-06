import { NextRequest, NextResponse } from 'next/server';
import client from "../../utils/db";

export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        // Check if revocation columns exist, if not, create them
        const checkColumnsQuery = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'researches' 
            AND column_name IN ('revoke_approval_reason', 'approval_revoked_at', 'revoker_supervisor_id');
        `;
        
        const columnsResult = await client.query(checkColumnsQuery);
        const existingColumns = columnsResult.rows.map((row: any) => row.column_name);
        
        const alterQueries = [];
        
        if (!existingColumns.includes('revoke_approval_reason')) {
            alterQueries.push('ALTER TABLE researches ADD COLUMN revoke_approval_reason TEXT;');
        }
        
        if (!existingColumns.includes('approval_revoked_at')) {
            alterQueries.push('ALTER TABLE researches ADD COLUMN approval_revoked_at TIMESTAMP;');
        }
        
        if (!existingColumns.includes('revoker_supervisor_id')) {
            alterQueries.push('ALTER TABLE researches ADD COLUMN revoker_supervisor_id TEXT;');
        }
        
        // Execute alter queries if needed
        for (const query of alterQueries) {
            await client.query(query);
        }
        
        return NextResponse.json({ 
            message: "Database setup completed successfully",
            columnsAdded: alterQueries.length,
            queries: alterQueries
        }, { status: 200 });
        
    } catch (error) {
        console.error("Error setting up revocation columns:", error);
        return NextResponse.json({ 
            message: "Error setting up database", 
            error: (error as Error).message 
        }, { status: 500 });
    }
}
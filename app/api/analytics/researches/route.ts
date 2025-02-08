export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import client from "@/app/api/utils/db"; // Adjust the path as needed

export async function POST(req: Request) {
  try {
    const formData = await req.json();
    const { school_id } = formData;

    if (!school_id) {
      return NextResponse.json({ message: "Unauthorized access" }, { status: 401 });
    }

    // Get the current month and last month
    const currentMonth = new Date().getMonth() + 1; // JavaScript months are 0-based
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const currentYear = new Date().getFullYear();
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // Query for total uploads for this user
    const queryTotalUploads = `SELECT COUNT(*) AS total_uploads FROM researches WHERE school = $1;`;

    // Query for current and last month statistics
    const query = `
      SELECT 
        COUNT(*) AS total_researches,
        SUM(CASE WHEN r.status = 'Pending' OR r.status = 'Under review' THEN 1 ELSE 0 END) AS pending_researches,
        SUM(CASE WHEN r.status = 'Rejected' THEN 1 ELSE 0 END) AS total_rejected,
        SUM(CASE WHEN r.status = 'On hold' THEN 1 ELSE 0 END) AS total_onhold,
        SUM(CASE WHEN r.status = 'Published' OR r.status ='Approved' THEN 1 ELSE 0 END) AS total_published,
        SUM(r.downloads) AS total_downloads
      FROM researches r
      WHERE r.school = $1 AND EXTRACT(MONTH FROM CAST(r.created_at AS DATE)) = $2 
        AND EXTRACT(YEAR FROM CAST(r.created_at AS DATE)) = $3
    `;

    const lastMonthQuery = `
      SELECT 
        COUNT(*) AS total_researches,
        SUM(CASE WHEN r.status = 'Pending' OR r.status = 'Under review' THEN 1 ELSE 0 END) AS pending_researches,
        SUM(CASE WHEN r.status = 'Rejected' THEN 1 ELSE 0 END) AS total_rejected,
        SUM(CASE WHEN r.status = 'On hold' THEN 1 ELSE 0 END) AS total_onhold,
        SUM(CASE WHEN r.status = 'Published' OR r.status ='Approved' THEN 1 ELSE 0 END) AS total_published,
        SUM(r.downloads) AS total_downloads
      FROM researches r
      WHERE r.school = $1 AND EXTRACT(MONTH FROM CAST(r.created_at AS DATE)) = $2 
        AND EXTRACT(YEAR FROM CAST(r.created_at AS DATE)) = $3
    `;

    // Execute queries
    const totalUploadsData = await client.query(queryTotalUploads, [school_id]);
    const currentResult = await client.query(query, [school_id, currentMonth, currentYear]);
    const lastMonthResult = await client.query(lastMonthQuery, [school_id, lastMonth, lastMonthYear]);

    const totalUploads = totalUploadsData.rows[0]?.total_uploads || 1;
    const current = currentResult.rows[0];
    const previous = lastMonthResult.rows[0];

    // Function to calculate percentage change
    const calculatePercentage = (current: number, previous: number) => {
      const currentPercentage = (current / totalUploads) * 100;
      const previousPercentage = (previous / totalUploads) * 100;
      return parseFloat((currentPercentage - previousPercentage).toFixed(2));
    };

    const analytics = {
      total_researches: current.total_researches || 0,
      pending_researches: current.pending_researches || 0,
      total_rejected: current.total_rejected || 0,
      total_onhold: current.total_onhold || 0,
      total_published: current.total_published || 0,
      total_downloads: current.total_downloads || 0,
      percentage_change: {
        total_researches: calculatePercentage(current.total_researches, previous.total_researches),
        pending_researches: calculatePercentage(current.pending_researches, previous.pending_researches),
        total_rejected: calculatePercentage(current.total_rejected, previous.total_rejected),
        total_onhold: calculatePercentage(current.total_onhold, previous.total_onhold),
        total_published: calculatePercentage(current.total_published, previous.total_published),
        total_downloads: calculatePercentage(current.total_downloads, previous.total_downloads),
      },
    };

    return NextResponse.json(analytics, { status: 200 });
  } catch (error) {
    console.error("Error retrieving research analytics:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

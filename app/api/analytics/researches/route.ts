export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import client from "@/app/api/utils/db"; // Adjust the path as needed

export async function POST(req: Request) {
  try {
    const formData = await req.json();
    const { supervisor_id } = formData;

    if (!supervisor_id) {
      return NextResponse.json({ message: "Unauthorized access" }, { status: 401 });
    }

    // Get the current month and last month
    const currentMonth = new Date().getMonth() + 1; // JavaScript months are 0-based
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const currentYear = new Date().getFullYear();
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // First, get the students array from supervisor table
    const supervisorQuery = `SELECT students FROM supervisors WHERE id = $1;`;
    const supervisorResult = await client.query(supervisorQuery, [supervisor_id]);
    
    if (supervisorResult.rows.length === 0) {
      return NextResponse.json({ message: "Supervisor not found" }, { status: 404 });
    }

    const students = supervisorResult.rows[0].students || [];
    // Create array of all user IDs (supervisor + students)
    const allUserIds = [supervisor_id, ...students];

    // Query for TOTAL statistics (all time)
    const queryTotal = `
      SELECT 
        COUNT(*) AS total_researches,
        SUM(CASE WHEN r.status = 'Pending' OR r.status = 'Under review' THEN 1 ELSE 0 END) AS pending_researches,
        SUM(CASE WHEN r.status = 'Rejected' THEN 1 ELSE 0 END) AS total_rejected,
        SUM(CASE WHEN r.status = 'On hold' THEN 1 ELSE 0 END) AS total_onhold,
        SUM(CASE WHEN r.status = 'Published' OR r.status ='Approved' THEN 1 ELSE 0 END) AS total_published,
        SUM(r.downloads) AS total_downloads
      FROM researches r
      WHERE r.user_id = ANY($1)
    `;

    // Query for supervisor's own uploads
    const queryMyUploads = `
      SELECT COUNT(*) AS my_uploads
      FROM researches
      WHERE user_id = $1
    `;

    // Query for current month statistics (for percentage calculation)
    const queryCurrentMonth = `
      SELECT 
        COUNT(*) AS total_researches,
        SUM(CASE WHEN r.status = 'Pending' OR r.status = 'Under review' THEN 1 ELSE 0 END) AS pending_researches,
        SUM(CASE WHEN r.status = 'Rejected' THEN 1 ELSE 0 END) AS total_rejected,
        SUM(CASE WHEN r.status = 'On hold' THEN 1 ELSE 0 END) AS total_onhold,
        SUM(CASE WHEN r.status = 'Published' OR r.status ='Approved' THEN 1 ELSE 0 END) AS total_published,
        SUM(r.downloads) AS total_downloads
      FROM researches r
      WHERE r.user_id = ANY($1) AND EXTRACT(MONTH FROM CAST(r.created_at AS DATE)) = $2 
      AND EXTRACT(YEAR FROM CAST(r.created_at AS DATE)) = $3
    `;

    // Query for last month statistics (for percentage calculation)
    const queryLastMonth = `
      SELECT 
        COUNT(*) AS total_researches,
        SUM(CASE WHEN r.status = 'Pending' OR r.status = 'Under review' THEN 1 ELSE 0 END) AS pending_researches,
        SUM(CASE WHEN r.status = 'Rejected' THEN 1 ELSE 0 END) AS total_rejected,
        SUM(CASE WHEN r.status = 'On hold' THEN 1 ELSE 0 END) AS total_onhold,
        SUM(CASE WHEN r.status = 'Published' OR r.status ='Approved' THEN 1 ELSE 0 END) AS total_published,
        SUM(r.downloads) AS total_downloads
      FROM researches r
      WHERE r.user_id = ANY($1) AND EXTRACT(MONTH FROM CAST(r.created_at AS DATE)) = $2 
        AND EXTRACT(YEAR FROM CAST(r.created_at AS DATE)) = $3
    `;

    // Execute queries
    const totalResult = await client.query(queryTotal, [allUserIds]);
    const myUploadsResult = await client.query(queryMyUploads, [supervisor_id]);
    const currentMonthResult = await client.query(queryCurrentMonth, [allUserIds, currentMonth, currentYear]);
    const lastMonthResult = await client.query(queryLastMonth, [allUserIds, lastMonth, lastMonthYear]);

    const total = totalResult.rows[0];
    const myUploads = myUploadsResult.rows[0];
    const currentMonthData = currentMonthResult.rows[0];
    const lastMonthData = lastMonthResult.rows[0];

    // Function to calculate percentage change (month over month)
    const calculatePercentageChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return parseFloat((((current - previous) / previous) * 100).toFixed(2));
    };

    const analytics = {
      // Total counts (all time)
      total_researches: parseInt(total.total_researches) || 0,
      pending_researches: parseInt(total.pending_researches) || 0,
      total_rejected: parseInt(total.total_rejected) || 0,
      total_onhold: parseInt(total.total_onhold) || 0,
      total_published: parseInt(total.total_published) || 0,
      total_downloads: parseInt(total.total_downloads) || 0,
      my_uploads: parseInt(myUploads.my_uploads) || 0,
      students_count: students.length,
      // Percentage changes (month over month)
      percentage_change: {
        total_researches: calculatePercentageChange(
          parseInt(currentMonthData.total_researches) || 0,
          parseInt(lastMonthData.total_researches) || 0
        ),
        pending_researches: calculatePercentageChange(
          parseInt(currentMonthData.pending_researches) || 0,
          parseInt(lastMonthData.pending_researches) || 0
        ),
        total_rejected: calculatePercentageChange(
          parseInt(currentMonthData.total_rejected) || 0,
          parseInt(lastMonthData.total_rejected) || 0
        ),
        total_onhold: calculatePercentageChange(
          parseInt(currentMonthData.total_onhold) || 0,
          parseInt(lastMonthData.total_onhold) || 0
        ),
        total_published: calculatePercentageChange(
          parseInt(currentMonthData.total_published) || 0,
          parseInt(lastMonthData.total_published) || 0
        ),
        total_downloads: calculatePercentageChange(
          parseInt(currentMonthData.total_downloads) || 0,
          parseInt(lastMonthData.total_downloads) || 0
        ),
        my_uploads: calculatePercentageChange(
          parseInt(currentMonthData.total_researches) || 0,
          parseInt(lastMonthData.total_researches) || 0
        ),
        students_count: 0, // Students count doesn't have percentage change
      },
    };
    
    return NextResponse.json({ success: true, data: analytics }, { status: 200 });
  } catch (error) {
    console.error("Error retrieving research analytics:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
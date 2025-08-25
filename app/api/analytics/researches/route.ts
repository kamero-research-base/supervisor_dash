export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import client from "@/app/api/utils/db";

export async function POST(req: Request) {
  try {
    const formData = await req.json();
    const { supervisor_id } = formData;

    if (!supervisor_id) {
      return NextResponse.json({ message: "Unauthorized access" }, { status: 401 });
    }

    // Get the current month and last month
    const currentMonth = new Date().getMonth() + 1;
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const currentYear = new Date().getFullYear();
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // Get the students array from supervisor table
    const supervisorQuery = `SELECT students FROM supervisors WHERE id = $1;`;
    const supervisorResult = await client.query(supervisorQuery, [supervisor_id]);
    
    if (supervisorResult.rows.length === 0) {
      return NextResponse.json({ message: "Supervisor not found" }, { status: 404 });
    }

    const students = supervisorResult.rows[0].students || [];
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

    // Query for supervisor's own uploads (all time)
    const queryMyUploads = `
      SELECT COUNT(*) AS my_uploads
      FROM researches
      WHERE user_id = $1
    `;

    // Query for supervisor's uploads - current month
    const queryMyUploadsCurrentMonth = `
      SELECT COUNT(*) AS my_uploads_current
      FROM researches
      WHERE user_id = $1 
      AND EXTRACT(MONTH FROM CAST(created_at AS DATE)) = $2 
      AND EXTRACT(YEAR FROM CAST(created_at AS DATE)) = $3
    `;

    // Query for supervisor's uploads - last month
    const queryMyUploadsLastMonth = `
      SELECT COUNT(*) AS my_uploads_last
      FROM researches
      WHERE user_id = $1 
      AND EXTRACT(MONTH FROM CAST(created_at AS DATE)) = $2 
      AND EXTRACT(YEAR FROM CAST(created_at AS DATE)) = $3
    `;

    // Query for current month statistics
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

    // Query for last month statistics
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
    const [
      totalResult,
      myUploadsResult,
      myUploadsCurrentResult,
      myUploadsLastResult,
      currentMonthResult,
      lastMonthResult
    ] = await Promise.all([
      client.query(queryTotal, [allUserIds]),
      client.query(queryMyUploads, [supervisor_id]),
      client.query(queryMyUploadsCurrentMonth, [supervisor_id, currentMonth, currentYear]),
      client.query(queryMyUploadsLastMonth, [supervisor_id, lastMonth, lastMonthYear]),
      client.query(queryCurrentMonth, [allUserIds, currentMonth, currentYear]),
      client.query(queryLastMonth, [allUserIds, lastMonth, lastMonthYear])
    ]);

    const total = totalResult.rows[0];
    const myUploads = myUploadsResult.rows[0];
    const myUploadsCurrentMonth = myUploadsCurrentResult.rows[0];
    const myUploadsLastMonth = myUploadsLastResult.rows[0];
    const currentMonthData = currentMonthResult.rows[0];
    const lastMonthData = lastMonthResult.rows[0];

    // Updated percentage calculation using total sum
    const calculatePercentageChange = (current: number, previous: number) => {
      // Handle edge cases
      if (previous === 0 && current === 0) return 0;
      if (previous === 0 && current > 0) return null; // Indicate "new" rather than percentage
      if (current === 0 && previous > 0) return -100; // 100% decrease
      
      // Calculate percentage increase based on total sum (current + previous)
      const totalSum = current + previous;
      if (totalSum === 0) return 0;
      
      // Percentage increase relative to total sum
      const percentage = ((current - previous) / totalSum) * 100;
      
      // Cap increases at 50% and decreases at -50% since max possible is ±50% when using total sum
      if (percentage > 50) return 50;
      if (percentage < -50) return -50;
      
      return parseFloat(percentage.toFixed(1));
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

      // Monthly data for context
      current_month_data: {
        total_researches: parseInt(currentMonthData.total_researches) || 0,
        pending_researches: parseInt(currentMonthData.pending_researches) || 0,
        total_rejected: parseInt(currentMonthData.total_rejected) || 0,
        total_onhold: parseInt(currentMonthData.total_onhold) || 0,
        total_published: parseInt(currentMonthData.total_published) || 0,
        total_downloads: parseInt(currentMonthData.total_downloads) || 0,
        my_uploads: parseInt(myUploadsCurrentMonth.my_uploads_current) || 0,
      },

      last_month_data: {
        total_researches: parseInt(lastMonthData.total_researches) || 0,
        pending_researches: parseInt(lastMonthData.pending_researches) || 0,
        total_rejected: parseInt(lastMonthData.total_rejected) || 0,
        total_onhold: parseInt(lastMonthData.total_onhold) || 0,
        total_published: parseInt(lastMonthData.total_published) || 0,
        total_downloads: parseInt(lastMonthData.total_downloads) || 0,
        my_uploads: parseInt(myUploadsLastMonth.my_uploads_last) || 0,
      },

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
          parseInt(myUploadsCurrentMonth.my_uploads_current) || 0,
          parseInt(myUploadsLastMonth.my_uploads_last) || 0
        ),
        students_count: 0, // Students count doesn't have percentage change
      },

      // Change indicators for better UX
      change_indicators: {
        total_researches: getChangeIndicator(
          parseInt(currentMonthData.total_researches) || 0,
          parseInt(lastMonthData.total_researches) || 0
        ),
        pending_researches: getChangeIndicator(
          parseInt(currentMonthData.pending_researches) || 0,
          parseInt(lastMonthData.pending_researches) || 0
        ),
        total_rejected: getChangeIndicator(
          parseInt(currentMonthData.total_rejected) || 0,
          parseInt(lastMonthData.total_rejected) || 0
        ),
        total_onhold: getChangeIndicator(
          parseInt(currentMonthData.total_onhold) || 0,
          parseInt(lastMonthData.total_onhold) || 0
        ),
        total_published: getChangeIndicator(
          parseInt(currentMonthData.total_published) || 0,
          parseInt(lastMonthData.total_published) || 0
        ),
        total_downloads: getChangeIndicator(
          parseInt(currentMonthData.total_downloads) || 0,
          parseInt(lastMonthData.total_downloads) || 0
        ),
        my_uploads: getChangeIndicator(
          parseInt(myUploadsCurrentMonth.my_uploads_current) || 0,
          parseInt(myUploadsLastMonth.my_uploads_last) || 0
        ),
      },

      // Metadata
      period_info: {
        current_month: currentMonth,
        current_year: currentYear,
        last_month: lastMonth,
        last_month_year: lastMonthYear,
      }
    };
    
    return NextResponse.json({ success: true, data: analytics }, { status: 200 });
  } catch (error) {
    console.error("Error retrieving research analytics:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

function getChangeIndicator(arg0: number, arg1: number) {
  throw new Error("Function not implemented.");
}

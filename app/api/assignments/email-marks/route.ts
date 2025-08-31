import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { sendMarksExportEmail } from '../../utils/assignmentEmails';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});



export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const {
      assignment_id,
      supervisor_id,
      columns,
      fileFormat,
      color,
      studentFilters,
      emailAddress
    } = requestBody;
    
    console.log('🔍 [EMAIL DEBUG] Received email request:', JSON.stringify(requestBody, null, 2));

    // Validate required fields
    if (!assignment_id || !supervisor_id || !columns || !emailAddress) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email address' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      // Get assignment details
      const assignmentQuery = `
        SELECT title, description, max_score, due_date, assignment_type, created_at
        FROM assignments 
        WHERE id = $1
      `;
      const assignmentResult = await client.query(assignmentQuery, [assignment_id]);
      
      if (assignmentResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, message: 'Assignment not found or access denied' },
          { status: 404 }
        );
      }

      const assignment = assignmentResult.rows[0];

      // Generate file using the exact same logic as the download route
      // by making an internal request to the download endpoint
      
      const baseUrl = process.env.NEXTAUTH_URL || `http://localhost:${process.env.PORT || 3000}`;
      const downloadUrl = `${baseUrl}/api/assignments/download-marks`;
      
      const requestBody = {
        assignment_id: assignment_id,
        supervisor_id: supervisor_id,
        columns: columns,
        format: fileFormat,
        color: color || '#009688',
        filtered_students: studentFilters?.studentIds
      };
      
      console.log('🔍 [EMAIL DEBUG] Sending to download endpoint:', JSON.stringify(requestBody, null, 2));
      
      const downloadResponse = await fetch(downloadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!downloadResponse.ok) {
        const errorText = await downloadResponse.text();
        console.error('Download endpoint error:', errorText);
        throw new Error(`Failed to generate file: ${downloadResponse.statusText} - ${errorText}`);
      }

      // Get the file buffer from download response
      const fileBuffer = Buffer.from(await downloadResponse.arrayBuffer());
      const fileName = `${assignment.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_marks.${fileFormat}`;
      
      console.log(`Generated file: ${fileName}, size: ${fileBuffer.length} bytes`);

      // Send email using Brevo service
      const emailSent = await sendMarksExportEmail({
        recipientEmail: emailAddress,
        recipientName: 'Supervisor',
        assignmentTitle: assignment.title,
        supervisorName: 'System',
        fileFormat: fileFormat,
        totalStudents: studentFilters?.studentIds?.length || 0,
        exportedColumns: columns.length,
        fileBuffer: fileBuffer,
        fileName: fileName,
        color: color || '#009688'
      });

      if (!emailSent) {
        throw new Error('Failed to send email via email service');
      }

      return NextResponse.json({
        success: true,
        message: `Student marks have been sent to ${emailAddress}`,
        fileName: fileName
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error sending email with marks:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to send email' 
      },
      { status: 500 }
    );
  }
}
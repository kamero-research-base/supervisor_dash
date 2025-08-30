// app/api/assignments/download-marks/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import client from "../../utils/db";
import * as ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DownloadRequest {
  assignment_id: number;
  supervisor_id: number;
  columns: string[];
  format: 'xlsx' | 'pdf';
  color?: string; // Optional color for PDF styling
  filtered_students?: number[]; // Optional filtered student IDs
}

export async function POST(req: NextRequest) {
  try {
    const body: DownloadRequest = await req.json();
    const { assignment_id, supervisor_id, columns, format, filtered_students } = body;

    if (!assignment_id || !supervisor_id || !columns || columns.length === 0) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log('🔍 [DOWNLOAD DEBUG] Download request:', {
      assignment_id,
      supervisor_id,
      columns,
      format
    });

    // Get supervisor details for the header
    const supervisorQuery = `
      SELECT s.first_name, s.last_name, s.email, s.department,
             d.name as department_name, sc.name as school_name, i.name as institution_name
      FROM supervisors s
      LEFT JOIN departments d ON CAST(d.id AS TEXT) = s.department
      LEFT JOIN schools sc ON CAST(sc.id AS TEXT) = d.school
      LEFT JOIN institutions i ON CAST(i.id AS TEXT) = sc.college
      WHERE s.id = $1
    `;
    
    const supervisorResult = await client.query(supervisorQuery, [supervisor_id]);
    if (supervisorResult.rows.length === 0) {
      return NextResponse.json(
        { message: "Supervisor not found" },
        { status: 404 }
      );
    }
    
    const supervisor = supervisorResult.rows[0];

    // Get assignment details
    const assignmentQuery = `
      SELECT title, description, max_score, due_date, assignment_type, created_at
      FROM assignments 
      WHERE id = $1
    `;
    
    const assignmentResult = await client.query(assignmentQuery, [assignment_id]);
    if (assignmentResult.rows.length === 0) {
      return NextResponse.json(
        { message: "Assignment not found" },
        { status: 404 }
      );
    }
    
    const assignment = assignmentResult.rows[0];

    // Get student data with submissions
    let studentDataQuery = `
      SELECT DISTINCT
        s.id as student_id,
        s.first_name,
        s.last_name,
        s.email,
        ai.status as invitation_status,
        COALESCE(sub.score, NULL) as score,
        COALESCE(sub.status, 'not_submitted') as status,
        sub.submitted_at,
        sub.graded_at,
        sub.feedback,
        CASE WHEN ag.group_name IS NOT NULL THEN ag.group_name ELSE NULL END as group_name,
        ai.invited_at
      FROM assignment_invitations ai
      JOIN students s ON ai.student_id = s.id
      LEFT JOIN assignment_submissions sub ON ai.assignment_id = sub.assignment_id AND s.id = sub.student_id
      LEFT JOIN assignment_groups ag ON sub.group_id = ag.id
      WHERE ai.assignment_id = $1
    `;
    
    let queryParams: any[] = [assignment_id];
    
    // Add filtering by student IDs if provided
    if (filtered_students && filtered_students.length > 0) {
      studentDataQuery += ` AND s.id = ANY($2)`;
      queryParams.push(filtered_students);
    }
    
    studentDataQuery += ` ORDER BY s.last_name ASC, s.first_name ASC`;

    const studentDataResult = await client.query(studentDataQuery, queryParams);
    const studentData = studentDataResult.rows;

    console.log('✅ [DOWNLOAD DEBUG] Retrieved data:', {
      supervisor_name: `${supervisor.first_name} ${supervisor.last_name}`,
      assignment_title: assignment.title,
      students_count: studentData.length,
      department: supervisor.department_name,
      school: supervisor.school_name
    });

    if (format === 'xlsx') {
      return generateExcelFile(assignment, supervisor, studentData, columns);
    } else {
      return generatePDFFile(assignment, supervisor, studentData, columns, body.color);
    }

  } catch (error) {
    console.error("Error generating download:", error);
    return NextResponse.json(
      { message: "Failed to generate download", error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

async function generateExcelFile(assignment: any, supervisor: any, studentData: any[], columns: string[]) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Student Marks');

  // Set up styling
  const headerStyle = {
    font: { bold: true, size: 14, color: { argb: '004472C4' } },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFE6F2FF' } },
    border: {
      top: { style: 'thin' as const, color: { argb: 'FF4472C4' } },
      left: { style: 'thin' as const, color: { argb: 'FF4472C4' } },
      bottom: { style: 'thin' as const, color: { argb: 'FF4472C4' } },
      right: { style: 'thin' as const, color: { argb: 'FF4472C4' } }
    }
  };

  const titleStyle = {
    font: { bold: true, size: 16 },
    alignment: { horizontal: 'center' as const }
  };

  // Add title and header information
  let currentRow = 1;
  
  // Title
  worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
  worksheet.getCell(`A${currentRow}`).value = `${assignment.title} - Student Marks Report`;
  worksheet.getCell(`A${currentRow}`).style = titleStyle;
  currentRow += 2;

  // Course/Assignment Information
  worksheet.getCell(`A${currentRow}`).value = 'Assignment:';
  worksheet.getCell(`A${currentRow}`).font = { bold: true };
  worksheet.getCell(`B${currentRow}`).value = assignment.title;
  currentRow++;

  worksheet.getCell(`A${currentRow}`).value = 'Supervisor:';
  worksheet.getCell(`A${currentRow}`).font = { bold: true };
  worksheet.getCell(`B${currentRow}`).value = `${supervisor.first_name} ${supervisor.last_name}`;
  currentRow++;

  worksheet.getCell(`A${currentRow}`).value = 'Department:';
  worksheet.getCell(`A${currentRow}`).font = { bold: true };
  worksheet.getCell(`B${currentRow}`).value = supervisor.department_name || 'N/A';
  currentRow++;

  worksheet.getCell(`A${currentRow}`).value = 'School:';
  worksheet.getCell(`A${currentRow}`).font = { bold: true };
  worksheet.getCell(`B${currentRow}`).value = supervisor.school_name || 'N/A';
  currentRow++;

  worksheet.getCell(`A${currentRow}`).value = 'Institution:';
  worksheet.getCell(`A${currentRow}`).font = { bold: true };
  worksheet.getCell(`B${currentRow}`).value = supervisor.institution_name || 'N/A';
  currentRow++;

  worksheet.getCell(`A${currentRow}`).value = 'Assignment Type:';
  worksheet.getCell(`A${currentRow}`).font = { bold: true };
  worksheet.getCell(`B${currentRow}`).value = assignment.assignment_type === 'group' ? 'Group Assignment' : 'Individual Assignment';
  currentRow++;

  worksheet.getCell(`A${currentRow}`).value = 'Maximum Score:';
  worksheet.getCell(`A${currentRow}`).font = { bold: true };
  worksheet.getCell(`B${currentRow}`).value = assignment.max_score;
  currentRow++;

  worksheet.getCell(`A${currentRow}`).value = 'Due Date:';
  worksheet.getCell(`A${currentRow}`).font = { bold: true };
  worksheet.getCell(`B${currentRow}`).value = new Date(assignment.due_date).toLocaleDateString();
  currentRow++;

  worksheet.getCell(`A${currentRow}`).value = 'Generated On:';
  worksheet.getCell(`A${currentRow}`).font = { bold: true };
  worksheet.getCell(`B${currentRow}`).value = new Date().toLocaleString();
  currentRow += 2;

  // Column headers for student data
  const columnHeaders: { [key: string]: string } = {
    student_name: 'Student Name',
    student_email: 'Email Address',
    student_id: 'Student ID',
    invite_status: 'Invite Status',
    score: 'Score',
    percentage: 'Percentage (%)',
    status: 'Status',
    submitted_at: 'Submission Date',
    graded_at: 'Graded Date',
    feedback: 'Feedback',
    group_name: 'Group Name'
  };

  // Add column headers
  let col = 1;
  columns.forEach((columnId) => {
    const cell = worksheet.getCell(currentRow, col);
    cell.value = columnHeaders[columnId] || columnId;
    cell.style = headerStyle;
    col++;
  });
  currentRow++;

  // Add student data
  studentData.forEach((student) => {
    col = 1;
    columns.forEach((columnId) => {
      const cell = worksheet.getCell(currentRow, col);
      
      switch (columnId) {
        case 'student_name':
          cell.value = `${student.first_name} ${student.last_name}`;
          break;
        case 'student_email':
          cell.value = student.email;
          break;
        case 'student_id':
          cell.value = student.student_id;
          break;
        case 'invite_status':
          cell.value = student.invitation_status ? student.invitation_status.charAt(0).toUpperCase() + student.invitation_status.slice(1) : 'Pending';
          break;
        case 'score':
          cell.value = student.score !== null ? student.score : 'Not Graded';
          break;
        case 'percentage':
          cell.value = student.score !== null ? Math.round((student.score / assignment.max_score) * 100) : 'N/A';
          break;
        case 'status':
          cell.value = student.status === 'not_submitted' ? 'Not Submitted' : 
                      student.status.charAt(0).toUpperCase() + student.status.slice(1);
          break;
        case 'submitted_at':
          cell.value = student.submitted_at ? new Date(student.submitted_at).toLocaleString() : 'Not Submitted';
          break;
        case 'graded_at':
          cell.value = student.graded_at ? new Date(student.graded_at).toLocaleString() : 'Not Graded';
          break;
        case 'feedback':
          cell.value = student.feedback || 'No feedback';
          break;
        case 'group_name':
          cell.value = student.group_name || 'No Group';
          break;
        default:
          cell.value = '';
      }
      col++;
    });
    currentRow++;
  });

  // Auto-fit columns
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = Math.min(Math.max(maxLength + 2, 10), 50);
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${assignment.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_marks.xlsx"`
    }
  });
}

async function generatePDFFile(assignment: any, supervisor: any, studentData: any[], columns: string[], selectedColor?: string) {
  // Default to brand color if no color specified
  const themeColor = selectedColor || '#009688';
  
  // Convert hex color to RGB for jsPDF
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 150, 136]; // Default brand color RGB
  };
  
  const [r, g, b] = hexToRgb(themeColor);
  const columnHeaders: { [key: string]: string } = {
    student_name: 'Student Name',
    student_email: 'Email Address', 
    student_id: 'Student ID',
    score: 'Score',
    max_score: 'Max Score',
    percentage: 'Percentage (%)',
    status: 'Status',
    submitted_at: 'Submission Date',
    graded_at: 'Graded Date',
    feedback: 'Feedback',
    group_name: 'Group Name'
  };

  // Create new PDF document in landscape format
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Set font
  doc.setFont('helvetica');

  // Title with selected color
  doc.setFontSize(20);
  doc.setTextColor(r, g, b); // Use selected color
  const title = `${assignment.title} - Student Marks Report`;
  const titleWidth = doc.getTextWidth(title);
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.text(title, (pageWidth - titleWidth) / 2, 20);

  // Header Information
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  
  const leftColX = 10; // Align with table left margin
  const rightColX = 140;
  let currentY = 35;

  const infoData = [
    ['Assignment:', assignment.title],
    ['Supervisor:', `${supervisor.first_name} ${supervisor.last_name}`],
    ['Department:', supervisor.department_name || 'N/A'],
    ['School:', supervisor.school_name || 'N/A'],
    ['Institution:', supervisor.institution_name || 'N/A'],
    ['Assignment Type:', assignment.assignment_type === 'group' ? 'Group Assignment' : 'Individual Assignment'],
    ['Maximum Score:', assignment.max_score.toString()],
    ['Due Date:', new Date(assignment.due_date).toLocaleDateString()],
    ['Generated On:', new Date().toLocaleString()],
    ['Total Students:', studentData.length.toString()]
  ];

  // Draw info in two columns with better spacing
  for (let i = 0; i < infoData.length; i += 2) {
    // Left column
    if (infoData[i]) {
      doc.setFont('helvetica', 'bold');
      doc.text(infoData[i][0], leftColX, currentY);
      doc.setFont('helvetica', 'normal');
      // Increase spacing between label and value
      const leftLabelWidth = doc.getTextWidth(infoData[i][0]);
      doc.text(infoData[i][1], leftColX + leftLabelWidth + 5, currentY);
    }
    
    // Right column
    if (infoData[i + 1]) {
      doc.setFont('helvetica', 'bold');
      doc.text(infoData[i + 1][0], rightColX, currentY);
      doc.setFont('helvetica', 'normal');
      // Increase spacing between label and value
      const rightLabelWidth = doc.getTextWidth(infoData[i + 1][0]);
      doc.text(infoData[i + 1][1], rightColX + rightLabelWidth + 5, currentY);
    }
    
    currentY += 7; // Increase vertical spacing too
  }

  // Helper function to strip HTML tags and limit text length
  const stripHtmlAndLimit = (text: string, maxLength: number = 100): string => {
    if (!text) return '';
    // Remove HTML tags
    const stripped = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    // Limit length and add ellipsis if needed
    return stripped.length > maxLength ? stripped.substring(0, maxLength) + '...' : stripped;
  };

  // Prepare table data
  const headers = columns.map(columnId => columnHeaders[columnId] || columnId);
  
  const tableData = studentData.map(student => {
    return columns.map(columnId => {
      switch (columnId) {
        case 'student_name':
          return `${student.first_name} ${student.last_name}`;
        case 'student_email':
          return student.email;
        case 'student_id':
          return student.student_id?.toString() || 'N/A';
        case 'invite_status':
          return student.invitation_status ? student.invitation_status.charAt(0).toUpperCase() + student.invitation_status.slice(1) : 'Pending';
        case 'score':
          return student.score !== null ? student.score.toString() : 'Not Graded';
        case 'percentage':
          return student.score !== null ? Math.round((student.score / assignment.max_score) * 100) + '%' : 'N/A';
        case 'status':
          return student.status === 'not_submitted' ? 'Not Submitted' : 
                 student.status.charAt(0).toUpperCase() + student.status.slice(1);
        case 'submitted_at':
          return student.submitted_at ? new Date(student.submitted_at).toLocaleDateString() : 'Not Submitted';
        case 'graded_at':
          return student.graded_at ? new Date(student.graded_at).toLocaleDateString() : 'Not Graded';
        case 'feedback':
          return stripHtmlAndLimit(student.feedback || 'No feedback', 150);
        case 'group_name':
          return student.group_name || 'No Group';
        default:
          return '';
      }
    });
  });

  // Calculate available table width (page width minus margins)
  const availableWidth = pageWidth - 20; // 10mm margin on each side
  
  // Define column weight (relative proportions) instead of fixed widths
  const getColumnWeight = (columnId: string): number => {
    switch (columnId) {
      case 'student_name': return 3.5; // Larger for names
      case 'student_email': return 4; // Largest for email addresses
      case 'student_id': return 1.5;
      case 'invite_status': return 2; // Medium for invite status
      case 'score': return 1.2;
      case 'percentage': return 1.5;
      case 'status': return 2.5;
      case 'submitted_at': return 2.5;
      case 'graded_at': return 2.5;
      case 'feedback': return 4.5; // Large for feedback content
      case 'group_name': return 2.5;
      default: return 2;
    }
  };

  // Calculate total weight and proportional widths
  const totalWeight = columns.reduce((sum, columnId) => sum + getColumnWeight(columnId), 0);
  
  // Create column styles object with proportional widths
  const columnStyles = columns.reduce((acc, columnId, index) => {
    const columnWeight = getColumnWeight(columnId);
    const columnWidth = (columnWeight / totalWeight) * availableWidth;
    
    const style: any = {
      cellWidth: columnWidth,
      overflow: 'linebreak',
      fontSize: 7,
    };

    // Center alignment for numerical columns
    if (['score', 'percentage', 'max_score', 'student_id'].includes(columnId)) {
      style.halign = 'center';
    }

    // Special styling for feedback column
    if (columnId === 'feedback') {
      style.fontSize = 6;
    }

    acc[index] = style;
    return acc;
  }, {} as any);

  // Create table using autoTable with full width
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: currentY + 5,
    styles: {
      fontSize: 7,
      cellPadding: 2,
      overflow: 'linebreak',
      cellWidth: 'wrap',
    },
    headStyles: {
      fillColor: [r, g, b], // Use selected color for header
      textColor: [255, 255, 255], // White text
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251], // Light gray
    },
    columnStyles: columnStyles,
    margin: { left: 10, right: 10 },
    tableWidth: availableWidth, // Use calculated full width
    showHead: 'everyPage',
  });

  // Footer
  const finalY = (doc as any).lastAutoTable.finalY || currentY + 50;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  
  // Footer text
  const footerY = finalY + 10;
  doc.text(`Report generated on ${new Date().toLocaleString()}`, pageWidth / 2, footerY, { align: 'center' });
  doc.text(`Generated by ${supervisor.first_name} ${supervisor.last_name} | ${supervisor.department_name || 'N/A'}`, pageWidth / 2, footerY + 4, { align: 'center' });
  doc.text(`This report contains ${studentData.length} student records from ${assignment.title}`, pageWidth / 2, footerY + 8, { align: 'center' });

  // Convert to buffer and cast as Uint8Array to fix TypeScript error
  const pdfOutput = doc.output('arraybuffer');
  const pdfBuffer = new Uint8Array(pdfOutput);

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${assignment.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_marks.pdf"`
    }
  });
}
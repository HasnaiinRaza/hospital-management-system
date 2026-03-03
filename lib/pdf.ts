import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReportData } from '@/types';
import { format } from 'date-fns';

const HOSPITAL_NAME = 'SINDH INSTITUTE OF PHYSICAL MEDICINE & REHABILITATION';
const HOSPITAL_LOGO = '/sipmr.png';

function loadImageAsBase64(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas context unavailable')); return; }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error(`Could not load image: ${src}`));
    img.src = src;
  });
}

export async function generateReportPDF(
  data: any[],           // accepts raw DB rows directly — no pre-mapping needed
  title: string,
  subtitle: string,
  doctorName?: string
): Promise<void> {
  const doc = new jsPDF();

  // ── HEADER ────────────────────────────────────────────────────────────
  const HEADER_H = 44;
  doc.setFillColor(6, 95, 70);
  doc.rect(0, 0, 210, HEADER_H, 'F');

  const LOGO_W = 50, LOGO_H = 50, LOGO_X = 10;
  const LOGO_Y = (HEADER_H - LOGO_H) / 2;
  const TEXT_X = LOGO_X + LOGO_W + 5;
  const TEXT_W = 210 - TEXT_X - 6;

  if (HOSPITAL_LOGO) {
    try {
      const base64 = await loadImageAsBase64(HOSPITAL_LOGO);
      doc.addImage(base64, 'PNG', LOGO_X, LOGO_Y, LOGO_W, LOGO_H);
    } catch { /* continue without logo */ }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  const nameLines  = doc.splitTextToSize(HOSPITAL_NAME, TEXT_W) as string[];
  const lineH      = 7;
  const blockH     = nameLines.length * lineH;
  const nameStartY = LOGO_Y + (LOGO_H - blockH - 6) / 2 + lineH;
  nameLines.forEach((line, i) => doc.text(line, TEXT_X, nameStartY + i * lineH));

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(167, 243, 208);
  doc.text(title, TEXT_X, nameStartY + nameLines.length * lineH + 2);

  // ── META ──────────────────────────────────────────────────────────────
  let metaY = HEADER_H + 10;
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated : ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, 14, metaY);
  if (doctorName) { metaY += 7; doc.text(`Doctor    : ${doctorName}`, 14, metaY); }
  metaY += 7;
  doc.text(`Period    : ${subtitle}`, 14, metaY);

  // ── SUMMARY BOX (only present rows count) ────────────────────────────
  const presentRows    = data.filter(r => !r.status || r.status === 'present');
  const totalMale      = presentRows.reduce((s, r) => s + (r.male_count      ?? r.male      ?? 0), 0);
  const totalFemale    = presentRows.reduce((s, r) => s + (r.female_count    ?? r.female    ?? 0), 0);
  const totalPediatric = presentRows.reduce((s, r) => s + (r.pediatric_count ?? r.pediatric ?? 0), 0);
  const grandTotal     = totalMale + totalFemale + totalPediatric;

  const summaryY = metaY + 8;
  doc.setFillColor(209, 250, 229);
  doc.roundedRect(14, summaryY, 182, 14, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(6, 95, 70);
  doc.text(`Male: ${totalMale}`,           20,  summaryY + 9);
  doc.text(`Female: ${totalFemale}`,        68,  summaryY + 9);
  doc.text(`Pediatric: ${totalPediatric}`, 116,  summaryY + 9);
  doc.text(`Grand Total: ${grandTotal}`,   162,  summaryY + 9);

  // ── TABLE ─────────────────────────────────────────────────────────────
  const tableStartY   = summaryY + 20;
  const hasDoctor     = data.some(r => r.doctor?.name || r.doctor);
  const hasDepartment = data.some(r => r.department?.name || r.department);

  const columns: string[] = ['Date'];
  if (hasDoctor)     columns.push('Doctor');
  if (hasDepartment) columns.push('Department');
  columns.push('Status', 'Male', 'Female', 'Pediatric', 'Total', 'Remarks');

  const rows = data.map(r => {
    // normalise — accept both raw DB shape and pre-mapped shape
    const status     = r.status || 'present';
    const isOff      = status === 'absent' || status === 'leave';
    const male       = r.male_count      ?? r.male      ?? 0;
    const female     = r.female_count    ?? r.female    ?? 0;
    const pediatric  = r.pediatric_count ?? r.pediatric ?? 0;
    const total      = male + female + pediatric;
    // ── doctor / department name ──────────────────────────────────────
    const doctorCol  = r.doctor?.name  ?? r.doctor  ?? '-';
    const deptCol    = r.department?.name ?? r.department ?? '-';
    // ── remarks: use whatever field is present ─────────────────────────
    const remarks    = r.remarks ?? r.remark ?? '';

    const row: (string | number)[] = [
      (() => { try { return format(new Date(r.entry_date ?? r.date), 'dd MMM yyyy'); } catch { return r.entry_date ?? r.date ?? ''; } })(),
    ];
    if (hasDoctor)     row.push(doctorCol);
    if (hasDepartment) row.push(deptCol);

    row.push(
      status === 'absent' ? 'Absent' : status === 'leave' ? 'On Leave' : 'Present',
      isOff ? '-' : male,
      isOff ? '-' : female,
      isOff ? '-' : pediatric,
      isOff ? 'N/A' : total,
      remarks,          // ← always included now, never dropped
    );
    return row;
  });

  const statusColIdx = 1 + (hasDoctor ? 1 : 0) + (hasDepartment ? 1 : 0);

  autoTable(doc, {
    startY: tableStartY,
    head: [columns],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles:         { fontSize: 8, textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    styles:             { cellPadding: 2.5, overflow: 'linebreak' },
    columnStyles: {
      [columns.length - 1]: { cellWidth: 32 }, // Remarks column
    },
    didParseCell(hookData) {
      if (hookData.section !== 'body') return;
      const statusCell = hookData.row.cells[statusColIdx];
      if (!statusCell) return;
      const val = String(statusCell.raw || '');
      if (val === 'Absent') {
        hookData.cell.styles.fillColor = [254, 226, 226];
        hookData.cell.styles.textColor = [185, 28, 28];
        hookData.cell.styles.fontStyle = 'bold';
      } else if (val === 'On Leave') {
        hookData.cell.styles.fillColor = [255, 237, 213];
        hookData.cell.styles.textColor = [194, 65, 12];
        hookData.cell.styles.fontStyle = 'bold';
      }
    },
    foot: [[
      'TOTAL',
      ...(hasDoctor     ? [''] : []),
      ...(hasDepartment ? [''] : []),
      '',
      String(totalMale),
      String(totalFemale),
      String(totalPediatric),
      String(grandTotal),
      '',
    ]],
    footStyles: { fillColor: [6, 95, 70], textColor: 255, fontStyle: 'bold', fontSize: 8 },
  });

  // ── PAGE FOOTER ───────────────────────────────────────────────────────
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(160);
    doc.text(
      `Page ${i} of ${pageCount}   |   ${HOSPITAL_NAME}`,
      105, doc.internal.pageSize.height - 7, { align: 'center' }
    );
  }

  doc.save(`report_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
}
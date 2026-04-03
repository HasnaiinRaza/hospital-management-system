import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

// ── Collapse present entries per doctor into one row ─────────────────────────
function buildPDFRows(data: any[]) {
  // Map: doctorId → aggregated present record
  const presentMap: Record<string, {
  doctorName:    string;
  deptNames:     string[];
  dates:         string[];
  remarks:       string[];
  reportsTotal:  number;   // ← ADD
  male:          number;
  female:        number;
  pediatric:     number;
}> = {};

  const offRows: any[] = [];

  for (const r of data) {
    const status = r.status || 'present';
    if (status === 'absent' || status === 'leave') {
      offRows.push(r);
    } else {
      const key      = r.doctor_id || r.doctor?.id || r.id;
      const male     = r.male_count      ?? r.male      ?? 0;
      const female   = r.female_count    ?? r.female    ?? 0;
      const pead     = r.pediatric_count ?? r.pediatric ?? 0;
      const deptName = r.department?.name ?? r.department ?? '';
      const dateStr  = r.entry_date ?? r.date ?? '';

    if (!presentMap[key]) {
  presentMap[key] = {
    doctorName:   r.doctor?.name ?? r.doctor ?? '—',
    deptNames:    [],
    dates:        [],
    remarks:      [],
    reportsTotal: 0,   // ← ADD
    male:         0,
    female:       0,
    pediatric:    0,
  };
}
      presentMap[key].male      += male;
      presentMap[key].female    += female;
      presentMap[key].pediatric += pead;
      presentMap[key].reportsTotal += (r.reports_count || 0);
      if (deptName && !presentMap[key].deptNames.includes(deptName))
        presentMap[key].deptNames.push(deptName);
      if (dateStr && !presentMap[key].dates.includes(dateStr))
        presentMap[key].dates.push(dateStr);
    }
  }

  return { presentCollapsed: Object.values(presentMap), offRows };
}

export async function generateReportPDF(
  data: any[],
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
  const LOGO_Y  = (HEADER_H - LOGO_H) / 2;
  const TEXT_X  = LOGO_X + LOGO_W + 5;
  const TEXT_W  = 210 - TEXT_X - 6;

  try {
    const base64 = await loadImageAsBase64(HOSPITAL_LOGO);
    doc.addImage(base64, 'PNG', LOGO_X, LOGO_Y, LOGO_W, LOGO_H);
  } catch { /* continue without logo */ }

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

  // ── SUMMARY BOX ──────────────────────────────────────────────────────
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

  // ── BUILD ROWS ────────────────────────────────────────────────────────
  const { presentCollapsed, offRows } = buildPDFRows(data);

  const hasDoctor = data.some(r => r.doctor?.name || r.doctor);

  // Columns: Doctor (optional) | Department | Days Present / Date | Status | M | F | P | Total | Remarks
  const columns: string[] = [];
  if (hasDoctor) columns.push('Doctor');
  columns.push('Department', 'Date / Days Present', 'Status', 'Male', 'Female', 'Pediatric', 'Total', 'Remarks');

  const tableRows: (string | number)[][] = [];

  // Present rows — one per doctor, collapsed
  for (const p of presentCollapsed) {
    const total = p.male + p.female + p.pediatric;
    // Sort dates and format as range or list
    const sortedDates = [...p.dates].sort();
    let dateLabel = '';
    if (sortedDates.length === 0) {
      dateLabel = '—';
    } else if (sortedDates.length === 1) {
      try { dateLabel = format(new Date(sortedDates[0]), 'dd MMM yyyy'); } catch { dateLabel = sortedDates[0]; }
    } else {
      try {
        const first = format(new Date(sortedDates[0]),                       'dd MMM yyyy');
        const last  = format(new Date(sortedDates[sortedDates.length - 1]), 'dd MMM yyyy');
        dateLabel   = `${first} – ${last}\n(${sortedDates.length} days)`;
      } catch { dateLabel = `${sortedDates.length} days`; }
    }

    const row: (string | number)[] = [];
    if (hasDoctor) row.push(`Dr. ${p.doctorName}`);
 const remarksParts: string[] = [];
if (p.reportsTotal > 0) remarksParts.push(`Reports: ${p.reportsTotal}`);
if (p.remarks.length > 0) remarksParts.push(...p.remarks);

row.push(
  p.deptNames.join(', ') || '—',
  dateLabel,
  'Present',
  p.male,
  p.female,
  p.pediatric,
  total,
  remarksParts.join(' | ') || '',   // ← shows "Reports: 5 | some remark"
);
    tableRows.push(row);
  }

  // Absent / Leave rows — individual with exact date + remarks
  for (const r of offRows) {
    const status    = r.status;
    const statusStr = status === 'absent' ? 'Absent' : 'On Leave';
    const dateStr   = (() => {
      try { return format(new Date(r.entry_date ?? r.date), 'dd MMM yyyy'); }
      catch { return r.entry_date ?? r.date ?? '—'; }
    })();
    const remarks   = r.remarks ?? r.remark ?? '';
    const deptName  = r.department?.name ?? r.department ?? '—';
    const docName   = r.doctor?.name     ?? r.doctor     ?? '—';

    const row: (string | number)[] = [];
    if (hasDoctor) row.push(`Dr. ${docName}`);
    row.push(deptName, dateStr, statusStr, '-', '-', '-', 'N/A', remarks);
    tableRows.push(row);
  }

  // Status column index (for colour coding)
  const statusColIdx = (hasDoctor ? 1 : 0) + 2; // after Doctor(opt), Department, Date

  autoTable(doc, {
    startY: summaryY + 20,
    head:   [columns],
    body:   tableRows,
    theme:  'striped',
    headStyles:         { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles:         { fontSize: 8, textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    styles:             { cellPadding: 2.5, overflow: 'linebreak' },
    columnStyles: {
      [columns.length - 1]: { cellWidth: 32 }, // Remarks
    },
    didParseCell(hookData) {
      if (hookData.section !== 'body') return;
      const statusCell = hookData.row.cells[statusColIdx];
      if (!statusCell) return;
      const val = String(statusCell.raw || '');
      if (val === 'Absent') {
        hookData.cell.styles.fillColor = [254, 226, 226];
        hookData.cell.styles.textColor = [185, 28,  28];
        hookData.cell.styles.fontStyle = 'bold';
      } else if (val === 'On Leave') {
        hookData.cell.styles.fillColor = [255, 237, 213];
        hookData.cell.styles.textColor = [194, 65,  12];
        hookData.cell.styles.fontStyle = 'bold';
      } else if (val === 'Present') {
        hookData.cell.styles.fillColor = [209, 250, 229];
        hookData.cell.styles.textColor = [6,   95,  70];
        hookData.cell.styles.fontStyle = 'bold';
      }
    },
    foot: [[
      ...(hasDoctor ? [''] : []),
      '', 'TOTAL', '',
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

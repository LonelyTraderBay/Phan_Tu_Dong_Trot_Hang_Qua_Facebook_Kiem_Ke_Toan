import ExcelJS from 'exceljs';

export type ExportOrderRow = {
  id: string;
  status: string;
  customerName: string | null;
  phoneE164: string | null;
  paymentMethod: string;
  totalVnd: string;
  createdAt: string;
  confirmedAt: string | null;
  shippedAt: string | null;
};

export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

export type ExportFile = {
  buffer: Buffer;
  contentType: string;
  filename: string;
};

const HEADERS = [
  'Order ID',
  'Status',
  'Customer Name',
  'Phone',
  'Payment Method',
  'Total (VND)',
  'Created At',
  'Confirmed At',
  'Shipped At',
] as const;

function toCells(row: ExportOrderRow) {
  return [
    row.id,
    row.status,
    row.customerName ?? '',
    row.phoneE164 ?? '',
    row.paymentMethod,
    row.totalVnd,
    row.createdAt,
    row.confirmedAt ?? '',
    row.shippedAt ?? '',
  ];
}

function escapeCsvCell(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildOrdersCsv(rows: ExportOrderRow[]): Buffer {
  const lines = [
    HEADERS.join(','),
    ...rows.map((row) => toCells(row).map(String).map(escapeCsvCell).join(',')),
  ];
  return Buffer.from(`${lines.join('\n')}\n`, 'utf8');
}

export async function buildOrdersXlsx(rows: ExportOrderRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Orders');
  sheet.addRow([...HEADERS]);
  for (const row of rows) {
    sheet.addRow(toCells(row));
  }
  sheet.getRow(1).font = { bold: true };
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

function pdfEscape(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

export function buildOrdersPdf(rows: ExportOrderRow[]): Buffer {
  const textLines = [
    'Orders Export',
    '',
    ...rows.map(
      (row) =>
        `${row.id} | ${row.status} | ${row.customerName ?? '-'} | ${row.totalVnd} VND`,
    ),
  ];
  if (rows.length === 0) {
    textLines.push('(no orders)');
  }

  let y = 750;
  const content: string[] = ['BT', '/F1 10 Tf'];
  for (const line of textLines) {
    content.push(`50 ${y} Td (${pdfEscape(line)}) Tj`);
    content.push('0 -14 Td');
    y -= 14;
    if (y < 50) {
      break;
    }
  }
  content.push('ET');
  const stream = content.join('\n');
  const streamLength = Buffer.byteLength(stream, 'utf8');

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${stream}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += object;
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let index = 1; index <= objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, 'utf8');
}

export function buildOrdersExport(
  format: ExportFormat,
  rows: ExportOrderRow[],
): Promise<ExportFile> | ExportFile {
  switch (format) {
    case 'csv':
      return {
        buffer: buildOrdersCsv(rows),
        contentType: 'text/csv; charset=utf-8',
        filename: 'orders.csv',
      };
    case 'xlsx':
      return buildOrdersXlsx(rows).then((buffer) => ({
        buffer,
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: 'orders.xlsx',
      }));
    case 'pdf':
      return {
        buffer: buildOrdersPdf(rows),
        contentType: 'application/pdf',
        filename: 'orders.pdf',
      };
  }
}

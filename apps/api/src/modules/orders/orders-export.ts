import ExcelJS from 'exceljs';

export type ExportOrderRow = {
  id: string;
  status: string;
  customerName: string | null;
  phoneE164: string | null;
  addressText: string | null;
  paymentMethod: string;
  totalVnd: string;
  createdAt: string;
  confirmedAt: string | null;
  shippedAt: string | null;
  sku: string;
  qty: string;
  title: string;
};

export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

export type ExportFile = {
  buffer: Buffer;
  contentType: string;
  filename: string;
};

export const EXPORT_HEADERS = [
  'Mã đơn',
  'Trạng thái',
  'Tên khách',
  'Số điện thoại',
  'Địa chỉ',
  'Hình thức thanh toán',
  'Tổng tiền (VND)',
  'Ngày tạo',
  'Ngày xác nhận',
  'Ngày giao',
  'Mã SKU',
  'Số lượng',
  'Tên sản phẩm',
] as const;

function toCells(row: ExportOrderRow) {
  return [
    row.id,
    row.status,
    row.customerName ?? '',
    row.phoneE164 ?? '',
    row.addressText ?? '',
    row.paymentMethod,
    row.totalVnd,
    row.createdAt,
    row.confirmedAt ?? '',
    row.shippedAt ?? '',
    row.sku,
    row.qty,
    row.title,
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
    EXPORT_HEADERS.join(','),
    ...rows.map((row) => toCells(row).map(String).map(escapeCsvCell).join(',')),
  ];
  return Buffer.from(`${lines.join('\n')}\n`, 'utf8');
}

export async function buildOrdersXlsx(rows: ExportOrderRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Orders');
  sheet.addRow([...EXPORT_HEADERS]);
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

const PDF_LINES_PER_PAGE = 50;
const PDF_LINE_HEIGHT = 14;
const PDF_START_Y = 750;

function buildPdfPageStream(lines: string[]) {
  const content: string[] = ['BT', '/F1 9 Tf'];
  for (let index = 0; index < lines.length; index += 1) {
    if (index === 0) {
      content.push(`50 ${PDF_START_Y} Td (${pdfEscape(lines[index] ?? '')}) Tj`);
    } else {
      content.push(`0 -${PDF_LINE_HEIGHT} Td (${pdfEscape(lines[index] ?? '')}) Tj`);
    }
  }
  content.push('ET');
  return content.join('\n');
}

export function buildOrdersPdf(rows: ExportOrderRow[]): Buffer {
  const textLines = [
    'Xuất đơn hàng',
    '',
    ...rows.map(
      (row) =>
        `${row.id} | ${row.status} | ${row.customerName ?? '-'} | ${row.phoneE164 ?? '-'} | ${row.addressText ?? '-'} | ${row.sku} x${row.qty} ${row.title} | ${row.totalVnd} VND`,
    ),
  ];
  if (rows.length === 0) {
    textLines.push('(không có đơn)');
  }

  const pageLines: string[][] = [];
  for (let index = 0; index < textLines.length; index += PDF_LINES_PER_PAGE) {
    pageLines.push(textLines.slice(index, index + PDF_LINES_PER_PAGE));
  }

  const pageCount = pageLines.length;
  const fontObjectId = pageCount * 2 + 2;
  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    `2 0 obj\n<< /Type /Pages /Kids [${Array.from({ length: pageCount }, (_, index) => `${index * 2 + 3} 0 R`).join(' ')}] /Count ${pageCount} >>\nendobj\n`,
  ];

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    const pageObjectId = pageIndex * 2 + 3;
    const contentObjectId = pageIndex * 2 + 4;
    const stream = buildPdfPageStream(pageLines[pageIndex] ?? []);
    const streamLength = Buffer.byteLength(stream, 'utf8');
    objects.push(
      `${pageObjectId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentObjectId} 0 R /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> >>\nendobj\n`,
      `${contentObjectId} 0 obj\n<< /Length ${streamLength} >>\nstream\n${stream}\nendstream\nendobj\n`,
    );
  }

  objects.push(
    `${fontObjectId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`,
  );

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

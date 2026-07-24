'use client';

import { type CSSProperties, useCallback, useEffect, useState } from 'react';

import {
  ApiClientError,
  getPnlBySku,
  getPnlSummary,
  type PnlSku,
  type PnlSummary,
} from '../../../lib/api-client';
import { SESSION_CHANGED_EVENT } from '../../../lib/auth-session';

type DateRange = {
  from: string;
  to: string;
};

export default function PnlPage() {
  const [range, setRange] = useState<DateRange>(() => defaultRange());
  const [summary, setSummary] = useState<PnlSummary | null>(null);
  const [skuRows, setSkuRows] = useState<PnlSku[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [nextSummary, nextSkuRows] = await Promise.all([
        getPnlSummary(range),
        getPnlBySku(range),
      ]);
      setSummary(nextSummary);
      setSkuRows(nextSkuRows);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tải báo cáo lãi gộp.'));
      setSummary(null);
      setSkuRows([]);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    function handleSessionChanged() {
      void loadReport();
    }

    void loadReport();
    window.addEventListener(SESSION_CHANGED_EVENT, handleSessionChanged);
    window.addEventListener('storage', handleSessionChanged);

    return () => {
      window.removeEventListener(SESSION_CHANGED_EVENT, handleSessionChanged);
      window.removeEventListener('storage', handleSessionChanged);
    };
  }, [loadReport]);

  function handleDownloadCsv() {
    const rows = [
      ['type', 'key', 'revenueVnd', 'cogsVnd', 'grossProfitVnd', 'orderCount', 'qty'],
      ...(summary?.days ?? []).map((day) => [
        'day',
        day.day,
        day.revenueVnd,
        day.cogsVnd,
        day.grossProfitVnd,
        String(day.orderCount),
        '',
      ]),
      ...skuRows.map((sku) => [
        'sku',
        sku.sku,
        sku.revenueVnd,
        sku.cogsVnd,
        sku.grossProfitVnd,
        String(sku.orderCount),
        String(sku.qty),
      ]),
    ];
    downloadCsv(`pnl-${range.from}-${range.to}.csv`, rows);
  }

  return (
    <main>
      <header style={headerStyle}>
        <div>
          <h1 style={{ margin: 0, fontSize: 32 }}>Lãi gộp</h1>
          <p style={descriptionStyle}>
            Báo cáo doanh thu, COGS và lãi gộp cho đơn đã bán
            (shipped/done). Tiền dùng BIGINT VND, không dùng số lẻ.
          </p>
        </div>
        <div style={filterRowStyle}>
          <label style={labelStyle}>
            Từ ngày
            <input
              type="date"
              value={range.from}
              onChange={(event) =>
                setRange((current) => ({ ...current, from: event.target.value }))
              }
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Đến ngày
            <input
              type="date"
              value={range.to}
              onChange={(event) =>
                setRange((current) => ({ ...current, to: event.target.value }))
              }
              style={inputStyle}
            />
          </label>
          <button
            type="button"
            onClick={() => void loadReport()}
            disabled={loading}
            style={secondaryButtonStyle}
          >
            {loading ? 'Đang tải...' : 'Tải lại'}
          </button>
          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={loading || (!summary && skuRows.length === 0)}
            style={secondaryButtonStyle}
          >
            Tải CSV
          </button>
        </div>
      </header>

      {error ? (
        <p role="alert" style={alertStyle}>
          {error}
        </p>
      ) : null}

      <section style={summaryGridStyle}>
        <SummaryCard
          label="Doanh thu"
          value={formatVnd(summary?.revenueVnd ?? '0')}
        />
        <SummaryCard label="COGS" value={formatVnd(summary?.cogsVnd ?? '0')} />
        <SummaryCard
          label="Lãi gộp"
          value={formatVnd(summary?.grossProfitVnd ?? '0')}
        />
        <SummaryCard label="Đơn đã bán" value={String(summary?.orderCount ?? 0)} />
      </section>

      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>Theo ngày</h2>
        {loading ? (
          <p style={mutedStyle}>Đang tải lãi gộp theo ngày...</p>
        ) : !summary || summary.days.length === 0 ? (
          <p style={emptyStyle}>Chưa có đơn shipped/done trong khoảng ngày này.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Ngày</th>
                  <th style={tableHeaderStyle}>Đơn</th>
                  <th style={tableHeaderStyle}>Doanh thu</th>
                  <th style={tableHeaderStyle}>COGS</th>
                  <th style={tableHeaderStyle}>Lãi gộp</th>
                </tr>
              </thead>
              <tbody>
                {summary.days.map((day) => (
                  <tr key={day.day}>
                    <td style={tableCellStyle}>{formatDay(day.day)}</td>
                    <td style={tableCellStyle}>{day.orderCount}</td>
                    <td style={tableCellStyle}>{formatVnd(day.revenueVnd)}</td>
                    <td style={tableCellStyle}>{formatVnd(day.cogsVnd)}</td>
                    <td style={tableCellStyle}>
                      <span style={profitStyle(day.grossProfitVnd)}>
                        {formatVnd(day.grossProfitVnd)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>Theo SKU</h2>
        {loading ? (
          <p style={mutedStyle}>Đang tải lãi gộp theo SKU...</p>
        ) : skuRows.length === 0 ? (
          <p style={emptyStyle}>Chưa có SKU bán trong khoảng ngày này.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>SKU</th>
                  <th style={tableHeaderStyle}>SL</th>
                  <th style={tableHeaderStyle}>Đơn</th>
                  <th style={tableHeaderStyle}>Doanh thu dòng</th>
                  <th style={tableHeaderStyle}>COGS</th>
                  <th style={tableHeaderStyle}>Lãi gộp</th>
                </tr>
              </thead>
              <tbody>
                {skuRows.map((sku) => (
                  <tr key={sku.sku}>
                    <td style={tableCellStyle}>{sku.sku}</td>
                    <td style={tableCellStyle}>{sku.qty}</td>
                    <td style={tableCellStyle}>{sku.orderCount}</td>
                    <td style={tableCellStyle}>{formatVnd(sku.revenueVnd)}</td>
                    <td style={tableCellStyle}>{formatVnd(sku.cogsVnd)}</td>
                    <td style={tableCellStyle}>
                      <span style={profitStyle(sku.grossProfitVnd)}>
                        {formatVnd(sku.grossProfitVnd)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={summaryCardStyle}>
      <span style={mutedStyle}>{label}</span>
      <strong style={{ color: '#0f172a', fontSize: 22 }}>{value}</strong>
    </div>
  );
}

function defaultRange(): DateRange {
  const to = new Date();
  const from = new Date(to);
  from.setDate(to.getDate() - 6);
  return {
    from: toDateInputValue(from),
    to: toDateInputValue(to),
  };
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getApiErrorMessage(err: unknown, fallback: string) {
  return err instanceof ApiClientError ? err.message : fallback;
}

function formatDay(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatVnd(value: string) {
  const sign = value.startsWith('-') ? '-' : '';
  const digits = sign ? value.slice(1) : value;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}${grouped} đ`;
}

function profitStyle(value: string): CSSProperties {
  return {
    color: value.startsWith('-') ? '#b91c1c' : '#15803d',
    fontWeight: 800,
  };
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${cell.replace(/"/g, '""')}"`)
        .join(','),
    )
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

const headerStyle: CSSProperties = {
  alignItems: 'flex-start',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 16,
  justifyContent: 'space-between',
};

const descriptionStyle: CSSProperties = {
  color: '#475569',
  fontSize: 18,
  maxWidth: 780,
};

const filterRowStyle: CSSProperties = {
  alignItems: 'flex-end',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
};

const labelStyle: CSSProperties = {
  color: '#334155',
  display: 'flex',
  flexDirection: 'column',
  fontSize: 13,
  fontWeight: 700,
  gap: 6,
};

const inputStyle: CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  color: '#0f172a',
  font: 'inherit',
  padding: '9px 10px',
};

const summaryGridStyle: CSSProperties = {
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  marginTop: 24,
};

const summaryCardStyle: CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: 16,
};

const panelStyle: CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  marginTop: 24,
  padding: 20,
};

const sectionTitleStyle: CSSProperties = {
  color: '#0f172a',
  fontSize: 22,
  margin: '0 0 16px',
};

const tableStyle: CSSProperties = {
  borderCollapse: 'collapse',
  minWidth: 860,
  width: '100%',
};

const tableHeaderStyle: CSSProperties = {
  borderBottom: '1px solid #e2e8f0',
  color: '#334155',
  fontSize: 14,
  fontWeight: 700,
  padding: '12px 16px',
  textAlign: 'left',
};

const tableCellStyle: CSSProperties = {
  borderBottom: '1px solid #f1f5f9',
  color: '#0f172a',
  fontSize: 15,
  padding: '12px 16px',
};

const secondaryButtonStyle: CSSProperties = {
  background: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  color: '#0f172a',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 700,
  padding: '9px 12px',
};

const mutedStyle: CSSProperties = {
  color: '#64748b',
  fontSize: 14,
};

const emptyStyle: CSSProperties = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  color: '#64748b',
  padding: 16,
};

const alertStyle: CSSProperties = {
  color: '#b91c1c',
  fontSize: 16,
  marginTop: 20,
};

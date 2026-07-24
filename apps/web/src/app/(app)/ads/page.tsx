'use client';

import { type CSSProperties, useCallback, useEffect, useState } from 'react';

import {
  ApiClientError,
  getAdSpendSummary,
  importAdSpendCsv,
  listAdSpend,
  type AdSpendRecord,
  type AdSpendSummary,
} from '../../../lib/api-client';
import { SESSION_CHANGED_EVENT } from '../../../lib/auth-session';

type DateRange = {
  from: string;
  to: string;
};

const SAMPLE_CSV = 'date,campaign,amount_vnd\n2026-07-25,Meta prospecting,150000';

export default function AdsPage() {
  const [range, setRange] = useState<DateRange>(() => defaultRange());
  const [csv, setCsv] = useState(SAMPLE_CSV);
  const [rows, setRows] = useState<AdSpendRecord[]>([]);
  const [summary, setSummary] = useState<AdSpendSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAds = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [nextRows, nextSummary] = await Promise.all([
        listAdSpend({ ...range, limit: 200 }),
        getAdSpendSummary(range),
      ]);
      setRows(nextRows);
      setSummary(nextSummary);
    } catch (err) {
      setRows([]);
      setSummary(null);
      setError(getApiErrorMessage(err, 'Không thể tải chi phí ads.'));
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    function handleSessionChanged() {
      void loadAds();
    }

    void loadAds();
    window.addEventListener(SESSION_CHANGED_EVENT, handleSessionChanged);
    window.addEventListener('storage', handleSessionChanged);

    return () => {
      window.removeEventListener(SESSION_CHANGED_EVENT, handleSessionChanged);
      window.removeEventListener('storage', handleSessionChanged);
    };
  }, [loadAds]);

  async function handleImport() {
    setImporting(true);
    setMessage(null);
    setError(null);

    try {
      const result = await importAdSpendCsv(csv);
      setMessage(`Đã import ${result.importedCount} dòng chi phí ads.`);
      await loadAds();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể import CSV ads.'));
    } finally {
      setImporting(false);
    }
  }

  async function handleFileUpload(file: File | null) {
    if (!file) {
      return;
    }
    setCsv(await file.text());
  }

  return (
    <main>
      <header style={headerStyle}>
        <div>
          <h1 style={{ margin: 0, fontSize: 32 }}>Chi phí ads</h1>
          <p style={descriptionStyle}>
            Import CSV theo mẫu <code>date,campaign,amount_vnd</code>. Số tiền là
            BIGINT VND, không dùng số lẻ. Meta Ads API sẽ nối sau; hiện tại dùng
            CSV/JSON batch qua Core API.
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
            onClick={() => void loadAds()}
            disabled={loading}
            style={secondaryButtonStyle}
          >
            {loading ? 'Đang tải...' : 'Tải lại'}
          </button>
        </div>
      </header>

      {message ? (
        <p role="status" style={statusStyle}>
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" style={alertStyle}>
          {error}
        </p>
      ) : null}

      <section style={summaryGridStyle}>
        <SummaryCard
          label="Tổng chi ads"
          value={formatVnd(summary?.totalVnd ?? '0')}
        />
        <SummaryCard
          label="Số ngày có ads"
          value={String(summary?.days.length ?? 0)}
        />
        <SummaryCard label="Dòng gần đây" value={String(rows.length)} />
      </section>

      <section style={panelStyle}>
        <div style={sectionHeaderStyle}>
          <div>
            <h2 style={sectionTitleStyle}>Import CSV</h2>
            <p style={mutedStyle}>
              Header bắt buộc: <code>date,campaign,amount_vnd</code>. Có thể thêm
              <code> external_id</code> nếu dữ liệu đến từ nguồn ngoài.
            </p>
          </div>
          <label style={uploadButtonStyle}>
            Chọn file CSV
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => void handleFileUpload(event.target.files?.[0] ?? null)}
              style={{ display: 'none' }}
            />
          </label>
        </div>
        <textarea
          value={csv}
          onChange={(event) => setCsv(event.target.value)}
          rows={8}
          style={textareaStyle}
        />
        <div style={{ marginTop: 12 }}>
          <button
            type="button"
            onClick={() => void handleImport()}
            disabled={importing || !csv.trim()}
            style={primaryButtonStyle}
          >
            {importing ? 'Đang import...' : 'Import chi phí ads'}
          </button>
        </div>
      </section>

      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>Tổng theo ngày</h2>
        {loading ? (
          <p style={mutedStyle}>Đang tải tổng ads theo ngày...</p>
        ) : !summary || summary.days.length === 0 ? (
          <p style={emptyStyle}>Chưa có chi phí ads trong khoảng ngày này.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Ngày</th>
                  <th style={tableHeaderStyle}>Chi phí ads</th>
                </tr>
              </thead>
              <tbody>
                {summary.days.map((day) => (
                  <tr key={day.day}>
                    <td style={tableCellStyle}>{formatDay(day.day)}</td>
                    <td style={tableCellStyle}>{formatVnd(day.amountVnd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>Dòng đã import</h2>
        {loading ? (
          <p style={mutedStyle}>Đang tải danh sách ads...</p>
        ) : rows.length === 0 ? (
          <p style={emptyStyle}>Chưa có dòng ads nào trong khoảng ngày này.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Ngày</th>
                  <th style={tableHeaderStyle}>Campaign</th>
                  <th style={tableHeaderStyle}>Nguồn</th>
                  <th style={tableHeaderStyle}>Số tiền</th>
                  <th style={tableHeaderStyle}>External ID</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td style={tableCellStyle}>{formatDay(row.date)}</td>
                    <td style={tableCellStyle}>{row.campaignName}</td>
                    <td style={tableCellStyle}>{formatSource(row.source)}</td>
                    <td style={tableCellStyle}>{formatVnd(row.amountVnd)}</td>
                    <td style={tableCellStyle}>{row.externalId ?? '-'}</td>
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

function formatSource(source: string) {
  return source === 'meta_ads' ? 'Meta Ads' : 'CSV';
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
  maxWidth: 820,
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

const sectionHeaderStyle: CSSProperties = {
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  justifyContent: 'space-between',
};

const sectionTitleStyle: CSSProperties = {
  color: '#0f172a',
  fontSize: 22,
  margin: '0 0 16px',
};

const textareaStyle: CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 10,
  color: '#0f172a',
  font: '14px/1.5 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  marginTop: 12,
  padding: 12,
  width: '100%',
};

const tableStyle: CSSProperties = {
  borderCollapse: 'collapse',
  minWidth: 760,
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

const primaryButtonStyle: CSSProperties = {
  background: '#2563eb',
  border: '1px solid #2563eb',
  borderRadius: 8,
  color: '#ffffff',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 700,
  padding: '9px 12px',
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

const uploadButtonStyle: CSSProperties = {
  ...secondaryButtonStyle,
  display: 'inline-flex',
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

const statusStyle: CSSProperties = {
  background: '#ecfdf5',
  border: '1px solid #bbf7d0',
  borderRadius: 12,
  color: '#047857',
  marginTop: 20,
  padding: 12,
};

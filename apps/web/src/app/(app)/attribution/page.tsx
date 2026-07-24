'use client';

import { type CSSProperties, useCallback, useEffect, useState } from 'react';

import {
  ApiClientError,
  getAttributionSummary,
  type AttributionSummary,
} from '../../../lib/api-client';
import { SESSION_CHANGED_EVENT } from '../../../lib/auth-session';

type DateRange = {
  from: string;
  to: string;
};

export default function AttributionPage() {
  const [range, setRange] = useState<DateRange>(() => defaultRange());
  const [summary, setSummary] = useState<AttributionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setSummary(await getAttributionSummary(range));
    } catch (err) {
      setSummary(null);
      setError(getApiErrorMessage(err, 'Không thể tải attribution.'));
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    function handleSessionChanged() {
      void loadSummary();
    }

    void loadSummary();
    window.addEventListener(SESSION_CHANGED_EVENT, handleSessionChanged);
    window.addEventListener('storage', handleSessionChanged);

    return () => {
      window.removeEventListener(SESSION_CHANGED_EVENT, handleSessionChanged);
      window.removeEventListener('storage', handleSessionChanged);
    };
  }, [loadSummary]);

  return (
    <main>
      <header style={headerStyle}>
        <div>
          <h1 style={{ margin: 0, fontSize: 32 }}>Attribution đơn hàng</h1>
          <p style={descriptionStyle}>
            Báo cáo MVP theo <code>utm_source</code> lưu trên đơn khi tạo. Đây
            là first-touch-enough cho Plan G; không tính CPC hay tối ưu ads tự
            động.
          </p>
        </div>
        <div style={filterRowStyle}>
          <label style={labelStyle}>
            Từ ngày
            <input
              type="date"
              value={range.from}
              onChange={(event) =>
                setRange((current) => ({
                  ...current,
                  from: event.target.value,
                }))
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
            onClick={() => void loadSummary()}
            disabled={loading}
            style={secondaryButtonStyle}
          >
            {loading ? 'Đang tải...' : 'Tải lại'}
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
          label="Tổng đơn trong kỳ"
          value={String(summary?.totalOrders ?? 0)}
        />
        <SummaryCard
          label="Tổng giá trị đơn"
          value={formatVnd(summary?.totalRevenueVnd ?? '0')}
        />
        <SummaryCard
          label="Số nguồn"
          value={String(summary?.sources.length ?? 0)}
        />
      </section>

      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>Nguồn tạo đơn</h2>
        {loading ? (
          <p style={mutedStyle}>Đang tải attribution...</p>
        ) : !summary || summary.sources.length === 0 ? (
          <p style={emptyStyle}>Chưa có đơn hàng trong khoảng ngày này.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>utm_source</th>
                  <th style={tableHeaderStyle}>Số đơn</th>
                  <th style={tableHeaderStyle}>Giá trị đơn</th>
                </tr>
              </thead>
              <tbody>
                {summary.sources.map((source) => (
                  <tr key={source.utmSource ?? 'unknown'}>
                    <td style={tableCellStyle}>{source.label}</td>
                    <td style={tableCellStyle}>{source.orderCount}</td>
                    <td style={tableCellStyle}>
                      {formatVnd(source.revenueVnd)}
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
  from.setDate(to.getDate() - 29);
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
  gap: 12,
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
  padding: '10px 12px',
};

const secondaryButtonStyle: CSSProperties = {
  background: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  color: '#0f172a',
  cursor: 'pointer',
  fontWeight: 700,
  padding: '10px 14px',
};

const alertStyle: CSSProperties = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: 12,
  color: '#b91c1c',
  marginTop: 16,
  padding: 16,
};

const summaryGridStyle: CSSProperties = {
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  marginTop: 24,
};

const summaryCardStyle: CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: 20,
};

const panelStyle: CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  marginTop: 24,
  padding: 20,
};

const sectionTitleStyle: CSSProperties = {
  color: '#0f172a',
  fontSize: 22,
  margin: 0,
};

const mutedStyle: CSSProperties = {
  color: '#64748b',
};

const emptyStyle: CSSProperties = {
  background: '#f8fafc',
  borderRadius: 12,
  color: '#64748b',
  padding: 16,
};

const tableStyle: CSSProperties = {
  borderCollapse: 'collapse',
  marginTop: 16,
  minWidth: 640,
  width: '100%',
};

const tableHeaderStyle: CSSProperties = {
  borderBottom: '1px solid #e2e8f0',
  color: '#475569',
  fontSize: 13,
  padding: '10px 8px',
  textAlign: 'left',
};

const tableCellStyle: CSSProperties = {
  borderBottom: '1px solid #f1f5f9',
  color: '#0f172a',
  padding: '12px 8px',
};

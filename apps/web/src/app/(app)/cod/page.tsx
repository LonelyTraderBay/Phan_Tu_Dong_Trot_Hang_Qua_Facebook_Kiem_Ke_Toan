'use client';

import { type CSSProperties, useCallback, useEffect, useState } from 'react';

import {
  ApiClientError,
  getCodReport,
  reconcileCodBatch,
  reconcileCodOrder,
  recordCodCollection,
  type CodExpectation,
  type CodReport,
} from '../../../lib/api-client';
import { SESSION_CHANGED_EVENT } from '../../../lib/auth-session';

export default function CodPage() {
  const [report, setReport] = useState<CodReport | null>(null);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [batching, setBatching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const next = await getCodReport();
      setReport(next);
      setAmounts((current) => defaultAmounts(next.expectations, current));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tải báo cáo COD.'));
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

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

  async function handleRecordCollection(expectation: CodExpectation) {
    const amountVnd = amounts[expectation.orderId]?.trim() ?? '';
    if (!/^\d+$/.test(amountVnd)) {
      setError('Số tiền thu COD phải là VND nguyên, không dùng số lẻ.');
      return;
    }

    setBusyOrderId(expectation.orderId);
    setError(null);
    setMessage(null);

    try {
      await recordCodCollection({
        orderId: expectation.orderId,
        amountVnd,
        note: notes[expectation.orderId],
      });
      const result = await reconcileCodOrder(expectation.orderId);
      setMessage(
        result.discrepancy
          ? `Đã ghi nhận thu COD, còn lệch ${formatVnd(
              result.summary.deltaVnd,
            )}.`
          : 'Đã ghi nhận thu COD và đối soát khớp.',
      );
      setNotes((current) => ({ ...current, [expectation.orderId]: '' }));
      await loadReport();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể ghi nhận thu COD.'));
    } finally {
      setBusyOrderId(null);
    }
  }

  async function handleBatchReconcile() {
    setBatching(true);
    setError(null);
    setMessage(null);

    try {
      const result = await reconcileCodBatch();
      setMessage(`Đã đối soát ${result.reconciled} đơn COD.`);
      await loadReport();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể đối soát COD.'));
    } finally {
      setBatching(false);
    }
  }

  const summary = report?.summary;

  return (
    <main>
      <header style={headerStyle}>
        <div>
          <h1 style={{ margin: 0, fontSize: 32 }}>Đối soát COD</h1>
          <p style={descriptionStyle}>
            Theo dõi tiền COD dự kiến theo `orders.total_vnd`, ghi nhận tiền đã
            thu và xử lý hàng đợi lệch cho chủ shop/kho.
          </p>
        </div>
        <div style={buttonRowStyle}>
          <button
            type="button"
            onClick={() => void handleBatchReconcile()}
            disabled={batching || loading}
            style={secondaryButtonStyle}
          >
            {batching ? 'Đang đối soát...' : 'Đối soát tất cả'}
          </button>
          <button
            type="button"
            onClick={() => void loadReport()}
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
      {message ? (
        <p role="status" style={successStyle}>
          {message}
        </p>
      ) : null}

      <section style={summaryGridStyle}>
        <SummaryCard label="COD mở" value={String(summary?.openCount ?? 0)} />
        <SummaryCard
          label="Đơn đang lệch"
          value={String(summary?.discrepancyCount ?? 0)}
        />
        <SummaryCard
          label="Dự kiến thu"
          value={formatVnd(summary?.expectedVnd ?? '0')}
        />
        <SummaryCard
          label="Đã ghi nhận"
          value={formatVnd(summary?.collectedVnd ?? '0')}
        />
      </section>

      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>COD đang mở</h2>
        {loading ? (
          <p style={mutedStyle}>Đang tải danh sách COD...</p>
        ) : !report || report.expectations.length === 0 ? (
          <p style={emptyStyle}>Không có đơn COD cần đối soát.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Mã đơn</th>
                  <th style={tableHeaderStyle}>Khách</th>
                  <th style={tableHeaderStyle}>Trạng thái COD</th>
                  <th style={tableHeaderStyle}>Dự kiến</th>
                  <th style={tableHeaderStyle}>Đã thu</th>
                  <th style={tableHeaderStyle}>Lệch</th>
                  <th style={tableHeaderStyle}>Ghi nhận thu</th>
                </tr>
              </thead>
              <tbody>
                {report.expectations.map((expectation) => (
                  <tr key={expectation.id}>
                    <td style={tableCellStyle}>{shortId(expectation.orderId)}</td>
                    <td style={tableCellStyle}>
                      <strong>
                        {expectation.order?.customerName ?? 'Khách chưa đặt tên'}
                      </strong>
                      <br />
                      <span style={mutedStyle}>
                        {expectation.order?.phoneE164 ?? 'Chưa có SĐT'}
                      </span>
                    </td>
                    <td style={tableCellStyle}>{formatCodStatus(expectation.status)}</td>
                    <td style={tableCellStyle}>
                      {formatVnd(expectation.expectedVnd)}
                    </td>
                    <td style={tableCellStyle}>
                      {formatVnd(expectation.collectedVnd)}
                    </td>
                    <td style={tableCellStyle}>
                      <span style={deltaStyle(expectation.deltaVnd)}>
                        {formatVnd(expectation.deltaVnd)}
                      </span>
                    </td>
                    <td style={tableCellStyle}>
                      <div style={collectionFormStyle}>
                        <input
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={amounts[expectation.orderId] ?? ''}
                          onChange={(event) =>
                            setAmounts((current) => ({
                              ...current,
                              [expectation.orderId]: event.target.value,
                            }))
                          }
                          style={inputStyle}
                          aria-label={`Số tiền COD thu cho đơn ${shortId(
                            expectation.orderId,
                          )}`}
                        />
                        <input
                          value={notes[expectation.orderId] ?? ''}
                          onChange={(event) =>
                            setNotes((current) => ({
                              ...current,
                              [expectation.orderId]: event.target.value,
                            }))
                          }
                          placeholder="Ghi chú"
                          style={inputStyle}
                        />
                        <button
                          type="button"
                          onClick={() => void handleRecordCollection(expectation)}
                          disabled={busyOrderId === expectation.orderId}
                          style={linkButtonStyle}
                        >
                          {busyOrderId === expectation.orderId
                            ? 'Đang lưu...'
                            : 'Ghi nhận'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>Hàng đợi lệch COD</h2>
        {!report || report.discrepancies.length === 0 ? (
          <p style={emptyStyle}>Chưa có lệch COD mở.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Mã đơn</th>
                  <th style={tableHeaderStyle}>Dự kiến</th>
                  <th style={tableHeaderStyle}>Đã thu</th>
                  <th style={tableHeaderStyle}>Lệch</th>
                  <th style={tableHeaderStyle}>Ghi chú</th>
                  <th style={tableHeaderStyle}>Tạo lúc</th>
                </tr>
              </thead>
              <tbody>
                {report.discrepancies.map((item) => (
                  <tr key={item.id}>
                    <td style={tableCellStyle}>{shortId(item.orderId)}</td>
                    <td style={tableCellStyle}>{formatVnd(item.expectedVnd)}</td>
                    <td style={tableCellStyle}>{formatVnd(item.collectedVnd)}</td>
                    <td style={tableCellStyle}>
                      <span style={deltaStyle(item.deltaVnd)}>
                        {formatVnd(item.deltaVnd)}
                      </span>
                    </td>
                    <td style={tableCellStyle}>{item.note ?? '-'}</td>
                    <td style={tableCellStyle}>{formatDateTime(item.createdAt)}</td>
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

function defaultAmounts(
  expectations: CodExpectation[],
  current: Record<string, string>,
) {
  const next = { ...current };
  for (const expectation of expectations) {
    if (next[expectation.orderId] !== undefined) {
      continue;
    }
    next[expectation.orderId] = remainingVnd(expectation);
  }
  return next;
}

function remainingVnd(expectation: CodExpectation) {
  const expected = BigInt(expectation.expectedVnd);
  const collected = BigInt(expectation.collectedVnd);
  const remaining = expected - collected;
  return remaining > 0n ? remaining.toString() : expectation.expectedVnd;
}

function getApiErrorMessage(err: unknown, fallback: string) {
  return err instanceof ApiClientError ? err.message : fallback;
}

function shortId(id: string) {
  return id.slice(0, 8);
}

function formatCodStatus(status: string) {
  const labels: Record<string, string> = {
    open: 'Đang chờ thu',
    matched: 'Đã khớp',
    discrepancy: 'Đang lệch',
    written_off: 'Đã xoá lệch',
  };

  return labels[status] ?? status;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatVnd(value: string) {
  const sign = value.startsWith('-') ? '-' : '';
  const digits = sign ? value.slice(1) : value;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}${grouped} đ`;
}

function deltaStyle(value: string): CSSProperties {
  if (value === '0') {
    return { color: '#15803d', fontWeight: 800 };
  }
  return { color: '#b91c1c', fontWeight: 800 };
}

const headerStyle: CSSProperties = {
  alignItems: 'flex-start',
  display: 'flex',
  gap: 16,
  justifyContent: 'space-between',
};

const descriptionStyle: CSSProperties = {
  color: '#475569',
  fontSize: 18,
  maxWidth: 780,
};

const buttonRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
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
  minWidth: 980,
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
  verticalAlign: 'top',
};

const collectionFormStyle: CSSProperties = {
  display: 'grid',
  gap: 8,
  minWidth: 220,
};

const inputStyle: CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  color: '#0f172a',
  font: 'inherit',
  padding: '8px 10px',
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

const linkButtonStyle: CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#2563eb',
  cursor: 'pointer',
  font: 'inherit',
  fontWeight: 800,
  padding: 0,
  textAlign: 'left',
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

const successStyle: CSSProperties = {
  color: '#15803d',
  fontSize: 16,
  marginTop: 20,
};

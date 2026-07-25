'use client';

import { type CSSProperties, type FormEvent, useCallback, useEffect, useState } from 'react';

import {
  ApiClientError,
  issueEinvoice,
  listEinvoiceJobs,
  type EinvoiceJob,
} from '../../../lib/api-client';
import { SESSION_CHANGED_EVENT } from '../../../lib/auth-session';

export default function EinvoicePage() {
  const [jobs, setJobs] = useState<EinvoiceJob[]>([]);
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setJobs(await listEinvoiceJobs());
    } catch (err) {
      setError(apiError(err, 'Không thể tải job hóa đơn điện tử.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    window.addEventListener(SESSION_CHANGED_EVENT, load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener(SESSION_CHANGED_EVENT, load);
      window.removeEventListener('storage', load);
    };
  }, [load]);

  async function handleIssue(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const job = await issueEinvoice(orderId.trim());
      setMessage(`Đã issue stub e-invoice: ${job.status}.`);
      setOrderId('');
      await load();
    } catch (err) {
      setError(apiError(err, 'Không thể issue hóa đơn điện tử.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={pageStyle}>
      <header>
        <h1 style={{ margin: 0, fontSize: 32 }}>Hóa đơn điện tử</h1>
        <p style={mutedStyle}>
          Stub / http_sandbox engineering path. Live tax provider vẫn AMBER. Xem{' '}
          docs/ops/einvoice-providers.md.
        </p>
      </header>
      {error ? <p style={errorStyle}>{error}</p> : null}
      {message ? <p style={okStyle}>{message}</p> : null}

      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>Issue thủ công</h2>
        <form onSubmit={(event) => void handleIssue(event)} style={formStyle}>
          <label style={labelStyle}>
            Order ID đã done
            <input value={orderId} onChange={(event) => setOrderId(event.target.value)} required style={inputStyle} />
          </label>
          <button type="submit" disabled={saving} style={primaryButtonStyle}>
            {saving ? 'Đang issue...' : 'Issue stub'}
          </button>
        </form>
      </section>

      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>Jobs</h2>
        {loading ? (
          <p style={mutedStyle}>Đang tải...</p>
        ) : jobs.length === 0 ? (
          <p style={mutedStyle}>Chưa có e-invoice job.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Order</th>
                <th style={thStyle}>Provider</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Attempts</th>
                <th style={thStyle}>Last error</th>
                <th style={thStyle}>Sent</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td style={tdStyle}>{job.orderId}</td>
                  <td style={tdStyle}>{job.provider}</td>
                  <td style={tdStyle}>{job.status}</td>
                  <td style={tdStyle}>{job.attempts}</td>
                  <td style={tdStyle}>{job.lastError ?? '—'}</td>
                  <td style={tdStyle}>{job.sentAt ? new Date(job.sentAt).toLocaleString('vi-VN') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

function apiError(err: unknown, fallback: string) {
  return err instanceof ApiClientError ? err.message : fallback;
}

const pageStyle: CSSProperties = { maxWidth: 1040, margin: '0 auto', padding: '28px 20px 48px' };
const panelStyle: CSSProperties = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, marginTop: 24, padding: 20 };
const sectionTitleStyle: CSSProperties = { fontSize: 22, margin: '0 0 16px' };
const formStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' };
const labelStyle: CSSProperties = { display: 'grid', gap: 6, fontSize: 14, fontWeight: 700 };
const inputStyle: CSSProperties = { border: '1px solid #cbd5e1', borderRadius: 8, font: 'inherit', minWidth: 360, padding: '10px 12px' };
const primaryButtonStyle: CSSProperties = { background: '#0f766e', border: 0, borderRadius: 8, color: '#fff', cursor: 'pointer', fontWeight: 700, padding: '11px 14px' };
const tableStyle: CSSProperties = { borderCollapse: 'collapse', minWidth: 880, width: '100%' };
const thStyle: CSSProperties = { borderBottom: '1px solid #e2e8f0', color: '#475569', padding: '10px', textAlign: 'left' };
const tdStyle: CSSProperties = { borderBottom: '1px solid #f1f5f9', padding: '10px' };
const mutedStyle: CSSProperties = { color: '#64748b' };
const errorStyle: CSSProperties = { color: '#b91c1c' };
const okStyle: CSSProperties = { color: '#047857' };

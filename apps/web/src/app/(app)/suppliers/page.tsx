'use client';

import { type CSSProperties, type FormEvent, useCallback, useEffect, useState } from 'react';

import {
  ApiClientError,
  createSupplier,
  listSuppliers,
  type Supplier,
} from '../../../lib/api-client';
import { SESSION_CHANGED_EVENT } from '../../../lib/auth-session';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [name, setName] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [addressText, setAddressText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSuppliers(await listSuppliers());
    } catch (err) {
      setError(apiError(err, 'Không thể tải nhà cung cấp.'));
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

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const supplier = await createSupplier({
        name: name.trim(),
        taxCode: taxCode.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        addressText: addressText.trim() || undefined,
      });
      setMessage(`Đã tạo nhà cung cấp ${supplier.name}.`);
      setName('');
      setTaxCode('');
      setPhone('');
      setEmail('');
      setAddressText('');
      await load();
    } catch (err) {
      setError(apiError(err, 'Không thể tạo nhà cung cấp.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={pageStyle}>
      <header>
        <h1 style={{ margin: 0, fontSize: 32 }}>Nhà cung cấp</h1>
        <p style={mutedStyle}>Danh bạ supplier dùng cho purchase order và nhập kho.</p>
      </header>

      {error ? <p style={errorStyle}>{error}</p> : null}
      {message ? <p style={okStyle}>{message}</p> : null}

      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>Tạo supplier</h2>
        <form onSubmit={(event) => void handleCreate(event)} style={formStyle}>
          <label style={labelStyle}>
            Tên
            <input value={name} onChange={(event) => setName(event.target.value)} required style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Mã số thuế
            <input value={taxCode} onChange={(event) => setTaxCode(event.target.value)} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Điện thoại
            <input value={phone} onChange={(event) => setPhone(event.target.value)} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Địa chỉ
            <input value={addressText} onChange={(event) => setAddressText(event.target.value)} style={inputStyle} />
          </label>
          <button type="submit" disabled={saving} style={primaryButtonStyle}>
            {saving ? 'Đang lưu...' : 'Tạo supplier'}
          </button>
        </form>
      </section>

      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>Danh sách</h2>
        {loading ? (
          <p style={mutedStyle}>Đang tải...</p>
        ) : suppliers.length === 0 ? (
          <p style={mutedStyle}>Chưa có nhà cung cấp.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Tên</th>
                <th style={thStyle}>MST</th>
                <th style={thStyle}>Liên hệ</th>
                <th style={thStyle}>Địa chỉ</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td style={tdStyle}>{supplier.name}</td>
                  <td style={tdStyle}>{supplier.taxCode ?? '—'}</td>
                  <td style={tdStyle}>{supplier.phone ?? supplier.email ?? '—'}</td>
                  <td style={tdStyle}>{supplier.addressText ?? '—'}</td>
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
const formStyle: CSSProperties = { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' };
const labelStyle: CSSProperties = { display: 'grid', gap: 6, fontSize: 14, fontWeight: 700 };
const inputStyle: CSSProperties = { border: '1px solid #cbd5e1', borderRadius: 8, font: 'inherit', padding: '10px 12px' };
const primaryButtonStyle: CSSProperties = { alignSelf: 'end', background: '#0f766e', border: 0, borderRadius: 8, color: '#fff', cursor: 'pointer', fontWeight: 700, padding: '11px 14px' };
const tableStyle: CSSProperties = { borderCollapse: 'collapse', width: '100%' };
const thStyle: CSSProperties = { borderBottom: '1px solid #e2e8f0', color: '#475569', padding: '10px', textAlign: 'left' };
const tdStyle: CSSProperties = { borderBottom: '1px solid #f1f5f9', padding: '10px' };
const mutedStyle: CSSProperties = { color: '#64748b' };
const errorStyle: CSSProperties = { color: '#b91c1c' };
const okStyle: CSSProperties = { color: '#047857' };

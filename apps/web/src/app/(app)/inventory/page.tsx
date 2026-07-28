'use client';

import {
  type CSSProperties,
  type FormEvent,
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  adjustStock,
  ApiClientError,
  listLowStock,
  listStockMovements,
  type CatalogVariant,
  type StockMovement,
} from '../../../lib/api-client';
import { SESSION_CHANGED_EVENT } from '../../../lib/auth-session';
import { VariantPicker } from '../../../components/variant-picker';

export default function InventoryPage() {
  const [lowStock, setLowStock] = useState<CatalogVariant[]>([]);
  const [threshold, setThreshold] = useState(5);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [variantId, setVariantId] = useState('');
  const [qtyDelta, setQtyDelta] = useState(1);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [low, moves] = await Promise.all([
        listLowStock(),
        listStockMovements({
          variantId: variantId.trim() || undefined,
          limit: 40,
        }),
      ]);
      setLowStock(low.variants);
      setThreshold(low.threshold);
      setMovements(moves);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tải kho.'));
    } finally {
      setLoading(false);
    }
  }, [variantId]);

  useEffect(() => {
    function onSession() {
      void load();
    }
    void load();
    window.addEventListener(SESSION_CHANGED_EVENT, onSession);
    window.addEventListener('storage', onSession);
    return () => {
      window.removeEventListener(SESSION_CHANGED_EVENT, onSession);
      window.removeEventListener('storage', onSession);
    };
  }, [load]);

  async function handleAdjust(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const result = await adjustStock({
        variantId: variantId.trim(),
        qtyDelta,
        reason: reason.trim() || undefined,
        movementType: qtyDelta > 0 ? 'inbound' : 'outbound',
      });
      setMessage(
        `Đã điều chỉnh ${result.variant.sku}: tồn còn ${result.variant.stockQty}.`,
      );
      setReason('');
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể điều chỉnh tồn kho.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={pageStyle}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 32 }}>Kho hàng</h1>
        <p style={mutedStyle}>
          Điều chỉnh tồn có lý do, xem biến động và SKU dưới ngưỡng (
          {threshold}).
        </p>
      </header>

      {error ? <p style={errorStyle}>{error}</p> : null}
      {message ? <p style={okStyle}>{message}</p> : null}
      {loading ? <p style={mutedStyle}>Đang tải...</p> : null}

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Điều chỉnh tồn</h2>
        <form onSubmit={(event) => void handleAdjust(event)} style={formStyle}>
          <label style={labelStyle}>
            Variant ID
            <VariantPicker value={variantId} onChange={setVariantId} />
          </label>
          <label style={labelStyle}>
            Số lượng (+ nhập / − xuất)
            <input
              type="number"
              value={qtyDelta}
              onChange={(event) => setQtyDelta(Number(event.target.value))}
              style={inputStyle}
              required
            />
          </label>
          <label style={labelStyle}>
            Lý do
            <input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Kiểm kê / nhập hàng / hỏng..."
              style={inputStyle}
            />
          </label>
          <button type="submit" disabled={saving} style={primaryButtonStyle}>
            {saving ? 'Đang lưu...' : 'Ghi sổ kho'}
          </button>
        </form>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Sắp hết hàng</h2>
        {lowStock.length === 0 ? (
          <p style={mutedStyle}>Không có SKU dưới ngưỡng.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>SKU</th>
                <th style={thStyle}>Tên</th>
                <th style={thStyle}>Tồn</th>
                <th style={thStyle}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.map((variant) => (
                <tr key={variant.id}>
                  <td style={tdStyle}>{variant.sku}</td>
                  <td style={tdStyle}>{variant.title}</td>
                  <td style={tdStyle}>{variant.stockQty}</td>
                  <td style={tdStyle}>
                    <button
                      type="button"
                      style={linkButtonStyle}
                      onClick={() => setVariantId(variant.id)}
                    >
                      Chọn để điều chỉnh
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Biến động gần đây</h2>
        {movements.length === 0 ? (
          <p style={mutedStyle}>Chưa có giao dịch kho.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Thời điểm</th>
                <th style={thStyle}>Loại</th>
                <th style={thStyle}>Δ</th>
                <th style={thStyle}>Sau</th>
                <th style={thStyle}>Lý do</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((row) => (
                <tr key={row.id}>
                  <td style={tdStyle}>
                    {new Date(row.createdAt).toLocaleString('vi-VN')}
                  </td>
                  <td style={tdStyle}>{row.movementType}</td>
                  <td style={tdStyle}>{row.qtyDelta}</td>
                  <td style={tdStyle}>{row.stockAfter}</td>
                  <td style={tdStyle}>{row.reason ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

function getApiErrorMessage(err: unknown, fallback: string) {
  if (err instanceof ApiClientError) {
    return err.message || fallback;
  }
  if (err instanceof Error) {
    return err.message || fallback;
  }
  return fallback;
}

const pageStyle: CSSProperties = {
  maxWidth: 960,
  margin: '0 auto',
  padding: '28px 20px 48px',
};

const sectionStyle: CSSProperties = {
  marginTop: 28,
};

const sectionTitleStyle: CSSProperties = {
  margin: '0 0 12px',
  fontSize: 20,
};

const formStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
  maxWidth: 480,
};

const labelStyle: CSSProperties = {
  display: 'grid',
  gap: 6,
  fontSize: 14,
};

const inputStyle: CSSProperties = {
  padding: '10px 12px',
  border: '1px solid #d4d4d8',
  borderRadius: 8,
  fontSize: 15,
};

const primaryButtonStyle: CSSProperties = {
  justifySelf: 'start',
  padding: '10px 16px',
  border: 0,
  borderRadius: 8,
  background: '#0f766e',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
};

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '8px 10px',
  borderBottom: '1px solid #e4e4e7',
  fontSize: 13,
  color: '#52525b',
};

const tdStyle: CSSProperties = {
  padding: '8px 10px',
  borderBottom: '1px solid #f4f4f5',
  fontSize: 14,
};

const linkButtonStyle: CSSProperties = {
  border: 0,
  background: 'transparent',
  color: '#0f766e',
  cursor: 'pointer',
  padding: 0,
};

const mutedStyle: CSSProperties = { color: '#71717a', marginTop: 8 };
const errorStyle: CSSProperties = { color: '#b91c1c' };
const okStyle: CSSProperties = { color: '#047857' };

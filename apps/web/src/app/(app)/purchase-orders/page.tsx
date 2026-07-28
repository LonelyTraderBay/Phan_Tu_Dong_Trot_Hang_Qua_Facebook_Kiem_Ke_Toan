'use client';

import { type CSSProperties, type FormEvent, useCallback, useEffect, useState } from 'react';

import {
  ApiClientError,
  createPurchaseOrder,
  listPurchaseOrders,
  listSuppliers,
  listWarehouses,
  receivePurchaseOrder,
  updatePurchaseOrderStatus,
  type PurchaseOrder,
  type Supplier,
  type Warehouse,
} from '../../../lib/api-client';
import { SESSION_CHANGED_EVENT } from '../../../lib/auth-session';
import { VariantPicker } from '../../../components/variant-picker';

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [variantId, setVariantId] = useState('');
  const [qty, setQty] = useState(1);
  const [unitCostVnd, setUnitCostVnd] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextSuppliers, nextWarehouses, nextPurchaseOrders] = await Promise.all([
        listSuppliers(),
        listWarehouses(),
        listPurchaseOrders(),
      ]);
      setSuppliers(nextSuppliers);
      setWarehouses(nextWarehouses);
      setPurchaseOrders(nextPurchaseOrders);
      setSupplierId((current) => current || nextSuppliers[0]?.id || '');
      setWarehouseId((current) => current || nextWarehouses[0]?.id || '');
    } catch (err) {
      setError(apiError(err, 'Không thể tải PO.'));
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
      const po = await createPurchaseOrder({
        supplierId,
        warehouseId: warehouseId || undefined,
        status: 'draft',
        note: note.trim() || undefined,
        items: [
          {
            variantId: variantId.trim(),
            qty,
            unitCostVnd: unitCostVnd.trim(),
          },
        ],
      });
      setMessage(`Đã tạo PO ${po.id.slice(0, 8)}.`);
      setVariantId('');
      setQty(1);
      setUnitCostVnd('');
      setNote('');
      await load();
    } catch (err) {
      setError(apiError(err, 'Không thể tạo PO.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleStatus(po: PurchaseOrder, status: 'ordered' | 'cancelled') {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await updatePurchaseOrderStatus(po.id, status);
      setMessage(status === 'ordered' ? 'Đã đặt hàng.' : 'Đã hủy PO.');
      await load();
    } catch (err) {
      setError(apiError(err, 'Không thể cập nhật PO.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleReceive(po: PurchaseOrder) {
    const targetWarehouseId = po.warehouseId ?? warehouseId;
    if (!targetWarehouseId) {
      setError('Chọn kho nhận trước khi receive PO.');
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await receivePurchaseOrder({
        purchaseOrderId: po.id,
        warehouseId: targetWarehouseId,
      });
      setMessage(`Đã nhập kho PO ${po.id.slice(0, 8)}.`);
      await load();
    } catch (err) {
      setError(apiError(err, 'Không thể nhập kho PO.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={pageStyle}>
      <header>
        <h1 style={{ margin: 0, fontSize: 32 }}>Purchase orders</h1>
        <p style={mutedStyle}>Tạo PO mỏng và receive để ghi inbound ledger vào kho.</p>
      </header>
      {error ? <p style={errorStyle}>{error}</p> : null}
      {message ? <p style={okStyle}>{message}</p> : null}

      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>Tạo PO một dòng</h2>
        <form onSubmit={(event) => void handleCreate(event)} style={formStyle}>
          <label style={labelStyle}>
            Supplier
            <select value={supplierId} onChange={(event) => setSupplierId(event.target.value)} required style={inputStyle}>
              <option value="">Chọn supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
              ))}
            </select>
          </label>
          <label style={labelStyle}>
            Kho nhận
            <select value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)} style={inputStyle}>
              <option value="">Chọn khi receive</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>{warehouse.name} ({warehouse.code})</option>
              ))}
            </select>
          </label>
          <label style={labelStyle}>
            Variant ID
            <VariantPicker value={variantId} onChange={setVariantId} />
          </label>
          <label style={labelStyle}>
            Số lượng
            <input type="number" min={1} value={qty} onChange={(event) => setQty(Number(event.target.value))} required style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Giá vốn / đơn vị
            <input value={unitCostVnd} onChange={(event) => setUnitCostVnd(event.target.value)} required pattern="\d+" style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Ghi chú
            <input value={note} onChange={(event) => setNote(event.target.value)} style={inputStyle} />
          </label>
          <button type="submit" disabled={saving} style={primaryButtonStyle}>
            {saving ? 'Đang lưu...' : 'Tạo PO'}
          </button>
        </form>
      </section>

      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>Danh sách PO</h2>
        {loading ? (
          <p style={mutedStyle}>Đang tải...</p>
        ) : purchaseOrders.length === 0 ? (
          <p style={mutedStyle}>Chưa có PO.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>PO</th>
                <th style={thStyle}>Supplier</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Items</th>
                <th style={thStyle}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.map((po) => (
                <tr key={po.id}>
                  <td style={tdStyle}>{po.id.slice(0, 8)}</td>
                  <td style={tdStyle}>{po.supplier?.name ?? po.supplierId}</td>
                  <td style={tdStyle}>{po.status}</td>
                  <td style={tdStyle}>
                    {po.items.map((item) => `${item.variantId.slice(0, 8)} x${item.qty} @ ${formatVnd(item.unitCostVnd)}`).join(', ')}
                  </td>
                  <td style={tdStyle}>
                    {po.status === 'draft' ? (
                      <button type="button" disabled={saving} onClick={() => void handleStatus(po, 'ordered')} style={linkButtonStyle}>
                        Đặt hàng
                      </button>
                    ) : null}
                    {po.status === 'draft' || po.status === 'ordered' ? (
                      <button type="button" disabled={saving} onClick={() => void handleReceive(po)} style={linkButtonStyle}>
                        Nhập kho
                      </button>
                    ) : null}
                    {po.status === 'draft' || po.status === 'ordered' ? (
                      <button type="button" disabled={saving} onClick={() => void handleStatus(po, 'cancelled')} style={dangerLinkStyle}>
                        Hủy
                      </button>
                    ) : null}
                  </td>
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

function formatVnd(value: string) {
  return `${value.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} đ`;
}

const pageStyle: CSSProperties = { maxWidth: 1120, margin: '0 auto', padding: '28px 20px 48px' };
const panelStyle: CSSProperties = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, marginTop: 24, padding: 20 };
const sectionTitleStyle: CSSProperties = { fontSize: 22, margin: '0 0 16px' };
const formStyle: CSSProperties = { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' };
const labelStyle: CSSProperties = { display: 'grid', gap: 6, fontSize: 14, fontWeight: 700 };
const inputStyle: CSSProperties = { border: '1px solid #cbd5e1', borderRadius: 8, font: 'inherit', padding: '10px 12px' };
const primaryButtonStyle: CSSProperties = { alignSelf: 'end', background: '#0f766e', border: 0, borderRadius: 8, color: '#fff', cursor: 'pointer', fontWeight: 700, padding: '11px 14px' };
const tableStyle: CSSProperties = { borderCollapse: 'collapse', minWidth: 900, width: '100%' };
const thStyle: CSSProperties = { borderBottom: '1px solid #e2e8f0', color: '#475569', padding: '10px', textAlign: 'left' };
const tdStyle: CSSProperties = { borderBottom: '1px solid #f1f5f9', padding: '10px', verticalAlign: 'top' };
const linkButtonStyle: CSSProperties = { background: 'transparent', border: 0, color: '#0f766e', cursor: 'pointer', fontWeight: 700, marginRight: 8, padding: 0 };
const dangerLinkStyle: CSSProperties = { ...linkButtonStyle, color: '#b91c1c' };
const mutedStyle: CSSProperties = { color: '#64748b' };
const errorStyle: CSSProperties = { color: '#b91c1c' };
const okStyle: CSSProperties = { color: '#047857' };

'use client';

import { useSearchParams } from 'next/navigation';
import {
  Suspense,
  type CSSProperties,
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ApiClientError,
  cancelOrder,
  confirmOrder,
  createShipment,
  downloadOrdersExport,
  listOrders,
  markOrderDone,
  returnOrder,
  type Order,
  type OrdersExportFormat,
  type OrderStatus,
} from '../../../lib/api-client';
import { SESSION_CHANGED_EVENT } from '../../../lib/auth-session';

const statusOptions: Array<{ value: OrderStatus | ''; label: string }> = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'draft', label: 'Nháp / chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'shipped', label: 'Đang giao' },
  { value: 'done', label: 'Hoàn tất' },
  { value: 'cancelled', label: 'Đã huỷ' },
  { value: 'returned', label: 'Hoàn hàng' },
];

function OrdersContent() {
  const searchParams = useSearchParams();
  const initialStatus = normalizeStatus(searchParams.get('status'));
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState<OrderStatus | ''>(initialStatus);
  const [loading, setLoading] = useState(true);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [exporting, setExporting] = useState<OrdersExportFormat | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setOrders(await listOrders(status || undefined));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tải danh sách đơn hàng.'));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    function handleSessionChanged() {
      void loadOrders();
    }

    void loadOrders();
    window.addEventListener(SESSION_CHANGED_EVENT, handleSessionChanged);
    window.addEventListener('storage', handleSessionChanged);

    return () => {
      window.removeEventListener(SESSION_CHANGED_EVENT, handleSessionChanged);
      window.removeEventListener('storage', handleSessionChanged);
    };
  }, [loadOrders]);

  async function runOrderAction(
    order: Order,
    action: 'confirm' | 'cancel' | 'shipment' | 'return' | 'done',
  ) {
    setBusyOrderId(order.id);
    setError(null);
    setMessage(null);

    try {
      const shipmentResult =
        action === 'shipment'
          ? await createShipment({ orderId: order.id, provider: 'manual' })
          : null;
      const updated =
        action === 'confirm'
          ? await confirmOrder(order.id)
          : action === 'cancel'
            ? await cancelOrder(order.id)
            : action === 'return'
              ? await returnOrder(order.id, { restock: true })
              : action === 'done'
                ? await markOrderDone(order.id)
                : shipmentResult?.order;
      setOrders((current) =>
        updated
          ? current.map((item) => (item.id === updated.id ? updated : item))
          : current,
      );
      setMessage(
        action === 'shipment'
          ? `Đã tạo vận đơn ${shipmentResult?.shipment.trackingCode ?? ''} cho đơn ${shortId(
              order.id,
            )}.`
          : action === 'return'
            ? `Đã hoàn hàng và nhập lại kho cho đơn ${shortId(order.id)}.`
            : action === 'done'
              ? `Đã hoàn tất đơn ${shortId(order.id)}.`
              : `Đã cập nhật đơn ${shortId(order.id)}.`,
      );
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể cập nhật đơn hàng.'));
    } finally {
      setBusyOrderId(null);
    }
  }

  async function handleExport(format: OrdersExportFormat) {
    setExporting(format);
    setError(null);
    setMessage(null);

    try {
      const file = await downloadOrdersExport({
        format,
        status: status || undefined,
      });
      const url = URL.createObjectURL(file.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.filename;
      link.click();
      URL.revokeObjectURL(url);
      setMessage(`Đã tải file ${file.filename}.`);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể xuất đơn hàng.'));
    } finally {
      setExporting(null);
    }
  }

  return (
    <main>
      <header style={headerStyle}>
        <div>
          <h1 style={{ margin: 0, fontSize: 32 }}>Đơn hàng</h1>
          <p style={descriptionStyle}>
            Theo dõi đơn theo trạng thái, xác nhận, huỷ, chuyển sang giao hàng
            và tải file xuất đơn.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadOrders()}
          disabled={loading}
          style={secondaryButtonStyle}
        >
          {loading ? 'Đang tải...' : 'Tải lại'}
        </button>
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

      <section style={toolbarStyle}>
        <label style={labelStyle}>
          Lọc trạng thái
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as OrderStatus | '')}
            style={inputStyle}
          >
            {statusOptions.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div style={exportRowStyle}>
          {(['csv', 'xlsx', 'pdf'] as OrdersExportFormat[]).map((format) => (
            <button
              key={format}
              type="button"
              onClick={() => void handleExport(format)}
              disabled={exporting !== null}
              style={secondaryButtonStyle}
            >
              {exporting === format ? 'Đang xuất...' : `Xuất ${format.toUpperCase()}`}
            </button>
          ))}
        </div>
      </section>

      <section style={panelStyle}>
        {loading ? (
          <p style={mutedStyle}>Đang tải đơn hàng...</p>
        ) : orders.length === 0 ? (
          <p style={emptyStyle}>Chưa có đơn hàng phù hợp bộ lọc.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Mã đơn</th>
                  <th style={tableHeaderStyle}>Khách</th>
                  <th style={tableHeaderStyle}>Trạng thái</th>
                  <th style={tableHeaderStyle}>Thanh toán</th>
                  <th style={tableHeaderStyle}>Tổng tiền</th>
                  <th style={tableHeaderStyle}>Tạo lúc</th>
                  <th style={tableHeaderStyle}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td style={tableCellStyle}>{shortId(order.id)}</td>
                    <td style={tableCellStyle}>
                      <strong>{order.customerName ?? 'Khách chưa đặt tên'}</strong>
                      <br />
                      <span style={mutedStyle}>{order.phoneE164 ?? 'Chưa có SĐT'}</span>
                    </td>
                    <td style={tableCellStyle}>{formatStatus(order.status)}</td>
                    <td style={tableCellStyle}>
                      {formatPaymentMethod(order.paymentMethod)}
                    </td>
                    <td style={tableCellStyle}>{formatMoney(order.totalVnd)}</td>
                    <td style={tableCellStyle}>{formatDateTime(order.createdAt)}</td>
                    <td style={tableCellStyle}>
                      <div style={actionRowStyle}>
                        {order.status === 'draft' ? (
                          <button
                            type="button"
                            onClick={() => void runOrderAction(order, 'confirm')}
                            disabled={busyOrderId === order.id}
                            style={linkButtonStyle}
                          >
                            Xác nhận
                          </button>
                        ) : null}
                        {order.status === 'confirmed' ? (
                          <button
                            type="button"
                            onClick={() => void runOrderAction(order, 'shipment')}
                            disabled={busyOrderId === order.id}
                            style={linkButtonStyle}
                          >
                            Tạo vận đơn
                          </button>
                        ) : null}
                        {order.status === 'draft' || order.status === 'confirmed' ? (
                          <button
                            type="button"
                            onClick={() => void runOrderAction(order, 'cancel')}
                            disabled={busyOrderId === order.id}
                            style={{ ...linkButtonStyle, color: '#b91c1c' }}
                          >
                            Huỷ
                          </button>
                        ) : null}
                        {order.status === 'shipped' ? (
                          <button
                            type="button"
                            onClick={() => void runOrderAction(order, 'done')}
                            disabled={busyOrderId === order.id}
                            style={{ ...linkButtonStyle, color: '#15803d' }}
                          >
                            Hoàn tất
                          </button>
                        ) : null}
                        {order.status === 'shipped' || order.status === 'done' ? (
                          <button
                            type="button"
                            onClick={() => void runOrderAction(order, 'return')}
                            disabled={busyOrderId === order.id}
                            style={{ ...linkButtonStyle, color: '#b45309' }}
                          >
                            Hoàn hàng
                          </button>
                        ) : null}
                      </div>
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

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <main>
          <p style={{ color: '#64748b' }}>Đang tải...</p>
        </main>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}

function normalizeStatus(value: string | null): OrderStatus | '' {
  return statusOptions.some((option) => option.value === value)
    ? (value as OrderStatus | '')
    : '';
}

function getApiErrorMessage(err: unknown, fallback: string) {
  return err instanceof ApiClientError ? err.message : fallback;
}

function shortId(id: string) {
  return id.slice(0, 8);
}

function formatStatus(status: OrderStatus) {
  return (
    statusOptions.find((option) => option.value === status)?.label ?? status
  );
}

function formatPaymentMethod(method: string) {
  const labels: Record<string, string> = {
    bank_transfer: 'Chuyển khoản',
    cod: 'COD',
    other: 'Khác',
  };

  return labels[method] ?? method;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatMoney(value: string) {
  return new Intl.NumberFormat('vi-VN', {
    currency: 'VND',
    style: 'currency',
  }).format(Number(value));
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
  maxWidth: 760,
};

const toolbarStyle: CSSProperties = {
  alignItems: 'end',
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  display: 'flex',
  flexWrap: 'wrap',
  gap: 16,
  justifyContent: 'space-between',
  marginTop: 24,
  padding: 16,
};

const labelStyle: CSSProperties = {
  color: '#334155',
  display: 'flex',
  flexDirection: 'column',
  fontSize: 14,
  fontWeight: 700,
  gap: 6,
};

const inputStyle: CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 10,
  color: '#0f172a',
  font: 'inherit',
  minWidth: 240,
  padding: '11px 12px',
};

const exportRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
};

const panelStyle: CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  marginTop: 24,
  padding: 20,
};

const tableStyle: CSSProperties = {
  borderCollapse: 'collapse',
  minWidth: 920,
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

const actionRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
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

'use client';

import Link from 'next/link';
import { type CSSProperties, useCallback, useEffect, useState } from 'react';

import {
  ApiClientError,
  listChannels,
  listLowStock,
  listOrders,
  type CatalogVariant,
  type ChannelConnection,
  type Order,
} from '../../../lib/api-client';
import { SESSION_CHANGED_EVENT } from '../../../lib/auth-session';

type DashboardState = {
  orders: Order[];
  channels: ChannelConnection[];
  lowStockVariants: CatalogVariant[];
  lowStockThreshold: number;
};

export default function DashboardPage() {
  const [state, setState] = useState<DashboardState>({
    orders: [],
    channels: [],
    lowStockVariants: [],
    lowStockThreshold: 5,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [orders, channels, lowStock] = await Promise.all([
        listOrders(),
        listChannels(),
        listLowStock(),
      ]);

      setState({
        orders,
        channels,
        lowStockVariants: lowStock.variants,
        lowStockThreshold: lowStock.threshold,
      });
      setLastUpdatedAt(new Date());
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tải bảng điều khiển.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    function handleSessionChanged() {
      void loadDashboard();
    }

    void loadDashboard();
    window.addEventListener(SESSION_CHANGED_EVENT, handleSessionChanged);
    window.addEventListener('storage', handleSessionChanged);

    return () => {
      window.removeEventListener(SESSION_CHANGED_EVENT, handleSessionChanged);
      window.removeEventListener('storage', handleSessionChanged);
    };
  }, [loadDashboard]);

  const newOrders = state.orders.filter((order) => order.status === 'draft');
  const channelIssues = state.channels.filter(
    (channel) => channel.status === 'needs_reauth' || channel.status === 'revoked',
  );
  const needsAttention =
    newOrders.length + state.lowStockVariants.length + channelIssues.length;

  return (
    <main>
      <header style={headerStyle}>
        <div>
          <h1 style={{ margin: 0, fontSize: 32 }}>Bảng điều khiển</h1>
          <p style={descriptionStyle}>
            Tóm tắt đơn mới, tồn kho thấp và các mục cần xử lý của tổ chức đang
            chọn.
          </p>
          {lastUpdatedAt ? (
            <p style={mutedStyle}>
              Cập nhật lần cuối: {formatDateTime(lastUpdatedAt.toISOString())}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => void loadDashboard()}
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

      <section style={gridStyle}>
        <MetricCard
          label="Đơn mới"
          value={newOrders.length}
          href="/orders?status=draft"
        />
        <MetricCard
          label="Sắp hết hàng"
          value={state.lowStockVariants.length}
          href="/inventory"
        />
        <MetricCard
          label="Cần chú ý"
          value={needsAttention}
          href="/settings/channels"
        />
      </section>

      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>Việc cần làm</h2>
        {loading ? (
          <p style={mutedStyle}>Đang tải dữ liệu...</p>
        ) : needsAttention === 0 ? (
          <p style={emptyStyle}>Chưa có mục cần chú ý.</p>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {newOrders.slice(0, 5).map((order) => (
              <Link key={order.id} href="/orders" style={itemLinkStyle}>
                Xác nhận đơn {shortId(order.id)} -{' '}
                {order.customerName ?? 'Khách chưa đặt tên'} -{' '}
                {formatMoney(order.totalVnd)}
              </Link>
            ))}
            {state.lowStockVariants.slice(0, 5).map((variant) => (
              <Link
                key={variant.id}
                href="/inventory"
                style={{ ...itemLinkStyle, color: '#92400e' }}
              >
                Tồn kho thấp: {variant.sku} / {variant.title} còn{' '}
                {variant.stockQty} (ngưỡng {state.lowStockThreshold})
              </Link>
            ))}
            {channelIssues.map((channel) => (
              <Link
                key={channel.id}
                href="/settings/channels"
                style={{ ...itemLinkStyle, color: '#b91c1c' }}
              >
                Kênh {channel.externalPageId} đang ở trạng thái {channel.status}
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link href={href} style={metricCardStyle}>
      <span style={metricValueStyle}>{value}</span>
      <span style={metricLabelStyle}>{label}</span>
    </Link>
  );
}

function getApiErrorMessage(err: unknown, fallback: string) {
  return err instanceof ApiClientError ? err.message : fallback;
}

function shortId(id: string) {
  return id.slice(0, 8);
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

const mutedStyle: CSSProperties = {
  color: '#64748b',
  fontSize: 15,
};

const gridStyle: CSSProperties = {
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  marginTop: 28,
};

const metricCardStyle: CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  color: '#0f172a',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: 20,
  textDecoration: 'none',
};

const metricValueStyle: CSSProperties = {
  fontSize: 36,
  fontWeight: 900,
};

const metricLabelStyle: CSSProperties = {
  color: '#475569',
  fontSize: 16,
  fontWeight: 700,
};

const panelStyle: CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  marginTop: 28,
  padding: 20,
};

const sectionTitleStyle: CSSProperties = {
  fontSize: 22,
  margin: '0 0 16px',
};

const itemLinkStyle: CSSProperties = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 10,
  color: '#2563eb',
  fontWeight: 700,
  padding: 12,
  textDecoration: 'none',
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

'use client';

import { type CSSProperties, useCallback, useEffect, useState } from 'react';

import {
  ApiClientError,
  createShipment,
  listInboxConversations,
  listOrders,
  type InboxConversation,
  type Order,
} from '../../../lib/api-client';
import { SESSION_CHANGED_EVENT } from '../../../lib/auth-session';

export default function StaffMobilePage() {
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextConversations, nextOrders] = await Promise.all([
        listInboxConversations(),
        listOrders('confirmed'),
      ]);
      setConversations(nextConversations.slice(0, 20));
      setOrders(nextOrders.slice(0, 20));
    } catch (err) {
      setError(apiError(err, 'Không thể tải mobile inbox/ship.'));
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

  async function handleShip(order: Order) {
    setBusyOrderId(order.id);
    setMessage(null);
    setError(null);
    try {
      const result = await createShipment({ orderId: order.id, provider: 'manual' });
      setMessage(`Đã tạo vận đơn ${result.shipment.trackingCode ?? ''}.`);
      await load();
    } catch (err) {
      setError(apiError(err, 'Không thể tạo vận đơn.'));
    } finally {
      setBusyOrderId(null);
    }
  }

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>Mobile staff</h1>
          <p style={mutedStyle}>Màn hình mỏng cho CSKH/kho: inbox mới và nút ship đơn confirmed.</p>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} style={buttonStyle}>
          {loading ? 'Đang tải...' : 'Tải lại'}
        </button>
      </header>
      {error ? <p style={errorStyle}>{error}</p> : null}
      {message ? <p style={okStyle}>{message}</p> : null}

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Inbox</h2>
        {conversations.length === 0 ? (
          <p style={mutedStyle}>Không có hội thoại gần đây.</p>
        ) : (
          <div style={cardListStyle}>
            {conversations.map((conversation) => (
              <article key={conversation.id} style={cardStyle}>
                <strong>{conversation.contact?.displayName ?? 'Khách chưa tên'}</strong>
                <span style={mutedStyle}>{conversation.channel} · {conversation.status}</span>
                <span style={mutedStyle}>{conversation.lastMessageAt ? new Date(conversation.lastMessageAt).toLocaleString('vi-VN') : 'Chưa có tin'}</span>
              </article>
            ))}
          </div>
        )}
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Đơn chờ ship</h2>
        {orders.length === 0 ? (
          <p style={mutedStyle}>Không có đơn confirmed.</p>
        ) : (
          <div style={cardListStyle}>
            {orders.map((order) => (
              <article key={order.id} style={cardStyle}>
                <strong>{order.customerName ?? order.id.slice(0, 8)}</strong>
                <span style={mutedStyle}>{formatVnd(order.totalVnd)} · {order.phoneE164 ?? 'no phone'}</span>
                <button type="button" disabled={busyOrderId === order.id} onClick={() => void handleShip(order)} style={shipButtonStyle}>
                  {busyOrderId === order.id ? 'Đang ship...' : 'Tạo vận đơn'}
                </button>
              </article>
            ))}
          </div>
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

const pageStyle: CSSProperties = { margin: '0 auto', maxWidth: 560, padding: 16 };
const headerStyle: CSSProperties = { alignItems: 'center', display: 'flex', gap: 12, justifyContent: 'space-between' };
const sectionStyle: CSSProperties = { marginTop: 24 };
const sectionTitleStyle: CSSProperties = { fontSize: 20, margin: '0 0 12px' };
const cardListStyle: CSSProperties = { display: 'grid', gap: 12 };
const cardStyle: CSSProperties = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, display: 'grid', gap: 6, padding: 14 };
const buttonStyle: CSSProperties = { background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, color: '#0f172a', fontWeight: 700, padding: '9px 12px' };
const shipButtonStyle: CSSProperties = { ...buttonStyle, background: '#0f766e', color: '#fff', justifySelf: 'start' };
const mutedStyle: CSSProperties = { color: '#64748b' };
const errorStyle: CSSProperties = { color: '#b91c1c' };
const okStyle: CSSProperties = { color: '#047857' };

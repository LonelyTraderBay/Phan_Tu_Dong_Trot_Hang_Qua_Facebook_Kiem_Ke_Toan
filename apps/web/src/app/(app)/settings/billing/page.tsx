'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  ApiClientError,
  getBillingPlan,
  getBillingUsage,
  listBillingInvoices,
  type BillingInvoice,
  type BillingPlan,
  type BillingUsage,
} from '../../../../lib/api-client';
import { SESSION_CHANGED_EVENT } from '../../../../lib/auth-session';

const PLAN_LABELS: Record<string, string> = {
  free: 'Miễn phí',
  pilot: 'Pilot',
  starter: 'Starter',
  enterprise: 'Enterprise',
};

const BILLING_STATUS_LABELS: Record<string, string> = {
  active: 'Đang hoạt động',
  past_due: 'Quá hạn',
  suspended: 'Tạm ngưng',
};

const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: 'Nháp',
  issued: 'Đã phát hành',
  paid: 'Đã thanh toán',
  void: 'Đã hủy',
};

export default function BillingSettingsPage() {
  const [plan, setPlan] = useState<BillingPlan | null>(null);
  const [usage, setUsage] = useState<BillingUsage | null>(null);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBilling = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [nextPlan, nextUsage, nextInvoices] = await Promise.all([
        getBillingPlan(),
        getBillingUsage(),
        listBillingInvoices(),
      ]);
      setPlan(nextPlan);
      setUsage(nextUsage);
      setInvoices(nextInvoices);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Không thể tải thông tin thanh toán.';
      setError(message);
      setPlan(null);
      setUsage(null);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBilling();
  }, [loadBilling]);

  useEffect(() => {
    function handleSessionChanged() {
      void loadBilling();
    }

    window.addEventListener(SESSION_CHANGED_EVENT, handleSessionChanged);
    window.addEventListener('storage', handleSessionChanged);

    return () => {
      window.removeEventListener(SESSION_CHANGED_EVENT, handleSessionChanged);
      window.removeEventListener('storage', handleSessionChanged);
    };
  }, [loadBilling]);

  return (
    <main>
      <h1 style={{ margin: 0, fontSize: 32 }}>Thanh toán</h1>
      <p style={{ color: '#475569', fontSize: 18, maxWidth: 760 }}>
        Gói hiện tại, hạn mức sử dụng và hóa đơn thủ công theo ADR 0004. Hệ
        thống chưa thu tiền tự động qua Stripe/PayOS.
      </p>

      {loading ? (
        <p style={noticeStyle}>Đang tải thanh toán...</p>
      ) : null}
      {error ? <p style={errorStyle}>{error}</p> : null}

      {plan ? (
        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>Gói dịch vụ</h2>
          <div style={gridStyle}>
            <MetricCard label="Gói" value={formatPlan(plan.plan)} />
            <MetricCard
              label="Trạng thái"
              value={formatBillingStatus(plan.billingStatus)}
            />
            <MetricCard
              label="Email nhận hóa đơn"
              value={plan.billingCustomerEmail ?? 'Chưa cấu hình'}
            />
            <MetricCard
              label="Gia hạn"
              value={formatDateTime(plan.planRenewsAt)}
            />
          </div>

          {plan.billingStatus === 'past_due' ? (
            <p style={warningStyle}>
              Trạng thái quá hạn đang chặn tự động xác nhận đơn. Chủ shop vẫn
              có thể xử lý thủ công trong lúc đối soát hóa đơn.
            </p>
          ) : null}
        </section>
      ) : null}

      {plan ? (
        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>Quyền lợi gói</h2>
          <div style={gridStyle}>
            <MetricCard
              label="Số kênh tối đa"
              value={String(plan.entitlements.maxPages)}
            />
            <MetricCard
              label="Token AI / tháng"
              value={formatNumber(plan.entitlements.aiMonthlyTokenLimit)}
            />
            <MetricCard
              label="Tự động xác nhận"
              value={plan.entitlements.autoConfirmAllowed ? 'Bật' : 'Tắt'}
            />
            <MetricCard
              label="Cập nhật hạn mức"
              value={formatDateTime(plan.entitlements.updatedAt)}
            />
          </div>
        </section>
      ) : null}

      {usage ? (
        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>Mức sử dụng tháng này</h2>
          <p style={{ color: '#64748b', marginTop: 0 }}>
            Kỳ bắt đầu: {formatDateTime(usage.periodStart)}
          </p>
          <div style={gridStyle}>
            <MetricCard
              label="Kênh đang kết nối"
              value={formatNumber(usage.pagesConnectedCount)}
            />
            <MetricCard
              label="Token AI"
              value={formatNumber(usage.aiTokensMonth)}
            />
            <MetricCard
              label="Đơn hàng"
              value={formatNumber(usage.ordersCountMonth)}
            />
          </div>
        </section>
      ) : null}

      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>Hóa đơn</h2>
        {invoices.length === 0 ? (
          <p style={{ color: '#64748b' }}>Chưa có hóa đơn.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Kỳ</th>
                  <th style={thStyle}>Số tiền</th>
                  <th style={thStyle}>Trạng thái</th>
                  <th style={thStyle}>Phát hành</th>
                  <th style={thStyle}>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td style={tdStyle}>
                      {formatDate(invoice.periodStart)} -{' '}
                      {formatDate(invoice.periodEnd)}
                    </td>
                    <td style={tdStyle}>{formatVnd(invoice.amountVnd)}</td>
                    <td style={tdStyle}>
                      {formatInvoiceStatus(invoice.status)}
                    </td>
                    <td style={tdStyle}>{formatDateTime(invoice.issuedAt)}</td>
                    <td style={tdStyle}>{invoice.note ?? '-'}</td>
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

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={metricStyle}>
      <div style={{ color: '#64748b', fontSize: 13, fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ color: '#0f172a', fontSize: 22, fontWeight: 800 }}>
        {value}
      </div>
    </div>
  );
}

function formatPlan(plan: string) {
  return PLAN_LABELS[plan] ?? plan;
}

function formatBillingStatus(status: string) {
  return BILLING_STATUS_LABELS[status] ?? status;
}

function formatInvoiceStatus(status: string) {
  return INVOICE_STATUS_LABELS[status] ?? status;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value);
}

function formatVnd(value: string) {
  return `${new Intl.NumberFormat('vi-VN').format(Number(value))} đ`;
}

function formatDateTime(value: string | null) {
  if (!value) {
    return '-';
  }
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
  }).format(new Date(value));
}

const cardStyle = {
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  marginTop: 24,
  padding: 20,
};

const sectionTitleStyle = {
  fontSize: 22,
  margin: '0 0 16px',
};

const gridStyle = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
};

const metricStyle = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 10,
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 8,
  padding: 16,
};

const noticeStyle = {
  background: '#eff6ff',
  borderRadius: 8,
  color: '#1d4ed8',
  marginTop: 20,
  padding: 12,
};

const errorStyle = {
  background: '#fef2f2',
  borderRadius: 8,
  color: '#b91c1c',
  marginTop: 20,
  padding: 12,
};

const warningStyle = {
  background: '#fffbeb',
  borderRadius: 8,
  color: '#92400e',
  margin: '16px 0 0',
  padding: 12,
};

const tableStyle = {
  borderCollapse: 'collapse' as const,
  minWidth: 760,
  width: '100%',
};

const thStyle = {
  borderBottom: '1px solid #cbd5e1',
  color: '#475569',
  fontSize: 13,
  padding: '10px 8px',
  textAlign: 'left' as const,
};

const tdStyle = {
  borderBottom: '1px solid #e2e8f0',
  color: '#0f172a',
  padding: '12px 8px',
};

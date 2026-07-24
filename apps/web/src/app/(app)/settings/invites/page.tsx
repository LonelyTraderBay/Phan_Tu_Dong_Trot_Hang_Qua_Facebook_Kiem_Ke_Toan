'use client';

import {
  type CSSProperties,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ApiClientError,
  createInvite,
  type MembershipInvite,
} from '../../../../lib/api-client';
import {
  getStoredOrganizations,
  SESSION_CHANGED_EVENT,
  type OrganizationRole,
  type StoredOrganization,
} from '../../../../lib/auth-session';
import { getActiveOrgId } from '../../../../lib/org-context';

const inviteRoles: Array<{ value: OrganizationRole; label: string }> = [
  { value: 'cskh', label: 'CSKH' },
  { value: 'kho', label: 'Kho' },
  { value: 'owner', label: 'Chủ sở hữu' },
];

export default function InvitesSettingsPage() {
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<StoredOrganization[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrganizationRole>('cskh');
  const [createdInvites, setCreatedInvites] = useState<MembershipInvite[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function loadOrgContext() {
      setActiveOrgId(getActiveOrgId());
      setOrganizations(getStoredOrganizations());
      setCreatedInvites([]);
    }

    loadOrgContext();
    window.addEventListener(SESSION_CHANGED_EVENT, loadOrgContext);
    window.addEventListener('storage', loadOrgContext);

    return () => {
      window.removeEventListener(SESSION_CHANGED_EVENT, loadOrgContext);
      window.removeEventListener('storage', loadOrgContext);
    };
  }, []);

  const activeOrganization = useMemo(
    () => organizations.find((org) => org.id === activeOrgId) ?? null,
    [activeOrgId, organizations],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess(null);
    setError(null);

    if (!activeOrgId) {
      setError('Hãy chọn tổ chức trước khi tạo lời mời.');
      return;
    }

    const inviteEmail = email.trim().toLowerCase();
    if (!inviteEmail) {
      setError('Vui lòng nhập email người được mời.');
      return;
    }

    setSubmitting(true);
    try {
      const { invite } = await createInvite({
        orgId: activeOrgId,
        email: inviteEmail,
        role,
      });
      setCreatedInvites((current) => [invite, ...current]);
      setEmail('');
      setSuccess(`Đã tạo lời mời cho ${invite.email}.`);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Không thể tạo lời mời.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <h1 style={{ margin: 0, fontSize: 32 }}>Lời mời thành viên</h1>
      <p style={{ color: '#475569', fontSize: 18, maxWidth: 760 }}>
        Tạo lời mời thành viên theo tổ chức đang chọn. API hiện có endpoint tạo
        lời mời, nhưng chưa có endpoint liệt kê lời mời; bảng bên dưới chỉ hiển
        thị các lời mời vừa tạo trong phiên trình duyệt này.
      </p>

      <section
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 14,
          marginTop: 24,
          maxWidth: 760,
          padding: 24,
        }}
      >
        <h2 style={{ fontSize: 22, margin: 0 }}>Tạo lời mời</h2>
        <p style={{ color: '#64748b', fontSize: 15 }}>
          Tổ chức:{' '}
          <strong>
            {activeOrganization?.name ?? activeOrgId ?? 'Chưa chọn tổ chức'}
          </strong>
        </p>

        <form onSubmit={(event) => void handleSubmit(event)}>
          <label style={labelStyle}>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nhanvien@congty.vn"
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Vai trò
            <select
              value={role}
              onChange={(event) =>
                setRole(event.target.value as OrganizationRole)
              }
              style={inputStyle}
            >
              {inviteRoles.map((inviteRole) => (
                <option key={inviteRole.value} value={inviteRole.value}>
                  {inviteRole.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={submitting || !activeOrgId}
            style={{
              background: '#2563eb',
              border: 'none',
              borderRadius: 10,
              color: '#ffffff',
              cursor: submitting || !activeOrgId ? 'not-allowed' : 'pointer',
              fontSize: 16,
              fontWeight: 800,
              marginTop: 18,
              opacity: submitting || !activeOrgId ? 0.7 : 1,
              padding: '12px 18px',
            }}
          >
            {submitting ? 'Đang tạo...' : 'Tạo lời mời'}
          </button>
        </form>

        {success ? (
          <p role="status" style={{ color: '#15803d', fontSize: 15 }}>
            {success}
          </p>
        ) : null}
        {error ? (
          <p role="alert" style={{ color: '#b91c1c', fontSize: 15 }}>
            {error}
          </p>
        ) : null}
      </section>

      <section style={{ marginTop: 36 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 22 }}>
          Lời mời vừa tạo
        </h2>

        {createdInvites.length === 0 ? (
          <div
            style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 12,
              color: '#92400e',
              maxWidth: 760,
              padding: 16,
            }}
          >
            Chưa có lời mời nào trong phiên này. TODO backend: thêm GET
            /v1/orgs/:orgId/invites để web hiển thị toàn bộ lịch sử lời mời.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                borderCollapse: 'collapse',
                minWidth: 680,
                width: '100%',
              }}
            >
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Email</th>
                  <th style={tableHeaderStyle}>Vai trò</th>
                  <th style={tableHeaderStyle}>Hết hạn</th>
                  <th style={tableHeaderStyle}>Tạo lúc</th>
                </tr>
              </thead>
              <tbody>
                {createdInvites.map((invite) => (
                  <tr key={invite.id}>
                    <td style={tableCellStyle}>{invite.email}</td>
                    <td style={tableCellStyle}>{formatRole(invite.role)}</td>
                    <td style={tableCellStyle}>
                      {formatDateTime(invite.expiresAt)}
                    </td>
                    <td style={tableCellStyle}>
                      {formatDateTime(invite.createdAt)}
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

function formatRole(role: OrganizationRole) {
  return inviteRoles.find((inviteRole) => inviteRole.value === role)?.label ?? role;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

const labelStyle: CSSProperties = {
  color: '#334155',
  display: 'flex',
  flexDirection: 'column',
  fontSize: 14,
  fontWeight: 700,
  gap: 6,
  marginTop: 16,
};

const inputStyle: CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 10,
  color: '#0f172a',
  font: 'inherit',
  maxWidth: 420,
  padding: '11px 12px',
};

const tableHeaderStyle: CSSProperties = {
  borderBottom: '1px solid #e2e8f0',
  color: '#334155',
  fontSize: 14,
  fontWeight: 700,
  padding: '12px 16px',
  textAlign: 'left' as const,
};

const tableCellStyle: CSSProperties = {
  borderBottom: '1px solid #f1f5f9',
  color: '#0f172a',
  fontSize: 15,
  padding: '12px 16px',
};

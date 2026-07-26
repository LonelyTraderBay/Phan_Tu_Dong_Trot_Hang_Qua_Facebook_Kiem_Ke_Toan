'use client';

import {
  type CSSProperties,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ApiClientError,
  acceptInvite,
  createInvite,
  listInvites,
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
  const [pendingInvites, setPendingInvites] = useState<MembershipInvite[]>([]);
  const [lastToken, setLastToken] = useState<string | null>(null);
  const [acceptToken, setAcceptToken] = useState('');
  const [loadingList, setLoadingList] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshPendingInvites = useCallback(async (orgId: string) => {
    setLoadingList(true);
    try {
      const { invites } = await listInvites(orgId);
      setPendingInvites(invites);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Không thể tải danh sách lời mời.';
      setError(message);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    function loadOrgContext() {
      const orgId = getActiveOrgId();
      setActiveOrgId(orgId);
      setOrganizations(getStoredOrganizations());
      setLastToken(null);
      if (orgId) {
        void refreshPendingInvites(orgId);
      } else {
        setPendingInvites([]);
      }
    }

    loadOrgContext();
    window.addEventListener(SESSION_CHANGED_EVENT, loadOrgContext);
    window.addEventListener('storage', loadOrgContext);

    return () => {
      window.removeEventListener(SESSION_CHANGED_EVENT, loadOrgContext);
      window.removeEventListener('storage', loadOrgContext);
    };
  }, [refreshPendingInvites]);

  const activeOrganization = useMemo(
    () => organizations.find((org) => org.id === activeOrgId) ?? null,
    [activeOrgId, organizations],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess(null);
    setError(null);
    setLastToken(null);

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
      const { invite, token } = await createInvite({
        orgId: activeOrgId,
        email: inviteEmail,
        role,
      });
      setPendingInvites((current) => [invite, ...current]);
      setLastToken(token);
      setEmail('');
      setSuccess(
        `Đã tạo lời mời cho ${invite.email}. Sao chép token một lần bên dưới (local/Mailpit).`,
      );
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

  async function handleAccept(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess(null);
    setError(null);

    const token = acceptToken.trim();
    if (!token) {
      setError('Vui lòng dán token lời mời.');
      return;
    }

    setAccepting(true);
    try {
      const { membership } = await acceptInvite(token);
      setAcceptToken('');
      setSuccess(
        `Đã chấp nhận lời mời — vai trò ${formatRole(membership.role)} trong tổ chức ${membership.orgId}.`,
      );
      if (activeOrgId) {
        void refreshPendingInvites(activeOrgId);
      }
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Không thể chấp nhận lời mời.';
      setError(message);
    } finally {
      setAccepting(false);
    }
  }

  return (
    <main>
      <h1 style={{ margin: 0, fontSize: 32 }}>Lời mời thành viên</h1>
      <p style={{ color: '#475569', fontSize: 18, maxWidth: 760 }}>
        Tạo lời mời, xem danh sách đang chờ, và chấp nhận bằng token (local —
        không cần email provider). Token thô chỉ hiện một lần khi tạo.
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

        {lastToken ? (
          <div
            role="status"
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: 10,
              marginTop: 16,
              padding: 12,
            }}
          >
            <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 14 }}>
              Token một lần (sao chép ngay)
            </p>
            <code
              style={{
                display: 'block',
                fontSize: 12,
                overflowWrap: 'anywhere',
                wordBreak: 'break-all',
              }}
            >
              {lastToken}
            </code>
          </div>
        ) : null}

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
        <h2 style={{ fontSize: 22, margin: 0 }}>Chấp nhận lời mời</h2>
        <p style={{ color: '#64748b', fontSize: 15 }}>
          Đăng nhập bằng đúng email được mời, dán token, rồi chấp nhận. Không
          cần X-Org-Id.
        </p>
        <form onSubmit={(event) => void handleAccept(event)}>
          <label style={labelStyle}>
            Token
            <input
              type="text"
              value={acceptToken}
              onChange={(event) => setAcceptToken(event.target.value)}
              placeholder="Dán token 64 ký tự hex"
              style={{ ...inputStyle, maxWidth: '100%', fontFamily: 'monospace' }}
            />
          </label>
          <button
            type="submit"
            disabled={accepting}
            style={{
              background: '#0f766e',
              border: 'none',
              borderRadius: 10,
              color: '#ffffff',
              cursor: accepting ? 'not-allowed' : 'pointer',
              fontSize: 16,
              fontWeight: 800,
              marginTop: 18,
              opacity: accepting ? 0.7 : 1,
              padding: '12px 18px',
            }}
          >
            {accepting ? 'Đang chấp nhận...' : 'Chấp nhận lời mời'}
          </button>
        </form>
      </section>

      <section style={{ marginTop: 36 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 22 }}>
          Lời mời đang chờ
          {loadingList ? ' (đang tải...)' : ''}
        </h2>

        {pendingInvites.length === 0 ? (
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              color: '#475569',
              maxWidth: 760,
              padding: 16,
            }}
          >
            Không có lời mời đang chờ cho tổ chức này.
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
                {pendingInvites.map((invite) => (
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

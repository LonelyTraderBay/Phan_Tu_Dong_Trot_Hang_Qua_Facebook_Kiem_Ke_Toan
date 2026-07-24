'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type CSSProperties, type FormEvent, useState } from 'react';

import {
  ApiClientError,
  listOrganizations,
  mapOrganizationMemberships,
} from '../lib/api-client';
import {
  saveSession,
  type OrganizationRole,
  type StoredOrganization,
} from '../lib/auth-session';

type AuthMode = 'login' | 'signup';

type AuthFormProps = {
  mode: AuthMode;
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [orgId, setOrgId] = useState('');
  const [orgName, setOrgName] = useState('');
  const [role, setRole] = useState<OrganizationRole>('owner');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isSignup = mode === 'signup';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const token = accessToken.trim();
    if (!token) {
      setError('Vui lòng nhập access token Supabase của người dùng.');
      return;
    }

    const manualOrganization = buildManualOrganization({
      id: orgId,
      name: orgName,
      role,
    });
    let organizations = manualOrganization ? [manualOrganization] : [];

    setLoading(true);
    try {
      try {
        const memberships = await listOrganizations(token);
        const apiOrganizations = mapOrganizationMemberships(memberships);
        if (apiOrganizations.length > 0) {
          organizations = apiOrganizations;
        }
      } catch (err) {
        if (organizations.length === 0) {
          throw err;
        }

        setNotice(
          'Chưa tải được danh sách tổ chức từ API, tạm dùng tổ chức nhập tay.',
        );
      }

      if (organizations.length === 0) {
        setError(
          'Token hợp lệ nhưng chưa có tổ chức. Hãy nhập Org ID hoặc tạo tổ chức trước.',
        );
        return;
      }

      saveSession({
        accessToken: token,
        organizations,
        activeOrgId: organizations[0]?.id,
      });
      router.replace('/dashboard');
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Không thể xác thực phiên đăng nhập.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        display: 'grid',
        minHeight: '100vh',
        padding: '32px 16px',
        placeItems: 'center',
      }}
    >
      <section
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          boxShadow: '0 20px 45px rgba(15, 23, 42, 0.08)',
          maxWidth: 560,
          padding: 32,
          width: '100%',
        }}
      >
        <p
          style={{
            color: '#2563eb',
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: '0.08em',
            margin: '0 0 12px',
            textTransform: 'uppercase',
          }}
        >
          Omni Commerce
        </p>
        <h1 style={{ fontSize: 32, lineHeight: 1.15, margin: 0 }}>
          {isSignup ? 'Tạo phiên dùng thử' : 'Đăng nhập bảng điều khiển'}
        </h1>
        <p style={{ color: '#475569', fontSize: 16, lineHeight: 1.6 }}>
          Web package chưa có @supabase/ssr, nên màn hình này là auth shell
          dạng production: nhập access token người dùng, tải danh sách tổ chức
          từ API nếu có, rồi lưu phiên vào trình duyệt.
        </p>

        <form onSubmit={(event) => void handleSubmit(event)}>
          <label style={labelStyle}>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ban@congty.vn"
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Access token
            <textarea
              value={accessToken}
              onChange={(event) => setAccessToken(event.target.value)}
              placeholder="Dán Supabase user access token"
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </label>

          <fieldset
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              margin: '18px 0 0',
              padding: 16,
            }}
          >
            <legend style={{ color: '#334155', fontWeight: 800 }}>
              Tổ chức dự phòng
            </legend>
            <p style={{ color: '#64748b', fontSize: 14, marginTop: 0 }}>
              Nếu API chưa chạy, nhập Org ID để app vẫn gửi X-Org-Id cho các
              màn hình đã được bảo vệ.
            </p>
            <label style={labelStyle}>
              Org ID
              <input
                type="text"
                value={orgId}
                onChange={(event) => setOrgId(event.target.value)}
                placeholder="11111111-1111-1111-1111-111111111111"
                style={inputStyle}
              />
            </label>
            <label style={labelStyle}>
              Tên tổ chức
              <input
                type="text"
                value={orgName}
                onChange={(event) => setOrgName(event.target.value)}
                placeholder="Shop của tôi"
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
                <option value="owner">Chủ sở hữu</option>
                <option value="cskh">CSKH</option>
                <option value="kho">Kho</option>
              </select>
            </label>
          </fieldset>

          {notice ? (
            <p role="status" style={{ color: '#1d4ed8', fontSize: 14 }}>
              {notice}
            </p>
          ) : null}
          {error ? (
            <p role="alert" style={{ color: '#b91c1c', fontSize: 14 }}>
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: '#2563eb',
              border: 'none',
              borderRadius: 10,
              color: '#ffffff',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 16,
              fontWeight: 800,
              marginTop: 22,
              opacity: loading ? 0.75 : 1,
              padding: '13px 18px',
              width: '100%',
            }}
          >
            {loading
              ? 'Đang lưu phiên...'
              : isSignup
                ? 'Tạo phiên'
                : 'Đăng nhập'}
          </button>
        </form>

        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 0 }}>
          {isSignup ? 'Đã có phiên?' : 'Cần tạo phiên thử?'}{' '}
          <Link
            href={isSignup ? '/login' : '/signup'}
            style={{ color: '#2563eb', fontWeight: 700 }}
          >
            {isSignup ? 'Đăng nhập' : 'Mở trang tạo phiên'}
          </Link>
        </p>
      </section>
    </main>
  );
}

function buildManualOrganization(input: {
  id: string;
  name: string;
  role: OrganizationRole;
}): StoredOrganization | null {
  const id = input.id.trim();
  if (!id) {
    return null;
  }

  const name = input.name.trim() || id;
  return {
    id,
    name,
    role: input.role,
  };
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
  padding: '11px 12px',
};

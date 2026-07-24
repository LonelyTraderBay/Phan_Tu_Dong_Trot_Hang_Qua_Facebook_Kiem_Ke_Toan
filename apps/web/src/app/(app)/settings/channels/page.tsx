'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, Suspense, useCallback, useEffect, useState } from 'react';

import {
  ApiClientError,
  connectZalo,
  getMetaOAuthUrl,
  listChannels,
  type ChannelConnection,
} from '../../../../lib/api-client';
import { SESSION_CHANGED_EVENT } from '../../../../lib/auth-session';

const PROVIDER_LABELS: Record<string, string> = {
  meta_page: 'Facebook Page',
  meta_ig: 'Instagram',
  zalo_oa: 'Zalo OA',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Đang hoạt động',
  needs_reauth: 'Cần đăng nhập lại',
  revoked: 'Đã thu hồi',
};

function formatProvider(provider: string) {
  return PROVIDER_LABELS[provider] ?? provider;
}

function formatStatus(status: string) {
  return STATUS_LABELS[status] ?? status;
}

function ChannelsSettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [channels, setChannels] = useState<ChannelConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [zaloAccessToken, setZaloAccessToken] = useState('');
  const [zaloDisplayName, setZaloDisplayName] = useState('');
  const [zaloOaId, setZaloOaId] = useState('');
  const [zaloSaving, setZaloSaving] = useState(false);

  const loadChannels = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await listChannels();
      setChannels(data);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Không thể tải danh sách kênh.';
      setError(message);
      setChannels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadChannels();
  }, [loadChannels]);

  useEffect(() => {
    function handleSessionChanged() {
      void loadChannels();
    }

    window.addEventListener(SESSION_CHANGED_EVENT, handleSessionChanged);
    window.addEventListener('storage', handleSessionChanged);

    return () => {
      window.removeEventListener(SESSION_CHANGED_EVENT, handleSessionChanged);
      window.removeEventListener('storage', handleSessionChanged);
    };
  }, [loadChannels]);

  useEffect(() => {
    const oauthError = searchParams.get('oauth_error');
    const oauthSuccess = searchParams.get('oauth_success');

    if (oauthError) {
      setError(oauthError);
      setSuccess(null);
    } else if (oauthSuccess) {
      setSuccess('Đã kết nối kênh Meta thành công.');
      setError(null);
      void loadChannels();
    } else {
      return;
    }

    router.replace('/settings/channels');
  }, [loadChannels, router, searchParams]);

  async function handleConnect() {
    setConnecting(true);
    setError(null);

    try {
      const { url } = await getMetaOAuthUrl();
      window.location.assign(url);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Không thể bắt đầu kết nối Meta.';
      setError(message);
      setConnecting(false);
    }
  }

  async function handleZaloConnect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setZaloSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await connectZalo({
        oaId: zaloOaId,
        accessToken: zaloAccessToken,
        displayName: zaloDisplayName.trim() || undefined,
      });
      setSuccess('Đã kết nối Zalo OA thành công.');
      setZaloAccessToken('');
      setZaloDisplayName('');
      setZaloOaId('');
      await loadChannels();
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Không thể kết nối Zalo OA.';
      setError(message);
    } finally {
      setZaloSaving(false);
    }
  }

  return (
    <main>
      <h1 style={{ margin: 0, fontSize: 32 }}>Kết nối kênh</h1>
      <p style={{ color: '#475569', fontSize: 18, maxWidth: 720 }}>
        Liên kết trang Facebook và tài khoản Instagram Business để nhận tin
        nhắn qua Omni Commerce. Token truy cập được lưu an toàn trên máy chủ
        và không hiển thị tại đây.
      </p>

      <div style={{ marginTop: 24 }}>
        <button
          type="button"
          onClick={() => void handleConnect()}
          disabled={connecting}
          style={{
            background: '#2563eb',
            border: 'none',
            borderRadius: 8,
            color: '#ffffff',
            cursor: connecting ? 'not-allowed' : 'pointer',
            fontSize: 16,
            fontWeight: 600,
            opacity: connecting ? 0.7 : 1,
            padding: '12px 20px',
          }}
        >
          {connecting ? 'Đang chuyển hướng…' : 'Kết nối Facebook / Instagram'}
        </button>
      </div>

      <section
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          marginTop: 24,
          maxWidth: 720,
          padding: 20,
        }}
      >
        <h2 style={{ fontSize: 22, margin: 0 }}>Kết nối Zalo OA</h2>
        <p style={{ color: '#64748b', marginBottom: 16 }}>
          Nhập OA ID và access token hiện có. Token được mã hóa trên máy chủ và
          không hiển thị lại trong giao diện.
        </p>
        <form onSubmit={(event) => void handleZaloConnect(event)}>
          <label style={formLabelStyle}>
            OA ID
            <input
              required
              value={zaloOaId}
              onChange={(event) => setZaloOaId(event.target.value)}
              style={formInputStyle}
              placeholder="Ví dụ: 123456789"
            />
          </label>
          <label style={formLabelStyle}>
            Tên hiển thị (tuỳ chọn)
            <input
              value={zaloDisplayName}
              onChange={(event) => setZaloDisplayName(event.target.value)}
              style={formInputStyle}
              placeholder="Zalo Shop"
            />
          </label>
          <label style={formLabelStyle}>
            Access token
            <input
              required
              type="password"
              value={zaloAccessToken}
              onChange={(event) => setZaloAccessToken(event.target.value)}
              style={formInputStyle}
              placeholder="Nhập token Zalo OA"
            />
          </label>
          <button
            type="submit"
            disabled={zaloSaving}
            style={{
              background: '#0f766e',
              border: 'none',
              borderRadius: 8,
              color: '#ffffff',
              cursor: zaloSaving ? 'not-allowed' : 'pointer',
              fontSize: 16,
              fontWeight: 600,
              opacity: zaloSaving ? 0.7 : 1,
              padding: '10px 16px',
            }}
          >
            {zaloSaving ? 'Đang lưu…' : 'Lưu Zalo OA'}
          </button>
        </form>
      </section>

      {success ? (
        <p
          role="status"
          style={{
            color: '#15803d',
            fontSize: 16,
            marginTop: 20,
          }}
        >
          {success}
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          style={{
            color: '#b91c1c',
            fontSize: 16,
            marginTop: 20,
          }}
        >
          {error}
        </p>
      ) : null}

      <section style={{ marginTop: 40 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 22 }}>Kênh đã nối</h2>

        {loading ? (
          <p style={{ color: '#64748b' }}>Đang tải…</p>
        ) : channels.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: 16 }}>
            Chưa kết nối trang nào
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                borderCollapse: 'collapse',
                minWidth: 560,
                width: '100%',
              }}
            >
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Nhà cung cấp</th>
                  <th style={tableHeaderStyle}>Page ID</th>
                  <th style={tableHeaderStyle}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((channel) => (
                  <tr key={channel.id}>
                    <td style={tableCellStyle}>
                      {formatProvider(channel.provider)}
                    </td>
                    <td style={tableCellStyle}>{channel.externalPageId}</td>
                    <td style={tableCellStyle}>
                      {formatStatus(channel.status)}
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

const tableHeaderStyle = {
  borderBottom: '1px solid #e2e8f0',
  color: '#334155',
  fontSize: 14,
  fontWeight: 700,
  padding: '12px 16px',
  textAlign: 'left' as const,
};

const tableCellStyle = {
  borderBottom: '1px solid #f1f5f9',
  color: '#0f172a',
  fontSize: 15,
  padding: '12px 16px',
};

const formLabelStyle = {
  color: '#334155',
  display: 'block',
  fontSize: 14,
  fontWeight: 700,
  marginBottom: 12,
};

const formInputStyle = {
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  display: 'block',
  fontSize: 16,
  marginTop: 6,
  padding: '10px 12px',
  width: '100%',
};

export default function ChannelsSettingsPage() {
  return (
    <Suspense
      fallback={
        <main>
          <p style={{ color: '#64748b' }}>Đang tải…</p>
        </main>
      }
    >
      <ChannelsSettingsContent />
    </Suspense>
  );
}

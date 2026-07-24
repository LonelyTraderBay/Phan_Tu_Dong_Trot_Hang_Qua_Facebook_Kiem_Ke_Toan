'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

import {
  ApiClientError,
  getMetaOAuthUrl,
  listChannels,
  type ChannelConnection,
} from '../../../../lib/api-client';

const PROVIDER_LABELS: Record<string, string> = {
  meta_page: 'Facebook Page',
  meta_ig: 'Instagram',
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

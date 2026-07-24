'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';

import {
  ApiClientError,
  listOrganizations,
  mapOrganizationMemberships,
} from '../lib/api-client';
import {
  clearSession,
  getAccessToken,
  getStoredOrganizations,
  saveOrganizations,
  SESSION_CHANGED_EVENT,
  type StoredOrganization,
} from '../lib/auth-session';
import { getActiveOrgId, setActiveOrgId } from '../lib/org-context';

const navItems = [
  { href: '/dashboard', label: 'Tổng quan' },
  { href: '/inbox', label: 'Hộp thư' },
  { href: '/catalog', label: 'Sản phẩm' },
  { href: '/inventory', label: 'Kho' },
  { href: '/orders', label: 'Đơn hàng' },
  { href: '/cod', label: 'COD' },
  { href: '/pnl', label: 'Lãi gộp' },
  { href: '/settings/channels', label: 'Kênh' },
  { href: '/settings', label: 'Cài đặt' },
  { href: '/settings/invites', label: 'Lời mời' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<StoredOrganization[]>([]);
  const [activeOrgId, setActiveOrgIdState] = useState<string>('');
  const [message, setMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    function loadSession() {
      const token = getAccessToken();
      if (!token) {
        router.replace('/login');
        return;
      }

      const storedOrganizations = getStoredOrganizations();
      setOrganizations(storedOrganizations);

      const storedActiveOrgId =
        getActiveOrgId() ?? storedOrganizations[0]?.id ?? '';
      if (storedActiveOrgId) {
        setActiveOrgId(storedActiveOrgId);
      }
      setActiveOrgIdState(storedActiveOrgId);
    }

    loadSession();
    window.addEventListener(SESSION_CHANGED_EVENT, loadSession);
    window.addEventListener('storage', loadSession);

    return () => {
      window.removeEventListener(SESSION_CHANGED_EVENT, loadSession);
      window.removeEventListener('storage', loadSession);
    };
  }, [router]);

  async function handleRefreshOrganizations() {
    setRefreshing(true);
    setMessage(null);

    try {
      const memberships = await listOrganizations();
      const nextOrganizations = mapOrganizationMemberships(memberships);
      saveOrganizations(nextOrganizations);
      setOrganizations(nextOrganizations);
      setActiveOrgIdState(getActiveOrgId() ?? nextOrganizations[0]?.id ?? '');
      setMessage('Đã cập nhật danh sách tổ chức.');
    } catch (err) {
      const errorMessage =
        err instanceof ApiClientError
          ? err.message
          : 'Không thể cập nhật danh sách tổ chức.';
      setMessage(errorMessage);
    } finally {
      setRefreshing(false);
    }
  }

  function handleOrgChange(orgId: string) {
    setActiveOrgId(orgId || null);
    setActiveOrgIdState(orgId);
    router.refresh();
    window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
  }

  function handleSignOut() {
    clearSession();
    router.replace('/login');
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <header
        style={{
          alignItems: 'center',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          justifyContent: 'space-between',
          padding: '16px 32px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link
            href="/dashboard"
            style={{
              color: '#0f172a',
              fontSize: 18,
              fontWeight: 800,
              textDecoration: 'none',
            }}
          >
            Omni Commerce
          </Link>
          <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {navItems.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== '/settings' &&
                  pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    color: active ? '#2563eb' : '#475569',
                    fontSize: 14,
                    fontWeight: active ? 700 : 600,
                    textDecoration: 'none',
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <label
            style={{
              color: '#334155',
              display: 'flex',
              flexDirection: 'column',
              fontSize: 12,
              fontWeight: 700,
              gap: 4,
            }}
          >
            Tổ chức đang dùng
            <select
              value={activeOrgId}
              onChange={(event) => handleOrgChange(event.target.value)}
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                color: '#0f172a',
                minWidth: 220,
                padding: '8px 10px',
              }}
            >
              {organizations.length === 0 ? (
                <option value="">Chưa có tổ chức</option>
              ) : null}
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                  {org.role ? ` (${org.role})` : ''}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => void handleRefreshOrganizations()}
            disabled={refreshing}
            style={secondaryButtonStyle}
          >
            {refreshing ? 'Đang tải...' : 'Tải tổ chức'}
          </button>
          <button type="button" onClick={handleSignOut} style={dangerButtonStyle}>
            Đăng xuất
          </button>
        </div>
      </header>

      {message ? (
        <p
          role="status"
          style={{
            background: '#eff6ff',
            color: '#1d4ed8',
            margin: 0,
            padding: '10px 32px',
          }}
        >
          {message}
        </p>
      ) : null}

      <div style={{ padding: '32px' }}>{children}</div>
    </div>
  );
}

const secondaryButtonStyle = {
  background: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  color: '#0f172a',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 700,
  padding: '9px 12px',
};

const dangerButtonStyle = {
  ...secondaryButtonStyle,
  color: '#b91c1c',
};

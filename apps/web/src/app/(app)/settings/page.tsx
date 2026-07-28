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
  listOrganizations,
  updateOrgSettings,
  type OrganizationMembership,
} from '../../../lib/api-client';
import {
  getStoredOrganizations,
  SESSION_CHANGED_EVENT,
  type StoredOrganization,
} from '../../../lib/auth-session';
import { getActiveOrgId } from '../../../lib/org-context';

type UiSettings = {
  autoConfirm: boolean;
  aiReplies: boolean;
  aiDraftOrders: boolean;
  aiProductSuggestions: boolean;
};

const defaultSettings: UiSettings = {
  autoConfirm: false,
  aiReplies: true,
  aiDraftOrders: true,
  aiProductSuggestions: true,
};

export default function SettingsPage() {
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<StoredOrganization[]>([]);
  const [settings, setSettings] = useState<UiSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeOrganization = useMemo(
    () => organizations.find((org) => org.id === activeOrgId) ?? null,
    [activeOrgId, organizations],
  );

  const loadSettings = useCallback(async () => {
    const orgId = getActiveOrgId();
    setActiveOrgId(orgId);
    setOrganizations(getStoredOrganizations());
    setLoading(true);
    setError(null);
    setMessage(null);

    if (!orgId) {
      setSettings(defaultSettings);
      setLoading(false);
      return;
    }

    try {
      const memberships = await listOrganizations();
      const membership = memberships.find(
        (item) => item.organization.id === orgId,
      );
      const serverSettings = settingsFromMembership(membership);
      setSettings(readLocalSettings(orgId) ?? serverSettings);
    } catch (err) {
      setSettings(readLocalSettings(orgId) ?? defaultSettings);
      setError(
        getApiErrorMessage(
          err,
          'Không thể tải cấu hình từ API; đang dùng cấu hình trong trình duyệt.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    function handleSessionChanged() {
      void loadSettings();
    }

    void loadSettings();
    window.addEventListener(SESSION_CHANGED_EVENT, handleSessionChanged);
    window.addEventListener('storage', handleSessionChanged);

    return () => {
      window.removeEventListener(SESSION_CHANGED_EVENT, handleSessionChanged);
      window.removeEventListener('storage', handleSessionChanged);
    };
  }, [loadSettings]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    if (!activeOrgId) {
      setError('Hãy chọn tổ chức trước khi lưu cài đặt.');
      setSaving(false);
      return;
    }

    try {
      await updateOrgSettings(activeOrgId, settings);
      setMessage('Đã lưu cài đặt lên máy chủ.');
    } catch (err) {
      try {
        window.localStorage.setItem(storageKey(activeOrgId), JSON.stringify(settings));
        setError(
          getApiErrorMessage(
            err,
            'Không lưu được lên máy chủ, đã lưu tạm trên trình duyệt này.',
          ),
        );
      } catch {
        setError('Không thể lưu cài đặt vào trình duyệt.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <main>
      <header>
        <h1 style={{ margin: 0, fontSize: 32 }}>Cài đặt</h1>
        <p style={descriptionStyle}>
          Bật/tắt tự xác nhận đơn và các luồng AI cho tổ chức đang chọn. Trang
          này không đưa secret vào NEXT_PUBLIC.
        </p>
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

      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>Tổ chức</h2>
        <p style={mutedStyle}>
          Đang cấu hình:{' '}
          <strong>{activeOrganization?.name ?? activeOrgId ?? 'Chưa chọn'}</strong>
        </p>

        {loading ? (
          <p style={mutedStyle}>Đang tải cài đặt...</p>
        ) : (
          <form onSubmit={(event) => void handleSubmit(event)}>
            <ToggleRow
              title="Tự xác nhận đơn"
              description="Khi backend hỗ trợ lưu, đơn nháp hợp lệ sẽ được xác nhận tự động theo settings_json.auto_confirm."
              checked={settings.autoConfirm}
              onChange={(checked) =>
                setSettings((current) => ({ ...current, autoConfirm: checked }))
              }
            />
            <ToggleRow
              title="AI trả lời hội thoại"
              description="Cho phép AI đề xuất hoặc gửi phản hồi trong hộp thư theo chính sách vận hành."
              checked={settings.aiReplies}
              onChange={(checked) =>
                setSettings((current) => ({ ...current, aiReplies: checked }))
              }
            />
            <ToggleRow
              title="AI tạo nháp đơn"
              description="Cho phép AI gom sản phẩm trong hội thoại và tạo đơn nháp để nhân viên duyệt."
              checked={settings.aiDraftOrders}
              onChange={(checked) =>
                setSettings((current) => ({ ...current, aiDraftOrders: checked }))
              }
            />
            <ToggleRow
              title="AI gợi ý sản phẩm"
              description="Cho phép AI dùng danh mục để đề xuất sản phẩm phù hợp với nhu cầu khách."
              checked={settings.aiProductSuggestions}
              onChange={(checked) =>
                setSettings((current) => ({
                  ...current,
                  aiProductSuggestions: checked,
                }))
              }
            />

            <button
              type="submit"
              disabled={saving || !activeOrgId}
              style={{
                ...primaryButtonStyle,
                cursor: saving || !activeOrgId ? 'not-allowed' : 'pointer',
                opacity: saving || !activeOrgId ? 0.7 : 1,
              }}
            >
              {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label style={toggleRowStyle}>
      <span>
        <strong style={{ color: '#0f172a', display: 'block', fontSize: 16 }}>
          {title}
        </strong>
        <span style={mutedStyle}>{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        style={{ height: 20, width: 20 }}
      />
    </label>
  );
}

function storageKey(orgId: string) {
  return `omni.uiSettings.${orgId}`;
}

function readLocalSettings(orgId: string): UiSettings | null {
  try {
    const raw = window.localStorage.getItem(storageKey(orgId));
    if (!raw) {
      return null;
    }

    return normalizeSettings(JSON.parse(raw));
  } catch {
    return null;
  }
}

function settingsFromMembership(
  membership: OrganizationMembership | undefined,
): UiSettings {
  return normalizeSettings(membership?.organization.settingsJson ?? {});
}

function normalizeSettings(input: unknown): UiSettings {
  if (!input || typeof input !== 'object') {
    return defaultSettings;
  }

  const row = input as Record<string, unknown>;
  return {
    autoConfirm:
      row.auto_confirm === true ||
      row.autoConfirm === true ||
      defaultSettings.autoConfirm,
    aiReplies:
      booleanSetting(row.aiReplies, row.ai_replies, defaultSettings.aiReplies),
    aiDraftOrders: booleanSetting(
      row.aiDraftOrders,
      row.ai_draft_orders,
      defaultSettings.aiDraftOrders,
    ),
    aiProductSuggestions: booleanSetting(
      row.aiProductSuggestions,
      row.ai_product_suggestions,
      defaultSettings.aiProductSuggestions,
    ),
  };
}

function booleanSetting(
  camelValue: unknown,
  snakeValue: unknown,
  fallback: boolean,
) {
  if (typeof camelValue === 'boolean') {
    return camelValue;
  }
  if (typeof snakeValue === 'boolean') {
    return snakeValue;
  }

  return fallback;
}

function getApiErrorMessage(err: unknown, fallback: string) {
  return err instanceof ApiClientError ? err.message : fallback;
}

const descriptionStyle: CSSProperties = {
  color: '#475569',
  fontSize: 18,
  maxWidth: 760,
};

const panelStyle: CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  marginTop: 24,
  maxWidth: 860,
  padding: 24,
};

const sectionTitleStyle: CSSProperties = {
  fontSize: 22,
  margin: '0 0 16px',
};

const toggleRowStyle: CSSProperties = {
  alignItems: 'center',
  borderBottom: '1px solid #f1f5f9',
  display: 'flex',
  gap: 16,
  justifyContent: 'space-between',
  padding: '16px 0',
};

const primaryButtonStyle: CSSProperties = {
  background: '#2563eb',
  border: 'none',
  borderRadius: 10,
  color: '#ffffff',
  fontSize: 15,
  fontWeight: 800,
  marginTop: 18,
  padding: '11px 16px',
};

const mutedStyle: CSSProperties = {
  color: '#64748b',
  fontSize: 15,
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

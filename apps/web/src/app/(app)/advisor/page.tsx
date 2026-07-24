'use client';

import { type CSSProperties, useState } from 'react';

import {
  ApiClientError,
  getAdvisorSuggestion,
  type AdvisorSuggestion,
} from '../../../lib/api-client';

export default function AdvisorPage() {
  const [goal, setGoal] = useState('Tăng doanh thu tuần này');
  const [suggestion, setSuggestion] = useState<AdvisorSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSuggest() {
    setLoading(true);
    setError(null);

    try {
      setSuggestion(
        await getAdvisorSuggestion({
          goal: goal.trim() || undefined,
        }),
      );
    } catch (err) {
      setSuggestion(null);
      setError(getApiErrorMessage(err, 'Không thể lấy gợi ý advisor.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <header style={headerStyle}>
        <div>
          <h1 style={{ margin: 0, fontSize: 32 }}>Owner Advisor</h1>
          <p style={descriptionStyle}>
            AI advisor chỉ đưa gợi ý bán hàng dựa trên RAG/catalog aggregate
            stub. Người bán duyệt thủ công; hệ thống không auto-post, không mua
            ads và không gửi Meta từ trang này.
          </p>
        </div>
      </header>

      <section style={panelStyle}>
        <label style={labelStyle}>
          Mục tiêu
          <input
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            maxLength={500}
            placeholder="Ví dụ: đẩy hàng tồn cuối tuần"
            style={inputStyle}
          />
        </label>
        <button
          type="button"
          onClick={() => void handleSuggest()}
          disabled={loading}
          style={primaryButtonStyle}
        >
          {loading ? 'Đang lấy gợi ý...' : 'Lấy gợi ý'}
        </button>
      </section>

      {error ? (
        <p role="alert" style={alertStyle}>
          {error}
        </p>
      ) : null}

      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>Gợi ý</h2>
        {!suggestion ? (
          <p style={emptyStyle}>Bấm “Lấy gợi ý” để tạo đề xuất cho chủ shop.</p>
        ) : (
          <>
            <p role="status" style={disclaimerStyle}>
              {suggestion.disclaimer} Người duyệt: chủ shop hoặc nhân sự được
              phân quyền.
            </p>
            <pre style={suggestionStyle}>{suggestion.suggestionsText}</pre>
            <p style={mutedStyle}>
              Prompt: {suggestion.promptVersion} · Model: {suggestion.model}
            </p>
            <p style={mutedStyle}>{suggestion.entitlement.note}</p>
          </>
        )}
      </section>
    </main>
  );
}

function getApiErrorMessage(err: unknown, fallback: string) {
  return err instanceof ApiClientError ? err.message : fallback;
}

const headerStyle: CSSProperties = {
  alignItems: 'flex-start',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 16,
  justifyContent: 'space-between',
};

const descriptionStyle: CSSProperties = {
  color: '#475569',
  fontSize: 18,
  maxWidth: 860,
};

const panelStyle: CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  marginTop: 24,
  padding: 20,
};

const labelStyle: CSSProperties = {
  color: '#334155',
  display: 'flex',
  flexDirection: 'column',
  fontSize: 13,
  fontWeight: 700,
  gap: 6,
  marginBottom: 12,
};

const inputStyle: CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  color: '#0f172a',
  padding: '10px 12px',
};

const primaryButtonStyle: CSSProperties = {
  background: '#2563eb',
  border: 'none',
  borderRadius: 8,
  color: '#ffffff',
  cursor: 'pointer',
  fontWeight: 700,
  padding: '10px 14px',
};

const alertStyle: CSSProperties = {
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: 12,
  color: '#b91c1c',
  marginTop: 16,
  padding: 16,
};

const disclaimerStyle: CSSProperties = {
  background: '#fffbeb',
  border: '1px solid #fde68a',
  borderRadius: 12,
  color: '#92400e',
  padding: 16,
};

const suggestionStyle: CSSProperties = {
  background: '#0f172a',
  borderRadius: 12,
  color: '#e2e8f0',
  fontFamily: 'inherit',
  lineHeight: 1.6,
  overflowX: 'auto',
  padding: 16,
  whiteSpace: 'pre-wrap',
};

const sectionTitleStyle: CSSProperties = {
  color: '#0f172a',
  fontSize: 22,
  margin: 0,
};

const mutedStyle: CSSProperties = {
  color: '#64748b',
};

const emptyStyle: CSSProperties = {
  background: '#f8fafc',
  borderRadius: 12,
  color: '#64748b',
  padding: 16,
};

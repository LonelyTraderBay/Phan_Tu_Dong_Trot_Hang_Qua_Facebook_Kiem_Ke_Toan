'use client';

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ApiClientError,
  listInboxConversations,
  listInboxMessages,
  takeoverInboxConversation,
  type InboxConversation,
  type InboxMessage,
} from '../../../lib/api-client';
import { SESSION_CHANGED_EVENT } from '../../../lib/auth-session';

const POLL_INTERVAL_MS = 4000;

type LoadOptions = {
  silent?: boolean;
};

export default function InboxPage() {
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [takingOver, setTakingOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [takeoverMessage, setTakeoverMessage] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const selectedConversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  const selectedConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === selectedConversationId,
      ) ?? null,
    [conversations, selectedConversationId],
  );

  const loadConversations = useCallback(async (options: LoadOptions = {}) => {
    if (!options.silent) {
      setConversationsLoading(true);
    }

    try {
      const data = await listInboxConversations();
      setConversations(data);
      setSelectedConversationId((current) => {
        if (data.length === 0) {
          return null;
        }
        if (current && data.some((conversation) => conversation.id === current)) {
          return current;
        }

        return data[0].id;
      });
      setLastUpdatedAt(new Date());
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tải danh sách hội thoại.'));
      if (!options.silent) {
        setConversations([]);
        setSelectedConversationId(null);
      }
    } finally {
      if (!options.silent) {
        setConversationsLoading(false);
      }
    }
  }, []);

  const loadMessages = useCallback(
    async (conversationId: string, options: LoadOptions = {}) => {
      if (!options.silent) {
        setMessagesLoading(true);
      }

      try {
        const data = await listInboxMessages(conversationId);
        if (selectedConversationIdRef.current === conversationId) {
          setMessages(data);
          setLastUpdatedAt(new Date());
          setError(null);
        }
      } catch (err) {
        if (selectedConversationIdRef.current === conversationId) {
          setError(getApiErrorMessage(err, 'Không thể tải tin nhắn.'));
          if (!options.silent) {
            setMessages([]);
          }
        }
      } finally {
        if (
          !options.silent &&
          selectedConversationIdRef.current === conversationId
        ) {
          setMessagesLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    function handleSessionChanged() {
      setSelectedConversationId(null);
      setMessages([]);
      setTakeoverMessage(null);
      void loadConversations();
    }

    void loadConversations();
    window.addEventListener(SESSION_CHANGED_EVENT, handleSessionChanged);
    window.addEventListener('storage', handleSessionChanged);

    return () => {
      window.removeEventListener(SESSION_CHANGED_EVENT, handleSessionChanged);
      window.removeEventListener('storage', handleSessionChanged);
    };
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      setMessagesLoading(false);
      return;
    }

    setMessages([]);
    setTakeoverMessage(null);
    void loadMessages(selectedConversationId);
  }, [loadMessages, selectedConversationId]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadConversations({ silent: true });

      const conversationId = selectedConversationIdRef.current;
      if (conversationId) {
        void loadMessages(conversationId, { silent: true });
      }
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [loadConversations, loadMessages]);

  async function handleTakeover() {
    if (!selectedConversation) {
      return;
    }

    setTakingOver(true);
    setTakeoverMessage(null);
    setError(null);

    try {
      const updatedConversation = await takeoverInboxConversation(
        selectedConversation.id,
      );
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === updatedConversation.id
            ? {
                ...conversation,
                ...updatedConversation,
                contact: updatedConversation.contact ?? conversation.contact,
                channelConnection:
                  updatedConversation.channelConnection ??
                  conversation.channelConnection,
              }
            : conversation,
        ),
      );
      setTakeoverMessage('Đã tạm dừng bot cho cuộc hội thoại này.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tiếp quản hội thoại.'));
    } finally {
      setTakingOver(false);
    }
  }

  return (
    <main>
      <header>
        <h1 style={{ margin: 0, fontSize: 32 }}>Hộp thư</h1>
        <p style={{ color: '#475569', fontSize: 18, maxWidth: 760 }}>
          Theo dõi hội thoại Facebook/Instagram theo tổ chức đang chọn. Trang tự
          tải lại mỗi 4 giây khi đang mở.
        </p>
        {lastUpdatedAt ? (
          <p style={{ color: '#64748b', fontSize: 14 }}>
            Đồng bộ lần cuối: {formatDateTime(lastUpdatedAt.toISOString())}
          </p>
        ) : null}
      </header>

      {error ? (
        <p role="alert" style={alertStyle}>
          {error}
        </p>
      ) : null}
      {takeoverMessage ? (
        <p role="status" style={successStyle}>
          {takeoverMessage}
        </p>
      ) : null}

      <div style={layoutStyle}>
        <section style={panelStyle}>
          <div style={panelHeaderStyle}>
            <h2 style={{ fontSize: 22, margin: 0 }}>Cuộc hội thoại</h2>
            <button
              type="button"
              onClick={() => void loadConversations()}
              disabled={conversationsLoading}
              style={secondaryButtonStyle}
            >
              {conversationsLoading ? 'Đang tải...' : 'Tải lại'}
            </button>
          </div>

          {conversationsLoading ? (
            <p style={mutedTextStyle}>Đang tải hội thoại...</p>
          ) : conversations.length === 0 ? (
            <p style={emptyStateStyle}>Chưa có hội thoại nào.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {conversations.map((conversation) => {
                const active = conversation.id === selectedConversationId;

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setSelectedConversationId(conversation.id)}
                    style={{
                      ...conversationButtonStyle,
                      borderColor: active ? '#2563eb' : '#e2e8f0',
                      background: active ? '#eff6ff' : '#ffffff',
                    }}
                  >
                    <span style={conversationTitleStyle}>
                      {getConversationName(conversation)}
                    </span>
                    <span style={conversationMetaStyle}>
                      {formatChannel(conversation.channel)} ·{' '}
                      {conversation.botPaused ? 'Bot tạm dừng' : 'Bot đang chạy'}
                    </span>
                    <span style={conversationMetaStyle}>
                      {conversation.lastMessageAt
                        ? formatDateTime(conversation.lastMessageAt)
                        : 'Chưa có tin nhắn'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section style={{ ...panelStyle, minHeight: 520 }}>
          {selectedConversation ? (
            <>
              <div style={threadHeaderStyle}>
                <div>
                  <h2 style={{ fontSize: 22, margin: 0 }}>
                    {getConversationName(selectedConversation)}
                  </h2>
                  <p style={{ color: '#64748b', margin: '6px 0 0' }}>
                    {formatChannel(selectedConversation.channel)} · Trạng thái:{' '}
                    {selectedConversation.status} ·{' '}
                    {getContactHandle(selectedConversation)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleTakeover()}
                  disabled={takingOver || selectedConversation.botPaused}
                  style={{
                    ...primaryButtonStyle,
                    cursor:
                      takingOver || selectedConversation.botPaused
                        ? 'not-allowed'
                        : 'pointer',
                    opacity:
                      takingOver || selectedConversation.botPaused ? 0.7 : 1,
                  }}
                >
                  {takingOver
                    ? 'Đang tiếp quản...'
                    : selectedConversation.botPaused
                      ? 'Đã tiếp quản'
                      : 'Tiếp quản'}
                </button>
              </div>

              {messagesLoading ? (
                <p style={mutedTextStyle}>Đang tải tin nhắn...</p>
              ) : messages.length === 0 ? (
                <p style={emptyStateStyle}>Chưa có tin nhắn trong hội thoại.</p>
              ) : (
                <div style={messagesStyle}>
                  {messages.map((message) => {
                    const outbound = message.direction === 'outbound';

                    return (
                      <div
                        key={message.id}
                        style={{
                          display: 'flex',
                          justifyContent: outbound ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <article
                          style={{
                            ...messageBubbleStyle,
                            background: outbound ? '#dbeafe' : '#f8fafc',
                            borderColor: outbound ? '#bfdbfe' : '#e2e8f0',
                          }}
                        >
                          <p style={messageMetaStyle}>
                            {formatSender(message)} ·{' '}
                            {formatDateTime(message.createdAt)}
                          </p>
                          <p style={{ margin: '6px 0 0', whiteSpace: 'pre-wrap' }}>
                            {formatMessageBody(message)}
                          </p>
                        </article>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <p style={emptyStateStyle}>
              Chọn một hội thoại bên trái để xem tin nhắn.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

function getApiErrorMessage(err: unknown, fallback: string) {
  return err instanceof ApiClientError ? err.message : fallback;
}

function getConversationName(conversation: InboxConversation) {
  return (
    conversation.contact?.displayName ??
    conversation.contact?.pageScopedId ??
    conversation.contact?.igScopedId ??
    `Hội thoại ${conversation.id.slice(0, 8)}`
  );
}

function getContactHandle(conversation: InboxConversation) {
  return (
    conversation.contact?.pageScopedId ??
    conversation.contact?.igScopedId ??
    conversation.channelConnection?.externalPageId ??
    'Không rõ khách'
  );
}

function formatChannel(channel: string) {
  if (channel === 'messenger') {
    return 'Messenger';
  }
  if (channel === 'instagram') {
    return 'Instagram';
  }
  if (channel === 'zalo') {
    return 'Zalo';
  }

  return channel;
}

function formatSender(message: InboxMessage) {
  const senderLabels: Record<string, string> = {
    ai: 'AI',
    customer: 'Khách',
    staff: 'Nhân viên',
    system: 'Hệ thống',
  };

  return senderLabels[message.senderType] ?? message.senderType;
}

function formatMessageBody(message: InboxMessage) {
  const text = message.bodyText?.trim();
  return text ? text : `[${message.rawType}]`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

const layoutStyle: CSSProperties = {
  alignItems: 'start',
  display: 'grid',
  gap: 24,
  gridTemplateColumns: 'minmax(280px, 360px) minmax(0, 1fr)',
  marginTop: 28,
};

const panelStyle: CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 20,
};

const panelHeaderStyle: CSSProperties = {
  alignItems: 'center',
  display: 'flex',
  gap: 12,
  justifyContent: 'space-between',
  marginBottom: 16,
};

const threadHeaderStyle: CSSProperties = {
  alignItems: 'flex-start',
  borderBottom: '1px solid #e2e8f0',
  display: 'flex',
  gap: 16,
  justifyContent: 'space-between',
  margin: '-4px -4px 18px',
  padding: '4px 4px 16px',
};

const conversationButtonStyle: CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  color: '#0f172a',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: 14,
  textAlign: 'left',
};

const conversationTitleStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 800,
};

const conversationMetaStyle: CSSProperties = {
  color: '#64748b',
  fontSize: 13,
};

const messagesStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const messageBubbleStyle: CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  color: '#0f172a',
  maxWidth: 'min(680px, 82%)',
  padding: '10px 12px',
};

const messageMetaStyle: CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 700,
  margin: 0,
};

const primaryButtonStyle: CSSProperties = {
  background: '#2563eb',
  border: 'none',
  borderRadius: 10,
  color: '#ffffff',
  fontSize: 15,
  fontWeight: 800,
  padding: '11px 16px',
};

const secondaryButtonStyle: CSSProperties = {
  background: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  color: '#0f172a',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 700,
  padding: '9px 12px',
};

const mutedTextStyle: CSSProperties = {
  color: '#64748b',
  fontSize: 15,
};

const emptyStateStyle: CSSProperties = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  color: '#64748b',
  fontSize: 15,
  padding: 16,
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

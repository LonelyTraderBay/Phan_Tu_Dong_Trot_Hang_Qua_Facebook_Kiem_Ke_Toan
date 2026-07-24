import type { ReactNode } from 'react';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh' }}>
      <header
        style={{
          borderBottom: '1px solid #e2e8f0',
          background: '#ffffff',
          padding: '20px 32px',
        }}
      >
        <strong>Omni Commerce</strong>
      </header>
      <div style={{ padding: '32px' }}>{children}</div>
    </div>
  );
}

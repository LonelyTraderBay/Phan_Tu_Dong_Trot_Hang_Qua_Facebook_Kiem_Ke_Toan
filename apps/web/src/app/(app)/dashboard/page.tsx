import Link from 'next/link';

export default function DashboardPage() {
  return (
    <main>
      <h1 style={{ margin: 0, fontSize: 32 }}>
        Bảng điều khiển (đang dựng nền tảng)
      </h1>
      <p style={{ color: '#475569', fontSize: 18 }}>
        Khu vực ứng dụng sẽ hiển thị dữ liệu theo tổ chức sau khi API nền tảng
        sẵn sàng.
      </p>
      <p style={{ marginTop: 24 }}>
        <Link
          href="/settings/channels"
          style={{
            color: '#2563eb',
            fontSize: 16,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Kết nối kênh →
        </Link>
      </p>
    </main>
  );
}

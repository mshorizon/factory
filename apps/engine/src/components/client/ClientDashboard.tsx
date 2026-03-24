import { useState, useEffect } from "react";

interface ClientDashboardProps {
  businessId: string;
}

interface DashboardStats {
  blogCount: number;
  publishedCount: number;
  pendingComments: number;
  recentBlogs: Array<{
    id: number;
    title: string;
    status: string;
    publishedAt: string | null;
    createdAt: string;
  }>;
}

export default function ClientDashboard({ businessId }: ClientDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [blogsRes, commentsRes] = await Promise.all([
          fetch(`/api/admin/blogs/list?business=${businessId}`),
          fetch(`/api/admin/comments/list?business=${businessId}&status=pending`),
        ]);

        const blogsData = blogsRes.ok ? await blogsRes.json() : { blogs: [] };
        const commentsData = commentsRes.ok ? await commentsRes.json() : { comments: [] };

        const blogs = blogsData.blogs ?? [];
        setStats({
          blogCount: blogs.length,
          publishedCount: blogs.filter((b: any) => b.status === "published").length,
          pendingComments: commentsData.comments?.length ?? 0,
          recentBlogs: blogs.slice(0, 5),
        });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [businessId]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem", color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
        Ładowanie...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      {/* Stats cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
        <StatCard
          label="Wszystkie wpisy"
          value={stats?.blogCount ?? 0}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
              <path d="M18 14h-8" />
              <path d="M15 18h-5" />
              <path d="M10 6h8v4h-8V6Z" />
            </svg>
          }
        />
        <StatCard
          label="Opublikowane"
          value={stats?.publishedCount ?? 0}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />
        <StatCard
          label="Oczekujące komentarze"
          value={stats?.pendingComments ?? 0}
          highlight={(stats?.pendingComments ?? 0) > 0}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          }
        />
      </div>

      {/* Quick actions */}
      <div>
        <h2 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--foreground)", marginBottom: "0.75rem", marginTop: 0 }}>
          Szybkie akcje
        </h2>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <ActionButton href="/client/blog" label="Nowy wpis na blogu" primary />
          {(stats?.pendingComments ?? 0) > 0 && (
            <ActionButton href="/client/comments" label={`Moderuj komentarze (${stats?.pendingComments})`} />
          )}
          <ActionButton href="/" label="Otwórz stronę" external />
        </div>
      </div>

      {/* Recent blog posts */}
      {(stats?.recentBlogs?.length ?? 0) > 0 && (
        <div>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--foreground)", marginBottom: "0.75rem", marginTop: 0 }}>
            Ostatnie wpisy
          </h2>
          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              overflow: "hidden",
            }}
          >
            {stats!.recentBlogs.map((blog, i) => (
              <div
                key={blog.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.875rem 1rem",
                  borderBottom: i < stats!.recentBlogs.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: "var(--foreground)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {blog.title}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: "0.125rem" }}>
                    {blog.publishedAt
                      ? new Date(blog.publishedAt).toLocaleDateString("pl-PL")
                      : new Date(blog.createdAt).toLocaleDateString("pl-PL")}
                  </div>
                </div>
                <StatusBadge status={blog.status} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: "0.625rem" }}>
            <a
              href="/client/blog"
              style={{
                fontSize: "0.8125rem",
                color: "var(--muted-foreground)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              Zarządzaj wszystkimi wpisami →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: `1px solid ${highlight ? "color-mix(in oklch, var(--destructive) 30%, transparent)" : "var(--border)"}`,
        borderRadius: "var(--radius)",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      <div
        style={{
          width: "2rem",
          height: "2rem",
          borderRadius: "0.375rem",
          background: highlight
            ? "color-mix(in oklch, var(--destructive) 10%, transparent)"
            : "var(--muted)",
          color: highlight ? "var(--destructive)" : "var(--muted-foreground)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: highlight ? "var(--destructive)" : "var(--foreground)",
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        <div style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", marginTop: "0.25rem" }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  href,
  label,
  primary = false,
  external = false,
}: {
  href: string;
  label: string;
  primary?: boolean;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.375rem",
        padding: "0.5rem 1rem",
        fontSize: "0.875rem",
        fontWeight: 500,
        textDecoration: "none",
        borderRadius: "calc(var(--radius) - 2px)",
        background: primary ? "var(--primary)" : "var(--background)",
        color: primary ? "var(--primary-foreground)" : "var(--foreground)",
        border: primary ? "none" : "1px solid var(--border)",
        transition: "opacity 0.15s",
        cursor: "pointer",
      }}
    >
      {label}
      {external && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" x2="21" y1="14" y2="3" />
        </svg>
      )}
    </a>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isPublished = status === "published";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "0.2rem 0.5rem",
        borderRadius: "9999px",
        fontSize: "0.6875rem",
        fontWeight: 500,
        background: isPublished
          ? "color-mix(in oklch, oklch(0.6 0.15 145) 15%, transparent)"
          : "var(--muted)",
        color: isPublished ? "oklch(0.45 0.15 145)" : "var(--muted-foreground)",
        flexShrink: 0,
      }}
    >
      {isPublished ? "Opublikowany" : "Szkic"}
    </span>
  );
}

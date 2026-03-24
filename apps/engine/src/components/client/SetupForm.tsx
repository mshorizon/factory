import { useState } from "react";

interface SetupFormProps {
  businessName: string;
}

export default function SetupForm({ businessName }: SetupFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Hasła nie są identyczne");
      return;
    }

    if (password.length < 8) {
      setError("Hasło musi mieć co najmniej 8 znaków");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/client/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        window.location.href = "/client";
      } else {
        setError(data.message || "Błąd konfiguracji");
      }
    } catch {
      setError("Błąd połączenia z serwerem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: "420px", padding: "0 1rem" }}>
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "2rem",
          boxShadow:
            "0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        }}
      >
        <div style={{ marginBottom: "1.75rem" }}>
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--muted-foreground)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "0.25rem",
            }}
          >
            Pierwsze uruchomienie
          </p>
          <h1
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "var(--foreground)",
              margin: 0,
            }}
          >
            Utwórz konto właściciela
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--muted-foreground)",
              marginTop: "0.5rem",
            }}
          >
            Skonfiguruj dostęp do panelu dla <strong>{businessName}</strong>
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            <label
              htmlFor="name"
              style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--foreground)" }}
            >
              Imię i nazwisko
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              placeholder="Jan Kowalski"
              style={inputStyle}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            <label
              htmlFor="email"
              style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--foreground)" }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="twoj@email.pl"
              style={inputStyle}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            <label
              htmlFor="password"
              style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--foreground)" }}
            >
              Hasło
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Minimum 8 znaków"
              style={inputStyle}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            <label
              htmlFor="confirm"
              style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--foreground)" }}
            >
              Potwierdź hasło
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="••••••••"
              style={inputStyle}
            />
          </div>

          {error && (
            <div
              style={{
                padding: "0.625rem 0.875rem",
                background:
                  "color-mix(in oklch, var(--destructive) 10%, transparent)",
                border:
                  "1px solid color-mix(in oklch, var(--destructive) 30%, transparent)",
                borderRadius: "calc(var(--radius) - 2px)",
                fontSize: "0.8125rem",
                color: "var(--destructive)",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.625rem 1rem",
              background: "var(--primary)",
              color: "var(--primary-foreground)",
              border: "none",
              borderRadius: "calc(var(--radius) - 2px)",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              transition: "opacity 0.15s",
              marginTop: "0.25rem",
            }}
          >
            {loading ? "Tworzenie konta..." : "Utwórz konto i zaloguj się"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "0.5rem 0.75rem",
  border: "1px solid var(--border)",
  borderRadius: "calc(var(--radius) - 2px)",
  background: "var(--background)",
  color: "var(--foreground)",
  fontSize: "0.875rem",
  outline: "none",
  width: "100%",
};

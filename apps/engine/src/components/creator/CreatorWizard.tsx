import { useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";

const STYLE_PRESETS = [
  { value: "modern", label: "Nowoczesny", desc: "Czysty, minimalistyczny design" },
  { value: "bold", label: "Wyrazisty", desc: "Mocne kolory, duże nagłówki" },
  { value: "elegant", label: "Elegancki", desc: "Subtelny, profesjonalny wygląd" },
  { value: "industrial", label: "Industrialny", desc: "Surowy, miejski klimat" },
  { value: "wellness", label: "Wellness", desc: "Spokojny, naturalny nastrój" },
  { value: "classic", label: "Klasyczny", desc: "Tradycyjny, sprawdzony styl" },
];

interface Props {
  turnstileSiteKey: string;
}

type WizardState = "form" | "generating" | "success" | "error";

export default function CreatorWizard({ turnstileSiteKey }: Props) {
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stylePreference, setStylePreference] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [state, setState] = useState<WizardState>("form");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<{ subdomain: string; redirectUrl: string } | null>(null);

  const canSubmit =
    description.trim().length >= 20 &&
    email.trim() &&
    password.length >= 8;

  const handleSubmit = async () => {
    setState("generating");
    setErrorMsg("");

    try {
      const res = await fetch("/api/creator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          email,
          password,
          stylePreference: stylePreference || undefined,
          turnstileToken: turnstileToken || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setState("error");
        setErrorMsg(json.error || "Wystąpił błąd");
        return;
      }

      setState("success");
      setResult({ subdomain: json.subdomain, redirectUrl: json.redirectUrl });
    } catch {
      setState("error");
      setErrorMsg("Błąd połączenia z serwerem. Spróbuj ponownie.");
    }
  };

  if (state === "generating") {
    return <GeneratingScreen />;
  }

  if (state === "success" && result) {
    return <SuccessScreen subdomain={result.subdomain} redirectUrl={result.redirectUrl} />;
  }

  return (
    <div className="space-y-6">
      {state === "error" && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
          {errorMsg}
        </div>
      )}

      {/* Business description — the main field */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1.5">
          Opisz swój biznes <span className="text-red-500">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Napisz kilka zdan o swojej firmie - jak sie nazywa, czym sie zajmujesz, gdzie jestes, jakie uslugi oferujesz, numer telefonu, godziny otwarcia..."
          rows={8}
          className="w-full px-4 py-3 rounded-lg border border-[var(--color-surface-alt)] bg-[var(--color-surface-card)] text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition resize-y"
        />
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          Brakujące dane (telefon, adres itp.) zostaną uzupełnione przykładowymi — zmienisz je później w panelu admina.
        </p>
      </div>

      {/* Account credentials */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1.5">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jan@example.com"
            className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-surface-alt)] bg-[var(--color-surface-card)] text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition"
          />
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Do logowania w panelu admina</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1.5">
            Hasło <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 znaków"
            className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-surface-alt)] bg-[var(--color-surface-card)] text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition"
          />
        </div>
      </div>

      {/* Style preference */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-text-main)] mb-2">
          Styl strony{" "}
          <span className="text-[var(--color-text-muted)] font-normal">(opcjonalne)</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {STYLE_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() =>
                setStylePreference(stylePreference === preset.value ? "" : preset.value)
              }
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                stylePreference === preset.value
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-sm"
                  : "border-[var(--color-surface-alt)] hover:border-[var(--color-text-muted)]"
              }`}
            >
              <div className="font-semibold text-[var(--color-text-main)] text-sm">
                {preset.label}
              </div>
              <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{preset.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {turnstileSiteKey && (
        <Turnstile
          siteKey={turnstileSiteKey}
          onSuccess={setTurnstileToken}
          options={{ size: "flexible" }}
        />
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full py-4 rounded-xl font-semibold text-lg bg-[var(--color-primary)] text-[var(--color-text-on-primary)] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Stwórz moją stronę
      </button>
    </div>
  );
}

/* ========== State Screens ========== */

function GeneratingScreen() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mb-8" />
      <h2 className="text-2xl font-bold text-[var(--color-text-main)] mb-3">
        Tworzymy Twoją stronę...
      </h2>
      <p className="text-[var(--color-text-muted)] max-w-md">
        Sztuczna inteligencja generuje profesjonalną stronę dopasowaną do Twojego biznesu.
        To może potrwać do minuty.
      </p>
      <div className="mt-8 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full bg-[var(--color-primary)] animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

function SuccessScreen({
  subdomain,
  redirectUrl,
}: {
  subdomain: string;
  redirectUrl: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-8">
        <svg
          className="w-8 h-8 text-green-600 dark:text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-[var(--color-text-main)] mb-3">Strona gotowa!</h2>
      <p className="text-[var(--color-text-muted)] max-w-md mb-8">
        Twoja strona <strong>{subdomain}</strong> została utworzona. Przejdź do panelu
        administracyjnego, aby ją dostosować.
      </p>
      <a
        href={redirectUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-8 py-3 rounded-lg font-semibold bg-[var(--color-primary)] text-[var(--color-text-on-primary)] hover:opacity-90 transition-opacity"
      >
        Przejdź do panelu admina
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </a>
    </div>
  );
}

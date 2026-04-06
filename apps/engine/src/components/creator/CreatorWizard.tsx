import { useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";

interface FormData {
  businessName: string;
  industry: string;
  email: string;
  password: string;
  phone: string;
  description: string;
  services: string;
  hours: string;
  address: string;
  websiteUrl: string;
  googleMapsUrl: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  tiktok: string;
  stylePreference: string;
}

const INITIAL_DATA: FormData = {
  businessName: "",
  industry: "",
  email: "",
  password: "",
  phone: "",
  description: "",
  services: "",
  hours: "",
  address: "",
  websiteUrl: "",
  googleMapsUrl: "",
  facebook: "",
  instagram: "",
  linkedin: "",
  tiktok: "",
  stylePreference: "",
};

const INDUSTRIES = [
  { value: "barber", label: "Fryzjer / Barber" },
  { value: "beauty", label: "Salon kosmetyczny" },
  { value: "restaurant", label: "Restauracja / Gastronomia" },
  { value: "fitness", label: "Fitness / Siłownia" },
  { value: "electrician", label: "Elektryk" },
  { value: "plumber", label: "Hydraulik" },
  { value: "mechanic", label: "Mechanik samochodowy" },
  { value: "construction", label: "Budownictwo / Remonty" },
  { value: "medical", label: "Gabinet lekarski" },
  { value: "dental", label: "Stomatolog" },
  { value: "legal", label: "Kancelaria prawna" },
  { value: "accounting", label: "Biuro rachunkowe" },
  { value: "photography", label: "Fotografia" },
  { value: "cleaning", label: "Firma sprzątająca" },
  { value: "veterinary", label: "Weterynarz" },
  { value: "real-estate", label: "Nieruchomości" },
  { value: "education", label: "Edukacja / Korepetycje" },
  { value: "other", label: "Inna branża" },
];

const STYLE_PRESETS = [
  { value: "modern", label: "Nowoczesny", desc: "Czysty, minimalistyczny design" },
  { value: "bold", label: "Wyrazisty", desc: "Mocne kolory, duże nagłówki" },
  { value: "elegant", label: "Elegancki", desc: "Subtelny, profesjonalny wygląd" },
  { value: "industrial", label: "Industrialny", desc: "Surowy, miejski klimat" },
  { value: "wellness", label: "Wellness", desc: "Spokojny, naturalny nastrój" },
  { value: "classic", label: "Klasyczny", desc: "Tradycyjny, sprawdzony styl" },
];

const STEPS = [
  "Podstawy",
  "Szczegóły",
  "Online",
  "Styl",
  "Podsumowanie",
];

interface Props {
  turnstileSiteKey: string;
}

type WizardState = "form" | "generating" | "success" | "error";

export default function CreatorWizard({ turnstileSiteKey }: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(INITIAL_DATA);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [state, setState] = useState<WizardState>("form");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<{ subdomain: string; redirectUrl: string } | null>(null);

  const update = (field: keyof FormData, value: string) =>
    setData((prev) => ({ ...prev, [field]: value }));

  const canNext = (): boolean => {
    if (step === 0) {
      return !!(data.businessName && data.industry && data.email && data.password && data.password.length >= 8);
    }
    return true;
  };

  const handleSubmit = async () => {
    setState("generating");
    setErrorMsg("");

    const socialLinks: Record<string, string> = {};
    if (data.facebook) socialLinks.facebook = data.facebook;
    if (data.instagram) socialLinks.instagram = data.instagram;
    if (data.linkedin) socialLinks.linkedin = data.linkedin;
    if (data.tiktok) socialLinks.tiktok = data.tiktok;

    try {
      const res = await fetch("/api/creator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: data.businessName,
          industry: data.industry,
          email: data.email,
          password: data.password,
          phone: data.phone || undefined,
          description: data.description || undefined,
          services: data.services || undefined,
          hours: data.hours || undefined,
          address: data.address || undefined,
          websiteUrl: data.websiteUrl || undefined,
          googleMapsUrl: data.googleMapsUrl || undefined,
          socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
          stylePreference: data.stylePreference || undefined,
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
    <div>
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-10">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  i <= step
                    ? "bg-[var(--color-primary)] text-[var(--color-text-on-primary)]"
                    : "bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]"
                }`}
              >
                {i + 1}
              </div>
              <span className="text-xs mt-1 text-[var(--color-text-muted)] hidden sm:block">{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-8 sm:w-16 h-0.5 mx-1 sm:mx-2 ${i < step ? "bg-[var(--color-primary)]" : "bg-[var(--color-surface-alt)]"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Error banner */}
      {state === "error" && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
          {errorMsg}
        </div>
      )}

      {/* Step content */}
      <div className="min-h-[360px]">
        {step === 0 && <StepBasics data={data} update={update} />}
        {step === 1 && <StepDetails data={data} update={update} />}
        {step === 2 && <StepOnline data={data} update={update} />}
        {step === 3 && <StepStyle data={data} update={update} />}
        {step === 4 && (
          <StepReview
            data={data}
            turnstileSiteKey={turnstileSiteKey}
            onTurnstileSuccess={setTurnstileToken}
          />
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={() => { setStep((s) => s - 1); setState("form"); }}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            step === 0
              ? "invisible"
              : "bg-[var(--color-surface-alt)] text-[var(--color-text-main)] hover:opacity-80"
          }`}
        >
          Wstecz
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canNext()}
            className="px-6 py-3 rounded-lg font-semibold bg-[var(--color-primary)] text-[var(--color-text-on-primary)] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Dalej
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canNext()}
            className="px-8 py-3 rounded-lg font-semibold bg-[var(--color-primary)] text-[var(--color-text-on-primary)] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Stwórz stronę
          </button>
        )}
      </div>
    </div>
  );
}

/* ========== Step Components ========== */

function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-surface-alt)] bg-[var(--color-surface-card)] text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition"
      />
      {hint && <p className="text-xs text-[var(--color-text-muted)] mt-1">{hint}</p>}
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-surface-alt)] bg-[var(--color-surface-card)] text-[var(--color-text-main)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition resize-y"
      />
      {hint && <p className="text-xs text-[var(--color-text-muted)] mt-1">{hint}</p>}
    </div>
  );
}

function StepBasics({ data, update }: { data: FormData; update: (f: keyof FormData, v: string) => void }) {
  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-[var(--color-text-main)] mb-2">Informacje podstawowe</h2>
      <p className="text-[var(--color-text-muted)] mb-6">Podaj podstawowe informacje o swoim biznesie i utwórz konto.</p>

      <InputField
        label="Nazwa firmy"
        value={data.businessName}
        onChange={(v) => update("businessName", v)}
        placeholder="np. Salon Fryzjerski Anna"
        required
      />

      <div>
        <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1.5">
          Branża <span className="text-red-500">*</span>
        </label>
        <select
          value={data.industry}
          onChange={(e) => update("industry", e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-surface-alt)] bg-[var(--color-surface-card)] text-[var(--color-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition"
        >
          <option value="">Wybierz branżę...</option>
          {INDUSTRIES.map((ind) => (
            <option key={ind.value} value={ind.value}>{ind.label}</option>
          ))}
        </select>
      </div>

      <InputField
        label="Adres email"
        value={data.email}
        onChange={(v) => update("email", v)}
        type="email"
        placeholder="jan@example.com"
        required
        hint="Użyjesz tego emaila do logowania w panelu admina"
      />

      <InputField
        label="Hasło"
        value={data.password}
        onChange={(v) => update("password", v)}
        type="password"
        placeholder="Minimum 8 znaków"
        required
        hint="Minimum 8 znaków"
      />

      <InputField
        label="Numer telefonu"
        value={data.phone}
        onChange={(v) => update("phone", v)}
        type="tel"
        placeholder="+48 500 600 700"
      />
    </div>
  );
}

function StepDetails({ data, update }: { data: FormData; update: (f: keyof FormData, v: string) => void }) {
  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-[var(--color-text-main)] mb-2">Szczegóły biznesu</h2>
      <p className="text-[var(--color-text-muted)] mb-6">Im więcej informacji podasz, tym lepsza będzie wygenerowana strona.</p>

      <TextAreaField
        label="Opis biznesu"
        value={data.description}
        onChange={(v) => update("description", v)}
        placeholder="Opisz swój biznes — czym się zajmujesz, co Cię wyróżnia, jaka jest Twoja historia..."
        rows={5}
        hint="Im dokładniejszy opis, tym lepiej dopasowana strona"
      />

      <TextAreaField
        label="Usługi / Produkty"
        value={data.services}
        onChange={(v) => update("services", v)}
        placeholder="Wymień swoje usługi lub produkty z cenami, np.:&#10;- Strzyżenie męskie: 50 zł&#10;- Strzyżenie + broda: 80 zł&#10;- Koloryzacja: od 150 zł"
        rows={5}
      />

      <InputField
        label="Godziny otwarcia"
        value={data.hours}
        onChange={(v) => update("hours", v)}
        placeholder="np. Pon-Pt: 9:00-18:00, Sob: 10:00-15:00"
      />

      <InputField
        label="Adres"
        value={data.address}
        onChange={(v) => update("address", v)}
        placeholder="np. ul. Marszałkowska 10, 00-001 Warszawa"
      />
    </div>
  );
}

function StepOnline({ data, update }: { data: FormData; update: (f: keyof FormData, v: string) => void }) {
  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-[var(--color-text-main)] mb-2">Obecność online</h2>
      <p className="text-[var(--color-text-muted)] mb-6">Podaj linki do swoich profili i obecnej strony (opcjonalne).</p>

      <InputField
        label="Aktualna strona internetowa"
        value={data.websiteUrl}
        onChange={(v) => update("websiteUrl", v)}
        type="url"
        placeholder="https://mojastrona.pl"
      />

      <InputField
        label="Link do Google Maps"
        value={data.googleMapsUrl}
        onChange={(v) => update("googleMapsUrl", v)}
        type="url"
        placeholder="https://maps.google.com/..."
      />

      <InputField
        label="Facebook"
        value={data.facebook}
        onChange={(v) => update("facebook", v)}
        type="url"
        placeholder="https://facebook.com/mojastrona"
      />

      <InputField
        label="Instagram"
        value={data.instagram}
        onChange={(v) => update("instagram", v)}
        type="url"
        placeholder="https://instagram.com/mojastrona"
      />

      <InputField
        label="LinkedIn"
        value={data.linkedin}
        onChange={(v) => update("linkedin", v)}
        type="url"
        placeholder="https://linkedin.com/company/mojastrona"
      />

      <InputField
        label="TikTok"
        value={data.tiktok}
        onChange={(v) => update("tiktok", v)}
        type="url"
        placeholder="https://tiktok.com/@mojastrona"
      />
    </div>
  );
}

function StepStyle({ data, update }: { data: FormData; update: (f: keyof FormData, v: string) => void }) {
  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-[var(--color-text-main)] mb-2">Styl strony</h2>
      <p className="text-[var(--color-text-muted)] mb-6">Wybierz styl wizualny, który najlepiej pasuje do Twojego biznesu.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {STYLE_PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => update("stylePreference", preset.value)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              data.stylePreference === preset.value
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-sm"
                : "border-[var(--color-surface-alt)] hover:border-[var(--color-text-muted)]"
            }`}
          >
            <div className="font-semibold text-[var(--color-text-main)] text-sm">{preset.label}</div>
            <div className="text-xs text-[var(--color-text-muted)] mt-1">{preset.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepReview({
  data,
  turnstileSiteKey,
  onTurnstileSuccess,
}: {
  data: FormData;
  turnstileSiteKey: string;
  onTurnstileSuccess: (token: string) => void;
}) {
  const filledSocials = [
    data.facebook && "Facebook",
    data.instagram && "Instagram",
    data.linkedin && "LinkedIn",
    data.tiktok && "TikTok",
  ].filter(Boolean);

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-[var(--color-text-main)] mb-2">Podsumowanie</h2>
      <p className="text-[var(--color-text-muted)] mb-6">Sprawdź dane i kliknij "Stwórz stronę".</p>

      <div className="space-y-3 bg-[var(--color-surface-card)] rounded-xl p-5 border border-[var(--color-surface-alt)]">
        <ReviewRow label="Nazwa firmy" value={data.businessName} />
        <ReviewRow label="Branża" value={INDUSTRIES.find((i) => i.value === data.industry)?.label || data.industry} />
        <ReviewRow label="Email" value={data.email} />
        <ReviewRow label="Telefon" value={data.phone} />
        <ReviewRow label="Adres" value={data.address} />
        <ReviewRow label="Godziny" value={data.hours} />
        {data.description && <ReviewRow label="Opis" value={data.description.slice(0, 100) + (data.description.length > 100 ? "..." : "")} />}
        {data.services && <ReviewRow label="Usługi" value="Podane" />}
        {data.websiteUrl && <ReviewRow label="Strona" value={data.websiteUrl} />}
        {filledSocials.length > 0 && <ReviewRow label="Social media" value={filledSocials.join(", ")} />}
        {data.stylePreference && (
          <ReviewRow label="Styl" value={STYLE_PRESETS.find((p) => p.value === data.stylePreference)?.label || data.stylePreference} />
        )}
      </div>

      {turnstileSiteKey && (
        <div className="mt-4">
          <Turnstile siteKey={turnstileSiteKey} onSuccess={onTurnstileSuccess} options={{ size: "flexible" }} />
        </div>
      )}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-sm text-[var(--color-text-muted)] shrink-0">{label}</span>
      <span className="text-sm text-[var(--color-text-main)] text-right">{value}</span>
    </div>
  );
}

/* ========== State Screens ========== */

function GeneratingScreen() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mb-8" />
      <h2 className="text-2xl font-bold text-[var(--color-text-main)] mb-3">Tworzymy Twoją stronę...</h2>
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

function SuccessScreen({ subdomain, redirectUrl }: { subdomain: string; redirectUrl: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-8">
        <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-[var(--color-text-main)] mb-3">Strona gotowa!</h2>
      <p className="text-[var(--color-text-muted)] max-w-md mb-8">
        Twoja strona <strong>{subdomain}</strong> została utworzona. Przejdź do panelu administracyjnego, aby ją dostosować.
      </p>
      <a
        href={redirectUrl}
        className="inline-flex items-center gap-2 px-8 py-3 rounded-lg font-semibold bg-[var(--color-primary)] text-[var(--color-text-on-primary)] hover:opacity-90 transition-opacity"
      >
        Przejdź do panelu admina
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </a>
    </div>
  );
}

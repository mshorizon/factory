import { useState } from "react";

interface CommentFormProps {
  blogId: number;
}

export function CommentForm({ blogId }: CommentFormProps) {
  const [formData, setFormData] = useState({
    authorName: "",
    authorEmail: "",
    content: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/comments/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          blogId,
          ...formData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit comment");
      }

      setStatus("success");
      setFormData({ authorName: "", authorEmail: "", content: "" });

      // Reset to idle after 5 seconds
      setTimeout(() => setStatus("idle"), 5000);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "An error occurred");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-spacing-lg">
      <div>
        <label htmlFor="authorName" className="block text-sm font-medium text-foreground mb-spacing-xs">
          Imię i nazwisko *
        </label>
        <input
          type="text"
          id="authorName"
          required
          value={formData.authorName}
          onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
          className="w-full px-spacing-md py-spacing-sm border border-border rounded-radius bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={status === "submitting"}
        />
      </div>

      <div>
        <label htmlFor="authorEmail" className="block text-sm font-medium text-foreground mb-spacing-xs">
          Email *
        </label>
        <input
          type="email"
          id="authorEmail"
          required
          value={formData.authorEmail}
          onChange={(e) => setFormData({ ...formData, authorEmail: e.target.value })}
          className="w-full px-spacing-md py-spacing-sm border border-border rounded-radius bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={status === "submitting"}
        />
        <p className="text-xs text-muted mt-spacing-xs">
          Twój email nie zostanie opublikowany
        </p>
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-foreground mb-spacing-xs">
          Komentarz *
        </label>
        <textarea
          id="content"
          required
          rows={5}
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          className="w-full px-spacing-md py-spacing-sm border border-border rounded-radius bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          disabled={status === "submitting"}
        />
      </div>

      {status === "success" && (
        <div className="p-spacing-md bg-green-50 border border-green-200 rounded-radius text-green-800">
          ✓ Komentarz został wysłany i oczekuje na moderację
        </div>
      )}

      {status === "error" && (
        <div className="p-spacing-md bg-red-50 border border-red-200 rounded-radius text-red-800">
          ✗ {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="px-spacing-xl py-spacing-md bg-primary text-textOnPrimary font-semibold rounded-radius hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        {status === "submitting" ? "Wysyłanie..." : "Dodaj komentarz"}
      </button>
    </form>
  );
}

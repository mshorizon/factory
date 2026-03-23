"use client";

import { Turnstile as ReactTurnstile } from "@marsidev/react-turnstile";

interface TurnstileProps {
  siteKey: string;
  onSuccess: (token: string) => void;
  onExpire?: () => void;
}

export function Turnstile({ siteKey, onSuccess, onExpire }: TurnstileProps) {
  return (
    <div className="w-full">
      <ReactTurnstile
        siteKey={siteKey}
        onSuccess={onSuccess}
        onExpire={onExpire}
        options={{ size: "flexible" }}
      />
    </div>
  );
}

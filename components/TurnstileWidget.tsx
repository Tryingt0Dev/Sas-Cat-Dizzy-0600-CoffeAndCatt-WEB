"use client";

import { useEffect, useId, useRef } from "react";

declare global {
  interface Window {
    turnstile: {
      render: (selector: string, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string | undefined;
    };
  }
}

interface TurnstileWidgetProps {
  siteKey: string;
  theme?: "light" | "dark";
  inputId?: string;
  onSuccess?: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

export function TurnstileWidget({ siteKey, theme = "light", inputId, onSuccess, onError, onExpire }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const containerId = useId().replace(/:/g, "-");

  useEffect(() => {
    if (!containerRef.current) return;

    function handleSuccess(token: string) {
      if (inputId) {
        const input = document.getElementById(inputId) as HTMLInputElement | null;
        if (input) input.value = token;
      }
      onSuccess?.(token);
    }

    function renderTurnstile() {
      if (containerRef.current && !widgetIdRef.current) {
        widgetIdRef.current = window.turnstile.render(`#${containerId}`, {
          sitekey: siteKey,
          theme,
          callback: handleSuccess,
          "error-callback": onError,
          "expired-callback": onExpire
        });
      }
    }

    if (!window.turnstile) {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      script.onload = () => {
        renderTurnstile();
      };
    } else {
      renderTurnstile();
    }

    return () => {
      if (widgetIdRef.current) {
        window.turnstile?.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, theme, inputId, onSuccess, onError, onExpire]);

  return <div ref={containerRef} id={containerId} className="cf-turnstile" />;
}

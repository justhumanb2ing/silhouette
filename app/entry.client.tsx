import * as Sentry from "@sentry/react-router";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

Sentry.init({
  dsn: "https://41024f2082a6e7b4ef4599a24c0f357f@o4510413309935616.ingest.us.sentry.io/4510550297477120",
  sendDefaultPii: true,
  integrations: [Sentry.reactRouterTracingIntegration()],
  enableLogs: true,
  tracesSampleRate: 1.0,
  tracePropagationTargets: [/^\//, /^https:\/\/yourserver\.io\/api/],
});

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>,
  );
});
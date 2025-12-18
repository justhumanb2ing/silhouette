import './instrument.server';
import * as Sentry from "@sentry/react-router";
import { handleRequest as vercelHandleRequest } from "@vercel/react-router/entry.server";
import type { EntryContext, RouterContextProvider } from "react-router";

export const handleError = Sentry.createSentryHandleError({
  logErrors: false
});

export const streamTimeout = 5_000;

function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  // RouterContextProvider when v8_middleware is turned on
  _loadContext: RouterContextProvider
) {
  return vercelHandleRequest(
    request,
    responseStatusCode,
    responseHeaders,
    routerContext
    // _loadContext, // Vercel's handler still expecting AppLoadContext type
  );
}

export default Sentry.wrapSentryHandleRequest(handleRequest);
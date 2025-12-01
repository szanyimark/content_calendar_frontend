import { HttpBackend, HttpClient, HttpErrorResponse, HttpHeaders, HttpRequest } from '@angular/common/http';
import { HttpHandlerFn, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, switchMap, throwError, of } from 'rxjs';

// Backend API base; keep in sync with AuthService
const API_BASE = 'https://calendar-api-vpl7.onrender.com';

let csrfTokenCache: string | null = null;

function isMutating(req: HttpRequest<any>): boolean {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase());
}

function isBackendUrl(url: string): boolean {
  return url.startsWith(API_BASE);
}

function shouldBypass(url: string): boolean {
  return url.startsWith(`${API_BASE}/sanctum/csrf-cookie`);
}

function addXsrfHeader(req: HttpRequest<any>, token: string): HttpRequest<any> {
  const headers = (req.headers || new HttpHeaders()).set('X-XSRF-TOKEN', token);
  return req.clone({ headers, withCredentials: true });
}

export const xsrfInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  // Only handle backend mutating requests
  if (!isBackendUrl(req.url) || !isMutating(req) || shouldBypass(req.url)) {
    // Ensure credentials for backend even on GETs
    if (isBackendUrl(req.url) && req.withCredentials !== true) {
      return next(req.clone({ withCredentials: true }));
    }
    return next(req);
  }

  const backend = inject(HttpBackend);
  const bareHttp = new HttpClient(backend);

  // If we don't have a usable token, fetch a fresh one and try again
  const proceedWithToken = (token: string) => {
    if (!token) {
      xsrfLog('no token cached — fetching fresh csrf-cookie');
      return bareHttp.get(`${API_BASE}/sanctum/csrf-cookie`, { withCredentials: true }).pipe(
        switchMap(() => {
          const fresh = readAndDecodeXsrftokenFromCookie();
          xsrfLog('after csrf-cookie fetch, cookie read ->', fresh);
          if (fresh) {
            csrfTokenCache = fresh;
            xsrfLog('using fresh token for request', fresh);
            return next(addXsrfHeader(req, fresh));
          }
          xsrfLog('no CSRF token available after refresh');
          return throwError(() => new Error('No CSRF token available after refresh'));
        })
      );
    }

    xsrfLog('using cached token for request ->', token);
    // Use the provided token as-is (it's already decoded by the reader)
    return next(addXsrfHeader(req, token)).pipe(
      catchError((err: any) => {
        xsrfLog('request error, status ->', err?.status);
        if (err instanceof HttpErrorResponse && err.status === 419) {
          xsrfLog('received 419, refreshing csrf-cookie and retrying');
          // Try once to refresh token via Sanctum cookie then retry
          return bareHttp.get(`${API_BASE}/sanctum/csrf-cookie`, { withCredentials: true }).pipe(
            switchMap(() => {
              const fresh = readAndDecodeXsrftokenFromCookie();
              xsrfLog('after 419 refresh, cookie read ->', fresh);
              if (fresh) {
                csrfTokenCache = fresh;
                xsrfLog('retrying with fresh token ->', fresh);
                return next(addXsrfHeader(req, fresh));
              }
              xsrfLog('no CSRF token available after 419 refresh');
              return throwError(() => new Error('No CSRF token available after 419 refresh'));
            }),
            catchError((e) => {
              xsrfLog('error during csrf-cookie refresh', e);
              return throwError(() => e);
            })
          );
        }
        return throwError(() => err);
      })
    );
  };

  if (csrfTokenCache) {
    return proceedWithToken(csrfTokenCache);
  }
  // Fetch Sanctum CSRF cookie which sets the cookies, then read XSRF-TOKEN from document.cookie
  return bareHttp.get(`${API_BASE}/sanctum/csrf-cookie`, { withCredentials: true }).pipe(
    switchMap(() => {
      const token = readAndDecodeXsrftokenFromCookie();
      xsrfLog('initial csrf-cookie fetch, cookie read ->', token);
      if (token) {
        csrfTokenCache = token;
        return proceedWithToken(token);
      }
      xsrfLog('XSRF-TOKEN cookie not readable after csrf-cookie fetch');
      return proceedWithToken('');
    }),
    catchError((err) => {
      xsrfLog('error fetching csrf-cookie', err);
      return throwError(() => err);
    })
  );
};

function safelyDecode(token: string): string {
  try {
    return decodeURIComponent(token);
  } catch {
    return token;
  }
}

function readAndDecodeXsrftokenFromCookie(): string | null {
  const raw = getCookieValue('XSRF-TOKEN');
  xsrfLog('raw XSRF-TOKEN cookie ->', raw);
  if (!raw) return null;
  let decoded = raw;
  try { decoded = decodeURIComponent(raw); } catch {}
  xsrfLog('after decodeURIComponent ->', decoded);

  // If cookie contains JSON wrapper, extract value
  try {
    if (decoded && decoded.trim().startsWith('{')) {
      const obj = JSON.parse(decoded);
      if (obj && typeof obj.value === 'string') {
        xsrfLog('cookie contained JSON wrapper, extracted value ->', obj.value);
        decoded = obj.value;
      }
    }
  } catch (e) {
    xsrfLog('json parse of cookie failed', e);
  }

  // If looks like base64, try to atob()
  try {
    const b = decoded.replace(/\s+/g, '');
    if (/^[A-Za-z0-9+/=]+$/.test(b)) {
      try { const at = atob(b); if (at) { xsrfLog('base64 atob produced ->', at); decoded = at; } } catch (e) { xsrfLog('atob failed', e); }
    }
  } catch (e) {
    xsrfLog('base64 check failed', e);
  }

  xsrfLog('final decoded token ->', decoded);
  return decoded;
}

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const pairs = document.cookie ? document.cookie.split('; ') : [];
  for (const p of pairs) {
    const idx = p.indexOf('=');
    const key = idx > -1 ? p.substr(0, idx) : p;
    const val = idx > -1 ? p.substr(idx + 1) : '';
    if (key === name) return val;
  }
  return null;
}

function xsrfLog(...args: any[]) {
  // Use console.debug so logs are easy to filter in devtools
  console.debug('[xsrf]', ...args);
}

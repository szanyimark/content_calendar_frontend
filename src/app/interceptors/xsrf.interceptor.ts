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

  const proceedWithToken = (token: string) => {
    const decoded = safelyDecode(token);
    return next(addXsrfHeader(req, decoded)).pipe(
      catchError((err: any) => {
        if (err instanceof HttpErrorResponse && err.status === 419) {
          // Try once to refresh token via Sanctum cookie then retry
          return bareHttp.get(`${API_BASE}/sanctum/csrf-cookie`, { withCredentials: true }).pipe(
            switchMap(() => {
              const fresh = readAndDecodeXsrftokenFromCookie();
              csrfTokenCache = fresh;
              return next(addXsrfHeader(req, csrfTokenCache || ''));
            }),
            catchError((e) => throwError(() => e))
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
      csrfTokenCache = token;
      return proceedWithToken(csrfTokenCache || '');
    }),
    catchError((err) => throwError(() => err))
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
  if (!raw) return null;
  let decoded = raw;
  try { decoded = decodeURIComponent(raw); } catch {}

  // If cookie contains JSON wrapper, extract value
  try {
    if (decoded && decoded.trim().startsWith('{')) {
      const obj = JSON.parse(decoded);
      if (obj && typeof obj.value === 'string') decoded = obj.value;
    }
  } catch {}

  // If looks like base64, try to atob()
  try {
    const b = decoded.replace(/\s+/g, '');
    if (/^[A-Za-z0-9+/=]+$/.test(b)) {
      try { const at = atob(b); if (at) decoded = at; } catch {}
    }
  } catch {}

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

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
  return url.startsWith(`${API_BASE}/csrf-token`) || url.startsWith(`${API_BASE}/sanctum/csrf-cookie`);
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
        // Try once to refresh token then retry
        return bareHttp.get<{ token: string }>(`${API_BASE}/csrf-token`, { withCredentials: true }).pipe(
          switchMap((res) => {
            csrfTokenCache = safelyDecode(res.token);
            return next(addXsrfHeader(req, csrfTokenCache));
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

  // Fetch token first time
  return bareHttp.get<{ token: string }>(`${API_BASE}/csrf-token`, { withCredentials: true }).pipe(
    switchMap((res) => {
      csrfTokenCache = safelyDecode(res.token);
      return proceedWithToken(csrfTokenCache);
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

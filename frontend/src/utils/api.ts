/**
 * api.ts — Centralized fetch wrapper with:
 *  - credentials: 'include' on every request (sends httpOnly cookies)
 *  - Automatic silent token refresh on 401 ACCESS_EXPIRED
 *  - Redirect to login if refresh also fails
 */

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let isRefreshing = false;
let refreshQueue: Array<{ resolve: () => void; reject: (err: unknown) => void }> = [];

function processQueue(error: unknown): void {
    refreshQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve();
    });
    refreshQueue = [];
}

async function refreshAccessToken(): Promise<void> {
    const res = await fetch(`${BACKEND}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
    });
    if (!res.ok) throw new Error('Refresh failed');
}

/**
 * Drop-in replacement for fetch() — always sends cookies and handles 401.
 * Usage: apiFetch('/emails/inbox') — path relative to backend root.
 */
export async function apiFetch(
    path: string,
    options: RequestInit = {}
): Promise<Response> {
    const url = path.startsWith('http') ? path : `${BACKEND}${path}`;

    const res = await fetch(url, {
        ...options,
        credentials: 'include',   // ← sends httpOnly cookies on every cross-origin request
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string> || {}),
        },
    });

    // If access token expired, try silent refresh once then retry
    if (res.status === 401) {
        let body: { code?: string } | null = null;
        try { body = await res.clone().json(); } catch { /* no body */ }

        if (body?.code === 'ACCESS_EXPIRED') {
            if (isRefreshing) {
                // Another request is already refreshing — queue this one
                await new Promise<void>((resolve, reject) =>
                    refreshQueue.push({ resolve, reject })
                );
                return apiFetch(path, options); // retry after refresh completes
            }

            isRefreshing = true;
            try {
                await refreshAccessToken();
                processQueue(null);
                return apiFetch(path, options); // retry original request
            } catch (err) {
                processQueue(err);
                // Refresh failed — session is dead, send to login
                localStorage.removeItem('user');
                window.location.href = '/';
                throw err;
            } finally {
                isRefreshing = false;
            }
        }
    }

    return res;
}

export { BACKEND };

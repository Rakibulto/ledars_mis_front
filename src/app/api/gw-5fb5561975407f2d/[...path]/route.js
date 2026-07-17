import CryptoJS from 'crypto-js';
import { NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Server-only env — never exposed to the browser.
// Falls back to NEXT_PUBLIC_SERVER_URL for existing setups.
// ---------------------------------------------------------------------------
const BACKEND_URL = (process.env.NEXT_PUBLIC_SERVER_URL || '').replace(/\/+$/, '');

// CRYPTO_SECRET is server-only (no NEXT_PUBLIC_ prefix) — never bundled.
// NEXT_PUBLIC_CRYPTO_SECRET is used by the browser for the same channel;
// both hold the same value but CRYPTO_SECRET is never shipped to clients.
const SECRET_KEY =
  process.env.CRYPTO_SECRET ||
  process.env.NEXT_PUBLIC_CRYPTO_SECRET ||
  'sf-hrm-default-key-change-in-prod';

const ENCRYPTION_ENABLED = process.env.NEXT_PUBLIC_ENABLE_ENCRYPTION === 'true';

// ---------------------------------------------------------------------------
// Crypto helpers (server-side only)
// ---------------------------------------------------------------------------

function decryptBody(cipherText) {
  const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

function encryptBody(data) {
  const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
  return CryptoJS.AES.encrypt(jsonStr, SECRET_KEY).toString();
}

// ---------------------------------------------------------------------------
// Security headers appended to every proxied response
// ---------------------------------------------------------------------------
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-DNS-Prefetch-Control': 'off',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// ---------------------------------------------------------------------------
// Core proxy handler — works for every HTTP method
// ---------------------------------------------------------------------------

async function handler(request, { params }) {
  try {
    const resolvedParams = await params;
    const pathSegments = resolvedParams.path || [];

    // Reconstruct target URL (preserve query string + ensure trailing slash
    // so Django's APPEND_SLASH doesn't reject PATCH / DELETE / PUT requests)
    const { search } = new URL(request.url);
    let targetPath = `/${pathSegments.join('/')}`;
    if (!targetPath.endsWith('/')) targetPath += '/';
    const targetUrl = `${BACKEND_URL}${targetPath}${search}`;

    // --- Forward headers (skip hop-by-hop & internal ones) ----------------
    const skipHeaders = new Set([
      'host',
      'connection',
      'keep-alive',
      'transfer-encoding',
      'content-length',
      'accept-encoding',
      'x-encrypted',
    ]);

    const forwardHeaders = new Headers();
    request.headers.forEach((value, key) => {
      if (!skipHeaders.has(key.toLowerCase())) {
        forwardHeaders.set(key, value);
      }
    });

    // --- Build body -------------------------------------------------------
    const isEncryptedReq = request.headers.get('x-encrypted') === 'true';
    const contentType = request.headers.get('content-type') || '';
    const isFormData = contentType.includes('multipart/form-data');
    const hasBody = !['GET', 'HEAD'].includes(request.method);

    let body = null;

    if (hasBody) {
      if (isFormData) {
        // Forward multipart as raw bytes — preserves boundary & files
        body = await request.arrayBuffer();
        // Keep original Content-Type with boundary
      } else if (isEncryptedReq && ENCRYPTION_ENABLED) {
        // Decrypt the browser's encrypted envelope → forward plain JSON to backend
        const raw = await request.text();
        const envelope = JSON.parse(raw);
        const decrypted = decryptBody(envelope.payload);
        body = decrypted;
        forwardHeaders.set('content-type', 'application/json');
      } else {
        body = await request.text();
      }
    }

    // --- Fetch from backend -----------------------------------------------
    const backendResponse = await fetch(targetUrl, {
      method: request.method,
      headers: forwardHeaders,
      ...(body !== null && { body }),
    });

    // --- Build response back to frontend -----------------------------------
    const resContentType = backendResponse.headers.get('content-type') || '';
    const isJsonRes = resContentType.includes('application/json');

    const responseHeaders = {
      ...(resContentType ? { 'Content-Type': resContentType } : {}),
      ...SECURITY_HEADERS,
    };

    // Forward useful response headers
    const passthroughHeaders = [
      'x-total-count',
      'x-page',
      'x-page-size',
      'x-total-pages',
      'link',
      'content-language',
      'cache-control',
      'vary',
    ];
    passthroughHeaders.forEach((h) => {
      const val = backendResponse.headers.get(h);
      if (val) responseHeaders[h] = val;
    });

    if (isJsonRes && ENCRYPTION_ENABLED) {
      // Encrypt JSON response before sending to browser
      // for 204/205 there is no JSON body to decrypt; skip early
      if (backendResponse.status === 204 || backendResponse.status === 205) {
        return new NextResponse(null, {
          status: backendResponse.status,
          statusText: backendResponse.statusText,
          headers: responseHeaders,
        });
      }

      const jsonData = await backendResponse.json();
      const encrypted = encryptBody(jsonData);
      const envelope = JSON.stringify({ payload: encrypted, _encrypted: true });

      return new NextResponse(envelope, {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        headers: { ...responseHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Non-JSON or encryption disabled → stream through as-is
    // Some responses (204/205) have no body; pass null to avoid NextResponse error.
    if (backendResponse.status === 204 || backendResponse.status === 205) {
      return new NextResponse(null, {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        headers: responseHeaders,
      });
    }

    const responseBody = await backendResponse.arrayBuffer();

    return new NextResponse(responseBody, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[Proxy Error]', error);

    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 502, headers: SECURITY_HEADERS }
    );
  }
}

// ---------------------------------------------------------------------------
// Export named handlers for every HTTP method
// ---------------------------------------------------------------------------

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;

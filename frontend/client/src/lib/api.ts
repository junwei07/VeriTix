/**
 * API utility for VeriTix backend communication
 * All endpoints use the /api prefix which is proxied by Vite dev server to http://localhost:4000
 */

const API_BASE = '/api';

export interface ApiError {
  message: string;
  status?: number;
}

/**
 * Generic POST request helper
 */
export async function apiPost<T = any>(path: string, body: any): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error: ApiError = {
      message: 'Request failed',
      status: response.status,
    };

    try {
      const data = await response.json();
      error.message = data.message || data.error || error.message;
    } catch {
      error.message = response.statusText || error.message;
    }

    throw error;
  }

  return response.json();
}

/**
 * Generic GET request helper
 */
export async function apiGet<T = any>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error: ApiError = {
      message: 'Request failed',
      status: response.status,
    };

    try {
      const data = await response.json();
      error.message = data.message || data.error || error.message;
    } catch {
      error.message = response.statusText || error.message;
    }

    throw error;
  }

  return response.json();
}

/**
 * Login with NRIC - creates/retrieves XRPL wallet
 */
export async function loginWithNRIC(nric: string) {
  return apiPost<{
    nric: string;
    walletAddress: string;
    seed?: string; // Only in demo, never expose to UI
  }>('/auth/login', { nric });
}

/**
 * Get current user info
 */
export async function getCurrentUser(nric?: string) {
  const path = nric ? `/auth/user?nric=${encodeURIComponent(nric)}` : '/auth/user';
  return apiGet<{
    nric: string;
    walletAddress: string;
  }>(path);
}

/**
 * Purchase a ticket - mints Soulbound NFT after payment
 */
export async function purchaseTicket(params: {
  userAddress: string;
  ticketType: string;
}) {
  return apiPost<{
    message: string;
    tokenId: string;
    txHash: string;
  }>('/tickets/purchase', params);
}

/**
 * Get user's tickets (optional - can use localStorage for demo)
 */
export async function getUserTickets(walletAddress?: string) {
  const path = walletAddress 
    ? `/tickets?walletAddress=${encodeURIComponent(walletAddress)}`
    : '/tickets';
  return apiGet<Array<{
    tokenId: string;
    txHash: string;
    ticketType: string;
    eventId?: number;
    purchasedAt: string;
    walletAddress: string;
  }>>(path);
}

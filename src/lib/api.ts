export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787/api';

/**
 * Basic generic fetch wrapper to communicate with the Cloudflare Worker API
 */
export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_URL}${endpoint}`;

    const headers = new Headers(options?.headers);
    if (!headers.has('Content-Type') && !(options?.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (!response.ok) {
        let errorMessage = 'An error occurred';
        try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
        } catch (e) {
            errorMessage = response.statusText;
        }
        throw new Error(errorMessage);
    }

    if (response.status === 204) {
        return {} as T;
    }

    return response.json();
}

// Example specific API methods
export const api = {
    healthCheck: () => fetchApi<{ status: string }>('/health'),

    tenants: {
        getAll: () => fetchApi<any[]>('/tenants'),
    },

    orders: {
        getAll: () => fetchApi<any[]>('/orders'),
        // These endpoints don't exist in the worker yet, but this is the structure
        // create: (data: any) => fetchApi<any>('/orders', { method: 'POST', body: JSON.stringify(data) }),
        // update: (id: string, data: any) => fetchApi<any>(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        // delete: (id: string) => fetchApi<void>(`/orders/${id}`, { method: 'DELETE' }),
    }
};

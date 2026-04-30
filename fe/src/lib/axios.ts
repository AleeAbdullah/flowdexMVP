import axios, { isAxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios';

function resolvePublicApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window === 'undefined') {
    const serverPort = process.env.PORT || '3003';
    return `http://127.0.0.1:${serverPort}/api`;
  }

  return '/api';
}

function getUserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: resolvePublicApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

export const axiosAuth: AxiosInstance = axios.create({
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
  withCredentials: true,
});

function attachTimezoneHeader(instance: AxiosInstance) {
  instance.interceptors.request.use(
    (config) => {
      config.headers['x-user-timezone'] = getUserTimezone();
      return config;
    },
    error => Promise.reject(error),
  );
}

attachTimezoneHeader(axiosInstance);
attachTimezoneHeader(axiosAuth);

export const STATUS_CODES = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export function extractAxiosError(error: unknown) {
  if (isAxiosError(error)) {
    const data = error.response?.data;
    const message = resolveAxiosErrorMessage(error);

    return {
      message,
      status: error.response?.status ?? null,
      statusText: error.response?.statusText ?? null,
      data,
      url: error.config?.url ?? null,
      method: error.config?.method ?? null,
    };
  }

  return {
    message: error instanceof Error ? error.message : 'Unknown error occurred',
    status: null,
    statusText: null,
    data: null,
    url: null,
    method: null,
  };
}

function resolveAxiosErrorMessage(error: unknown): string {
  if (!isAxiosError(error)) {
    return error instanceof Error ? error.message : 'API request failed';
  }

  const fallback = error.message || 'API request failed';
  const payload = error.response?.data;

  if (payload && typeof payload === 'object') {
    const asObject = payload as { message?: unknown; detail?: unknown; error?: unknown; non_field_errors?: unknown };

    if (Array.isArray(asObject.non_field_errors) && asObject.non_field_errors[0]) {
      return String(asObject.non_field_errors[0]);
    }

    for (const value of [asObject.message, asObject.detail, asObject.error]) {
      if (Array.isArray(value)) {
        const joined = value.map(item => String(item)).join(', ').trim();
        if (joined) {
          return joined;
        }
      }

      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
  }

  if (typeof payload === 'string' && payload.trim()) {
    return payload.trim();
  }

  return fallback;
}

export const api = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
    axiosInstance.get<T>(url, config).then(response => response.data),

  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    axiosInstance.post<T>(url, data, config).then(response => response.data),

  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    axiosInstance.put<T>(url, data, config).then(response => response.data),

  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    axiosInstance.patch<T>(url, data, config).then(response => response.data),

  delete: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
    axiosInstance.delete<T>(url, config).then(response => response.data),
};

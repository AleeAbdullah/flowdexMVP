'use client';

import { useEffect, useMemo } from 'react';
import { axiosAuth } from '@/lib/axios';

function formatClientDate(date: Date) {
  return date.toISOString();
}

const useAxiosAuth = () => {
  useEffect(() => {
    const reqInterceptor = axiosAuth.interceptors.request.use(
      (config) => {
        config.headers['x-client-date'] = formatClientDate(new Date());
        return config;
      },
      error => Promise.reject(error),
    );

    const resInterceptor = axiosAuth.interceptors.response.use(
      response => response,
      error => Promise.reject(error),
    );

    return () => {
      axiosAuth.interceptors.request.eject(reqInterceptor);
      axiosAuth.interceptors.response.eject(resInterceptor);
    };
  }, []);

  return useMemo(() => axiosAuth, []);
};

export default useAxiosAuth;

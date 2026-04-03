'use client';

import NextError from 'next/error';
import { AppConfig } from '@/utils/app-config';

export default function GlobalError(props: {
  error: Error & { digest?: string };
}) {
  void props.error;

  return (
    <html lang={AppConfig.language}>
      <body>
        {/* `NextError` is the default Next.js error page component. Its type
        definition requires a `statusCode` prop. However, since the App Router
        does not expose status codes for errors, we simply pass 0 to render a
        generic error message. */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}

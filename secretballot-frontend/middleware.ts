import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'zh'],

  // Used when no locale matches
  defaultLocale: 'en',
  
  // Disable automatic locale detection to prevent issues
  localeDetection: true
});

export default function middleware(request: NextRequest) {
  return intlMiddleware(request);
}

export const config = {
  // Match only internationalized pathnames
  // Skip all internal paths (_next, api, static files)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};



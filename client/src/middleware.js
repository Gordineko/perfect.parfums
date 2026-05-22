// middleware.js (в корне проекта, рядом с app/)
import { i18n } from '@shared/i18n/config';
import { NextResponse } from 'next/server';


export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Пропускаем статические файлы, API, файлы с расширениями
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    /\.(.*)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Проверяем, содержит ли путь какую-либо локаль из списка
  const pathnameHasLocale = i18n.locales.some(
    (locale) => 
      pathname.startsWith(`/${locale}/`) || 
      pathname === `/${locale}`
  );

  // Если локаль не найдена в пути - добавляем локаль по умолчанию
  if (!pathnameHasLocale) {
    const defaultLocale = i18n.defaultLocale; // "ua"
    
    // Если это корневой путь '/', делаем /ua
    if (pathname === '/') {
      request.nextUrl.pathname = `/${defaultLocale}`;
    } 
    // Если это любой другой путь, добавляем локаль в начало
    else {
      request.nextUrl.pathname = `/${defaultLocale}${pathname}`;
    }
    
    // Перенаправляем пользователя
    return NextResponse.redirect(request.nextUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Пропускаем все статические файлы и API
    '/((?!_next|api|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
import { NextRequest, NextResponse } from 'next/server';
import { authenticate, unauthorized, forbidden, requireRole } from '@/lib/api-middleware';
import { modules } from '@/lib/data';

/**
 * POST /api/lti/deep-link
 * Handle LTI Deep Linking: return content items for Moodle course pages
 */
export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();

  if (!requireRole(auth.role, 'admin', 'teacher')) return forbidden();

  try {
    const body = await request.json();
    const { platformId, type } = body;

    // type can be: 'all', 'modules', 'quizzes'
    const contentType = type || 'all';

    const contentItems: Array<{
      type: string;
      title: string;
      url: string;
      icon?: string;
      description?: string;
    }> = [];

    if (contentType === 'all' || contentType === 'modules') {
      contentItems.push(
        ...modules.map((m) => ({
          type: 'ltiResourceLink',
          title: m.title,
          url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?module=${m.id}`,
          icon: m.icon,
          description: m.description,
        })),
      );
    }

    if (contentType === 'all' || contentType === 'quizzes') {
      const quizCategories = [
        { id: 'general', title: 'General Security Quiz' },
        { id: 'sql', title: 'SQL Injection Quiz' },
        { id: 'xss', title: 'XSS Quiz' },
        { id: 'csrf', title: 'CSRF Quiz' },
        { id: 'auth', title: 'Authentication Quiz' },
        { id: 'owasp', title: 'OWASP Top 10 Quiz' },
        { id: 'coding', title: 'Secure Coding Quiz' },
        { id: 'network', title: 'Network Security Quiz' },
        { id: 'social', title: 'Social Engineering Quiz' },
      ];

      contentItems.push(
        ...quizCategories.map((q) => ({
          type: 'ltiResourceLink',
          title: q.title,
          url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?quiz=${q.id}`,
          description: `Quiz category: ${q.title}`,
        })),
      );
    }

    return NextResponse.json({
      contentItems,
      platformId,
    });
  } catch (error) {
    console.error('Deep link error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/lti/deep-link
 * Get available content items for deep linking
 */
export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth) return unauthorized();

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    const items: Array<{
      id: string;
      type: string;
      title: string;
      url: string;
      icon?: string;
      description?: string;
    }> = [];

    if (type === 'all' || type === 'modules') {
      items.push(
        ...modules.map((m) => ({
          id: m.id,
          type: 'module',
          title: m.title,
          url: `/?module=${m.id}`,
          icon: m.icon,
          description: m.description,
        })),
      );
    }

    if (type === 'all' || type === 'quizzes') {
      const quizCategories = [
        { id: 'general', title: 'General Security Quiz' },
        { id: 'sql', title: 'SQL Injection Quiz' },
        { id: 'xss', title: 'XSS Quiz' },
        { id: 'csrf', title: 'CSRF Quiz' },
        { id: 'auth', title: 'Authentication Quiz' },
        { id: 'owasp', title: 'OWASP Top 10 Quiz' },
        { id: 'coding', title: 'Secure Coding Quiz' },
        { id: 'network', title: 'Network Security Quiz' },
        { id: 'social', title: 'Social Engineering Quiz' },
      ];

      items.push(
        ...quizCategories.map((q) => ({
          id: q.id,
          type: 'quiz',
          title: q.title,
          url: `/?quiz=${q.id}`,
          description: `Quiz category: ${q.title}`,
        })),
      );
    }

    return NextResponse.json(items);
  } catch (error) {
    console.error('Deep link GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

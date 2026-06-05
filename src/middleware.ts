import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { AccountTier } from "@/lib/account-tier";
import { AUTH_COOKIE, JWT_SECRET } from "@/lib/auth-cookie";
import { getHomeRouteForTier } from "@/lib/home-routes";

const EDITOR_WRITE_PATTERNS = ["/new", "/edit", "/upload"];

interface TokenPayload {
  roleSlug: string;
  tier: AccountTier;
  permissions: string[];
}

async function getPayloadFromToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload.tier || !payload.roleSlug) {
      return null;
    }

    return {
      roleSlug: payload.roleSlug as string,
      tier: payload.tier as AccountTier,
      permissions: Array.isArray(payload.permissions)
        ? (payload.permissions as string[])
        : [],
    };
  } catch {
    return null;
  }
}

function redirectToHome(request: NextRequest, tier: AccountTier) {
  return NextResponse.redirect(
    new URL(getHomeRouteForTier(tier), request.url)
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin/login")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = await getPayloadFromToken(token);
  if (!payload) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(AUTH_COOKIE);
    return response;
  }

  const { tier, permissions } = payload;

  if (pathname.startsWith("/super-admin")) {
    if (tier !== AccountTier.SUPER_ADMIN) {
      return redirectToHome(request, tier);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (tier !== AccountTier.STAFF) {
      return redirectToHome(request, tier);
    }

    const canWrite = permissions.includes("content.write");
    if (!canWrite) {
      const isWritePath = EDITOR_WRITE_PATTERNS.some((pattern) =>
        pathname.includes(pattern)
      );
      if (isWritePath) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/user")) {
    if (tier !== AccountTier.MEMBER) {
      return redirectToHome(request, tier);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/super-admin/:path*", "/admin/:path*", "/user/:path*"],
};

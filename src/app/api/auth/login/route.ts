import { NextRequest, NextResponse } from "next/server";

import {

  createSession,

  getHomeRouteForSession,

  setAuthCookie,

  verifyCredentials,

  AUTH_COOKIE,

} from "@/lib/auth";

import { loginSchema } from "@/lib/validations";



export async function POST(request: NextRequest) {

  try {

    const body = await request.json();

    const { email, password } = loginSchema.parse(body);

    const user = await verifyCredentials(email, password);



    if (!user) {

      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    }



    const token = await createSession(user);

    const response = NextResponse.json({

      success: true,

      user: {

        email: user.email,

        roleSlug: user.roleSlug,

        roleName: user.roleName,

        name: user.name,

      },

      redirect: getHomeRouteForSession(user),

    });

    setAuthCookie(response, token);

    return response;

  } catch (error) {

    const message = error instanceof Error ? error.message : "Login failed";

    const status = message === "Account deactivated" ? 403 : 400;

    return NextResponse.json({ error: message }, { status });

  }

}



export async function DELETE() {

  const response = NextResponse.json({ success: true });

  response.cookies.delete(AUTH_COOKIE);

  return response;

}



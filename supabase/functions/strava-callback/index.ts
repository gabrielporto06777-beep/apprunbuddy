import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const APP_DASHBOARD_URL = "https://kilometer-crew.lovable.app/dashboard";

function redirectTo(status: "success" | "error") {
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${APP_DASHBOARD_URL}?strava=${status}`,
      "Cache-Control": "no-store",
    },
  });
}

function getAccessTokenFromRequest(req: Request) {
  const authorizationHeader = req.headers.get("Authorization");

  if (authorizationHeader?.startsWith("Bearer ")) {
    return authorizationHeader.replace("Bearer ", "").trim();
  }

  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  const authCookie = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.includes("auth-token"));

  if (!authCookie) return null;

  const [, rawValue] = authCookie.split("=");
  if (!rawValue) return null;

  const decodedValue = decodeURIComponent(rawValue);
  const jwtMatch = decodedValue.match(/[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/);

  return jwtMatch?.[0] ?? null;
}

serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code")?.trim();
  const errorParam = url.searchParams.get("error")?.trim();
  const stateUserId = url.searchParams.get("state")?.trim();
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  if (!code || code === "access_denied" || errorParam === "access_denied") {
    return redirectTo("error");
  }

  const accessToken = getAccessTokenFromRequest(req);
  let authenticatedUserId: string | null = null;

  if (accessToken) {
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(accessToken);

    if (authError) {
      console.error("Unable to read authenticated user from request:", authError.message);
    } else {
      authenticatedUserId = user?.id ?? null;
    }
  }

  if (authenticatedUserId && stateUserId && authenticatedUserId !== stateUserId) {
    console.error("Authenticated user and Strava state do not match");
    return redirectTo("error");
  }

  const userId = authenticatedUserId ?? stateUserId;

  if (!userId) {
    console.error("Missing user context for Strava callback");
    return redirectTo("error");
  }

  const clientSecret = Deno.env.get("STRAVA_CLIENT_SECRET");
  if (!clientSecret) {
    console.error("Missing STRAVA_CLIENT_SECRET");
    return redirectTo("error");
  }

  const tokenRes = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: 184780,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok || !tokenData.access_token || !tokenData.athlete?.id) {
    console.error("Strava token exchange failed:", JSON.stringify(tokenData));
    return redirectTo("error");
  }

  const { access_token, refresh_token, expires_at, athlete } = tokenData;

  const supabase = createClient(
    SUPABASE_URL,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { error: userError } = await supabase
    .from("users")
    .upsert(
      {
        id: userId,
        strava_id: String(athlete.id),
        full_name: `${athlete.firstname} ${athlete.lastname}`,
        strava_avatar: athlete.profile,
        email: athlete.email || null,
      },
      { onConflict: "id" }
    );

  if (userError) {
    console.error("Error saving user:", userError.message);
    return redirectTo("error");
  }

  const { error: tokenError } = await supabase
    .from("strava_tokens")
    .upsert(
      {
        user_id: userId,
        access_token,
        refresh_token,
        expires_at: new Date(expires_at * 1000).toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (tokenError) {
    console.error("Error saving tokens:", tokenError.message);
    return redirectTo("error");
  }

  // --- Auto-generate personalized training plan ---
  try {
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const generatePlanUrl = `${SUPABASE_URL}/functions/v1/generate-plan`;
    const planRes = await fetch(generatePlanUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "x-internal-secret": SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({ user_id: userId }),
    });
    if (!planRes.ok) {
      const errText = await planRes.text();
      console.error("Auto generate-plan failed (non-blocking):", errText);
    } else {
      console.log("Auto generate-plan succeeded for user:", userId);
    }
  } catch (planErr) {
    console.error("Auto generate-plan error (non-blocking):", planErr);
  }

  return redirectTo("success");
});

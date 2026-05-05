import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get authenticated user
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await authClient.auth.getUser(token);
    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = authData.user.id;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Get Strava tokens
    const { data: tokenRow, error: tokenError } = await admin
      .from("strava_tokens")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (tokenError || !tokenRow) {
      return new Response(JSON.stringify({ error: "Strava not connected" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let accessToken = tokenRow.access_token;
    const expiresAt = new Date(tokenRow.expires_at);

    // Refresh token if expired
    if (expiresAt.getTime() < Date.now()) {
      const clientId = Deno.env.get("STRAVA_CLIENT_ID") || "184780";
      const clientSecret = Deno.env.get("STRAVA_CLIENT_SECRET");

      const refreshRes = await fetch("https://www.strava.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: parseInt(clientId, 10),
          client_secret: clientSecret,
          refresh_token: tokenRow.refresh_token,
          grant_type: "refresh_token",
        }),
      });

      if (!refreshRes.ok) {
        const errText = await refreshRes.text();
        console.error("Token refresh failed:", errText);
        return new Response(JSON.stringify({ error: "Token refresh failed" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const refreshData = await refreshRes.json();
      accessToken = refreshData.access_token;

      await admin.from("strava_tokens").update({
        access_token: refreshData.access_token,
        refresh_token: refreshData.refresh_token,
        expires_at: new Date(refreshData.expires_at * 1000).toISOString(),
      }).eq("user_id", userId);
    }

    // Get user info from users table
    const { data: userRow } = await admin
      .from("users")
      .select("full_name, strava_avatar, strava_id")
      .eq("id", userId)
      .maybeSingle();

    // Fetch activities from Strava
    const activitiesRes = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?per_page=10`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!activitiesRes.ok) {
      const errText = await activitiesRes.text();
      console.error("Strava activities fetch failed:", errText);
      return new Response(JSON.stringify({ error: "Failed to fetch activities" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const activities = await activitiesRes.json();

    // Fetch athlete stats
    let stats = null;
    if (userRow?.strava_id) {
      const statsRes = await fetch(
        `https://www.strava.com/api/v3/athletes/${userRow.strava_id}/stats`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (statsRes.ok) {
        stats = await statsRes.json();
      } else {
        await statsRes.text(); // consume body
      }
    }

    return new Response(
      JSON.stringify({
        athlete: {
          name: userRow?.full_name || "Athlete",
          avatar: userRow?.strava_avatar || null,
          strava_id: userRow?.strava_id || null,
        },
        activities,
        stats,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("strava-sync error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLAN_ID = "a0000000-0000-0000-0000-000000000001";

const systemPrompt = `You are an expert running coach AI creating personalized training plans. You MUST respond in English only. Never use Portuguese.

CRITICAL RULES FOR PLAN QUALITY:
1. The plan must be PROGRESSIVE — weekly volume should increase gradually (roughly 10% per week), with a deload/recovery week every 3-4 weeks.
2. Rest days are MANDATORY — never schedule more training days than the user requested. Fill remaining days with Rest.
3. Match the user's FITNESS LEVEL — beginners start with walk/run intervals and short distances, advanced runners get tempo/interval work.
4. Respect INJURIES — if the user has knee/ankle/shin injuries, reduce high-impact sessions, add more recovery, and lower intensity.
5. Respect SESSION DURATION — if user has only 30min, don't schedule 15km runs.
6. GOAL-SPECIFIC — if training for a race (5K, 10K, half, full marathon), include race-specific pacing and a taper in weeks 7-8.
7. Each week MUST have exactly 7 entries (day_of_week 0-6, Sun-Sat).

Valid session_type values ONLY: Easy Run, Interval Session, Tempo Run, Long Run, Recovery Run, Rest.
Set distance_km to null for Rest days. Set target_pace as "X:XX/km" format.

CRITICAL — "notes" field instructions:
For EVERY non-Rest session, the "notes" field MUST contain a DETAILED step-by-step workout description in Portuguese (pt-BR) with:
1. Aquecimento (warm-up): duration, pace, drills
2. Parte principal (main set): exact intervals, distances, paces, recovery between reps
3. Volta à calma (cool-down): duration, pace, stretching notes
4. Dica do coach (coach tip): one practical tip for this specific session

Example for an Interval Session:
"Aquecimento: 10 min de trote leve (6:30/km) + 4 educativos de corrida.\\nParte principal: 6x800m a 4:15/km com 90s de trote entre cada repetição.\\nVolta à calma: 10 min de trote leve + alongamento de quadríceps, posterior e panturrilha.\\nDica: Mantenha a postura ereta nos intervalos e respire pelo nariz e boca."

For Rest days, notes should be a short recovery tip in Portuguese like "Dia de descanso total. Hidrate-se bem e durma pelo menos 8 horas."`;

function replacePortugueseTerms(jsonString: string) {
  return jsonString
    .replaceAll("Longão", "Long Run")
    .replaceAll("Corrida Leve", "Easy Run")
    .replaceAll("Corrida Longa", "Long Run")
    .replaceAll("Intervalado", "Interval Session")
    .replaceAll("Recuperação", "Recovery Run")
    .replaceAll("Descanso", "Rest");
}

function canonicalSessionType(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("recovery")) return "Recovery Run";
  if (normalized.includes("interval")) return "Interval Session";
  if (normalized.includes("tempo")) return "Tempo Run";
  if (normalized.includes("long")) return "Long Run";
  if (normalized.includes("rest")) return "Rest";
  return "Easy Run";
}

function defaultPlan(profile?: any) {
  // Scale distances based on user's avg_run_distance
  const distMap: Record<string, number> = { "2-3km": 2, "3-5km": 4, "5-8km": 6, "8-12km": 9, "12+km": 12 };
  const base = distMap[profile?.avg_run_distance] ?? 3;
  const trainingDays = profile?.weekly_goal_days ?? 3;

  const workouts = [
    { session_type: "Easy Run", title: "Easy Run", distFactor: 1, pace: "7:00/km", notes: "Aquecimento: 5 min caminhada.\nParte principal: corrida leve e contínua.\nVolta à calma: 5 min caminhada + alongamento.\nDica: Mantenha um ritmo onde consiga conversar." },
    { session_type: "Interval Session", title: "Interval Session", distFactor: 0.8, pace: "6:00/km", notes: "Aquecimento: 10 min trote leve.\nParte principal: 4x400m em ritmo forte com 2 min de caminhada entre cada.\nVolta à calma: 10 min trote + alongamento.\nDica: Foque na forma, não na velocidade." },
    { session_type: "Long Run", title: "Long Run", distFactor: 1.5, pace: "7:30/km", notes: "Aquecimento: 5 min caminhada rápida.\nParte principal: corrida contínua em ritmo confortável.\nVolta à calma: 5 min caminhada + alongamento completo.\nDica: Hidrate-se antes e durante se passar de 40 min." },
    { session_type: "Tempo Run", title: "Tempo Run", distFactor: 1.2, pace: "6:30/km", notes: "Aquecimento: 10 min trote.\nParte principal: corrida em ritmo moderadamente forte (esforço 7/10).\nVolta à calma: 5 min trote leve.\nDica: Respire de forma ritmada." },
    { session_type: "Recovery Run", title: "Recovery Run", distFactor: 0.7, pace: "8:00/km", notes: "Corrida muito leve para recuperação ativa.\nDica: Se sentir qualquer dor, caminhe." },
  ];

  return Array.from({ length: 8 }, (_, weekIdx) => {
    const weekNum = weekIdx + 1;
    const volumeMultiplier = weekNum === 4 || weekNum === 8 ? 0.7 : 1 + (weekIdx * 0.08);
    const allDays = Array.from({ length: 7 }, (_, d) => d);
    const sessions: any[] = [];
    let workoutIdx = 0;

    for (const day of allDays) {
      if (workoutIdx < trainingDays) {
        // Space workouts: e.g. 3 days → Mon(1), Wed(3), Sat(6)
        const spacing = Math.floor(7 / trainingDays);
        const targetDay = (1 + workoutIdx * spacing) % 7;
        if (day === targetDay || (day === allDays[allDays.length - 1] && workoutIdx < trainingDays)) {
          const w = workouts[workoutIdx % workouts.length];
          sessions.push({
            day_of_week: day,
            session_type: w.session_type,
            title: w.title,
            distance_km: Math.round(base * w.distFactor * volumeMultiplier * 10) / 10,
            target_pace: w.pace,
            notes: w.notes,
          });
          workoutIdx++;
          continue;
        }
      }
      sessions.push({ day_of_week: day, session_type: "Rest", title: "Rest", distance_km: null, target_pace: null, notes: "Dia de descanso. Hidrate-se e descanse bem." });
    }

    // Fill remaining workout slots if spacing didn't place them all
    while (workoutIdx < trainingDays) {
      const emptyRest = sessions.findIndex((s, i) => s.session_type === "Rest" && i > 0);
      if (emptyRest === -1) break;
      const w = workouts[workoutIdx % workouts.length];
      sessions[emptyRest] = {
        day_of_week: sessions[emptyRest].day_of_week,
        session_type: w.session_type,
        title: w.title,
        distance_km: Math.round(base * w.distFactor * volumeMultiplier * 10) / 10,
        target_pace: w.pace,
        notes: w.notes,
      };
      workoutIdx++;
    }

    return { week_number: weekNum, sessions };
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json().catch(() => ({}));
    const requestedUserId = typeof body?.user_id === "string" ? body.user_id : null;
    const internalSecret = req.headers.get("x-internal-secret");
    const isInternal = internalSecret === serviceRoleKey;

    let userId: string;

    if (isInternal) {
      if (!requestedUserId) {
        return new Response(JSON.stringify({ error: "Missing user_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = requestedUserId;
    } else {
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Missing authorization header" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

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

      userId = authData.user.id;
    }

    const [{ data: profile }, { data: runs }] = await Promise.all([
      supabase.from("profiles").select("fitness_level, weekly_goal_days, weekly_goal_km, race_goal, race_date, running_frequency, avg_run_distance, avg_pace, session_duration_min, injuries, weight_kg, height_cm, training_intensity, training_location, preferred_workouts").eq("id", userId).maybeSingle(),
      supabase
        .from("runs")
        .select("distance_km, duration_seconds, avg_pace_seconds, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    let weeks = defaultPlan(profile);
    console.log("Profile data:", JSON.stringify(profile));
    console.log("LOVABLE_API_KEY available:", !!lovableApiKey);

    if (lovableApiKey) {
      const raceInfo = profile?.race_goal ? `\nGoals: ${profile.race_goal}${profile.race_date ? ` by ${profile.race_date}` : ''}` : '';
      const trainingDays = profile?.weekly_goal_days || 3;
      const extraInfo = [
        profile?.running_frequency ? `Current frequency: ${profile.running_frequency}` : '',
        profile?.avg_run_distance ? `Avg distance: ${profile.avg_run_distance}` : '',
        profile?.avg_pace ? `Avg pace: ${profile.avg_pace}` : '',
        profile?.session_duration_min ? `Max time per session: ${profile.session_duration_min} min` : '',
        profile?.injuries && profile.injuries !== 'none' ? `Injuries/pain areas: ${profile.injuries} — REDUCE impact and add recovery for these areas` : '',
        profile?.weight_kg ? `Weight: ${profile.weight_kg} kg` : '',
        profile?.height_cm ? `Height: ${profile.height_cm} cm` : '',
        profile?.training_intensity ? `Preferred intensity: ${profile.training_intensity}` : '',
        profile?.training_location ? `Training locations: ${profile.training_location}` : '',
        profile?.preferred_workouts ? `Preferred workout types: ${profile.preferred_workouts}` : '',
      ].filter(Boolean).join('\n');
      const prompt = `Create an 8-week progressive running plan. Return JSON only.

IMPORTANT CONSTRAINTS:
- User wants to train ${trainingDays} days per week. The remaining ${7 - trainingDays} days MUST be Rest.
- ${profile?.fitness_level === 'beginner' ? 'User is a BEGINNER — start with very low volume (2-3km easy runs), include walk breaks if needed.' : ''}
- ${profile?.training_intensity === 'light' ? 'Keep intensity LOW — mostly easy runs with minimal speed work.' : ''}
- Week 1 should start conservatively. Increase ~10% volume per week. Week 4 and 8 should be deload weeks (reduce 20-30%).
${raceInfo}
${extraInfo}

Recent runs for calibration: ${JSON.stringify(runs ?? [])}`;

      const gatewayResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "submit_plan",
                description: "Return an 8-week running plan in canonical English.",
                parameters: {
                  type: "object",
                  properties: {
                    weeks: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          week_number: { type: "integer" },
                          sessions: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                day_of_week: { type: "integer" },
                                session_type: { type: "string" },
                                title: { type: "string" },
                                distance_km: { type: ["number", "null"] },
                                target_pace: { type: ["string", "null"] },
                                notes: { type: ["string", "null"] },
                              },
                              required: ["day_of_week", "session_type", "title", "distance_km", "target_pace", "notes"],
                              additionalProperties: false,
                            },
                          },
                        },
                        required: ["week_number", "sessions"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["weeks"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "submit_plan" } },
        }),
      });

      if (gatewayResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (gatewayResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (gatewayResponse.ok) {
        const payload = await gatewayResponse.json();
        console.log("AI response status:", gatewayResponse.status);
        const rawArguments = payload.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
        if (rawArguments) {
          console.log("AI generated plan successfully, parsing...");
          const sanitized = replacePortugueseTerms(rawArguments);
          const parsed = JSON.parse(sanitized);
          if (Array.isArray(parsed.weeks) && parsed.weeks.length > 0) {
            weeks = parsed.weeks;
            console.log("AI plan adopted with", parsed.weeks.length, "weeks");
          }
        } else {
          console.log("AI returned no tool_calls, using profile-based fallback");
        }
      } else {
        console.log("AI gateway returned status:", gatewayResponse.status, await gatewayResponse.text());
      }
    }

    const sessions = weeks.flatMap((week: any) =>
      (week.sessions ?? []).map((session: any) => {
        const sessionType = canonicalSessionType(String(session.session_type ?? session.title ?? "Easy Run"));
        return {
          plan_id: PLAN_ID,
          user_id: userId,
          week_number: Number(week.week_number),
          day_of_week: Number(session.day_of_week),
          session_type: sessionType,
          title: canonicalSessionType(String(session.title ?? sessionType)),
          distance_km: session.distance_km == null ? null : Number(session.distance_km),
          target_pace: session.target_pace ?? null,
          description: session.notes ?? null,
        };
      })
    ).filter((session: any) => session.week_number >= 1 && session.week_number <= 8 && session.day_of_week >= 0 && session.day_of_week <= 6);

    await supabase.from("training_plans").upsert({
      id: PLAN_ID,
      name: "Performance Plan",
      level: profile?.fitness_level ?? "intermediate",
      total_weeks: 8,
    });

    await supabase.from("training_sessions").delete().eq("user_id", userId);
    const { error: insertError } = await supabase.from("training_sessions").insert(sessions);

    if (insertError) {
      throw insertError;
    }

    return new Response(JSON.stringify({ success: true, sessions_created: sessions.length, user_id: userId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-plan error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

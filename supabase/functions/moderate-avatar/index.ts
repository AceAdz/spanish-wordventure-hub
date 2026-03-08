import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!
    ).auth.getUser(token);

    if (authError || !user) throw new Error("Invalid token");

    // Get their profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("user_id", user.id)
      .single();

    if (!profile?.avatar_url) {
      return new Response(JSON.stringify({ safe: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the Google avatar and convert to base64
    const imgResponse = await fetch(profile.avatar_url);
    if (!imgResponse.ok) {
      return new Response(JSON.stringify({ safe: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const arrayBuffer = await imgResponse.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);

    // AI moderation
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ safe: true, warning: "No AI key" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a content moderation AI. Analyze this profile picture and determine if it is appropriate for a children's educational platform. Reject nudity, sexual content, violence, gore, hate symbols, drugs, weapons, or inappropriate content. Respond with ONLY: {"safe": true} or {"safe": false, "reason": "brief reason"}`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Is this profile picture appropriate?" },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } }
            ]
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      return new Response(JSON.stringify({ safe: true, warning: "AI unavailable" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    let isSafe = true;
    try {
      const jsonMatch = content.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        isSafe = result.safe === true;
      }
    } catch { /* default safe */ }

    // If unsafe, remove the avatar
    if (!isSafe) {
      await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("user_id", user.id);
    }

    return new Response(JSON.stringify({ safe: isSafe }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("moderate-avatar error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

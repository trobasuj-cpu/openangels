import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { investorName, investorIndustry, startupDescription } = await req.json()
    
    // Подключаемся к Supabase для проверки безопасности
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error("Missing Authorization header")
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error("Unauthorized: " + (authError?.message || "User not found"))
    }

    // Revolving Gemini API keys — read from Supabase secrets
    const keysRaw = Deno.env.get("GEMINI_API_KEYS") ?? "";
    const apiKeys = keysRaw.split(",").map(k => k.trim()).filter(k => k.length > 0);

    if (apiKeys.length === 0) {
      throw new Error("No API keys configured. Set GEMINI_API_KEYS in Supabase secrets.");
    }

    const prompt = `You are writing an email pitch to an angel investor.
Investor Name: ${investorName}
Investor Industry/Tags: ${(investorIndustry || []).join(', ')}

About my startup:
${startupDescription}

Write a concise, professional, and personalized cold email pitch to this investor. Do not use placeholders like [Your Name] and [Your Company Name], use the context provided in 'About my startup'. Keep it under 150 words.

IMPORTANT: You MUST respond with ONLY a valid JSON object in the following format:

{
  "subject": "Catchy and relevant email subject line",
  "body": "The full body of the email with paragraph breaks",
  "matched_industries": ["ai", "saas", "fintech"] // Array of up to 5 generic industry tags that best describe the startup
}
Do not include any markdown formatting like \`\`\`json or anything else, just the raw JSON object.`;

    // Try keys in random order until one works
    const shuffled = [...apiKeys].sort(() => Math.random() - 0.5);
    let data = null;
    let lastError = "All API keys exhausted";

    for (const key of shuffled) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const result = await response.json();

      if (response.ok) {
        data = result;
        break;
      }

      // If rate limited or quota exceeded, try next key
      const errMsg = result.error?.message || "";
      if (response.status === 429 || errMsg.toLowerCase().includes("quota") || errMsg.toLowerCase().includes("rate")) {
        lastError = errMsg;
        continue; // try next key
      }

      // For other errors, throw immediately
      throw new Error(errMsg || "Failed to generate email from AI");
    }

    if (!data) {
      throw new Error("All API keys hit rate limits. Please try again in a minute. (" + lastError + ")");
    }

    const responseText = data.candidates[0].content.parts[0].text;
    
    let parsedData = { subject: "Investment Opportunity", body: responseText, matched_industries: [] };
    try {
      // Cleanup potential markdown artifacts
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse JSON:", responseText);
    }

    return new Response(JSON.stringify(parsedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

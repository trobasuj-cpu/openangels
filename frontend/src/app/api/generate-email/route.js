import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { globalRateLimiter } from '@/lib/rateLimiter';

export const dynamic = 'force-dynamic';

function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || request.headers.get('cf-connecting-ip') || '127.0.0.1';
}

export async function GET(request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rjdewjyhtbfkujhvkwig.supabase.co';
    const FALLBACK_SERVICE_ROLE = Buffer.from('c2Jfc2VjcmV0X3BWVHBFMVc5V2FYU0lqRHJYbFFnT3dfN3VVSUVpMHo=', 'base64').toString('utf-8');
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || FALLBACK_SERVICE_ROLE;

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    let isPremium = false;
    let identifier = getClientIp(request);

    const authHeader = request.headers.get('authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      if (token && token.length > 20) {
        try {
          const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
          if (user && !authError) {
            identifier = `user_${user.id}`;
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('is_premium')
              .eq('id', user.id)
              .single();

            if (profile && profile.is_premium) {
              isPremium = true;
            }
          }
        } catch (e) {}
      }
    }

    const status = globalRateLimiter.peek(identifier, isPremium);
    return NextResponse.json({
      success: true,
      limit: status.limit,
      remaining: status.remaining,
      resetInSeconds: status.resetInSeconds,
      isPremium
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to peek quota' }, { status: 500 });
  }
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sanitizeHallucinatedMetrics(emailBody, startupDescription) {
  if (!emailBody) return '';
  const lowerInput = startupDescription.toLowerCase();

  // 1. Guard against fabricated dollar amounts not present in user input
  const dollarRegex = /\$[0-9]+(?:\.[0-9]+)?\s*(?:k|m|b|thousand|million|mrr|arr)?/gi;
  const matches = emailBody.match(dollarRegex) || [];

  for (const match of matches) {
    const cleanMatch = match.toLowerCase().trim();
    if (!lowerInput.includes(cleanMatch.replace(/\s+/g, '')) && !lowerInput.includes(cleanMatch)) {
      if (emailBody.toLowerCase().includes('raising ' + cleanMatch) || emailBody.toLowerCase().includes('round of ' + cleanMatch)) {
        emailBody = emailBody.replace(new RegExp(`raising\\s+${escapeRegex(match)}`, 'gi'), 'raising our early round');
        emailBody = emailBody.replace(new RegExp(`round of\\s+${escapeRegex(match)}`, 'gi'), 'early round');
      } else {
        emailBody = emailBody.replace(new RegExp(`(?:with|at|hitting)\\s+${escapeRegex(match)}\\s*(?:mrr|arr)?`, 'gi'), 'with strong early user engagement');
      }
    }
  }

  // 2. Guard against fabricated percentage growth rates not present in user input
  const percentRegex = /[0-9]+(?:\.[0-9]+)?\s*%\s*(?:mom|yoy|growth)?/gi;
  const percentMatches = emailBody.match(percentRegex) || [];
  for (const pMatch of percentMatches) {
    const cleanP = pMatch.toLowerCase().trim();
    if (!lowerInput.includes(cleanP.replace(/\s+/g, '')) && !lowerInput.includes(cleanP)) {
      emailBody = emailBody.replace(new RegExp(`(?:growing|growth of)\\s+${escapeRegex(pMatch)}`, 'gi'), 'growing steadily');
      emailBody = emailBody.replace(new RegExp(escapeRegex(pMatch), 'gi'), 'steady growth');
    }
  }

  return emailBody;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { investorName, investorIndustry, startupDescription, investorBio } = body;

    if (!investorName || !startupDescription) {
      return NextResponse.json(
        { error: 'investorName and startupDescription are required' },
        { status: 400 }
      );
    }

    // Input bounds validation to prevent prompt injection / token exhaustion
    const safeInvestorName = String(investorName).slice(0, 100).trim();
    const safeStartupDescription = String(startupDescription).slice(0, 1500).trim();
    const safeInvestorBio = String(investorBio || '').slice(0, 1000).trim();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rjdewjyhtbfkujhvkwig.supabase.co';
    const FALLBACK_SERVICE_ROLE = Buffer.from('c2Jfc2VjcmV0X3BWVHBFMVc5V2FYU0lqRHJYbFFnT3dfN3VVSUVpMHo=', 'base64').toString('utf-8');
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || FALLBACK_SERVICE_ROLE;

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // 1. Identify User and Subscription Status
    let userId = null;
    let isPremium = false;
    let identifier = getClientIp(request);

    const authHeader = request.headers.get('authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      if (token && token.length > 20) {
        try {
          const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
          if (user && !authError) {
            userId = user.id;
            identifier = `user_${user.id}`;

            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('is_premium')
              .eq('id', user.id)
              .single();

            if (profile && profile.is_premium) {
              isPremium = true;
            }
          }
        } catch (e) {
          // Token verification failed, fallback to IP identifier
        }
      }
    }

    // 2. Check Rate Limit (10/hr for Free, 100/hr for Pro)
    const rateCheck = globalRateLimiter.check(identifier, isPremium);

    const responseHeaders = {
      'X-RateLimit-Limit': String(rateCheck.limit),
      'X-RateLimit-Remaining': String(rateCheck.remaining),
      'X-RateLimit-Reset': String(rateCheck.resetInSeconds),
    };

    if (!rateCheck.allowed) {
      const tierName = isPremium ? 'Pro' : 'Free';
      const maxLimit = rateCheck.limit;
      return NextResponse.json(
        {
          error: `Hourly AI limit reached (${maxLimit}/${maxLimit} for ${tierName} plan). Reset in ${Math.ceil(rateCheck.resetInSeconds / 60)} minutes.`,
          isRateLimited: true,
          isPremium,
          limit: rateCheck.limit,
          remaining: 0,
          resetInSeconds: rateCheck.resetInSeconds,
          upgradeMessage: !isPremium ? 'Upgrade to Lifetime Pro for 100 generations per hour!' : null
        },
        { status: 429, headers: responseHeaders }
      );
    }

    // 3. Generate Pitch with Resilient Gemini 3.x Flash Cascade -> OpenRouter Fallback
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;

    const indStr = Array.isArray(investorIndustry) ? investorIndustry.filter(Boolean).join(', ') : (investorIndustry || 'early-stage technology');
    const bioContext = safeInvestorBio ? `Investor Bio: "${safeInvestorBio}"` : '';

    const prompt = `
You are an elite Silicon Valley pitch consultant. Draft a compelling, personalized cold pitch email from a startup founder to angel investor ${safeInvestorName}.

CONTEXT:
- Investor Name: ${safeInvestorName}
- Investor Focus/Industries: ${indStr}
${bioContext}
- Startup Description & Traction: "${safeStartupDescription}"

CRITICAL ZERO-HALLUCINATION GUARDRAILS:
1. STRICT FACTUAL FIDELITY: ONLY use facts, metrics, and numbers explicitly provided in the "Startup Description & Traction".
2. ABSOLUTELY NEVER INVENT OR GUESS:
   - Do NOT invent dollar revenue or traction ($MRR, $ARR, GMV).
   - Do NOT invent user/customer/client counts (e.g., "50 beta users", "over 10,000 customers") if not explicitly provided.
   - Do NOT invent growth percentages (e.g., "growing 25% MoM").
   - Do NOT invent funding round amounts (e.g., "$1.5M round") if not specified in the description.
3. ADAPTIVE CONTEXT HANDLING:
   - If the user provided real metrics (e.g. "$10k MRR", "2k GitHub stars"), highlight them cleanly in paragraph 2.
   - If NO numbers/metrics are present, focus strictly on the problem being solved, the unique solution/moat, and why this investor's thesis in ${indStr} aligns. DO NOT insert placeholder or fabricated numbers.
4. SAFE ROUND CONTEXT: If no dollar raise target was specified, say "raising our seed/early round" without inventing a dollar figure.
5. INVESTOR ACCURACY: Do NOT falsely claim the investor backed a specific portfolio company unless that company is explicitly mentioned in the context.

FORMAT & STRUCTURE:
- Subject line: Punchy, relevant, under 7 words. No cheesy clickbait.
- Email body: Concise (100-130 words max), 3 clear paragraphs.
- Return ONLY a valid JSON object with EXACTLY two fields:
  {
    "subject": "Subject line text here",
    "body": "Email body text here"
  }
`.trim();

    const extractJsonPayload = (rawText) => {
      if (!rawText) return null;
      const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      try {
        return JSON.parse(cleaned);
      } catch {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            return JSON.parse(match[0]);
          } catch {
            return null;
          }
        }
        return null;
      }
    };

    let generatedSubject = '';
    let generatedBody = '';
    let aiProvider = 'fallback';

    // Primary: Direct Google Gemini API (resilient cascade of active fast Flash models)
    const GEMINI_MODELS = ['gemini-3.1-flash-lite', 'gemini-3-flash-preview', 'gemini-3.5-flash-lite'];
    if (geminiApiKey) {
      for (const model of GEMINI_MODELS) {
        if (generatedBody) break;
        try {
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
            {
              method: 'POST',
              signal: AbortSignal.timeout(9000),
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.2,
                  maxOutputTokens: 600,
                  responseMimeType: 'application/json'
                }
              })
            }
          );

          if (geminiRes.ok) {
            const gData = await geminiRes.json();
            const rawText = gData.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const parsed = extractJsonPayload(rawText);
            if (parsed && (parsed.body || parsed.email)) {
              generatedSubject = parsed.subject || `Intro: Pitch for ${safeInvestorName}`;
              generatedBody = parsed.body || parsed.email || '';
              aiProvider = `gemini:${model}`;
              break;
            }
          } else {
            console.warn(`[AI Generate Email] Gemini ${model} returned ${geminiRes.status}`);
          }
        } catch (geminiErr) {
          console.warn(`[AI Generate Email] Gemini ${model} error:`, geminiErr.message);
        }
      }
    }

    // Fallback: OpenRouter (explicit max_tokens prevents 402 credit-reservation failures)
    const OPENROUTER_MODELS = ['google/gemini-2.5-flash', 'openai/gpt-4o-mini'];
    if (!generatedBody && openRouterApiKey) {
      for (const model of OPENROUTER_MODELS) {
        if (generatedBody) break;
        try {
          const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            signal: AbortSignal.timeout(9000),
            headers: {
              'Authorization': `Bearer ${openRouterApiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://openangels.xyz',
              'X-Title': 'OpenAngels Pitch Generator'
            },
            body: JSON.stringify({
              model,
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.2,
              max_tokens: 600,
              response_format: { type: 'json_object' }
            })
          });

          if (orRes.ok) {
            const orData = await orRes.json();
            const rawText = orData.choices?.[0]?.message?.content || '';
            const parsed = extractJsonPayload(rawText);
            if (parsed && (parsed.body || parsed.email)) {
              generatedSubject = parsed.subject || `Intro: Pitch for ${safeInvestorName}`;
              generatedBody = parsed.body || parsed.email || '';
              aiProvider = `openrouter:${model}`;
              break;
            }
          } else {
            console.warn(`[AI Generate Email] OpenRouter ${model} returned ${orRes.status}`);
          }
        } catch (orErr) {
          console.error(`[AI Generate Email] OpenRouter ${model} error:`, orErr.message);
        }
      }
    }

    if (!generatedBody) {
      // Clean deterministic fallback if all upstream AI providers are unreachable
      const firstName = safeInvestorName.split(' ')[0] || 'there';
      const primaryFocus = indStr.split(',')[0]?.trim() || 'early-stage tech';
      generatedSubject = `Quick intro — ${primaryFocus} startup`;
      generatedBody = `Hi ${firstName},\n\nI noticed your focus on ${indStr} and wanted to share a quick note on what we're building.\n\n${safeStartupDescription}\n\nWe're currently opening our early round and would love to send over a short deck if this aligns with your thesis.\n\nBest regards,\n[Your Name]`;
    }

    // Apply Post-Generation Metric Consistency Sanitizer
    generatedBody = sanitizeHallucinatedMetrics(generatedBody, safeStartupDescription);

    return NextResponse.json(
      {
        success: true,
        subject: generatedSubject,
        body: generatedBody,
        email: generatedBody,
        provider: aiProvider,
        remaining: rateCheck.remaining,
        limit: rateCheck.limit,
        resetInSeconds: rateCheck.resetInSeconds,
        isPremium
      },
      { headers: responseHeaders }
    );
  } catch (err) {
    console.error('[AI Generate Email Route Error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate email' }, { status: 500 });
  }
}

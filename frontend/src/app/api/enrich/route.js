import { NextResponse } from 'next/server';

const STANDARD_TAGS = [
    "ai", "saas", "fintech", "b2b", "b2c", "climate", "health", 
    "crypto", "web3", "creator-economy", "marketplace", "developer-tools",
    "deeptech", "ecommerce", "edtech", "hardware", "gaming"
];

export async function POST(request) {
    try {
        const { rawText } = await request.json();

        if (!rawText) {
            return NextResponse.json({ error: 'rawText is required' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
        }

        const prompt = `
You are a VC analyst building a database of INDIVIDUAL ANGEL INVESTORS and VENTURE CAPITALISTS (human people only).

From the following raw text, extract ALL individual people who are investors (angels, VCs, partners at funds, etc.).

CRITICAL RULES:
- Extract ONLY real human people. NEVER extract company names, fund names, or startup names as investors.
- If the text mentions a VC fund (e.g. "led by Lightspeed Venture Partners"), try to find the specific PARTNER name. If no individual name is given, skip that fund.
- If a person is a FOUNDER or CEO raising money (not investing), do NOT include them.
- If you cannot find ANY individual investor names in the text, return: {"investors": [], "no_investors": true}

Return a JSON object with key "investors" containing an array. Each element must have:
- "name": Full name of the person (string).
- "bio": A professional bio in 3rd person (2-3 sentences) describing them as an investor, mentioning the deal from the article if relevant. (string).
- "industries": Investment focus tags. Pick 1-4 from ONLY this list: ${JSON.stringify(STANDARD_TAGS)}. Default to ["saas"] if unclear.
- "location": City/country if mentioned, otherwise null.

Raw Text:
${rawText}
        `.trim();

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.2,
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API Error: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        // Clean markdown block if present
        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        let extractedJson;
        try {
            extractedJson = JSON.parse(cleanedText);
        } catch (e) {
            console.error("Failed to parse Gemini output:", cleanedText);
            throw new Error("Invalid JSON returned by Gemini");
        }

        return NextResponse.json(extractedJson);
    } catch (error) {
        console.error('Enrichment error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

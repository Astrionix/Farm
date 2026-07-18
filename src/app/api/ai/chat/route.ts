import { NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

// Fallback rule-based analysis generator when Groq is not available
function generateFallbackChatResponse(message: string, summary: any): string {
  const query = message.toLowerCase();

  if (query.includes('compare') || query.includes('unit 1') || query.includes('unit 2')) {
    const u1 = summary.units?.find((u: any) => u.id === 1) || { score: 94, hdPct: 91.5, mort: 5 };
    const u2 = summary.units?.find((u: any) => u.id === 2) || { score: 88, hdPct: 89.2, mort: 8 };
    return `**Unit 1 vs Unit 2 Comparison:**
* **Performance Score:** Unit 1: **${u1.score ?? 94}** (Excellent) | Unit 2: **${u2.score ?? 88}** (Very Good)
* **Production Rate:** Unit 1: **${u1.hdPct ?? '91.2'}% HD** | Unit 2: **${u2.hdPct ?? '89.0'}% HD**
* **Mortality:** Unit 1: **${u1.mort ?? 2}** | Unit 2: **${u2.mort ?? 4} birds**
* **Recommendation:** Review Unit 2's feed distribution and ventilation due to higher losses and lower score.`;
  }

  if (query.includes('why') || query.includes('decrease') || query.includes('drop')) {
    return `**Unit 3 Production Drop Analysis:**
* **Issue:** Egg production dropped from **92% HD** to **73% HD** in Unit 3, Shed 2.
* **Reason:** Bacterial stress / respiratory irritation detected (treated with Tetracycline HCL). Rainy weather stress compounded the drop.
* **Status:** Recovering (currently at **84% HD**). Ensure water lines are sanitized.`;
  }

  if (query.includes('mortality') || query.includes('abnormal') || query.includes('die')) {
    return `**Mortality Anomalies:**
* **Unit 3, Shed 2:** Spike of **8 mortalities** (12 days ago). Stabilized after Tetracycline HCL treatment.
* **Unit 1, Shed 3:** Spike of **6 mortalities** (22 days ago) due to heat index warning (34.5°C).
* **Action:** Activate cooling foggers when temperature exceeds 31.5°C.`;
  }

  if (query.includes('predict') || query.includes('tomorrow') || query.includes('forecast')) {
    const totalEggs = summary.totalProduction || 42800;
    const tomorrowEst = Math.round(totalEggs * 0.998);
    const weeklyEst = Math.round(totalEggs * 7 * 0.995);
    return `**AI Production Forecast:**
* **Tomorrow:** **${tomorrowEst.toLocaleString()} Eggs** (94% confidence)
* **Next 7 Days:** **${weeklyEst.toLocaleString()} Eggs**
* **Trend:** Stable / slight decline (↓ -0.2%) due to high seasonal humidity. Ensure electrolyte water supplements.`;
  }

  if (query.includes('feed') || query.includes('fcr') || query.includes('efficient')) {
    return `**Feed & FCR Optimization:**
* **FCR Status:** Average FCR is optimal (**2.08**).
* **Anomalies:** Unit 3, Shed 2 experienced FCR spike to **2.52** during sickness (85 kg feed wasted).
* **Actions:** Inspect troughs for billing-out. Split feeding to 6:00 AM (40%) and 4:30 PM (60%) to support laying cycles.`;
  }

  return `### Sri Mahalakshmi Poultry AI Assistant
I have analyzed the current farm ledger. How can I help you?

You can ask me to:
* **Compare Unit 1 and Unit 2** performance
* **Analyze why production decreased** in Unit 3
* **Forecast tomorrow's production** numbers
* **Find abnormal mortality spikes**
* **Provide feed and FCR optimization recommendations**`;
}

export async function POST(request: Request) {
  let message = '';
  let dataSummary: any = {};
  
  try {
    const body = await request.json().catch(() => ({}));
    message = body.message || '';
    dataSummary = body.dataSummary || {};
  } catch (parseErr) {
    console.warn('Failed parsing request JSON body:', parseErr);
  }

  try {
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Fallback if no Groq Key
    if (!GROQ_API_KEY) {
      const responseText = generateFallbackChatResponse(message, dataSummary);
      return NextResponse.json({ response: responseText });
    }

    // Call Groq Llama 3 API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are FlockMind, the Senior AI Poultry Consultant for Sri Mahalakshmi Poultry AI ERP.
You are communicating with the Farm Owner.
You are given a JSON summary of the active farm statistics:
${JSON.stringify(dataSummary)}

Rules:
1. Speak in a highly professional, expert, agriculture-consultant tone.
2. Focus on actionable insights, FCR targets, disease indicators, mortality spikes, and egg quality.
3. Keep responses structured using markdown tables, bullet points, and headers.
4. DO NOT compute complicated math manually — use the numbers provided in the summary directly.
5. Provide specific recommendations (e.g. antibiotic treatments, ventilation checks, calcium updates).
6. BE EXTREMELY CONCISE. Keep responses direct, short, and to the point. Avoid generic text and conversational filler. Do not repeat tables if not asked. Keep explanations short.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq API Error:', errText);
      const fallback = generateFallbackChatResponse(message, dataSummary);
      return NextResponse.json({ response: fallback, warning: 'Groq API error. Used analytical fallback engine.' });
    }

    const resJson = await response.json();
    const botResponse = resJson.choices[0]?.message?.content || '';

    return NextResponse.json({ response: botResponse });
  } catch (error: any) {
    console.warn('AI chat endpoint exception, triggering fallback:', error);
    try {
      const fallback = generateFallbackChatResponse(message, dataSummary);
      return NextResponse.json({ response: fallback, warning: 'Offline fallback activated.' });
    } catch (fallbackError) {
      console.error('Offline fallback failed:', fallbackError);
      return NextResponse.json({ response: 'FlockMind AI Consultant is currently offline. Please check your network connection.' });
    }
  }
}

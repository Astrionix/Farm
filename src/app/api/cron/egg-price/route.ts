import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

interface ScrapedPrice {
  zone: string;
  latestDay: number;
  ratePer100: number;
  pricePerEgg: number;
  yesterdayPricePerEgg: number;
  trayPrice: number;
  petiPrice: number;
  dailyPricesCount: number;
}

function parseZoneRate(html: string, targetZone: string = 'E.Godavari'): ScrapedPrice | null {
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let match;

  // Flexible zone regex to match E.Godavari, E. Godavari, East Godavari, etc.
  const zonePattern = new RegExp(targetZone.replace(/\./g, '\\.?\\s*').replace(/East/i, '(?:East|E\\.?)'), 'i');

  while ((match = trRegex.exec(html)) !== null) {
    const rowContent = match[1];
    if (zonePattern.test(rowContent) || rowContent.toLowerCase().includes('godavari')) {
      const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      const cells: string[] = [];
      let tdMatch;
      while ((tdMatch = tdRegex.exec(rowContent)) !== null) {
        const text = tdMatch[1].replace(/&nbsp;/gi, ' ').replace(/<[^>]+>/g, '').trim();
        cells.push(text);
      }

      // Calculate IST day of month
      const now = new Date();
      const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
      const currentDay = istTime.getUTCDate();

      const dailyPrices: { day: number; ratePer100: number }[] = [];
      for (let day = 1; day <= 31; day++) {
        const valStr = cells[day];
        if (valStr && valStr !== '-' && valStr !== '') {
          const val = parseFloat(valStr);
          if (!isNaN(val)) {
            dailyPrices.push({ day, ratePer100: val });
          }
        }
      }

      if (dailyPrices.length === 0) return null;

      // Find price on currentDay or the latest available day <= currentDay
      const availableUpToToday = dailyPrices.filter(p => p.day <= currentDay);
      const target = availableUpToToday.length > 0
        ? availableUpToToday[availableUpToToday.length - 1]
        : dailyPrices[dailyPrices.length - 1];

      const latestPricePer100 = target.ratePer100;
      const latestDay = target.day;

      // Determine yesterday's price
      const targetIdx = dailyPrices.findIndex(p => p.day === latestDay);
      let previousPricePer100 = latestPricePer100;
      if (targetIdx > 0) {
        previousPricePer100 = dailyPrices[targetIdx - 1].ratePer100;
      }

      const pricePerEgg = Number((latestPricePer100 / 100).toFixed(2));
      const yesterdayPricePerEgg = Number((previousPricePer100 / 100).toFixed(2));
      const trayPrice = Number((pricePerEgg * 30).toFixed(2));
      const petiPrice = Number((pricePerEgg * 210).toFixed(2));

      return {
        zone: targetZone,
        latestDay,
        ratePer100: latestPricePer100,
        pricePerEgg,
        yesterdayPricePerEgg,
        trayPrice,
        petiPrice,
        dailyPricesCount: dailyPrices.length,
      };
    }
  }

  return null;
}

export async function GET(request: Request) {
  return handleScrape(request);
}

export async function POST(request: Request) {
  return handleScrape(request);
}

async function handleScrape(request: Request) {
  const { searchParams } = new URL(request.url);
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}` && searchParams.get('secret') !== cronSecret) {
    // Allow if developer request or secret matches
  }

  try {
    const res = await fetch('https://www.e2necc.com/home/eggprice', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cache-Control': 'no-cache',
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `NECC website returned HTTP ${res.status}` },
        { status: 502 }
      );
    }

    const html = await res.text();
    const egResult = parseZoneRate(html, 'E.Godavari');

    if (!egResult) {
      return NextResponse.json(
        { success: false, error: 'Could not parse E.Godavari row from NECC table' },
        { status: 422 }
      );
    }

    // Update Supabase egg_prices
    let supabaseUpdated = false;
    let dbError = null;

    if (SUPABASE_URL && SUPABASE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

      const regionsToUpdate = ['East Godavari'];
      for (const region of regionsToUpdate) {
        const { error } = await supabase
          .from('egg_prices')
          .upsert(
            {
              region,
              price: egResult.pricePerEgg,
              yesterday_price: egResult.yesterdayPricePerEgg,
              tray_price: egResult.trayPrice,
              peti_price: egResult.petiPrice,
              source: 'NECC Official (E.Godavari)',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'region' }
          );

        if (error) {
          dbError = error.message;
        } else {
          supabaseUpdated = true;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        region: 'East Godavari',
        zone: egResult.zone,
        dayOfMonth: egResult.latestDay,
        ratePer100Eggs: egResult.ratePer100,
        pricePerEgg: egResult.pricePerEgg,
        yesterdayPricePerEgg: egResult.yesterdayPricePerEgg,
        trayPrice: egResult.trayPrice,
        petiPrice: egResult.petiPrice,
        source: 'NECC Official (e2necc.com)',
        scrapedAt: new Date().toISOString(),
        supabaseUpdated,
        dbError,
      },
    });
  } catch (err: any) {
    console.error('[NECC Scraper Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal scraper error' },
      { status: 500 }
    );
  }
}

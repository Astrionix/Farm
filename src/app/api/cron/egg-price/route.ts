import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

// Primary Scraper: KisanDeals E.Godavari (kisandeals.com)
function parseKisanDeals(html: string): ScrapedPrice | null {
  try {
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let match;
    const scrapedRows: { dateStr: string; ratePer100: number; pricePerEgg: number }[] = [];

    while ((match = rowRegex.exec(html)) !== null) {
      const rowContent = match[1];
      if (/\d{2}\/\d{2}\/\d{4}/.test(rowContent)) {
        const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
        const cells: string[] = [];
        let tdMatch;
        while ((tdMatch = tdRegex.exec(rowContent)) !== null) {
          const text = tdMatch[1].replace(/<[^>]+>/g, '').replace(/₹/g, '').trim();
          cells.push(text);
        }

        if (cells.length >= 3) {
          const dateStr = cells[0];
          const rate100 = parseFloat(cells[1]);
          const perEgg = parseFloat(cells[2]);

          if (!isNaN(rate100) && rate100 > 0) {
            scrapedRows.push({
              dateStr,
              ratePer100: rate100,
              pricePerEgg: !isNaN(perEgg) && perEgg > 0 ? perEgg : Number((rate100 / 100).toFixed(2)),
            });
          }
        }
      }
    }

    if (scrapedRows.length > 0) {
      const todayEntry = scrapedRows[0];
      const yesterdayEntry = scrapedRows.length > 1 ? scrapedRows[1] : todayEntry;

      const latestPricePer100 = todayEntry.ratePer100;
      const pricePerEgg = todayEntry.pricePerEgg;
      const yesterdayPricePerEgg = yesterdayEntry.pricePerEgg;
      const trayPrice = Number((pricePerEgg * 30).toFixed(2));
      const petiPrice = Number((pricePerEgg * 210).toFixed(2));

      const now = new Date();
      const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));

      return {
        zone: 'East Godavari',
        latestDay: istTime.getUTCDate(),
        ratePer100: latestPricePer100,
        pricePerEgg,
        yesterdayPricePerEgg,
        trayPrice,
        petiPrice,
        dailyPricesCount: scrapedRows.length,
      };
    }
  } catch (e) {
    console.warn('Error in parseKisanDeals:', e);
  }
  return null;
}

// Backup Scraper 1: Official NECC Portal (e2necc.com)
function parseNECCZoneRate(html: string, targetZone: string = 'E.Godavari'): ScrapedPrice | null {
  try {
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let match;
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

        const now = new Date();
        const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
        const currentDay = istTime.getUTCDate();

        const dailyPrices: { day: number; ratePer100: number }[] = [];
        for (let day = 1; day <= 31; day++) {
          const valStr = cells[day];
          if (valStr && valStr !== '-' && valStr !== '') {
            const val = parseFloat(valStr);
            if (!isNaN(val)) dailyPrices.push({ day, ratePer100: val });
          }
        }

        if (dailyPrices.length === 0) return null;

        const availableUpToToday = dailyPrices.filter(p => p.day <= currentDay);
        const target = availableUpToToday.length > 0
          ? availableUpToToday[availableUpToToday.length - 1]
          : dailyPrices[dailyPrices.length - 1];

        const latestPricePer100 = target.ratePer100;
        const latestDay = target.day;

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
  } catch (e) {
    console.warn('Error in parseNECCZoneRate:', e);
  }
  return null;
}

// Backup Scraper 2: EggRateLab Portal (eggratelab.com)
function parseEggRateLab(html: string): ScrapedPrice | null {
  try {
    const rowMatch = html.match(/E-Godavari[\s\S]*?<\/tr>/i) || html.match(/Godavari[\s\S]*?<\/tr>/i);
    if (!rowMatch) return null;

    const cells: string[] = [];
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let m;
    while ((m = tdRegex.exec(rowMatch[0])) !== null) {
      const txt = m[1].replace(/<[^>]+>/g, '').replace(/₹/g, '').trim();
      if (txt) cells.push(txt);
    }

    if (cells.length >= 4) {
      const pricePerEgg = parseFloat(cells[0]);
      const trayPrice = parseFloat(cells[1]);
      const ratePer100 = parseFloat(cells[2]);
      const petiPrice = parseFloat(cells[3]);

      if (!isNaN(pricePerEgg) && pricePerEgg > 0) {
        const now = new Date();
        const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
        return {
          zone: 'East Godavari',
          latestDay: istTime.getUTCDate(),
          ratePer100,
          pricePerEgg,
          yesterdayPricePerEgg: pricePerEgg,
          trayPrice,
          petiPrice,
          dailyPricesCount: 1,
        };
      }
    }
  } catch (e) {
    console.warn('Error in parseEggRateLab:', e);
  }
  return null;
}

export async function GET(_request: NextRequest) {
  return handleScrape();
}

export async function POST(_request: NextRequest) {
  return handleScrape();
}

async function handleScrape() {
  try {
    let scrapedResult: ScrapedPrice | null = null;
    let sourceName = 'KisanDeals (E.Godavari NECC)';

    // Source 1 (PRIMARY): Try kisandeals.com (E.Godavari page)
    try {
      const res = await fetch('https://www.kisandeals.com/egg-rate/andhra-pradesh/e.godavari', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Cache-Control': 'no-cache',
        },
        cache: 'no-store',
      });

      if (res.ok) {
        const html = await res.text();
        scrapedResult = parseKisanDeals(html);
      }
    } catch (e) {
      console.warn('[Scraper 1 Primary Warn]: kisandeals.com unreachable, trying e2necc...', e);
    }

    // Source 2 (BACKUP): Try e2necc.com
    if (!scrapedResult) {
      try {
        const res = await fetch('https://www.e2necc.com/home/eggprice', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Cache-Control': 'no-cache',
          },
          cache: 'no-store',
        });

        if (res.ok) {
          const html = await res.text();
          scrapedResult = parseNECCZoneRate(html, 'E.Godavari');
          if (scrapedResult) {
            sourceName = 'NECC Official (e2necc.com)';
          }
        }
      } catch (e) {
        console.warn('[Scraper 2 Warn]: e2necc.com unreachable...', e);
      }
    }

    // Source 3 (BACKUP): Try eggratelab.com
    if (!scrapedResult) {
      try {
        const res = await fetch('https://eggratelab.com', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Cache-Control': 'no-cache',
          },
          cache: 'no-store',
        });

        if (res.ok) {
          const html = await res.text();
          scrapedResult = parseEggRateLab(html);
          if (scrapedResult) {
            sourceName = 'EggRateLab (NECC E.Godavari)';
          }
        }
      } catch (e) {
        console.warn('[Scraper 3 Warn]: eggratelab.com unreachable...', e);
      }
    }

    // If live rate was scraped from any source, update Supabase
    if (scrapedResult) {
      let supabaseUpdated = false;
      let dbError = null;

      if (SUPABASE_URL && SUPABASE_KEY) {
        try {
          const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
          const { error } = await supabase
            .from('egg_prices')
            .upsert(
              {
                region: 'East Godavari',
                price: scrapedResult.pricePerEgg,
                yesterday_price: scrapedResult.yesterdayPricePerEgg,
                tray_price: scrapedResult.trayPrice,
                peti_price: scrapedResult.petiPrice,
                source: sourceName,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'region' }
            );

          if (error) {
            dbError = error.message;
          } else {
            supabaseUpdated = true;
          }
        } catch (dbErr: any) {
          dbError = dbErr.message;
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          region: 'East Godavari',
          zone: scrapedResult.zone,
          dayOfMonth: scrapedResult.latestDay,
          ratePer100Eggs: scrapedResult.ratePer100,
          pricePerEgg: scrapedResult.pricePerEgg,
          yesterdayPricePerEgg: scrapedResult.yesterdayPricePerEgg,
          trayPrice: scrapedResult.trayPrice,
          petiPrice: scrapedResult.petiPrice,
          source: sourceName,
          scrapedAt: new Date().toISOString(),
          supabaseUpdated,
          dbError,
        },
      });
    }

    // Source 4 (DATABASE FALLBACK): Read latest stored rate from Supabase
    if (SUPABASE_URL && SUPABASE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      const { data } = await supabase
        .from('egg_prices')
        .select('*')
        .eq('region', 'East Godavari')
        .limit(1);

      if (data && data.length > 0) {
        const row = data[0];
        const p = Number(row.price);
        return NextResponse.json({
          success: true,
          data: {
            region: 'East Godavari',
            pricePerEgg: p,
            yesterdayPricePerEgg: Number(row.yesterday_price) || p,
            trayPrice: Number(row.tray_price) || Number((p * 30).toFixed(2)),
            petiPrice: Number(row.peti_price) || Number((p * 210).toFixed(2)),
            source: row.source || 'KisanDeals (E.Godavari NECC)',
            scrapedAt: row.updated_at,
            fallback: true,
          },
        });
      }
    }

    // Source 5 (FINAL STATIC FALLBACK)
    return NextResponse.json({
      success: true,
      data: {
        region: 'East Godavari',
        pricePerEgg: 5.65,
        yesterdayPricePerEgg: 6.05,
        trayPrice: 169.5,
        petiPrice: 1186.5,
        source: 'KisanDeals (E.Godavari NECC)',
        scrapedAt: new Date().toISOString(),
        fallback: true,
      },
    });
  } catch (err: any) {
    console.error('[NECC Scraper Error]:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Internal scraper error',
    });
  }
}

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Junk filter lists ───
const JUNK_PATTERNS = [
  /\blot\b/i, /\blots\b/i, /\bbundle\b/i, /\bplayset\b/i,
  /\bx2\b/i, /\bx3\b/i, /\bx4\b/i, /\bproxy\b/i, /\bfake\b/i,
  /\breplica\b/i, /\bcustom\b/i, /\bfan art\b/i, /\bdeck box\b/i,
  /\bsleeves?\b/i, /\bmat\b/i, /\bbooster box\b/i, /\bbooster pack\b/i,
  /\bpack\b/i, /\bstarter deck\b/i, /\bcase\b/i, /\bbinder\b/i,
  /\bcollection\b/i,
];
const RAW_EXCLUDE = [/\bPSA\b/i, /\bBGS\b/i, /\bCGC\b/i, /\bSGC\b/i, /\bBeckett\b/i, /\bgraded\b/i, /\bslab\b/i];
const PSA10_EXCLUDE = [/\bPSA\s*9\b/i, /\bPSA\s*8\b/i, /\bBGS\b/i, /\bCGC\b/i, /\bSGC\b/i];
const PSA10_REQUIRE = /\bPSA\s*10\b/i;

// ─── Parsers ───
const CARD_NUMBER_RE = /\b(OP\d{2}-\d{3}|ST\d{2}-\d{3}|EB\d{2}-\d{3}|P-\d{3})\b/i;

function parseCardNumber(title: string): string | null {
  const m = title.match(CARD_NUMBER_RE);
  return m ? m[1].toUpperCase() : null;
}

function parseGrade(title: string): { isGraded: boolean; grader: string | null; gradeValue: string | null; listingType: "raw" | "psa10" | null } {
  if (PSA10_REQUIRE.test(title)) return { isGraded: true, grader: "PSA", gradeValue: "10", listingType: "psa10" };
  if (/\bPSA\b/i.test(title)) return { isGraded: true, grader: "PSA", gradeValue: null, listingType: null };
  if (/\bBGS\b/i.test(title)) return { isGraded: true, grader: "BGS", gradeValue: null, listingType: null };
  if (/\bCGC\b/i.test(title)) return { isGraded: true, grader: "CGC", gradeValue: null, listingType: null };
  if (/\bSGC\b/i.test(title)) return { isGraded: true, grader: "SGC", gradeValue: null, listingType: null };
  return { isGraded: false, grader: null, gradeValue: null, listingType: "raw" };
}

function detectLanguage(title: string): string | null {
  if (/\b(japanese|jp|jpn)\b/i.test(title)) return "JP";
  if (/\b(english|en|eng)\b/i.test(title)) return "EN";
  return null;
}

function parseVariant(title: string): string | null {
  if (/\balt\s*art\b/i.test(title)) return "alt art";
  if (/\bmanga\b/i.test(title)) return "manga";
  if (/\bparallel\b/i.test(title)) return "parallel";
  if (/\b(SP)\b/.test(title)) return "SP";
  if (/\b(SEC)\b/i.test(title)) return "SEC";
  if (/\bleader\b/i.test(title)) return "leader";
  if (/\bpromo\b/i.test(title)) return "promo";
  if (/\banniversary\b/i.test(title)) return "anniversary";
  return null;
}

const SET_RE = /\b(OP-?\d{2}|ST-?\d{2}|EB-?\d{2}|Romance Dawn|Paramount War|Pillars of Strength|Kingdoms of Intrigue|Awakening of the New Era|Wings of the Captain|500 Years|Two Legends|Memorial Collection)\b/i;
function parseSetName(title: string): string | null {
  const m = title.match(SET_RE);
  return m ? m[1] : null;
}

// One Piece character extraction — look for known patterns after removing noise
const CHARACTER_RE = /(?:Monkey\s*D\.?\s*Luffy|Luffy|Roronoa\s*Zoro|Zoro|Nami|Sanji|Nico\s*Robin|Robin|Franky|Brook|Jinbe|Chopper|Usopp|Shanks|Yamato|Uta|Sabo|Ace|Portgas|Kaido|Big\s*Mom|Trafalgar|Law|Kid|Eustass|Boa\s*Hancock|Hancock|Doflamingo|Crocodile|Mihawk|Whitebeard|Buggy|Blackbeard|Teach|Akainu|Aokiji|Kizaru|Garp|Koby|Smoker|Vivi|Carrot|Perona|Katakuri|Marco|Newgate|Roger|Rayleigh)/i;

function parseCharacter(title: string): string | null {
  const m = title.match(CHARACTER_RE);
  return m ? m[0].trim() : null;
}

function buildNormalizedCardKey(parsed: {
  cardNumber: string | null;
  character: string | null;
  setName: string | null;
  language: string | null;
  variant: string | null;
}): string | null {
  if (!parsed.cardNumber) return null;
  const parts = [
    "onepiece",
    parsed.cardNumber,
    (parsed.character || "unknown").toLowerCase().replace(/\s+/g, "_"),
    (parsed.setName || "unknown").toLowerCase().replace(/\s+/g, "_"),
    (parsed.language || "unknown").toLowerCase(),
    (parsed.variant || "base").toLowerCase().replace(/\s+/g, "_"),
  ];
  return parts.join("|");
}

function isJunk(title: string): boolean {
  return JUNK_PATTERNS.some((p) => p.test(title));
}

function isRawExcluded(title: string): boolean {
  return RAW_EXCLUDE.some((p) => p.test(title));
}

function isPsa10Excluded(title: string): boolean {
  return PSA10_EXCLUDE.some((p) => p.test(title));
}

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function computeConfidence(
  rawListings: Array<{ normalized_card_key: string | null; language_detected: string | null; parsed_variant: string | null; parsed_set_name: string | null }>,
  psaListings: Array<{ normalized_card_key: string | null; language_detected: string | null; parsed_variant: string | null; parsed_set_name: string | null }>
): "high" | "medium" | "low" {
  if (!rawListings.length || !psaListings.length) return "low";

  const rawLangs = new Set(rawListings.map((l) => l.language_detected).filter(Boolean));
  const psaLangs = new Set(psaListings.map((l) => l.language_detected).filter(Boolean));
  const langConflict = rawLangs.size > 0 && psaLangs.size > 0 && ![...rawLangs].some((l) => psaLangs.has(l));

  const rawVariants = new Set(rawListings.map((l) => l.parsed_variant).filter(Boolean));
  const psaVariants = new Set(psaListings.map((l) => l.parsed_variant).filter(Boolean));
  const variantConflict = rawVariants.size > 0 && psaVariants.size > 0 && ![...rawVariants].some((v) => psaVariants.has(v));

  const rawSets = new Set(rawListings.map((l) => l.parsed_set_name).filter(Boolean));
  const psaSets = new Set(psaListings.map((l) => l.parsed_set_name).filter(Boolean));
  const setConflict = rawSets.size > 0 && psaSets.size > 0 && ![...rawSets].some((s) => psaSets.has(s));

  if (langConflict || variantConflict || setConflict) return "low";

  // Check for missing metadata
  const allHaveCardNum = [...rawListings, ...psaListings].every((l) => l.normalized_card_key);
  if (!allHaveCardNum) return "medium";

  return "high";
}

// ─── Main handler ───
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const action = body.action || "ingest";

    if (action === "ingest") {
      // Accept listings from the caller (the admin UI will send scraped/fetched listings)
      const listings: Array<{
        ebay_item_id?: string;
        title: string;
        listing_url?: string;
        sold_price_usd?: number;
        sold_date?: string;
        image_url?: string;
        condition_text?: string;
        search_type: "raw" | "psa10";
      }> = body.listings || [];

      if (!listings.length) {
        return new Response(JSON.stringify({ error: "No listings provided" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const parsed: Array<Record<string, unknown>> = [];

      for (const listing of listings) {
        const title = listing.title;
        const junk = isJunk(title);

        let listingType: "raw" | "psa10" | null = listing.search_type;
        const grade = parseGrade(title);

        // Validate listing type matches search intent
        if (listing.search_type === "raw" && isRawExcluded(title)) {
          continue; // skip graded listings from raw search
        }
        if (listing.search_type === "psa10") {
          if (!PSA10_REQUIRE.test(title)) continue; // must actually be PSA 10
          if (isPsa10Excluded(title)) continue;
          listingType = "psa10";
        }

        const cardNumber = parseCardNumber(title);
        const character = parseCharacter(title);
        const setName = parseSetName(title);
        const variant = parseVariant(title);
        const language = detectLanguage(title);

        const normalizedKey = buildNormalizedCardKey({ cardNumber, character, setName, language, variant });

        parsed.push({
          ebay_item_id: listing.ebay_item_id || null,
          title,
          listing_url: listing.listing_url || null,
          sold_price_usd: listing.sold_price_usd ?? null,
          sold_date: listing.sold_date || null,
          image_url: listing.image_url || null,
          condition_text: listing.condition_text || null,
          is_graded: grade.isGraded,
          grader: grade.grader,
          grade_value: grade.gradeValue,
          listing_type: listingType,
          game: "onepiece",
          parsed_character: character,
          parsed_card_number: cardNumber,
          parsed_set_name: setName,
          parsed_rarity: null,
          parsed_variant: variant,
          language_detected: language,
          normalized_card_key: normalizedKey,
          parse_confidence: cardNumber ? "high" : "low",
          junk_flag: junk,
          outlier_flag: false,
        });
      }

      // Upsert into ebay_listing_cache
      if (parsed.length) {
        const { error: insertErr } = await supabase
          .from("ebay_listing_cache")
          .upsert(parsed, { onConflict: "id" });
        if (insertErr) {
          console.error("Insert error:", insertErr);
        }
      }

      return new Response(
        JSON.stringify({ inserted: parsed.length, skipped: listings.length - parsed.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "group") {
      // Group cached listings into onepiece_card_market
      const { data: allListings, error: fetchErr } = await supabase
        .from("ebay_listing_cache")
        .select("*")
        .eq("game", "onepiece")
        .eq("junk_flag", false)
        .not("normalized_card_key", "is", null);

      if (fetchErr) {
        return new Response(JSON.stringify({ error: fetchErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Group by normalized_card_key
      const groups = new Map<string, typeof allListings>();
      for (const l of allListings || []) {
        const key = l.normalized_card_key!;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(l);
      }

      const upsertRows: Array<Record<string, unknown>> = [];

      for (const [key, listings] of groups) {
        const rawListings = listings.filter((l: Record<string, unknown>) => l.listing_type === "raw" && !l.outlier_flag);
        const psaListings = listings.filter((l: Record<string, unknown>) => l.listing_type === "psa10" && !l.outlier_flag);

        const rawPrices = rawListings.map((l: Record<string, unknown>) => l.sold_price_usd as number).filter((p: number) => p > 0);
        const psaPrices = psaListings.map((l: Record<string, unknown>) => l.sold_price_usd as number).filter((p: number) => p > 0);

        const rawAvg = avg(rawPrices);
        const rawMed = median(rawPrices);
        const psaAvg = avg(psaPrices);
        const psaMed = median(psaPrices);

        const spread = psaAvg > 0 && rawAvg > 0 ? psaAvg - rawAvg : null;
        const mult = rawAvg > 0 ? psaAvg / rawAvg : null;

        const confidence = computeConfidence(rawListings as any, psaListings as any);

        // Take identity from first listing with data
        const sample = listings[0];

        upsertRows.push({
          normalized_card_key: key,
          game: "onepiece",
          character: sample.parsed_character,
          card_number: sample.parsed_card_number,
          set_name: sample.parsed_set_name,
          rarity: sample.parsed_rarity,
          variant: sample.parsed_variant,
          language: sample.language_detected,
          raw_avg_price_usd: rawPrices.length ? Number(rawAvg.toFixed(2)) : null,
          raw_median_price_usd: rawPrices.length ? Number(rawMed.toFixed(2)) : null,
          raw_sale_count: rawPrices.length,
          raw_prices_usd: rawPrices.map((p: number) => p.toFixed(2)),
          raw_sold_dates: rawListings.map((l: Record<string, unknown>) => l.sold_date || "").filter(Boolean),
          raw_source_urls: rawListings.map((l: Record<string, unknown>) => l.listing_url || "").filter(Boolean),
          psa10_avg_price_usd: psaPrices.length ? Number(psaAvg.toFixed(2)) : null,
          psa10_median_price_usd: psaPrices.length ? Number(psaMed.toFixed(2)) : null,
          psa10_sale_count: psaPrices.length,
          psa10_prices_usd: psaPrices.map((p: number) => p.toFixed(2)),
          psa10_sold_dates: psaListings.map((l: Record<string, unknown>) => l.sold_date || "").filter(Boolean),
          psa10_source_urls: psaListings.map((l: Record<string, unknown>) => l.listing_url || "").filter(Boolean),
          price_spread_usd: spread !== null ? Number(spread.toFixed(2)) : null,
          multiple: mult !== null ? Number(mult.toFixed(2)) : null,
          match_confidence: confidence,
          notes: null,
          last_updated_at: new Date().toISOString(),
        });
      }

      if (upsertRows.length) {
        const { error: upsertErr } = await supabase
          .from("onepiece_card_market")
          .upsert(upsertRows, { onConflict: "normalized_card_key" });
        if (upsertErr) {
          return new Response(JSON.stringify({ error: upsertErr.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      return new Response(
        JSON.stringify({ grouped: upsertRows.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Ingest error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

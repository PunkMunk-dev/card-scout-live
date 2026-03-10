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

const CHARACTER_RE = /(?:Monkey\s*D\.?\s*Luffy|Luffy|Roronoa\s*Zoro|Zoro|Nami|Sanji|Nico\s*Robin|Robin|Franky|Brook|Jinbe|Chopper|Usopp|Shanks|Yamato|Uta|Sabo|Ace|Portgas|Kaido|Big\s*Mom|Trafalgar|Law|Kid|Eustass|Boa\s*Hancock|Hancock|Doflamingo|Crocodile|Mihawk|Whitebeard|Buggy|Blackbeard|Teach|Akainu|Aokiji|Kizaru|Garp|Koby|Smoker|Vivi|Carrot|Perona|Katakuri|Marco|Newgate|Roger|Rayleigh)/i;

const CHARACTER_ALIASES: Record<string, string> = {
  "luffy": "Monkey D. Luffy",
  "monkey d. luffy": "Monkey D. Luffy",
  "monkey d luffy": "Monkey D. Luffy",
  "zoro": "Roronoa Zoro",
  "roronoa zoro": "Roronoa Zoro",
  "robin": "Nico Robin",
  "nico robin": "Nico Robin",
  "ace": "Portgas D. Ace",
  "portgas": "Portgas D. Ace",
  "law": "Trafalgar Law",
  "trafalgar": "Trafalgar Law",
  "hancock": "Boa Hancock",
  "boa hancock": "Boa Hancock",
  "kid": "Eustass Kid",
  "eustass": "Eustass Kid",
  "whitebeard": "Edward Newgate",
  "newgate": "Edward Newgate",
  "blackbeard": "Marshall D. Teach",
  "teach": "Marshall D. Teach",
  "roger": "Gol D. Roger",
  "big mom": "Big Mom",
};

function parseCharacter(title: string): string | null {
  const m = title.match(CHARACTER_RE);
  if (!m) return null;
  const raw = m[0].trim().toLowerCase();
  return CHARACTER_ALIASES[raw] || m[0].trim();
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

  const allHaveCardNum = [...rawListings, ...psaListings].every((l) => l.normalized_card_key);
  if (!allHaveCardNum) return "medium";

  return "high";
}

// ─── Seed data ───
const SEED_LISTINGS = [
  // OP01-001 Luffy EN base — 2 raw + 2 PSA 10
  { title: "One Piece TCG OP01-001 Monkey D. Luffy Romance Dawn EN", sold_price_usd: 8, sold_date: "2026-03-01T12:00:00Z", search_type: "raw" as const, ebay_item_id: "seed-raw-001a" },
  { title: "OP01-001 Luffy One Piece Card Game English", sold_price_usd: 10, sold_date: "2026-03-03T14:00:00Z", search_type: "raw" as const, ebay_item_id: "seed-raw-001b" },
  { title: "PSA 10 OP01-001 Monkey D. Luffy Romance Dawn EN One Piece", sold_price_usd: 45, sold_date: "2026-03-02T10:00:00Z", search_type: "psa10" as const, ebay_item_id: "seed-psa-001a" },
  { title: "One Piece OP01-001 Luffy PSA 10 Gem Mint English", sold_price_usd: 50, sold_date: "2026-03-04T16:00:00Z", search_type: "psa10" as const, ebay_item_id: "seed-psa-001b" },
  // OP05-119 Shanks JP alt art — 2 raw + 1 PSA 10
  { title: "OP05-119 Shanks Alt Art JP One Piece Awakening of the New Era", sold_price_usd: 25, sold_date: "2026-03-01T09:00:00Z", search_type: "raw" as const, ebay_item_id: "seed-raw-119a" },
  { title: "One Piece OP05-119 Shanks Alt Art Japanese", sold_price_usd: 30, sold_date: "2026-03-02T11:00:00Z", search_type: "raw" as const, ebay_item_id: "seed-raw-119b" },
  { title: "PSA 10 OP05-119 Shanks Alt Art Japanese One Piece", sold_price_usd: 120, sold_date: "2026-03-03T13:00:00Z", search_type: "psa10" as const, ebay_item_id: "seed-psa-119a" },
  // ST21-014 Zoro EN base — 2 raw + 1 PSA 10
  { title: "ST21-014 Roronoa Zoro One Piece Starter Deck English", sold_price_usd: 5, sold_date: "2026-03-01T08:00:00Z", search_type: "raw" as const, ebay_item_id: "seed-raw-014a" },
  { title: "One Piece ST21-014 Zoro EN Card", sold_price_usd: 6, sold_date: "2026-03-02T15:00:00Z", search_type: "raw" as const, ebay_item_id: "seed-raw-014b" },
  { title: "PSA 10 ST21-014 Roronoa Zoro One Piece English", sold_price_usd: 35, sold_date: "2026-03-04T10:00:00Z", search_type: "psa10" as const, ebay_item_id: "seed-psa-014a" },
];

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

    // ─── SEED: insert hardcoded test data ───
    if (action === "seed") {
      // Process seed listings through the same parsing pipeline
      const parsed: Array<Record<string, unknown>> = [];

      for (const listing of SEED_LISTINGS) {
        const title = listing.title;
        const junk = isJunk(title);
        const grade = parseGrade(title);

        if (listing.search_type === "raw" && isRawExcluded(title)) continue;
        if (listing.search_type === "psa10") {
          if (!PSA10_REQUIRE.test(title)) continue;
          if (isPsa10Excluded(title)) continue;
        }

        const cardNumber = parseCardNumber(title);
        const character = parseCharacter(title);
        const setName = parseSetName(title);
        const variant = parseVariant(title);
        const language = detectLanguage(title);
        const normalizedKey = buildNormalizedCardKey({ cardNumber, character, setName, language, variant });

        parsed.push({
          ebay_item_id: listing.ebay_item_id,
          title,
          listing_url: `https://www.ebay.com/itm/${listing.ebay_item_id}`,
          sold_price_usd: listing.sold_price_usd,
          sold_date: listing.sold_date,
          image_url: null,
          condition_text: null,
          is_graded: grade.isGraded,
          grader: grade.grader,
          grade_value: grade.gradeValue,
          listing_type: listing.search_type,
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

      console.log(`Seed: parsed ${parsed.length} listings`);

      if (parsed.length) {
        // Delete old seed data first, then insert fresh
        await supabase
          .from("ebay_listing_cache")
          .delete()
          .like("ebay_item_id", "seed-%");

        const { error: insertErr } = await supabase
          .from("ebay_listing_cache")
          .insert(parsed);
        if (insertErr) {
          console.error("Seed insert error:", insertErr);
          return new Response(JSON.stringify({ error: insertErr.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      return new Response(
        JSON.stringify({ action: "seed", inserted: parsed.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── COUNTS: return table row counts ───
    if (action === "counts") {
      const { count: cacheCount } = await supabase
        .from("ebay_listing_cache")
        .select("*", { count: "exact", head: true })
        .eq("game", "onepiece");

      const { count: groupedCount } = await supabase
        .from("onepiece_card_market")
        .select("*", { count: "exact", head: true });

      return new Response(
        JSON.stringify({ cacheCount: cacheCount || 0, groupedCount: groupedCount || 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── FETCH: pull live sold listings from eBay ───
    if (action === "fetch") {
      const ebayAppId = Deno.env.get("EBAY_CLIENT_ID");
      if (!ebayAppId) {
        return new Response(JSON.stringify({ error: "EBAY_CLIENT_ID not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const searchType: "raw" | "psa10" | "both" = body.searchType || "both";
      const defaultRawQueries = ["One Piece TCG card -lot -bundle -PSA -BGS -CGC -SGC -graded -slab"];
      const defaultPsa10Queries = ["One Piece TCG PSA 10 card -lot -bundle -BGS -CGC -SGC"];
      const rawQueries: string[] = searchType !== "psa10" ? (body.rawQueries || defaultRawQueries) : [];
      const psa10Queries: string[] = searchType !== "raw" ? (body.psa10Queries || defaultPsa10Queries) : [];

      let fetched = 0;
      let parsedCount = 0;
      let inserted = 0;
      let skipped = 0;
      const errors: string[] = [];

      async function fetchEbayCompleted(keywords: string, listingType: "raw" | "psa10") {
        const url = new URL("https://svcs.ebay.com/services/search/FindingService/v1");
        url.searchParams.set("OPERATION-NAME", "findCompletedItems");
        url.searchParams.set("SERVICE-VERSION", "1.0.0");
        url.searchParams.set("SECURITY-APPNAME", ebayAppId!);
        url.searchParams.set("RESPONSE-DATA-FORMAT", "JSON");
        url.searchParams.set("REST-PAYLOAD", "");
        url.searchParams.set("keywords", keywords);
        url.searchParams.set("categoryId", "212");
        url.searchParams.set("paginationInput.entriesPerPage", "100");
        url.searchParams.set("sortOrder", "EndTimeSoonest");
        url.searchParams.set("itemFilter(0).name", "SoldItemsOnly");
        url.searchParams.set("itemFilter(0).value", "true");

        const resp = await fetch(url.toString(), {
          headers: { "X-EBAY-SOA-SECURITY-APPNAME": ebayAppId! },
        });
        if (!resp.ok) {
          errors.push(`eBay API ${resp.status} for "${keywords}"`);
          return [];
        }

        const data = await resp.json();
        const searchResult = data.findCompletedItemsResponse?.[0];
        if (searchResult?.ack?.[0] !== "Success") {
          errors.push(`eBay returned non-success for "${keywords}"`);
          return [];
        }

        const items = searchResult?.searchResult?.[0]?.item || [];
        // Only keep items that actually sold
        return items.filter((item: any) => {
          const sellingState = item.sellingStatus?.[0]?.sellingState?.[0];
          return sellingState === "EndedWithSales";
        }).map((item: any) => ({ ...item, _listingType: listingType }));
      }

      // Fetch all queries
      const allItems: any[] = [];
      for (const q of rawQueries) {
        try {
          const items = await fetchEbayCompleted(q, "raw");
          allItems.push(...items);
        } catch (e) {
          errors.push(`Raw fetch error: ${e}`);
        }
      }
      for (const q of psa10Queries) {
        try {
          const items = await fetchEbayCompleted(q, "psa10");
          allItems.push(...items);
        } catch (e) {
          errors.push(`PSA10 fetch error: ${e}`);
        }
      }

      fetched = allItems.length;
      console.log(`Fetch: got ${fetched} sold items from eBay`);

      // Parse and filter
      const parsed: Array<Record<string, unknown>> = [];

      for (const item of allItems) {
        const title = item.title?.[0] || "";
        const itemId = item.itemId?.[0] || null;
        const viewUrl = item.viewItemURL?.[0] || null;
        const imageUrl = item.galleryURL?.[0] || null;
        const priceStr = item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__;
        const soldPrice = priceStr ? parseFloat(priceStr) : null;
        const soldDate = item.listingInfo?.[0]?.endTime?.[0] || null;
        const lt: "raw" | "psa10" = item._listingType;

        if (!title || !soldPrice || soldPrice <= 0) { skipped++; continue; }
        if (isJunk(title)) { skipped++; continue; }
        if (lt === "raw" && isRawExcluded(title)) { skipped++; continue; }
        if (lt === "psa10") {
          if (!PSA10_REQUIRE.test(title)) { skipped++; continue; }
          if (isPsa10Excluded(title)) { skipped++; continue; }
        }

        const cardNumber = parseCardNumber(title);
        const character = parseCharacter(title);
        const setName = parseSetName(title);
        const variant = parseVariant(title);
        const language = detectLanguage(title);
        const grade = parseGrade(title);
        const normalizedKey = buildNormalizedCardKey({ cardNumber, character, setName, language, variant });

        parsed.push({
          ebay_item_id: itemId,
          title,
          listing_url: viewUrl,
          sold_price_usd: soldPrice,
          sold_date: soldDate,
          image_url: imageUrl,
          condition_text: null,
          is_graded: grade.isGraded,
          grader: grade.grader,
          grade_value: grade.gradeValue,
          listing_type: lt,
          game: "onepiece",
          parsed_character: character,
          parsed_card_number: cardNumber,
          parsed_set_name: setName,
          parsed_rarity: null,
          parsed_variant: variant,
          language_detected: language,
          normalized_card_key: normalizedKey,
          parse_confidence: cardNumber ? "high" : "low",
          junk_flag: false,
          outlier_flag: false,
        });
      }

      parsedCount = parsed.length;
      console.log(`Fetch: parsed ${parsedCount}, skipped ${skipped}`);

      // Upsert using ebay_item_id dedup — delete existing then insert
      if (parsed.length) {
        const ebayIds = parsed.map(p => p.ebay_item_id).filter(Boolean) as string[];
        if (ebayIds.length) {
          await supabase
            .from("ebay_listing_cache")
            .delete()
            .in("ebay_item_id", ebayIds);
        }

        const { error: insertErr } = await supabase
          .from("ebay_listing_cache")
          .insert(parsed);
        if (insertErr) {
          console.error("Fetch insert error:", insertErr);
          errors.push(`Insert error: ${insertErr.message}`);
        } else {
          inserted = parsed.length;
        }
      }

      return new Response(
        JSON.stringify({ action: "fetch", fetched, parsed: parsedCount, inserted, skipped, errors }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── INGEST: accept listings from caller ───
    if (action === "ingest") {
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
        const grade = parseGrade(title);

        if (listing.search_type === "raw" && isRawExcluded(title)) continue;
        if (listing.search_type === "psa10") {
          if (!PSA10_REQUIRE.test(title)) continue;
          if (isPsa10Excluded(title)) continue;
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
          listing_type: listing.search_type,
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

      if (parsed.length) {
        const { error: insertErr } = await supabase
          .from("ebay_listing_cache")
          .upsert(parsed, { onConflict: "id" });
        if (insertErr) {
          console.error("Insert error:", insertErr);
        }
      }

      return new Response(
        JSON.stringify({ action: "ingest", inserted: parsed.length, skipped: listings.length - parsed.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── GROUP: aggregate cache into market table ───
    if (action === "group") {
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

      console.log(`Group: found ${allListings?.length || 0} non-junk cached listings`);

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

      console.log(`Group: upserting ${upsertRows.length} grouped rows`);

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
        JSON.stringify({ action: "group", grouped: upsertRows.length, cachedListings: allListings?.length || 0 }),
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

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CardMetadata {
  year: number | null;
  brand: string | null;
  product: string | null;
  setName: string | null;
  playerName: string | null;
  cardNumber: string | null;
}

interface PopulationData {
  psa10Count: number;
  psa9Count: number;
  totalGraded: number;
  gemRate: number;
  source: string;
  scraped: boolean;
}

// Build search query for GemRate.com
function buildSearchQuery(metadata: CardMetadata, title: string): string {
  const parts: string[] = [];
  
  if (metadata.year) parts.push(metadata.year.toString());
  if (metadata.brand) parts.push(metadata.brand);
  if (metadata.product) parts.push(metadata.product);
  if (metadata.setName) parts.push(metadata.setName);
  
  // Try to extract player name from title if not already parsed
  if (metadata.playerName) {
    parts.push(metadata.playerName);
  }
  
  if (metadata.cardNumber) {
    parts.push(`#${metadata.cardNumber}`);
  }
  
  // If we have very few parts, use more of the original title
  if (parts.length < 3) {
    // Clean up the title - remove common noise words
    const cleanTitle = title
      .replace(/\b(PSA|BGS|SGC|CGC|MINT|GEM|MT|NM|EX|VG|GOOD|FAIR|POOR)\b/gi, '')
      .replace(/\b(LOT|LOTS|SET|SETS|PACK|PACKS|BOX|BOXES|CASE|CASES)\b/gi, '')
      .replace(/\b(GRADED|GRADE|CERTIFIED|AUTHENTIC|FACTORY|SEALED)\b/gi, '')
      .replace(/\b(EBAY|SHIPPING|FREE|FAST|NEW|SALE|HOT|RARE)\b/gi, '')
      .replace(/[!@#$%^&*()_+=\[\]{}|\\:";'<>?,./]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return cleanTitle.substring(0, 100);
  }
  
  return parts.join(' ');
}

// Parse population data from scraped markdown/HTML
function parsePopulationData(content: string): PopulationData | null {
  try {
    // Look for population table patterns
    // GemRate.com typically shows: Grade | Count | % of Pop
    
    // Pattern 1: "PSA 10" or "GEM-MT 10" followed by count
    const psa10Patterns = [
      /(?:PSA\s*10|GEM[- ]?MT\s*10|10\s*GEM[- ]?MT)[:\s]*(\d{1,6})/i,
      /10\s*[\|\-]\s*(\d{1,6})/i,
      /Grade\s*10[:\s]*(\d{1,6})/i,
      /GEM[- ]?MINT[:\s]*(\d{1,6})/i,
    ];
    
    const psa9Patterns = [
      /(?:PSA\s*9|MINT\s*9|9\s*MINT)[:\s]*(\d{1,6})/i,
      /9\s*[\|\-]\s*(\d{1,6})/i,
      /Grade\s*9[:\s]*(\d{1,6})/i,
    ];
    
    const totalPatterns = [
      /Total[:\s]*(\d{1,7})/i,
      /Population[:\s]*(\d{1,7})/i,
      /Graded[:\s]*(\d{1,7})/i,
      /(?:All\s+)?(?:Grades?|Cards?)[:\s]*(\d{1,7})/i,
    ];
    
    let psa10Count = 0;
    let psa9Count = 0;
    let totalGraded = 0;
    
    // Extract PSA 10 count
    for (const pattern of psa10Patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        psa10Count = parseInt(match[1].replace(/,/g, ''), 10);
        if (psa10Count > 0) break;
      }
    }
    
    // Extract PSA 9 count
    for (const pattern of psa9Patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        psa9Count = parseInt(match[1].replace(/,/g, ''), 10);
        if (psa9Count > 0) break;
      }
    }
    
    // Extract total count
    for (const pattern of totalPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        totalGraded = parseInt(match[1].replace(/,/g, ''), 10);
        if (totalGraded > 0) break;
      }
    }
    
    // If we found at least PSA 10 count
    if (psa10Count > 0) {
      // Estimate total if not found
      if (totalGraded === 0 || totalGraded < psa10Count) {
        // Rough estimate: PSA 10s are typically 30-60% of graded pop
        totalGraded = Math.round(psa10Count / 0.45);
      }
      
      const gemRate = totalGraded > 0 ? Math.round((psa10Count / totalGraded) * 100) : 0;
      
      return {
        psa10Count,
        psa9Count,
        totalGraded,
        gemRate,
        source: 'GemRate.com',
        scraped: true,
      };
    }
    
    // Try parsing table format (markdown)
    // | Grade | Count | % |
    const tableMatch = content.match(/\|\s*10\s*\|\s*(\d+)\s*\|\s*([\d.]+)%?\s*\|/i);
    if (tableMatch) {
      psa10Count = parseInt(tableMatch[1], 10);
      const percentage = parseFloat(tableMatch[2]);
      
      if (psa10Count > 0 && percentage > 0) {
        totalGraded = Math.round(psa10Count / (percentage / 100));
        
        return {
          psa10Count,
          psa9Count: 0,
          totalGraded,
          gemRate: Math.round(percentage),
          source: 'GemRate.com',
          scraped: true,
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing population data:', error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { metadata, title, listingId } = await req.json();
    
    if (!title) {
      return new Response(
        JSON.stringify({ success: false, error: 'Title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.log('FIRECRAWL_API_KEY not configured - returning null');
      return new Response(
        JSON.stringify({ success: false, error: 'Scraper not configured', data: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build search query
    const searchQuery = buildSearchQuery(metadata || {}, title);
    console.log('Search query:', searchQuery);
    
    // Search GemRate.com for population data
    const gemrateUrl = `https://www.gemrate.com/search?q=${encodeURIComponent(searchQuery)}`;
    console.log('Scraping:', gemrateUrl);

    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: gemrateUrl,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        waitFor: 2000, // Wait for dynamic content
      }),
    });

    const scrapeData = await scrapeResponse.json();
    
    if (!scrapeResponse.ok) {
      console.error('Firecrawl error:', scrapeData);
      return new Response(
        JSON.stringify({ success: false, error: 'Scrape failed', data: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get content from response
    const content = scrapeData.data?.markdown || scrapeData.data?.html || scrapeData.markdown || scrapeData.html || '';
    
    if (!content) {
      console.log('No content returned from scrape');
      return new Response(
        JSON.stringify({ success: false, error: 'No content', data: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse population data
    const popData = parsePopulationData(content);
    
    if (popData) {
      console.log('Parsed population data:', popData);
      
      // Cache to database if we have Supabase access
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (supabaseUrl && supabaseKey && metadata?.year && metadata?.brand && metadata?.product) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          // Upsert the scraped data
          await supabase
            .from('historical_gem_rates')
            .upsert({
              year: metadata.year,
              brand: metadata.brand,
              product: metadata.product,
              set_name: metadata.setName || 'Base',
              player_name: metadata.playerName,
              card_number: metadata.cardNumber,
              psa10_count: popData.psa10Count,
              psa9_count: popData.psa9Count,
              total_graded: popData.totalGraded,
              gem_rate: popData.gemRate,
              source: popData.source,
              scraped_at: new Date().toISOString(),
              auto_fetched: true,
              last_updated: new Date().toISOString(),
            }, {
              onConflict: 'year,brand,product',
              ignoreDuplicates: false,
            });
          
          console.log('Cached population data to database');
        }
      } catch (cacheError) {
        console.error('Failed to cache data:', cacheError);
        // Continue anyway - we still have the data
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: popData,
          listingId,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Could not parse population data from content');
    return new Response(
      JSON.stringify({ success: false, error: 'Could not parse data', data: null }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('PSA pop fetch error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

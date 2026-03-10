export interface Psa10SoldRecord {
  title: string;
  soldPrice: number;
  soldDate: string | null;
  link: string | null;
}

const BAD_COMP_PATTERNS = /\b(psa\s*9|bgs|sgc|cgc|lot\b|lots\b|reprint|custom|proxy|damaged|replica|digital|fan\s*art)\b/i;

/**
 * Parse 130point markdown for sold records.
 * 130point renders a table of recent sales — we extract rows from markdown table syntax.
 */
export function parse130pointSales(markdown: string): Psa10SoldRecord[] {
  if (!markdown) return [];

  const records: Psa10SoldRecord[] = [];

  // 130point tables typically render as markdown tables with | delimiters
  const lines = markdown.split('\n');

  for (const line of lines) {
    // Skip non-table lines and header separator lines
    if (!line.includes('|') || /^[\s|:-]+$/.test(line)) continue;

    const cells = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length < 2) continue;

    // Try to extract a price from any cell
    let soldPrice: number | null = null;
    let title = '';
    let soldDate: string | null = null;
    let link: string | null = null;

    for (const cell of cells) {
      // Extract price: $123.45 or $1,234.56
      const priceMatch = cell.match(/\$[\d,]+\.?\d*/);
      if (priceMatch && soldPrice === null) {
        soldPrice = parseFloat(priceMatch[0].replace(/[$,]/g, ''));
        continue;
      }

      // Extract date patterns: MM/DD/YYYY, YYYY-MM-DD, Mon DD YYYY
      const dateMatch = cell.match(/\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}/i);
      if (dateMatch) {
        soldDate = dateMatch[0];
        continue;
      }

      // Extract markdown links [text](url)
      const linkMatch = cell.match(/\[([^\]]*)\]\(([^)]+)\)/);
      if (linkMatch) {
        if (!title) title = linkMatch[1];
        if (!link) link = linkMatch[2];
        continue;
      }

      // Longest remaining cell is likely the title
      if (cell.length > title.length && !priceMatch) {
        title = cell;
      }
    }

    if (soldPrice !== null && soldPrice > 0 && title) {
      records.push({ title: title.trim(), soldPrice, soldDate, link });
    }
  }

  // Also try to parse non-table formats (plain text rows with prices)
  if (records.length === 0) {
    const priceLines = markdown.match(/^.*\$[\d,]+\.?\d*.*$/gm) || [];
    for (const priceLine of priceLines) {
      const priceMatch = priceLine.match(/\$[\d,]+\.?\d*/);
      if (!priceMatch) continue;
      const soldPrice = parseFloat(priceMatch[0].replace(/[$,]/g, ''));
      if (soldPrice <= 0) continue;

      const cleanTitle = priceLine.replace(/\$[\d,]+\.?\d*/, '').replace(/\[([^\]]*)\]\([^)]+\)/g, '$1').trim();
      if (cleanTitle.length < 5) continue;

      records.push({ title: cleanTitle, soldPrice, soldDate: null, link: null });
    }
  }

  return records;
}

/**
 * Filter to only clean PSA 10 comps, removing junk and mismatches.
 */
export function filterCleanComps(records: Psa10SoldRecord[], _rawTitle?: string): Psa10SoldRecord[] {
  return records.filter(r => {
    // Must mention PSA 10 or Gem Mint 10
    if (!/psa\s*10|gem\s*mint\s*10/i.test(r.title)) return false;

    // Reject bad comp patterns
    if (BAD_COMP_PATTERNS.test(r.title)) return false;

    // Reasonable price range
    if (r.soldPrice < 1 || r.soldPrice > 100000) return false;

    return true;
  });
}

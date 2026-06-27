import * as cheerio from 'cheerio';

export interface AuditCheck {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
  weight: number;
}

export interface AuditResult {
  url: string;
  score: number;
  checks: AuditCheck[];
  meta: {
    title: string | null;
    description: string | null;
    statusCode: number;
    loadTimeMs: number;
  };
}

const TIMEOUT_MS = 8000;

async function fetchWithTimeout(url: string): Promise<{ html: string; status: number; ms: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const start = Date.now();

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'SiteScopeBot/1.0 (+https://sitescope.dev)',
      },
      redirect: 'follow',
    });
    const html = await res.text();
    return { html, status: res.status, ms: Date.now() - start };
  } finally {
    clearTimeout(timer);
  }
}

function normalizeUrl(input: string): string {
  let url = input.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return url;
}

export async function runAudit(rawUrl: string): Promise<AuditResult> {
  const url = normalizeUrl(rawUrl);
  const { html, status, ms } = await fetchWithTimeout(url);
  const $ = cheerio.load(html);

  const checks: AuditCheck[] = [];

  // --- SEO checks ---
  const title = $('title').first().text().trim() || null;
  checks.push({
    id: 'title-exists',
    label: 'Sayfada <title> etiketi var',
    passed: !!title,
    detail: title ? `Bulundu: "${title}" (${title.length} karakter)` : '<title> etiketi bulunamadı.',
    weight: 10,
  });

  checks.push({
    id: 'title-length',
    label: 'Title uzunluğu SEO için uygun (15–60 karakter)',
    passed: !!title && title.length >= 15 && title.length <= 60,
    detail: title
      ? `Title ${title.length} karakter.`
      : 'Değerlendirilemiyor — title etiketi yok.',
    weight: 5,
  });

  const description = $('meta[name="description"]').attr('content')?.trim() || null;
  checks.push({
    id: 'meta-description',
    label: 'Sayfada meta description var',
    passed: !!description,
    detail: description
      ? `Bulundu (${description.length} karakter).`
      : 'Meta description etiketi bulunamadı.',
    weight: 10,
  });

  const h1Count = $('h1').length;
  checks.push({
    id: 'single-h1',
    label: 'Sayfada tam olarak bir <h1> var',
    passed: h1Count === 1,
    detail: `${h1Count} adet <h1> etiketi bulundu.`,
    weight: 8,
  });

  const viewport = $('meta[name="viewport"]').attr('content');
  checks.push({
    id: 'viewport',
    label: 'Mobil uyumlu viewport meta etiketi var',
    passed: !!viewport,
    detail: viewport ? `Bulundu: "${viewport}"` : 'Viewport meta etiketi eksik — mobil görünüm bozulabilir.',
    weight: 8,
  });

  const canonical = $('link[rel="canonical"]').attr('href');
  checks.push({
    id: 'canonical',
    label: 'Canonical link etiketi var',
    passed: !!canonical,
    detail: canonical ? `Bulundu: "${canonical}"` : 'Canonical etiketi yok — duplicate content sorunlarına yol açabilir.',
    weight: 4,
  });

  const ogTitle = $('meta[property="og:title"]').attr('content');
  const ogImage = $('meta[property="og:image"]').attr('content');
  checks.push({
    id: 'open-graph',
    label: 'Open Graph etiketleri var (og:title, og:image)',
    passed: !!ogTitle && !!ogImage,
    detail: `og:title=${ogTitle ? 'var' : 'yok'}, og:image=${ogImage ? 'var' : 'yok'}.`,
    weight: 5,
  });

  // --- Accessibility checks ---
  const images = $('img');
  const imagesMissingAlt = images.filter((_, el) => !$(el).attr('alt')).length;
  checks.push({
    id: 'img-alt',
    label: 'Tüm <img> etiketlerinde alt metni var',
    passed: images.length === 0 || imagesMissingAlt === 0,
    detail:
      images.length === 0
        ? 'Sayfada resim bulunamadı.'
        : `${images.length} resimden ${imagesMissingAlt} tanesinde alt metni eksik.`,
    weight: 10,
  });

  const htmlLang = $('html').attr('lang');
  checks.push({
    id: 'html-lang',
    label: '<html> etiketinde lang attribute var',
    passed: !!htmlLang,
    detail: htmlLang ? `lang="${htmlLang}"` : 'Lang attribute eksik — ekran okuyucular içeriği yanlış telaffuz edebilir.',
    weight: 6,
  });

  const buttonsWithoutLabel = $('button')
    .filter((_, el) => {
      const $el = $(el);
      const hasText = $el.text().trim().length > 0;
      const hasAriaLabel = !!$el.attr('aria-label');
      return !hasText && !hasAriaLabel;
    })
    .length;
  const buttonCount = $('button').length;
  checks.push({
    id: 'button-labels',
    label: 'Butonlarda erişilebilir metin veya aria-label var',
    passed: buttonCount === 0 || buttonsWithoutLabel === 0,
    detail:
      buttonCount === 0
        ? '<button> elementi bulunamadı.'
        : `${buttonCount} butondan ${buttonsWithoutLabel} tanesinde erişilebilir metin yok.`,
    weight: 6,
  });

  // --- Performance proxies ---
  checks.push({
    id: 'response-time',
    label: 'Sunucu hızlı yanıt veriyor (< 800ms)',
    passed: ms < 800,
    detail: `Yanıt süresi ${ms}ms.`,
    weight: 6,
  });

  checks.push({
    id: 'status-ok',
    label: 'Sayfa başarılı bir HTTP durumu döndürüyor',
    passed: status >= 200 && status < 400,
    detail: `HTTP durumu: ${status}`,
    weight: 10,
  });

  const inlineStyleCount = $('[style]').length;
  checks.push({
    id: 'no-inline-styles',
    label: 'Aşırı inline stil kullanımından kaçınılmış',
    passed: inlineStyleCount < 15,
    detail: `${inlineStyleCount} element inline style attribute kullanıyor.`,
    weight: 4,
  });

  // --- Score calculation ---
  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const earnedWeight = checks.reduce((sum, c) => sum + (c.passed ? c.weight : 0), 0);
  const score = Math.round((earnedWeight / totalWeight) * 100);

  return {
    url,
    score,
    checks,
    meta: {
      title,
      description,
      statusCode: status,
      loadTimeMs: ms,
    },
  };
}
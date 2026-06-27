'use client';

import { useState } from 'react';

interface AuditCheck {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
  weight: number;
}

interface AuditResult {
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

function scoreColor(score: number): string {
  if (score >= 80) return 'text-vital';
  if (score >= 50) return 'text-yellow-400';
  return 'text-coral';
}

function scoreRingColor(score: number): string {
  if (score >= 80) return '#3DDC97';
  if (score >= 50) return '#FACC15';
  return '#FF8B6B';
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Denetim sırasında bir hata oluştu.');
      } else {
        setResult(data);
      }
    } catch {
      setError('Sunucuya bağlanılamadı. İnternet bağlantını kontrol et.');
    } finally {
      setLoading(false);
    }
  };

  const circumference = 2 * Math.PI * 54;

  return (
    <main className="min-h-screen px-6 py-16 md:py-24">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-vital/20 bg-vital/5 px-4 py-1.5 text-xs font-medium text-vital">
            <span className="h-1.5 w-1.5 rounded-full bg-vital animate-pulse" />
            Canlı Denetim Motoru
          </div>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-mist md:text-5xl">
            Site<span className="text-vital">Scope</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-balance text-sm text-mist/60 md:text-base">
            Herhangi bir URL için anında SEO, erişilebilirlik ve performans teşhisi al.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mb-10">
          <div className="glass flex items-center gap-2 rounded-2xl p-2 shadow-lg">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="ornek.com"
              className="flex-1 bg-transparent px-4 py-3 font-mono text-sm text-mist placeholder:text-mist/30 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-vital px-6 py-3 text-sm font-semibold text-ink transition hover:bg-vital/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Taranıyor…' : 'Denetle'}
            </button>
          </div>
          {error && (
            <p className="mt-3 text-center text-sm text-coral">{error}</p>
          )}
        </form>

        {/* Loading state */}
        {loading && (
          <div className="glass rounded-2xl p-10 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-vital/20 border-t-vital" />
            <p className="font-mono text-xs text-mist/50">
              {url} taranıyor — SEO, erişilebilirlik ve performans kontrol ediliyor…
            </p>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-6">
            {/* Score card */}
            <div className="glass flex flex-col items-center gap-6 rounded-2xl p-8 md:flex-row">
              <div className="relative h-32 w-32 flex-shrink-0">
                <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke={scoreRingColor(result.score)}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - (result.score / 100) * circumference}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`font-mono text-3xl font-semibold ${scoreColor(result.score)}`}>
                    {result.score}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-mist/40">skor</span>
                </div>
              </div>
              <div className="text-center md:text-left">
                <p className="font-mono text-xs text-mist/40">{result.url}</p>
                <p className="mt-1 text-lg font-medium text-mist">
                  {result.meta.title || 'Başlık bulunamadı'}
                </p>
                <p className="mt-1 text-sm text-mist/50">
                  {result.meta.description || 'Meta açıklaması bulunamadı.'}
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-3 text-xs text-mist/40 md:justify-start">
                  <span>HTTP {result.meta.statusCode}</span>
                  <span>·</span>
                  <span>{result.meta.loadTimeMs}ms yanıt süresi</span>
                </div>
              </div>
            </div>

            {/* Checks list */}
            <div className="glass divide-y divide-white/5 rounded-2xl">
              {result.checks.map((check) => (
                <div key={check.id} className="flex items-start gap-3 p-4">
                  <div
                    className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      check.passed
                        ? 'bg-vital/15 text-vital'
                        : 'bg-coral/15 text-coral'
                    }`}
                  >
                    {check.passed ? '✓' : '✕'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-mist">{check.label}</p>
                    <p className="mt-0.5 text-xs text-mist/45">{check.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state hint */}
        {!result && !loading && (
          <p className="text-center text-xs text-mist/30">
            Örnek: github.com, vercel.com veya kendi sitenin adresini yazıp dene.
          </p>
        )}
      </div>
    </main>
  );
}
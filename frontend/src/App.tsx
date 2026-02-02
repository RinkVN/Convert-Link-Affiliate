import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { DotPattern } from "@/components/aceternity/DotPattern";
import { GridPattern } from "@/components/aceternity/GridPattern";
import { AppHeader } from "@/components/AppHeader";
import { HeroSection } from "@/components/HeroSection";
import { ConvertForm } from "@/components/ConvertForm";
import { ResultCard } from "@/components/ResultCard";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { AppFooter } from "@/components/AppFooter";
import type { HistoryItem, TopProduct } from "@/types";
import {
  loadLocalSubId,
  saveLocalSubId,
  saveLocalHistory,
} from "@/lib/storage";

const App: React.FC = () => {
  const [originalUrl, setOriginalUrl] = useState("");
  const [subId, setSubId] = useState("");
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    setSubId(loadLocalSubId());

    axios
      .get<{ data: HistoryItem[] }>("/api/convert/recent?limit=10")
      .then((resp) => {
        if (Array.isArray(resp.data?.data)) {
          setHistory(resp.data.data);
        }
      })
      .catch(() => {});

    axios
      .get<{ data: TopProduct[] }>("/api/top-products")
      .then((resp) => {
        if (Array.isArray(resp.data?.data) && resp.data.data.length > 0) {
          setTopProducts(resp.data.data.slice(0, 8));
        }
      })
      .catch(() => {})
      .finally(() => setProductsLoading(false));
  }, []);

  const canSubmit = useMemo(
    () => !!originalUrl && !loading,
    [originalUrl, loading]
  );

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);
    setAffiliateUrl("");

    try {
      if (subId) saveLocalSubId(subId);

      const payload: { originalUrl: string; subId?: string } = {
        originalUrl: originalUrl.trim(),
      };
      if (subId.trim()) payload.subId = subId.trim();

      const resp = await axios.post<{ id: string; affiliateUrl: string }>(
        "/api/convert",
        payload
      );

      setAffiliateUrl(resp.data.affiliateUrl);

      const newItem: HistoryItem = {
        id: resp.data.id,
        originalUrl: originalUrl.trim(),
        affiliateUrl: resp.data.affiliateUrl,
        subId: subId.trim(),
        createdAt: new Date().toISOString(),
      };

      setHistory((prev) => {
        const updated = [newItem, ...prev];
        saveLocalHistory(updated);
        return updated.slice(0, 10);
      });
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Có lỗi xảy ra khi convert link. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!affiliateUrl) return;
    try {
      await navigator.clipboard.writeText(affiliateUrl);
      alert("Đã copy affiliate link vào clipboard!");
    } catch {
      alert("Không thể copy tự động, vui lòng copy thủ công.");
    }
  };

  return (
    <div className="min-h-screen bg-stone-50/80 text-stone-900 antialiased">
      <DotPattern className="opacity-60" />
      <GridPattern className="opacity-40" />

      <AppHeader subId={subId} onSubIdChange={setSubId} />

      <HeroSection />

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-24">
        {/* Công cụ tạo link - tính năng chính */}
        <section className="relative -mt-8 space-y-6">
          <ConvertForm
            originalUrl={originalUrl}
            loading={loading}
            error={error}
            canSubmit={canSubmit}
            onOriginalUrlChange={setOriginalUrl}
            onSubmit={handleConvert}
          />
          {affiliateUrl && (
            <ResultCard affiliateUrl={affiliateUrl} onCopy={handleCopy} />
          )}
        </section>

        {/* Sản phẩm nổi bật - phụ */}
        <FeaturedProducts products={topProducts} loading={productsLoading} />
      </main>

      <AppFooter />
    </div>
  );
};

export default App;

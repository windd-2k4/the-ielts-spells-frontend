import type { Campaign, CmsBanner, CmsPage, CmsPost, PublishStatus } from "@ielts/contracts";
import { Megaphone, Newspaper, SpinnerGap, TelevisionSimple, TextAa } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";

type CmsTab = "pages" | "posts" | "banners" | "campaigns";
type Page<T> = { content: T[] };

const tabs: { id: CmsTab; label: string; icon: typeof TextAa }[] = [
  { id: "pages", label: "Trang", icon: TextAa },
  { id: "posts", label: "Bài viết", icon: Newspaper },
  { id: "banners", label: "Banner", icon: TelevisionSimple },
  { id: "campaigns", label: "Chiến dịch", icon: Megaphone },
];

const statusLabel: Record<PublishStatus, string> = {
  DRAFT: "Bản nháp",
  SCHEDULED: "Đã lên lịch",
  PUBLISHED: "Đã xuất bản",
  ARCHIVED: "Đã lưu trữ",
};

function StatusBadge({ status }: { status: PublishStatus }) {
  const tone = status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" : status === "DRAFT" ? "bg-surface-container text-on-surface-variant" : "bg-primary-container/25 text-primary";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tone}`}>{statusLabel[status]}</span>;
}

export function CmsContentPage() {
  const [activeTab, setActiveTab] = useState<CmsTab>("posts");
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [posts, setPosts] = useState<CmsPost[]>([]);
  const [banners, setBanners] = useState<CmsBanner[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [pageData, postData, bannerData, campaignData] = await Promise.all([
        apiFetch<Page<CmsPage>>("/social-media/cms/pages?size=100"),
        apiFetch<Page<CmsPost>>("/social-media/cms/posts?size=100"),
        apiFetch<Page<CmsBanner>>("/social-media/cms/banners?size=100"),
        apiFetch<Page<Campaign>>("/social-media/cms/campaigns?size=100"),
      ]);
      setPages(pageData.content);
      setPosts(postData.content);
      setBanners(bannerData.content);
      setCampaigns(campaignData.content);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không tải được nội dung CMS.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const itemCount = useMemo(() => ({ pages: pages.length, posts: posts.length, banners: banners.length, campaigns: campaigns.length }), [banners.length, campaigns.length, pages.length, posts.length]);

  async function changePublication(type: Exclude<CmsTab, "campaigns">, id: string, status: PublishStatus) {
    setIsSaving(id);
    setError("");
    try {
      await apiFetch(`/social-media/cms/${type}/${id}/publication`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không thể cập nhật trạng thái nội dung.");
    } finally {
      setIsSaving(null);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="auth-kicker">SOCIAL MEDIA CMS</p>
        <h1 className="font-display text-3xl font-extrabold text-on-surface">Nội dung truyền thông</h1>
        <p className="mt-1 text-sm text-on-surface-variant">Quản lý bản nháp, nội dung đã lên lịch và nội dung công khai. Khách vãng lai chỉ đọc nội dung đã xuất bản.</p>
      </header>

      {error && <p role="alert" className="rounded-xl border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-error">{error}</p>}

      <nav className="flex flex-wrap gap-2 border-b border-outline-variant/50 pb-3" aria-label="Loại nội dung CMS">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = tab.id === activeTab;
          return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} aria-current={selected ? "page" : undefined} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${selected ? "bg-primary text-on-primary" : "bg-surface text-on-surface-variant hover:bg-surface-container"}`}><Icon size={18} />{tab.label}<span className="rounded-md bg-black/10 px-1.5 py-0.5 text-xs">{itemCount[tab.id]}</span></button>;
        })}
      </nav>

      {isLoading ? <div className="app-loader" role="status"><SpinnerGap className="spin" />Đang tải nội dung CMS...</div> : (
        <section className="overflow-x-auto rounded-2xl border border-outline-variant/50 bg-surface">
          {activeTab === "pages" && <ContentTable type="pages" items={pages} savingId={isSaving} onPublication={changePublication} />}
          {activeTab === "posts" && <ContentTable type="posts" items={posts} savingId={isSaving} onPublication={changePublication} />}
          {activeTab === "banners" && <ContentTable type="banners" items={banners} savingId={isSaving} onPublication={changePublication} />}
          {activeTab === "campaigns" && <CampaignTable items={campaigns} />}
        </section>
      )}
    </div>
  );
}

function ContentTable({
  type,
  items,
  savingId,
  onPublication,
}: {
  type: Exclude<CmsTab, "campaigns">;
  items: (CmsPage | CmsPost | CmsBanner)[];
  savingId: string | null;
  onPublication: (type: Exclude<CmsTab, "campaigns">, id: string, status: PublishStatus) => Promise<void>;
}) {
  return <table className="min-w-full text-left text-sm"><thead className="bg-surface-container-low text-xs uppercase tracking-wide text-on-surface-variant"><tr><th className="px-5 py-3">Nội dung</th><th className="px-5 py-3">Vị trí / Slug</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3 text-right">Thao tác</th></tr></thead><tbody>{items.map((item) => {
    const subtitle = "subtitle" in item ? item.subtitle : item.excerpt;
    const reference = "position" in item ? item.position : item.slug;
    return <tr key={item.id} className="border-t border-outline-variant/35"><td className="px-5 py-4"><strong className="block text-on-surface">{item.title}</strong>{subtitle && <span className="mt-1 block max-w-md truncate text-xs text-on-surface-variant">{subtitle}</span>}</td><td className="px-5 py-4 font-mono text-xs text-on-surface-variant">{reference}</td><td className="px-5 py-4"><StatusBadge status={item.status} /></td><td className="px-5 py-4 text-right"><div className="inline-flex gap-2">{item.status !== "PUBLISHED" && <button type="button" disabled={savingId === item.id} onClick={() => void onPublication(type, item.id, "PUBLISHED")} className="rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-bold text-primary disabled:opacity-50">Xuất bản</button>}{item.status !== "ARCHIVED" && <button type="button" disabled={savingId === item.id} onClick={() => void onPublication(type, item.id, "ARCHIVED")} className="rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-bold text-on-surface-variant disabled:opacity-50">Lưu trữ</button>}</div></td></tr>;
  })}</tbody></table>;
}

function CampaignTable({ items }: { items: Campaign[] }) {
  return <table className="min-w-full text-left text-sm"><thead className="bg-surface-container-low text-xs uppercase tracking-wide text-on-surface-variant"><tr><th className="px-5 py-3">Chiến dịch</th><th className="px-5 py-3">Mã</th><th className="px-5 py-3">Nguồn</th><th className="px-5 py-3">Trạng thái</th></tr></thead><tbody>{items.map((campaign) => <tr key={campaign.id} className="border-t border-outline-variant/35"><td className="px-5 py-4"><strong>{campaign.name}</strong><span className="mt-1 block text-xs text-on-surface-variant">{campaign.startsAt ? new Date(campaign.startsAt).toLocaleDateString("vi-VN") : "Chưa đặt thời gian"}</span></td><td className="px-5 py-4 font-mono text-xs text-on-surface-variant">{campaign.campaignCode ?? "—"}</td><td className="px-5 py-4 text-on-surface-variant">{campaign.source ?? "—"}{campaign.medium ? ` / ${campaign.medium}` : ""}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${campaign.active ? "bg-emerald-50 text-emerald-700" : "bg-surface-container text-on-surface-variant"}`}>{campaign.active ? "Đang chạy" : "Tạm dừng"}</span></td></tr>)}</tbody></table>;
}

import type { Campaign, CmsBanner, CmsPage, CmsPost, PublishStatus } from "@ielts/contracts";
import {
  ArrowRight,
  Check,
  CheckCircle,
  CircleNotch,
  Clock,
  DeviceMobile,
  Eye,
  FileText,
  FloppyDisk,
  GearSix,
  Globe,
  ImageSquare,
  Layout,
  Megaphone,
  Monitor,
  Newspaper,
  PencilSimple,
  Plus,
  SpinnerGap,
  TelevisionSimple,
  TextAa,
  Trash,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api";

type CmsTab = "pages" | "posts" | "banners" | "campaigns";
type Page<T> = { content: T[] };
type PublicationType = Exclude<CmsTab, "campaigns">;
type SectionType = "hero" | "feature" | "social-proof" | "cta";

type LandingSection = {
  id: string;
  type: SectionType;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  mediaPath: string;
  enabled: boolean;
};

type PageDraft = {
  id: string | null;
  slug: string;
  title: string;
  excerpt: string;
  status: PublishStatus;
  updatedAt: string | null;
  sections: LandingSection[];
  seoMetadata: Record<string, unknown>;
};

const tabs: { id: CmsTab; label: string; icon: typeof TextAa; description: string }[] = [
  { id: "pages", label: "Landing page", icon: Layout, description: "Trang đích và nội dung giới thiệu" },
  { id: "posts", label: "Bài viết", icon: Newspaper, description: "Nội dung chuyên môn và tin tức" },
  { id: "banners", label: "Banner", icon: TelevisionSimple, description: "Các vị trí quảng bá trên trang" },
  { id: "campaigns", label: "Chiến dịch", icon: Megaphone, description: "Theo dõi nguồn chiến dịch" },
];

const statusLabel: Record<PublishStatus, string> = {
  DRAFT: "Bản nháp",
  SCHEDULED: "Đã lên lịch",
  PUBLISHED: "Đã xuất bản",
  ARCHIVED: "Đã lưu trữ",
};

const sectionTypeLabel: Record<SectionType, string> = {
  hero: "Hero",
  feature: "Nội dung nổi bật",
  "social-proof": "Tin cậy",
  cta: "Kêu gọi hành động",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readBoolean(value: unknown, fallback = true): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function readSectionType(value: unknown): SectionType {
  return value === "feature" || value === "social-proof" || value === "cta" ? value : "hero";
}

function emptySection(id: string, type: SectionType = "feature"): LandingSection {
  return {
    id,
    type,
    label: sectionTypeLabel[type],
    eyebrow: "",
    title: "",
    description: "",
    primaryCta: "",
    secondaryCta: "",
    mediaPath: "",
    enabled: true,
  };
}

function sectionsFromContent(content: Record<string, unknown>): LandingSection[] {
  if (!Array.isArray(content.sections)) return [];

  return content.sections.flatMap((value, index) => {
    if (!isRecord(value)) return [];
    const type = readSectionType(value.type);
    return [{
      ...emptySection(readString(value.id) || `section-${index + 1}`, type),
      label: readString(value.label) || sectionTypeLabel[type],
      eyebrow: readString(value.eyebrow),
      title: readString(value.title),
      description: readString(value.description),
      primaryCta: readString(value.primaryCta),
      secondaryCta: readString(value.secondaryCta),
      mediaPath: readString(value.mediaPath),
      enabled: readBoolean(value.enabled),
    }];
  });
}

function draftFromPage(page: CmsPage): PageDraft {
  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    excerpt: page.excerpt ?? "",
    status: page.status,
    updatedAt: page.updatedAt,
    sections: sectionsFromContent(page.content),
    seoMetadata: page.seoMetadata ?? {},
  };
}

function currentLandingDraft(): PageDraft {
  return {
    id: null,
    slug: "trang-chu",
    title: "Trang chủ IELTS",
    excerpt: "Chinh phục IELTS bằng một lộ trình rõ ràng, phương pháp học thuật tinh gọn và sự đồng hành sát sao.",
    status: "DRAFT",
    updatedAt: null,
    sections: [
      {
        ...emptySection("hero", "hero"),
        label: "Hero trang chủ",
        eyebrow: "The IELTS Spells • Học Thuật Kỳ Diệu",
        title: "Cast the Spells, Claim the Band",
        description: "Chinh phục IELTS bằng một lộ trình rõ ràng, kết hợp giữa phương pháp học thuật tinh gọn và sự hỗ trợ từ các giáo viên từ 8.0 - 8.5 IELTS hàng đầu.",
        primaryCta: "Tư Vấn & Test Đầu Vào",
        secondaryCta: "Khám Phá Khóa Học",
        mediaPath: "/banner.png",
      },
      {
        ...emptySection("about", "feature"),
        label: "Giới thiệu",
        eyebrow: "Về The IELTS Spells",
        title: "Không chỉ học IELTS — bạn học cách tiến bộ",
        description: "Mỗi học viên đều sở hữu tiềm năng bứt phá. The IELTS Spells mang tới giải pháp tinh gọn, giúp bạn chinh phục bằng tư duy học thuật thực chất thay vì áp lực học mẹo.",
        mediaPath: "/gioithieu.png",
      },
      {
        ...emptySection("benefits", "feature"),
        label: "Quyền lợi học viên",
        eyebrow: "Quyền Lợi Học Viên",
        title: "Đồng hành sát sao & theo dõi tiến độ học tập thực tế",
        description: "Trải nghiệm học tập minh bạch, nơi sự tiến bộ được đo lường chính xác và hỗ trợ liên tục.",
        mediaPath: "/kiemtratiendo.jpg",
      },
      {
        ...emptySection("courses", "feature"),
        label: "Khóa học",
        eyebrow: "Lộ trình học",
        title: "Chọn đúng khóa học cho mục tiêu band điểm",
        description: "Các chương trình IELTS được thiết kế theo trình độ đầu vào, mục tiêu đầu ra và nhịp học phù hợp.",
      },
      {
        ...emptySection("roadmap", "feature"),
        label: "Lộ trình đào tạo",
        eyebrow: "Lộ Trình Đào Tạo",
        title: "Hành trình bứt phá từ mất gốc đến Band điểm ước mơ",
        description: "Mỗi giai đoạn được thiết kế đồng bộ giúp bạn tự tin tiến bước mà không bị ngợp hay nản lòng.",
      },
      {
        ...emptySection("teachers", "feature"),
        label: "Đội ngũ giảng viên",
        eyebrow: "Đội Ngũ Giảng Viên",
        title: "Gặp gỡ các pháp sư IELTS đồng hành",
        description: "100% giảng viên sở hữu IELTS 8.0 - 8.5+ Overall và trực tiếp theo sát lộ trình của học viên.",
      },
      {
        ...emptySection("feedback", "social-proof"),
        label: "Phản hồi học viên",
        eyebrow: "Câu chuyện học viên",
        title: "Tiến bộ thật, phản hồi thật",
        description: "Những thay đổi trong điểm số và tư duy học tập của học viên là minh chứng cho một lộ trình đúng.",
      },
      {
        ...emptySection("consultation", "cta"),
        label: "Tư vấn miễn phí",
        eyebrow: "Tư Vấn Miễn Phí",
        title: "Nhận tư vấn lộ trình & test đầu vào 0đ",
        description: "Đội ngũ cố vấn chuyên môn sẽ đánh giá hổng kiến thức và đề xuất lộ trình tinh gọn nhất cho mục tiêu của bạn.",
        primaryCta: "Đăng ký tư vấn",
      },
    ],
    seoMetadata: {},
  };
}

function formatDate(value: string | null): string {
  if (!value) return "Chưa lưu";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa lưu";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

function statusTone(status: PublishStatus): string {
  if (status === "PUBLISHED") return "cms-status cms-status-success";
  if (status === "SCHEDULED") return "cms-status cms-status-info";
  if (status === "ARCHIVED") return "cms-status cms-status-muted";
  return "cms-status cms-status-draft";
}

function StatusBadge({ status }: { status: PublishStatus }) {
  return <span className={statusTone(status)}><span className="cms-status-dot" />{statusLabel[status]}</span>;
}

export function CmsContentPage() {
  const [activeTab, setActiveTab] = useState<CmsTab>("pages");
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [posts, setPosts] = useState<CmsPost[]>([]);
  const [banners, setBanners] = useState<CmsBanner[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [draft, setDraft] = useState<PageDraft | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState<"save" | "publish" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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
      const existingLandingPage = pageData.content.find((page) => page.slug === "trang-chu");
      const nextDraft = existingLandingPage ? draftFromPage(existingLandingPage) : currentLandingDraft();
      setDraft((current) => current ?? nextDraft);
      setSelectedSectionId((current) => current ?? nextDraft.sections[0]?.id ?? null);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không tải được nội dung CMS.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const itemCount = useMemo(() => ({ pages: pages.length || (draft ? 1 : 0), posts: posts.length, banners: banners.length, campaigns: campaigns.length }), [banners.length, campaigns.length, draft, pages.length, posts.length]);
  const selectedSection = draft?.sections.find((section) => section.id === selectedSectionId) ?? null;

  function openPage(page: CmsPage) {
    const nextDraft = draftFromPage(page);
    setDraft(nextDraft);
    setSelectedSectionId(nextDraft.sections[0]?.id ?? null);
    setNotice("");
    setError("");
  }

  function startEditingExistingPage() {
    const nextDraft = currentLandingDraft();
    setActiveTab("pages");
    setDraft(nextDraft);
    setSelectedSectionId(nextDraft.sections[0].id);
    setNotice("");
    setError("");
  }

  function updateDraft(field: "title" | "slug" | "excerpt", value: string) {
    setDraft((current) => current ? { ...current, [field]: value } : current);
    setNotice("");
  }

  function updateSection(field: keyof Pick<LandingSection, "label" | "eyebrow" | "title" | "description" | "primaryCta" | "secondaryCta" | "mediaPath">, value: string) {
    setDraft((current) => current ? {
      ...current,
      sections: current.sections.map((section) => section.id === selectedSectionId ? { ...section, [field]: value } : section),
    } : current);
    setNotice("");
  }

  function addSection(type: SectionType = "feature") {
    const nextId = `section-${(draft?.sections.length ?? 0) + 1}`;
    const nextSection = emptySection(nextId, type);
    setDraft((current) => current ? { ...current, sections: [...current.sections, nextSection] } : current);
    setSelectedSectionId(nextId);
    setNotice("");
  }

  function removeSection() {
    if (!draft || !selectedSection) return;
    if (!window.confirm("Xóa khu vực này khỏi bản nháp?")) return;
    const nextSections = draft.sections.filter((section) => section.id !== selectedSection.id);
    setDraft({ ...draft, sections: nextSections });
    setSelectedSectionId(nextSections[0]?.id ?? null);
    setNotice("");
  }

  function validateDraft(value: PageDraft): string | null {
    if (!value.title.trim()) return "Hãy nhập tên trang trước khi lưu.";
    if (!value.slug.trim()) return "Hãy nhập slug cho trang.";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug.trim())) return "Slug chỉ gồm chữ thường, số và dấu gạch ngang.";
    return null;
  }

  async function persistDraft(value: PageDraft): Promise<CmsPage | null> {
    const validationError = validateDraft(value);
    if (validationError) {
      setError(validationError);
      return null;
    }

    setSaving("save");
    setError("");
    setNotice("");
    const body = JSON.stringify({
      slug: value.slug.trim(),
      title: value.title.trim(),
      excerpt: value.excerpt.trim() || null,
      content: { sections: value.sections },
      seoMetadata: value.seoMetadata,
    });

    try {
      const saved = await apiFetch<CmsPage>(value.id ? `/social-media/cms/pages/${value.id}` : "/social-media/cms/pages", {
        method: value.id ? "PUT" : "POST",
        body,
      });
      setPages((current) => value.id ? current.map((page) => page.id === saved.id ? saved : page) : [saved, ...current]);
      const nextDraft = draftFromPage(saved);
      setDraft(nextDraft);
      setSelectedSectionId((current) => nextDraft.sections.some((section) => section.id === current) ? current : nextDraft.sections[0]?.id ?? null);
      setNotice("Đã lưu bản nháp.");
      return saved;
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không thể lưu nội dung landing page.");
      return null;
    } finally {
      setSaving(null);
    }
  }

  async function publishDraft() {
    if (!draft) return;
    setSaving("publish");
    const saved = await persistDraft(draft);
    if (!saved) {
      setSaving(null);
      return;
    }
    try {
      const published = await apiFetch<CmsPage>(`/social-media/cms/pages/${saved.id}/publication`, {
        method: "PATCH",
        body: JSON.stringify({ status: "PUBLISHED" }),
      });
      setPages((current) => current.map((page) => page.id === published.id ? published : page));
      setDraft(draftFromPage(published));
      setNotice("Landing page đã được xuất bản.");
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không thể xuất bản landing page.");
    } finally {
      setSaving(null);
    }
  }

  async function changePublication(type: PublicationType, id: string, status: PublishStatus) {
    setError("");
    setNotice("");
    try {
      if (type === "pages") {
        const page = await apiFetch<CmsPage>(`/social-media/cms/pages/${id}/publication`, { method: "PATCH", body: JSON.stringify({ status }) });
        setPages((current) => current.map((item) => item.id === id ? page : item));
        if (draft?.id === id) setDraft(draftFromPage(page));
      } else if (type === "posts") {
        const post = await apiFetch<CmsPost>(`/social-media/cms/posts/${id}/publication`, { method: "PATCH", body: JSON.stringify({ status }) });
        setPosts((current) => current.map((item) => item.id === id ? post : item));
      } else {
        const banner = await apiFetch<CmsBanner>(`/social-media/cms/banners/${id}/publication`, { method: "PATCH", body: JSON.stringify({ status }) });
        setBanners((current) => current.map((item) => item.id === id ? banner : item));
      }
      setNotice(`Đã cập nhật trạng thái thành ${statusLabel[status].toLowerCase()}.`);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không thể cập nhật trạng thái nội dung.");
    }
  }

  return (
    <div className="cms-page">
      <header className="cms-header">
        <div className="cms-breadcrumb"><Megaphone size={15} weight="fill" /> Nội dung truyền thông <ArrowRight size={14} /> Landing page</div>
        <div className="cms-header-row">
          <div>
            <p className="cms-eyebrow">CONTENT STUDIO</p>
            <div className="cms-title-line">
              <h1>Landing page</h1>
              {draft?.id ? <StatusBadge status={draft.status} /> : draft && <span className="cms-status cms-status-info"><span className="cms-status-dot" />Nội dung hiện tại</span>}
            </div>
            <p className="cms-header-description">Chỉnh sửa nội dung đang có trên trang chủ, xem trước thay đổi và xuất bản khi đã sẵn sàng.</p>
          </div>
          <div className="cms-header-actions">
            <button type="button" className="cms-button cms-button-secondary" onClick={() => setNotice("Bản xem trước đang hiển thị ở khu vực bên phải.")}><Eye size={17} /> Xem trước</button>
            <button type="button" className="cms-button cms-button-primary" onClick={() => draft ? void persistDraft(draft) : startEditingExistingPage()} disabled={saving !== null}><PencilSimple size={17} /> {saving === "save" ? "Đang lưu" : "Lưu nội dung hiện tại"}</button>
          </div>
        </div>
      </header>

      {error && <div className="cms-alert cms-alert-error" role="alert"><CircleNotch size={18} /><span>{error}</span><button type="button" onClick={() => setError("")}>Đóng</button></div>}
      {notice && <div className="cms-alert cms-alert-success" role="status"><CheckCircle size={18} weight="fill" /><span>{notice}</span><button type="button" onClick={() => setNotice("")}>Đóng</button></div>}

      <section className="cms-summary-bar" aria-label="Tóm tắt landing page">
        <div className="cms-summary-item cms-summary-item-primary"><span>ĐANG CHỈNH SỬA</span><strong>{draft?.title || "Trang chủ IELTS"}</strong><small>{draft?.slug ? `/${draft.slug}` : "Landing page hiện tại"}</small></div>
        <div className="cms-summary-item"><span>TRẠNG THÁI</span>{draft?.id ? <StatusBadge status={draft.status} /> : <strong className="cms-summary-status"><span className="cms-summary-dot" />Nội dung hiện tại</strong>}</div>
        <div className="cms-summary-item"><span>KHU VỰC</span><strong>{draft?.sections.length ?? 0} phần nội dung</strong><small>{draft?.sections.filter((section) => section.enabled).length ?? 0} đang hiển thị</small></div>
        <div className="cms-summary-item cms-summary-process"><span>QUY TRÌNH</span><strong>Chỉnh sửa <ArrowRight size={14} /> Lưu <ArrowRight size={14} /> Xuất bản</strong></div>
      </section>

      <nav className="cms-tabs" aria-label="Loại nội dung CMS">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = tab.id === activeTab;
          return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`cms-tab ${selected ? "cms-tab-active" : ""}`} aria-current={selected ? "page" : undefined} title={tab.description}><Icon size={18} /> <span>{tab.label}</span><strong>{itemCount[tab.id]}</strong></button>;
        })}
      </nav>

      {isLoading ? <div className="cms-loading" role="status"><SpinnerGap className="spin" size={20} /> Đang tải nội dung CMS...</div> : activeTab === "pages" ? (
        <LandingWorkspace pages={pages} draft={draft} selectedSection={selectedSection} selectedSectionId={selectedSectionId} saving={saving} onOpenPage={openPage} onEditExisting={startEditingExistingPage} onSelectSection={setSelectedSectionId} onUpdateDraft={updateDraft} onUpdateSection={updateSection} onAddSection={addSection} onRemoveSection={removeSection} onSave={() => draft ? void persistDraft(draft) : undefined} onPublish={() => void publishDraft()} />
      ) : (
        <section className="cms-table-card">
          <div className="cms-table-heading"><div><span className="cms-eyebrow">CONTENT LIBRARY</span><h2>{tabs.find((tab) => tab.id === activeTab)?.label}</h2></div><span className="cms-table-count">{itemCount[activeTab]} nội dung</span></div>
          {activeTab === "campaigns" ? <CampaignTable items={campaigns} /> : <ContentTable type={activeTab} items={activeTab === "posts" ? posts : banners} onPublication={changePublication} />}
        </section>
      )}
    </div>
  );
}

function LandingWorkspace({
  pages,
  draft,
  selectedSection,
  selectedSectionId,
  saving,
  onOpenPage,
  onEditExisting,
  onSelectSection,
  onUpdateDraft,
  onUpdateSection,
  onAddSection,
  onRemoveSection,
  onSave,
  onPublish,
}: {
  pages: CmsPage[];
  draft: PageDraft | null;
  selectedSection: LandingSection | null;
  selectedSectionId: string | null;
  saving: "save" | "publish" | null;
  onOpenPage: (page: CmsPage) => void;
  onEditExisting: () => void;
  onSelectSection: (id: string) => void;
  onUpdateDraft: (field: "title" | "slug" | "excerpt", value: string) => void;
  onUpdateSection: (field: keyof Pick<LandingSection, "label" | "eyebrow" | "title" | "description" | "primaryCta" | "secondaryCta" | "mediaPath">, value: string) => void;
  onAddSection: (type?: SectionType) => void;
  onRemoveSection: () => void;
  onSave: () => void;
  onPublish: () => void;
}) {
  if (!draft) {
    return <div className="cms-empty-workspace">
      <aside className="cms-outline-panel">
        <div className="cms-outline-heading"><div><span className="cms-eyebrow">PAGE STRUCTURE</span><h2>Landing page</h2></div><span className="cms-outline-count">0 trang</span></div>
        <div className="cms-outline-empty"><span className="cms-empty-icon"><FileText size={23} /></span><strong>Landing page hiện tại</strong><p>Mở nội dung đang có trên website để chỉnh sửa trực tiếp.</p><button type="button" className="cms-button cms-button-primary cms-button-full" onClick={onEditExisting}><PencilSimple size={17} /> Mở trình chỉnh sửa</button></div>
      </aside>
      <PreviewPanel draft={null} />
    </div>;
  }

  return <div className="cms-workspace">
    <aside className="cms-outline-panel">
      <div className="cms-outline-heading"><div><span className="cms-eyebrow">PAGE STRUCTURE</span><h2>{draft.title || "Trang mới"}</h2></div><span className="cms-outline-count">{draft.sections.length} khu vực</span></div>
      <div className="cms-page-picker">
        <label htmlFor="cms-page-picker">Trang đang chỉnh sửa</label>
        <select id="cms-page-picker" value={draft.id ?? "new"} onChange={(event) => { const page = pages.find((item) => item.id === event.target.value); if (page) onOpenPage(page); }}>
          {!draft.id && <option value="new">Trang chủ hiện tại</option>}
          {pages.map((page) => <option key={page.id} value={page.id}>{page.title}</option>)}
        </select>
      </div>
      <div className="cms-outline-list" aria-label="Các khu vực landing page">
        {draft.sections.length === 0 ? <div className="cms-outline-list-empty">Chưa có khu vực nào. Thêm khu vực để bắt đầu.</div> : draft.sections.map((section, index) => <button key={section.id} type="button" className={`cms-outline-item ${selectedSectionId === section.id ? "cms-outline-item-active" : ""}`} onClick={() => onSelectSection(section.id)}><span className="cms-outline-number">{String(index + 1).padStart(2, "0")}</span><span className="cms-outline-item-copy"><strong>{section.label || sectionTypeLabel[section.type]}</strong><small>{section.title || "Chưa có tiêu đề"}</small></span><span className={`cms-outline-state ${section.enabled ? "" : "cms-outline-state-off"}`} /> </button>)}
      </div>
      <button type="button" className="cms-add-section" onClick={() => onAddSection()}><Plus size={16} /> Thêm khu vực</button>
      <div className="cms-outline-footer"><div><span className="cms-status-dot cms-status-dot-live" />{draft.id ? statusLabel[draft.status] : "Nội dung hiện tại"}</div><small>{draft.id ? `Cập nhật ${formatDate(draft.updatedAt)}` : "Chưa đồng bộ vào CMS"}</small></div>
    </aside>

    <section className="cms-editor-panel">
      <div className="cms-editor-heading"><div><span className="cms-eyebrow">EDITOR</span><h2>Chỉnh sửa nội dung</h2></div><div className="cms-editor-actions"><button type="button" className="cms-icon-button" aria-label="Cấu hình SEO" title="Cấu hình SEO"><GearSix size={18} /></button><button type="button" className="cms-button cms-button-secondary" onClick={onSave} disabled={saving !== null}><FloppyDisk size={17} /> {saving === "save" ? "Đang lưu" : "Lưu thay đổi"}</button></div></div>
      <div className="cms-editor-scroll">
        <div className="cms-form-section"><div className="cms-form-section-heading"><div><span className="cms-form-index">01</span><div><h3>Thông tin cơ bản</h3><p>Thông tin hiển thị trên trình duyệt và kết quả tìm kiếm.</p></div></div><CheckCircle size={18} weight="fill" className="cms-form-check" /></div>
          <div className="cms-field-grid cms-field-grid-two"><Field label="Tên trang" value={draft.title} placeholder="Ví dụ: Trang chủ IELTS" onChange={(value) => onUpdateDraft("title", value)} /><Field label="Slug" value={draft.slug} placeholder="trang-chu" onChange={(value) => onUpdateDraft("slug", value)} helper="Chỉ dùng chữ thường, số và dấu gạch ngang." /></div>
          <Field label="Mô tả ngắn" value={draft.excerpt} placeholder="Một câu mô tả ngắn về trang đích" onChange={(value) => onUpdateDraft("excerpt", value)} multiline />
        </div>

        <div className="cms-form-section"><div className="cms-form-section-heading"><div><span className="cms-form-index">02</span><div><h3>Nội dung trang</h3><p>Chọn khu vực bên trái để chỉnh sửa từng phần của landing page.</p></div></div><span className="cms-section-count">{draft.sections.length} khu vực</span></div>
          {selectedSection ? <SectionEditor section={selectedSection} onUpdate={onUpdateSection} onRemove={onRemoveSection} /> : <div className="cms-editor-empty"><Layout size={23} /><strong>Chưa có khu vực được chọn</strong><span>Thêm một khu vực để bắt đầu xây dựng trang.</span><button type="button" className="cms-button cms-button-secondary" onClick={() => onAddSection("hero")}><Plus size={16} /> Thêm khu vực đầu tiên</button></div>}
        </div>
      </div>
      <div className="cms-editor-footer"><span><Clock size={15} /> Thay đổi chỉ hiển thị sau khi xuất bản</span><button type="button" className="cms-button cms-button-primary" onClick={onPublish} disabled={saving !== null || !draft.id} title={!draft.id ? "Lưu thay đổi lần đầu để kích hoạt xuất bản" : undefined}><Check size={17} weight="bold" /> {saving === "publish" ? "Đang xuất bản" : "Xuất bản landing page"}</button></div>
    </section>

    <PreviewPanel draft={draft} />
  </div>;
}

function Field({ label, value, placeholder, helper, multiline = false, onChange }: { label: string; value: string; placeholder: string; helper?: string; multiline?: boolean; onChange: (value: string) => void }) {
  return <label className="cms-field"><span>{label}</span>{multiline ? <textarea value={value} placeholder={placeholder} rows={3} onChange={(event) => onChange(event.target.value)} /> : <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />}{helper && <small>{helper}</small>}</label>;
}

function SectionEditor({ section, onUpdate, onRemove }: { section: LandingSection; onUpdate: (field: keyof Pick<LandingSection, "label" | "eyebrow" | "title" | "description" | "primaryCta" | "secondaryCta" | "mediaPath">, value: string) => void; onRemove: () => void }) {
  return <div className="cms-section-editor"><div className="cms-section-editor-top"><div className="cms-section-editor-type"><span className="cms-section-icon"><Layout size={18} /></span><div><strong>{sectionTypeLabel[section.type]}</strong><small>Khu vực nội dung</small></div></div><button type="button" className="cms-danger-button" onClick={onRemove}><Trash size={16} /> Xóa khu vực</button></div><div className="cms-field-grid cms-field-grid-two"><Field label="Tên khu vực" value={section.label} placeholder="Tên khu vực" onChange={(value) => onUpdate("label", value)} /><Field label="Nhãn nhỏ" value={section.eyebrow} placeholder="Ví dụ: Học IELTS có chiến lược" onChange={(value) => onUpdate("eyebrow", value)} /></div><Field label="Tiêu đề" value={section.title} placeholder="Tiêu đề chính của khu vực" onChange={(value) => onUpdate("title", value)} /><Field label="Nội dung mô tả" value={section.description} placeholder="Mô tả ngắn, rõ ràng và tập trung vào lợi ích của học viên." onChange={(value) => onUpdate("description", value)} multiline /><div className="cms-field-grid cms-field-grid-two"><Field label="Nút chính" value={section.primaryCta} placeholder="Tư vấn lộ trình" onChange={(value) => onUpdate("primaryCta", value)} /><Field label="Nút phụ" value={section.secondaryCta} placeholder="Xem khóa học" onChange={(value) => onUpdate("secondaryCta", value)} /></div><Field label="Đường dẫn hình ảnh" value={section.mediaPath} placeholder="/media/landing/hero.webp" helper="Có thể bổ sung sau khi kết nối thư viện media." onChange={(value) => onUpdate("mediaPath", value)} /></div>;
}

function PreviewPanel({ draft }: { draft: PageDraft | null }) {
  const hero = draft?.sections.find((section) => section.type === "hero") ?? draft?.sections[0];
  const rest = draft?.sections.filter((section) => section.id !== hero?.id && section.enabled).slice(0, 2) ?? [];
  return <section className="cms-preview-panel"><div className="cms-preview-heading"><div><span className="cms-eyebrow">LIVE PREVIEW</span><h2>Bản xem trước</h2></div><div className="cms-preview-device-toggle"><button type="button" className="is-active" aria-label="Xem trên desktop"><Monitor size={16} /></button><button type="button" aria-label="Xem trên điện thoại"><DeviceMobile size={16} /></button></div></div><div className="cms-preview-frame"><div className="cms-preview-browser"><span /><span /><span /><small>theieltsspells.vn</small></div><div className="cms-preview-site"><div className="cms-preview-nav"><div className="cms-preview-logo"><span>✦</span><strong>THE IELTS SPELLS</strong></div><div className="cms-preview-nav-links"><span>Về chúng tôi</span><span>Khóa học</span><span>Liên hệ</span></div><button>Đăng ký</button></div>{!draft ? <div className="cms-preview-placeholder"><Globe size={32} /><strong>Chưa tải được landing page</strong><span>Thử mở lại nội dung hiện tại để xem trước.</span></div> : <><div className="cms-preview-hero"><div className="cms-preview-hero-copy"><small>{hero?.eyebrow || "HERO SECTION"}</small><h3>{hero?.title || "Thêm tiêu đề cho landing page"}</h3><p>{hero?.description || "Mô tả ngắn sẽ xuất hiện ở khu vực này để khách truy cập hiểu rõ giá trị bạn mang lại."}</p><div className="cms-preview-hero-actions">{hero?.primaryCta && <button>{hero.primaryCta}</button>}{hero?.secondaryCta && <button className="secondary">{hero.secondaryCta}</button>}</div></div><div className="cms-preview-art"><ImageSquare size={28} /><span>{hero?.mediaPath ? "Đã có hình ảnh" : "Khu vực hình ảnh"}</span></div></div>{rest.length > 0 && <div className="cms-preview-sections">{rest.map((section) => <div key={section.id}><small>{section.eyebrow || sectionTypeLabel[section.type].toUpperCase()}</small><strong>{section.title || "Tiêu đề khu vực"}</strong></div>)}</div>}</>}</div></div><div className="cms-preview-footnote"><span><span className="cms-preview-live-dot" /> Cập nhật theo nội dung đang chỉnh sửa</span><span>{draft?.id ? statusLabel[draft.status] : "Chưa đồng bộ CMS"}</span></div></section>;
}

function ContentTable({ type, items, onPublication }: { type: Exclude<CmsTab, "campaigns" | "pages">; items: (CmsPost | CmsBanner)[]; onPublication: (type: PublicationType, id: string, status: PublishStatus) => Promise<void> }) {
  return <div className="cms-data-table-wrap"><table className="cms-data-table"><thead><tr><th>Nội dung</th><th>Vị trí / Slug</th><th>Trạng thái</th><th className="text-right">Thao tác</th></tr></thead><tbody>{items.length === 0 ? <tr><td colSpan={4}><div className="cms-table-empty"><FileText size={23} /><strong>Chưa có nội dung</strong><span>Dữ liệu sẽ hiển thị ở đây sau khi được tạo từ CMS.</span></div></td></tr> : items.map((item) => { const isBanner = "position" in item; const subtitle = "subtitle" in item ? item.subtitle : item.excerpt; const reference = isBanner ? item.position : item.slug; return <tr key={item.id}><td><strong>{item.title}</strong>{subtitle && <small>{subtitle}</small>}</td><td><code>{reference}</code></td><td><StatusBadge status={item.status} /></td><td><div className="cms-table-actions">{item.status !== "PUBLISHED" && <button type="button" onClick={() => void onPublication(type, item.id, "PUBLISHED")}><Check size={15} /> Xuất bản</button>}{item.status !== "ARCHIVED" && <button type="button" className="muted" onClick={() => void onPublication(type, item.id, "ARCHIVED")}><Clock size={15} /> Lưu trữ</button>}</div></td></tr>; })}</tbody></table></div>;
}

function CampaignTable({ items }: { items: Campaign[] }) {
  return <div className="cms-data-table-wrap"><table className="cms-data-table"><thead><tr><th>Chiến dịch</th><th>Mã chiến dịch</th><th>Nguồn</th><th>Trạng thái</th></tr></thead><tbody>{items.length === 0 ? <tr><td colSpan={4}><div className="cms-table-empty"><Megaphone size={23} /><strong>Chưa có chiến dịch</strong><span>Tạo chiến dịch để theo dõi hiệu quả các nguồn truy cập.</span></div></td></tr> : items.map((campaign) => <tr key={campaign.id}><td><strong>{campaign.name}</strong><small>{campaign.startsAt ? formatDate(campaign.startsAt) : "Chưa đặt thời gian"}</small></td><td><code>{campaign.campaignCode || "Chưa có mã"}</code></td><td>{campaign.source || "Chưa có nguồn"}{campaign.medium ? ` / ${campaign.medium}` : ""}</td><td><span className={`cms-status ${campaign.active ? "cms-status-success" : "cms-status-muted"}`}><span className="cms-status-dot" />{campaign.active ? "Đang chạy" : "Tạm dừng"}</span></td></tr>)}</tbody></table></div>;
}

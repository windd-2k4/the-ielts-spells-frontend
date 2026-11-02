import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Database,
  LinkSimple,
  WarningCircle,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/AdminUi";
import { apiFetch } from "../lib/api";

interface KnowledgeGraph {
  enabled: boolean;
  components: KnowledgeComponent[];
  relations: KnowledgeRelation[];
}

interface KnowledgeComponent {
  code: string;
  name: string;
  description: string | null;
  skill: string;
  active: boolean;
  questionTypeMappings: number;
  questionMappings: number;
  contentMappings: number;
  learnersWithEvidence: number;
}

interface KnowledgeRelation {
  prerequisiteCode: string;
  targetCode: string;
  relationType: "PREREQUISITE" | "SUPPORTS";
}

export function AdaptiveKnowledgeMapPage() {
  const [graph, setGraph] = useState<KnowledgeGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setGraph(await apiFetch<KnowledgeGraph>("/admin/adaptive-learning/knowledge-map"));
    } catch (value) {
      setError(value instanceof Error ? value.message : "Không tải được bản đồ kiến thức");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const componentNames = useMemo(
    () => new Map(graph?.components.map((component) => [component.code, component.name]) ?? []),
    [graph],
  );

  return (
    <section className="mx-auto w-full max-w-[1440px] space-y-6">
      <PageHeader
        eyebrow="AI & CÁ NHÂN HÓA"
        title="Bản đồ kiến thức"
        description="Kiểm tra kỹ năng con, quan hệ hỗ trợ và độ phủ dữ liệu trước khi engine dùng chúng để suy luận."
        action={(
          <Link
            to="/adaptive-learning"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-outline-variant/60 bg-surface px-4 text-sm font-bold text-on-surface hover:bg-surface-container"
          >
            <ArrowLeft size={17} /> Tổng quan
          </Link>
        )}
      />

      {error ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-error/20 bg-error-container/10 p-4 text-error">
          <span className="flex items-center gap-2 text-sm font-semibold"><WarningCircle size={22} />{error}</span>
          <button type="button" className="min-h-10 rounded-xl border border-error/30 px-3 text-sm font-bold" onClick={() => void load()}>Thử lại</button>
        </div>
      ) : null}

      {loading ? <KnowledgeMapSkeleton /> : null}

      {graph ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Summary label="Knowledge components" value={graph.components.length} icon={<Database size={20} />} />
            <Summary label="Quan hệ kiến thức" value={graph.relations.length} icon={<LinkSimple size={20} />} />
            <Summary
              label="Nút thiếu học liệu"
              value={graph.components.filter((component) => component.contentMappings === 0).length}
              icon={<BookOpenText size={20} />}
            />
          </div>

          {graph.components.length === 0 ? (
            <div className="rounded-2xl border border-outline-variant/40 bg-surface p-10 text-center">
              <h2 className="font-display text-lg font-bold text-on-surface">Chưa có knowledge component</h2>
              <p className="mt-2 text-sm text-on-surface-variant">Chạy migration V086 để tạo cấu trúc Reading ban đầu.</p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {graph.components.map((component) => (
                <article key={component.code} className="rounded-2xl border border-outline-variant/40 bg-surface p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-display text-lg font-bold text-on-surface">{component.name}</h2>
                        {!component.active ? <span className="rounded-full bg-surface-container px-2 py-1 text-xs font-bold text-on-surface-variant">Đã tắt</span> : null}
                      </div>
                      <code className="mt-1 block text-xs font-semibold text-primary">{component.code}</code>
                    </div>
                    <span className="rounded-full bg-primary-container/15 px-3 py-1 text-xs font-bold text-primary">{component.skill}</span>
                  </div>
                  <p className="mt-4 min-h-10 text-sm leading-6 text-on-surface-variant">{component.description ?? "Chưa có mô tả."}</p>
                  <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Count label="Dạng câu" value={component.questionTypeMappings} warning={component.questionTypeMappings === 0} />
                    <Count label="Câu hỏi" value={component.questionMappings} />
                    <Count label="Học liệu" value={component.contentMappings} warning={component.contentMappings === 0} />
                    <Count label="Học viên" value={component.learnersWithEvidence} />
                  </dl>
                </article>
              ))}
            </div>
          )}

          <article className="rounded-2xl border border-outline-variant/40 bg-surface p-5">
            <h2 className="font-display text-lg font-bold text-on-surface">Quan hệ kiến thức</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Các cạnh hiện được engine dùng để mô tả cấu trúc, chưa tự động lan truyền điểm mastery.</p>
            {graph.relations.length === 0 ? (
              <p className="mt-5 rounded-xl bg-surface-container p-4 text-sm text-on-surface-variant">Chưa có quan hệ nào được khai báo.</p>
            ) : (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {graph.relations.map((relation) => (
                  <div key={`${relation.prerequisiteCode}:${relation.targetCode}:${relation.relationType}`} className="flex items-center gap-3 rounded-xl bg-surface-container p-4 text-sm">
                    <strong className="text-on-surface">{componentNames.get(relation.prerequisiteCode) ?? relation.prerequisiteCode}</strong>
                    <ArrowRight size={18} className="shrink-0 text-primary" />
                    <span className="text-on-surface-variant">{componentNames.get(relation.targetCode) ?? relation.targetCode}</span>
                    <span className="ml-auto text-xs font-bold text-primary">{relation.relationType}</span>
                  </div>
                ))}
              </div>
            )}
          </article>
        </>
      ) : null}
    </section>
  );
}

function Summary({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return <div className="flex items-center justify-between rounded-2xl border border-outline-variant/40 bg-surface p-5"><div><p className="text-sm font-semibold text-on-surface-variant">{label}</p><strong className="mt-1 block font-display text-3xl text-on-surface">{value}</strong></div><span className="text-primary">{icon}</span></div>;
}

function Count({ label, value, warning = false }: { label: string; value: number; warning?: boolean }) {
  return <div className={`rounded-xl p-3 ${warning ? "bg-amber-50 text-amber-800" : "bg-surface-container text-on-surface"}`}><dt className="text-xs font-semibold">{label}</dt><dd className="mt-1 text-lg font-bold">{value}</dd></div>;
}

function KnowledgeMapSkeleton() {
  return <div className="grid gap-4 lg:grid-cols-2" aria-label="Đang tải bản đồ kiến thức"><div className="h-52 animate-pulse rounded-2xl bg-surface" /><div className="h-52 animate-pulse rounded-2xl bg-surface" /></div>;
}

import { useState } from "react";
import { ContentHub } from "../components/library/ContentHubLive";
import LibraryWorkspace from "../components/library/LibraryWorkspace";
import { TestBankWorkspace } from "../components/test-bank/TestBankWorkspace";
import { MediaLibraryWorkspace } from "../components/media/MediaLibraryWorkspace";
import BulkImportWizardModal from "../components/library/BulkImportWizardModal";
import LibraryItemModal from "../components/library/LibraryItemModal";

export function LearningLibraryPage() {
  const [activeSubTab, setActiveSubTab] = useState<"HUB" | "MATERIALS" | "TEST_BANK" | "MEDIA">("HUB");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);

  return (
    <div className="mx-auto max-w-[1480px] space-y-6">
      {/* Sub-tab Navigation Header */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-[#e3dce2] pb-3" role="tablist" aria-label="Không gian nội dung đào tạo">
        <button
          onClick={() => setActiveSubTab("HUB")}
          role="tab"
          aria-selected={activeSubTab === "HUB"}
          className={`min-h-[38px] rounded-xl px-4 text-xs font-bold transition ${
            activeSubTab === "HUB"
              ? "bg-[#8f4458] text-white shadow-sm"
              : "text-[#746A6E] hover:bg-[#f1eef4]"
          }`}
        >
          Tổng quan Content Hub
        </button>
        <button
          onClick={() => setActiveSubTab("MATERIALS")}
          role="tab"
          aria-selected={activeSubTab === "MATERIALS"}
          className={`min-h-[38px] rounded-xl px-4 text-xs font-bold transition ${
            activeSubTab === "MATERIALS"
              ? "bg-[#8f4458] text-white shadow-sm"
              : "text-[#746A6E] hover:bg-[#f1eef4]"
          }`}
        >
          Kho học liệu
        </button>
        <button
          onClick={() => setActiveSubTab("TEST_BANK")}
          role="tab"
          aria-selected={activeSubTab === "TEST_BANK"}
          className={`min-h-[38px] rounded-xl px-4 text-xs font-bold transition ${
            activeSubTab === "TEST_BANK"
              ? "bg-[#8f4458] text-white shadow-sm"
              : "text-[#746A6E] hover:bg-[#f1eef4]"
          }`}
        >
          Ngân hàng đề
        </button>
        <button
          onClick={() => setActiveSubTab("MEDIA")}
          role="tab"
          aria-selected={activeSubTab === "MEDIA"}
          className={`min-h-[38px] rounded-xl px-4 text-xs font-bold transition ${
            activeSubTab === "MEDIA"
              ? "bg-[#8f4458] text-white shadow-sm"
              : "text-[#746A6E] hover:bg-[#f1eef4]"
          }`}
        >
          Kho Media Library
        </button>
      </div>

      {/* Render selected view */}
      {activeSubTab === "HUB" && (
        <ContentHub
          onOpenAddMaterial={() => setShowAddModal(true)}
          onOpenBulkImport={() => setShowBulkImportModal(true)}
          onOpenNewTest={() => setActiveSubTab("TEST_BANK")}
          onNavigateTab={(tab) => setActiveSubTab(tab)}
        />
      )}

      {activeSubTab === "MATERIALS" && <LibraryWorkspace />}

      {activeSubTab === "TEST_BANK" && (
        <TestBankWorkspace onOpenBulkImport={() => setShowBulkImportModal(true)} />
      )}

      {activeSubTab === "MEDIA" && <MediaLibraryWorkspace />}

      {/* Global Modals */}
      {showAddModal && (
        <LibraryItemModal
          open={showAddModal}
          view="RESOURCES"
          skill="LISTENING"
          item={null}
          courses={[]}
          onClose={() => setShowAddModal(false)}
          onSaved={async () => {
            setShowAddModal(false);
          }}
        />
      )}

      {showBulkImportModal && (
        <BulkImportWizardModal onClose={() => setShowBulkImportModal(false)} />
      )}
    </div>
  );
}

import { useState } from "react";
import { TestBankWorkspace } from "../components/test-bank/TestBankWorkspace";
import BulkImportWizardModal from "../components/library/BulkImportWizardModal";

export function TestBankPage() {
  const [showBulkImport, setShowBulkImport] = useState(false);

  return (
    <div className="mx-auto max-w-[1480px]">
      <TestBankWorkspace onOpenBulkImport={() => setShowBulkImport(true)} />
      {showBulkImport && <BulkImportWizardModal onClose={() => setShowBulkImport(false)} />}
    </div>
  );
}

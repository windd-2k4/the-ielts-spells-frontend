import { useNavigate } from "react-router-dom";
import { AiTestImportModal } from "../components/test-bank/AiTestImportModal";

export function AiTestImportPage() {
  const navigate = useNavigate();

  return (
    <AiTestImportModal
      onClose={() => navigate("/test-bank")}
      onSuccess={(createdTest) => navigate(`/test-builder/${createdTest.skill.toLowerCase()}/${createdTest.id}`)}
    />
  );
}

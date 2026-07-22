import { CheckCircle, SpinnerGap, WarningCircle } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import logo from "../../assest/logo.jpg";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function completeAuth() {
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError && mounted) {
          setError("Liên kết xác thực không hợp lệ hoặc đã hết hạn.");
          return;
        }
      }
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (data.session) {
        navigate("/activate-account", { replace: true });
      } else {
        setError("Không tìm thấy phiên đăng nhập. Vui lòng thử lại.");
      }
    }
    void completeAuth();
    return () => { mounted = false; };
  }, [navigate]);

  return (
    <main className="callback-page">
      <img src={logo} alt="The IELTS Spells" />
      {error ? <WarningCircle weight="fill" /> : <SpinnerGap className="spin" />}
      <h1>{error ? "Chưa thể xác thực" : "Đang hoàn tất đăng nhập"}</h1>
      <p>{error || "Vui lòng chờ trong giây lát."}</p>
      {error && <Link to="/login"><CheckCircle /> Quay lại đăng nhập</Link>}
    </main>
  );
}

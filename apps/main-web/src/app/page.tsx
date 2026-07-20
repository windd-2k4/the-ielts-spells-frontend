import { BrandMark, Button } from "@ielts/ui";

export default function Home() {
  return <main className="shell">
    <header className="header"><BrandMark/><nav className="nav"><a href="#courses">Khóa học</a><a href="#roadmap">Lộ trình</a><a href="#teachers">Giáo viên</a><a href="#blog">Blog</a></nav><Button>Đăng nhập</Button></header>
    <section className="hero"><div><div className="eyebrow">IELTS learning, made magical</div><h1>Cast the Spells.<br/>Claim the Band.</h1><p>Lộ trình IELTS rõ ràng, theo dõi tiến độ từng kỹ năng và nhận phản hồi Writing chuyên sâu từ giáo viên kết hợp AI.</p><div className="actions"><Button>Đăng ký tư vấn</Button><Button style={{background:"transparent",color:"var(--text)",border:"1px solid var(--border)"}}>Khám phá khóa học</Button></div></div><div className="visual"><div className="book">📖✨</div></div></section>
    <section className="stats"><div className="stat"><strong>8.5 IELTS</strong><span>Đội ngũ giáo viên</span></div><div className="stat"><strong>1–1.5 band</strong><span>Mục tiêu sau khóa học</span></div><div className="stat"><strong>4 kỹ năng</strong><span>Theo dõi trên một hệ thống</span></div></section>
  </main>;
}

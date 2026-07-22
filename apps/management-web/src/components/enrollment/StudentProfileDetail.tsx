import { useState, useEffect } from "react";
import { 
  Phone, 
  Envelope, 
  MapPin, 
  Users, 
  CalendarBlank, 
  CheckCircle, 
  Student, 
  Sparkle,
  Notebook,
  PaperPlane,
  Pen
} from "@phosphor-icons/react";
import { stableMetric } from "../../lib/stable-metric";

interface StudentProfileDetailProps {
  studentId: string;
  onClose?: () => void;
}

interface StudentProfile {
  id: string;
  studentCode: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  parentName: string;
  parentPhone: string;
  roadmapName: string;
  startBand: number;
  currentBand: number;
  targetBand: number;
  attendanceRate: number;
  homeworkRate: number;
  classesList: string;
  classSchedule: string;
  skills: {
    listening: number;
    reading: number;
    writing: number;
    speaking: number;
  };
  logs: {
    time: string;
    action: string;
    details: string;
    type: "primary" | "tertiary" | "default";
  }[];
  coachNote: string;
}

export default function StudentProfileDetail({ studentId, onClose }: StudentProfileDetailProps) {
  const [profile, setProfile] = useState<StudentProfile | null>(null);

  // Generate deterministic student profile details based on studentId
  useEffect(() => {
    const seed = studentId || "student-1";
    const metric = stableMetric(seed, 10);
    
    let fullName = "Nguyễn Minh Anh";
    let studentCode = "HV-2024-889";
    let email = "minhanh.ng@gmail.com";
    let phone = "0987 654 321";
    let address = "25/12 Ba Đình, Hà Nội";
    let parentName = "Chị Lan (Mẹ)";
    let parentPhone = "0901 223 445";
    let roadmapName = "Chinh phục IELTS 7.5+ (6 tháng)";
    let startBand = 5.0;
    let currentBand = 6.5;
    let targetBand = 7.5;
    let attendanceRate = 94;
    let homeworkRate = 88;
    let classesList = "Foundation 12.A & Writing Intensive";
    let classSchedule = "Sáng Thứ 2, 4, 6";
    let coachNote = "Minh Anh có tư duy logic tốt ở phần Reading. Cần tập trung cải thiện ngữ pháp phức trong Writing.";
    
    // Vary based on student selection
    if (seed === "student-2") {
      fullName = "Lê Thu Thảo";
      studentCode = "HV-2024-512";
      email = "thuthao.le@gmail.com";
      phone = "0912 888 999";
      address = "12 Trần Hưng Đạo, Hoàn Kiếm, HN";
      parentName = "Anh Hùng (Bố)";
      parentPhone = "0934 555 666";
      roadmapName = "Giao tiếp & Học thuật IELTS 6.5+";
      startBand = 4.5;
      currentBand = 5.5;
      targetBand = 6.5;
      attendanceRate = 90;
      homeworkRate = 82;
      classesList = "Spoken IELTS 10.B & Reading Basics";
      classSchedule = "Tối Thứ 3, 5, 7";
      coachNote = "Thảo nói tự tin nhưng phát âm nguyên âm dài cần điều chỉnh. Cố gắng ghi âm shadowing nhiều hơn.";
    } else if (seed === "student-3") {
      fullName = "Trần Việt Hoàng";
      studentCode = "HV-2024-205";
      email = "viethoang.t@gmail.com";
      phone = "0903 444 555";
      address = "Phố Huế, Hai Bà Trưng, HN";
      parentName = "Chị Mai (Mẹ)";
      parentPhone = "0988 222 333";
      roadmapName = "IELTS Intensive Cấp tốc 7.0";
      startBand = 5.5;
      currentBand = 6.5;
      targetBand = 7.0;
      attendanceRate = 96;
      homeworkRate = 92;
      classesList = "IELTS FastTrack 8 & Grammar Review";
      classSchedule = "Tối Thứ 2, 4, 6";
      coachNote = "Hoàng học lực đồng đều. Điểm viết luận có cải thiện tốt ở từ vựng học thuật.";
    } else if (seed !== "student-1") {
      // General mock name
      const firstNames = ["Nguyễn", "Trần", "Lê", "Phạm", "Vũ"];
      const middleNames = ["Hồng", "Việt", "Thị", "Khánh", "Văn"];
      const lastNames = ["Nam", "Thảo", "Huy", "My", "Trang"];
      
      const fIndex = stableMetric(seed, 1) % firstNames.length;
      const mIndex = stableMetric(seed, 2) % middleNames.length;
      const lIndex = stableMetric(seed, 3) % lastNames.length;
      
      fullName = `${firstNames[fIndex]} ${middleNames[mIndex]} ${lastNames[lIndex]}`;
      studentCode = `HV-2026-${stableMetric(seed, 4, 100, 899)}`;
      email = `${lastNames[lIndex].toLowerCase()}.${middleNames[mIndex].toLowerCase()}@gmail.com`;
      phone = `09${stableMetric(seed, 5, 10, 9)} ${stableMetric(seed, 6, 100, 899)} ${stableMetric(seed, 7, 100, 899)}`;
      address = `${stableMetric(seed, 8, 10, 89)} Cầu Giấy, Hà Nội`;
      parentName = "Phụ huynh học viên";
      parentPhone = `09${stableMetric(seed, 9, 10, 9)} 123 456`;
      roadmapName = "Chinh phục IELTS 6.5+";
      startBand = 4.0;
      currentBand = 5.5;
      targetBand = 6.5;
      attendanceRate = stableMetric(seed, 10, 80, 20);
      homeworkRate = stableMetric(seed, 11, 75, 23);
      classesList = "Pre-IELTS 15 & Listening Practice";
      classSchedule = "Chiều Thứ 3, 5, 7";
      coachNote = "Học viên chuyên cần, cần làm nhiều bài tập đọc để làm quen với từ vựng học thuật.";
    }

    // Set skills band scores
    const listening = stableMetric(seed, 12, 45, 45) / 10; // e.g. 4.5 to 9.0
    const reading = stableMetric(seed, 13, 40, 50) / 10;
    const writing = stableMetric(seed, 14, 45, 40) / 10;
    const speaking = stableMetric(seed, 15, 45, 45) / 10;

    // Set mock timeline logs
    const logs = [
      {
        time: "Hôm nay, 14:30",
        action: "Nộp bài tập Writing Task 2",
        details: "Chủ đề: Environmental Protection",
        type: "primary" as const
      },
      {
        time: "Hôm qua, 09:00",
        action: "Hoàn thành bài Test Reading",
        details: `Đạt điểm: ${reading.toFixed(1)} Band (${stableMetric(seed, 16, 20, 19)}/40 câu)`,
        type: "tertiary" as const
      },
      {
        time: "12 Th05, 18:00",
        action: "Điểm danh Lớp học",
        details: "Trạng thái: Có mặt (Muộn 10p)",
        type: "default" as const
      },
      {
        time: "10 Th05, 11:15",
        action: "Đăng ký khóa học mới",
        details: `Đăng ký thành công lớp ${classesList.split("&")[0]}`,
        type: "primary" as const
      }
    ];

    setProfile({
      id: seed,
      studentCode,
      fullName,
      email,
      phone,
      address,
      parentName,
      parentPhone,
      roadmapName,
      startBand,
      currentBand,
      targetBand,
      attendanceRate,
      homeworkRate,
      classesList,
      classSchedule,
      skills: {
        listening,
        reading,
        writing,
        speaking
      },
      logs,
      coachNote
    });
  }, [studentId]);

  if (!profile) return <p className="text-center py-10 font-semibold">Đang tải hồ sơ học viên...</p>;

  // SVG Radar coordinates math
  // Center is at 100, 100
  // R max is 80 (representing Band 9.0)
  const getRadarPoint = (score: number, angle: number) => {
    const maxVal = 9.0;
    const radius = (score / maxVal) * 80;
    const radians = (angle * Math.PI) / 180;
    const x = 100 + radius * Math.cos(radians);
    const y = 100 - radius * Math.sin(radians);
    return `${x},${y}`;
  };

  // Angle: L(90 deg - top), R(0 deg - right), W(270 deg - bottom), S(180 deg - left)
  const listeningPoint = getRadarPoint(profile.skills.listening, 90);
  const readingPoint = getRadarPoint(profile.skills.reading, 0);
  const writingPoint = getRadarPoint(profile.skills.writing, 270);
  const speakingPoint = getRadarPoint(profile.skills.speaking, 180);
  const polyPoints = `${listeningPoint} ${readingPoint} ${writingPoint} ${speakingPoint}`;

  return (
    <div className="space-y-6">
      {/* Student Profile Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface p-5 border border-outline-variant/30 rounded-3xl shadow-sm relative overflow-hidden">
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors"
          >
            ✕
          </button>
        )}
        
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative shrink-0">
            {/* Avatar cutout sticker border style */}
            <div className="w-20 h-20 rounded-full border-4 border-white bg-primary-container/20 text-primary flex items-center justify-center font-display font-black text-2xl shadow-md">
              {profile.fullName.charAt(0)}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide border border-white">
              Active
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-2xl font-extrabold text-on-surface">{profile.fullName}</h2>
              <span className="bg-surface-container px-2.5 py-0.5 rounded-lg text-xs font-extrabold text-on-surface-variant font-mono">
                {profile.studentCode}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant flex items-center gap-1 font-bold">
              <Sparkle size={14} className="text-primary animate-pulse" />
              Lộ trình: {profile.roadmapName}
            </p>
          </div>
        </div>

        <div className="flex gap-2 shrink-0 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none px-4 py-2 border border-primary text-primary rounded-xl font-bold text-xs hover:bg-primary-container/10 transition-all flex items-center justify-center gap-1">
            <Pen size={14} />
            Sửa thông tin
          </button>
          <button className="flex-1 sm:flex-none px-4 py-2 bg-primary text-on-primary rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1">
            <PaperPlane size={14} />
            Gửi thông báo
          </button>
        </div>
      </section>

      {/* Grid Bento Layout */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Column: Personal info & bento metrics */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Contact Details Card */}
          <div className="bg-surface border border-outline-variant/40 p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-display text-base font-extrabold text-on-surface border-b border-outline-variant/20 pb-2 flex items-center gap-1.5">
              <Notebook size={18} className="text-primary" />
              Thông tin cá nhân
            </h3>
            
            <div className="space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary shrink-0">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Số điện thoại</p>
                  <p className="text-sm font-extrabold text-on-surface">{profile.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary shrink-0">
                  <Envelope size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Email liên hệ</p>
                  <p className="text-sm font-extrabold text-on-surface truncate max-w-[200px]">{profile.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary shrink-0">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Địa chỉ</p>
                  <p className="text-sm font-extrabold text-on-surface">{profile.address}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-outline-variant/20 pt-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700 shrink-0">
                  <Users size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Liên hệ phụ huynh</p>
                  <p className="text-xs font-bold text-on-surface">{profile.parentName}</p>
                  <p className="text-xs text-on-surface font-extrabold mt-0.5">{profile.parentPhone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bento Stats Panel */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-primary text-on-primary p-4 rounded-2xl flex flex-col justify-between shadow-sm h-28">
              <CalendarBlank size={20} />
              <div>
                <p className="text-2xl font-black tabular-nums">{profile.attendanceRate}%</p>
                <p className="text-[10px] opacity-80 font-bold uppercase tracking-wider mt-0.5">Điểm danh (Attendance)</p>
              </div>
            </div>
            <div className="bg-primary-container/20 text-primary border border-primary/10 p-4 rounded-2xl flex flex-col justify-between shadow-sm h-28">
              <CheckCircle size={20} />
              <div>
                <p className="text-2xl font-black tabular-nums">{profile.homeworkRate}%</p>
                <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mt-0.5">Hoàn thành bài tập</p>
              </div>
            </div>
            <div className="bg-surface border border-outline-variant/40 p-4 rounded-2xl flex flex-col justify-between shadow-sm h-28 col-span-2">
              <div className="flex justify-between items-start">
                <Student size={20} className="text-primary" />
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] font-black uppercase border border-primary/20">
                  02 Lớp học
                </span>
              </div>
              <div>
                <p className="text-sm font-black text-on-surface">{profile.classesList}</p>
                <p className="text-[10px] text-on-surface-variant font-semibold mt-0.5">{profile.classSchedule}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column: Roadmap Progress & SVG Radar Skills chart */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          {/* Target Roadmap progress slider */}
          <div className="bg-surface border border-outline-variant/40 p-5 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display text-base font-extrabold text-on-surface">Tiến trình lộ trình</h3>
              <span className="bg-primary-container/30 text-primary text-xs font-extrabold px-3 py-1 rounded-full border border-primary/20">
                Target: {profile.targetBand.toFixed(1)}
              </span>
            </div>
            
            <div className="relative pt-8 pb-3 px-2">
              {/* Progress Slider track */}
              <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden relative">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: "72%" }} 
                />
              </div>

              {/* Milestones markers */}
              <div className="absolute top-1 left-[15%] flex flex-col items-center">
                <div className="text-[9px] font-bold text-on-surface-variant">Đầu vào</div>
                <div className="w-[1.5px] h-3 bg-outline-variant mt-0.5"></div>
                <div className="mt-2 font-black text-xs text-on-surface">{profile.startBand.toFixed(1)}</div>
              </div>

              <div className="absolute top-1 left-[72%] flex flex-col items-center">
                <div className="text-[9px] font-black text-primary">Hiện tại</div>
                <div className="w-[1.5px] h-3 bg-primary mt-0.5"></div>
                <div className="mt-1 font-black text-lg text-primary">{profile.currentBand.toFixed(1)}</div>
              </div>

              <div className="absolute top-1 left-[92%] flex flex-col items-center">
                <div className="text-[9px] font-bold text-on-surface-variant">Đầu ra</div>
                <div className="w-[1.5px] h-3 bg-outline-variant mt-0.5"></div>
                <div className="mt-2 font-black text-xs text-on-surface">{profile.targetBand.toFixed(1)}</div>
              </div>
            </div>
          </div>

          {/* SVG Radar Spider Skills chart */}
          <div className="bg-surface border border-outline-variant/40 p-5 rounded-2xl shadow-sm">
            <h3 className="font-display text-base font-extrabold text-on-surface mb-3">Biểu đồ phân tích kỹ năng</h3>
            
            <div className="flex justify-center items-center py-6 relative">
              <svg className="w-56 h-56 overflow-visible" viewBox="0 0 200 200">
                {/* SVG Concentric Pentagonal Web representing Bands */}
                <polygon points="100,20 180,100 100,180 20,100" className="stroke-outline-variant/50 fill-none" strokeWidth="1" strokeDasharray="3" />
                <polygon points="100,40 160,100 100,160 40,100" className="stroke-outline-variant/50 fill-none" strokeWidth="1" strokeDasharray="3" />
                <polygon points="100,60 140,100 100,140 60,100" className="stroke-outline-variant/50 fill-none" strokeWidth="1" strokeDasharray="3" />
                <polygon points="100,80 120,100 100,120 80,100" className="stroke-outline-variant/50 fill-none" strokeWidth="1" strokeDasharray="3" />

                {/* Main Axis lines */}
                <line x1="100" y1="20" x2="100" y2="180" className="stroke-outline-variant/50" strokeWidth="1" />
                <line x1="20" y1="100" x2="180" y2="100" className="stroke-outline-variant/50" strokeWidth="1" />

                {/* Legend Labels */}
                <text x="100" y="10" className="text-[10px] font-black fill-primary" textAnchor="middle">Listening</text>
                <text x="192" y="104" className="text-[10px] font-black fill-primary" textAnchor="start">Reading</text>
                <text x="100" y="196" className="text-[10px] font-black fill-primary" textAnchor="middle">Writing</text>
                <text x="8" y="104" className="text-[10px] font-black fill-primary" textAnchor="end">Speaking</text>

                {/* Inner Filled Radar Polygon displaying student progress */}
                <polygon points={polyPoints} className="fill-primary/20 stroke-primary" strokeWidth="2.5" />

                {/* Highlight circles on nodes */}
                <circle cx={listeningPoint.split(",")[0]} cy={listeningPoint.split(",")[1]} r="4.5" className="fill-primary stroke-white" strokeWidth="1.5" />
                <circle cx={readingPoint.split(",")[0]} cy={readingPoint.split(",")[1]} r="4.5" className="fill-primary stroke-white" strokeWidth="1.5" />
                <circle cx={writingPoint.split(",")[0]} cy={writingPoint.split(",")[1]} r="4.5" className="fill-primary stroke-white" strokeWidth="1.5" />
                <circle cx={speakingPoint.split(",")[0]} cy={speakingPoint.split(",")[1]} r="4.5" className="fill-primary stroke-white" strokeWidth="1.5" />
              </svg>
            </div>

            {/* Micro grid display bands */}
            <div className="grid grid-cols-2 gap-3 mt-2 text-xs font-bold">
              <div className="flex justify-between p-2.5 rounded-xl bg-surface-container">
                <span className="text-on-surface-variant font-semibold">Listening</span>
                <span className="text-primary tabular-nums font-black">{profile.skills.listening.toFixed(1)}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-surface-container">
                <span className="text-on-surface-variant font-semibold">Reading</span>
                <span className="text-primary tabular-nums font-black">{profile.skills.reading.toFixed(1)}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-surface-container">
                <span className="text-on-surface-variant font-semibold">Writing</span>
                <span className="text-primary tabular-nums font-black">{profile.skills.writing.toFixed(1)}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-surface-container">
                <span className="text-on-surface-variant font-semibold">Speaking</span>
                <span className="text-primary tabular-nums font-black">{profile.skills.speaking.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline Logs & Coach Comments */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="bg-surface border border-outline-variant/40 p-5 rounded-2xl shadow-sm flex flex-col h-full justify-between">
            <div>
              <h3 className="font-display text-base font-extrabold text-on-surface border-b border-outline-variant/20 pb-2 mb-4">
                Nhật ký tóm tắt
              </h3>

              {/* Vertical Timeline */}
              <div className="space-y-5 relative">
                {profile.logs.map((log, lIdx) => (
                  <div key={lIdx} className="relative pl-5 text-xs">
                    {/* Circle Node Indicator */}
                    <span className={`absolute left-0 top-1 w-2.5 h-2.5 rounded-full border border-white ${
                      log.type === "primary" ? "bg-primary" : log.type === "tertiary" ? "bg-amber-500 animate-pulse" : "bg-outline"
                    }`} />
                    {/* Vertically connector line */}
                    {lIdx < profile.logs.length - 1 && (
                      <span className="absolute left-[4px] top-3.5 w-[1px] h-[calc(100%+14px)] bg-outline-variant/40" />
                    )}
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-on-surface-variant font-bold">{log.time}</p>
                      <p className="font-extrabold text-on-surface leading-tight">{log.action}</p>
                      <p className="text-on-surface-variant font-medium opacity-80 leading-normal">{log.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Teacher Coaching Message box */}
            <div className="mt-8 p-3.5 rounded-xl bg-primary-container/20 border border-primary/10 relative overflow-hidden">
              <span className="material-symbols-outlined absolute -right-2 -bottom-2 text-[56px] text-primary/5 rotate-12">
                lightbulb
              </span>
              <h4 className="font-extrabold text-xs text-primary flex items-center gap-1 mb-1">
                💡 Nhận xét giáo viên
              </h4>
              <p className="text-[11px] text-on-surface-variant italic leading-relaxed">
                "{profile.coachNote}"
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

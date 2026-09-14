"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  ChartLineUp,
  CheckCircle,
  ClockCountdown,
  Headphones,
  Microphone,
  PencilCircle,
  Sparkle,
} from "@phosphor-icons/react";

import { studentPracticeSkills } from "@/features/student-hub/studentPracticeSkills";
import styles from "./StudentPracticePage.module.css";

const visualDetails = {
  reading: {
    icon: BookOpenText,
    code: "01",
    eyebrow: "Đọc · Hiểu · Tăng tốc",
    supportingText: "Luyện với đề đã được giao, tiếp tục bài đang dở và xem lại kết quả sau khi nộp.",
    features: [
      { icon: ClockCountdown, label: "Lưu tiến độ tự động" },
      { icon: ChartLineUp, label: "Kết quả & phân tích" },
      { icon: CheckCircle, label: "Đề được giao từ khóa học" },
    ],
  },
  listening: {
    icon: Headphones,
    code: "02",
    eyebrow: "Nghe · Bắt nhịp · Thấu hiểu",
    supportingText: "Không gian luyện nghe theo cấp độ và band mục tiêu đang được hoàn thiện.",
  },
  writing: {
    icon: PencilCircle,
    code: "03",
    eyebrow: "Viết · Chỉnh sửa · Tiến bộ",
    supportingText: "Luyện Task 1, Task 2 và nhận phản hồi theo tiêu chí IELTS.",
  },
  speaking: {
    icon: Microphone,
    code: "04",
    eyebrow: "Nói · Ghi âm · Tự tin",
    supportingText: "Luyện theo chủ đề, ghi âm và theo dõi sự tiến bộ trong phát âm.",
  },
} as const;

const cardClasses = {
  reading: styles.reading,
  listening: styles.listening,
  writing: styles.writing,
  speaking: styles.speaking,
};

export default function StudentPracticePage() {
  const availableCount = studentPracticeSkills.filter((skill) => skill.available).length;

  return (
    <main className={styles.practice}>
      <header className={styles.masthead}>
        <div>
          <p className={styles.kicker}><Sparkle size={13} weight="fill" /> Phòng luyện kỹ năng</p>
          <h1>Luyện đề <em>IELTS</em></h1>
          <p className={styles.intro}>Mỗi kỹ năng là một hành trình riêng. Chọn khu vực đã sẵn sàng và bắt đầu theo nhịp của bạn.</p>
        </div>
        <div className={styles.availability} aria-label={`${availableCount} trên 4 kỹ năng đã sẵn sàng`}>
          <span>Trạng thái luyện tập</span>
          <strong>{String(availableCount).padStart(2, "0")}<small>/04</small></strong>
          <p>kỹ năng đã mở</p>
        </div>
      </header>

      <section className={styles.skillGrid} aria-label="Các kỹ năng luyện thi IELTS">
        {studentPracticeSkills.map((skill) => {
          const detail = visualDetails[skill.id];
          const Icon = detail.icon;
          const content = (
            <>
              <span className={styles.glow} aria-hidden="true" />
              <div className={styles.cardTop}>
                <span className={styles.iconBox}><Icon size={24} weight="duotone" /></span>
                <span className={styles.status}>
                  <i aria-hidden="true" />{skill.available ? "Sẵn sàng" : "Đang phát triển"}
                </span>
                <span className={styles.moduleNumber} aria-hidden="true">{detail.code}</span>
              </div>

              <div className={styles.copy}>
                <p className={styles.skillName}>IELTS {skill.name}</p>
                <p className={styles.description}>{detail.supportingText}</p>
              </div>

              <PracticeArtwork skill={skill.id} />

              {skill.id === "reading" && (
                <ul className={styles.featureList} aria-label="Điểm nổi bật của khu vực Reading">
                  {visualDetails.reading.features.map((feature) => {
                    const FeatureIcon = feature.icon;
                    return <li key={feature.label}><FeatureIcon size={17} weight="duotone" /><span>{feature.label}</span></li>;
                  })}
                </ul>
              )}

              <div className={styles.cardFooter}>
                <span className={styles.microCopy}>{detail.eyebrow}</span>
                <span className={styles.action}>
                  {skill.available ? (
                    <>Bắt đầu Reading <ArrowRight size={16} weight="bold" /></>
                  ) : (
                    <>Sắp ra mắt <Sparkle size={14} weight="fill" /></>
                  )}
                </span>
              </div>
            </>
          );

          const className = `${styles.card} ${cardClasses[skill.id]} ${skill.available ? styles.availableCard : styles.upcomingCard}`;

          return skill.href ? (
            <Link key={skill.id} href={skill.href} className={className} aria-label={`Bắt đầu luyện IELTS ${skill.name}`}>
              {content}
            </Link>
          ) : (
            <article key={skill.id} className={className} aria-label={`IELTS ${skill.name} đang phát triển`}>
              {content}
            </article>
          );
        })}
      </section>

      <footer className={styles.pageNote}>
        <span aria-hidden="true" />
        <p>Luyện một chút mỗi ngày. Tiến bộ sẽ theo bạn lâu dài.</p>
      </footer>
    </main>
  );
}

function PracticeArtwork({ skill }: { skill: keyof typeof visualDetails }) {
  if (skill === "reading") {
    return (
      <div className={`${styles.artwork} ${styles.readingArt}`} aria-hidden="true">
        <span className={styles.orbitOne} /><span className={styles.orbitTwo} /><span className={styles.orbitThree} />
        <span className={`${styles.node} ${styles.nodeOne}`} /><span className={`${styles.node} ${styles.nodeTwo}`} /><span className={`${styles.node} ${styles.nodeThree}`} />
        <BookOpenText className={styles.heroGlyph} size={112} weight="duotone" />
      </div>
    );
  }

  if (skill === "listening") {
    return (
      <div className={`${styles.artwork} ${styles.listeningArt}`} aria-hidden="true">
        <span className={styles.soundRingOne} /><span className={styles.soundRingTwo} /><span className={styles.soundRingThree} />
        <Headphones className={styles.centerGlyph} size={58} weight="duotone" />
        <span className={styles.waveform}>{[2, 5, 8, 4, 10, 6, 3, 7, 4].map((height, index) => <i key={index} style={{ height: `${height * 4}px` }} />)}</span>
      </div>
    );
  }

  if (skill === "writing") {
    return (
      <div className={`${styles.artwork} ${styles.writingArt}`} aria-hidden="true">
        <span className={styles.penOrbit} /><span className={styles.penTrace} />
        <PencilCircle className={styles.centerGlyph} size={70} weight="duotone" />
        <span className={`${styles.node} ${styles.nodeOne}`} /><span className={`${styles.node} ${styles.nodeTwo}`} />
      </div>
    );
  }

  return (
    <div className={`${styles.artwork} ${styles.speakingArt}`} aria-hidden="true">
      <span className={styles.voiceRingOne} /><span className={styles.voiceRingTwo} />
      <Microphone className={styles.centerGlyph} size={68} weight="duotone" />
      <span className={styles.voiceWave}>{[3, 7, 4, 10, 6, 9, 4, 7, 3].map((height, index) => <i key={index} style={{ height: `${height * 3}px` }} />)}</span>
    </div>
  );
}

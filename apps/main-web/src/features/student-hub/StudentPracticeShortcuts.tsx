import Link from "next/link";
import { BookOpenText, Headphones, Microphone, PenNib } from "@phosphor-icons/react";
import { studentPracticeSkills } from "./studentPracticeSkills";
import styles from "./StudentOverview.module.css";

const icons = { reading: BookOpenText, listening: Headphones, writing: PenNib, speaking: Microphone };

export function StudentPracticeShortcuts() {
  return (
    <section aria-labelledby="practice-shortcuts-title">
      <div className={styles.sectionHead}>
        <h2 id="practice-shortcuts-title">Luyện tập kỹ năng</h2>
        <Link href="/student/practice" className={styles.textLink}>Xem các kỹ năng</Link>
      </div>
      <div className={styles.skillStrip}>
        {studentPracticeSkills.map((skill) => {
          const Icon = icons[skill.id];
          const content = <><Icon size={22} weight="duotone" /><span><strong>{skill.name}</strong><small>{skill.available ? "Mở bài được giao" : "Đang phát triển"}</small></span></>;
          return skill.href ? <Link key={skill.id} href={skill.href} className={styles.skill}>{content}</Link>
            : <div key={skill.id} className={`${styles.skill} ${styles.unavailable}`}>{content}</div>;
        })}
      </div>
    </section>
  );
}

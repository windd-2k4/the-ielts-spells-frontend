import { redirect } from "next/navigation";

export default function StudentReadingPage() {
  redirect("/student/practice?skill=READING");
}

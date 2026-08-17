import LibraryWorkspace from "../library/LibraryWorkspace";

export default function CourseLibrary({ courseId }: { courseId: string }) {
  return <LibraryWorkspace courseId={courseId} compactHeader/>;
}


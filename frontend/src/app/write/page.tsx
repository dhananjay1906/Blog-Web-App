import { PostEditor } from "@/components/PostEditor";
import { RequireAuth } from "@/components/RequireAuth";

export const metadata = { title: "Write" };

export default function WritePage() {
  return (
    <RequireAuth>
      <div className="mx-auto max-w-3xl">
        <PostEditor />
      </div>
    </RequireAuth>
  );
}

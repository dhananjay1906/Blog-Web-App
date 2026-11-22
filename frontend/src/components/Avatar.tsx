import { colorFor } from "@/lib/format";

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.42, background: colorFor(name) }}
    >
      {name[0]?.toUpperCase()}
    </span>
  );
}

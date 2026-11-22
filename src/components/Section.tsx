import type { ReactNode } from "react";

export function SectionHeading({
  kicker,
  title,
  sub,
  align = "center",
  id,
}: {
  kicker: string;
  title: ReactNode;
  sub?: ReactNode;
  align?: "center" | "left";
  id?: string;
}) {
  const center = align === "center";
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-2xl"}>
      <p data-reveal className={`kicker ${center ? "justify-center" : ""}`}>
        {kicker}
      </p>
      <h2
        id={id}
        data-reveal
        style={{ ["--reveal-delay" as string]: "70ms" }}
        className="mt-4 text-balance font-display text-4xl font-extrabold leading-[1.02] tracking-[-0.03em] text-cream sm:text-5xl lg:text-[3.6rem]"
      >
        {title}
      </h2>
      {sub && (
        <p
          data-reveal
          style={{ ["--reveal-delay" as string]: "140ms" }}
          className="mt-5 text-pretty text-[17px] leading-relaxed text-mist sm:text-lg"
        >
          {sub}
        </p>
      )}
    </div>
  );
}

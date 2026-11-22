/** A screenshot of the game (1920×1080), in three sizes. */
export function Shot({
  dir,
  name,
  alt,
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
  className = "",
}: {
  dir: string;
  name: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${dir}/${name}-1920.webp`}
      srcSet={`${dir}/${name}-960.webp 960w, ${dir}/${name}-1280.webp 1280w, ${dir}/${name}-1920.webp 1920w`}
      sizes={sizes}
      alt={alt}
      width={1920}
      height={1080}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={`block w-full ${className || "h-auto"}`}
    />
  );
}

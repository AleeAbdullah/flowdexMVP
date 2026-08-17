import Image from 'next/image';

export function BlogCardThumbnail(props: { src: string | null }) {
  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden bg-[var(--accent-bg)]">
      {props.src ? (
        <Image
          src={props.src}
          alt=""
          fill
          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
          unoptimized
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[var(--accent-border)] bg-[var(--card-bg)] shadow-lg">
            <Image src="/icon.svg" alt="" width={52} height={52} className="opacity-80" />
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconArrowRight, IconClose } from "./icons";

type PropertyGalleryProps = {
  images: string[];
  title: string;
};

export function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const [openAt, setOpenAt] = useState<number | null>(null);
  const shown = images.slice(0, 5);
  const remaining = images.length - shown.length;

  return (
    <>
      <MobileCarousel images={images} title={title} onOpen={setOpenAt} />

      <div className="hidden grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-card sm:grid sm:h-[440px]">
        <button
          type="button"
          onClick={() => setOpenAt(0)}
          className="group relative col-span-2 row-span-2 h-full"
        >
          <Image
            src={images[0]}
            alt={`${title} — main view`}
            fill
            priority
            sizes="(min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </button>
        {shown.slice(1, 5).map((src, i) => {
          const isLast = i === 3 && remaining > 0;
          return (
            <button
              key={src}
              type="button"
              onClick={() => setOpenAt(i + 1)}
              className="group relative h-full"
            >
              <Image
                src={src}
                alt={`${title} — view ${i + 2}`}
                fill
                sizes="25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              {isLast ? (
                <span className="absolute inset-0 flex items-center justify-center bg-ink/55 text-sm font-semibold text-white">
                  +{remaining} more
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {openAt !== null ? (
          <Lightbox
            images={images}
            title={title}
            index={openAt}
            onClose={() => setOpenAt(null)}
            onIndexChange={setOpenAt}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}

/** Phones: every photo in a swipeable row, with a counter. Tapping a photo opens the full-screen gallery. */
function MobileCarousel({
  images,
  title,
  onOpen,
}: {
  images: string[];
  title: string;
  onOpen: (i: number) => void;
}) {
  const row = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);

  return (
    <div className="relative overflow-hidden rounded-card sm:hidden">
      <div
        ref={row}
        onScroll={() => {
          const el = row.current;
          if (el) setCurrent(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
      >
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => onOpen(i)}
            className="relative h-72 w-full shrink-0 snap-center"
            aria-label={`Open photo ${i + 1} of ${images.length}`}
          >
            <Image
              src={src}
              alt={`${title} — photo ${i + 1}`}
              fill
              priority={i === 0}
              loading={i === 0 ? undefined : "lazy"}
              sizes="100vw"
              className="object-cover"
            />
          </button>
        ))}
      </div>
      <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-ink/70 px-3 py-1 text-xs font-semibold text-white">
        {current + 1} / {images.length}
      </span>
    </div>
  );
}

function Lightbox({
  images,
  title,
  index,
  onClose,
  onIndexChange,
}: {
  images: string[];
  title: string;
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  const touchStartX = useRef<number | null>(null);

  const next = useCallback(
    () => onIndexChange((index + 1) % images.length),
    [index, images.length, onIndexChange],
  );
  const prev = useCallback(
    () => onIndexChange((index - 1 + images.length) % images.length),
    [index, images.length, onIndexChange],
  );

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, next, prev]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex flex-col bg-ink/97"
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current == null) return;
        const delta = e.changedTouches[0].clientX - touchStartX.current;
        if (delta > 50) prev();
        else if (delta < -50) next();
        touchStartX.current = null;
      }}
    >
      <div className="flex items-center justify-between px-5 py-4 text-white/80">
        <span className="text-sm">
          {index + 1} / {images.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close gallery"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 hover:bg-white/10"
        >
          <IconClose className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            <Image
              src={images[index]}
              alt={`${title} — photo ${index + 1} of ${images.length}`}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </motion.div>
        </AnimatePresence>

        <button
          type="button"
          onClick={prev}
          aria-label="Previous photo"
          className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 text-white hover:bg-white/10 sm:flex"
        >
          <IconArrowRight className="h-5 w-5 rotate-180" />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Next photo"
          className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 text-white hover:bg-white/10 sm:flex"
        >
          <IconArrowRight className="h-5 w-5" />
        </button>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 py-4">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => onIndexChange(i)}
            className={[
              "relative h-14 w-20 shrink-0 overflow-hidden rounded-lg transition-opacity",
              i === index ? "opacity-100 ring-2 ring-brand" : "opacity-50 hover:opacity-80",
            ].join(" ")}
          >
            <Image src={src} alt="" fill sizes="80px" className="object-cover" />
          </button>
        ))}
      </div>
    </motion.div>
  );
}

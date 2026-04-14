// components/ui/CategoryScroll.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Image, { StaticImageData } from 'next/image';
import { useRef, useEffect, useCallback } from 'react';

type Category = {
  tag: string;
  image?: StaticImageData;
  data?: string | number;
};

export default function CategoryScroll({ categories }: { categories: Category[] }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0);
  const dragRef = useRef({ active: false, startX: 0, startPos: 0 });
  const pausedRef = useRef(false);
  const rafRef = useRef<number>(0);
  const SPEED = 0.6;

  const getTrackWidth = useCallback(() => {
    const track = trackRef.current;
    if (!track) return 0;
    return track.scrollWidth / 2;
  }, []);

  const setPos = useCallback((x: number) => {
    const half = getTrackWidth();
    if (half === 0) return;
    posRef.current = ((x % half) - half) % half;
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(${posRef.current}px)`;
    }
  }, [getTrackWidth]);

  useEffect(() => {
    const animate = () => {
      if (!pausedRef.current) setPos(posRef.current - SPEED);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [setPos]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const onPointerDown = (e: PointerEvent) => {
      dragRef.current = { active: true, startX: e.clientX, startPos: posRef.current };
      pausedRef.current = true;
      wrapper.setPointerCapture(e.pointerId);
      wrapper.style.cursor = 'grabbing';
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragRef.current.active) return;
      setPos(dragRef.current.startPos + (e.clientX - dragRef.current.startX));
    };
    const onPointerUp = () => {
      dragRef.current.active = false;
      pausedRef.current = false;
      wrapper.style.cursor = 'grab';
    };
    const onMouseEnter = () => { pausedRef.current = true; };
    const onMouseLeave = () => { if (!dragRef.current.active) pausedRef.current = false; };

    wrapper.addEventListener('pointerdown', onPointerDown);
    wrapper.addEventListener('pointermove', onPointerMove);
    wrapper.addEventListener('pointerup', onPointerUp);
    wrapper.addEventListener('pointercancel', onPointerUp);
    wrapper.addEventListener('mouseenter', onMouseEnter);
    wrapper.addEventListener('mouseleave', onMouseLeave);

    return () => {
      wrapper.removeEventListener('pointerdown', onPointerDown);
      wrapper.removeEventListener('pointermove', onPointerMove);
      wrapper.removeEventListener('pointerup', onPointerUp);
      wrapper.removeEventListener('pointercancel', onPointerUp);
      wrapper.removeEventListener('mouseenter', onMouseEnter);
      wrapper.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [setPos]);

  const doubled = [...categories, ...categories];

  return (
    <div className="w-full overflow-hidden select-none">
      <div ref={wrapperRef} className="w-full overflow-hidden mt-5" style={{ cursor: 'grab' }}>
        <div ref={trackRef} className="flex gap-4 py-3 w-max" style={{ willChange: 'transform' }}>
          {doubled.map((category, idx) => {

            // ── tag + data → admin card ──────────────────────────────
            if (category.data) {
              return (
                <div
                  key={idx}
                  className="bg-[#71677a9d] border border-white/20 backdrop-blur-sm
                             flex items-center justify-center
                             w-auto px-3 py-3 rounded-2xl gap-2
                             transition-transform hover:scale-105 hover:bg-white/20"
                >
                  {/* Avatar placeholder */}
                  {/* Tag */}
                  <p className=" text-white/50 text-[14px] text-center text-nowrap w-full">
                    {category.tag}
                  </p>
                  {/* Data — render whatever is passed */}
                  <p className="text-white text-[18px] font-semibold text-center leading-tight truncate w-full ">
                    {typeof category.data === 'string' ? category.data : JSON.stringify(category.data)}
                  </p>
                </div>
              )
            }

            // ── tag + image → homepage card ──────────────────────────
            return (
              <div
                key={idx}
                className="bg-[#8FABD4] flex flex-col items-center
                           w-[160px] h-[180px] px-4 pt-4 pb-3 rounded-2xl
                           transition-transform hover:scale-105 border border-[#203C67]"
              >
                <div className="relative w-full flex-1 min-h-0">
                  <Image
                    src={category.image!}
                    alt={category.tag}
                    className="p-2 px-5 h-[100px] w-fit"
                    draggable={false}
                  />
                </div>
                <h2 className="font-medium text-[#203C67] text-base text-center leading-tight w-full truncate flex-shrink-0">
                  {category.tag}
                </h2>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}
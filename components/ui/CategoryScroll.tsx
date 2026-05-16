/* eslint-disable react-hooks/rules-of-hooks */
// components/ui/CategoryScroll.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Image, { StaticImageData } from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef, useEffect, useCallback } from 'react';

type Category = {
  tag: string;
  image?: StaticImageData;
  data?: string | number;
};

export default function CategoryScroll({ categories }: { categories: Category[] }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const trackRef  = useRef<HTMLDivElement>(null);
  const posRef    = useRef(0);
  const dragRef   = useRef({ active: false, startX: 0, startPos: 0 });
  const pausedRef = useRef(false);
  const rafRef    = useRef<number>(0);
  const SPEED     = 0.5;
  const router = useRouter()
  const dragMovedRef = useRef(false)
  const pointerDownTargetRef = useRef<HTMLElement | null>(null)

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
    // Add a drag distance tracker

    // In onPointerDown, reset it:
    const onPointerDown = (e: PointerEvent) => {
      dragRef.current = { active: true, startX: e.clientX, startPos: posRef.current }
      dragMovedRef.current = false
      pausedRef.current = true
      pointerDownTargetRef.current = e.target as HTMLElement  // ← save target here
      wrapper.setPointerCapture(e.pointerId)
      wrapper.style.cursor = 'grabbing'
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!dragRef.current.active) return
      e.preventDefault()  // ← only prevent here, when actually dragging
      const delta = Math.abs(e.clientX - dragRef.current.startX)
      if (delta > 10) {
        console.log("drag detected")
        dragMovedRef.current = true
      }
      setPos(dragRef.current.startPos + (e.clientX - dragRef.current.startX))
    }
    
    const onPointerUp = () => {
      dragRef.current.active = false
      pausedRef.current = false
      wrapper.style.cursor = 'grab'

      if (!dragMovedRef.current && pointerDownTargetRef.current) {
        const card = pointerDownTargetRef.current.closest("[data-tag]")
        if (card) {
          const tag = card.getAttribute("data-tag")
          if (tag) router.push(`/alldoctors?q=${tag}`)
        }
      }
      pointerDownTargetRef.current = null
    }
    const onMouseEnter = () => { pausedRef.current = true; };
    const onMouseLeave = () => { if (!dragRef.current.active) pausedRef.current = false; };

    wrapper.addEventListener('pointerdown',   onPointerDown,  { passive: false }); // ✅ fix 1
    wrapper.addEventListener('pointermove',   onPointerMove,  { passive: false }); // ✅ fix 1
    wrapper.addEventListener('pointerup',     onPointerUp);
    wrapper.addEventListener('pointercancel', onPointerUp);
    wrapper.addEventListener('mouseenter',    onMouseEnter);
    wrapper.addEventListener('mouseleave',    onMouseLeave);
    return () => {
      wrapper.removeEventListener('pointerdown',   onPointerDown);
      wrapper.removeEventListener('pointermove',   onPointerMove);
      wrapper.removeEventListener('pointerup',     onPointerUp);
      wrapper.removeEventListener('pointercancel', onPointerUp);
      wrapper.removeEventListener('mouseenter',    onMouseEnter);
      wrapper.removeEventListener('mouseleave',    onMouseLeave);
    };
  }, [setPos]);

  // ✅ fix 2 — block touchmove from stealing the gesture
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const blockTouch = (e: TouchEvent) => {
      if (dragRef.current.active) e.preventDefault();
    };
    wrapper.addEventListener('touchmove', blockTouch, { passive: false });
    return () => wrapper.removeEventListener('touchmove', blockTouch);
  }, []);

  const doubled = [...categories, ...categories];

  return (
    <div className="w-full overflow-hidden select-none">
      {/* fade edges */}
      <div className="relative">
        <div
          className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, #EFECE3, transparent)' }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, #EFECE3, transparent)' }}
        />

        {/* ✅ fix 3 — touch-pan-y */}
        <div ref={wrapperRef} className="w-full overflow-hidden py-3 touch-pan-y" style={{ cursor: 'grab' }}>
          <div ref={trackRef} className="flex gap-3 w-max" style={{ willChange: 'transform' }}>
            {doubled.map((category, idx) => {

              /* ── admin stat card ── */
              if (category.data) {
                return (
                  <div
                    key={idx}
                    className="flex flex-col items-start justify-between w-36 px-4 py-3 rounded-2xl border border-white/20 backdrop-blur-sm gap-1"
                    style={{ background: 'rgba(113,103,122,0.6)' }}
                  >
                    <p className="text-white/50 text-[11px] text-nowrap">{category.tag}</p>
                    <p className="text-white text-[18px] font-semibold leading-tight">
                      {typeof category.data === 'string' ? category.data : JSON.stringify(category.data)}
                    </p>
                  </div>
                );
              }

              /* ── homepage specialization card ── */
              return (
                <div
                  key={idx}
                  data-tag={category.tag}
                  className="group relative flex items-center gap-3 bg-white/50 border border-[#e2ddd4] rounded-2xl px-4 py-3 transition-all duration-200 hover:border-[#8FABD4] hover:shadow-sm"
                  style={{ width: '210px', flexShrink: 0, cursor: 'grab' }}
                  draggable={false}
                >
                  {/* Icon box */}
                  <div
                    className="flex-shrink-0 flex items-center justify-center rounded-xl transition-colors duration-200 group-hover:bg-[#dde8f5]"
                    style={{
                      width: 56,
                      height: 56,
                      background: '#eef3fa',
                    }}
                  >
                    <Image
                      src={category.image!}
                      alt={category.tag}
                      width={42}
                      height={42}
                      className="object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                      draggable={false}
                    />
                  </div>

                  {/* Label */}
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-semibold leading-tight text-[#1a2535] truncate">
                      {category.tag}
                    </span>
                    <span className="text-[10px] text-[#a0afc0] mt-0.5">Specialist</span>
                  </div>

                  {/* Arrow indicator */}
                  <div
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[#8FABD4] text-[14px] cursor-pointer"
                    onClick={() => router.push(`/alldoctors?q=${category.tag}`)}
                  >
                    →
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
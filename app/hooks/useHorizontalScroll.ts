'use client';

import { useRef, useEffect } from 'react';

export function useHorizontalScroll() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    // 🖱️ Wheel → horizontal scroll
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    // ✋ Grab start
    const onMouseDown = (e: MouseEvent) => {
      isDown = true;
      el.style.cursor = 'grabbing';
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };

    // 🚫 Grab end
    const onMouseUp = (e: MouseEvent) => {
      isDown = false;
      el.style.cursor = 'grab';

      // Momentum / inertia
      const velocity = (e.pageX - startX) * 0.08;
      let momentum = velocity;

      const glide = () => {
        if (Math.abs(momentum) < 0.5) return;
        el.scrollLeft -= momentum;
        momentum *= 0.92; // friction
        requestAnimationFrame(glide);
      };
      requestAnimationFrame(glide);
    };

    // 🖱️ Drag move
    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.5;
      el.scrollLeft = scrollLeft - walk;
    };

    // Mouse leaves element
    const onMouseLeave = () => {
      isDown = false;
      el.style.cursor = 'grab';
    };

    // 📱 Touch support
    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };

    const onTouchMove = (e: TouchEvent) => {
      const x = e.touches[0].pageX - el.offsetLeft;
      const walk = (x - startX) * 1.5;
      el.scrollLeft = scrollLeft - walk;
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseleave', onMouseLeave);
    el.addEventListener('touchstart', onTouchStart);
    el.addEventListener('touchmove', onTouchMove);

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  return ref;
}
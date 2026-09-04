import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

const prefersStill = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useScrollMotion(hostRef: RefObject<HTMLElement | null>) {
  const [lifted, setLifted] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const still = prefersStill();
    const layers = Array.from(host.querySelectorAll<HTMLElement>("[data-parallax]"));
    let frame = 0;

    const measure = () => {
      frame = 0;
      const span = host.scrollHeight - host.clientHeight;
      const ratio = span > 0 ? Math.min(1, Math.max(0, host.scrollTop / span)) : 0;
      host.style.setProperty("--progress", ratio.toFixed(4));
      setLifted(host.scrollTop > 28);
      if (still) return;
      const middle = host.clientHeight / 2;
      for (const layer of layers) {
        const rect = layer.getBoundingClientRect();
        const depth = Number(layer.dataset.parallax) || 0;
        const shift = (rect.top + rect.height / 2 - middle) * depth;
        layer.style.setProperty("--py", `${shift.toFixed(1)}px`);
      }
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    host.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      host.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [hostRef]);

  return lifted;
}

export function useReveal(hostRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const nodes = Array.from(host.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (prefersStill()) {
      for (const node of nodes) node.classList.add("is-revealed");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [hostRef]);
}

export function useInView<T extends HTMLElement>(threshold = 0.4) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (prefersStill()) {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setInView(true);
        observer.disconnect();
      },
      { threshold }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

export function useCountUp(target: number, active: boolean, duration = 1300) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    if (prefersStill()) {
      setValue(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, active, duration]);

  return value;
}

export function useTilt<T extends HTMLElement>(strength = 7) {
  const ref = useRef<T | null>(null);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<T>) => {
      const node = ref.current;
      if (!node || prefersStill()) return;
      const rect = node.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      node.classList.add("is-tilting");
      node.style.setProperty("--ry", `${(x * strength).toFixed(2)}deg`);
      node.style.setProperty("--rx", `${(-y * strength).toFixed(2)}deg`);
    },
    [strength]
  );

  const onPointerLeave = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    node.classList.remove("is-tilting");
    node.style.setProperty("--ry", "0deg");
    node.style.setProperty("--rx", "0deg");
  }, []);

  return { ref, onPointerMove, onPointerLeave };
}

export function useTypewriter(text: string, active: boolean, speed = 14) {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (!active) {
      setTyped("");
      return;
    }
    if (prefersStill()) {
      setTyped(text);
      return;
    }
    setTyped("");
    let index = 0;
    const timer = window.setInterval(() => {
      index += 2;
      setTyped(text.slice(0, index));
      if (index >= text.length) window.clearInterval(timer);
    }, speed);
    return () => window.clearInterval(timer);
  }, [text, active, speed]);

  return { typed, done: typed.length >= text.length };
}
"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, useState, useEffect } from "react";

interface AnimateOnScrollProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  duration?: number;
}

export function AnimateOnScroll({
  children,
  className,
  delay = 0,
  direction = "up",
  duration = 0.6,
}: AnimateOnScrollProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const shouldReduce = useReducedMotion();
  // Safety net: if useInView never fires within 2s, force visible
  const [forceVisible, setForceVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setForceVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const shouldShow = isInView || forceVisible;

  const directionMap = {
    up: { y: 40, x: 0 },
    down: { y: -40, x: 0 },
    left: { y: 0, x: 40 },
    right: { y: 0, x: -40 },
    none: { y: 0, x: 0 },
  };

  const { x, y } = shouldReduce ? { x: 0, y: 0 } : directionMap[direction];

  return (
    <motion.div
      ref={ref}
      initial={shouldReduce ? { opacity: 1 } : { opacity: 0, y, x }}
      animate={shouldShow ? { opacity: 1, y: 0, x: 0 } : shouldReduce ? { opacity: 1 } : { opacity: 0, y, x }}
      transition={{ duration: shouldReduce ? 0 : duration, delay: shouldReduce ? 0 : delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerChildrenProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerChildren({
  children,
  className,
  staggerDelay = 0.1,
}: StaggerChildrenProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const shouldReduce = useReducedMotion();
  // Safety net: if useInView never fires within 2s, force visible
  const [forceVisible, setForceVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setForceVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const shouldShow = isInView || forceVisible;

  return (
    <motion.div
      ref={ref}
      initial={shouldReduce ? "visible" : "hidden"}
      animate={shouldShow ? "visible" : shouldReduce ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: shouldReduce ? 0 : staggerDelay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      variants={{
        hidden: shouldReduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: shouldReduce ? 0 : 0.5, ease: "easeOut" } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduce ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: shouldReduce ? 0 : 0.8, delay: shouldReduce ? 0 : delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SlideUp({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduce ? 0 : 0.7, delay: shouldReduce ? 0 : delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function PulseGlow({ className }: { className?: string }) {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      animate={shouldReduce ? { opacity: 0.6, scale: 1 } : {
        opacity: [0.4, 0.8, 0.4],
        scale: [1, 1.05, 1],
      }}
      transition={shouldReduce ? { duration: 0 } : {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

export function CountUp({
  end,
  duration = 2,
  prefix = "",
  suffix = "",
  className,
}: {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  // Safety net: if useInView never fires within 2s, force visible
  const [forceVisible, setForceVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setForceVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const shouldShow = isInView || forceVisible;

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0 }}
      animate={shouldShow ? { opacity: 1 } : {}}
    >
      {shouldShow ? (
        <motion.span>
          {prefix}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {end}
          </motion.span>
          {suffix}
        </motion.span>
      ) : (
        `${prefix}0${suffix}`
      )}
    </motion.span>
  );
}

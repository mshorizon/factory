"use client";

import * as React from "react";
import { motion, useInView, type Variants } from "framer-motion";

export interface StaggerContainerProps {
  children: React.ReactNode;
  /** Delay between each child animation in seconds */
  staggerDelay?: number;
  /** Custom className for the container */
  className?: string;
  /** Trigger animation once or every time element enters view */
  once?: boolean;
  /** Viewport margin for triggering animation */
  margin?: string;
  /** HTML tag to render */
  as?: keyof React.JSX.IntrinsicElements;
}

export interface StaggerItemProps {
  children: React.ReactNode;
  /** Custom className for the item */
  className?: string;
  /** Direction the element animates from */
  direction?: "up" | "down" | "left" | "right" | "none";
  /** Distance to translate in pixels */
  distance?: number;
}

const getItemVariants = (
  direction: "up" | "down" | "left" | "right" | "none",
  distance: number
): Variants => {
  const getOffset = () => {
    switch (direction) {
      case "up":
        return { x: 0, y: distance };
      case "down":
        return { x: 0, y: -distance };
      case "left":
        return { x: distance, y: 0 };
      case "right":
        return { x: -distance, y: 0 };
      case "none":
      default:
        return { x: 0, y: 0 };
    }
  };

  const { x, y } = getOffset();

  return {
    hidden: {
      opacity: 0,
      x,
      y,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };
};

export function StaggerContainer({
  children,
  staggerDelay = 0.1,
  className,
  once = true,
  margin = "-100px",
  as = "div",
}: StaggerContainerProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: margin as `${number}px` });

  const variants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  const MotionComponent = motion[as as keyof typeof motion] as typeof motion.div;

  return (
    <MotionComponent
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      className={className}
    >
      {children}
    </MotionComponent>
  );
}

export function StaggerItem({
  children,
  className,
  direction = "up",
  distance = 20,
}: StaggerItemProps) {
  const variants = getItemVariants(direction, distance);

  return (
    <motion.div variants={variants} className={className}>
      {children}
    </motion.div>
  );
}

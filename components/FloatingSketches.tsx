"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const FloatingItem = ({ children, y, delay, rotate, duration }: any) => {
  return (
    <div 
      className="drift-item"
      style={{ 
        top: y, 
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`
      }}
    >
      <motion.div
        animate={{
          y: [0, -30, 0],
          rotate: [rotate, rotate + 10, rotate - 10, rotate],
        }}
        transition={{
          y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 6, repeat: Infinity, ease: "easeInOut" }
        }}
        whileHover={{ scale: 1.15 }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default function FloatingSketches() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // 2005 Flash-style mouse repulsion/parallax
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 60,
        y: (e.clientY / window.innerHeight - 0.5) * 60,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const sketches = [
    { src: "/egghead/drawing_2.png", y: "15%", delay: 0, rotate: 5, width: 200, duration: 25, href: "/analyzer", label: "Fix & Flip Finder" },
    { src: "/egghead/drawing_6.png", y: "5%", delay: 4, rotate: -10, width: 250, duration: 30 },
    { src: "/egghead/drawing_14.png", y: "60%", delay: 2, rotate: 15, width: 300, duration: 28 },
    { src: "/egghead/drawing_24.png", y: "65%", delay: 8, rotate: -5, width: 280, duration: 22 },
    { src: "/egghead/drawing_28.png", y: "75%", delay: 12, rotate: 8, width: 180, duration: 35 },
    { src: "/egghead/drawing_30.png", y: "20%", delay: 6, rotate: -15, width: 220, duration: 24 },
    { src: "/egghead/drawing_34.png", y: "40%", delay: 15, rotate: 10, width: 260, duration: 26 },
    { src: "/egghead/drawing_45.png", y: "30%", delay: 10, rotate: 0, width: 200, duration: 32 },
    { src: "/egghead/drawing_54.png", y: "45%", delay: 18, rotate: -5, width: 400, duration: 40 },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes driftLeft {
          0% { transform: translateX(0vw); }
          100% { transform: translateX(-150vw); }
        }
        .drift-item {
          position: absolute;
          left: 100%;
          animation-name: driftLeft;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .drift-item:hover {
          animation-play-state: paused;
          z-index: 50;
        }
      `}} />
      <motion.div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          overflow: "hidden",
          opacity: 0.85
        }}
        animate={{
          x: -mousePos.x,
          y: -mousePos.y,
        }}
        transition={{ type: "spring", stiffness: 40, damping: 25 }}
      >
        {sketches.map((s, i) => (
          <FloatingItem key={i} y={s.y} delay={s.delay} rotate={s.rotate} duration={s.duration}>
            {s.href ? (
              <Link href={s.href} style={{ textDecoration: "none", pointerEvents: "auto" }}>
                <div style={{ position: "relative", width: s.width, height: s.width, display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}>
                  <div style={{ position: "relative", width: "100%", height: "100%" }}>
                    <Image src={s.src} alt="Sketch" fill style={{ objectFit: "contain" }} />
                  </div>
                  {s.label && (
                    <div style={{
                      background: "#fff",
                      border: "3px solid var(--border-strong)",
                      padding: "8px 16px",
                      borderRadius: "255px 15px 225px 15px/15px 225px 15px 255px",
                      fontWeight: 800,
                      fontSize: "1.1rem",
                      whiteSpace: "nowrap",
                      marginTop: -10,
                      boxShadow: "4px 4px 0 rgba(0,0,0,0.1)",
                      color: "var(--text-primary)"
                    }}>
                      {s.label}
                    </div>
                  )}
                </div>
              </Link>
            ) : (
              <div style={{ position: "relative", width: s.width, height: s.width, pointerEvents: "auto" }}>
                <Image src={s.src} alt="Egghead Sketch" fill style={{ objectFit: "contain" }} />
              </div>
            )}
          </FloatingItem>
        ))}
      </motion.div>
    </>
  );
}

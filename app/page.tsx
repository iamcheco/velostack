"use client";

import FloatingSketches from "@/components/FloatingSketches";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <main style={{ position: "relative", zIndex: 1, minHeight: "100vh", overflow: "hidden", background: "#fff" }}>
      <FloatingSketches />
      {/* Central Anchor */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 10, display: "flex", justifyContent: "center", alignItems: "center" }}>
        
        {/* Core Logo on Bike Image */}
        <Link href="/all" style={{ textDecoration: "none" }}>
          <motion.div
            whileHover={{ scale: 1.05, rotate: 2 }}
            style={{ 
              zIndex: 11,
              position: "relative",
              width: 350,
              height: 350,
              borderRadius: "50%",
              border: "8px solid var(--border-strong)",
              overflow: "hidden",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              boxShadow: "12px 12px 0 rgba(0,0,0,0.15)",
              cursor: "pointer"
            }}
          >
            <Image 
              src="/bike_bg.jpg" 
              alt="Bike Background" 
              fill 
              style={{ objectFit: "cover", opacity: 0.8 }} 
            />
            <h1 style={{ 
            fontSize: "2rem", 
            fontWeight: 800, 
            textAlign: "center", 
            background: "#fff", 
            padding: "8px 16px", 
            border: "3px solid var(--border-strong)", 
            borderRadius: "255px 15px 225px 15px/15px 225px 15px 255px",
            zIndex: 12,
            position: "absolute",
            bottom: "20px",
            boxShadow: "4px 4px 0 rgba(0,0,0,0.1)",
            color: "var(--text-primary)"
          }}>
            VeloStack
          </h1>
        </motion.div>
        </Link>
        
      </div>
    </main>
  );
}

"use client";

import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";
import { PitchXI } from "@/app/components/PitchXI";
import { WORLD_CUP_XI } from "@/app/data/worldCupXI";
import { Trophy, ArrowLeft } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { motion } from "framer-motion";

export default function WorldCupXIPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Header />

      <main className="mx-auto max-w-7xl px-4 pt-6 pb-24 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#16A34A] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBBF24]/10">
            <Trophy className="h-7 w-7 text-[#FBBF24]" />
          </div>
          <h1 className="font-outfit text-4xl font-black text-[#0F172A] dark:text-white sm:text-5xl lg:text-6xl">
            Team of the Tournament
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-[#64748B] dark:text-gray-400 leading-relaxed">
            Our definitive XI of the <strong className="text-[#0F172A] dark:text-white">2026 FIFA World Cup</strong>. 
            Tap any player to see why they made the cut — powered by conviction, not consensus.
          </p>
        </motion.div>

        {/* The Pitch */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <PitchXI team={WORLD_CUP_XI} />
        </motion.div>

        {/* Player list below pitch (detailed breakdown) */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 mx-auto max-w-2xl"
        >
          <h2 className="mb-8 text-center font-outfit text-2xl font-black text-[#0F172A] dark:text-white sm:text-3xl">
            The Full Squad Breakdown
          </h2>

          <div className="space-y-4">
            {WORLD_CUP_XI.players.map((player, idx) => {
              const posLabels: Record<string, string> = {
                GK: "Goalkeeper",
                DEF: "Defender",
                MID: "Midfielder",
                FWD: "Forward",
              };
              const posColors: Record<string, string> = {
                GK: "#F59E0B",
                DEF: "#3B82F6",
                MID: "#16A34A",
                FWD: "#EF4444",
              };

              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.04 }}
                  className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-[#16A34A]/30 hover:shadow-lg dark:border-gray-800 dark:bg-[#1E293B]"
                >
                  <div className="flex items-start gap-4">
                    {/* Image */}
                    <div className="relative shrink-0">
                      <div
                        className="h-16 w-16 rounded-xl overflow-hidden border-2"
                        style={{ borderColor: posColors[player.position] }}
                      >
                        <img
                          src={player.image}
                          alt={player.name}
                          className="h-full w-full object-cover object-top bg-slate-200 dark:bg-slate-700"
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-white dark:bg-[#0F172A] shadow flex items-center justify-center p-[3px]">
                        <img src={player.clubLogo} alt={player.club} className="h-full w-full object-contain" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-outfit text-base font-black text-[#0F172A] dark:text-white">
                          {player.name}
                        </h3>
                        <span
                          className="rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider"
                          style={{
                            backgroundColor: `${posColors[player.position]}15`,
                            color: posColors[player.position],
                          }}
                        >
                          {posLabels[player.position]}
                        </span>
                        {player.rating && (
                          <span className="rounded-md bg-[#16A34A]/10 px-1.5 py-0.5 text-[11px] font-black text-[#16A34A]">
                            {player.rating.toFixed(1)}
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex items-center gap-2 text-[11px] text-[#94A3B8]">
                        <span className="font-medium">{player.club}</span>
                        <span>·</span>
                        <span>{player.country}</span>
                        <span>·</span>
                        <span>#{player.number}</span>
                      </div>

                      <p className="mt-2 text-sm text-[#64748B] dark:text-gray-400 leading-relaxed">
                        {player.reason}
                      </p>

                      {player.stats && (
                        <p className="mt-2 text-[12px] font-semibold text-[#16A34A]">
                          {player.stats}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>
      </main>

      <Footer />
    </div>
  );
}

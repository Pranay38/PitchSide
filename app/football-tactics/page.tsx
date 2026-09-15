import type { Metadata } from "next";
import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Football Tactics Hub | The Touchline Dribble",
  description: "Explore in-depth football tactics, from the inverted fullback to the box midfield.",
};

const clusters = [
  { name: "Inverted Fullback", slug: "inverted-fullback", desc: "Understanding the role of fullbacks moving into midfield." },
  { name: "Rest Defence", slug: "rest-defence", desc: "How teams organize themselves defensively while attacking." },
  { name: "Half Spaces", slug: "half-spaces", desc: "The most dangerous zones on a football pitch." },
  { name: "Gegenpressing", slug: "gegenpressing", desc: "Winning the ball back immediately after losing it." },
  { name: "False Nine", slug: "false-nine", desc: "The striker who drops deep to create overloads." },
  { name: "Box Midfield", slug: "box-midfield", desc: "The modern tactical setup for midfield dominance." },
  { name: "Double Pivot", slug: "double-pivot", desc: "Controlling the game with two holding midfielders." },
];

export default function FootballTacticsHubPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120]">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-black font-outfit text-[#0F172A] dark:text-white">Football Tactics Hub</h1>
          <p className="mt-4 text-xl text-[#475569] dark:text-gray-300">
            Master the modern game. Explore our comprehensive guides to football's most important tactical concepts.
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {clusters.map(cluster => (
            <Link 
              key={cluster.slug} 
              href={`/football-tactics/${cluster.slug}`}
              className="group block rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-[#0F172A] hover:-translate-y-1"
            >
              <h2 className="text-2xl font-black font-outfit text-[#0F172A] dark:text-white group-hover:text-[#16A34A] transition-colors">{cluster.name}</h2>
              <p className="mt-3 text-[#475569] dark:text-gray-300">{cluster.desc}</p>
              <div className="mt-6 flex items-center font-bold text-[#16A34A]">
                Explore tactics <span className="ml-2">→</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

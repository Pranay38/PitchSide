import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedPostsServer } from "@/lib/server-data";
import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";
import { PostCard } from "@/app/components/PostCard";
import Link from "next/link";

export const revalidate = 3600; // 1 hour

interface Props {
  params: Promise<{ cluster: string }>;
}

const clusterMetadata: Record<string, { title: string; desc: string; customText: string }> = {
  "inverted-fullback": { 
    title: "Inverted Fullback Tactics", 
    desc: "Understanding the role of fullbacks moving into midfield.", 
    customText: "The inverted fullback is a tactical innovation where the fullback moves into central midfield during the build-up phase, rather than overlapping down the wing. This creates central overloads, aids in rest defence against counter-attacks, and opens up the wing for traditional wingers."
  },
  "rest-defence": { 
    title: "Rest Defence Explained", 
    desc: "How teams organize themselves defensively while attacking.", 
    customText: "Rest defence refers to the structural organization of players who are not directly involved in the attack, positioned to immediately defend transitions if the ball is lost."
  },
  "half-spaces": { 
    title: "The Half Spaces", 
    desc: "The most dangerous zones on a football pitch.", 
    customText: "The half spaces are the vertical channels on a football pitch between the center and the wings. They offer optimal angles for passing and shooting, making them highly sought-after zones in modern positional play."
  },
  "gegenpressing": { 
    title: "Gegenpressing Tactics", 
    desc: "Winning the ball back immediately after losing it.", 
    customText: "Gegenpressing, or counter-pressing, involves immediately pressuring the opponent the moment possession is lost, aiming to win the ball back high up the pitch before the opponent can transition into an organized attack."
  },
  "false-nine": { 
    title: "The False Nine Role", 
    desc: "The striker who drops deep to create overloads.", 
    customText: "A false nine is a center forward who frequently drops deep into midfield, pulling opposition center-backs out of position and creating numerical superiority in the center of the pitch."
  },
  "box-midfield": { 
    title: "Box Midfield Systems", 
    desc: "The modern tactical setup for midfield dominance.", 
    customText: "The box midfield typically consists of a double pivot at the base and two attacking midfielders (number 10s) at the top, forming a square or box shape. This allows for total central dominance and passing triangles."
  },
  "double-pivot": { 
    title: "The Double Pivot", 
    desc: "Controlling the game with two holding midfielders.", 
    customText: "A double pivot employs two holding midfielders situated in front of the defensive line. It provides defensive stability and facilitates varied build-up patterns by having two central outlets."
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cluster } = await params;
  const data = clusterMetadata[cluster];
  if (!data) return { title: "Tactics Hub Not Found" };

  return {
    title: `${data.title} | The Touchline Dribble`,
    description: data.desc,
  };
}

export default async function TacticalClusterPage({ params }: Props) {
  const { cluster } = await params;
  const data = clusterMetadata[cluster];
  
  if (!data) {
    notFound();
  }

  const allPosts = await getPublishedPostsServer();
  const topicNeedle = cluster.replace(/-/g, " ");

  const clusterPosts = allPosts.filter((post: any) => {
    const haystacks = [
      post.club,
      post.title,
      post.excerpt,
      ...(post.tags || []),
    ].map((value) => (value || "").toLowerCase());

    return haystacks.some((value) => value.includes(topicNeedle));
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120]">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/football-tactics" className="text-sm font-semibold text-[#16A34A] hover:underline">
            &larr; Back to Tactics Hub
          </Link>
        </div>

        <div className="mb-12 rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-[#0F172A]">
          <h1 className="text-4xl font-black font-outfit text-[#0F172A] dark:text-white">
            {data.title}
          </h1>
          <p className="mt-4 text-xl text-[#475569] dark:text-gray-300 font-medium">
            {data.desc}
          </p>
          <div className="mt-6 prose prose-lg prose-slate dark:prose-invert text-[#334155] dark:text-gray-300 border-l-4 border-[#16A34A] pl-6 py-2 bg-gray-50 dark:bg-white/5 rounded-r-xl">
            {data.customText}
          </div>
        </div>
        
        <div className="mt-12">
          <h2 className="text-2xl font-black font-outfit text-[#0F172A] dark:text-white mb-6">
            Latest Articles on {data.title}
          </h2>
          
          {clusterPosts.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {clusterPosts.map(post => (
                <PostCard key={post.id} post={post as any} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
              <p className="text-[#475569] dark:text-gray-400">
                More tactical analysis coming soon.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

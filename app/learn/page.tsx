import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedPostsServer } from "@/lib/server-data";
import { Header } from "@/app/components/Header";
import { Footer } from "@/app/components/Footer";
import { PostCard } from "@/app/components/PostCard";
import { SectionMarker } from "@/app/components/SectionMarker";
import { isExplainer, publishedPosts } from "@/app/lib/matchdayContent";
import type { BlogPost } from "@/app/data/posts";
export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Learn Football | The Touchline Dribble",
  description:
    "Understand the game behind the opinions: football tactics, squad building, rules and competitions explained.",
  alternates: { canonical: "https://www.thetouchlinedribble.in/learn" },
};
export default async function LearnPage() {
  const posts = publishedPosts(
    (await getPublishedPostsServer()) as BlogPost[],
  ).filter(isExplainer);
  const groups = [
    {
      name: "Tactics explained",
      matches: (p: BlogPost) =>
        !/transfer|squad|rule|competition/i.test(
          [p.category, ...p.tags].join(" "),
        ),
    },
    {
      name: "Transfers and squad building",
      matches: (p: BlogPost) =>
        /transfer|squad/i.test([p.category, ...p.tags].join(" ")),
    },
    {
      name: "Rules and competitions",
      matches: (p: BlogPost) =>
        !/transfer|squad/i.test([p.category, ...p.tags].join(" ")) &&
        /rule|competition/i.test([p.category, ...p.tags].join(" ")),
    },
  ];
  return (
    <div className="page-atmosphere min-h-screen">
      <Header />
      <main className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6">
        <SectionMarker minute="30′" label="Understand the Game" />
        <h1 className="font-headline text-4xl sm:text-5xl font-bold text-foreground">
          The knowledge behind the opinions.
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">
          Explore the ideas, decisions and rules that shape football. Start with
          a concept, then see how it connects to the latest talking points.
        </p>
        <div className="my-8 flex flex-wrap gap-4">
          <Link
            href="/glossary"
            className="rounded-full border border-border px-5 py-3 font-semibold hover:bg-secondary"
          >
            Football glossary
          </Link>
          <Link
            href="/football-tactics"
            className="rounded-full border border-border px-5 py-3 font-semibold hover:bg-secondary"
          >
            Explore tactical concepts
          </Link>
        </div>
        {groups.map((group) => {
          const items = posts.filter(group.matches);
          return items.length > 0 ? (
            <section key={group.name} className="mt-14">
              <h2 className="font-headline text-3xl mb-6">{group.name}</h2>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {items.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    trackingPlacement="learn"
                  />
                ))}
              </div>
            </section>
          ) : null;
        })}
        {!posts.length && (
          <p className="my-12 text-muted-foreground">
            Our dedicated explainers are being prepared. Explore the glossary
            and tactical concepts above in the meantime.
          </p>
        )}
      </main>
      <Footer />
    </div>
  );
}

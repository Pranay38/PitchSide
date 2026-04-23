"use client";
import { MatchCardEmbed } from "../components/MatchCard";
import { StadiumMatchCenter } from "../components/StadiumMatchCenter";
import { useParams } from "@/lib/router-compat";

export function MatchCenterEmbedPage() {
  const params = useParams();
  const id = params.id ? String(params.id) : "";
  
  if (!id) return <div>Missing match ID</div>;

  return (
    <div className="bg-white dark:bg-[#0F172A] min-h-screen">
      <StadiumMatchCenter matchId={id} />
    </div>
  );
}

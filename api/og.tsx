import { ImageResponse } from "@vercel/og";
import type { VercelRequest } from "@vercel/node";

export const config = {
    runtime: "edge",
};

export default async function handler(req: VercelRequest) {
    const { searchParams } = new URL(req.url || "", "https://pitchside.vercel.app");
    const title = searchParams.get("title") || "The Touchline Dribble";
    const club = searchParams.get("club") || "";
    const date = searchParams.get("date") || "";

    return new ImageResponse(
        (
            <div
                style={{
                    width: "1200px",
                    height: "630px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    padding: "60px",
                    background: "linear-gradient(145deg, #0B1120 0%, #1E293B 50%, #0F172A 100%)",
                    fontFamily: "sans-serif",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Decorative gradient orbs */}
                <div
                    style={{
                        position: "absolute",
                        top: "-80px",
                        right: "-80px",
                        width: "400px",
                        height: "400px",
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(22,163,74,0.3) 0%, transparent 70%)",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        bottom: "-120px",
                        left: "-60px",
                        width: "300px",
                        height: "300px",
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)",
                    }}
                />

                {/* Top bar — branding */}
                <div
                    style={{
                        position: "absolute",
                        top: "40px",
                        left: "60px",
                        right: "60px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                        }}
                    >
                        <div
                            style={{
                                width: "8px",
                                height: "32px",
                                borderRadius: "4px",
                                background: "linear-gradient(to bottom, #16A34A, #22c55e)",
                            }}
                        />
                        <span
                            style={{
                                color: "#94A3B8",
                                fontSize: "18px",
                                fontWeight: 700,
                                letterSpacing: "2px",
                                textTransform: "uppercase" as const,
                            }}
                        >
                            The Touchline Dribble
                        </span>
                    </div>
                    {club && (
                        <span
                            style={{
                                color: "#16A34A",
                                fontSize: "16px",
                                fontWeight: 700,
                                padding: "6px 16px",
                                borderRadius: "20px",
                                border: "1px solid rgba(22,163,74,0.3)",
                                background: "rgba(22,163,74,0.1)",
                            }}
                        >
                            {club}
                        </span>
                    )}
                </div>

                {/* Title */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                    }}
                >
                    <h1
                        style={{
                            color: "#FFFFFF",
                            fontSize: title.length > 60 ? "42px" : "52px",
                            fontWeight: 800,
                            lineHeight: 1.15,
                            margin: 0,
                            maxWidth: "900px",
                        }}
                    >
                        {title}
                    </h1>

                    {/* Bottom meta line */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                            marginTop: "8px",
                        }}
                    >
                        {date && (
                            <span
                                style={{
                                    color: "#64748B",
                                    fontSize: "16px",
                                    fontWeight: 500,
                                }}
                            >
                                {date}
                            </span>
                        )}
                        <span
                            style={{
                                color: "#16A34A",
                                fontSize: "16px",
                                fontWeight: 600,
                            }}
                        >
                            pitchside.vercel.app
                        </span>
                    </div>
                </div>

                {/* Bottom accent bar */}
                <div
                    style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "4px",
                        background: "linear-gradient(to right, #16A34A, #22c55e, #4ade80)",
                    }}
                />
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    );
}

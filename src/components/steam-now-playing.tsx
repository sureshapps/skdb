"use client";

import { useState, useEffect, useMemo } from "react";
import { Icons } from "@/components/icons";
import { Gamepad2 } from "lucide-react";
import { Equalizer } from "@/components/motion/equalizer";

interface SteamData {
  name: string;
  avatar: string;
  status: string;
  personastate: number;
  gameextrainfo: string | null;
  gameid: string | null;
  gameImage: string | null;
  lastPlayed: {
    name: string;
    appid: string;
    playtime_forever: number;
  } | null;
  level: number;
  gamesCount: number;
  profileUrl: string;
}

/**
 * Tries the portrait library capsule first (great for older titles), then
 * falls back to the official store header image, then a gamepad placeholder.
 * Keyed by appid in the parent so it remounts (and resets) when the game changes.
 */
function GameArt({
  appid,
  headerImage,
  alt,
}: {
  appid?: string;
  headerImage: string | null;
  alt: string;
}) {
  const sources = useMemo(() => {
    const arr: string[] = [];
    if (appid) {
      arr.push(
        `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/library_600x900.jpg`
      );
    }
    if (headerImage) arr.push(headerImage);
    return arr;
  }, [appid, headerImage]);

  const [idx, setIdx] = useState(0);

  if (sources.length === 0 || idx >= sources.length) {
    return (
      <div className="flex size-full items-center justify-center">
        <Gamepad2 className="size-6 text-white/40" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={sources[idx]}
      alt={alt}
      className="absolute inset-0 size-full object-cover"
      onError={() => setIdx((i) => i + 1)}
    />
  );
}

const FONT = { fontFamily: "Helvetica, Arial, sans-serif" } as const;

export function SteamNowPlaying() {
  const [data, setData] = useState<SteamData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchStatus() {
      try {
        const res = await fetch("/api/steam-stats");
        if (!res.ok) return;
        const json = await res.json();
        if (mounted) {
          setData(json);
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 300_000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading || !data) return null;

  const isPlaying = !!data.gameextrainfo;
  const gameName = isPlaying ? data.gameextrainfo : data.lastPlayed?.name;
  const gameId = isPlaying ? data.gameid : data.lastPlayed?.appid;

  if (!gameName) return null;

  const hoursPlayed = data.lastPlayed?.playtime_forever
    ? Math.round(data.lastPlayed.playtime_forever / 60)
    : null;

  const online = isPlaying || data.personastate >= 1;
  const statusLabel = isPlaying ? "In Game" : online ? "Online" : "Offline";

  const stats = [
    `Lvl ${data.level}`,
    `${data.gamesCount} games`,
    !isPlaying && hoursPlayed ? `${hoursPlayed}h` : null,
  ]
    .filter(Boolean)
    .join("  •  ");

  const fill = isPlaying ? 85 : online ? 55 : 25;

  return (
    <a
      href={data.profileUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Steam: ${gameName}`}
      className="audio-player group relative block h-[120px] w-full max-w-[400px] overflow-hidden rounded-[3px] shadow-lg"
      style={{ background: "linear-gradient(to bottom, #4c4e5a 0%, #2c2d33 100%)" }}
    >
      {/* cover */}
      <div className="absolute left-0 top-0 h-[115px] w-[100px] overflow-hidden bg-black sm:w-[110px]">
        <GameArt
          key={gameId ?? "none"}
          appid={gameId ?? undefined}
          headerImage={data.gameImage}
          alt={gameName}
        />
      </div>

      {/* play / pause button */}
      <span
        className="absolute left-[122px] top-[20px] flex size-[21px] items-center justify-center rounded-full sm:left-[132px]"
        style={{
          background: "linear-gradient(to bottom, #8a8c96 0%, #4a4c55 100%)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.35), 0 1px 2px rgba(0,0,0,.6)",
        }}
      >
        {isPlaying ? (
          <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden>
            <path d="M1.5 0.5 9 5 1.5 9.5z" fill="#64b44c" />
          </svg>
        ) : (
          <svg width="8" height="8" viewBox="0 0 10 10" aria-hidden>
            <rect x="1" y="0.5" width="3" height="9" fill="#d0d0d0" />
            <rect x="6" y="0.5" width="3" height="9" fill="#d0d0d0" />
          </svg>
        )}
      </span>

      {/* game title */}
      <h1
        className="absolute left-[150px] right-9 top-[20px] m-0 truncate p-0 text-[14px] font-bold leading-[21px] text-[#ececec] sm:left-[160px]"
        style={{ ...FONT, textShadow: "1px 1px 1px rgba(0,0,0,.5)" }}
      >
        {gameName}
      </h1>

      {/* steam logo */}
      <Icons.steam className="absolute right-3 top-[22px] size-4 text-white/30 transition-colors group-hover:text-white/60" />

      {/* persona + status */}
      <div
        className="absolute left-[122px] right-3 top-[52px] flex items-center gap-1.5 text-[11px] font-bold sm:left-[132px]"
        style={FONT}
      >
        <span className="truncate text-[#d8d8d8]">{data.name}</span>
        <span
          className="inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px]"
          style={{
            color: online ? "#64b44c" : "#e5584f",
            background: online ? "rgba(100,180,76,.15)" : "rgba(229,88,79,.15)",
          }}
        >
          {isPlaying ? (
            <Equalizer />
          ) : (
            <span
              className="size-1.5 rounded-full"
              style={{ background: online ? "#64b44c" : "#e5584f" }}
            />
          )}
          {statusLabel}
        </span>
        {!isPlaying && (
          <span className="shrink-0 text-[9px] font-normal text-[#9a9ca6]">(last played)</span>
        )}
      </div>

      {/* speaker icon + slider */}
      <svg
        className="absolute left-[122px] top-[78px] sm:left-[132px]"
        width="14"
        height="12"
        viewBox="0 0 14 12"
        aria-hidden
      >
        <path d="M0 4h3l4-3.5v11L3 8H0z" fill="#d8d8d8" />
        <path d="M9 3.5q2 2.5 0 5" stroke="#d8d8d8" strokeWidth="1.3" fill="none" />
      </svg>
      <div
        className="absolute left-[146px] right-4 top-[79px] h-2 rounded-[6px] sm:left-[156px]"
        style={{
          background: "#212227",
          boxShadow: "inset 0 1px 0 rgba(0,0,0,.3), 0 1px 0 rgba(255,255,255,.25)",
        }}
      >
        <div
          className="absolute left-px top-px h-[6px] rounded-[6px]"
          style={{
            width: `${fill}%`,
            background: "repeating-linear-gradient(-45deg, #64b44c 0 4px, #8fd276 4px 8px)",
            backgroundSize: "11px 11px",
            animation: isPlaying ? "np-stripes 1s linear infinite" : undefined,
          }}
        />
        <span
          className="absolute top-[-3px] block size-[14px] rounded-full"
          style={{
            left: `calc(${fill}% - 6px)`,
            background: "radial-gradient(circle at 40% 35%, #fff, #bbb)",
            boxShadow: "0 1px 2px rgba(0,0,0,.6)",
          }}
        />
      </div>

      {/* stats */}
      <p
        className="absolute left-[122px] right-3 top-[96px] m-0 truncate p-0 text-[10px] font-bold text-[#9a9ca6] sm:left-[132px]"
        style={FONT}
      >
        {stats}
      </p>

      {/* bottom time rail */}
      <div className="absolute bottom-0 left-0 h-[5px] w-full rounded-b-[2px] bg-[#999]">
        <div className="absolute inset-y-0 left-0 w-full bg-[#ccc]" />
        <div
          className="absolute inset-y-0 left-0 bg-[#64b44c]"
          style={{ width: isPlaying ? "62%" : "100%", opacity: isPlaying ? 1 : 0.55 }}
        />
      </div>

      <style>{`
        @keyframes np-stripes { to { background-position: 11px 0; } }
        @media (prefers-reduced-motion: reduce) { .audio-player * { animation: none !important; } }
      `}</style>
    </a>
  );
}

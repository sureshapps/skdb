"use client";

import { useEffect, useRef, useState } from "react";
import { Music, SkipBack, SkipForward } from "lucide-react";
import { tracks } from "@/data/tracks";

const FONT = { fontFamily: "Helvetica, Arial, sans-serif" } as const;
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

function fmt(t: number) {
  if (!isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function NowPlaying() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const shouldPlay = useRef(false);
  const dragging = useRef<null | "seek" | "volume">(null);

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [hover, setHover] = useState<{ x: number; t: number } | null>(null);
  const [failed, setFailed] = useState(false);

  const list = tracks ?? [];
  const track = list[index];

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = volume;
    a.muted = muted;
  }, [volume, muted]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    setCurrent(0);
    setDuration(0);
    setFailed(false);
    if (shouldPlay.current) a.play().catch(() => setPlaying(false));
  }, [index]);

  if (!track) return null;

  const go = (dir: 1 | -1) => {
    shouldPlay.current = playing || shouldPlay.current;
    setIndex((i) => (i + dir + list.length) % list.length);
  };

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      shouldPlay.current = true;
      a.play().catch(() => setFailed(true));
    } else {
      shouldPlay.current = false;
      a.pause();
    }
  };

  const ratio = (e: React.PointerEvent, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    return clamp((e.clientX - r.left) / r.width, 0, 1);
  };

  const seekTo = (r: number) => {
    const a = audioRef.current;
    if (a && duration) {
      a.currentTime = r * duration;
      setCurrent(r * duration);
    }
  };

  const progress = duration ? (current / duration) * 100 : 0;
  const vol = muted ? 0 : volume;

  return (
    <div
      className="audio-player relative h-[120px] w-full max-w-[400px] select-none rounded-[3px] shadow-lg"
      style={{ background: "linear-gradient(to bottom, #4c4e5a 0%, #2c2d33 100%)" }}
    >
      <audio
        ref={audioRef}
        src={track.src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onError={() => setFailed(true)}
        onEnded={() => {
          shouldPlay.current = true;
          if (list.length > 1) setIndex((i) => (i + 1) % list.length);
          else setPlaying(false);
        }}
      />

      {/* cover */}
      <div className="absolute left-0 top-0 flex h-[115px] w-[100px] items-center justify-center overflow-hidden rounded-tl-[3px] bg-black sm:w-[110px]">
        {track.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={track.cover} alt="" className="size-full object-cover" />
        ) : (
          <Music className="size-8 text-white/30" />
        )}
      </div>

      {/* play / pause */}
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play"}
        className="absolute left-[122px] top-[22px] flex size-[22px] items-center justify-center rounded-full sm:left-[132px]"
        style={{
          background: "linear-gradient(to bottom, #8a8c96 0%, #4a4c55 100%)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.35), 0 1px 2px rgba(0,0,0,.6)",
        }}
      >
        {playing ? (
          <svg width="8" height="8" viewBox="0 0 10 10" aria-hidden>
            <rect x="1" y="0.5" width="3" height="9" fill="#e8e8e8" />
            <rect x="6" y="0.5" width="3" height="9" fill="#e8e8e8" />
          </svg>
        ) : (
          <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden>
            <path d="M1.5 0.5 9 5 1.5 9.5z" fill="#64b44c" />
          </svg>
        )}
      </button>

      {/* title */}
      <h1
        className="absolute left-[152px] right-[60px] top-[22px] m-0 truncate p-0 text-[14px] font-bold leading-[22px] text-[#ececec] sm:left-[162px]"
        style={{ ...FONT, textShadow: "1px 1px 1px rgba(0,0,0,.5)" }}
      >
        {failed ? "Can't load track" : track.title}
      </h1>

      {/* prev / next */}
      {list.length > 1 && (
        <div className="absolute right-3 top-[25px] flex gap-2 text-[#c8c8c8]">
          <button type="button" aria-label="Previous track" onClick={() => go(-1)} className="hover:text-white">
            <SkipBack className="size-3.5" />
          </button>
          <button type="button" aria-label="Next track" onClick={() => go(1)} className="hover:text-white">
            <SkipForward className="size-3.5" />
          </button>
        </div>
      )}

      {/* time */}
      <p
        className="absolute left-[122px] top-[52px] m-0 p-0 text-[10px] font-bold tabular-nums text-[#9a9ca6] sm:left-[132px]"
        style={FONT}
      >
        {fmt(current)} / {fmt(duration)}
        {list.length > 1 && <span className="ml-2">{index + 1}/{list.length}</span>}
      </p>

      {/* mute */}
      <button
        type="button"
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? "Unmute" : "Mute"}
        className="absolute left-[122px] top-[78px] sm:left-[132px]"
      >
        <svg width="14" height="12" viewBox="0 0 14 12" aria-hidden>
          <path d="M0 4h3l4-3.5v11L3 8H0z" fill="#d8d8d8" />
          {muted || volume === 0 ? (
            <path d="M9 3.5l4 5M13 3.5l-4 5" stroke="#d8d8d8" strokeWidth="1.3" />
          ) : (
            <path d="M9 3.5q2 2.5 0 5" stroke="#d8d8d8" strokeWidth="1.3" fill="none" />
          )}
        </svg>
      </button>

      {/* volume slider */}
      <div
        role="slider"
        aria-label="Volume"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(vol * 100)}
        tabIndex={0}
        className="absolute left-[146px] right-4 top-[77px] h-3 cursor-pointer touch-none sm:left-[156px]"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          dragging.current = "volume";
          setMuted(false);
          setVolume(ratio(e, e.currentTarget));
        }}
        onPointerMove={(e) => dragging.current === "volume" && setVolume(ratio(e, e.currentTarget))}
        onPointerUp={() => (dragging.current = null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") setVolume((v) => clamp(v + 0.05, 0, 1));
          if (e.key === "ArrowLeft") setVolume((v) => clamp(v - 0.05, 0, 1));
        }}
      >
        <div
          className="absolute inset-x-0 top-[2px] h-2 rounded-[6px]"
          style={{
            background: "#212227",
            boxShadow: "inset 0 1px 0 rgba(0,0,0,.3), 0 1px 0 rgba(255,255,255,.25)",
          }}
        >
          <div
            className="absolute left-px top-px h-[6px] rounded-[6px]"
            style={{
              width: `calc(${vol * 100}% - 2px)`,
              background: "repeating-linear-gradient(-45deg, #64b44c 0 4px, #8fd276 4px 8px)",
            }}
          />
          <span
            className="absolute top-[-3px] block size-[14px] rounded-full"
            style={{
              left: `calc(${vol * 100}% - 7px)`,
              background: "radial-gradient(circle at 40% 35%, #fff, #bbb)",
              boxShadow: "0 1px 2px rgba(0,0,0,.6)",
            }}
          />
        </div>
      </div>

      {/* bottom progress rail */}
      <div
        role="slider"
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(current)}
        tabIndex={0}
        className="absolute bottom-0 left-0 h-3 w-full cursor-pointer touch-none"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          dragging.current = "seek";
          seekTo(ratio(e, e.currentTarget));
        }}
        onPointerMove={(e) => {
          const r = ratio(e, e.currentTarget);
          setHover({ x: r * 100, t: r * duration });
          if (dragging.current === "seek") seekTo(r);
        }}
        onPointerUp={() => (dragging.current = null)}
        onPointerLeave={() => setHover(null)}
        onKeyDown={(e) => {
          const a = audioRef.current;
          if (!a) return;
          if (e.key === "ArrowRight") a.currentTime = clamp(a.currentTime + 5, 0, duration);
          if (e.key === "ArrowLeft") a.currentTime = clamp(a.currentTime - 5, 0, duration);
        }}
      >
        <div className="absolute inset-x-0 bottom-0 h-[5px] overflow-hidden rounded-b-[2px] bg-[#999]">
          <div className="absolute inset-y-0 left-0 bg-[#64b44c]" style={{ width: `${progress}%` }} />
        </div>
        {duration > 0 && (
          <span
            className="absolute bottom-[-4px] block h-[14px] w-[12px] -translate-x-1/2 rounded-full bg-gradient-to-b from-white to-[#bbb] shadow"
            style={{ left: `${progress}%` }}
          />
        )}
        {hover && duration > 0 && (
          <span
            className="pointer-events-none absolute bottom-[16px] -translate-x-1/2 rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-[#666] shadow"
            style={{ left: `${clamp(hover.x, 6, 94)}%`, ...FONT }}
          >
            {fmt(hover.t)}
          </span>
        )}
      </div>
    </div>
  );
}

export default NowPlaying;

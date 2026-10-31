"use client";
import { useRef, useState } from "react";
import { ArrowUpRight, Maximize2, Pause, Play } from "lucide-react";
import type { Project } from "@/data/projects";
import { demoClassInfo } from "@/data/demo-class";
import { hasVideo, mediaFor } from "@/data/demo-media";
import { MediaSkeleton, SkeletonCover } from "./skeleton/primitives";

/**
 * A project's demonstration video: a 16:9 frame with a poster, play and pause, captions, full screen and a
 * link to the full page. Nothing loads until the visitor presses play (`preload="none"`, and no source is
 * attached before that), nothing autoplays, and a video without a poster and captions is never shown.
 * When the file does not exist yet, an honest card says what the recording will show.
 */
export default function DemoVideo({ project }: { project: Project }) {
  const media = mediaFor(project);
  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  // The poster (before play) or the first frame (after) has arrived; until then the frame holds a skeleton.
  const [posterLoaded, setPosterLoaded] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  if (!media) return null;
  const ready = hasVideo(media) && !failed;
  const waiting = ready && (started ? !videoLoaded : !!media.poster && !posterLoaded);
  const info = demoClassInfo[media.demoClass];

  const toggle = () => {
    if (!started) {
      setStarted(true);
      // The element mounts on this click; play() runs once its source is attached.
      requestAnimationFrame(() => void video.current?.play().catch(() => setPlaying(false)));
      return;
    }
    const v = video.current;
    if (!v) return;
    if (v.paused) void v.play().catch(() => setPlaying(false));
    else v.pause();
  };
  const full = () => {
    const el = frame.current;
    if (el?.requestFullscreen) void el.requestFullscreen().catch(() => {});
  };

  return (
    <section className="dv" aria-labelledby={`dv-${project.slug}`} data-ready={ready || undefined}>
      <header className="dv-head">
        <h3 id={`dv-${project.slug}`}>Watch: {media.title}</h3>
        <span className="dv-class mono">{info.label}</span>
      </header>
      <div className="dv-frame" ref={frame} aria-busy={waiting || undefined}>
        {ready ? (
          <>
            {!started && media.poster && (
              // The poster is a plain image until the visitor asks for the video.
              // eslint-disable-next-line @next/next/no-img-element
              <img className="dv-poster" src={media.poster} alt={`Poster for the ${media.title} demonstration`} loading="lazy" onLoad={() => setPosterLoaded(true)} onError={() => setPosterLoaded(true)} />
            )}
            {started && (
              <video
                ref={video}
                className="dv-video"
                controls
                playsInline
                preload="none"
                poster={media.poster ?? undefined}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onLoadedData={() => setVideoLoaded(true)}
                onError={() => setFailed(true)}
              >
                <source src={media.video ?? undefined} type="video/mp4" />
                <track kind="captions" srcLang="en" label="English" src={media.captions ?? undefined} default />
              </video>
            )}
            <SkeletonCover ready={!waiting} skeleton={<MediaSkeleton />} label={started ? "Loading the video" : "Loading the poster"} tone="dark" />
            <div className="dv-bar">
              <button type="button" onClick={toggle} aria-label={playing ? `Pause the ${media.title} video` : `Play the ${media.title} video`}>
                {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
                {playing ? "Pause" : "Play"}
              </button>
              <button type="button" onClick={full} aria-label="Full screen">
                <Maximize2 size={16} aria-hidden="true" /> Full screen
              </button>
            </div>
          </>
        ) : (
          <div className="dv-pending">
            <p className="dv-state mono">{failed ? "The video could not be loaded" : "Video in preparation"}</p>
            <p className="dv-what">
              About {media.seconds} seconds: {media.workflow}
            </p>
            <ol className="dv-shots">
              {media.shots.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </div>
        )}
      </div>
      <p className="dv-limit">
        <b>What it is not:</b> {media.limitation} {info.blurb}
      </p>
      <p className="dv-links">
        <a href={`/projects/${project.slug}/`}>
          Full project page <ArrowUpRight size={14} aria-hidden="true" />
        </a>
        {project.sourceVisibility === "public" && project.githubUrl && (
          <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
            Source <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        )}
      </p>
    </section>
  );
}

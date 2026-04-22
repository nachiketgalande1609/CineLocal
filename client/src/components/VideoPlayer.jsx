import React, { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useWatchProgress } from "../hooks/useWatchProgress";
import styles from "./VideoPlayer.module.css";

function fmt(s) {
  if (!s || isNaN(s)) return "0:00";
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const VOLUME_KEY = "cinelocal_volume";

export default function VideoPlayer({ movieId, movie, startTime }) {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressRef = useRef(null);
  const hideTimer = useRef(null);
  const saveTimer = useRef(null);
  const { getProgress, saveProgress, clearProgress } = useWatchProgress(movieId);

  const [paused, setPaused] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [pip, setPip] = useState(false);
  const [hoverPct, setHoverPct] = useState(null);
  const [hoverTime, setHoverTime] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [showReplay, setShowReplay] = useState(false);
  const [skipFlash, setSkipFlash] = useState(null);
  const [volumeVisible, setVolumeVisible] = useState(false);

  // Restore saved volume
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const saved = parseFloat(localStorage.getItem(VOLUME_KEY));
    if (!isNaN(saved)) { v.volume = saved; setVolume(saved); }
  }, []);

  // Resume start time
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const savedProgress = getProgress();
    const t = startTime || savedProgress?.time || 0;
    if (t > 0) {
      const onLoad = () => { v.currentTime = t; };
      v.addEventListener("loadedmetadata", onLoad, { once: true });
      return () => v.removeEventListener("loadedmetadata", onLoad);
    }
  }, [movieId]);

  // Auto-save every 5s
  useEffect(() => {
    saveTimer.current = setInterval(() => {
      const v = videoRef.current;
      if (v && !v.paused) saveProgress(v.currentTime, v.duration);
    }, 5000);
    return () => clearInterval(saveTimer.current);
  }, [movieId]);

  const showControlsTemp = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    if (!videoRef.current?.paused) {
      hideTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("mousemove", showControlsTemp);
    el.addEventListener("touchstart", showControlsTemp);
    return () => {
      el.removeEventListener("mousemove", showControlsTemp);
      el.removeEventListener("touchstart", showControlsTemp);
    };
  }, [showControlsTemp]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onPlay = () => { setPaused(false); setShowReplay(false); showControlsTemp(); hideTimer.current = setTimeout(() => setShowControls(false), 3000); };
    const onPause = () => { setPaused(true); setShowControls(true); clearTimeout(hideTimer.current); };
    const onTimeUpdate = () => setCurrentTime(v.currentTime);
    const onDuration = () => setDuration(v.duration);
    const onProgress = () => { if (v.buffered.length > 0) setBuffered(v.buffered.end(v.buffered.length - 1)); };
    const onWaiting = () => setLoading(true);
    const onCanPlay = () => setLoading(false);
    const onEnded = () => { setShowReplay(true); setShowControls(true); saveProgress(v.duration, v.duration); clearProgress(); };
    const onVolumeChange = () => {
      setVolume(v.volume);
      setMuted(v.muted);
      if (!v.muted) localStorage.setItem(VOLUME_KEY, v.volume);
    };
    const onRateChange = () => setSpeed(v.playbackRate);
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    const onPipEnter = () => setPip(true);
    const onPipLeave = () => setPip(false);

    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("durationchange", onDuration);
    v.addEventListener("progress", onProgress);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("ended", onEnded);
    v.addEventListener("volumechange", onVolumeChange);
    v.addEventListener("ratechange", onRateChange);
    v.addEventListener("enterpictureinpicture", onPipEnter);
    v.addEventListener("leavepictureinpicture", onPipLeave);
    document.addEventListener("fullscreenchange", onFsChange);

    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("durationchange", onDuration);
      v.removeEventListener("progress", onProgress);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("volumechange", onVolumeChange);
      v.removeEventListener("ratechange", onRateChange);
      v.removeEventListener("enterpictureinpicture", onPipEnter);
      v.removeEventListener("leavepictureinpicture", onPipLeave);
      document.removeEventListener("fullscreenchange", onFsChange);
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const v = videoRef.current;
      if (!v) return;
      showControlsTemp();
      if (e.key === " " || e.key === "k") { e.preventDefault(); v.paused ? v.play() : v.pause(); }
      else if (e.key === "ArrowRight" || e.key === "l") { e.preventDefault(); skip(10); }
      else if (e.key === "ArrowLeft" || e.key === "j") { e.preventDefault(); skip(-10); }
      else if (e.key === "ArrowUp") { e.preventDefault(); v.volume = Math.min(1, v.volume + 0.1); }
      else if (e.key === "ArrowDown") { e.preventDefault(); v.volume = Math.max(0, v.volume - 0.1); }
      else if (e.key === "m") { v.muted = !v.muted; }
      else if (e.key === "f") { toggleFullscreen(); }
      else if (e.key === "p") { togglePiP(); }
      else if (e.key === "Escape" && !document.fullscreenElement) { navigate(-1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  function skip(sec) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + sec));
    setSkipFlash(sec > 0 ? "forward" : "backward");
    setTimeout(() => setSkipFlash(null), 600);
    showControlsTemp();
  }

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
  }

  function seekToPercent(pct) {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    v.currentTime = pct * v.duration;
  }

  function getPctFromEvent(e) {
    const bar = progressRef.current;
    if (!bar) return 0;
    const rect = bar.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }

  function handleProgressClick(e) { seekToPercent(getPctFromEvent(e)); }
  function handleProgressMouseMove(e) { const pct = getPctFromEvent(e); setHoverPct(pct * 100); setHoverTime(fmt(pct * duration)); }
  function handleProgressMouseLeave() { setHoverPct(null); setHoverTime(null); }

  function handleProgressMouseDown(e) {
    setDragging(true);
    seekToPercent(getPctFromEvent(e));
    const onMove = (e) => seekToPercent(getPctFromEvent(e));
    const onUp = () => { setDragging(false); document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  function handleVolumeChange(e) {
    const v = videoRef.current;
    if (!v) return;
    const val = parseFloat(e.target.value);
    v.volume = val;
    v.muted = val === 0;
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
  }

  function changeSpeed(s) {
    const v = videoRef.current;
    if (v) v.playbackRate = s;
    setShowSpeedMenu(false);
  }

  async function toggleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) await el.requestFullscreen().catch(() => {});
    else await document.exitFullscreen().catch(() => {});
  }

  async function togglePiP() {
    const v = videoRef.current;
    if (!v || !document.pictureInPictureEnabled) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await v.requestPictureInPicture();
    } catch {}
  }

  const playedPct = duration ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration ? (buffered / duration) * 100 : 0;
  const remaining = duration - currentTime;

  return (
    <div
      ref={containerRef}
      className={`${styles.player} ${showControls ? styles.controlsVisible : ""}`}
    >
      <video
        ref={videoRef}
        className={styles.video}
        src={`/api/stream/${movieId}`}
        poster={movie?.backdrop || movie?.poster}
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
      />

      {loading && !showReplay && (
        <div className={styles.spinnerWrap}><div className={styles.spinner} /></div>
      )}

      {skipFlash && (
        <div className={`${styles.skipFlash} ${skipFlash === "forward" ? styles.skipRight : styles.skipLeft}`}>
          {skipFlash === "forward" ? (
            <><svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M18 13a6 6 0 0 1-6 6 6 6 0 0 1-6-6 6 6 0 0 1 6-6V5l4 4-4 4v-3a4 4 0 0 0-4 4 4 4 0 0 0 4 4 4 4 0 0 0 4-4z"/></svg><span>+10s</span></>
          ) : (
            <><svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M6 13a6 6 0 0 0 6 6 6 6 0 0 0 6-6 6 6 0 0 0-6-6v-2L8 9l4 4v-3a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4z"/></svg><span>-10s</span></>
          )}
        </div>
      )}

      {showReplay && (
        <div className={styles.replayOverlay}>
          <button className={styles.replayBtn} onClick={() => { const v = videoRef.current; if (v) { v.currentTime = 0; v.play(); } }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
            </svg>
            Replay
          </button>
          <button className={styles.backFromReplay} onClick={() => navigate(-1)}>
            Back to Library
          </button>
        </div>
      )}

      <div className={styles.controls}>
        <div className={styles.topBar}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back
          </button>
          <div className={styles.nowPlaying}>
            {movie?.title && <span className={styles.movieTitle}>{movie.title}</span>}
            {movie?.year && <span className={styles.movieYear}>{movie.year}</span>}
          </div>
        </div>

        <div className={styles.centerArea} onClick={togglePlay}>
          {paused && !showReplay && (
            <div className={styles.centerPlayIcon}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            </div>
          )}
        </div>

        <div className={styles.bottomControls}>
          <div
            ref={progressRef}
            className={styles.progressWrap}
            onClick={handleProgressClick}
            onMouseMove={handleProgressMouseMove}
            onMouseLeave={handleProgressMouseLeave}
            onMouseDown={handleProgressMouseDown}
          >
            <div className={styles.progressTrack}>
              <div className={styles.progressBuffered} style={{ width: `${bufferedPct}%` }} />
              <div className={styles.progressPlayed} style={{ width: `${playedPct}%` }} />
              <div className={`${styles.progressThumb} ${dragging ? styles.dragging : ""}`} style={{ left: `${playedPct}%` }} />
            </div>
            {hoverTime && hoverPct !== null && (
              <div className={styles.timeTooltip} style={{ left: `${Math.max(2, Math.min(98, hoverPct))}%` }}>
                {hoverTime}
              </div>
            )}
          </div>

          <div className={styles.btnRow}>
            <div className={styles.leftCtrls}>
              <button className={styles.ctrlBtn} onClick={togglePlay} title={paused ? "Play (Space)" : "Pause (Space)"}>
                {paused ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                )}
              </button>

              <button className={styles.ctrlBtn} onClick={() => skip(-10)} title="Skip back 10s (←)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.5 2C9 2 6 3.9 4.3 6.7L2 4.5V11h6.5L6.1 8.6C7.4 6.5 9.8 5 12.5 5c3.6 0 6.5 2.9 6.5 6.5S16.1 18 12.5 18c-2.1 0-4-.9-5.3-2.4L5 17.9C6.8 19.8 9.5 21 12.5 21 17.7 21 22 16.7 22 11.5S17.7 2 12.5 2z"/>
                  <text x="9" y="14" fontSize="5.5" fill="currentColor" stroke="none" fontWeight="bold" fontFamily="sans-serif">10</text>
                </svg>
              </button>

              <button className={styles.ctrlBtn} onClick={() => skip(10)} title="Skip forward 10s (→)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.5 2C15 2 18 3.9 19.7 6.7L22 4.5V11h-6.5l2.4-2.4C16.6 6.5 14.2 5 11.5 5 7.9 5 5 7.9 5 11.5S7.9 18 11.5 18c2.1 0 4-.9 5.3-2.4L19 17.9C17.2 19.8 14.5 21 11.5 21 6.3 21 2 16.7 2 11.5S6.3 2 11.5 2z"/>
                  <text x="8.5" y="14" fontSize="5.5" fill="currentColor" stroke="none" fontWeight="bold" fontFamily="sans-serif">10</text>
                </svg>
              </button>

              <div
                className={styles.volumeWrap}
                onMouseEnter={() => setVolumeVisible(true)}
                onMouseLeave={() => setVolumeVisible(false)}
              >
                <button className={styles.ctrlBtn} onClick={toggleMute} title="Toggle mute (M)">
                  {muted || volume === 0 ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                      <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
                    </svg>
                  ) : volume < 0.5 ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                    </svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                    </svg>
                  )}
                </button>
                {volumeVisible && (
                  <input
                    type="range"
                    className={styles.volumeSlider}
                    min="0" max="1" step="0.02"
                    value={muted ? 0 : volume}
                    onChange={handleVolumeChange}
                  />
                )}
              </div>

              <span className={styles.timeDisplay}>
                {fmt(currentTime)} <span className={styles.timeSep}>/</span> {fmt(duration)}
              </span>
              {duration > 0 && (
                <span className={styles.timeRemaining}>-{fmt(remaining)}</span>
              )}
            </div>

            <div className={styles.rightCtrls}>
              {/* PiP */}
              {document.pictureInPictureEnabled && (
                <button
                  className={`${styles.ctrlBtn} ${pip ? styles.ctrlActive : ""}`}
                  onClick={togglePiP}
                  title="Picture-in-Picture (P)"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2"/>
                    <rect x="13" y="11" width="8" height="6" rx="1" fill="currentColor" stroke="none" opacity="0.9"/>
                  </svg>
                </button>
              )}

              {/* Speed */}
              <div className={styles.speedWrap}>
                <button
                  className={styles.speedBtn}
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  title="Playback speed"
                >
                  {speed === 1 ? "1×" : `${speed}×`}
                </button>
                {showSpeedMenu && (
                  <div className={styles.speedMenu}>
                    {SPEEDS.map((s) => (
                      <button
                        key={s}
                        className={`${styles.speedOption} ${speed === s ? styles.speedActive : ""}`}
                        onClick={() => changeSpeed(s)}
                      >
                        {s === 1 ? "Normal" : `${s}×`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button className={styles.ctrlBtn} onClick={toggleFullscreen} title="Fullscreen (F)">
                {fullscreen ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

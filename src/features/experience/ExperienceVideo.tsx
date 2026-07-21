import React, { useRef, useEffect, useState } from 'react';
import styles from './ExperienceVideo.module.css';

interface ExperienceVideoProps {
  src: string;
  poster?: string;
  progress: number; // 0.0 to 1.0
  onReady?: () => void;
}

const SEEK_EPSILON = 0.05; // 50ms threshold to prevent redundant micro-seeks

export const ExperienceVideo: React.FC<ExperienceVideoProps> = ({
  src,
  poster,
  progress,
  onReady,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Track readiness to hide poster
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Playback refs for hot-path animation (no React state for these)
  const seekInProgress = useRef(false);
  const targetTimeRef = useRef(0);
  const rafIdRef = useRef(0);

  // Initialize and handle video readiness
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleReady = () => {
      if (!isVideoReady) {
        setIsVideoReady(true);
        if (onReady) onReady();
      }
    };

    // 'loadeddata' or 'canplay' means we have at least one frame ready to show
    video.addEventListener('loadeddata', handleReady);
    video.addEventListener('canplay', handleReady);

    return () => {
      video.removeEventListener('loadeddata', handleReady);
      video.removeEventListener('canplay', handleReady);
    };
  }, [isVideoReady, onReady]);

  // Handle seeking mechanism
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleSeeked = () => {
      seekInProgress.current = false;
    };

    video.addEventListener('seeked', handleSeeked);

    return () => {
      video.removeEventListener('seeked', handleSeeked);
    };
  }, []);

  // Update target time on progress change
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !video.duration || isNaN(video.duration)) return;

    targetTimeRef.current = progress * video.duration;

    const processSeek = () => {
      if (seekInProgress.current) {
        // Wait for current seek to finish
        rafIdRef.current = requestAnimationFrame(processSeek);
        return;
      }

      const diff = Math.abs(video.currentTime - targetTimeRef.current);
      if (diff > SEEK_EPSILON) {
        seekInProgress.current = true;
        try {
          video.currentTime = targetTimeRef.current;
        } catch {
          // Swallow InvalidStateError which can occur on iOS Safari if seeked too early
          seekInProgress.current = false;
        }
      }

      rafIdRef.current = requestAnimationFrame(processSeek);
    };

    // Start the loop
    rafIdRef.current = requestAnimationFrame(processSeek);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = 0;
      }
    };
  }, [progress, isVideoReady]); // depends on readiness so duration is known

  return (
    <div className={styles.videoContainer}>
      {/* Fallback layer: remains mounted, hides ONLY when video has valid visual data */}
      {poster && (
        <img 
          src={poster} 
          alt="" 
          className={`${styles.fallbackPoster} ${isVideoReady ? styles.hidden : ''}`}
          aria-hidden="true"
        />
      )}
      
      {/* Persistent Video Element */}
      <video
        ref={videoRef}
        src={src}
        className={styles.videoElement}
        playsInline
        muted
        preload="auto"
        disableRemotePlayback
        // We do not add the poster attribute to the video tag itself 
        // to have absolute explicit control over the opaque fallback layer.
      />
    </div>
  );
};

export default ExperienceVideo;

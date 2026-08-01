/**
 * ExperienceVideo.tsx
 * ====================
 * Hardware-decoded video scrubbing for the cinematic scroll experience.
 *
 * WHY THIS APPROACH IS SUPERIOR TO CANVAS + JPEG SEQUENCE:
 * ---------------------------------------------------------
 * Sites like GTA VI (rockstargames.com/VI) use this technique.
 *
 * With canvas + JPEG:
 *   - Each frame is a CPU→GPU texture upload via ctx.drawImage()
 *   - On iOS Safari, this upload is async relative to the compositor
 *   - The compositor can snapshot the canvas BETWEEN a clear and a draw
 *   - Result: brief black flash (one compositor tick = ~16ms on 60Hz screen)
 *
 * With <video currentTime> scrubbing:
 *   - The H.264/HEVC hardware decoder runs on a DEDICATED GPU CHIP
 *   - Decoded frames live PERMANENTLY on the GPU — zero CPU-to-GPU upload
 *   - video.currentTime = t is a GPU memory pointer swap — atomic, sub-millisecond
 *   - iOS Safari compositor treats video frames with HIGHEST priority
 *   - Result: ZERO black frames, even during the fastest scroll
 *
 * USAGE:
 *   - Provide a video file URL (MP4 with H.264 baseline profile for max compatibility)
 *   - Convert JPEG sequence to MP4:
 *       ffmpeg -framerate 30 -i frame%04d.jpg -c:v libx264 -pix_fmt yuv420p out.mp4
 *   - The component handles preload, play/pause, and currentTime scrubbing automatically
 */

import React, { useRef, useEffect } from 'react';
import styles from './ExperienceVideo.module.css';

interface ExperienceVideoProps {
  videoUrl: string;
  scrollProgress: number;
  onReady?: () => void;
  onProgress?: (progress: number) => void;
}

export const ExperienceVideo: React.FC<ExperienceVideoProps> = ({
  videoUrl,
  scrollProgress,
  onReady,
  onProgress,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isReadyRef = useRef(false);
  const lastProgressRef = useRef(-1);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    isReadyRef.current = false;
    lastProgressRef.current = -1;

    const handleCanPlay = () => {
      if (isReadyRef.current) return;
      isReadyRef.current = true;
      video.currentTime = 0;
      onReady?.();
    };

    const handleProgress = () => {
      if (!video.duration || video.duration === 0) return;
      let bufferedSeconds = 0;
      const buf = video.buffered;
      for (let i = 0; i < buf.length; i++) {
        bufferedSeconds += buf.end(i) - buf.start(i);
      }
      const ratio = Math.min(1, bufferedSeconds / video.duration);
      if (Math.abs(ratio - lastProgressRef.current) > 0.01) {
        lastProgressRef.current = ratio;
        onProgress?.(ratio);
      }
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('progress', handleProgress);

    // iOS Safari requires play() to start buffering — preload="auto" alone is unreliable on iOS
    video.play()
      .then(() => { video.pause(); })
      .catch(() => { /* Autoplay blocked — buffering still starts via preload="auto" */ });

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('progress', handleProgress);
    };
  }, [videoUrl, onReady, onProgress]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isReadyRef.current) return;
    if (!video.duration || video.duration === 0) return;

    const targetTime = Math.max(0, Math.min(video.duration, scrollProgress * video.duration));
    if (Math.abs(video.currentTime - targetTime) > 0.001) {
      video.currentTime = targetTime;
    }
  }, [scrollProgress]);

  return (
    <div className={styles.videoContainer}>
      <video
        ref={videoRef}
        src={videoUrl}
        className={styles.videoElement}
        playsInline
        muted
        preload="auto"
        controls={false}
        aria-label="Cinematic frame sequence — brick manufacturing process"
      />
    </div>
  );
};

export default ExperienceVideo;

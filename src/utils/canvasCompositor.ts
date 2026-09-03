import {
  LayoutMode,
  CameraShape,
  AspectRatio,
  StudioSettings,
  FloatingReaction,
  VideoFilter,
  MainFeedRole,
} from '../types';
import { TranscriptionSubtitle } from './transcriptionService';

export function getCanvasDimensions(aspectRatio: AspectRatio): { width: number; height: number } {
  switch (aspectRatio) {
    case '9:16':
      return { width: 1080, height: 1920 };
    case '1:1':
      return { width: 1080, height: 1080 };
    case '16:9':
    default:
      return { width: 1920, height: 1080 };
  }
}

export interface PipRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Calculate the precise PiP bounding box in canvas pixel space
export function calculatePipRect(settings: StudioSettings, W: number, H: number): PipRect {
  const pipScale = Math.min(0.7, Math.max(0.15, (settings.pipSizePercent || 30) / 100));
  let pipW = W * pipScale;
  let pipH = pipW;

  if (settings.cameraShape === 'rectangle') {
    if (settings.pipRectRatio === '16:9') {
      pipH = pipW * (9 / 16);
    } else if (settings.pipRectRatio === '4:3') {
      pipH = pipW * (3 / 4);
    } else {
      pipH = pipW; // 1:1
    }
  } else if (settings.cameraShape === 'square') {
    pipH = pipW;
  } else if (settings.cameraShape === 'rounded-rect') {
    if (settings.pipRectRatio === '16:9') {
      pipH = pipW * (9 / 16);
    } else if (settings.pipRectRatio === '4:3') {
      pipH = pipW * (3 / 4);
    } else {
      pipH = pipW;
    }
  } else if (settings.cameraShape === 'oval') {
    pipH = pipW * 1.25;
  } else if (settings.cameraShape === 'circle') {
    pipH = pipW;
  }

  // Margin for standard corner snaps
  const margin = Math.round(W * 0.025);
  let pipX = W - pipW - margin;
  let pipY = H - pipH - margin;

  if (settings.isCustomPipPosition || settings.layout === 'pip-custom') {
    // Custom drag position (percentages of remaining travel space)
    pipX = (settings.pipCustomX / 100) * (W - pipW);
    pipY = (settings.pipCustomY / 100) * (H - pipH);
  } else if (settings.layout === 'pip-bottom-left') {
    pipX = margin;
    pipY = H - pipH - margin;
  } else if (settings.layout === 'pip-top-right') {
    pipX = W - pipW - margin;
    pipY = margin + (settings.overlayTitle ? 70 : 0);
  } else if (settings.layout === 'pip-top-left') {
    pipX = margin;
    pipY = margin + (settings.overlayTitle ? 70 : 0);
  } else if (settings.layout === 'pip-bottom-right') {
    pipX = W - pipW - margin;
    pipY = H - pipH - margin;
  }

  // Clamp within canvas boundaries
  pipX = Math.max(0, Math.min(W - pipW, pipX));
  pipY = Math.max(0, Math.min(H - pipH, pipY));

  return { x: pipX, y: pipY, width: pipW, height: pipH };
}

// Helper to draw an image/video with "object-fit: cover"
export function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
  dx: number,
  dy: number,
  dWidth: number,
  dHeight: number,
  flipX: boolean = false
) {
  const isVid = img instanceof HTMLVideoElement;
  const isImg = img instanceof HTMLImageElement;
  const sWidth = isVid
    ? (img.videoWidth || dWidth)
    : isImg
    ? (img.naturalWidth || img.width || dWidth)
    : (img.width || dWidth);
  const sHeight = isVid
    ? (img.videoHeight || dHeight)
    : isImg
    ? (img.naturalHeight || img.height || dHeight)
    : (img.height || dHeight);

  if (sWidth === 0 || sHeight === 0) return;

  const targetRatio = dWidth / dHeight;
  const sourceRatio = sWidth / sHeight;

  let sx = 0,
    sy = 0,
    sw = sWidth,
    sh = sHeight;

  if (sourceRatio > targetRatio) {
    sw = sHeight * targetRatio;
    sx = (sWidth - sw) / 2;
  } else {
    sh = sWidth / targetRatio;
    sy = (sHeight - sh) / 2;
  }

  ctx.save();
  try {
    if (flipX) {
      ctx.translate(dx + dWidth, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dWidth, dHeight);
    } else {
      ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dWidth, dHeight);
    }
  } catch (err) {
    // Gracefully ignore momentary frame draw glitches during video seeking
  }
  ctx.restore();
}

// Helper to draw video feed or fallback thumbnail poster smoothly to avoid black screens
export function drawFeedOrFallback(
  ctx: CanvasRenderingContext2D,
  feedMedia: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement | null,
  thumbnailImage: HTMLImageElement | null,
  dx: number,
  dy: number,
  dWidth: number,
  dHeight: number,
  flipX: boolean = false
): boolean {
  if (!feedMedia) {
    if (thumbnailImage && thumbnailImage.complete && (thumbnailImage.naturalWidth > 0 || thumbnailImage.width > 0)) {
      drawCoverImage(ctx, thumbnailImage, dx, dy, dWidth, dHeight, flipX);
      return true;
    }
    return false;
  }

  const isVideo = feedMedia instanceof HTMLVideoElement;
  if (isVideo) {
    const vid = feedMedia as HTMLVideoElement;

    // 1. If video has decoded frames ready to paint (readyState >= 2 and non-zero dimensions)
    if (vid.readyState >= 2 && vid.videoWidth > 0 && vid.videoHeight > 0) {
      try {
        drawCoverImage(ctx, vid, dx, dy, dWidth, dHeight, flipX);
        return true;
      } catch (e) {
        console.warn('Canvas drawCoverImage video frame error:', e);
      }
    }

    // 2. If video is paused, pre-loading, or buffering, use the crystal-clear thumbnail poster
    if (thumbnailImage && thumbnailImage.complete && (thumbnailImage.naturalWidth > 0 || thumbnailImage.width > 0)) {
      drawCoverImage(ctx, thumbnailImage, dx, dy, dWidth, dHeight, flipX);
      return true;
    }

    // 3. Fallback: attempt drawing video if metadata exists
    if (vid.videoWidth > 0) {
      try {
        drawCoverImage(ctx, vid, dx, dy, dWidth, dHeight, flipX);
        return true;
      } catch {
        // ignore
      }
    }

    return false;
  }

  // Canvas or Image (e.g. avatar fallback)
  drawCoverImage(ctx, feedMedia, dx, dy, dWidth, dHeight, flipX);
  return true;
}

// Helper to draw clipped path according to shape
export function applyShapePath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  shape: CameraShape,
  customCornerRadius?: number
) {
  ctx.beginPath();
  if (shape === 'circle') {
    const radius = Math.min(w, h) / 2;
    ctx.arc(x + w / 2, y + h / 2, radius, 0, Math.PI * 2);
  } else if (shape === 'oval') {
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  } else if (shape === 'square') {
    const rad = customCornerRadius !== undefined ? customCornerRadius : 0;
    if (rad > 0 && typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, w, h, rad);
    } else {
      ctx.rect(x, y, w, h);
    }
  } else if (shape === 'rectangle' || shape === 'rounded-rect') {
    const defaultRad = shape === 'rounded-rect' ? 24 : 8;
    const rad = customCornerRadius !== undefined ? customCornerRadius : defaultRad;
    if (rad > 0 && typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, w, h, rad);
    } else {
      ctx.rect(x, y, w, h);
    }
  } else {
    ctx.rect(x, y, w, h);
  }
  ctx.closePath();
}

function applyFilter(ctx: CanvasRenderingContext2D, filter: VideoFilter) {
  if (!filter || filter === 'none') {
    // Only reset if previously set, avoiding expensive software filter pipeline
    if (ctx.filter && ctx.filter !== 'none') {
      ctx.filter = 'none';
    }
    return;
  }

  switch (filter) {
    case 'vibrant':
      ctx.filter = 'saturate(1.35) contrast(1.08)';
      break;
    case 'warm':
      ctx.filter = 'sepia(0.18) saturate(1.18) brightness(1.04)';
      break;
    case 'cyberpunk':
      ctx.filter = 'contrast(1.25) hue-rotate(12deg) saturate(1.4)';
      break;
    case 'vintage':
      ctx.filter = 'sepia(0.35) contrast(1.1) brightness(0.95)';
      break;
    case 'grayscale':
      ctx.filter = 'grayscale(1) contrast(1.15)';
      break;
    default:
      ctx.filter = 'none';
      break;
  }
}

export function renderReactionFrame({
  ctx,
  sourceVideo,
  cameraVideo,
  fallbackAvatarCanvas,
  sourceThumbnailImage,
  settings,
  floatingReactions,
  currentTimeFormatted,
  activeSubtitle,
  isSourceVideoHidden = false,
  isRecording = false,
}: {
  ctx: CanvasRenderingContext2D;
  sourceVideo: HTMLVideoElement | null;
  cameraVideo: HTMLVideoElement | null;
  fallbackAvatarCanvas: HTMLCanvasElement | null;
  sourceThumbnailImage?: HTMLImageElement | null;
  settings: StudioSettings;
  floatingReactions: FloatingReaction[];
  currentTimeFormatted?: string;
  activeSubtitle?: TranscriptionSubtitle | null;
  isSourceVideoHidden?: boolean;
  isRecording?: boolean;
}) {
  const { width: W, height: H } = ctx.canvas;

  // In preview mode (when not recording):
  // The Stage Viewport directly displays native HTML5 video and camera elements with full hardware acceleration.
  // We keep canvas transparent so native elements show with zero black screen, and render live overlay annotations on top!
  if (!isRecording) {
    ctx.clearRect(0, 0, W, H);

    // Overlay Header Banner / Title Card if configured
    if (settings.overlayTitle && settings.overlayTitle.trim().length > 0) {
      ctx.save();
      const titleText = settings.overlayTitle.trim();
      ctx.font = 'bold 36px "Outfit", sans-serif';
      const textWidth = ctx.measureText(titleText).width;
      const bannerW = Math.min(W - 80, textWidth + 80);
      const bannerH = 64;
      const bannerX = (W - bannerW) / 2;
      const bannerY = 30;

      const grad = ctx.createLinearGradient(bannerX, bannerY, bannerX + bannerW, bannerY + bannerH);
      grad.addColorStop(0, 'rgba(15, 23, 42, 0.94)');
      grad.addColorStop(1, 'rgba(30, 41, 59, 0.94)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 32);
      } else {
        ctx.rect(bannerX, bannerY, bannerW, bannerH);
      }
      ctx.fill();

      ctx.strokeStyle = settings.pipBorderColor || '#f43f5e';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(bannerX + 32, bannerY + bannerH / 2, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(titleText, bannerX + 54, bannerY + bannerH / 2 + 1);
      ctx.restore();
    }

    // Live Speech-to-Text Transcription Subtitles
    if (settings.autoTranscribe && activeSubtitle && activeSubtitle.text) {
      renderSubtitlesLayer(ctx, activeSubtitle, settings, W, H);
    }

    // Render floating reactions
    renderFloatingReactionsLayer(ctx, floatingReactions, H);

    return;
  }

  // Clear background fast for recording
  ctx.save();
  ctx.fillStyle = '#08080a';
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // Determine which feed is camera and which is source video
  // Accept camera if it has loaded frames, live readyState, or non-zero videoWidth
  const rawCameraReady = !!(
    cameraVideo &&
    (cameraVideo.readyState >= 1 || (cameraVideo.videoWidth > 0 && cameraVideo.videoHeight > 0))
  );
  const cameraSource: HTMLVideoElement | HTMLCanvasElement | null =
    rawCameraReady ? cameraVideo : fallbackAvatarCanvas;

  // Source video is considered available if it has loaded metadata/frames or a pre-buffered thumbnail, and NOT hidden due to pause
  const hasThumbnail = !!(
    sourceThumbnailImage &&
    sourceThumbnailImage.complete &&
    sourceThumbnailImage.naturalWidth > 0
  );
  const rawSourceReady = !!(
    (sourceVideo &&
      (sourceVideo.readyState >= 1 || (sourceVideo.videoWidth > 0 && sourceVideo.videoHeight > 0))) ||
    hasThumbnail
  );
  const isSourceReady = rawSourceReady && !isSourceVideoHidden;

  // Identify Main Fullscreen Feed vs PiP Feed based on settings.mainFeed
  const isCameraMain = settings.mainFeed === 'camera';
  const mainFeedMedia = isCameraMain ? cameraSource : (isSourceReady ? sourceVideo : null);
  const pipFeedMedia = isCameraMain ? (isSourceReady ? sourceVideo : null) : cameraSource;
  const isMainMirror = isCameraMain ? settings.mirrorCamera : false;
  const isPipMirror = isCameraMain ? false : settings.mirrorCamera;

  // Thumbnail poster mapping (only assigned to the video feed)
  const mainThumbnail = isCameraMain ? null : (isSourceVideoHidden ? null : (sourceThumbnailImage || null));
  const pipThumbnail = isCameraMain ? (isSourceVideoHidden ? null : (sourceThumbnailImage || null)) : null;

  ctx.save();
  applyFilter(ctx, settings.filter);

  // Layout Rendering Logic
  switch (settings.layout) {
    case 'split-side-by-side': {
      const halfW = W / 2;

      // Left Feed (Main)
      const drewMain = drawFeedOrFallback(
        ctx,
        mainFeedMedia,
        mainThumbnail,
        0,
        0,
        halfW,
        H,
        isMainMirror
      );
      if (!drewMain) {
        renderPlaceholder(ctx, 0, 0, halfW, H, isCameraMain ? 'Camera Starting...' : 'Select Source Video');
      }

      // Right Feed (Secondary)
      const drewPip = drawFeedOrFallback(
        ctx,
        pipFeedMedia,
        pipThumbnail,
        halfW,
        0,
        halfW,
        H,
        isPipMirror
      );
      if (!drewPip) {
        renderPlaceholder(ctx, halfW, 0, halfW, H, isCameraMain ? 'Select Source Video' : 'Camera Off');
      }

      // Divider
      ctx.fillStyle = settings.pipBorderColor || '#f43f5e';
      ctx.fillRect(halfW - 2, 0, 4, H);
      break;
    }

    case 'split-top-bottom': {
      const halfH = H / 2;

      // Top Feed
      const drewMain = drawFeedOrFallback(
        ctx,
        mainFeedMedia,
        mainThumbnail,
        0,
        0,
        W,
        halfH,
        isMainMirror
      );
      if (!drewMain) {
        renderPlaceholder(ctx, 0, 0, W, halfH, isCameraMain ? 'Camera Starting...' : 'Select Source Video');
      }

      // Bottom Feed
      const drewPip = drawFeedOrFallback(
        ctx,
        pipFeedMedia,
        pipThumbnail,
        0,
        halfH,
        W,
        halfH,
        isPipMirror
      );
      if (!drewPip) {
        renderPlaceholder(ctx, 0, halfH, W, halfH, isCameraMain ? 'Select Source Video' : 'Camera Off');
      }

      // Divider
      ctx.fillStyle = settings.pipBorderColor || '#f43f5e';
      ctx.fillRect(0, halfH - 2, W, 4);
      break;
    }

    case 'stacked-shorts': {
      // Top 50% & Bottom 50% optimized for vertical shorts (9:16)
      const splitY = H * 0.48;

      const drewMain = drawFeedOrFallback(
        ctx,
        mainFeedMedia,
        mainThumbnail,
        0,
        0,
        W,
        splitY,
        isMainMirror
      );
      if (!drewMain) {
        renderPlaceholder(ctx, 0, 0, W, splitY, isCameraMain ? 'Camera Starting...' : 'Select Source Video');
      }

      const camY = splitY + 4;
      const camH = H - camY;
      const drewPip = drawFeedOrFallback(
        ctx,
        pipFeedMedia,
        pipThumbnail,
        0,
        camY,
        W,
        camH,
        isPipMirror
      );
      if (!drewPip) {
        renderPlaceholder(ctx, 0, camY, W, camH, isCameraMain ? 'Select Source Video' : 'Camera Off');
      }

      // Mid badge divider bar
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, splitY - 12, W, 24);
      ctx.fillStyle = settings.pipBorderColor || '#f43f5e';
      ctx.fillRect(0, splitY - 1, W, 2);
      break;
    }

    case 'pip-custom':
    case 'pip-bottom-right':
    case 'pip-bottom-left':
    case 'pip-top-right':
    case 'pip-top-left':
    default: {
      // 1. Draw Full Screen Background Canvas
      const drewMain = drawFeedOrFallback(
        ctx,
        mainFeedMedia,
        mainThumbnail,
        0,
        0,
        W,
        H,
        isMainMirror
      );
      if (!drewMain) {
        renderPlaceholder(
          ctx,
          0,
          0,
          W,
          H,
          isCameraMain
            ? 'Camera Active (Awaiting Preview...)'
            : (isSourceVideoHidden ? '⏸️ Video Paused (Hidden)' : 'No Source Video Loaded')
        );
      }

      // 2. Calculate Scalable & Draggable PiP Frame Position and Dimensions
      const { x: pipX, y: pipY, width: pipW, height: pipH } = calculatePipRect(settings, W, H);
      const cornerRad = settings.pipCornerRadius ?? (settings.cameraShape === 'square' ? 0 : 16);

      // 3. Draw Shadow or Glow behind PiP
      if (settings.pipShadow || settings.pipGlow) {
        ctx.save();
        ctx.shadowColor = settings.pipGlow ? settings.pipBorderColor : 'rgba(0, 0, 0, 0.75)';
        ctx.shadowBlur = settings.pipGlow ? 32 : 18;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = settings.pipGlow ? 0 : 8;

        applyShapePath(ctx, pipX, pipY, pipW, pipH, settings.cameraShape, cornerRad);
        ctx.fillStyle = '#141418';
        ctx.fill();
        ctx.restore();
      }

      // 4. Draw PiP Video Content within shape clip
      ctx.save();
      applyShapePath(ctx, pipX, pipY, pipW, pipH, settings.cameraShape, cornerRad);
      ctx.clip();

      const drewPip = drawFeedOrFallback(
        ctx,
        pipFeedMedia,
        pipThumbnail,
        pipX,
        pipY,
        pipW,
        pipH,
        isPipMirror
      );

      if (!drewPip) {
        renderPlaceholder(
          ctx,
          pipX,
          pipY,
          pipW,
          pipH,
          isCameraMain
            ? (isSourceVideoHidden ? '⏸️ Video Paused (Hidden)' : 'Click to Add Video')
            : 'Camera Off'
        );
      }
      ctx.restore();

      // 5. Draw PiP Border
      if (settings.pipBorderWidth > 0) {
        ctx.save();
        applyShapePath(ctx, pipX, pipY, pipW, pipH, settings.cameraShape, cornerRad);
        ctx.strokeStyle = settings.pipBorderColor || '#f43f5e';
        ctx.lineWidth = settings.pipBorderWidth;
        ctx.stroke();
        ctx.restore();
      }

      break;
    }
  }

  // Restore filter
  if (settings.filter && settings.filter !== 'none') {
    ctx.filter = 'none';
  }
  ctx.restore();

  // Overlay Header Banner / Title Card if configured
  if (settings.overlayTitle && settings.overlayTitle.trim().length > 0) {
    ctx.save();
    const titleText = settings.overlayTitle.trim();
    ctx.font = 'bold 36px "Outfit", sans-serif';
    const textWidth = ctx.measureText(titleText).width;
    const bannerW = Math.min(W - 80, textWidth + 80);
    const bannerH = 64;
    const bannerX = (W - bannerW) / 2;
    const bannerY = 30;

    // Gradient background pill
    const grad = ctx.createLinearGradient(bannerX, bannerY, bannerX + bannerW, bannerY + bannerH);
    grad.addColorStop(0, 'rgba(15, 23, 42, 0.94)');
    grad.addColorStop(1, 'rgba(30, 41, 59, 0.94)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 32);
    } else {
      ctx.rect(bannerX, bannerY, bannerW, bannerH);
    }
    ctx.fill();

    ctx.strokeStyle = settings.pipBorderColor || '#f43f5e';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Red dot indicator
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(bannerX + 32, bannerY + bannerH / 2, 7, 0, Math.PI * 2);
    ctx.fill();

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(titleText, bannerX + 54, bannerY + bannerH / 2 + 1);
    ctx.restore();
  }

  // Watermark (Bottom Left) - Kept OFF by default for clean export without unwanted branding
  if (settings.showWatermark && settings.watermarkText) {
    ctx.save();
    ctx.font = '600 24px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 8;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(settings.watermarkText, 40, H - 30);
    ctx.restore();
  }

  // Recording Timer overlay - Disabled by default so export remains 100% clean of timer badges
  if (settings.showTimerBadgeOnCanvas && currentTimeFormatted) {
    ctx.save();
    ctx.font = '700 22px "JetBrains Mono", monospace';
    const timeWidth = ctx.measureText(currentTimeFormatted).width;
    const pillW = timeWidth + 52;
    const pillH = 42;
    const pillX = 30;
    const pillY = 30;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(pillX, pillY, pillW, pillH, 21);
    } else {
      ctx.rect(pillX, pillY, pillW, pillH);
    }
    ctx.fill();
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Pulsing Red dot
    const pulseAlpha = 0.6 + 0.4 * Math.sin(Date.now() / 200);
    ctx.fillStyle = `rgba(239, 68, 68, ${pulseAlpha})`;
    ctx.beginPath();
    ctx.arc(pillX + 22, pillY + pillH / 2, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(currentTimeFormatted, pillX + 36, pillY + pillH / 2 + 1);
    ctx.restore();
  }

  // Live Speech-to-Text Transcription Subtitles
  if (settings.autoTranscribe && activeSubtitle && activeSubtitle.text) {
    renderSubtitlesLayer(ctx, activeSubtitle, settings, W, H);
  }

  // Render floating reactions
  renderFloatingReactionsLayer(ctx, floatingReactions, H);
}

function renderSubtitlesLayer(
  ctx: CanvasRenderingContext2D,
  activeSubtitle: TranscriptionSubtitle,
  settings: StudioSettings,
  W: number,
  H: number
) {
  ctx.save();
  const primaryText = activeSubtitle.text;
  const secondaryText = settings.transcriptionBilingual ? activeSubtitle.secondaryText : undefined;

  // Subtitle typography
  const isPortrait = H > W;
  const primaryFontSize = isPortrait ? 32 : 36;
  const secondaryFontSize = isPortrait ? 24 : 26;

  ctx.font = `bold ${primaryFontSize}px "Outfit", "PingFang SC", "Microsoft YaHei", sans-serif`;
  const primaryMetrics = ctx.measureText(primaryText);
  let maxTextWidth = primaryMetrics.width;

  let secMetrics: TextMetrics | null = null;
  if (secondaryText) {
    ctx.font = `600 ${secondaryFontSize}px "Plus Jakarta Sans", "PingFang SC", sans-serif`;
    secMetrics = ctx.measureText(secondaryText);
    maxTextWidth = Math.max(maxTextWidth, secMetrics.width);
  }

  const paddingX = 36;
  const boxW = Math.min(W - 80, maxTextWidth + paddingX * 2);
  const boxH = secondaryText ? (primaryFontSize + secondaryFontSize + 48) : (primaryFontSize + 36);
  const boxX = (W - boxW) / 2;
  // Position comfortably above bottom (or above watermark)
  const boxY = H - boxH - (isPortrait ? 130 : 80);

  // Glass backdrop pill
  ctx.fillStyle = 'rgba(10, 10, 15, 0.88)';
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(boxX, boxY, boxW, boxH, 20);
  } else {
    ctx.rect(boxX, boxY, boxW, boxH);
  }
  ctx.fill();

  // Subtle vibrant accent border
  ctx.strokeStyle = activeSubtitle.isFinal ? 'rgba(244, 63, 94, 0.6)' : 'rgba(99, 102, 241, 0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Primary Text (High Contrast White / Yellow on dark pill)
  ctx.font = `bold ${primaryFontSize}px "Outfit", "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 6;
  const primaryY = secondaryText ? boxY + 16 : boxY + (boxH - primaryFontSize) / 2;
  ctx.fillText(primaryText, W / 2, primaryY);

  // Secondary / Bilingual Translation Text
  if (secondaryText) {
    ctx.font = `600 ${secondaryFontSize}px "Plus Jakarta Sans", "PingFang SC", sans-serif`;
    ctx.fillStyle = '#fbbf24'; // Vibrant yellow / gold for bilingual contrast
    ctx.fillText(secondaryText, W / 2, primaryY + primaryFontSize + 10);
  }

  ctx.restore();
}

function renderFloatingReactionsLayer(
  ctx: CanvasRenderingContext2D,
  floatingReactions: FloatingReaction[],
  H: number
) {
  if (!floatingReactions || floatingReactions.length === 0) return;
  const now = Date.now();
  floatingReactions.forEach((r) => {
    const elapsed = now - r.timestamp;
    const progress = elapsed / 2200; // 2.2s animation
    if (progress > 1) return;

    const currentY = r.y - progress * (H * 0.4);
    const currentOpacity = 1 - Math.pow(progress, 2);
    const currentScale = r.scale * (1 + progress * 0.4);

    ctx.save();
    ctx.translate(r.x, currentY);
    ctx.rotate(r.rotation * (1 - progress));
    ctx.scale(currentScale, currentScale);
    ctx.globalAlpha = Math.max(0, currentOpacity);
    ctx.font = '64px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 16;
    ctx.fillText(r.emoji, 0, 0);
    ctx.restore();
  });
}

function renderPlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string
) {
  ctx.save();
  ctx.fillStyle = '#111116';
  ctx.fillRect(x, y, w, h);

  // Subtle grid lines
  ctx.strokeStyle = '#202028';
  ctx.lineWidth = 1;
  const step = 40;
  for (let gx = x; gx < x + w; gx += step) {
    ctx.beginPath();
    ctx.moveTo(gx, y);
    ctx.lineTo(gx, y + h);
    ctx.stroke();
  }
  for (let gy = y; gy < y + h; gy += step) {
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + w, gy);
    ctx.stroke();
  }

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2);
  ctx.restore();
}

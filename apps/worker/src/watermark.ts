/**
 * Watermark overlay support for rendered clips
 */

export interface WatermarkConfig {
  imagePath: string;          // Path to PNG watermark image
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  scale: number;              // Scale factor (0.05 - 0.5, relative to video width)
  opacity: number;            // 0.0 - 1.0
  marginX: number;            // Horizontal margin in pixels
  marginY: number;            // Vertical margin in pixels
}

/**
 * Generate FFmpeg filter for watermark overlay
 * Returns array of filter objects to be added to the filter chain
 */
export function getWatermarkFilters(
  config: WatermarkConfig,
  inputLabel: string = 'final',
  watermarkInput: string = '1:v'
): { filters: any[], outputLabel: string } {
  const { position, scale, opacity, marginX = 20, marginY = 20 } = config;
  
  // Calculate overlay position
  let overlayPos: string;
  switch (position) {
    case 'top-left':
      overlayPos = `${marginX}:${marginY}`;
      break;
    case 'top-right':
      overlayPos = `W-w-${marginX}:${marginY}`;
      break;
    case 'bottom-left':
      overlayPos = `${marginX}:H-h-${marginY}`;
      break;
    case 'bottom-right':
      overlayPos = `W-w-${marginX}:H-h-${marginY}`;
      break;
    case 'center':
      overlayPos = '(W-w)/2:(H-h)/2';
      break;
    default:
      overlayPos = `W-w-${marginX}:H-h-${marginY}`; // Default bottom-right
  }
  
  // Scale watermark relative to video width (1080px)
  const scaledWidth = Math.round(1080 * scale);
  
  const filters = [
    // Scale watermark
    { filter: 'scale', options: `${scaledWidth}:-1`, inputs: watermarkInput, outputs: 'wm_scaled' },
    // Apply opacity
    { filter: 'colorchannelmixer', options: `aa=${opacity}`, inputs: 'wm_scaled', outputs: 'wm_alpha' },
    // Overlay on video
    { filter: 'overlay', options: overlayPos, inputs: [inputLabel, 'wm_alpha'], outputs: 'watermarked' }
  ];
  
  return { filters, outputLabel: 'watermarked' };
}

/**
 * Parse watermark config from JSON string (stored in database)
 */
export function parseWatermarkConfig(jsonStr: string | null): WatermarkConfig | null {
  if (!jsonStr) return null;
  try {
    const config = JSON.parse(jsonStr);
    if (!config.imagePath) return null;
    return {
      imagePath: config.imagePath,
      position: config.position || 'bottom-right',
      scale: Math.min(0.5, Math.max(0.05, config.scale || 0.15)),
      opacity: Math.min(1.0, Math.max(0.1, config.opacity || 0.7)),
      marginX: config.marginX || 20,
      marginY: config.marginY || 20,
    };
  } catch (e) {
    return null;
  }
}

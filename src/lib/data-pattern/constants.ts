export const MAX_STITCHES_WARN = 200;
export const MAX_ROWS = 300;
export const MIN_ROWS = 10;
export const ROWS_PER_SEC = 4;
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_VOICE_DURATION_SEC = 60;
export const DEFAULT_VOICE_DURATION_SEC = 30;
export const MIN_VOICE_DURATION_SEC = 5;
export const AUDIO_SEGMENT_THRESHOLD_SEC = 60;
export const DEFAULT_AUDIO_SEGMENT_SEC = 60;
export const MAX_TERRAIN_BBOX_DEG = 0.5;
/** Max rows/cols sent to Open-Elevation; full pattern is upsampled locally. */
export const MAX_TERRAIN_SAMPLE_DIM = 50;
export const UNDO_STACK_MAX = 50;
export const ACCEPTED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'] as const;
export const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
export const OPEN_ELEVATION_URL = 'https://api.open-elevation.com/api/v1/lookup';
export const DEFAULT_STITCHES = 120;
export const DEFAULT_STITCHES_PER_CM = 4.5;
export const DEFAULT_ROWS_PER_CM = 6.4;
export const ZOOM_LEVELS = [50, 100, 200] as const;
/** Pattern preview zoom when editing terrain-generated patterns (includes overview at 25%). */
export const TERRAIN_PREVIEW_ZOOM_LEVELS = [25, 50, 100, 200] as const;


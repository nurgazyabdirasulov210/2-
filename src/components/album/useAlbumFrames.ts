import { useStudio } from '../../store'
import { getDemoFrames, useDemoPreview } from '../../lib/demo'
import type { Frame } from '../../types'

/** Frames to display: the user's album, or the in-memory example while previewing it. */
export function useAlbumFrames(): { frames: Frame[]; demo: boolean } {
  const frames = useStudio((s) => s.frames)
  const preview = useDemoPreview((s) => s.on)
  if (frames.length === 0 && preview) return { frames: getDemoFrames(), demo: true }
  return { frames, demo: false }
}

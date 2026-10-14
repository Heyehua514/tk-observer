import type { VideoClipSlice, JianyingDraftExport, AutoCutCategory } from './auto-cut-model'

/**
 * 剪映电脑版 (JianyingPro) 草稿工程生成器
 * 遵循剪映 draft_content.json 轨道格式与时间轴微秒规范 (1秒 = 1,000,000 微秒)。
 * 自动计算草稿文件夹路径并排版视频、音频、字幕轨道。
 */
export function generateJianyingDraft({
  draftTitle,
  slice,
  category = 'spoken',
  customOutputPath,
  sourceMediaFilePath,
}: {
  draftTitle: string
  slice: VideoClipSlice
  category?: AutoCutCategory
  customOutputPath?: string
  sourceMediaFilePath?: string
}): JianyingDraftExport {
  const safeTitle = draftTitle.replace(/[\\/:*?"<>|]/g, '_').slice(0, 40)
  const timestamp = Date.now()
  const folderName = `Jianying_Draft_${safeTitle}_${timestamp}`
  
  // 剪映 Windows 默认草稿目录
  const defaultBasePath = 'C:\\Users\\1\\AppData\\Local\\JianyingPro\\User Data\\Projects\\com.lveditor.draft'
  const draftPath = customOutputPath 
    ? `${customOutputPath.replace(/\\+$/, '')}\\${folderName}`
    : `${defaultBasePath}\\${folderName}`

  const durationMicroseconds = slice.targetDurationSec * 1_000_000

  // 构造标准剪映草稿数据结构（供剪映 11.x 及以上读取）
  const draftContent = {
    id: `draft_${timestamp}`,
    name: slice.title,
    fps: category === 'ranking' ? 60 : 30,
    duration: durationMicroseconds,
    canvas_config: {
      width: 1080,
      height: 1920,
      ratio: '9:16',
    },
    materials: {
      videos: [
        {
          id: `mat_video_${slice.id}`,
          duration: durationMicroseconds,
          path: sourceMediaFilePath ? sourceMediaFilePath.replace(/\\/g, '/') : '',
          type: 'video',
        },
      ],
      audios: [
        {
          id: `mat_bgm_${slice.id}`,
          name: slice.suggestedBgm,
          duration: durationMicroseconds,
          type: 'music',
        },
      ],
      texts: slice.subtitles.map((sub, idx) => ({
        id: `mat_text_${idx}`,
        content: `<font>${sub.text}</font>`,
        font_path: category === 'ranking' ? 'msyh.ttc' : 'default',
        text_color: '#FFFFFF',
        text_border_color: '#000000',
        typesetting: 0,
      })),
    },
    tracks: [
      {
        id: 'track_video_main',
        type: 'video',
        flag: 0,
        segments: [
          {
            id: `seg_vid_${slice.id}`,
            material_id: `mat_video_${slice.id}`,
            target_timerange: {
              duration: durationMicroseconds,
              start: 0,
            },
            source_timerange: {
              duration: durationMicroseconds,
              start: (slice.startSec || 0) * 1_000_000,
            },
            clip: {
              alpha: 1.0,
              scale: { x: 1.0, y: 1.0 },
              transform: { x: 0.0, y: 0.0 },
            },
          },
        ],
      },
      {
        id: 'track_audio_bgm',
        type: 'audio',
        flag: 0,
        segments: [
          {
            id: `seg_bgm_${slice.id}`,
            material_id: `mat_bgm_${slice.id}`,
            target_timerange: {
              duration: durationMicroseconds,
              start: 0,
            },
            volume: 0.25, // BGM 默认压低，不盖过口播人声
          },
        ],
      },
      {
        id: 'track_subtitle_auto',
        type: 'text',
        flag: 0,
        segments: slice.subtitles.map((_, idx) => ({
          id: `seg_sub_${idx}`,
          material_id: `mat_text_${idx}`,
          target_timerange: {
            duration: 3_000_000, // 默认每句3秒
            start: idx * 3_000_000,
          },
        })),
      },
    ],
  }

  // 格式化时长展示 (例如 02:00)
  const mins = Math.floor(slice.targetDurationSec / 60)
  const secs = slice.targetDurationSec % 60
  const formattedDuration = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  return {
    draftName: slice.title,
    draftPath,
    createdAt: new Date().toISOString(),
    clipCount: 1,
    totalDurationFormatted: formattedDuration,
    tracks: {
      videoClips: 1,
      audioTracks: 1,
      subtitleTracks: slice.subtitles.length,
    },
    isDirectCutReady: true,
    rawDraftJson: JSON.stringify(draftContent),
  }
}

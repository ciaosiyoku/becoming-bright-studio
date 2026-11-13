// Sunny, the guide: a little sun with a sprout on its head (the logo's sun and seedling, as a character). Original
// drawing, no outside art. Thinking during a question, cheering a right answer, smiling kindly after a miss.
// Decoration only (aria-hidden): everything Sunny "says" is also on screen and read aloud.

export type SunnyMood = 'happy' | 'cheer' | 'think'

export function Sunny({ mood = 'happy', size = 120, className = '' }: { mood?: SunnyMood; size?: number; className?: string }) {
  return (
    <svg className={`sunny sunny-${mood} ${className}`} width={size} height={size} viewBox="0 0 200 200" aria-hidden="true">
      <g fill="#FFC23D">
        <path d="M100 14 L108 34 L92 34 Z" />
        <path d="M100 186 L92 166 L108 166 Z" />
        <path d="M14 100 L34 92 L34 108 Z" />
        <path d="M186 100 L166 108 L166 92 Z" />
        <path d="M39 39 L57 47 L47 57 Z" />
        <path d="M161 39 L153 57 L143 47 Z" />
        <path d="M39 161 L47 143 L57 153 Z" />
        <path d="M161 161 L143 153 L153 143 Z" />
      </g>
      <circle cx="100" cy="104" r="58" fill="#FFC23D" stroke="#F0A81C" strokeWidth="4" />
      <path d="M100 48 C100 38 100 30 100 24" stroke="#22A06B" strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M100 32 C86 18 70 22 66 30 C78 40 92 40 100 32 Z" fill="#3CC28A" />
      <path d="M100 28 C112 12 130 14 136 22 C124 34 108 36 100 28 Z" fill="#22A06B" />
      <circle cx="70" cy="118" r="10" fill="#FF8FA3" opacity="0.7" />
      <circle cx="130" cy="118" r="10" fill="#FF8FA3" opacity="0.7" />
      {mood === 'happy' && (
        <g>
          <circle cx="80" cy="96" r="7" fill="#3D1E47" />
          <circle cx="120" cy="96" r="7" fill="#3D1E47" />
          <circle cx="82" cy="93" r="2.2" fill="#FFFFFF" />
          <circle cx="122" cy="93" r="2.2" fill="#FFFFFF" />
          <path d="M82 120 Q100 138 118 120" stroke="#3D1E47" strokeWidth="5" strokeLinecap="round" fill="none" />
        </g>
      )}
      {mood === 'cheer' && (
        <g>
          <path d="M70 98 Q80 86 90 98" stroke="#3D1E47" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M110 98 Q120 86 130 98" stroke="#3D1E47" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M78 114 Q100 146 122 114 Z" fill="#3D1E47" />
          <path d="M88 128 Q100 138 112 128 Q100 132 88 128 Z" fill="#FF6F86" />
          <path d="M28 60 L32 70 L42 72 L32 76 L28 86 L24 76 L14 72 L24 70 Z" fill="#8B5CF6" />
          <path d="M172 54 L175 62 L183 64 L175 67 L172 75 L169 67 L161 64 L169 62 Z" fill="#5AA9E6" />
        </g>
      )}
      {mood === 'think' && (
        <g>
          <circle cx="80" cy="98" r="7" fill="#3D1E47" />
          <circle cx="120" cy="98" r="7" fill="#3D1E47" />
          <path d="M70 84 L88 80" stroke="#3D1E47" strokeWidth="4" strokeLinecap="round" />
          <path d="M112 80 L130 86" stroke="#3D1E47" strokeWidth="4" strokeLinecap="round" />
          <circle cx="104" cy="124" r="7" fill="none" stroke="#3D1E47" strokeWidth="5" />
        </g>
      )}
    </svg>
  )
}

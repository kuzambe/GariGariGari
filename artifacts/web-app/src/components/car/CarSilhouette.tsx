export function CarSilhouette() {
  return (
    <svg
      width="340"
      height="160"
      viewBox="0 0 340 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Body */}
      <path
        d="M30 105 L30 85 Q32 70 50 62 L95 48 Q115 38 140 34 L190 32 Q220 32 245 40 L278 52 Q298 60 308 72 L314 85 L316 105 Q316 112 308 114 L32 114 Q28 114 28 108 Z"
        fill="#E8E6DF"
        stroke="#C8C6BF"
        strokeWidth="1.5"
      />
      {/* Roof */}
      <path
        d="M100 62 Q115 38 140 34 L190 32 Q215 32 238 40 L268 56 Q248 46 225 44 L185 42 Q158 42 138 50 Z"
        fill="#D8D6CF"
        stroke="#C8C6BF"
        strokeWidth="1"
      />
      {/* Windshield */}
      <path
        d="M102 62 L138 50 Q155 44 178 43 L178 65 Q152 66 128 70 Z"
        fill="#DDDBD4"
        stroke="#C8C6BF"
        strokeWidth="1"
        opacity="0.7"
      />
      {/* Rear window */}
      <path
        d="M200 43 L225 44 Q245 46 262 55 L245 68 Q228 64 210 63 L200 63 Z"
        fill="#DDDBD4"
        stroke="#C8C6BF"
        strokeWidth="1"
        opacity="0.7"
      />
      {/* A-pillar */}
      <line x1="102" y1="62" x2="128" y2="70" stroke="#B8B6AF" strokeWidth="1.5" />
      {/* C-pillar */}
      <line x1="262" y1="55" x2="245" y2="68" stroke="#B8B6AF" strokeWidth="1.5" />
      {/* Door line */}
      <path
        d="M60 68 L60 108"
        stroke="#C8C6BF"
        strokeWidth="1"
      />
      <path
        d="M200 63 L200 108"
        stroke="#C8C6BF"
        strokeWidth="1"
      />
      {/* Accent line */}
      <path
        d="M35 90 Q80 86 160 85 Q240 85 310 90"
        stroke="#C0BEB7"
        strokeWidth="1"
        strokeDasharray="2 0"
      />
      {/* Front bumper */}
      <path
        d="M28 100 Q24 105 22 112 L32 114"
        stroke="#C8C6BF"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Rear bumper */}
      <path
        d="M316 100 Q320 105 320 112 L308 114"
        stroke="#C8C6BF"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Headlight */}
      <path
        d="M22 85 Q24 80 30 78 L40 77 L40 88 L26 90 Z"
        fill="#F5F4F0"
        stroke="#C8C6BF"
        strokeWidth="1"
      />
      {/* Taillight */}
      <path
        d="M316 85 Q318 80 314 78 L304 77 L304 90 L316 92 Z"
        fill="#E8C0BB"
        stroke="#C8C6BF"
        strokeWidth="1"
      />
      {/* Side mirror */}
      <path
        d="M98 72 L88 75 L88 82 L100 80 Z"
        fill="#D8D6CF"
        stroke="#C8C6BF"
        strokeWidth="1"
      />
      {/* Front door handle */}
      <rect x="118" y="86" width="16" height="4" rx="2" fill="#C8C6BF" />
      {/* Rear door handle */}
      <rect x="220" y="86" width="16" height="4" rx="2" fill="#C8C6BF" />

      {/* Front wheel arch */}
      <path
        d="M48 114 Q48 90 72 90 Q96 90 96 114"
        fill="#D0CEC7"
        stroke="#B8B6AF"
        strokeWidth="1.5"
      />
      {/* Front wheel */}
      <circle cx="72" cy="117" r="22" fill="#3A3A3A" />
      <circle cx="72" cy="117" r="16" fill="#555" />
      <circle cx="72" cy="117" r="6" fill="#888" />
      {/* Front rim spokes */}
      <line x1="72" y1="101" x2="72" y2="133" stroke="#777" strokeWidth="2" />
      <line x1="56" y1="117" x2="88" y2="117" stroke="#777" strokeWidth="2" />
      <line x1="60.7" y1="105.7" x2="83.3" y2="128.3" stroke="#777" strokeWidth="1.5" />
      <line x1="83.3" y1="105.7" x2="60.7" y2="128.3" stroke="#777" strokeWidth="1.5" />

      {/* Rear wheel arch */}
      <path
        d="M244 114 Q244 90 268 90 Q292 90 292 114"
        fill="#D0CEC7"
        stroke="#B8B6AF"
        strokeWidth="1.5"
      />
      {/* Rear wheel */}
      <circle cx="268" cy="117" r="22" fill="#3A3A3A" />
      <circle cx="268" cy="117" r="16" fill="#555" />
      <circle cx="268" cy="117" r="6" fill="#888" />
      {/* Rear rim spokes */}
      <line x1="268" y1="101" x2="268" y2="133" stroke="#777" strokeWidth="2" />
      <line x1="252" y1="117" x2="284" y2="117" stroke="#777" strokeWidth="2" />
      <line x1="256.7" y1="105.7" x2="279.3" y2="128.3" stroke="#777" strokeWidth="1.5" />
      <line x1="279.3" y1="105.7" x2="256.7" y2="128.3" stroke="#777" strokeWidth="1.5" />

      {/* Ground line under car body */}
      <line x1="94" y1="114" x2="246" y2="114" stroke="#C8C6BF" strokeWidth="1" />
    </svg>
  );
}

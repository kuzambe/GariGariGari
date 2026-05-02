interface CarSilhouetteProps {
  bodyStyle?: string;
  className?: string;
}

function classify(bodyStyle: string): string {
  const s = bodyStyle.toLowerCase();
  if (s.includes("pickup") || s.includes("truck")) return "truck";
  if (s.includes("suv") || s.includes("sport utility") || s.includes("crossover")) return "suv";
  if (s.includes("van") || s.includes("minivan")) return "van";
  if (s.includes("hatchback")) return "hatchback";
  if (s.includes("convertible") || s.includes("cabriolet")) return "convertible";
  if (s.includes("coupe")) return "coupe";
  return "sedan";
}

function Sedan({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="110" cy="132" rx="28" ry="20" stroke="currentColor" strokeWidth="6" fill="none"/>
      <ellipse cx="290" cy="132" rx="28" ry="20" stroke="currentColor" strokeWidth="6" fill="none"/>
      <path d="M24 118 Q24 102 40 100 L130 96 L155 58 Q165 44 185 40 L230 38 Q255 38 268 52 L305 96 L360 100 Q376 102 376 118 L376 126 L24 126 Z" stroke="currentColor" strokeWidth="5" fill="currentColor" fillOpacity="0.06" strokeLinejoin="round"/>
      <path d="M135 94 L160 60 Q170 46 188 43 L228 42 Q250 42 262 54 L302 94 Z" stroke="currentColor" strokeWidth="3" fill="currentColor" fillOpacity="0.12" strokeLinejoin="round"/>
      <line x1="220" y1="42" x2="220" y2="94" stroke="currentColor" strokeWidth="2.5" opacity="0.4"/>
    </svg>
  );
}

function Suv({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="108" cy="132" rx="28" ry="20" stroke="currentColor" strokeWidth="6" fill="none"/>
      <ellipse cx="292" cy="132" rx="28" ry="20" stroke="currentColor" strokeWidth="6" fill="none"/>
      <path d="M24 118 Q24 100 40 98 L120 94 L138 46 Q145 30 164 28 L280 28 Q298 28 306 44 L328 94 L360 98 Q376 100 376 118 L376 126 L24 126 Z" stroke="currentColor" strokeWidth="5" fill="currentColor" fillOpacity="0.06" strokeLinejoin="round"/>
      <path d="M122 92 L140 48 Q147 33 163 31 L278 31 Q294 31 303 47 L326 92 Z" stroke="currentColor" strokeWidth="3" fill="currentColor" fillOpacity="0.12" strokeLinejoin="round"/>
      <line x1="222" y1="30" x2="222" y2="92" stroke="currentColor" strokeWidth="2.5" opacity="0.4"/>
    </svg>
  );
}

function Truck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="132" rx="28" ry="20" stroke="currentColor" strokeWidth="6" fill="none"/>
      <ellipse cx="300" cy="132" rx="28" ry="20" stroke="currentColor" strokeWidth="6" fill="none"/>
      <path d="M24 118 Q24 100 40 98 L130 98 L130 46 Q132 30 150 28 L240 28 Q254 28 256 40 L256 98 L360 98 Q376 100 376 118 L376 126 L24 126 Z" stroke="currentColor" strokeWidth="5" fill="currentColor" fillOpacity="0.06" strokeLinejoin="round"/>
      <rect x="130" y="30" width="126" height="68" rx="6" stroke="currentColor" strokeWidth="3" fill="currentColor" fillOpacity="0.1"/>
      <line x1="193" y1="30" x2="193" y2="98" stroke="currentColor" strokeWidth="2.5" opacity="0.4"/>
      <rect x="258" y="72" width="98" height="26" rx="3" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.06"/>
    </svg>
  );
}

function Hatchback({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="110" cy="132" rx="28" ry="20" stroke="currentColor" strokeWidth="6" fill="none"/>
      <ellipse cx="290" cy="132" rx="28" ry="20" stroke="currentColor" strokeWidth="6" fill="none"/>
      <path d="M24 118 Q24 100 40 98 L130 94 L155 48 Q165 34 185 30 L295 30 Q316 30 322 52 L340 94 L360 98 Q376 100 376 118 L376 126 L24 126 Z" stroke="currentColor" strokeWidth="5" fill="currentColor" fillOpacity="0.06" strokeLinejoin="round"/>
      <path d="M132 92 L156 50 Q165 36 183 32 L294 32 Q313 32 320 52 L338 92 Z" stroke="currentColor" strokeWidth="3" fill="currentColor" fillOpacity="0.12" strokeLinejoin="round"/>
      <line x1="230" y1="31" x2="230" y2="92" stroke="currentColor" strokeWidth="2.5" opacity="0.4"/>
    </svg>
  );
}

function Van({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="108" cy="132" rx="28" ry="20" stroke="currentColor" strokeWidth="6" fill="none"/>
      <ellipse cx="292" cy="132" rx="28" ry="20" stroke="currentColor" strokeWidth="6" fill="none"/>
      <path d="M24 118 Q24 98 42 96 L150 94 L152 28 Q154 20 165 20 L330 20 Q348 20 356 36 L374 96 Q380 100 380 118 L380 126 L24 126 Z" stroke="currentColor" strokeWidth="5" fill="currentColor" fillOpacity="0.06" strokeLinejoin="round"/>
      <rect x="153" y="22" width="178" height="72" rx="4" stroke="currentColor" strokeWidth="3" fill="currentColor" fillOpacity="0.1"/>
      <line x1="242" y1="22" x2="242" y2="94" stroke="currentColor" strokeWidth="2.5" opacity="0.4"/>
      <line x1="290" y1="22" x2="290" y2="94" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
    </svg>
  );
}

function Coupe({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="108" cy="132" rx="28" ry="20" stroke="currentColor" strokeWidth="6" fill="none"/>
      <ellipse cx="292" cy="132" rx="28" ry="20" stroke="currentColor" strokeWidth="6" fill="none"/>
      <path d="M24 118 Q24 104 38 102 L120 100 L158 54 Q172 36 200 34 L250 34 Q278 36 295 58 L328 100 L362 102 Q376 104 376 118 L376 126 L24 126 Z" stroke="currentColor" strokeWidth="5" fill="currentColor" fillOpacity="0.06" strokeLinejoin="round"/>
      <path d="M122 98 L160 56 Q173 38 200 36 L250 36 Q276 38 294 58 L326 98 Z" stroke="currentColor" strokeWidth="3" fill="currentColor" fillOpacity="0.12" strokeLinejoin="round"/>
    </svg>
  );
}

function Convertible({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="108" cy="132" rx="28" ry="20" stroke="currentColor" strokeWidth="6" fill="none"/>
      <ellipse cx="292" cy="132" rx="28" ry="20" stroke="currentColor" strokeWidth="6" fill="none"/>
      <path d="M24 118 Q24 106 38 104 L118 100 L140 80 L260 80 L282 100 L362 104 Q376 106 376 118 L376 126 L24 126 Z" stroke="currentColor" strokeWidth="5" fill="currentColor" fillOpacity="0.06" strokeLinejoin="round"/>
      <path d="M155 78 Q180 52 200 48 Q220 44 240 48 Q258 52 275 70" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="6 4"/>
    </svg>
  );
}

export function CarSilhouette({ bodyStyle = "", className = "" }: CarSilhouetteProps) {
  const type = classify(bodyStyle);
  const shared = `w-full h-full text-foreground/30 ${className}`;

  switch (type) {
    case "suv": return <Suv className={shared} />;
    case "truck": return <Truck className={shared} />;
    case "hatchback": return <Hatchback className={shared} />;
    case "van": return <Van className={shared} />;
    case "coupe": return <Coupe className={shared} />;
    case "convertible": return <Convertible className={shared} />;
    default: return <Sedan className={shared} />;
  }
}

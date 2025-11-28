# Design Guidelines: AricaMeet - Premium Cybersecurity Video Conferencing

## Design Approach

**Selected Approach:** Premium Cybersecurity Aesthetic - Dark, Professional, High-Tech
- Dark-first interface with deep navy and charcoal backgrounds
- Subtle gradients and glow effects conveying security and technology
- Cyan/teal accents for interactive elements and status indicators
- Clean, modern typography prioritizing professionalism and trustworthiness
- Sophisticated visual language distinct from consumer video conferencing tools

**Reference Inspiration:** Linear (dark mode sophistication), Stripe (premium restraint), high-end cybersecurity dashboards

## Core Design Elements

### Typography
**Font Stack:**
- Primary: Inter (Google Fonts) - All UI, headers, body text
- Accent: Space Grotesk (Google Fonts) - Logo, major headlines
- Monospace: JetBrains Mono - Meeting codes, technical data

**Hierarchy:**
- Page Headers: font-semibold text-3xl to text-4xl (Space Grotesk)
- Section Titles: font-semibold text-xl to text-2xl (Inter)
- Body Text: font-normal text-base (Inter)
- Labels/Captions: font-medium text-sm (Inter)
- Buttons: font-medium text-sm to text-base (Inter)

### Layout System
**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Component padding: p-6 to p-8
- Section spacing: py-12 to py-16
- Card padding: p-6 to p-8
- Button padding: px-6 py-3 to px-8 py-3.5
- Grid gaps: gap-4 to gap-6

### Color Palette
**Backgrounds:**
- Primary: #0a0e1a (deep navy, almost black)
- Secondary: #141b2d (rich navy)
- Tertiary: #1a2332 (medium navy)
- Card/Surface: #1e2938 (elevated charcoal)
- Subtle gradient overlays using radial-gradient from navy to charcoal

**Interactive:**
- Primary Accent: #00d9ff (bright cyan)
- Secondary Accent: #00a8cc (deep teal)
- Accent Glow: cyan with blur and opacity for hover states
- Border: #2a3447 (subtle navy-gray)
- Border Accent: #00d9ff with 30% opacity

**Text:**
- Primary: #ffffff (pure white)
- Secondary: #94a3b8 (slate gray)
- Tertiary: #64748b (muted slate)

**Status:**
- Success: #10b981 (emerald)
- Warning: #f59e0b (amber)
- Error: #ef4444 (red)
- Active/Live: #00d9ff (cyan)

## Component Library

### Dashboard/Home Screen
**Layout:** Dark hero section with subtle gradient overlay (radial from center), centered max-w-6xl
- Hero section: Full viewport (min-h-screen) with bg-gradient-radial from navy to charcoal
- Logo/branding: Space Grotesk font-bold text-3xl with cyan accent mark
- Welcome card: bg-slate-900/50 backdrop-blur-xl border border-cyan-500/20 rounded-2xl shadow-2xl p-12 with subtle cyan glow
- Meeting code input: Large field h-16 bg-slate-800/80 border-2 border-slate-600 focus:border-cyan-500 rounded-xl with cyan glow on focus
- Primary CTA: bg-gradient-to-r from-cyan-500 to-teal-500 with shadow-cyan-500/50 glow
- Secondary button: border-2 border-cyan-500/50 bg-transparent hover:bg-cyan-500/10
- Recent meetings grid: Cards with bg-slate-800/60 border border-slate-700 hover:border-cyan-500/50 transition

### Meeting Room Interface
**Grid Layout:**
- Video grid: Auto-responsive grid with gap-4
- Video tiles: rounded-xl overflow-hidden bg-slate-900 border-2 border-slate-700 with subtle cyan border-b on active speaker
- Participant name overlay: bg-gradient-to-t from-black/80 to-transparent px-4 py-3
- Speaker view: Prominent main feed with thumbnail strip (bg-slate-900/95 backdrop-blur)

**Control Bar:**
- Fixed bottom with bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 rounded-t-3xl px-8 py-5
- Icon buttons: rounded-xl w-14 h-14 bg-slate-800 hover:bg-slate-700 border border-slate-600 transition
- Active state: bg-cyan-500/20 border-cyan-500 text-cyan-400 with subtle glow
- Mic/camera off: bg-red-500/20 border-red-500/50 text-red-400
- Leave button: bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl px-6 py-3.5 shadow-red-500/30

### Meeting Info & Chat Panels
**Slide-in panels:** w-96 bg-slate-900/98 backdrop-blur-xl border-l border-slate-700/50
- Header: h-16 border-b border-slate-700/50 px-6 with cyan accent stripe (border-l-4 border-cyan-500)
- Section cards: bg-slate-800/50 rounded-lg border border-slate-700/30 p-4
- Participant list: Each row hover:bg-slate-800/60 rounded-lg
- Chat bubbles: bg-slate-800/80 rounded-2xl with sender's messages having cyan border-l-2
- Input: bg-slate-800 border-2 border-slate-600 focus:border-cyan-500 rounded-xl with subtle glow

### Pre-Join/Settings Screen
**Modal:** max-w-4xl bg-slate-900 border-2 border-slate-700/50 rounded-2xl shadow-2xl shadow-cyan-500/5
- Video preview: Large rounded-xl with border-2 border-slate-700 bg-slate-950
- Device selectors: bg-slate-800 border border-slate-600 rounded-lg
- Settings toggles: Cyan accent when active with smooth transitions
- Join button: Full-width gradient bg-gradient-to-r from-cyan-500 to-teal-500 with glow effect

### Whiteboard/Screen Share
**Dark canvas:** bg-slate-950 with top toolbar
- Toolbar: bg-slate-900/95 backdrop-blur border-b border-slate-700/50 h-16
- Tool buttons: bg-slate-800 border border-slate-600 rounded-lg, active gets cyan accent
- Drawing overlay on dark background

## Visual Treatment

### Borders & Effects
- Cards: border border-slate-700 rounded-xl to rounded-2xl
- Elevated: shadow-xl with subtle shadow-cyan-500/10
- Glow effects: Use box-shadow with cyan at low opacity for interactive elements
- Focus states: ring-2 ring-cyan-500 ring-offset-2 ring-offset-slate-900

### Gradients & Overlays
- Hero sections: radial-gradient from center, navy to charcoal
- Button gradients: from-cyan-500 to-teal-500 or from-cyan-400 to-blue-500
- Subtle noise texture overlay on large surfaces (via CSS background-image)
- Backdrop blur on panels: backdrop-blur-xl for glassmorphism

### Buttons
**Primary:** bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-900 font-medium rounded-xl shadow-lg shadow-cyan-500/30
**Secondary:** border-2 border-cyan-500/50 hover:border-cyan-500 hover:bg-cyan-500/10 text-cyan-400 rounded-xl
**Icon buttons:** bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl transition-all
**Danger:** bg-red-500 hover:bg-red-600 rounded-xl

### Hover & Active States
- Subtle glow intensification on hover
- Border color shifts to cyan accent
- Background opacity changes (slate-800 to slate-700)
- Smooth transitions: duration-200 to duration-300

## Animations
**Subtle, premium feel:**
- Modal entry: Fade + scale-up from 95% to 100% (duration-300)
- Panel slides: Smooth translate-x with backdrop fade
- Glow pulse: Subtle pulse on active call status
- Button hover: Glow intensification
- No excessive motion - maintain professional aesthetic

## Icons
**Library:** Heroicons (outline style via CDN)
- Size: w-5 h-5 standard, w-6 h-6 for primary actions
- Color: text-slate-400 inactive, text-cyan-400 active
- Consistent stroke width for cohesive feel

## Images
**No hero images.** This is a premium business tool where security and interface clarity are paramount. Visual interest comes from:
- Subtle gradient backgrounds
- Glow effects on interactive elements
- Clean card-based layouts
- Live video feeds during meetings
- Cybersecurity-inspired visual language (grids, data patterns as subtle background textures)

## Accessibility
- High contrast white text on dark backgrounds (WCAG AAA)
- Cyan accents meet contrast requirements against dark surfaces
- Focus rings: ring-2 ring-cyan-500 with offset
- Clear visual feedback for all states
- Keyboard navigation throughout
- Screen reader labels for all controls
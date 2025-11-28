# AricaMeet - Secure P2P Video Conferencing

## Overview

AricaMeet is a production-ready peer-to-peer video conferencing application built for cybersecurity organizations. Built with a focus on privacy and direct communication, all media and data flows directly between participants without passing through central servers.

**Core Purpose:** Provide secure, serverless video conferencing with multi-party calls, real-time chat, peer-to-peer file transfers, and collaborative whiteboarding.

**Design Philosophy:** Premium dark cybersecurity aesthetic with deep navy backgrounds (#0a0e1a), cyan accents (#00d9ff), subtle glow effects, and professional premium quality suitable for internal organizational use.

**Tech Stack:**
- Frontend: React with TypeScript, Vite build system
- UI Framework: Tailwind CSS with shadcn/ui components
- Backend: Express.js with WebSocket signaling server
- Real-time Communication: WebRTC for peer-to-peer connections
- Routing: Wouter (lightweight React router)

## User Preferences

Preferred communication style: Simple, everyday language.
Privacy requirement: No logging or tracking in production.
Design requirement: Premium cybersecurity aesthetic, not a Google Meet clone.

## Recent Changes (November 2025)

### AricaMeet Cybersecurity Rebrand
- Complete rebrand from SecureMeet to AricaMeet
- Premium dark theme with deep navy backgrounds (#0a0e1a, #141b2d)
- Cyan accent color (#00d9ff) for primary actions and highlights
- Typography: Inter (body), Space Grotesk (headings), JetBrains Mono (code/meeting codes)
- Subtle gradient backgrounds with cyber glow effects
- Rounded xl corners on buttons and controls

### UI Component Updates
- Dashboard: Dark gradient background, cyan "Start New Meeting" button, feature cards with emerald/cyan/violet accent icons
- Meeting Room: Dark #0a0e1a background, AricaMeet branding in header, rounded xl control buttons
- Control Bar: Modern rounded xl buttons with slate backgrounds and cyan active states
- Chat Panel: "Secure Chat" branding, E2E encryption label, cyan gradient send button
- Whiteboard: Dark overlay, cyan-colored drawing, rounded tool buttons
- Video Tiles: Rounded corners, slate backgrounds, cyan shield icon for local user

### Whiteboard Improvements
- All users can VIEW whiteboard content (canvas always visible)
- Only hosts/permitted users can EDIT
- Stroke-based undo: removes entire drawn line, not individual pixels
- History sync for late joiners via DataChannel

### Privacy Compliance
- Removed all console.log/console.error from client code
- Server logging only in development mode
- User ID persists in sessionStorage for stable identity

### Collaboration Features (November 2025)
- **OG Hackers Chat:** Terminal-style chat with scanline overlay, JetBrains Mono font, command history
- **Integrated File Sharing:** Paperclip button in chat, files sent P2P, one-time download per user (max 100MB)
- **Interactive Live Agenda:** Add items, vote priority, mark complete, time tracking, sync across participants
- **Hand Raise Queue:** Topic support, acknowledgement system, queue management with time display
- **Private Subchat:** Encrypted 1-on-1 side conversations with participant selection
- **Dual Screen Layout:** Split view toggle for presenter/whiteboard combinations

### Mobile PWA Optimization (November 2025)
- Responsive control bar with accessible More menu (lg:hidden breakpoint)
- More menu contains: Screen share, Whiteboard, Files, Agenda, Private Chat, Participants
- All menu items have ARIA roles/labels for keyboard accessibility
- LightweightMode toggle disables Matrix rain, intense glows, and pulse animations
- Safe area CSS with fallback padding for notched devices
- PWA manifest.json enables installability on mobile devices
- Note: WebSocket errors in browser console are from Vite HMR development server, not application signaling

### Hacker-Style Security Features (November 2025)
**Visual Features:**
- Matrix Rain: Canvas-based falling code animation on dashboard (client/src/components/matrix-rain.tsx)
- Security Scan: Animated loading sequence with fingerprint generation when joining meetings
- Network Topology: Animated P2P mesh visualization with data packet animations
- Security Console: Terminal-style panel showing live encryption event logs
- Encryption Badge: Modal displaying session keys and hex peer fingerprints
- Security Stats: Real-time overlay (encrypted bytes, packets, latency, uptime)

**Interactive Features:**
- Keyboard Shortcuts: Ctrl+M (mute), Ctrl+E (camera), Ctrl+S (screen), Ctrl+P (participants), Ctrl+T (chat), Ctrl+W (whiteboard), Ctrl+` (console), Ctrl+N (topology), Ctrl+/ (shortcuts)
- Speaking Indicator: Glowing cyan border on video tile using Web Audio API
- Header security buttons: Lock (encryption), Terminal (console), Wifi (topology), Keyboard (shortcuts)

## System Architecture

### Frontend Architecture

**Component Structure:**
- Page-based routing: `/` (dashboard) and `/meeting/:code` (meeting room)
- shadcn/ui component library with Radix UI primitives
- Custom hooks: `use-webrtc.ts` for peer connections, `use-toast.ts` for notifications

**Design System:**
- Premium cybersecurity dark theme
- Background: #0a0e1a (deep navy) with gradient overlays
- Accent: #00d9ff (cyan) for primary actions
- Typography: Inter, Space Grotesk, JetBrains Mono
- Rounded xl (0.75rem) corners on buttons and cards
- Subtle glow effects on active states

**Key UI Pages:**
- **Dashboard:** "Start New Meeting" cyan button, meeting code input, feature cards
- **Meeting Room:** Video grid, control bar (mic/camera/screen/whiteboard/chat/leave), chat panel, whiteboard overlay

### Backend Architecture

**Server Setup:**
- Development mode: `index-dev.ts` with Vite HMR
- Production mode: `index-prod.ts` serving static files
- WebSocket server at `/ws` for signaling
- No logging in production for privacy

**WebRTC Signaling:**
- In-memory room management
- Host designation (first participant becomes host)
- Signal types: join-room, offer, answer, ice-candidate, whiteboard-access requests

### Real-Time Communication

**WebRTC Implementation:**
- Mesh topology: direct peer connections between all participants
- Google STUN servers for NAT traversal
- RTCDataChannel for chat, whiteboard events, file transfers

**Whiteboard Data Flow:**
- Drawing events include strokeId for grouping
- Undo removes all events with matching strokeId
- History sync sent when DataChannel opens to new peers
- Clear removes all events from processable list

### Permission System

**Host Permissions:**
- First participant becomes host automatically
- Host can approve/deny whiteboard edit requests
- All participants can view whiteboard content
- Non-hosts see "Request edit access" button

## Key Files

- `client/src/pages/dashboard.tsx` - Home page with Matrix rain and meeting creation/join
- `client/src/pages/meeting-room.tsx` - Video conferencing room with all security features
- `client/src/components/control-bar.tsx` - Meeting controls (mic/camera/etc)
- `client/src/components/video-tile.tsx` - Video display with speaking indicator
- `client/src/components/chat-panel.tsx` - In-call messaging
- `client/src/components/whiteboard.tsx` - Collaborative drawing canvas
- `client/src/components/matrix-rain.tsx` - Animated falling code background
- `client/src/components/security-console.tsx` - Terminal-style live encryption logs
- `client/src/components/network-topology.tsx` - P2P mesh visualization with packets
- `client/src/components/security-scan.tsx` - Join animation with fingerprint
- `client/src/components/encryption-badge.tsx` - Session key and fingerprint display
- `client/src/components/security-stats.tsx` - Real-time encryption statistics
- `client/src/components/keyboard-shortcuts.tsx` - Shortcuts modal and hook
- `client/src/components/chat-panel.tsx` - Terminal-style OG Hackers chat
- `client/src/components/large-file-transfer.tsx` - 1GB chunked file transfer dialog
- `client/src/components/agenda-panel.tsx` - Interactive live agenda with voting
- `client/src/components/hand-raise-queue.tsx` - Hand raise queue with acknowledgement
- `client/src/components/private-chat.tsx` - 1-on-1 encrypted private messaging
- `client/src/components/dual-screen-layout.tsx` - Split view layouts
- `client/src/components/lightweight-mode.tsx` - Performance mode toggle
- `client/src/hooks/use-webrtc.ts` - WebRTC connection management
- `server/routes.ts` - WebSocket signaling server
- `client/src/index.css` - Cybersecurity theme colors and utilities
- `client/public/manifest.json` - PWA installability manifest

## External Dependencies

### Frontend
- React, Tailwind CSS, shadcn/ui, Radix UI
- Lucide React icons
- Wouter for routing
- React Query for data fetching

### Backend
- Express.js web server
- ws (WebSocket) for signaling
- Drizzle ORM (configured but minimal database usage)

### WebRTC
- Google STUN servers: stun.l.google.com:19302, stun1.l.google.com:19302
- No TURN servers (direct P2P only)

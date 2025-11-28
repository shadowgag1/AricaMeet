# AricaMeet

## Secure P2P Video Conferencing for Cybersecurity Organizations

AricaMeet is a production-ready peer-to-peer video conferencing application with a focus on privacy and security.

### Features

- **Zero-Trace Architecture**: No logging, no server storage - everything vanishes when the call ends
- **P2P Communication**: All media flows directly between participants via WebRTC
- **End-to-End Encrypted Chat**: Secure messaging with terminal-style "OG Hackers" UI
- **File Sharing**: In-chat file transfers with one-time download policy (max 100MB)
- **Collaborative Whiteboard**: Real-time drawing with stroke-based undo
- **Live Agenda**: Add items, vote priority, track time
- **Hand Raise Queue**: Topic support with acknowledgement system
- **Private Subchat**: Encrypted 1-on-1 side conversations
- **Mobile PWA Support**: Installable on mobile devices

### Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js with WebSocket signaling
- **Real-time**: WebRTC mesh topology
- **Build**: Vite

### Design

Premium cybersecurity aesthetic with:
- Deep navy backgrounds (#0a0e1a)
- Cyan accents (#00d9ff)
- Matrix-style animations
- Terminal-inspired UI elements

### Getting Started

```bash
npm install
npm run dev
```

### License

MIT

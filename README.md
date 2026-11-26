# FortWars.io

A small browser multiplayer building-survival game starter built with Express, Socket.IO, and Canvas.

## Run locally
1. Install Node.js 18 or newer.
2. In this folder run `npm install`.
3. Run `npm run dev` (or `npm start`).
4. Open http://localhost:3000 in your browser.

Open the same address in another browser/device on the same network to test multiplayer.
For internet multiplayer, deploy the Node service to a host that supports WebSockets.

## Controls
- WASD / arrow keys: move
- Mouse: aim
- Click: fire
- E: gather nearby resources
- Q: toggle build mode
- 1 / 2 / 3: wall / floor / ramp
- R: rotate the selected piece
- Right click a placed piece: remove it
- Mobile: use the on-screen controls

This is an MVP starter, not a Fortnite clone. Building edits, accounts, matchmaking, persistence, and anti-cheat are future upgrades.

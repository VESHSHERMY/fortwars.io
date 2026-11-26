const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { Game } = require('./game');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const game = new Game();

app.use(express.static(path.join(__dirname, '..', 'public')));
app.get('/health', (_req, res) => res.json({ ok: true }));

io.on('connection', socket => {
  const player = game.addPlayer(socket.id);
  socket.emit('welcome', { id: socket.id, world: game.snapshot() });
  socket.broadcast.emit('playerJoined', player);

  socket.on('input', input => game.setInput(socket.id, input || {}));
  socket.on('build', piece => {
    const placed = game.placeBuild(socket.id, piece || {});
    if (placed) io.emit('buildPlaced', placed);
  });
  socket.on('removeBuild', id => {
    if (game.removeBuild(socket.id, id)) io.emit('buildRemoved', id);
  });
  socket.on('shoot', target => {
    const result = game.shoot(socket.id, target || {});
    if (result) io.emit('shot', result);
  });
  socket.on('gather', () => {
    const result = game.gather(socket.id);
    if (result) socket.emit('resources', result);
  });
  socket.on('disconnect', () => {
    game.removePlayer(socket.id);
    io.emit('playerLeft', socket.id);
  });
});

setInterval(() => {
  game.tick();
  io.emit('state', game.snapshot());
}, 50);

const port = process.env.PORT || 3000;
server.listen(port, '0.0.0.0', () => console.log(`FortWars.io listening on ${port}`));

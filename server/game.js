const WORLD = { width: 2400, height: 1600 };
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

class Game {
  constructor() {
    this.players = new Map();
    this.builds = new Map();
    this.nextBuildId = 1;
    this.resources = [
      ...Array.from({ length: 38 }, (_, i) => ({ id: `tree${i}`, x: 140 + (i * 173) % 2100, y: 120 + (i * 97) % 1350, kind: 'wood' })),
      ...Array.from({ length: 22 }, (_, i) => ({ id: `rock${i}`, x: 90 + (i * 251) % 2200, y: 100 + (i * 139) % 1380, kind: 'stone' }))
    ];
  }
  addPlayer(id) {
    const p = { id, x: 1200 + (Math.random() - .5) * 220, y: 800 + (Math.random() - .5) * 220,
      hp: 100, wood: 80, stone: 40, angle: 0, input: {}, color: `hsl(${Math.floor(Math.random()*360)} 75% 62%)` };
    this.players.set(id, p);
    return this.publicPlayer(p);
  }
  publicPlayer(p) {
    return { id: p.id, x: p.x, y: p.y, hp: p.hp, wood: p.wood, stone: p.stone, angle: p.angle, color: p.color };
  }
  removePlayer(id) { this.players.delete(id); }
  setInput(id, input) {
    const p = this.players.get(id); if (!p) return;
    p.input = { up: !!input.up, down: !!input.down, left: !!input.left, right: !!input.right };
    if (Number.isFinite(input.angle)) p.angle = input.angle;
  }
  placeBuild(id, piece) {
    const p = this.players.get(id); if (!p) return null;
    const type = ['wall', 'floor', 'ramp'].includes(piece.type) ? piece.type : 'wall';
    const cost = type === 'wall' ? 10 : 15;
    if (p.wood < cost) return null;
    const x = clamp(Math.round((Number(piece.x) || p.x) / 48) * 48, 24, WORLD.width - 24);
    const y = clamp(Math.round((Number(piece.y) || p.y) / 48) * 48, 24, WORLD.height - 24);
    if (distance(p, {x,y}) > 360) return null;
    p.wood -= cost;
    const b = { id: String(this.nextBuildId++), owner: id, x, y, type, rotation: Number(piece.rotation) || 0, hp: 150 };
    this.builds.set(b.id, b); return b;
  }
  removeBuild(id, buildId) {
    const b = this.builds.get(String(buildId));
    if (!b || b.owner !== id) return false;
    this.builds.delete(String(buildId)); return true;
  }
  shoot(id, target) {
    const p = this.players.get(id); if (!p) return null;
    const angle = Number(target.angle);
    if (!Number.isFinite(angle)) return null;
    p.angle = angle;
    let hit = null;
    for (const other of this.players.values()) {
      if (other.id === id) continue;
      const d = distance(p, other);
      const a = Math.atan2(other.y - p.y, other.x - p.x);
      let delta = Math.atan2(Math.sin(a-angle), Math.cos(a-angle));
      if (d < 430 && Math.abs(delta) < .13 && (!hit || d < hit.d)) hit = { player: other, d };
    }
    if (hit) hit.player.hp = Math.max(0, hit.player.hp - 18);
    return { id, x: p.x, y: p.y, angle, hit: hit ? hit.player.id : null };
  }
  gather(id) {
    const p = this.players.get(id); if (!p) return null;
    const node = this.resources.find(r => distance(p, r) < 85);
    if (!node) return { wood: p.wood, stone: p.stone, message: 'Move closer to a resource.' };
    if (node.kind === 'wood') p.wood += 20; else p.stone += 15;
    this.resources = this.resources.filter(r => r.id !== node.id);
    return { wood: p.wood, stone: p.stone, message: `+${node.kind === 'wood' ? 20 : 15} ${node.kind}` };
  }
  tick() {
    for (const p of this.players.values()) {
      const i = p.input, speed = 5;
      let dx = (i.right ? 1 : 0) - (i.left ? 1 : 0);
      let dy = (i.down ? 1 : 0) - (i.up ? 1 : 0);
      const len = Math.hypot(dx, dy) || 1;
      p.x = clamp(p.x + dx / len * speed, 20, WORLD.width - 20);
      p.y = clamp(p.y + dy / len * speed, 20, WORLD.height - 20);
    }
  }
  snapshot() {
    return { world: WORLD, players: [...this.players.values()].map(p => this.publicPlayer(p)),
      builds: [...this.builds.values()], resources: this.resources };
  }
}
module.exports = { Game };

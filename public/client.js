const socket = io();
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let me = null, state = { players: [], builds: [], resources: [], world: {width:2400,height:1600} };
let keys = {}, mouse = {x:0,y:0}, buildMode = false, piece = 'wall', rotation = 0, shots = [];
const tile = 48;
function resize(){const dpr=Math.min(devicePixelRatio||1,2);canvas.width=canvas.clientWidth*dpr;canvas.height=canvas.clientHeight*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}
addEventListener('resize',resize);resize();
socket.on('welcome',d=>{me=d.id;state=d.world;});
socket.on('state',s=>{state=s;const p=state.players.find(x=>x.id===me);if(p){$('health').textContent=p.hp;$('healthBar').style.width=p.hp+'%';$('wood').textContent=p.wood;$('stone').textContent=p.stone;}$('playerCount').textContent=state.players.length+' PLAYER'+(state.players.length===1?'':'S');});
socket.on('playerJoined',p=>{});socket.on('playerLeft',id=>{});
socket.on('shot',s=>{shots.push({...s,t:Date.now()});});socket.on('resources',r=>toast(r.message));
function $(id){return document.getElementById(id)}
function toast(s){$('toast').textContent=s;$('toast').style.opacity=1;clearTimeout(toast.t);toast.t=setTimeout(()=>$('toast').style.opacity=0,1300)}
function worldPoint(e){const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top}}
function camera(){const p=state.players.find(x=>x.id===me)||{x:1200,y:800};return {x:p.x-canvas.clientWidth/2,y:p.y-canvas.clientHeight/2}}
function draw(){
 const w=canvas.clientWidth,h=canvas.clientHeight,c=camera();ctx.clearRect(0,0,w,h);
 ctx.fillStyle='#24433b';ctx.fillRect(0,0,w,h);
 ctx.save();ctx.translate(-c.x,-c.y);
 ctx.strokeStyle='#ffffff0c';ctx.lineWidth=1;
 for(let x=0;x<=state.world.width;x+=tile){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,state.world.height);ctx.stroke()}
 for(let y=0;y<=state.world.height;y+=tile){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(state.world.width,y);ctx.stroke()}
 // scattered grass flecks
 for(let i=0;i<180;i++){let x=(i*137)%state.world.width,y=(i*83)%state.world.height;ctx.fillStyle='#a5d18a22';ctx.fillRect(x,y,3,3)}
 for(const r of state.resources){ctx.fillStyle=r.kind==='wood'?'#8b623b':'#8b9aa5';ctx.beginPath();ctx.arc(r.x,r.y,13,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffffffaa';ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillText(r.kind==='wood'?'TREE':'ROCK',r.x,r.y+26)}
 for(const b of state.builds){ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.rotation*Math.PI/2);ctx.fillStyle=b.type==='wall'?'#b67d4b':b.type==='floor'?'#c69a68':'#d6ad78';ctx.strokeStyle='#513c2b';ctx.lineWidth=3;if(b.type==='wall'){ctx.fillRect(-22,-22,44,44);ctx.strokeRect(-22,-22,44,44);ctx.strokeStyle='#e8c49a';ctx.beginPath();ctx.moveTo(-22,-8);ctx.lineTo(22,-8);ctx.moveTo(-22,8);ctx.lineTo(22,8);ctx.stroke()}else if(b.type==='floor'){ctx.fillRect(-22,-22,44,44);ctx.strokeRect(-22,-22,44,44);ctx.beginPath();ctx.moveTo(-22,0);ctx.lineTo(22,0);ctx.moveTo(0,-22);ctx.lineTo(0,22);ctx.stroke()}else{ctx.beginPath();ctx.moveTo(-22,22);ctx.lineTo(22,22);ctx.lineTo(22,-22);ctx.closePath();ctx.fill();ctx.stroke()}ctx.restore()}
 for(const p of state.players){ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(p.x,p.y+13,15,7,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,13,0,Math.PI*2);ctx.fill();ctx.strokeStyle=p.id===me?'#fff':'#18222b';ctx.lineWidth=3;ctx.stroke();ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.fillStyle='#e8edf4';ctx.fillRect(5,-4,20,8);ctx.restore();ctx.fillStyle='#fff';ctx.font='11px sans-serif';ctx.textAlign='center';ctx.fillText(p.id===me?'YOU':'PLAYER',p.x,p.y-22);ctx.fillStyle='#263746';ctx.fillRect(p.x-15,p.y-18,30,4);ctx.fillStyle='#72e0b2';ctx.fillRect(p.x-15,p.y-18,30*p.hp/100,4)}
 if(buildMode&&me){const p=state.players.find(x=>x.id===me);if(p){const wx=Math.round((mouse.x+c.x)/tile)*tile,wy=Math.round((mouse.y+c.y)/tile)*tile;ctx.globalAlpha=.45;ctx.fillStyle='#72e0b2';ctx.fillRect(wx-22,wy-22,44,44);ctx.globalAlpha=1}}
 ctx.restore();
 shots=shots.filter(s=>Date.now()-s.t<180);for(const s of shots){ctx.strokeStyle='#ffe08a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(s.x-c.x,s.y-c.y);ctx.lineTo(s.x-c.x+Math.cos(s.angle)*75,s.y-c.y+Math.sin(s.angle)*75);ctx.stroke()}
 requestAnimationFrame(draw)
}
draw();
function sendInput(){const p=state.players.find(x=>x.id===me);if(!p)return;const c=camera();const angle=Math.atan2(mouse.y+p.y-canvas.clientHeight/2-(p.y),mouse.x+p.x-canvas.clientWidth/2-(p.x));socket.emit('input',{up:keys.w||keys.ArrowUp,down:keys.s||keys.ArrowDown,left:keys.a||keys.ArrowLeft,right:keys.d||keys.ArrowRight,angle});}
setInterval(sendInput,50);
addEventListener('keydown',e=>{keys[e.key]=true;if(['1','2','3'].includes(e.key))selectPiece(['wall','floor','ramp'][Number(e.key)-1]);if(e.key.toLowerCase()==='q')toggleBuild();if(e.key.toLowerCase()==='r')rotation=(rotation+1)%4;if(e.key.toLowerCase()==='e')socket.emit('gather')});
addEventListener('keyup',e=>keys[e.key]=false);
canvas.addEventListener('mousemove',e=>{mouse=worldPoint(e)});
canvas.addEventListener('mousedown',e=>{const p=state.players.find(x=>x.id===me);if(!p)return;const c=camera();const wx=mouse.x+c.x,wy=mouse.y+c.y;if(buildMode){socket.emit('build',{type:piece,x:wx,y:wy,rotation})}else{socket.emit('shoot',{angle:Math.atan2(wy-p.y,wx-p.x)})}});
canvas.addEventListener('contextmenu',e=>{e.preventDefault();const c=camera(),wx=mouse.x+c.x,wy=mouse.y+c.y;const b=state.builds.find(b=>Math.hypot(b.x-wx,b.y-wy)<32);if(b)socket.emit('removeBuild',b.id)});
function selectPiece(t){piece=t;document.querySelectorAll('[data-piece]').forEach(b=>b.classList.toggle('active',b.dataset.piece===t))}
function toggleBuild(){buildMode=!buildMode;$('buildToggle').innerHTML='Q <b>BUILD: '+(buildMode?'ON':'OFF')+'</b>';toast(buildMode?'Build mode on':'Build mode off')}
document.querySelectorAll('[data-piece]').forEach(b=>b.onclick=()=>selectPiece(b.dataset.piece));$('buildToggle').onclick=toggleBuild;
function hold(id,key){const el=$(id);el.addEventListener('pointerdown',e=>{e.preventDefault();keys[key]=true});['pointerup','pointerleave','pointercancel'].forEach(ev=>el.addEventListener(ev,()=>keys[key]=false))}
hold('up','ArrowUp');hold('down','ArrowDown');hold('left','ArrowLeft');hold('right','ArrowRight');$('gather').onclick=()=>socket.emit('gather');

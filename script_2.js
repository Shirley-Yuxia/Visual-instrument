/* ============ DOM refs ============ */
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
const video = document.getElementById('video');
const overlay = document.getElementById('output'), octx = overlay.getContext('2d');
const camBtn = document.getElementById('camBtn');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const mirrorChk = document.getElementById('mirror');
const flipBtn = document.getElementById('flipBtn'); // NEW
const speedEl = document.getElementById('speed');
const tempoEl = document.getElementById('tempo');
const volumeEl = document.getElementById('volume');
const instrumentEl = document.getElementById('instrument');
const songSelect = document.getElementById('songSelect');
const practiceBtn = document.getElementById('practiceBtn');
const autoplayBtn = document.getElementById('autoplayBtn');
const sheetEl = document.getElementById('musicSheet');
const scoreEl = document.getElementById('score');
const statusEl = document.getElementById('status');

/* ============ Tone.js Instruments ============ */
const piano = new Tone.Synth({ oscillator:{type:"sine"}, envelope:{attack:0.005,decay:0.2,sustain:0.2,release:0.3} }).toDestination();
const violin = new Tone.Synth({ oscillator:{type:"triangle"}, envelope:{attack:0.5,decay:0.1,sustain:0.7,release:1} }).toDestination();
const drums = new Tone.MembraneSynth().toDestination();
const trumpet = new Tone.Synth({ oscillator:{type:"sawtooth"}, envelope:{attack:0.05,decay:0.2,sustain:0.3,release:0.5} }).toDestination();
const instruments = { piano, violin, drums, trumpet };
let currentInstrument = instruments.piano;

Tone.Destination.volume.value = parseFloat(volumeEl.value);
volumeEl.addEventListener('input', ()=> Tone.Destination.volume.value = parseFloat(volumeEl.value));
instrumentEl.addEventListener('change', e => currentInstrument = instruments[e.target.value]);

/* ============ Songs (C–G) ============ */
const songs = {
  "Mary Had a Little Lamb": ["E","D","C","D","E","E","E","D","D","D","E","G","G","E","D","C","D","E","E","E","D","D","E","D","C"],
  "Itsy Bitsy Spider": ["C","C","C","D","E","E","D","E","F","G","G","F","E","F","D","C"],
  "Jingle Bells": ["E","E","E","E","E","E","E","G","C","D","E","F","F","F","F","F","E","E","E","E","D","D","E","D","G"],
  "Row Row Row Your Boat": ["C","C","C","D","E","E","D","E","F","G","C","C","C","G","G","G","E","E","E","C","C","C","G","F","E","D","C"],
  "Wheels on the Bus": ["C","C","C","D","E","E","E","D","E","F","G","G","G","F","E","D","C"],
  "We Wish You a Merry Christmas": ["G","G","G","E","C","D","E","F","F","F","E","D","E","F","G","G","G","E","C","D","E","F","E","D","C"],
  "We Will Rock You": ["C","C","G","C","C","G","E","E","D","C","G","G","G","C","C","G","C","C","G","E","E","D","C","G","F","E","D","C"],
  "What Makes You Beautiful": ["E","E","E","F","G","G","G","F","E","D","C","C","C","C","D","E","F","F","F","E","D","C","D","E"],
  "Story of My Life": ["C","D","E","E","D","C","D","E","F","E","D","C","C","D","E","F","G","G","F","E","D","C","D","C"]
};
Object.keys(songs).forEach(title=>{
  const opt=document.createElement('option'); opt.value=title; opt.textContent=title; songSelect.appendChild(opt);
});
let currentSong = songs[songSelect.value] || songs[Object.keys(songs)[0]];
let currentIndex = 0;

function renderSheet(){
  sheetEl.innerHTML = "";
  currentSong.forEach((n,i)=>{
    const span = document.createElement('span');
    span.className = `note ${n}`; span.textContent = n;
    if(i===currentIndex) span.classList.add('active');
    sheetEl.appendChild(span);
  });
}
function highlightIndex(i){
  [...sheetEl.querySelectorAll('.note')].forEach(n=>n.classList.remove('active'));
  const nodes=[...sheetEl.querySelectorAll('.note')]; if(nodes[i]) nodes[i].classList.add('active');
}
function markCorrect(i){ const nodes=[...sheetEl.querySelectorAll('.note')]; if(nodes[i]){ nodes[i].classList.remove('wrong'); nodes[i].classList.add('correct'); } }
function markWrong(i){ const nodes=[...sheetEl.querySelectorAll('.note')]; if(nodes[i]){ nodes[i].classList.remove('correct'); nodes[i].classList.add('wrong'); } }
function resetSheet(){ currentIndex=0; renderSheet(); }
renderSheet();
songSelect.addEventListener('change', ()=>{ currentSong = songs[songSelect.value]; resetSheet(); if(!running){ buildNotes(); drawGame(); } });

/* ============ Falling & judgement config ============ */
const tipColor = {4:'#ffd54d',8:'#5ee380',12:'#8ecbff',16:'#b58eff',20:'#ff6b88'};
const lanes = ['C4','D4','E4','F4','G4']; // logical order fixed
const letterToLane = {C:0,D:1,E:2,F:3,G:4};
const tipToLane = {4:0,8:1,12:2,16:3,20:4};

const laneW = cv.width / lanes.length;
const hitY = cv.height - 96;
const spawnY = -36;

/* Hit zone */
const zoneTop = hitY - 60;
const zoneBot = hitY + 30;
const judgePx = { perfect: 10, great: 20, good: 28 };

/* Timing */
let bpm = parseInt(tempoEl.value);
let dropBeats = parseFloat(speedEl.value);           // larger = slower
function msToBeats(ms){ return ms/1000*(bpm/60); }

/* ============ Left-hand layout: flip DISPLAY only, logic unchanged ============ */
let reversePanel = JSON.parse(localStorage.getItem('reversePanel') || 'false');
function visIndex(i){ return reversePanel ? (lanes.length - 1 - i) : i; }  // logic i → display i
function laneToX(i){ return visIndex(i) * laneW; }
function syncFlipBtn(){
  flipBtn.classList.toggle('activeMode', reversePanel);
  flipBtn.textContent = reversePanel ? '🖐️ Left-hand Layout (On)' : '🖐️ Left-hand Layout (Off)';
}

/* State & stats */
let notes = []; // {lane, note, spawnBeat, y, hit, blinkMs}
let lanePulse = [0,0,0,0,0];
let running=false, startTs=0, score=0;
let songEndBeat = 0;

const stats = { total:0, hit:0, miss:0, perfect:0, great:0, good:0, combo:0, maxCombo:0 };
function resetStats(){ stats.total=notes.length; stats.hit=stats.miss=stats.perfect=stats.great=stats.good=0; stats.combo=stats.maxCombo=0; score=0; updateHUD(); }
function updateHUD(){ const acc = stats.total ? (stats.hit / stats.total * 100) : 0; scoreEl.textContent = `Score: ${score} | Combo: ${stats.combo} | Acc: ${acc.toFixed(1)}%`; }
function endSummary(){ const acc = stats.total ? (stats.hit / stats.total * 100) : 0; statusEl.textContent = `Finished! Perfect ${stats.perfect} / Great ${stats.great} / Good ${stats.good} / Miss ${stats.miss} | Max Combo ${stats.maxCombo} | Acc ${acc.toFixed(1)}%`; showResults('Results'); }

/* ============ Result overlay ============ */
function gradeFromAcc(acc){ if(acc>=98) return 'S'; if(acc>=90) return 'A'; if(acc>=80) return 'B'; if(acc>=70) return 'C'; return 'D'; }
function showResults(title='Results'){
  const acc = stats.total ? (stats.hit / stats.total * 100) : 0;
  document.getElementById('finalTitle').textContent = title;
  document.getElementById('finalRank').textContent  = gradeFromAcc(acc);
  document.getElementById('finalAcc').textContent   = `Accuracy ${acc.toFixed(1)}%`;
  document.getElementById('finalScore').textContent = `Score ${score} | Max Combo ${stats.maxCombo}`;
  document.getElementById('finalBreakdown').innerHTML =
    `<span class="pill">Perfect ${stats.perfect}</span>
     <span class="pill">Great ${stats.great}</span>
     <span class="pill">Good ${stats.good}</span>
     <span class="pill">Miss ${stats.miss}</span>`;
  document.getElementById('resultOverlay').style.display = 'flex';
}
function hideResults(){ document.getElementById('resultOverlay').style.display = 'none'; }
document.getElementById('closeResults').onclick = hideResults;
document.getElementById('playAgain').onclick = ()=>{ hideResults(); startBtn.click(); };
document.getElementById('resultOverlay').addEventListener('click', e=>{ if(e.target.id==='resultOverlay') hideResults(); });

/* Floating judgement text */
let popups = []; function addPopup(x,y,text,color,life=700){ popups.push({x,y,text,color,life}); }

/* ============ Build notes with lead-in beats ============ */
function buildNotes(){
  notes = [];
  let t = 0;
  const leadInBeats = dropBeats; // initial delay = full fall duration

  for(const ch of currentSong){
    if(ch==='-'){ t++; continue; }
    const lane = letterToLane[ch[0]];
    const spawnBeat = (t + leadInBeats) - dropBeats; // hit beat = (t + leadInBeats)
    notes.push({ lane, note: ch+'4', spawnBeat, y: spawnY, hit:false, blinkMs:0 });
    t++;
  }
  const lastIndex = t - 1;
  songEndBeat = lastIndex + leadInBeats + 1; // buffer 1 beat after last note
}

/* ============ Modes: practice / autoplay ============ */
let mode = "practice";
let autoplayTimer = null;
function setMode(newMode){ mode=newMode; practiceBtn.classList.toggle('activeMode',mode==='practice'); autoplayBtn.classList.toggle('activeMode',mode==='autoplay'); if(mode==='autoplay'){ startAutoplay(); } else { stopAutoplay(); resetSheet(); } }
practiceBtn.addEventListener('click', ()=> setMode('practice'));
autoplayBtn.addEventListener('click', ()=> setMode('autoplay'));
function startAutoplay(){ stopAutoplay(); const intervalMs=(60/bpm)*1000; let i=0; highlightIndex(i); autoplayTimer=setInterval(()=>{ if(i>=currentSong.length){ stopAutoplay(); return; } const n=currentSong[i]; if(n!=='-'){ playNote(n); markCorrect(i);} i++; currentIndex=i; highlightIndex(i); }, intervalMs); }
function stopAutoplay(){ if(autoplayTimer){ clearInterval(autoplayTimer); autoplayTimer=null; } }
tempoEl.addEventListener('input', ()=>{ bpm=parseInt(tempoEl.value); if(mode==='autoplay') startAutoplay(); });

/* ============ MediaPipe Hands (mirror alignment + steadier thumb) ============ */
let hands, camera;
let tipsPx = {4:null,8:null,12:null,16:null,20:null};
const fingerDown = {4:false,8:false,12:false,16:false,20:false};

async function setupHands(){
  hands = new Hands({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}` });
  hands.setOptions({ maxNumHands:1, modelComplexity:1, minDetectionConfidence:0.7, minTrackingConfidence:0.7 });
  hands.onResults(onResults);
  camera = new Camera(video, { onFrame: async()=>{ await hands.send({image:video}); }, width:640, height:480 });
  await camera.start();

  const syncSize = ()=>{
    overlay.width = video.videoWidth || overlay.clientWidth;
    overlay.height= video.videoHeight|| overlay.clientHeight;
  };
  video.addEventListener('loadedmetadata', syncSize);
  video.addEventListener('loadeddata', syncSize);
}

/* — Thumb-specific detection: angle + normalized displacement — */
function detectThumb(rawLm){
  const wrist = rawLm[0];
  const mcp   = rawLm[2];  // thumb MCP
  const ip    = rawLm[3];
  const tip   = rawLm[4];
  const idxM  = rawLm[5];  // index MCP
  const pkyM  = rawLm[17]; // pinky MCP
  if(!wrist || !mcp || !ip || !tip || !idxM || !pkyM){ return { pressed:false, bend:0 }; }

  const handW = Math.hypot(idxM.x - pkyM.x, idxM.y - pkyM.y) || 1;

  const dxN = Math.abs(tip.x - mcp.x) / handW;
  const dyN = (tip.y - mcp.y) / handW;

  const v1x = tip.x - mcp.x,   v1y = tip.y - mcp.y;
  const v2x = wrist.x - mcp.x, v2y = wrist.y - mcp.y;
  const den = (Math.hypot(v1x,v1y) * Math.hypot(v2x,v2y)) || 1;
  let cosA  = (v1x*v2x + v1y*v2y) / den;
  cosA = Math.max(-1, Math.min(1, cosA));
  const angle = Math.acos(cosA);

  const pressed = (dyN > 0.06) || (dxN > 0.08) || (angle < 0.75);
  const bend = Math.max(0, Math.min(1, Math.max(dyN*3, dxN*2, (0.75 - angle)*1.6)));

  return { pressed, bend };
}

function onResults(results){
  octx.save();
  octx.clearRect(0,0,overlay.width,overlay.height);

  if(results.multiHandLandmarks){
    results.multiHandLandmarks.forEach(rawLm=>{
      // Mirror landmarks (x -> 1-x) to match mirrored video if enabled
      const lm = mirrorChk.checked ? rawLm.map(p=>({...p, x:1 - p.x})) : rawLm;

      // 1) draw skeleton and landmarks
      drawConnectors(octx, lm, HAND_CONNECTIONS, { color:"#7fffd4", lineWidth: 2 });
      drawLandmarks (octx, lm, { color:"#ffffff", lineWidth: 1 });

      // 2) map to game canvas + draw labels
      for(const id of [4,8,12,16,20]){
        const pt = lm[id];
        const x = pt.x * overlay.width;
        const y = pt.y * overlay.height;
        tipsPx[id] = { x: x / overlay.width * cv.width, y: y / overlay.height * cv.height };

        const label = ({4:'Thumb → C',8:'Index → D',12:'Middle → E',16:'Ring → F',20:'Pinky → G'})[id];
        octx.font = "16px Inter, Arial";
        octx.fillStyle = tipColor[id];
        octx.strokeStyle = "rgba(0,0,0,.55)";
        octx.lineWidth = 3;
        octx.strokeText(label, x+10, y-10);
        octx.fillText(label, x+10, y-10);
      }

      // 3) finger detection: thumb uses detectThumb, others use baseline rule
      Object.entries({4:'C',8:'D',12:'E',16:'F',20:'G'}).forEach(([tipIndex, letter])=>{
        const t = parseInt(tipIndex);
        const tip  = rawLm[t];
        const base = rawLm[(t===4)?2:(t-3)];
        if(!tip || !base) return;

        let pressed=false, bend=0;
        if(t===4){
          const th = detectThumb(rawLm);
          pressed = th.pressed;
          bend    = th.bend;
        }else{
          const diff = tip.y - base.y - 0.02; // looseness
          pressed = diff > 0;
          bend    = Math.min(1, Math.max(0, diff*8));
        }

        if(pressed && !fingerDown[t]){
          fingerDown[t]=true;
          if(mode==='practice'){
            const target=currentSong[currentIndex];
            if(target){
              if(letter===target){ markCorrect(currentIndex); currentIndex++; highlightIndex(currentIndex); }
              else { markWrong(currentIndex); }
            }
          } else { playNote(letter); }
          onFingerPress(letter, bend);
        } else if(!pressed) { fingerDown[t]=false; }
      });
    });
  }else{
    tipsPx = {4:null,8:null,12:null,16:null,20:null};
  }
  octx.restore();
}

/* ============ Countdown (3→2→1→GO) ============ */
let isCountingDown = false, countdownVal = 0, countdownTimer = null, goFlashMs = 0;
function startCountdown(n, onDone){
  isCountingDown = true; countdownVal = n; goFlashMs = 0; drawGame();
  countdownTimer = setInterval(()=>{
    countdownVal--;
    if(countdownVal <= 0){
      clearInterval(countdownTimer);
      goFlashMs = 650; drawGame();
      setTimeout(()=>{ isCountingDown=false; goFlashMs=0; onDone && onDone(); }, goFlashMs);
    } else { drawGame(); }
  }, 1000);
}

/* ============ Hit (valid only inside Hit Zone) ============ */
function playNote(letter){
  const pitch = `${letter}4`;
  if(currentInstrument === drums){ currentInstrument.triggerAttackRelease("C2","8n"); }
  else if(currentInstrument.triggerAttackRelease){ currentInstrument.triggerAttackRelease(pitch,"8n"); }
}
function onFingerPress(letter, bend=0){
  const lane = letterToLane[letter]; if(lane==null) return;
  if(isCountingDown || !running){ lanePulse[lane]=200; return; }
  const cand = notes.find(n => !n.hit && n.lane===lane && n.y>=zoneTop && n.y<=zoneBot);
  if(!cand){ lanePulse[lane]=200; return; }

  const delta = Math.abs(cand.y - hitY);
  let grade='Good', add=100, color='#cde7ff';
  if(delta<=judgePx.perfect){ grade='Perfect'; add=300; color='#7CFC7C'; stats.perfect++; }
  else if(delta<=judgePx.great){ grade='Great'; add=200; color:'#9bd1ff'; stats.great++; }
  else if(delta<=judgePx.good){ grade='Good'; add=100; color:'#ffd57e'; stats.good++; }

  cand.hit=true; cand.blinkMs=160+bend*120; playNote(letter);
  stats.hit++; stats.combo++; stats.maxCombo=Math.max(stats.maxCombo,stats.combo); score+=add; updateHUD();

  // With left/right flip, popup appears at the center of the DISPLAY lane
  const x = laneToX(lane) + laneW*0.5;
  addPopup(x, hitY-36, grade, color);
}

/* ============ Rendering & loop ============ */
function hexWithAlpha(hex,a){ const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; }
function drawCountdownOverlay(){
  if(!isCountingDown && goFlashMs<=0) return;
  ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(0,0,cv.width,cv.height);
  ctx.textAlign='center'; ctx.font='bold 96px ui-sans-serif'; ctx.fillStyle='#9be1ff';
  if(isCountingDown){ ctx.fillText(String(countdownVal||1), cv.width/2, cv.height/2+32); }
  else if(goFlashMs>0){ ctx.fillStyle='#7CFC7C'; ctx.fillText('GO!', cv.width/2, cv.height/2+32); }
  ctx.textAlign='left';
}
function drawGame(){
  ctx.clearRect(0,0,cv.width,cv.height);

  // Lanes & pulse (use laneToX for display flip)
  for(let i=0;i<lanes.length;i++){
    const x0 = laneToX(i);
    ctx.fillStyle='#0f1722'; ctx.fillRect(x0,0,laneW,cv.height);
    if(lanePulse[i]>0){ const a=Math.min(1,lanePulse[i]/200); const col=Object.values(tipColor)[i]; ctx.fillStyle=hexWithAlpha(col,0.25*a); ctx.fillRect(x0,0,laneW,cv.height); }
    ctx.strokeStyle='#122033'; ctx.strokeRect(x0,0,laneW,cv.height);
    ctx.fillStyle='#8ea6c6'; ctx.font='12px ui-sans-serif'; ctx.fillText(lanes[i], x0 + laneW*0.46, 16);
  }

  // Hit zone + judge line
  ctx.fillStyle='rgba(103,179,255,0.08)'; ctx.fillRect(0,zoneTop,cv.width,zoneBot-zoneTop);
  ctx.strokeStyle='#3b5f87'; ctx.strokeRect(0,zoneTop,cv.width,zoneBot-zoneTop);
  ctx.strokeStyle='#2c3e55'; ctx.beginPath(); ctx.moveTo(0,hitY); ctx.lineTo(cv.width,hitY); ctx.stroke();

  // Blocks (draw at DISPLAY lane)
  for(const n of notes){
    if(n.hit) continue;
    if(n.y<-60 || n.y>cv.height+80) continue;
    const x = laneToX(n.lane) + laneW*0.12, w=laneW*0.76, h=24;
    const baseCol = Object.values(tipColor)[n.lane];
    ctx.fillStyle = baseCol + 'cc'; ctx.fillRect(x, n.y-h/2, w, h);
    if(n.blinkMs>0){ const k=n.blinkMs/200; ctx.fillStyle=hexWithAlpha(baseCol,0.25*k); ctx.fillRect(x-6,n.y-h/2-3,w+12,h+6); ctx.lineWidth=2+2*k; ctx.strokeStyle=hexWithAlpha(baseCol,0.9*k); ctx.strokeRect(x-2,n.y-h/2-2,w+4,h+4); }
  }

  // Finger cursors
  for(const [id,pos] of Object.entries(tipsPx)){
    if(!pos) continue; const col=tipColor[id]; ctx.strokeStyle=col; ctx.beginPath(); ctx.arc(pos.x,pos.y,10,0,Math.PI*2); ctx.stroke();
  }

  // Floating texts
  for(const p of popups){ const a=Math.max(0,p.life/700); ctx.globalAlpha=a; ctx.fillStyle=p.color; ctx.font='bold 18px ui-sans-serif'; ctx.fillText(p.text,p.x-30,p.y-(1-a)*20); ctx.globalAlpha=1; }

  drawCountdownOverlay();
}
function loop(){
  if(!running) return;
  const now=performance.now(); const curBeat=msToBeats(now - startTs);

  // y update
  for(const n of notes){ const p=curBeat - n.spawnBeat; const full=(hitY - spawnY); n.y = spawnY + (p / dropBeats) * full; }

  // Miss: passed below the zone without a hit
  for(const n of notes){ if(!n.hit && n.y > zoneBot + 2){ n.hit=true; stats.miss++; stats.combo=0; updateHUD(); const x=laneToX(n.lane) + laneW*0.5; addPopup(x,zoneBot,'Miss','#ff6b88'); } }

  // Cleanup & decay
  notes = notes.filter(n => !n.hit && n.y < cv.height + 80);
  const dt=1000/60;
  for(let i=0;i<lanePulse.length;i++){ if(lanePulse[i]>0) lanePulse[i]=Math.max(0,lanePulse[i]-dt); }
  for(const n of notes){ if(n.blinkMs>0) n.blinkMs=Math.max(0,n.blinkMs-dt); }
  popups = popups.filter(p => (p.life -= dt) > 0);
  if(goFlashMs>0) goFlashMs=Math.max(0,goFlashMs-dt);

  drawGame();

  if(notes.length===0 && curBeat > songEndBeat){
    running=false; endSummary(); startBtn.disabled=false; stopBtn.disabled=true;
  } else { requestAnimationFrame(loop); }
}

/* ============ Interactions ============ */
mirrorChk.addEventListener('change', ()=> video.classList.toggle('mirror', mirrorChk.checked));
speedEl.addEventListener('input', ()=>{
  dropBeats=parseFloat(speedEl.value);
  statusEl.textContent=`Fall Duration ≈ ${dropBeats.toFixed(1)} beats`;
});
tempoEl.addEventListener('input', ()=>{ bpm=parseInt(tempoEl.value); if(mode==='autoplay') startAutoplay(); });

flipBtn.addEventListener('click', ()=>{
  reversePanel = !reversePanel;
  localStorage.setItem('reversePanel', JSON.stringify(reversePanel));
  syncFlipBtn();
  drawGame(); // refresh display immediately
});

camBtn.addEventListener('click', async ()=>{
  try{
    await setupHands();
    video.classList.toggle('mirror', mirrorChk.checked);
    camBtn.disabled=true; startBtn.disabled=false;
    statusEl.textContent='Camera enabled';
  }catch(e){ statusEl.textContent='Unable to enable camera: '+e.message; }
});

startBtn.addEventListener('click', async ()=>{
  await Tone.start();
  hideResults();
  bpm=parseInt(tempoEl.value);
  buildNotes(); resetStats();
  startBtn.disabled=true; stopBtn.disabled=true; statusEl.textContent='Getting ready…';
  startCountdown(3, ()=>{
    startTs=performance.now(); running=true; stopBtn.disabled=false; statusEl.textContent='Game in progress'; loop();
  });
});

stopBtn.addEventListener('click', ()=>{
  running=false; notes=[]; stopAutoplay();
  stopBtn.disabled=true; startBtn.disabled=false;
  statusEl.textContent='Stopped'; drawGame(); endSummary();
});

/* Init */
syncFlipBtn();
buildNotes(); resetStats(); drawGame();
statusEl.textContent = 'Click "Enable Camera" first, then "Start Game".';

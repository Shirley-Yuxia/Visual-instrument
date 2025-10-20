// ====== Tone.js Instruments ======
const piano = new Tone.Sampler({
  urls: { C4: "C4.mp3", E4: "E4.mp3", G4: "G4.mp3" },
  baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/piano/",
  onload: () => console.log("Real Piano loaded 🎹")
}).toDestination();
 
// Guitar
const guitar = new Tone.Sampler({
  urls: {
    C3: "C3.mp3",
    E3: "E3.mp3",
    G3: "G3.mp3",
    C4: "C4.mp3",
  },
  baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/guitar-acoustic/",
  onload: () => console.log("Guitar loaded 🎸")
}).toDestination();
  
// Violin
const violin = new Tone.Sampler({
  urls: {
    C4: "C4.mp3",
    E4: "E4.mp3",
    G4: "G4.mp3",
  },
  baseUrl: "https://nbrosowsky.github.io/tonejs-instruments/samples/violin/",
  onload: () => console.log("Violin loaded 🎻")
}).toDestination();
 
const drums = new Tone.MembraneSynth().toDestination();

 
const trumpet = new Tone.Synth({
  oscillator: { type: "sawtooth" },  // bright and rich harmonics — like a brass instrument
  envelope: {
    attack: 0.02,   // quick start (brass instruments have a sharp breath attack)
    decay: 0.25,    // small dip after the attack
    sustain: 0.4,   // steady airflow
    release: 0.6    // short fade when key is released
  }
})
  .connect(new Tone.Filter(1200, "lowpass")) // soften harsh highs
  .connect(new Tone.Reverb(1.8))             // add light hall reverb
  .toDestination();
 
  // Instrument map
  const instruments = { piano, guitar, violin, trumpet };
  let currentInstrument = instruments.piano;

  
document.body.addEventListener("click", async () => {
  await Tone.start();
  console.log("Audio context started");
}, { once: true });
  
  // ====== Volume + Tempo ======
  const volumeEl = document.getElementById("volume");
  const tempoEl  = document.getElementById("tempo");
  Tone.Destination.volume.value = parseFloat(volumeEl.value);
  volumeEl.addEventListener("input", () => {
    Tone.Destination.volume.value = parseFloat(volumeEl.value);
  });
  
  // ====== Instrument Selector ======
  const instrumentEl = document.getElementById("instrument");
  instrumentEl.addEventListener("change", e => {
    currentInstrument = instruments[e.target.value];
  });
  
  // ====== Song List (C–G only for one hand) ======
  const songs = {
    "Mary Had a Little Lamb": ["E","D","C","D","E","E","E","D","D","D","E","G","G","E","D","C","D","E","E","E","D","D","E","D","C"],
    "Itsy Bitsy Spider": ["C","D","E","F","G","G","F","E","F","G","E","F","G","A","G","F","E","D","C","D","E","F","G","G","F","E","D","C"],
    "Jingle Bells": ["E","E","E","E","E","E","E","G","C","D","E","F","F","F","F","F","E","E","E","E","D","D","E","D","G"],
    "Row Row Row Your Boat": ["C","C","C","D","E","E","D","E","F","G","C","C","C","G","G","G","E","E","E","”C","C","C","G","F","E","D","C"],
    "Wheels on the Bus": ["C","D","E","C","E","F","G","E","C","D","E","F","E","D","C","G","E","C"],
    "We Wish You a Merry Christmas": ["G","G","G","E","C","D","E","F","F","F","E","D","E","F","G","G","G","E","C","D","E","F","E","D","C"],
    "We Will Rock You": ["C","C","G","C","C","G","E","E","D","C","G","G","G","C","C","G","C","C","G","E","E","D","C","G","F","E","D","C"],
    "What Makes You Beautiful": ["E","E","E","F","G","G","G","F","E","D","C","C","C","C","D","E","F","F","F","E","D","C","D","E"],
    "Story of My Life": ["C","D","E","E","D","C","D","E","F","E","D","C","C","D","E","F","G","G","F","E","D","C","D","C"]
  };
  
  // ====== DOM Elements ======
  const songSelect = document.getElementById("songSelect");
  Object.keys(songs).forEach(title => {
    const opt = document.createElement("option");
    opt.value = title; opt.textContent = title;
    songSelect.appendChild(opt);
  });
  
  const autoplayBtn = document.getElementById("autoplayBtn");
  const practiceBtn = document.getElementById("practiceBtn");
  
  // Mode state
  let mode = "practice"; // "practice" | "autoplay"
  practiceBtn.addEventListener("click", () => {
    mode = "practice";
    practiceBtn.classList.add("active");
    autoplayBtn.classList.remove("active");
    stopAutoplay();
    resetSheetStatus();
  });
  autoplayBtn.addEventListener("click", async () => {
    mode = "autoplay";
    autoplayBtn.classList.add("active");
    practiceBtn.classList.remove("active");
    startAutoplay();
  });
  
  // ====== Music Sheet Rendering ======
  const sheetEl = document.getElementById("musicSheet");
  let currentSong = songs[songSelect.value] || songs[Object.keys(songs)[0]];
  let currentIndex = 0;
  
  songSelect.addEventListener("change", () => {
    currentSong = songs[songSelect.value];
    currentIndex = 0;
    renderSheet();
  });
  
  function renderSheet(){
    sheetEl.innerHTML = "";
    currentSong.forEach((note, i) => {
      const span = document.createElement("span");
      span.className = `note ${note}`;
      span.textContent = note;
      if(i === currentIndex) span.classList.add("active");
      sheetEl.appendChild(span);
    });
  }
  function highlightIndex(i){
    const nodes = [...sheetEl.querySelectorAll(".note")];
    nodes.forEach(n => n.classList.remove("active"));
    if(nodes[i]) nodes[i].classList.add("active");
  }
  function markCorrect(i){
    const nodes = [...sheetEl.querySelectorAll(".note")];
    if(nodes[i]) {
      nodes[i].classList.remove("wrong");
      nodes[i].classList.add("correct");
    }
  }
  function markWrong(i){
    const nodes = [...sheetEl.querySelectorAll(".note")];
    if(nodes[i]) {
      nodes[i].classList.remove("correct");
      nodes[i].classList.add("wrong");
    }
  }
  function resetSheetStatus(){
    currentIndex = 0;
    renderSheet();
  }
  renderSheet();
  
  // ====== Autoplay Logic ======
  let autoplayTimer = null;
  async function startAutoplay(){
    await Tone.start();
    stopAutoplay();
    const bpm = parseInt(tempoEl.value);
    const intervalMs = (60 / bpm) * 1000;
  
    let i = 0;
    highlightIndex(i);
    autoplayTimer = setInterval(() => {
      if(i >= currentSong.length){
        stopAutoplay();
        return;
      }
      playNote(currentSong[i]);
      markCorrect(i);
      i++;
      currentIndex = i;
      highlightIndex(i);
    }, intervalMs);
  }
  function stopAutoplay(){
    if(autoplayTimer){ clearInterval(autoplayTimer); autoplayTimer = null; }
  }
  
  // ====== Finger → Note Mapping ======
  const mapTipToNote = {
    4:  { note: "C", color: "#ffee00", name: "Thumb"  },
    8:  { note: "D", color: "#00e676", name: "Index"  },
    12: { note: "E", color: "#2979ff", name: "Middle" },
    16: { note: "F", color: "#651fff", name: "Ring"   },
    20: { note: "G", color: "#f50057", name: "Pinky"  },
  };
  
  // Track press states
  const fingerDown = { 4:false, 8:false, 12:false, 16:false, 20:false };
  
  // ====== Helpers ======
  function playNote(note){
    const pitch = `${note}4`;
    if (currentInstrument === drums) {
      currentInstrument.triggerAttackRelease("C2", "8n");
    } else if (currentInstrument.triggerAttackRelease) {
      currentInstrument.triggerAttackRelease(pitch, "8n");
    }
  }
  
  function handleUserPress(note){
    if(mode !== "practice") return;
    const target = currentSong[currentIndex];
    if(!target) return;
  
    if(note === target){
      playNote(note);
      markCorrect(currentIndex);
      currentIndex++;
      highlightIndex(currentIndex);
    }else{
      markWrong(currentIndex);
    }
  }
  
  // ====== MediaPipe: Camera + Drawing ======
  const videoEl = document.getElementById("video");
  const canvasEl = document.getElementById("output");
  const ctx = canvasEl.getContext("2d");
  
  const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });
  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7,
  });
  hands.onResults(onResults);
  
  const camera = new Camera(videoEl, {
    onFrame: async () => {
      await hands.send({ image: videoEl });
    },
    width: 640,
    height: 480
  });
  camera.start();
  
  // ====== Cartoon Hand Helpers ======
  const FINGERS = {
    thumb:  [1,2,3,4],
    index:  [5,6,7,8],
    middle: [9,10,11,12],
    ring:   [13,14,15,16],
    pinky:  [17,18,19,20],
  };
  const PALM_LOOP = [0, 1, 5, 9, 13, 17];
  
  let smoothLandmarks = null;
  const SMOOTH_ALPHA = 0.35; 
  
  function lerp(a, b, t){ return a + (b - a) * t; }
  function smooth(landmarks){
    if(!smoothLandmarks){
      smoothLandmarks = landmarks.map(p => ({...p}));
      return smoothLandmarks;
    }
    for(let i=0;i<landmarks.length;i++){
      smoothLandmarks[i].x = lerp(smoothLandmarks[i].x, landmarks[i].x, SMOOTH_ALPHA);
      smoothLandmarks[i].y = lerp(smoothLandmarks[i].y, landmarks[i].y, SMOOTH_ALPHA);
      smoothLandmarks[i].z = lerp(smoothLandmarks[i].z, landmarks[i].z, SMOOTH_ALPHA);
    }
    return smoothLandmarks;
  }
  
  function noteColor(note){
    switch(note){
      case "C": return "#ffb6c1";
      case "D": return "#a3e4d7";
      case "E": return "#add8e6";
      case "F": return "#d1c4e9";
      case "G": return "#ffcc80";
      default:  return "#ffd6e0";
    }
  }
  
  function toPx(p, w, h){
    return { x: p.x * w, y: p.y * h, z: p.z };
  }
  
  function drawCartoonHand(ctx, rawLandmarks, w, h){
    if(!rawLandmarks || rawLandmarks.length < 21) return;
    const L = smooth(rawLandmarks).map(p => toPx(p, w, h));
  
    // Cute gradient background
    const grd = ctx.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, "#fff8fb");
    grd.addColorStop(1, "#ffeef6");
    ctx.fillStyle = grd;
    ctx.fillRect(0,0,w,h);
  
    const SKIN = "#ffd9c2";
    const SKIN_STROKE = "#f5bba0";
  
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  
    // Palm outline
    ctx.beginPath();
    const p0 = L[PALM_LOOP[0]];
    ctx.moveTo(p0.x, p0.y);
    for(let i=1;i<PALM_LOOP.length;i++){
      const p = L[PALM_LOOP[i]];
      ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.fillStyle = SKIN;
    ctx.strokeStyle = SKIN_STROKE;
    ctx.lineWidth = 10;
    ctx.fill();
    ctx.stroke();
  
    // Fingers (jelly style)
    const fingerStyles = [
      { chain: FINGERS.thumb,  base: 18, tip: 10 },
      { chain: FINGERS.index,  base: 20, tip: 10 },
      { chain: FINGERS.middle, base: 22, tip: 11 },
      { chain: FINGERS.ring,   base: 20, tip: 10 },
      { chain: FINGERS.pinky,  base: 18, tip: 9  },
    ];
  
    fingerStyles.forEach((style) => {
      const chain = style.chain.map(i => L[i]);
      for(let i=0;i<chain.length-1;i++){
        const a = chain[i], b = chain[i+1];
        const t = i / (chain.length-2);
        const width = style.base + (style.tip - style.base) * t;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = SKIN_STROKE;
        ctx.lineWidth = width + 2;
        ctx.stroke();
  
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = SKIN;
        ctx.lineWidth = width;
        ctx.stroke();
      }
    });
  
    // Fingertip candy caps
    const TIP_MAP = { 4:"C", 8:"D", 12:"E", 16:"F", 20:"G" };
    Object.entries(TIP_MAP).forEach(([tipIndex, note]) => {
      const t = L[parseInt(tipIndex,10)];
      const r = 12;
      ctx.beginPath();
      ctx.arc(t.x, t.y, r+2, 0, Math.PI*2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(t.x, t.y, r, 0, Math.PI*2);
      ctx.fillStyle = noteColor(note);
      ctx.fill();
  
      ctx.font = "bold 14px 'Comic Neue', Poppins, Arial";
      ctx.fillStyle = "#5e5e5e";
      ctx.textAlign = "center";
      ctx.fillText(note, t.x, t.y - r - 6);
    });
  
    // Ground shadow
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.filter = "blur(8px)";
    ctx.fillStyle = "#ff80ab";
    ctx.beginPath();
    ctx.ellipse(w*0.2, h*0.9, 120, 18, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
  
  // ====== onResults: draw only cartoon hand (no camera frame) ======
  function onResults(results){
    if (canvasEl.width !== videoEl.videoWidth) {
      canvasEl.width = videoEl.videoWidth || 640;
      canvasEl.height = videoEl.videoHeight || 480;
    }
    const w = canvasEl.width, h = canvasEl.height;
  
    ctx.save();
    ctx.clearRect(0,0,w,h);
  
    if(results.multiHandLandmarks && results.multiHandLandmarks.length){
      const landmarks = results.multiHandLandmarks[0];
      drawCartoonHand(ctx, landmarks, w, h);
  
      // Finger press detection + note playback
      Object.entries(mapTipToNote).forEach(([tipIndex, meta]) => {
        const tip = landmarks[tipIndex];
        if(!tip) return;
  
        let baseIndex = (parseInt(tipIndex) === 4) ? 2 : (parseInt(tipIndex) - 3);
        const base = landmarks[baseIndex];
        if(!base) return;
  
        const looseness = 0.02;
        let pressed = false;
        if (parseInt(tipIndex) === 4) {
          const dx = Math.abs(tip.x - base.x);
          const dy = tip.y - base.y;
          if (dy > looseness || dx > 0.05) pressed = true;
        } else {
          pressed = tip.y > (base.y + looseness);
        }
  
        if(pressed && !fingerDown[tipIndex]){
          fingerDown[tipIndex] = true;
          handleUserPress(meta.note);
          if(mode === "autoplay"){ playNote(meta.note); }
        } else if(!pressed){
          fingerDown[tipIndex] = false;
        }
      });
  
    } else {
      // No hand detected → draw background + message
      const grd = ctx.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, "#fff8fb");
      grd.addColorStop(1, "#ffeef6");
      ctx.fillStyle = grd;
      ctx.fillRect(0,0,w,h);
  
      ctx.font = "600 18px 'Comic Neue', Poppins, Arial";
      ctx.fillStyle = "#ff80ab";
      ctx.textAlign = "center";
      ctx.fillText("Raise your hand to the camera — watch the cute hand follow you 🎶", w/2, h/2);
    }
  
    ctx.restore();
  }
  
  // Keep autoplay timing synced with tempo changes
  tempoEl.addEventListener("input", () => {
    if(mode === "autoplay"){
      startAutoplay();
    }
  });
  

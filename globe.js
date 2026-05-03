/* PNM Sports — Interactive futuristic globe
   - Orthographic projection of low-poly continents
   - Drag to rotate, auto-rotate when idle, partner pins follow rotation
*/
(function () {
  const container = document.getElementById('globeContainer');
  if (!container) return;

  const canvas = document.getElementById('globeCanvas');
  const ctx = canvas.getContext('2d');
  const labelLayer = document.getElementById('globeLabels');

  // ----- Partner pins (lat, lon in degrees) -----
  const PINS = [
    {
      id: 'paris', name: 'Paris', country: 'France', region: 'Hub Paris',
      lat: 48.86, lon: 2.35, hub: true,
      division: 'Ligue 1 · Ligue 2',
      clubs: 'PSG · OM · Paris FC · Red Star · Reims · Monaco'
    },
    {
      id: 'russia', name: 'Moscou', country: 'Russie', region: 'Russie',
      lat: 55.75, lon: 37.62,
      division: 'Premier League',
      clubs: 'Spartak · CSKA · Zenit'
    },
    {
      id: 'china', name: 'Shanghai', country: 'Chine', region: 'Chine',
      lat: 31.23, lon: 121.47,
      division: 'Super League',
      clubs: 'Shanghai · Beijing · Shandong'
    },
    {
      id: 'india', name: 'Mumbai', country: 'Inde', region: 'Inde',
      lat: 19.07, lon: 72.87,
      division: 'Indian Super League',
      clubs: 'Mumbai City · Bengaluru'
    },
    {
      id: 'thailand', name: 'Bangkok', country: 'Thaïlande', region: 'Thaïlande',
      lat: 13.75, lon: 100.50,
      division: 'Thai League',
      clubs: 'Buriram · BG Pathum'
    },
    {
      id: 'gulf', name: 'Riyad', country: 'Arabie Saoudite', region: 'Golfe Arabique',
      lat: 24.71, lon: 46.67,
      division: 'EAU · Arabie · Qatar',
      clubs: 'Al-Hilal · Al-Nassr · Al-Ain'
    },
    {
      id: 'maghreb', name: 'Casablanca', country: 'Maroc', region: 'Maghreb',
      lat: 33.57, lon: -7.59,
      division: 'Botola · L1 Tunisie',
      clubs: 'Wydad · Raja · Espérance'
    },
    {
      id: 'africa', name: 'Lagos', country: 'Nigeria', region: 'Afrique Sub-saharienne',
      forcePlacement: 'top-right',
      lat: 6.52, lon: 3.38,
      division: 'Nigeria · Sénégal · Côte d\'Ivoire',
      clubs: 'Réseau Y. Oyedotun'
    }
  ];

  // ----- Globe state -----
  let W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);
  let cx = 0, cy = 0, R = 0;
  // Rotation: yaw rotates around vertical axis (longitude offset), pitch tilts
  let yaw = 2.0;             // initial: Europe-facing (with corrected hemisphere orientation)
  let pitch = 0.85;          // tilt: brings Europe down toward visual center
  let autoRotate = true;
  let dragging = false;
  let lastX = 0, lastY = 0;
  let velYaw = -0.00012;     // very slow eastward rotation (premium, calm drift)
  let lastTs = 0;

  // Build label DOM elements
  const labelEls = {};
  PINS.forEach(p => {
    const el = document.createElement('div');
    el.className = 'g-label' + (p.hub ? ' is-hub' : '');
    el.innerHTML = `
      <div class="g-card">
        <div class="g-region">${p.region}</div>
        <div class="g-division">${p.division}</div>
        <div class="g-clubs">${p.clubs}</div>
      </div>
      <div class="g-line"></div>
      <div class="g-dot"><span class="g-dot-pulse"></span></div>
    `;
    labelLayer.appendChild(el);
    labelEls[p.id] = el;
  });

  // ----- Resize -----
  function resize() {
    const rect = container.getBoundingClientRect();
    W = rect.width; H = rect.height;
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cx = W / 2; cy = H / 2;
    R = Math.min(W, H) * 0.42;
  }
  resize();
  window.addEventListener('resize', resize);

  // ----- Math: lat/lon → 3D → orthographic 2D -----
  function project(latDeg, lonDeg) {
    const lat = latDeg * Math.PI / 180;
    const lon = lonDeg * Math.PI / 180;
    // 3D unit sphere coords (Y up). Negate x so positive longitudes appear east (right) of prime meridian.
    let x = -Math.cos(lat) * Math.cos(lon);
    let y = Math.sin(lat);
    let z = Math.cos(lat) * Math.sin(lon);
    // Apply yaw (rotate around Y)
    const cy_ = Math.cos(yaw), sy_ = Math.sin(yaw);
    let x2 = x * cy_ + z * sy_;
    let z2 = -x * sy_ + z * cy_;
    // Apply pitch (rotate around X)
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const y3 = y * cp - z2 * sp;
    const z3 = y * sp + z2 * cp;
    return {
      x: cx + x2 * R,
      y: cy - y3 * R, // canvas y inverted
      z: z3,          // > 0 = front facing camera
    };
  }

  // Continent polygons — extremely low-res silhouettes (lon, lat) in degrees.
  // Hand-drawn approximations following real coastlines, sufficient for a stylized globe.
  const CONTINENTS = [
    // North America (mainland + Greenland combined into multiple parts)
    { name: 'na', parts: [
      [[-168,66],[-160,71],[-148,70],[-135,69],[-128,70],[-110,72],[-95,72],[-82,73],[-75,67],[-65,60],[-58,52],[-55,47],[-65,44],[-70,42],[-75,38],[-80,32],[-82,26],[-80,25],[-87,30],[-93,29],[-97,26],[-100,28],[-106,28],[-115,30],[-118,33],[-120,35],[-124,40],[-124,46],[-127,50],[-132,55],[-145,60],[-155,62],[-165,63]],
      [[-100,80],[-90,82],[-80,83],[-72,82],[-65,80],[-60,76],[-65,73],[-78,73],[-92,75]] // arctic
    ]},
    // Greenland
    { name: 'greenland', parts: [
      [[-43,82],[-30,82],[-22,80],[-22,75],[-30,68],[-42,60],[-50,60],[-55,68],[-55,75],[-50,80]]
    ]},
    // South America
    { name: 'sa', parts: [
      [[-78,12],[-70,12],[-62,10],[-55,5],[-48,0],[-40,-5],[-35,-8],[-38,-15],[-42,-22],[-48,-27],[-58,-35],[-65,-42],[-68,-50],[-72,-54],[-74,-50],[-72,-42],[-71,-32],[-72,-22],[-78,-15],[-80,-5],[-79,2],[-78,8]]
    ]},
    // Africa
    { name: 'africa', parts: [
      [[-17,15],[-12,22],[-5,30],[5,32],[12,32],[20,32],[28,31],[33,32],[35,28],[35,22],[37,18],[40,12],[42,11],[45,10],[51,11],[51,5],[48,0],[42,-3],[40,-9],[40,-15],[36,-20],[32,-26],[28,-32],[22,-34],[18,-34],[15,-30],[13,-22],[12,-15],[10,-5],[8,0],[3,4],[-2,5],[-7,5],[-10,7],[-13,11],[-17,12]],
      [[44,-20],[48,-13],[50,-15],[50,-22],[47,-25],[44,-25]] // Madagascar
    ]},
    // Europe (simplified)
    { name: 'eu', parts: [
      [[-9,43],[-3,43],[3,43],[8,43],[12,46],[18,46],[24,46],[28,46],[32,46],[35,42],[28,40],[24,40],[20,40],[15,38],[12,38],[8,40],[3,42],[-2,36],[-9,38]],
      [[-5,55],[2,52],[7,55],[10,55],[12,57],[10,60],[5,60],[-2,58],[-5,55]], // UK
      [[5,58],[10,58],[14,60],[18,63],[22,65],[28,68],[26,70],[18,70],[12,67],[8,63],[5,60]] // Scandinavia
    ]},
    // Russia / Eurasia north
    { name: 'russia', parts: [
      [[28,55],[35,57],[42,58],[55,58],[68,60],[80,60],[95,62],[110,65],[125,68],[140,70],[155,68],[170,67],[180,66],[180,77],[160,77],[140,76],[120,75],[100,76],[80,74],[60,72],[48,68],[40,64],[32,60],[28,58]]
    ]},
    // Middle East
    { name: 'me', parts: [
      [[26,30],[34,30],[40,30],[48,30],[55,28],[58,24],[55,18],[50,16],[44,14],[40,15],[36,18],[32,22],[28,26]]
    ]},
    // India
    { name: 'india', parts: [
      [[68,24],[72,25],[78,28],[84,26],[88,24],[92,22],[91,18],[88,15],[82,10],[78,8],[74,12],[70,18],[68,22]]
    ]},
    // China + Central Asia + Mongolia
    { name: 'china', parts: [
      [[60,42],[68,42],[78,42],[88,46],[98,48],[110,50],[120,48],[125,42],[122,38],[120,32],[118,28],[112,22],[106,20],[100,22],[96,28],[90,32],[82,36],[72,38],[64,40]]
    ]},
    // South-East Asia + Indonesia
    { name: 'sea', parts: [
      [[97,20],[102,18],[106,16],[108,12],[107,5],[102,2],[100,5],[98,8],[97,14]],
      [[95,5],[100,4],[105,2],[105,-3],[100,-3],[97,0],[95,3]], // Sumatra
      [[110,-2],[118,-3],[123,-4],[120,-7],[112,-8],[110,-7]], // Java/Borneo
      [[115,7],[120,8],[125,7],[126,10],[122,18],[118,16],[115,12]] // Philippines
    ]},
    // Australia
    { name: 'aus', parts: [
      [[114,-22],[118,-20],[122,-18],[128,-15],[134,-12],[140,-13],[146,-18],[150,-22],[152,-28],[148,-35],[143,-38],[138,-35],[132,-32],[124,-32],[118,-30],[114,-26]]
    ]},
    // Japan
    { name: 'japan', parts: [
      [[130,32],[134,34],[138,36],[140,40],[142,43],[140,44],[136,40],[132,34]]
    ]},
    // New Zealand
    { name: 'nz', parts: [
      [[170,-36],[174,-37],[176,-40],[173,-43],[170,-42],[168,-39]]
    ]},
    // British Isles - Ireland
    { name: 'ire', parts: [
      [[-10,55],[-7,55],[-6,52],[-9,52],[-10,54]]
    ]}
  ];

  // ----- Drawing -----
  function clear() { ctx.clearRect(0, 0, W, H); }

  function drawOcean() {
    // Outer aura
    const grad = ctx.createRadialGradient(cx - R*0.25, cy - R*0.3, R*0.1, cx, cy, R*1.4);
    grad.addColorStop(0, 'rgba(124, 227, 255, 0.18)');
    grad.addColorStop(0.55, 'rgba(15, 59, 82, 0.4)');
    grad.addColorStop(1, 'rgba(4, 16, 31, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, R*1.45, 0, Math.PI*2);
    ctx.fill();

    // Globe sphere with shading
    const oceanGrad = ctx.createRadialGradient(cx - R*0.32, cy - R*0.38, R*0.05, cx, cy, R);
    oceanGrad.addColorStop(0, '#0e2f49');
    oceanGrad.addColorStop(0.55, '#08233b');
    oceanGrad.addColorStop(1, '#04101f');
    ctx.fillStyle = oceanGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI*2);
    ctx.fill();

    // Subtle inner cyan glow ring
    ctx.strokeStyle = 'rgba(124, 227, 255, 0.18)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI*2);
    ctx.stroke();
  }

  function drawGraticule() {
    ctx.strokeStyle = 'rgba(124, 227, 255, 0.13)';
    ctx.lineWidth = 0.6;

    // Parallels (latitude lines every 20°)
    for (let lat = -60; lat <= 60; lat += 20) {
      ctx.beginPath();
      let started = false;
      for (let lon = -180; lon <= 180; lon += 4) {
        const p = project(lat, lon);
        if (p.z > 0) {
          if (!started) { ctx.moveTo(p.x, p.y); started = true; }
          else ctx.lineTo(p.x, p.y);
        } else {
          started = false;
        }
      }
      ctx.stroke();
    }

    // Meridians (longitude lines every 30°)
    for (let lon = -180; lon < 180; lon += 30) {
      ctx.beginPath();
      let started = false;
      for (let lat = -85; lat <= 85; lat += 4) {
        const p = project(lat, lon);
        if (p.z > 0) {
          if (!started) { ctx.moveTo(p.x, p.y); started = true; }
          else ctx.lineTo(p.x, p.y);
        } else {
          started = false;
        }
      }
      ctx.stroke();
    }

    // Equator stronger
    ctx.strokeStyle = 'rgba(124, 227, 255, 0.25)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    let started = false;
    for (let lon = -180; lon <= 180; lon += 4) {
      const p = project(0, lon);
      if (p.z > 0) {
        if (!started) { ctx.moveTo(p.x, p.y); started = true; }
        else ctx.lineTo(p.x, p.y);
      } else {
        started = false;
      }
    }
    ctx.stroke();
  }

  function drawContinents() {
    const data = window.__WORLD_LAND;
    if (!data) return;
    ctx.fillStyle = 'rgba(124, 227, 255, 0.16)';
    ctx.strokeStyle = 'rgba(124, 227, 255, 0.55)';
    ctx.lineWidth = 0.8;
    ctx.lineJoin = 'round';

    // data: array of polygons; each polygon: [outerRing, ...holes]; ring: [[lon,lat], ...]
    for (let pi = 0; pi < data.length; pi++) {
      const poly = data[pi];
      // Project all rings; skip polygon if no front-facing points in outer ring
      const projectedRings = poly.map(ring => ring.map(([lon, lat]) => project(lat, lon)));
      const outer = projectedRings[0];
      let anyFront = false;
      for (let i = 0; i < outer.length; i++) {
        if (outer[i].z > -0.05) { anyFront = true; break; }
      }
      if (!anyFront) continue;

      // Use even-odd to handle holes
      ctx.beginPath();
      for (let r = 0; r < projectedRings.length; r++) {
        const ring = projectedRings[r];
        let started = false;
        for (let i = 0; i < ring.length; i++) {
          const p = ring[i];
          if (p.z > -0.18) {
            if (!started) { ctx.moveTo(p.x, p.y); started = true; }
            else ctx.lineTo(p.x, p.y);
          } else if (started) {
            // break the path at the horizon
            started = false;
          }
        }
      }
      ctx.fill('evenodd');
      ctx.stroke();
    }
  }

  function drawArc(p1, p2) {
    // Great-circle-ish arc: interpolate along the surface of the sphere
    if (p1.z < 0 && p2.z < 0) return;
    const lat1 = p1._lat, lon1 = p1._lon;
    const lat2 = p2._lat, lon2 = p2._lon;
    const N = 30;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      // Linear interpolation in lat/lon (good enough at this scale)
      const lat = lat1 + (lat2 - lat1) * t;
      const lon = lon1 + (lon2 - lon1) * t;
      // Lift slightly above sphere for nicer visual arc (radius pulse)
      const rt = 1 + Math.sin(t * Math.PI) * 0.08;
      const p = project(lat, lon);
      // Scale x,y from center to simulate "height"
      pts.push({
        x: cx + (p.x - cx) * rt,
        y: cy + (p.y - cy) * rt,
        z: p.z
      });
    }
    // Draw if any segment is on the front
    ctx.strokeStyle = 'rgba(124, 227, 255, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < pts.length; i++) {
      if (pts[i].z > 0) {
        if (!started) { ctx.moveTo(pts[i].x, pts[i].y); started = true; }
        else ctx.lineTo(pts[i].x, pts[i].y);
      } else { started = false; }
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawConnections() {
    // Connect Paris hub to all other pins
    const hub = PINS[0];
    const hp = project(hub.lat, hub.lon);
    hp._lat = hub.lat; hp._lon = hub.lon;
    for (let i = 1; i < PINS.length; i++) {
      const p = PINS[i];
      const pp = project(p.lat, p.lon);
      pp._lat = p.lat; pp._lon = p.lon;
      drawArc(hp, pp);
    }
  }

  function updateLabels() {
    PINS.forEach(p => {
      const proj = project(p.lat, p.lon);
      const el = labelEls[p.id];
      const front = proj.z > 0.15;
      if (front) {
        el.classList.remove('hidden');
        // Position dot center. Card placement: left, right, above or below depending on screen pos
        const isLeft = proj.x < cx;
        const isTop = proj.y < cy;
        const offsetX = isLeft ? -1 : 1;
        const offsetY = isTop ? -1 : 1;
        el.style.left = proj.x + 'px';
        el.style.top = proj.y + 'px';
        el.dataset.placement = p.forcePlacement || ((isTop ? 'top' : 'bottom') + '-' + (isLeft ? 'left' : 'right'));
        // Fade based on z
        el.style.opacity = Math.min(1, (proj.z - 0.05) * 2.5);
      } else {
        el.classList.add('hidden');
        el.style.opacity = 0;
      }
    });
  }

  function frame(ts) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min(50, ts - lastTs);
    lastTs = ts;

    if (autoRotate && !dragging) {
      yaw += velYaw * dt;
    }
    // Easing pitch back to neutral
    pitch += (0.85 - pitch) * 0.02;

    clear();
    drawOcean();
    drawGraticule();
    drawContinents();
    drawConnections();
    updateLabels();

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ----- Interaction -----
  container.addEventListener('pointerdown', (e) => {
    dragging = true;
    container.setPointerCapture(e.pointerId);
    lastX = e.clientX; lastY = e.clientY;
    container.classList.add('grabbing');
  });
  container.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    yaw -= dx * 0.005;
    pitch = Math.max(-1.2, Math.min(1.2, pitch + dy * 0.005));
  });
  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    try { container.releasePointerCapture(e.pointerId); } catch(_) {}
    container.classList.remove('grabbing');
  }
  container.addEventListener('pointerup', endDrag);
  container.addEventListener('pointercancel', endDrag);
  container.addEventListener('pointerleave', endDrag);

  // Pause auto-rotate on hover
  container.addEventListener('mouseenter', () => { autoRotate = false; });
  container.addEventListener('mouseleave', () => { autoRotate = true; });
})();

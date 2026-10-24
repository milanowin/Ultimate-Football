import * as THREE from 'three';

export interface PitchData {
  rootGroup: THREE.Group;
  width: number; // 68m
  length: number; // 105m
  goalLeft: THREE.Group;
  goalRight: THREE.Group;
  goalNetLeft: THREE.Mesh;
  goalNetRight: THREE.Mesh;
}

// Procedural Mower-cut Grass with Official Football Pitch Markings
function createPitchTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Alternating lawn stripes (horizontal)
  const stripeCount = 18;
  const stripeH = 1024 / stripeCount;
  for (let i = 0; i < stripeCount; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#15803d' : '#166534';
    ctx.fillRect(0, i * stripeH, 1024, stripeH);
  }

  // Pitch boundary lines
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 6;

  const marginX = 40;
  const marginY = 40;
  const pitchW = 1024 - marginX * 2;
  const pitchH = 1024 - marginY * 2;
  const midX = 1024 / 2;
  const midY = 1024 / 2;

  // Outer Touchlines & Goal Lines
  ctx.strokeRect(marginX, marginY, pitchW, pitchH);

  // Halfway Line
  ctx.beginPath();
  ctx.moveTo(midX, marginY);
  ctx.lineTo(midX, marginY + pitchH);
  ctx.stroke();

  // Center Circle (Radius ~9.15m)
  ctx.beginPath();
  ctx.arc(midX, midY, 88, 0, Math.PI * 2);
  ctx.stroke();

  // Center Spot
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(midX, midY, 6, 0, Math.PI * 2);
  ctx.fill();

  // Left Penalty Box & Goal Area
  const boxH = 380;
  const boxW = 155;
  const boxY = midY - boxH / 2;
  ctx.strokeRect(marginX, boxY, boxW, boxH);

  // Left 6-yard box
  const smallH = 180;
  const smallW = 55;
  ctx.strokeRect(marginX, midY - smallH / 2, smallW, smallH);

  // Left Penalty Spot
  ctx.beginPath();
  ctx.arc(marginX + 105, midY, 5, 0, Math.PI * 2);
  ctx.fill();

  // Left Penalty Arc
  ctx.beginPath();
  ctx.arc(marginX + 105, midY, 88, -0.65, 0.65);
  ctx.stroke();

  // Right Penalty Box & Goal Area
  ctx.strokeRect(1024 - marginX - boxW, boxY, boxW, boxH);
  ctx.strokeRect(1024 - marginX - smallW, midY - smallH / 2, smallW, smallH);

  // Right Penalty Spot
  ctx.beginPath();
  ctx.arc(1024 - marginX - 105, midY, 5, 0, Math.PI * 2);
  ctx.fill();

  // Right Penalty Arc
  ctx.beginPath();
  ctx.arc(1024 - marginX - 105, midY, 88, Math.PI - 0.65, Math.PI + 0.65);
  ctx.stroke();

  // Corner Arcs
  const cRadius = 24;
  // Top-left
  ctx.beginPath(); ctx.arc(marginX, marginY, cRadius, 0, Math.PI / 2); ctx.stroke();
  // Bottom-left
  ctx.beginPath(); ctx.arc(marginX, 1024 - marginY, cRadius, -Math.PI / 2, 0); ctx.stroke();
  // Top-right
  ctx.beginPath(); ctx.arc(1024 - marginX, marginY, cRadius, Math.PI / 2, Math.PI); ctx.stroke();
  // Bottom-right
  ctx.beginPath(); ctx.arc(1024 - marginX, 1024 - marginY, cRadius, Math.PI, Math.PI * 1.5); ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural Soccer Ball Texture (32-panel black pentagons on white leather)
function createBallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 512, 256);

  // Black hexagonal / pentagonal patches
  ctx.fillStyle = '#0f172a';
  for (let x = 32; x < 512; x += 80) {
    for (let y = 32; y < 256; y += 80) {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const px = x + Math.cos(angle) * 22;
        const py = y + Math.sin(angle) * 22;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const ballTexture = createBallTexture();

export function buildPitchAndStadium(): PitchData {
  const root = new THREE.Group();
  root.name = 'pitch_and_stadium';

  const pitchLength = 105;
  const pitchWidth = 68;

  // 1. Pitch Ground Mesh
  const pitchGeo = new THREE.PlaneGeometry(pitchLength, pitchWidth);
  pitchGeo.rotateX(-Math.PI / 2);
  const pitchMat = new THREE.MeshStandardMaterial({
    map: createPitchTexture(),
    roughness: 0.8,
    metalness: 0.05,
  });
  const pitchMesh = new THREE.Mesh(pitchGeo, pitchMat);
  pitchMesh.receiveShadow = true;
  root.add(pitchMesh);

  // Surrounding Turf Border
  const turfGeo = new THREE.PlaneGeometry(pitchLength + 24, pitchWidth + 24);
  turfGeo.rotateX(-Math.PI / 2);
  const turfMat = new THREE.MeshStandardMaterial({
    color: 0x14532d,
    roughness: 0.9,
    metalness: 0.05,
  });
  const turfMesh = new THREE.Mesh(turfGeo, turfMat);
  turfMesh.position.y = -0.02;
  turfMesh.receiveShadow = true;
  root.add(turfMesh);

  // 2. Goal Posts & Hexagonal Nets
  const goalWidth = 7.32;
  const goalHeight = 2.44;
  const goalDepth = 2.2;

  function buildGoal(isLeft: boolean): { goalGroup: THREE.Group; netMesh: THREE.Mesh } {
    const group = new THREE.Group();
    const postMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.8,
    });

    const postRad = 0.07;
    // Left & Right upright posts
    const postLeft = new THREE.Mesh(new THREE.CylinderGeometry(postRad, postRad, goalHeight, 16), postMat);
    postLeft.position.set(0, goalHeight / 2, -goalWidth / 2);
    postLeft.castShadow = true;

    const postRight = new THREE.Mesh(new THREE.CylinderGeometry(postRad, postRad, goalHeight, 16), postMat);
    postRight.position.set(0, goalHeight / 2, goalWidth / 2);
    postRight.castShadow = true;

    // Crossbar
    const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(postRad, postRad, goalWidth, 16), postMat);
    crossbar.rotation.x = Math.PI / 2;
    crossbar.position.set(0, goalHeight, 0);
    crossbar.castShadow = true;

    group.add(postLeft, postRight, crossbar);

    // Goal Net
    const netGeo = new THREE.BoxGeometry(goalDepth, goalHeight, goalWidth);
    const netMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.9,
      transparent: true,
      opacity: 0.45,
      wireframe: true,
    });
    const netMesh = new THREE.Mesh(netGeo, netMat);
    const netDir = isLeft ? -goalDepth / 2 : goalDepth / 2;
    netMesh.position.set(netDir, goalHeight / 2, 0);
    group.add(netMesh);

    const xPos = isLeft ? -pitchLength / 2 : pitchLength / 2;
    group.position.set(xPos, 0, 0);
    if (!isLeft) group.rotation.y = Math.PI;

    return { goalGroup: group, netMesh };
  }

  const leftGoal = buildGoal(true);
  const rightGoal = buildGoal(false);
  root.add(leftGoal.goalGroup);
  root.add(rightGoal.goalGroup);

  // 3. LED Advertising Boards along Touchlines
  const adBoardMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
  const boardLength = pitchLength + 4;
  const boardH = 0.95;

  const topAd = new THREE.Mesh(new THREE.BoxGeometry(boardLength, boardH, 0.2), adBoardMat);
  topAd.position.set(0, boardH / 2, -pitchWidth / 2 - 2.5);
  root.add(topAd);

  const botAd = new THREE.Mesh(new THREE.BoxGeometry(boardLength, boardH, 0.2), adBoardMat);
  botAd.position.set(0, boardH / 2, pitchWidth / 2 + 2.5);
  root.add(botAd);

  // 4. Stadium Grandstands (North, South, East, West)
  const standMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7, metalness: 0.3 });
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.6 });

  function buildStand(w: number, d: number, h: number, x: number, z: number, rotY: number) {
    const stand = new THREE.Group();
    // Sloped Tier
    const tier = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), standMat);
    tier.position.y = h / 2;
    stand.add(tier);

    // Colored Seats Tier
    const seats = new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, h * 0.4, d * 0.8), seatMat);
    seats.position.y = h * 0.6;
    stand.add(seats);

    stand.position.set(x, 0, z);
    stand.rotation.y = rotY;
    root.add(stand);
  }

  const standDistZ = pitchWidth / 2 + 18;
  const standDistX = pitchLength / 2 + 18;

  // East & West Main Grandstands
  buildStand(pitchLength + 10, 24, 18, 0, -standDistZ, 0);
  buildStand(pitchLength + 10, 24, 18, 0, standDistZ, 0);

  // North & South Goal End Stands
  buildStand(pitchWidth + 10, 24, 16, -standDistX, 0, Math.PI / 2);
  buildStand(pitchWidth + 10, 24, 16, standDistX, 0, -Math.PI / 2);

  // 5. Four Corner Floodlight Towers
  const towerMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 });
  const lightHeadMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  const cornerX = pitchLength / 2 + 12;
  const cornerZ = pitchWidth / 2 + 12;
  const towerHeight = 35;

  [
    [-cornerX, -cornerZ],
    [cornerX, -cornerZ],
    [-cornerX, cornerZ],
    [cornerX, cornerZ],
  ].forEach(([tx, tz]) => {
    const tower = new THREE.Group();
    const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.9, towerHeight, 8), towerMat);
    pylon.position.y = towerHeight / 2;
    tower.add(pylon);

    // Light array panel
    const panel = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 1), lightHeadMat);
    panel.position.set(0, towerHeight, 0);
    panel.lookAt(0, 0, 0);
    tower.add(panel);

    tower.position.set(tx, 0, tz);
    root.add(tower);
  });

  return {
    rootGroup: root,
    width: pitchWidth,
    length: pitchLength,
    goalLeft: leftGoal.goalGroup,
    goalRight: rightGoal.goalGroup,
    goalNetLeft: leftGoal.netMesh,
    goalNetRight: rightGoal.netMesh,
  };
}

export interface Ball3DInstance {
  mesh: THREE.Mesh;
  shadowMesh: THREE.Mesh;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  radius: number;
  update: (dt: number) => void;
  reset: (pos: THREE.Vector3) => void;
}

export function createFootball(): Ball3DInstance {
  const radius = 0.22; // Regulation soccer ball radius in meters
  const ballGeo = new THREE.SphereGeometry(radius, 24, 24);
  const ballMat = new THREE.MeshStandardMaterial({
    map: ballTexture,
    roughness: 0.25,
    metalness: 0.1,
  });

  const mesh = new THREE.Mesh(ballGeo, ballMat);
  mesh.castShadow = true;
  mesh.position.set(0, radius, 0);

  // Dynamic Contact Shadow
  const shadowGeo = new THREE.PlaneGeometry(radius * 2.8, radius * 2.8);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 64;
  shadowCanvas.height = 64;
  const sCtx = shadowCanvas.getContext('2d')!;
  const grad = sCtx.createRadialGradient(32, 32, 4, 32, 32, 30);
  grad.addColorStop(0, 'rgba(0,0,0,0.65)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  sCtx.fillStyle = grad;
  sCtx.fillRect(0, 0, 64, 64);

  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.position.y = 0.02;

  const position = new THREE.Vector3(0, radius, 0);
  const velocity = new THREE.Vector3(0, 0, 0);

  const update = (dt: number) => {
    const delta = Math.min(dt, 0.1);

    // Gravity
    velocity.y -= 9.8 * delta;

    // Apply velocity
    position.addScaledVector(velocity, delta);

    // Ground bounce & rolling friction
    if (position.y <= radius) {
      position.y = radius;
      if (Math.abs(velocity.y) > 0.6) {
        velocity.y = -velocity.y * 0.58; // Elastic turf bounce
      } else {
        velocity.y = 0;
      }
      // Rolling grass friction
      velocity.x *= Math.pow(0.85, delta * 10);
      velocity.z *= Math.pow(0.85, delta * 10);
    } else {
      // Air drag
      velocity.x *= Math.pow(0.98, delta * 10);
      velocity.z *= Math.pow(0.98, delta * 10);
    }

    // Ball rolling rotation based on horizontal travel
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
    if (speed > 0.05) {
      const travelDist = speed * delta;
      const angle = travelDist / radius;
      // Rotation axis is perpendicular to travel direction
      const rotAxis = new THREE.Vector3(velocity.z, 0, -velocity.x).normalize();
      mesh.rotateOnWorldAxis(rotAxis, angle);
    }

    mesh.position.copy(position);
    shadowMesh.position.x = position.x;
    shadowMesh.position.z = position.z;
    // Scale shadow when ball is airborne
    const heightFactor = Math.max(0.2, 1.0 - (position.y - radius) * 0.18);
    shadowMesh.scale.set(heightFactor, heightFactor, 1);
  };

  const reset = (pos: THREE.Vector3) => {
    position.copy(pos);
    position.y = radius;
    velocity.set(0, 0, 0);
    mesh.position.copy(position);
    shadowMesh.position.set(pos.x, 0.02, pos.z);
  };

  return {
    mesh,
    shadowMesh,
    position,
    velocity,
    radius,
    update,
    reset,
  };
}

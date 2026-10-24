import * as THREE from 'three';
import { Player, Club } from './footballData';

export interface Player3DInstance {
  rootGroup: THREE.Group;
  player: Player;
  club: Club;
  isGoalkeeper: boolean;
  indicatorRing: THREE.Mesh;
  updateAnimation: (dt: number, speed: number, action?: 'run' | 'kick' | 'slide' | 'dive' | 'idle') => void;
  setHighlighted: (highlighted: boolean) => void;
}

const SKIN_TONES = ['#fbcfe8', '#fcd34d', '#b45309', '#78350f', '#451a03'];

export function createPlayerModel(
  player: Player,
  club: Club,
  isGoalkeeper: boolean = false
): Player3DInstance {
  const root = new THREE.Group();
  root.name = `player_${player.id}`;

  const scale = player.heightCm / 180; // Height scaling

  // Jersey & Shorts Colors
  const jerseyColor = isGoalkeeper ? 0x10b981 : new THREE.Color(club.primaryColor);
  const shortsColor = isGoalkeeper ? 0x064e3b : new THREE.Color(club.secondaryColor);
  const sockColor = new THREE.Color(club.sockColor);
  const skinColor = new THREE.Color(SKIN_TONES[player.skinTone] || '#fcd34d');

  // Materials
  const jerseyMat = new THREE.MeshStandardMaterial({ color: jerseyColor, roughness: 0.6 });
  const shortsMat = new THREE.MeshStandardMaterial({ color: shortsColor, roughness: 0.7 });
  const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.5 });
  const sockMat = new THREE.MeshStandardMaterial({ color: sockColor, roughness: 0.6 });
  const bootMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(player.bootColor), roughness: 0.3, metalness: 0.4 });
  const hairMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(player.hairColor), roughness: 0.9 });

  // Main Hips Root
  const hips = new THREE.Group();
  hips.position.y = 0.95 * scale;
  root.add(hips);

  // Pelvis / Shorts
  const pelvisGeo = new THREE.BoxGeometry(0.38 * scale, 0.28 * scale, 0.24 * scale);
  const pelvis = new THREE.Mesh(pelvisGeo, shortsMat);
  pelvis.castShadow = true;
  hips.add(pelvis);

  // Torso / Jersey
  const torsoGeo = new THREE.BoxGeometry(0.42 * scale, 0.52 * scale, 0.26 * scale);
  const torso = new THREE.Mesh(torsoGeo, jerseyMat);
  torso.position.y = 0.38 * scale;
  torso.castShadow = true;
  hips.add(torso);

  // Neck & Head
  const neckGeo = new THREE.CylinderGeometry(0.08 * scale, 0.09 * scale, 0.12 * scale, 8);
  const neck = new THREE.Mesh(neckGeo, skinMat);
  neck.position.y = 0.68 * scale;
  hips.add(neck);

  const headGeo = new THREE.SphereGeometry(0.14 * scale, 16, 16);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.y = 0.84 * scale;
  head.castShadow = true;
  hips.add(head);

  // Hair
  const hairGeo = new THREE.SphereGeometry(0.145 * scale, 12, 12);
  const hair = new THREE.Mesh(hairGeo, hairMat);
  hair.position.set(0, 0.88 * scale, -0.02 * scale);
  hair.scale.set(1.02, 0.75, 1.05);
  hips.add(hair);

  // Left & Right Arms (Shoulder joint -> Arm)
  const armRadius = 0.065 * scale;
  const armLen = 0.44 * scale;

  function buildArm(isLeft: boolean): { shoulder: THREE.Group; armMesh: THREE.Mesh } {
    const shoulder = new THREE.Group();
    const sign = isLeft ? -1 : 1;
    shoulder.position.set(sign * 0.26 * scale, 0.56 * scale, 0);

    const sleeveGeo = new THREE.CylinderGeometry(armRadius * 1.05, armRadius * 1.05, armLen * 0.45, 8);
    const sleeve = new THREE.Mesh(sleeveGeo, jerseyMat);
    sleeve.position.y = -armLen * 0.22;
    shoulder.add(sleeve);

    const armGeo = new THREE.CylinderGeometry(armRadius * 0.9, armRadius * 0.8, armLen * 0.55, 8);
    const arm = new THREE.Mesh(armGeo, skinMat);
    arm.position.y = -armLen * 0.65;
    shoulder.add(arm);

    // Hand
    const handGeo = new THREE.SphereGeometry(armRadius * 0.95, 8, 8);
    const hand = new THREE.Mesh(handGeo, isGoalkeeper ? bootMat : skinMat);
    hand.position.y = -armLen * 0.95;
    shoulder.add(hand);

    hips.add(shoulder);
    return { shoulder, armMesh: sleeve };
  }

  const leftArm = buildArm(true);
  const rightArm = buildArm(false);

  // Left & Right Legs (Hip Joint -> Thigh -> Knee -> Shin/Sock -> Boot)
  const legRadius = 0.08 * scale;
  const legLen = 0.48 * scale;

  function buildLeg(isLeft: boolean): { hipJoint: THREE.Group; kneeJoint: THREE.Group } {
    const hipJoint = new THREE.Group();
    const sign = isLeft ? -1 : 1;
    hipJoint.position.set(sign * 0.12 * scale, -0.12 * scale, 0);

    // Thigh (Shorts)
    const thighGeo = new THREE.CylinderGeometry(legRadius * 1.05, legRadius * 0.95, legLen * 0.5, 8);
    const thigh = new THREE.Mesh(thighGeo, shortsMat);
    thigh.position.y = -legLen * 0.25;
    thigh.castShadow = true;
    hipJoint.add(thigh);

    // Knee Joint
    const kneeJoint = new THREE.Group();
    kneeJoint.position.set(0, -legLen * 0.5, 0);

    // Shin & Sock
    const shinGeo = new THREE.CylinderGeometry(legRadius * 0.9, legRadius * 0.8, legLen * 0.5, 8);
    const shin = new THREE.Mesh(shinGeo, sockMat);
    shin.position.y = -legLen * 0.25;
    shin.castShadow = true;
    kneeJoint.add(shin);

    // Football Boot
    const bootGeo = new THREE.BoxGeometry(0.11 * scale, 0.08 * scale, 0.24 * scale);
    const boot = new THREE.Mesh(bootGeo, bootMat);
    boot.position.set(0, -legLen * 0.48, 0.05 * scale);
    boot.castShadow = true;
    kneeJoint.add(boot);

    hipJoint.add(kneeJoint);
    hips.add(hipJoint);
    return { hipJoint, kneeJoint };
  }

  const leftLeg = buildLeg(true);
  const rightLeg = buildLeg(false);

  // Active Player Glowing Indicator Ring (Ground)
  const ringGeo = new THREE.RingGeometry(0.55 * scale, 0.7 * scale, 32);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const indicatorRing = new THREE.Mesh(ringGeo, ringMat);
  indicatorRing.position.y = 0.04;
  indicatorRing.visible = false;
  root.add(indicatorRing);

  // Procedural Run Animation Cycle
  let runTime = Math.random() * Math.PI * 2;
  let kickAnimProgress = 0;
  let isKicking = false;

  const updateAnimation = (
    dt: number,
    speed: number,
    action: 'run' | 'kick' | 'slide' | 'dive' | 'idle' = 'run'
  ) => {
    const delta = Math.min(dt, 0.1);

    if (action === 'kick') {
      isKicking = true;
      kickAnimProgress += delta * 9;
      if (kickAnimProgress > Math.PI) {
        kickAnimProgress = 0;
        isKicking = false;
      }
      // Right leg kick swing
      rightLeg.hipJoint.rotation.x = -Math.sin(kickAnimProgress) * 1.2;
      rightLeg.kneeJoint.rotation.x = Math.max(0, Math.sin(kickAnimProgress) * 0.8);
      leftLeg.hipJoint.rotation.x = 0.2;
      return;
    }

    if (action === 'slide') {
      // Sliding tackle pose
      hips.position.y = 0.3 * scale;
      hips.rotation.x = 0.8;
      rightLeg.hipJoint.rotation.x = -1.4;
      leftLeg.hipJoint.rotation.x = 0.5;
      return;
    }

    if (action === 'dive') {
      // Goalkeeper horizontal dive
      hips.position.y = 0.4 * scale;
      hips.rotation.z = -1.2;
      leftArm.shoulder.rotation.z = 2.4;
      rightArm.shoulder.rotation.z = 2.4;
      return;
    }

    // Default Running & Idle
    hips.position.y = 0.95 * scale;
    hips.rotation.set(0, 0, 0);

    if (speed > 0.4) {
      // Running cadence based on speed
      const freq = speed * 4.5;
      runTime += freq * delta;

      const swingAngle = Math.sin(runTime) * 0.75;

      // Legs swing opposite
      leftLeg.hipJoint.rotation.x = swingAngle;
      rightLeg.hipJoint.rotation.x = -swingAngle;

      // Knees bend on back-swing
      leftLeg.kneeJoint.rotation.x = swingAngle > 0 ? 0 : -swingAngle * 0.9;
      rightLeg.kneeJoint.rotation.x = swingAngle < 0 ? 0 : swingAngle * 0.9;

      // Arms swing opposite to legs
      leftArm.shoulder.rotation.x = -swingAngle * 0.8;
      rightArm.shoulder.rotation.x = swingAngle * 0.8;

      // Torso slight forward lean
      torso.rotation.x = 0.15;
    } else {
      // Idle breathing
      runTime += delta * 2;
      const breath = Math.sin(runTime) * 0.04;
      torso.position.y = 0.38 * scale + breath;
      leftLeg.hipJoint.rotation.set(0, 0, 0);
      rightLeg.hipJoint.rotation.set(0, 0, 0);
      leftLeg.kneeJoint.rotation.set(0, 0, 0);
      rightLeg.kneeJoint.rotation.set(0, 0, 0);
      leftArm.shoulder.rotation.x = THREE.MathUtils.damp(leftArm.shoulder.rotation.x, 0, 8, delta);
      rightArm.shoulder.rotation.x = THREE.MathUtils.damp(rightArm.shoulder.rotation.x, 0, 8, delta);
    }
  };

  const setHighlighted = (highlighted: boolean) => {
    indicatorRing.visible = highlighted;
  };

  return {
    rootGroup: root,
    player,
    club,
    isGoalkeeper,
    indicatorRing,
    updateAnimation,
    setHighlighted,
  };
}

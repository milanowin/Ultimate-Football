/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Club, CLUBS, Player, ALL_PLAYERS } from './game/footballData';
import { buildPitchAndStadium, PitchData } from './game/pitchAndStadium';
import { MatchEngine, MatchInput } from './game/matchEngine';
import { DEFAULT_CAREER_PLAYER, CustomPlayerProfile } from './game/playerCareer';
import { footballAudio } from './game/footballAudio';
import { MatchHUD } from './components/MatchHUD';
import { FootballHub } from './components/FootballHub';
import { PenaltyModal } from './components/PenaltyModal';

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Profile Persistence
  const [coins, setCoins] = useState<number>(35000);
  const [ultimateSquad, setUltimateSquad] = useState<Player[]>([
    ALL_PLAYERS[0], // Mbappé
    ALL_PLAYERS[1], // Haaland
    ALL_PLAYERS[3], // Bellingham
    ALL_PLAYERS[5], // Yamal
    ALL_PLAYERS[8], // Van Dijk
    ALL_PLAYERS[14], // Courtois
  ]);
  const [careerProfile, setCareerProfile] = useState<CustomPlayerProfile>(DEFAULT_CAREER_PLAYER);

  // Navigation State: 'hub' | 'match'
  const [gameState, setGameState] = useState<'hub' | 'match'>('hub');
  const [showPenaltyModal, setShowPenaltyModal] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Active Match Entities
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const pitchDataRef = useRef<PitchData | null>(null);
  const matchEngineRef = useRef<MatchEngine | null>(null);

  // Input states
  const matchInputRef = useRef<MatchInput>({
    moveX: 0,
    moveZ: 0,
    sprint: false,
    pass: false,
    throughBall: false,
    shootPower: 0,
    tackle: false,
    switchPlayer: false,
  });

  const isChargingShotRef = useRef<boolean>(false);
  const shotChargeTimerRef = useRef<number>(0);
  const [currentShootCharge, setCurrentShootCharge] = useState<number>(0);

  // Match HUD state variables updated per frame
  const [hudState, setHudState] = useState({
    homeScore: 0,
    awayScore: 0,
    matchTimeMinutes: 0,
    halfRealElapsedSeconds: 0,
    halfDurationRealMinutes: 5,
    currentHalf: 1 as 1 | 2,
    isHalfTimeBreak: false,
    isGoalScored: false,
    lastScorer: null as string | null,
    isFullTime: false,
    homeShots: 0,
    awayShots: 0,
    homePossessionSeconds: 0,
    awayPossessionSeconds: 0,
    ballPos: { x: 0, z: 0 },
  });

  // Current match clubs
  const currentHomeClubRef = useRef<Club>(CLUBS['real-madrid']);
  const currentAwayClubRef = useRef<Club>(CLUBS['barcelona']);

  // Initialize Three.js WebGL Scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Detect Software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a1128); // Stadium night sky
    scene.fog = new THREE.FogExp2(0x0a1128, 0.0035);

    // 2. Camera (Broadcast TV Angle)
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 32, 45);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Procedural Reflection Environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Stadium Lighting
    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x14532d, 1.2);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.4);
    dirLight.position.set(40, 90, 50);
    dirLight.castShadow = !isSoftwareGl;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 250;
    dirLight.shadow.camera.left = -60;
    dirLight.shadow.camera.right = 60;
    dirLight.shadow.camera.top = 45;
    dirLight.shadow.camera.bottom = -45;
    scene.add(dirLight);

    // Build Initial Pitch & Stadium
    const pitchData = buildPitchAndStadium();
    pitchDataRef.current = pitchData;
    scene.add(pitchData.rootGroup);

    // Window Resize Handler
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth || window.innerWidth;
      const h = mountRef.current.clientHeight || window.innerHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Keyboard Listeners
    const onKeyDown = (e: KeyboardEvent) => {
      footballAudio.init();
      footballAudio.resume();

      if (e.code === 'KeyW' || e.code === 'ArrowUp') matchInputRef.current.moveZ = -1;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') matchInputRef.current.moveZ = 1;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') matchInputRef.current.moveX = -1;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') matchInputRef.current.moveX = 1;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') matchInputRef.current.sprint = true;

      // Pass (K)
      if (e.code === 'KeyK') matchInputRef.current.pass = true;
      // Through Ball (L)
      if (e.code === 'KeyL') matchInputRef.current.throughBall = true;
      // Switch / Tackle (E)
      if (e.code === 'KeyE') {
        matchInputRef.current.switchPlayer = true;
        matchInputRef.current.tackle = true;
      }

      // Shoot Charge (J or Space)
      if ((e.code === 'KeyJ' || e.code === 'Space') && !isChargingShotRef.current) {
        e.preventDefault();
        isChargingShotRef.current = true;
        shotChargeTimerRef.current = 0;
      }

      if (e.code === 'Escape' || e.code === 'KeyP') {
        setIsPaused((prev) => !prev);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if ((e.code === 'KeyW' || e.code === 'ArrowUp') && matchInputRef.current.moveZ === -1) matchInputRef.current.moveZ = 0;
      if ((e.code === 'KeyS' || e.code === 'ArrowDown') && matchInputRef.current.moveZ === 1) matchInputRef.current.moveZ = 0;
      if ((e.code === 'KeyA' || e.code === 'ArrowLeft') && matchInputRef.current.moveX === -1) matchInputRef.current.moveX = 0;
      if ((e.code === 'KeyD' || e.code === 'ArrowRight') && matchInputRef.current.moveX === 1) matchInputRef.current.moveX = 0;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') matchInputRef.current.sprint = false;

      if (e.code === 'KeyK') matchInputRef.current.pass = false;
      if (e.code === 'KeyL') matchInputRef.current.throughBall = false;
      if (e.code === 'KeyE') {
        matchInputRef.current.switchPlayer = false;
        matchInputRef.current.tackle = false;
      }

      // Shoot Release
      if (e.code === 'KeyJ' || e.code === 'Space') {
        if (isChargingShotRef.current) {
          isChargingShotRef.current = false;
          matchInputRef.current.shootPower = Math.min(1.0, Math.max(0.3, shotChargeTimerRef.current * 1.5));
          setCurrentShootCharge(0);
          // Auto clear next frame
          setTimeout(() => { matchInputRef.current.shootPower = 0; }, 80);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Main Render Loop
    let lastTime = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Handle shot charge timer
      if (isChargingShotRef.current) {
        shotChargeTimerRef.current += dt;
        setCurrentShootCharge(Math.min(1.0, shotChargeTimerRef.current * 1.5));
      }

      if (gameState === 'match' && matchEngineRef.current && !isPaused) {
        matchEngineRef.current.update(dt, matchInputRef.current);

        // Clear one-shot button taps
        matchInputRef.current.pass = false;
        matchInputRef.current.throughBall = false;
        matchInputRef.current.switchPlayer = false;
        matchInputRef.current.tackle = false;

        // Smooth Broadcast Camera follows the action (tracks ball X/Z with slight height damp)
        const ball = matchEngineRef.current.ball;
        const targetCamX = THREE.MathUtils.clamp(ball.position.x * 0.7, -25, 25);
        const targetCamZ = THREE.MathUtils.clamp(ball.position.z * 0.4 + 38, 28, 48);

        camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 4, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamZ, 4, dt);
        camera.lookAt(targetCamX, 1.2, ball.position.z * 0.3);

        // Update HUD telemetry
        const engine = matchEngineRef.current;
        setHudState({
          homeScore: engine.homeScore,
          awayScore: engine.awayScore,
          matchTimeMinutes: engine.matchTimeMinutes,
          halfRealElapsedSeconds: engine.halfRealElapsedSeconds,
          halfDurationRealMinutes: engine.halfDurationRealMinutes,
          currentHalf: engine.currentHalf,
          isHalfTimeBreak: engine.isHalfTimeBreak,
          isGoalScored: engine.isGoalScored,
          lastScorer: engine.lastScorer,
          isFullTime: engine.isFullTime,
          homeShots: engine.homeShots,
          awayShots: engine.awayShots,
          homePossessionSeconds: engine.homePossessionSeconds,
          awayPossessionSeconds: engine.awayPossessionSeconds,
          ballPos: { x: ball.position.x, z: ball.position.z },
        });
      } else if (gameState === 'hub') {
        // Slow cinematic camera panning across the stadium
        const rotTime = now * 0.0002;
        camera.position.x = Math.sin(rotTime) * 35;
        camera.position.z = Math.cos(rotTime) * 35 + 20;
        camera.position.y = 22;
        camera.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [gameState, isPaused]);

  // Start 3D Football Match
  const handleStartMatch = (home: Club, away: Club, customSquad?: Player[]) => {
    footballAudio.init();
    footballAudio.resume();

    const scene = sceneRef.current;
    const pitch = pitchDataRef.current;
    if (!scene || !pitch) return;

    if (matchEngineRef.current) {
      matchEngineRef.current.dispose();
      matchEngineRef.current = null;
    }

    currentHomeClubRef.current = home;
    currentAwayClubRef.current = away;

    const engine = new MatchEngine(scene, pitch, home, away, customSquad);
    matchEngineRef.current = engine;

    setIsPaused(false);
    setGameState('match');
  };

  const handleExitMatch = () => {
    if (matchEngineRef.current) {
      // Award match coins
      setCoins((prev) => prev + 1500);
      matchEngineRef.current.dispose();
      matchEngineRef.current = null;
    }
    setGameState('hub');
    setIsPaused(false);
  };

  const handleRestartMatch = () => {
    if (matchEngineRef.current) {
      handleStartMatch(currentHomeClubRef.current, currentAwayClubRef.current);
    }
  };

  const engine = matchEngineRef.current;
  const activeUserPlayer = engine?.homeSquad[engine.activePlayerIndex] || ALL_PLAYERS[0];
  const activeUserPlayerState = engine?.homePlayers[engine.activePlayerIndex];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Main Football Hub (Kick-Off, Ultimate Team, Career, Transfers) */}
      {gameState === 'hub' && (
        <FootballHub
          coins={coins}
          onUpdateCoins={setCoins}
          ultimateSquad={ultimateSquad}
          onUpdateSquad={setUltimateSquad}
          careerProfile={careerProfile}
          onUpdateCareerProfile={setCareerProfile}
          onStartMatch={handleStartMatch}
          onStartPenaltyShootout={() => setShowPenaltyModal(true)}
        />
      )}

      {/* Penalty Shootout Modal */}
      {showPenaltyModal && (
        <PenaltyModal
          onClose={() => setShowPenaltyModal(false)}
          onWinPrize={(prize) => setCoins((prev) => prev + prize)}
        />
      )}

      {/* Active 3D Match HUD & Broadcast Overlay */}
      {gameState === 'match' && engine && pitchDataRef.current && (
        <MatchHUD
          homeClub={currentHomeClubRef.current}
          awayClub={currentAwayClubRef.current}
          homeScore={hudState.homeScore}
          awayScore={hudState.awayScore}
          matchTimeMinutes={hudState.matchTimeMinutes}
          halfRealElapsedSeconds={hudState.halfRealElapsedSeconds}
          halfDurationRealMinutes={hudState.halfDurationRealMinutes}
          currentHalf={hudState.currentHalf}
          isHalfTimeBreak={hudState.isHalfTimeBreak}
          isGoalScored={hudState.isGoalScored}
          lastScorer={hudState.lastScorer}
          activePlayer={activeUserPlayer}
          activePlayerState={activeUserPlayerState!}
          homePlayers={engine.homePlayers}
          awayPlayers={engine.awayPlayers}
          ballPos={hudState.ballPos}
          pitchLength={pitchDataRef.current.length}
          pitchWidth={pitchDataRef.current.width}
          isPaused={isPaused}
          isFullTime={hudState.isFullTime}
          shootCharge={currentShootCharge}
          homeShots={hudState.homeShots}
          awayShots={hudState.awayShots}
          homePossessionSeconds={hudState.homePossessionSeconds}
          awayPossessionSeconds={hudState.awayPossessionSeconds}
          onPauseToggle={() => setIsPaused((prev) => !prev)}
          onRestart={handleRestartMatch}
          onExit={handleExitMatch}
          onStartSecondHalf={() => {
            matchEngineRef.current?.startSecondHalf();
          }}
          onTouchMove={(x, z) => {
            matchInputRef.current.moveX = x;
            matchInputRef.current.moveZ = z;
          }}
          onTouchPass={() => {
            matchInputRef.current.pass = true;
          }}
          onTouchThrough={() => {
            matchInputRef.current.throughBall = true;
          }}
          onTouchShootStart={() => {
            isChargingShotRef.current = true;
            shotChargeTimerRef.current = 0;
          }}
          onTouchShootEnd={() => {
            if (isChargingShotRef.current) {
              isChargingShotRef.current = false;
              matchInputRef.current.shootPower = Math.min(1.0, Math.max(0.35, shotChargeTimerRef.current * 1.5));
              setCurrentShootCharge(0);
              setTimeout(() => { matchInputRef.current.shootPower = 0; }, 80);
            }
          }}
          onTouchSprint={(active) => {
            matchInputRef.current.sprint = active;
          }}
          onTouchTackle={() => {
            matchInputRef.current.tackle = true;
          }}
          onTouchSwitch={() => {
            matchInputRef.current.switchPlayer = true;
          }}
        />
      )}
    </div>
  );
}

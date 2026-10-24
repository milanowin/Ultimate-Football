import * as THREE from 'three';
import { Club, Player, getClubSquad } from './footballData';
import { PitchData, Ball3DInstance, createFootball } from './pitchAndStadium';
import { Player3DInstance, createPlayerModel } from './playerModel';
import { footballAudio } from './footballAudio';

export interface MatchInput {
  moveX: number; // -1 to 1
  moveZ: number; // -1 to 1
  sprint: boolean;
  pass: boolean;
  throughBall: boolean;
  shootPower: number; // 0 to 1
  tackle: boolean;
  switchPlayer: boolean;
}

export interface MatchPlayerState {
  model3D: Player3DInstance;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  homePosition: THREE.Vector3; // Base formation position
  role: 'GK' | 'DEF' | 'MID' | 'ATT';
  isHomeTeam: boolean;
  hasBall: boolean;
  stamina: number; // 0 - 100
  kickCooldown: number;
}

export class MatchEngine {
  public scene: THREE.Scene;
  public pitch: PitchData;
  public ball: Ball3DInstance;

  public homeClub: Club;
  public awayClub: Club;
  public homeSquad: Player[];
  public awaySquad: Player[];

  public homePlayers: MatchPlayerState[] = [];
  public awayPlayers: MatchPlayerState[] = [];

  public activePlayerIndex: number = 0; // Controlled by user
  public homeScore: number = 0;
  public awayScore: number = 0;
  public matchTimeMinutes: number = 0; // 0 to 90 in-game minutes
  public halfDurationRealMinutes: number = 5; // 5 real minutes per half = 45 in-game minutes
  public halfRealElapsedSeconds: number = 0; // 0 to 300 real seconds per half
  public currentHalf: 1 | 2 = 1;
  public isHalfTimeBreak: boolean = false;
  public isGoalScored: boolean = false;
  public goalCelebrationTimer: number = 0;
  public lastScorer: string | null = null;
  public isHalfTime: boolean = false;
  public isFullTime: boolean = false;

  // Match stats
  public homeShots: number = 0;
  public awayShots: number = 0;
  public homePossessionSeconds: number = 0;
  public awayPossessionSeconds: number = 0;

  private goalWidth = 7.32;
  private goalHeight = 2.44;

  constructor(
    scene: THREE.Scene,
    pitch: PitchData,
    homeClub: Club,
    awayClub: Club,
    customHomeSquad?: Player[]
  ) {
    this.scene = scene;
    this.pitch = pitch;
    this.homeClub = homeClub;
    this.awayClub = awayClub;

    this.homeSquad = customHomeSquad || getClubSquad(homeClub.id);
    this.awaySquad = getClubSquad(awayClub.id);

    // Initialize 3D Soccer Ball
    this.ball = createFootball();
    this.scene.add(this.ball.mesh);
    this.scene.add(this.ball.shadowMesh);

    this.spawnTeams();
    this.resetToKickoff(true);
  }

  private spawnTeams() {
    // 6 vs 6 format: GK, 2 DEF, 2 MID, 1 ATT
    const roles: ('GK' | 'DEF' | 'DEF' | 'MID' | 'MID' | 'ATT')[] = ['GK', 'DEF', 'DEF', 'MID', 'MID', 'ATT'];

    // Home Team (Attacking Right to Left or Left to Right: Left -> Right)
    const homeFormations: [number, number][] = [
      [-48, 0], // GK
      [-32, -16], // LB
      [-32, 16], // RB
      [-14, -10], // CM
      [-14, 10], // CM
      [6, 0], // ST
    ];

    roles.forEach((role, idx) => {
      const player = this.homeSquad[idx];
      const model3D = createPlayerModel(player, this.homeClub, role === 'GK');
      this.scene.add(model3D.rootGroup);

      const pos = new THREE.Vector3(homeFormations[idx][0], 0, homeFormations[idx][1]);
      model3D.rootGroup.position.copy(pos);

      this.homePlayers.push({
        model3D,
        position: pos,
        velocity: new THREE.Vector3(),
        homePosition: pos.clone(),
        role,
        isHomeTeam: true,
        hasBall: false,
        stamina: 100,
        kickCooldown: 0,
      });
    });

    // Away Team (Defending Right side)
    const awayFormations: [number, number][] = [
      [48, 0], // GK
      [32, 16], // RB
      [32, -16], // LB
      [14, 10], // CM
      [14, -10], // CM
      [-6, 0], // ST
    ];

    roles.forEach((role, idx) => {
      const player = this.awaySquad[idx];
      const model3D = createPlayerModel(player, this.awayClub, role === 'GK');
      this.scene.add(model3D.rootGroup);

      const pos = new THREE.Vector3(awayFormations[idx][0], 0, awayFormations[idx][1]);
      model3D.rootGroup.position.copy(pos);

      this.awayPlayers.push({
        model3D,
        position: pos,
        velocity: new THREE.Vector3(),
        homePosition: pos.clone(),
        role,
        isHomeTeam: false,
        hasBall: false,
        stamina: 100,
        kickCooldown: 0,
      });
    });

    // Highlight user's initial active player (Striker)
    this.activePlayerIndex = 5;
    this.homePlayers[this.activePlayerIndex].model3D.setHighlighted(true);
  }

  public resetToKickoff(isHomeKickoff: boolean) {
    this.ball.reset(new THREE.Vector3(0, 0, 0));

    // Reset players to home base
    this.homePlayers.forEach((p) => {
      p.position.copy(p.homePosition);
      p.velocity.set(0, 0, 0);
      p.hasBall = false;
      p.model3D.rootGroup.position.copy(p.position);
      p.model3D.rootGroup.rotation.y = Math.PI / 2; // Facing right
    });

    this.awayPlayers.forEach((p) => {
      p.position.copy(p.homePosition);
      p.velocity.set(0, 0, 0);
      p.hasBall = false;
      p.model3D.rootGroup.position.copy(p.position);
      p.model3D.rootGroup.rotation.y = -Math.PI / 2; // Facing left
    });

    // Give ball to kicking team's striker
    const kicker = isHomeKickoff ? this.homePlayers[5] : this.awayPlayers[5];
    kicker.position.set(isHomeKickoff ? -1.2 : 1.2, 0, 0);
    kicker.hasBall = true;
    this.isGoalScored = false;
    this.goalCelebrationTimer = 0;

    footballAudio.playWhistle('short');
  }

  public startSecondHalf() {
    this.currentHalf = 2;
    this.isHalfTimeBreak = false;
    this.halfRealElapsedSeconds = 0;
    this.matchTimeMinutes = 45.0;
    this.resetToKickoff(false);
  }

  public update(dt: number, input: MatchInput) {
    const delta = Math.min(dt, 0.1);

    // Pause physics if during Half-Time break
    if (this.isHalfTimeBreak) {
      return;
    }

    // Match Timer Progression:
    // 1-half = 5 min (300 real seconds) -> 45 in-game match minutes.
    // 2-half = 5 min (300 real seconds) -> 45 to 90 in-game match minutes.
    // 5 min = 45m match time.
    const realSecondsPerHalf = this.halfDurationRealMinutes * 60; // 300 seconds

    if (!this.isFullTime && !this.isGoalScored) {
      this.halfRealElapsedSeconds += delta;

      if (this.currentHalf === 1) {
        // Half 1: advances from 0.0 to 45.0 in-game minutes
        this.matchTimeMinutes = Math.min(45, (this.halfRealElapsedSeconds / realSecondsPerHalf) * 45);

        if (this.halfRealElapsedSeconds >= realSecondsPerHalf && !this.isHalfTime) {
          this.matchTimeMinutes = 45.0;
          this.isHalfTime = true;
          this.isHalfTimeBreak = true;
          footballAudio.playWhistle('double');
          return;
        }
      } else {
        // Half 2: advances from 45.0 to 90.0 in-game minutes
        this.matchTimeMinutes = Math.min(90, 45 + (this.halfRealElapsedSeconds / realSecondsPerHalf) * 45);

        if (this.halfRealElapsedSeconds >= realSecondsPerHalf && !this.isFullTime) {
          this.matchTimeMinutes = 90.0;
          this.isFullTime = true;
          footballAudio.playWhistle('long');
        }
      }

      // Track team possession
      const homeHasBall = this.homePlayers.some((p) => p.hasBall);
      const awayHasBall = this.awayPlayers.some((p) => p.hasBall);
      if (homeHasBall) this.homePossessionSeconds += delta;
      else if (awayHasBall) this.awayPossessionSeconds += delta;
    }

    // Goal Celebration Delay
    if (this.isGoalScored) {
      this.goalCelebrationTimer += delta;
      if (this.goalCelebrationTimer > 3.5) {
        this.resetToKickoff(false);
      }
      this.ball.update(delta);
      return;
    }

    // 1. UPDATE USER CONTROLLED PLAYER
    this.updateUserPlayer(delta, input);

    // 2. UPDATE AI TEAMMATES (HOME)
    this.updateTeammatesAI(delta);

    // 3. UPDATE OPPONENTS AI (AWAY)
    this.updateOpponentsAI(delta);

    // 4. UPDATE GOALKEEPERS
    this.updateGoalkeepers(delta);

    // 5. UPDATE BALL & COLLISION WITH PLAYERS
    this.updateBallPhysics(delta);

    // 6. CHECK GOAL LINES
    this.checkGoals();
  }

  private updateUserPlayer(dt: number, input: MatchInput) {
    const user = this.homePlayers[this.activePlayerIndex];
    if (!user) return;

    if (user.kickCooldown > 0) user.kickCooldown -= dt;

    // Movement
    let speed = 6.2; // Base run m/s
    if (input.sprint && user.stamina > 10) {
      speed = 9.2;
      user.stamina = Math.max(0, user.stamina - 14 * dt);
    } else {
      user.stamina = Math.min(100, user.stamina + 6 * dt);
    }

    const moveVec = new THREE.Vector3(input.moveX, 0, input.moveZ);
    if (moveVec.lengthSq() > 0.05) {
      moveVec.normalize();
      user.velocity.copy(moveVec).multiplyScalar(speed);
      user.position.addScaledVector(user.velocity, dt);

      // Face movement direction
      const angle = Math.atan2(moveVec.x, moveVec.z);
      user.model3D.rootGroup.rotation.y = angle;
      user.model3D.updateAnimation(dt, speed, 'run');
    } else {
      user.velocity.set(0, 0, 0);
      user.model3D.updateAnimation(dt, 0, 'idle');
    }

    // Constrain to pitch bounds
    const halfL = this.pitch.length / 2 - 1.0;
    const halfW = this.pitch.width / 2 - 1.0;
    user.position.x = Math.max(-halfL, Math.min(halfL, user.position.x));
    user.position.z = Math.max(-halfW, Math.min(halfW, user.position.z));
    user.model3D.rootGroup.position.copy(user.position);

    // Dribble if has ball
    if (user.hasBall) {
      const fwd = new THREE.Vector3(Math.sin(user.model3D.rootGroup.rotation.y), 0, Math.cos(user.model3D.rootGroup.rotation.y));
      this.ball.position.copy(user.position).addScaledVector(fwd, 0.85);
      this.ball.position.y = this.ball.radius;
      this.ball.velocity.set(0, 0, 0);

      // Actions: Pass, Shoot, Through ball
      if (input.pass && user.kickCooldown <= 0) {
        this.executePass(user, false);
      } else if (input.throughBall && user.kickCooldown <= 0) {
        this.executePass(user, true);
      } else if (input.shootPower > 0.1 && user.kickCooldown <= 0) {
        this.executeShot(user, input.shootPower);
      }
    } else {
      // Defensive actions: Switch player or tackle
      if (input.switchPlayer) {
        this.switchActivePlayer();
      }
      if (input.tackle && user.kickCooldown <= 0) {
        this.executeTackle(user);
      }
    }
  }

  private switchActivePlayer() {
    this.homePlayers[this.activePlayerIndex].model3D.setHighlighted(false);

    // Find non-GK teammate closest to the ball
    let bestDist = Infinity;
    let bestIdx = 5;

    for (let i = 1; i < this.homePlayers.length; i++) {
      const d = this.homePlayers[i].position.distanceTo(this.ball.position);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }

    this.activePlayerIndex = bestIdx;
    this.homePlayers[this.activePlayerIndex].model3D.setHighlighted(true);
    footballAudio.playClick();
  }

  private executePass(kicker: MatchPlayerState, isThrough: boolean) {
    kicker.hasBall = false;
    kicker.kickCooldown = 0.5;
    kicker.model3D.updateAnimation(0.016, 0, 'kick');

    // Find best open teammate ahead
    const teammates = kicker.isHomeTeam ? this.homePlayers : this.awayPlayers;
    let bestMate = teammates[5];
    let bestScore = -Infinity;

    teammates.forEach((mate) => {
      if (mate === kicker || mate.role === 'GK') return;
      const toMate = new THREE.Vector3().subVectors(mate.position, kicker.position);
      const dist = toMate.length();
      if (dist < 4 || dist > 45) return;

      // Prefer forward passes
      const forwardDir = kicker.isHomeTeam ? 1 : -1;
      const forwardScore = toMate.x * forwardDir * 2;
      const score = forwardScore - dist * 0.2;

      if (score > bestScore) {
        bestScore = score;
        bestMate = mate;
      }
    });

    const targetPos = bestMate.position.clone();
    if (isThrough) {
      // Lead ahead
      targetPos.x += kicker.isHomeTeam ? 8 : -8;
    }

    const passDir = new THREE.Vector3().subVectors(targetPos, this.ball.position).normalize();
    const passSpeed = isThrough ? 25 : 18;
    this.ball.velocity.copy(passDir).multiplyScalar(passSpeed);
    this.ball.velocity.y = 0.5;

    footballAudio.playKick(0.6);

    // If home team, switch control to targeted mate
    if (kicker.isHomeTeam) {
      const mateIdx = this.homePlayers.indexOf(bestMate);
      if (mateIdx !== -1) {
        this.homePlayers[this.activePlayerIndex].model3D.setHighlighted(false);
        this.activePlayerIndex = mateIdx;
        this.homePlayers[this.activePlayerIndex].model3D.setHighlighted(true);
      }
    }
  }

  private executeShot(kicker: MatchPlayerState, powerRatio: number) {
    if (kicker.isHomeTeam) this.homeShots++;
    else this.awayShots++;

    kicker.hasBall = false;
    kicker.kickCooldown = 0.6;
    kicker.model3D.updateAnimation(0.016, 0, 'kick');

    // Target goal
    const targetGoalX = kicker.isHomeTeam ? this.pitch.length / 2 : -this.pitch.length / 2;
    // Add slight aim variation toward top/bottom corners
    const cornerZ = (Math.random() - 0.5) * (this.goalWidth * 0.8);
    const targetY = 0.5 + Math.random() * (this.goalHeight * 0.85);

    const goalTarget = new THREE.Vector3(targetGoalX, targetY, cornerZ);
    const shotDir = new THREE.Vector3().subVectors(goalTarget, this.ball.position).normalize();

    const shotSpeed = 22 + powerRatio * 18; // 22 - 40 m/s rocket!
    this.ball.velocity.copy(shotDir).multiplyScalar(shotSpeed);
    this.ball.velocity.y = 2.5 + powerRatio * 4.0;

    footballAudio.playKick(0.9);
  }

  private executeTackle(player: MatchPlayerState) {
    player.kickCooldown = 0.6;
    player.model3D.updateAnimation(0.016, 0, 'slide');

    // Lunge forward
    const fwd = new THREE.Vector3(Math.sin(player.model3D.rootGroup.rotation.y), 0, Math.cos(player.model3D.rootGroup.rotation.y));
    player.position.addScaledVector(fwd, 1.8);

    // Dispossess if close to ball
    if (this.ball.position.distanceTo(player.position) < 2.0) {
      this.ball.velocity.copy(fwd).multiplyScalar(14);
      footballAudio.playKick(0.5);
    }
  }

  private updateTeammatesAI(dt: number) {
    this.homePlayers.forEach((p, idx) => {
      if (idx === this.activePlayerIndex || p.role === 'GK') return;

      // Move toward dynamic formation spot anchored to ball X position
      const ballProgress = this.ball.position.x / (this.pitch.length / 2); // -1 to 1
      const targetPos = p.homePosition.clone();
      targetPos.x += ballProgress * 15; // Shift team forward/back with play
      targetPos.z += (this.ball.position.z - targetPos.z) * 0.25;

      const toTarget = new THREE.Vector3().subVectors(targetPos, p.position);
      if (toTarget.lengthSq() > 1.0) {
        toTarget.normalize();
        p.velocity.copy(toTarget).multiplyScalar(5.5);
        p.position.addScaledVector(p.velocity, dt);

        p.model3D.rootGroup.rotation.y = Math.atan2(toTarget.x, toTarget.z);
        p.model3D.updateAnimation(dt, 5.5, 'run');
      } else {
        p.model3D.updateAnimation(dt, 0, 'idle');
      }

      p.model3D.rootGroup.position.copy(p.position);
    });
  }

  private updateOpponentsAI(dt: number) {
    const oppHasBall = this.awayPlayers.some((p) => p.hasBall);

    this.awayPlayers.forEach((p) => {
      if (p.role === 'GK') return;

      if (p.hasBall) {
        // AI Dribbles toward home goal (negative X)
        const targetGoal = new THREE.Vector3(-this.pitch.length / 2, 0, 0);
        const toGoal = new THREE.Vector3().subVectors(targetGoal, p.position);
        const distToGoal = toGoal.length();

        // Dribble
        const dribbleDir = toGoal.clone().normalize();
        p.velocity.copy(dribbleDir).multiplyScalar(6.5);
        p.position.addScaledVector(p.velocity, dt);
        p.model3D.rootGroup.rotation.y = Math.atan2(dribbleDir.x, dribbleDir.z);
        p.model3D.updateAnimation(dt, 6.5, 'run');

        this.ball.position.copy(p.position).addScaledVector(dribbleDir, 0.8);
        this.ball.position.y = this.ball.radius;
        this.ball.velocity.set(0, 0, 0);

        // Shoot if within 28m or pass if pressed
        if (distToGoal < 28 && Math.random() < 0.03) {
          this.executeShot(p, 0.85);
        } else if (Math.random() < 0.015) {
          this.executePass(p, Math.random() > 0.5);
        }
      } else {
        // Off-ball defense or attack
        let targetPos: THREE.Vector3;
        if (oppHasBall) {
          // Support attack
          targetPos = p.homePosition.clone();
          targetPos.x += (this.ball.position.x / (this.pitch.length / 2)) * 14;
        } else {
          // Defend: closest defender chases ball, others mark
          const distToBall = p.position.distanceTo(this.ball.position);
          if (distToBall < 18) {
            targetPos = this.ball.position.clone();
          } else {
            targetPos = p.homePosition.clone();
          }
        }

        const toTarget = new THREE.Vector3().subVectors(targetPos, p.position);
        if (toTarget.lengthSq() > 1.2) {
          toTarget.normalize();
          p.velocity.copy(toTarget).multiplyScalar(5.8);
          p.position.addScaledVector(p.velocity, dt);
          p.model3D.rootGroup.rotation.y = Math.atan2(toTarget.x, toTarget.z);
          p.model3D.updateAnimation(dt, 5.8, 'run');
        } else {
          p.model3D.updateAnimation(dt, 0, 'idle');
        }
      }

      p.model3D.rootGroup.position.copy(p.position);
    });
  }

  private updateGoalkeepers(dt: number) {
    // Left GK (Home)
    const homeGK = this.homePlayers[0];
    const awayGK = this.awayPlayers[0];

    // Track ball along goal line Z axis
    const maxZ = this.goalWidth / 2 - 0.5;
    const targetHomeZ = Math.max(-maxZ, Math.min(maxZ, this.ball.position.z * 0.6));
    homeGK.position.z = THREE.MathUtils.damp(homeGK.position.z, targetHomeZ, 8, dt);
    homeGK.model3D.rootGroup.position.copy(homeGK.position);

    const targetAwayZ = Math.max(-maxZ, Math.min(maxZ, this.ball.position.z * 0.6));
    awayGK.position.z = THREE.MathUtils.damp(awayGK.position.z, targetAwayZ, 8, dt);
    awayGK.model3D.rootGroup.position.copy(awayGK.position);

    // GK Save Reaction when ball is rushing toward goal
    if (this.ball.velocity.x < -12 && this.ball.position.x < -35) {
      if (Math.abs(this.ball.position.z - homeGK.position.z) < 2.5) {
        // Block!
        homeGK.model3D.updateAnimation(dt, 0, 'dive');
        this.ball.velocity.x = Math.abs(this.ball.velocity.x) * 0.6;
        footballAudio.playKick(0.7);
      }
    }

    if (this.ball.velocity.x > 12 && this.ball.position.x > 35) {
      if (Math.abs(this.ball.position.z - awayGK.position.z) < 2.5) {
        // Block!
        awayGK.model3D.updateAnimation(dt, 0, 'dive');
        this.ball.velocity.x = -Math.abs(this.ball.velocity.x) * 0.6;
        footballAudio.playKick(0.7);
      }
    }
  }

  private updateBallPhysics(dt: number) {
    this.ball.update(dt);

    // Ball pickup by closest player if free
    const allPlayers = [...this.homePlayers, ...this.awayPlayers];
    const anyPossession = allPlayers.some((p) => p.hasBall);

    if (!anyPossession && this.ball.position.y < 1.2 && this.ball.velocity.length() < 16) {
      for (const p of allPlayers) {
        if (p.kickCooldown > 0) continue;
        const dist = p.position.distanceTo(this.ball.position);
        if (dist < 1.1) {
          p.hasBall = true;
          // If home player picked up, auto switch user control
          if (p.isHomeTeam && this.homePlayers.indexOf(p) !== this.activePlayerIndex) {
            this.homePlayers[this.activePlayerIndex].model3D.setHighlighted(false);
            this.activePlayerIndex = this.homePlayers.indexOf(p);
            p.model3D.setHighlighted(true);
          }
          break;
        }
      }
    }
  }

  private checkGoals() {
    const halfL = this.pitch.length / 2;
    const halfGoalW = this.goalWidth / 2;

    // Home Goal (Left: -halfL) -> Away Team Scores!
    if (this.ball.position.x < -halfL && Math.abs(this.ball.position.z) < halfGoalW && this.ball.position.y < this.goalHeight) {
      this.awayScore++;
      this.isGoalScored = true;
      this.lastScorer = `${this.awayClub.shortName} GOAL!`;
      footballAudio.playNetRattle();
      footballAudio.cheerGoal();
      return;
    }

    // Away Goal (Right: +halfL) -> Home Team Scores!
    if (this.ball.position.x > halfL && Math.abs(this.ball.position.z) < halfGoalW && this.ball.position.y < this.goalHeight) {
      this.homeScore++;
      this.isGoalScored = true;
      const scorer = this.homeSquad[this.activePlayerIndex]?.name || `${this.homeClub.shortName} GOAL!`;
      this.lastScorer = `GOAL! ${scorer}`;
      footballAudio.playNetRattle();
      footballAudio.cheerGoal();
      return;
    }

    // Ball out of bounds touchline
    const halfW = this.pitch.width / 2;
    if (Math.abs(this.ball.position.z) > halfW + 1.0 || Math.abs(this.ball.position.x) > halfL + 1.0) {
      // Throw in / Goal kick
      this.ball.velocity.set(0, 0, 0);
      this.ball.position.x = Math.max(-halfL + 2, Math.min(halfL - 2, this.ball.position.x));
      this.ball.position.z = Math.max(-halfW + 2, Math.min(halfW - 2, this.ball.position.z));
      this.ball.position.y = this.ball.radius;
    }
  }

  public dispose() {
    this.scene.remove(this.ball.mesh);
    this.scene.remove(this.ball.shadowMesh);
    [...this.homePlayers, ...this.awayPlayers].forEach((p) => {
      this.scene.remove(p.model3D.rootGroup);
    });
    this.homePlayers = [];
    this.awayPlayers = [];
  }
}

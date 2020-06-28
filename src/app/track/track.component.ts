import { Component, OnInit, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { COLS, ROWS, BLOCK_SIZE, CELL_TYPE, STATE, COLOR } from 'src/consts';
import { Cell } from './cell';
import { Tracks } from './tracks';
import { Logger } from '../logger';

@Component({
  selector: 'app-track',
  templateUrl: './track.component.html',
  styles: [ ]
})
export class TrackComponent implements OnInit {
  
  @ViewChild('track', { static: true })
  canvas: ElementRef<HTMLCanvasElement>;

  @Output() messageEvent = new EventEmitter<string[]>()

  ctx: CanvasRenderingContext2D;
  turn: number = 0;
  speed: number = 0;
  damage: number = 0;
  time: { start: number; elapsed: number; };
  state: STATE = STATE.NOGAME;

  isPreGame: boolean = this.state === STATE.PREGAME;
  playButtonText: string = this.state === STATE.PREGAME ? "Start" 
                         : this.state === STATE.GAME ? "Restart"
                         : this.state === STATE.ENDGAME ? "Ok"
                         : this.state === STATE.NOGAME ? "New Game"
                         : "???";
  
  playerCountInput: number = 2;
  playerCount: number = 2;
  playerDamageMaxInput: number = 3;
  playerDamageMax: number = 3;
  lapCountInput: number = 1;
  lapCount: number = 1;
  trackNumberInput: number = 1;
  trackNumber: number = 1;

  players: Cell[] = [];
  playersPrev: Cell[] = [];
  playersDamage: number[] = [0, 0, 0, 0];
  lap: number = 0;
  laps: number[] = [0, 0, 0, 0];

  playersTrajectory: Cell[][] = [[],[],[],[]];

  activePlayer: number = 0;

  baseTrack: Cell[][];
  track: Cell[][];

  ngOnInit(): void {
    this.initTrack();
    this.messageEvent.emit(["Welcome, Graph Racers!", "Click 'New Game' to start."])
  }

  newGame() {
    if (this.state === STATE.NOGAME || this.state === STATE.ENDGAME) {
      this.state = STATE.PREGAME;
      this.playerCount = 0;
      this.resetGame();
    }
  }

  playTwo() { this.playerCountInput = 2; }
  playThree() { this.playerCountInput = 3; }
  playFour() { this.playerCountInput = 4; }

  damageThree() { this.playerDamageMaxInput = 3; }
  damageFour() { this.playerDamageMaxInput = 4; }
  damageFive() { this.playerDamageMaxInput = 5; }

  lapsOne() { this.lapCountInput = 1; }
  lapsTwo() { this.lapCountInput = 2; }
  lapsThree() { this.lapCountInput = 3; }

  trackOne() { this.trackNumberInput = 1; this.baseTrack = this.getTrack(this.trackNumberInput); this.updateTrackPlayers(); }
  trackTwo() { this.trackNumberInput = 2; this.baseTrack = this.getTrack(this.trackNumberInput); this.updateTrackPlayers(); }
  trackThree() { this.trackNumberInput = 3; this.baseTrack = this.getTrack(this.trackNumberInput); this.updateTrackPlayers(); }

  play() {
    if (this.state === STATE.PREGAME) {
      this.messageEvent.emit(["Graph Racers, start your engines!"])
      this.playerCount = this.playerCountInput;
      this.playerDamageMax = this.playerDamageMaxInput;
      this.lapCount = this.lapCountInput;
      this.trackNumber = this.trackNumberInput;
      this.state = STATE.GAME;
      this.resetGame();
      this.time.start = performance.now();
      this.getPlayerActions();
    }
  }

  restart() {
    if (this.state === STATE.GAME) {
      this.state = STATE.PREGAME;
      this.playerCount = 0;
      this.resetGame();
    }
  }

  handleMouseMove(event) {
    if (!this.track) {
      return;
    }
    Tracks.allCells(this.track, cell => cell.hover = false);
    const cell = this.getCellUnderMouse(event.clientX - 6, event.clientY - 6);
    if (cell) {
      Logger.debounce(`mouse move stopped: pt ${event.clientX},${event.clientY} --> cell ${cell.x},${cell.y}`);
      Tracks.thisCell(this.track, cell, cell => cell.hover = true);
      this.drawTrack();
    }
  }

  handleMouseClick(event) {
    const cell = this.getCellUnderMouse(event.clientX - 6, event.clientY - 6);
    if (cell) {
      Logger.log(`mouse click: pt ${event.clientX},${event.clientY} --> cell ${cell.x},${cell.y}`);
      this.submitAction(cell);
    }
  }

  private initialNextPlayer = -1;
  private nextPlayer() {
    this.activePlayer++;

    // If we're back to the initial "next" player, there are no players left to play!
    if (this.initialNextPlayer === this.activePlayer) {
      this.handleNoPlayersLeft();
      return;
    }

    // track who the initial "next" player is, in case no players can play
    if (this.initialNextPlayer === -1) {
      this.initialNextPlayer = this.activePlayer;
    }

    if (this.activePlayer >= this.playerCount) {
      this.turn++;
      this.activePlayer = 0;
    }
    if (this.playersDamage[this.activePlayer] >= this.playerDamageMax) {
      // this player is already out of the game
      this.nextPlayer();
      return;
    }

    this.initialNextPlayer = -1; // reset, we have a valid next player
    let curCell = this.players[this.activePlayer];
    let prevCell = this.playersPrev[this.activePlayer];
    this.speed = Tracks.getPlayerSpeed(this.track, prevCell, curCell);
    this.damage = this.playersDamage[this.activePlayer];
    this.lap = this.laps[this.activePlayer];
  }

  private getPlayerActions() {
      let activePlayer: Cell = this.players[this.activePlayer];
      if (!activePlayer) {
        throw "No active player!";
      }
      let prevCell: Cell = this.playersPrev[this.activePlayer];
      Tracks.addPlayerActionsToTrack(this.track, prevCell, activePlayer);
      this.drawTrack();

      if (Tracks.getAllCells(this.track, cell => cell.type === CELL_TYPE.TARGET || cell.type === CELL_TYPE.CRASH_TARGET).length === 0) {
        this.messageEvent.emit(["No legal moves! Your turn is skipped, you get 1 damage, and you must start at 0 speed."]);
        this.addDamageToCurrentPlayer(1);
        this.handleNoLegalMoves();
      }
  }

  private addDamageToCurrentPlayer(damage: number = 1) {
    this.playersDamage[this.activePlayer] += damage;
    this.handleDamage();
  }

  private handleDamage() {
    let damage = this.playersDamage[this.activePlayer];
    if (damage >= this.playerDamageMax) {
      this.messageEvent.emit(["Your car 'sploded! Your game is over."]);
      const active = this.players[this.activePlayer];
      Tracks.thisCell(this.track, active, cell => {
        cell.type = cell.basetype;
      });
    }
  }

  private handleNoLegalMoves() {
    this.playersPrev[this.activePlayer] = this.players[this.activePlayer];
    this.removeAllTargetsFromTrack();
    this.nextPlayer();
    this.getPlayerActions();
    this.drawTrack();
  }

  private handleNoPlayersLeft() {
    this.messageEvent.emit(["You ALL 'sploded!? This game is over and no one wins. What a shame."]);
    this.handleEndGame();
  }

  private handleEndGame() {
    this.playerCount = 0;
    this.resetGame();
    this.state = STATE.PREGAME;
  }

  private submitAction(newCell: Cell) {
    if (newCell && newCell.type === CELL_TYPE.TARGET) {
      this.updateNewCell(newCell);
    } else if (newCell.type === CELL_TYPE.CRASH_TARGET) {
      const validCells = Tracks.getExtendedCells(this.track, newCell);
      if (validCells.length === 0) {
        this.messageEvent.emit(["That would be a severe crash! Your turn is skipped, you get 2 damage, and you must start at 0 speed."]);
        this.addDamageToCurrentPlayer(2);
        this.handleNoLegalMoves();
      } else {
        this.messageEvent.emit(["You crashed! You're back on course, but you get 1 damage and must start your next turn at 0 speed."]);
        this.addDamageToCurrentPlayer();
        newCell = validCells.pop(); // just get the first for now
        this.updateNewCell(newCell, true);
      }
    }
  }

  private updateNewCell(newCell: Cell, crashed: boolean = false) {

    // add car to new cell
    const newPrevCell = this.players[this.activePlayer];
    newCell.type = newPrevCell ? newPrevCell.type
                               : this.activePlayer === 0 ? CELL_TYPE.CAR1
                               : this.activePlayer === 1 ? CELL_TYPE.CAR2
                               : this.activePlayer === 2 ? CELL_TYPE.CAR3
                               : this.activePlayer === 3 ? CELL_TYPE.CAR4
                               : CELL_TYPE.TRACK;

    // remove car from old cell
    Tracks.thisCell(this.track, newPrevCell, cell => cell.type = cell.basetype);

    // track player's cells
    this.playersPrev[this.activePlayer] = crashed ? newCell : newPrevCell;
    this.players[this.activePlayer] = newCell;
    this.playersTrajectory[this.activePlayer].push(newCell);

    // remove targets from cells
    this.removeAllTargetsFromTrack();

    if (Tracks.doesTrajectoryIncludeFinishLine(this.track, newPrevCell, newCell)) {
      if (newPrevCell.basetype === CELL_TYPE.START_STOP) { // just left finish line
        if (this.laps[this.activePlayer] === 0) { // start first lap
          this.laps[this.activePlayer]++;
        }
      } else { // just crossed/reached finish line
        this.drawTrack();

        if (this.laps[this.activePlayer] === this.lapCount) {
          this.messageEvent.emit(["You win!"]);
          this.handleEndGame();
          return;
        } else {
          this.laps[this.activePlayer]++;
        }
      }
    }
    this.nextPlayer();
    this.drawTrack();
    this.getPlayerActions();
    this.drawTrack();
  }
  
  private removeAllTargetsFromTrack() {
    Tracks.allCells(this.track, cell => {
      if (cell.type === CELL_TYPE.TARGET || cell.type === CELL_TYPE.CRASH_TARGET) {
        cell.type = cell.basetype;
      }
    });
  }

  private getCellUnderMouse(xPixel: number, yPixel: number): Cell {
    if (!this.track) {
      return;
    }
    xPixel = Math.max(0, xPixel - this.canvas.nativeElement.offsetLeft);
    yPixel = Math.max(0, yPixel - this.canvas.nativeElement.offsetTop);
    const x = Math.floor(xPixel / (BLOCK_SIZE + 0.0));
    const y = Math.floor(yPixel / (BLOCK_SIZE + 0.0));
    return Tracks.getCell(this.track, x, y);
  }

  private getTrack(num: number): Cell[][] {
    switch (num) {
      case 2:
        return Tracks.getTrackTwo();
      case 3:
        return Tracks.getTrackThree();
      case 1:
      default:
        return Tracks.getTrackOne();
    }
  }

  private updateTrackPlayers() {
    this.track = this.baseTrack; // replace all players, then remove
    Tracks.allCells(this.track, cell => {
      let cellPlayer = Number(cell.code);
      if (cellPlayer && cellPlayer > this.playerCount) {
        this.removePlayerFromCell(cell);
      }
    });
    this.drawTrack();
  }

  private removePlayerFromCell(cell: Cell) {
    if (cell.isPlayer) {
      Tracks.thisCell(this.track, cell, pl => pl.type = pl.basetype);
    } else {
      console.log(`Tried to remove player from cell ${cell.x},${cell.y}, but a player wasn't there (${cell.type}).`);
    }
  }

  private initTrack() {
    // Get the 2D context that we draw on.
    this.ctx = this.canvas.nativeElement.getContext('2d');

    // Calculate size of canvas from constants.
    this.ctx.canvas.width = COLS * BLOCK_SIZE;
    this.ctx.canvas.height = ROWS * BLOCK_SIZE;

    this.canvas.nativeElement.onmousemove = this.handleMouseMove.bind(this);
    this.canvas.nativeElement.onmouseup = this.handleMouseClick.bind(this);
  }

  private initPlayers() {

    this.players = [];
    this.playersPrev = [];
    this.playersDamage = [0, 0, 0, 0];
    this.playersTrajectory = [[],[],[],[]];

    let player = Tracks.getPlayer(this.track, 1);

    if (this.playerCount >= 1) {
      if (!player) {
        throw `Player 1 not found.`
      }
      this.players.push(player);
      this.playersPrev.push(player);
      this.playersTrajectory[0].push(player);
    }

    if (this.playerCount >= 2) {
      player = Tracks.getPlayer(this.track, 2);
      if (!player) {
        throw `Player 2 not found.`
      }
      this.players.push(player);
      this.playersPrev.push(player);
      this.playersTrajectory[1].push(player);
    }

    if (this.playerCount >= 3) {
      player = Tracks.getPlayer(this.track, 3);
      if (!player) {
        throw `Player 3 not found.`
      }
      this.players.push(player);
      this.playersPrev.push(player);
      this.playersTrajectory[2].push(player);
    }

    if (this.playerCount >= 4) {
      player = Tracks.getPlayer(this.track, 4);
      if (!player) {
        throw `Player 4 not found.`
      }
      this.players.push(player);
      this.playersPrev.push(player);
      this.playersTrajectory[3].push(player);
    }
  }

  private resetGame() {
    this.activePlayer = 0;
    this.turn = 0;
    this.speed = 0;
    this.damage = 0;
    this.lap = 0;
    this.laps = [0, 0, 0, 0];
    this.baseTrack = this.getTrack(this.trackNumber);
    this.track = this.baseTrack;
    this.updateTrackPlayers();
    this.initPlayers(); // must do after getting track
    this.time = { start: 0, elapsed: 0 };
    this.drawTrack();
  }

  private drawTrack() {
    Tracks.allCells(this.track, cell => cell.draw(this.ctx));
    this.playersTrajectory.forEach((player, i) => {
      if (player.length > 0) {
        const color = i === 0 ? COLOR.BLUE
                      : i === 1 ? COLOR.YELLOW
                      : i === 2 ? COLOR.PURPLE
                      : i === 3 ? COLOR.ORANGE
                      : COLOR.BLACK;
        const first = player[0];
        this.ctx.strokeStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(first.centerPoint.x, first.centerPoint.y);
        player.forEach(cell => {
          this.ctx.lineTo(cell.centerPoint.x, cell.centerPoint.y);
        });
        this.ctx.stroke();
      }
    });
  }
}

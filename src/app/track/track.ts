import {COLS, ROWS, CELL_TYPE} from '../../consts'
import { Cell } from './cell';

export class Track {

    constructor(track: Cell[][], checkpoints: number) {
        
        this.checkTrack(track, checkpoints);

        this.track = track;
        this.checkpoints = checkpoints;
    }

    public track: Cell[][] = null;
    public checkpoints: number = 2;

    public readonly specialCells: Cell[] = [];

    public getCell(x: number, y: number): Cell {
        let found =this.getAllCellsThat(cell => cell.x === x && cell.y === y);
        return found.length > 0 ? found[0] : null;
    }

    public getAllCellsThat(areThis: (cell: Cell) => boolean): Cell[] {
        const cells: Cell[] = [];
        this.track.forEach(row => {
            row.forEach(cell => {
                if (areThis(cell)) {
                    cells.push(cell);
                }
            });
        });
        return cells;
    }

    public toAllCells(doThis: (cell: Cell) => void): void {
        this.track.forEach(row => {
            row.forEach(cell => {
                doThis(cell);
            });
        });
    }

    public toThisCell(thisCell: Cell, doThis: (cell: Cell) => void): void {
        if (!thisCell) {
            return;
        }
        this.track.forEach(row => {
            row.forEach(cell => {
                if (thisCell.x === cell.x && thisCell.y === cell.y) {
                  doThis(cell);
                  return;
                }
            });
        });
    }

    public toTheseCells(theseCells: Cell[], doThis: (cell: Cell) => void): void {
        if (!theseCells) {
            return;
        }
        theseCells.forEach(cell => {
            this.toThisCell(cell, doThis);
        });
    }

    public log() {
        let toLogA: string[][] = [];
        let toLogB: string[][] = []; // have to split because Chrome limits output to 20 columns
        this.track.forEach(row => {
            const rowToLogA: string[] = [];
            const rowToLogB: string[] = [];
            row.forEach(cell => {
                if (rowToLogA.length < 20) {
                    rowToLogA.push(cell.code);
                } else {
                    rowToLogB.push(cell.code);
                }
            });
            toLogA.push(rowToLogA);
            if (rowToLogB.length > 0) {
                toLogB.push(rowToLogB);
            }
        });
        console.table(toLogA);
        if (toLogB.length > 0) {
          console.table(toLogB);
        }
    }

    private checkTrack(track: Cell[][], checkpoints: number) {
        
        if (track.length !== ROWS) {
            throw `Invalid track (rows = ${track.length}).`;
        }
        track.forEach((row, i) => {
            if (row.length !== COLS) {
                throw `Invalid track (row ${i} cols = ${row.length}).`;
            }
        });
        if (checkpoints < 2 || checkpoints > 3) {
            throw `Invalid track (checkpoints = ${checkpoints}).`;
        }
        let found = [false, false, false, false];
        track.forEach((row) => {
            row.forEach((cell) => {
                if (cell.type === CELL_TYPE.CAR1) {
                    if (found[0]) {
                        throw `Invalid track (found player 1 twice).`;
                    }
                    found[0] = true;
                }
                if (cell.type === CELL_TYPE.CAR2) {
                    if (found[1]) {
                        throw `Invalid track (found player 2 twice).`;
                    }
                    found[1] = true;
                }
                if (cell.type === CELL_TYPE.CAR3) {
                    if (found[2]) {
                        throw `Invalid track (found player 3 twice).`;
                    }
                    found[2] = true;
                }
                if (cell.type === CELL_TYPE.CAR4) {
                    if (found[3]) {
                        throw `Invalid track (found player 4 twice).`;
                    }
                    found[3] = true;
                }
            })
        });
        if (!found[0]) {
            throw `Invalid track (missing player 1).`;
        }
        if (!found[1]) {
            throw `Invalid track (missing player 2).`;
        }
        if (!found[2]) {
            throw `Invalid track (missing player 3).`;
        }
        if (!found[3]) {
            throw `Invalid track (missing player 4).`;
        }
    }
}
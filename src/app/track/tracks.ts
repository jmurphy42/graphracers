import {CELL_TYPE, COLS, ROWS, IPoint, BLOCK_SIZE} from '../../consts'
import { Cell } from './cell';

export class Tracks {

    public static getPlayer(track: Cell[][], num: number): Cell {
        let player: Cell = null;
        track.forEach(row => {
            row.forEach(cell => {
                if (Number(cell.type) === num) {
                    player = cell;
                }
            });
        });
        return player;
    }

    public static getCell(track: Cell[][], x: number, y: number): Cell {
        let found: Cell = null;
        track.forEach(row => {
            row.forEach(cell => {
                if (cell.x === x && cell.y === y) {
                    found = cell;
                }
            });
        });
        return found;
    }

    public static getAllCells(track: Cell[][], thatAreThis: (cell: Cell) => boolean): Cell[] {
        const cells: Cell[] = [];
        track.forEach(row => {
            row.forEach(cell => {
                if (thatAreThis(cell)) {
                    cells.push(cell);
                }
            });
        });
        return cells;
    }

    public static allCells(track: Cell[][], doThis: (cell: Cell) => void): void {
        track.forEach(row => {
            row.forEach(cell => {
                doThis(cell);
            });
        });
    }

    public static thisCell(track: Cell[][], thisCell: Cell, doThis: (cell: Cell) => void): void {
        if (!thisCell) {
            console.log("Can't do thisCell because thisCell is null.");
            return;
        }
        track.forEach(row => {
            row.forEach(cell => {
                if (thisCell.x === cell.x && thisCell.y === cell.y) {
                  doThis(cell);
                  return;
                }
            });
        });
    }

    public static theseCells(track: Cell[][], theseCells: Cell[], doThis: (cell: Cell) => void): void {
        if (!theseCells) {
            console.log("Can't do theseCell because theseCell is null.");
            return;
        }
        theseCells.forEach(cell => {
            Tracks.thisCell(track, cell, doThis);
        });
    }

    public static log(track: Cell[][]) {
        let toLogA: string[][] = [];
        let toLogB: string[][] = []; // have to split because Chrome limits output to 20 columns
        track.forEach(row => {
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

    public static getPlayerSpeed(track: Cell[][], previousCell: Cell, currentCell: Cell): number {
        let deltaX = 0;
        let deltaY = 0;
        if (previousCell) {
            deltaX = currentCell.x - previousCell.x;
            deltaY = currentCell.y - previousCell.y;
        }
        
        return deltaX === 0 && deltaY === 0 ? 0 : Math.round(Math.sqrt(deltaX * deltaX + deltaY * deltaY) * 10) / 10.0;
    }

    public static getCellsBetweenTwoCells(track: Cell[][], cellA: Cell, cellB: Cell): Cell[] {
        const minXCell = cellA.x < cellB.x ? cellA : cellB;
        const maxXCell = cellA.x > cellB.x ? cellA : cellB;
        const minYCell = cellA.y < cellB.y ? cellA : cellB;
        const maxYCell = cellA.y > cellB.y ? cellA : cellB;
        const range = Tracks.getAllCells(track, cell => cell.x >= minXCell.x && cell.x <= maxXCell.x && cell.y >= minYCell.y && cell.y <= maxYCell.y);
        let trajCells: Cell[] = [];

        let line: IPoint[] = [];
        let slope: number = (maxYCell.y - minYCell.y) / (maxXCell.x - minXCell.x + 0.0);
        if (maxXCell.x === minXCell.x) {
            slope = (maxXCell.x - minXCell.x) / (maxYCell.y - minYCell.y + 0.0);
            if (maxYCell.y === minYCell.y) {
                // console.log(`No change in cells.`);
            } else {
                for (let i = minYCell.centerPoint.y; i < maxYCell.centerPoint.y; i++) { // for every y pixel between the center points
                    let pxy = i;
                    let pxx = Math.round(maxXCell.centerPoint.x - slope * (i - minYCell.centerPoint.y));
                    line.push({ x: pxx, y: pxy });
                }
            }
        } else {
            for (let i = minXCell.centerPoint.x; i < maxXCell.centerPoint.x; i++) { // for every x pixel between the center points
                let pxx = i;
                let pxy = Math.round(maxYCell.centerPoint.y - slope * (i - minXCell.centerPoint.x));
                line.push({ x: pxx, y: pxy });
            }
        }
        range.forEach(c => {
            let found = false;
            line.forEach(pt => {
                if (!found && c.isPointIn(pt)) {
                    trajCells.push(c);
                    found = true;
                }
            });
        });

        return trajCells;
    }

    public static addPlayerActionsToTrack(track: Cell[][], previousCell: Cell, currentCell: Cell) {
        const legalTrajectoryCells = this.getLegalPlayerTrajectoryCells(track, previousCell, currentCell);

        Tracks.thisCell
        track.forEach(row => {
            row.forEach(cell => {
                Tracks.theseCells(track, legalTrajectoryCells, cell => {
                    if (cell.basetype === CELL_TYPE.TRACK || cell.basetype === CELL_TYPE.START_STOP) {
                        if (cell.type === CELL_TYPE.CAR1 || cell.type === CELL_TYPE.CAR2 || cell.type === CELL_TYPE.CAR3 || cell.type === CELL_TYPE.CAR4) {
                          // TODO: handle when target has a car
                        } else {
                          cell.type = CELL_TYPE.TARGET;
                        }
                    } else if (cell.basetype === CELL_TYPE.OFFTRACK) {
                        if (cell.type === CELL_TYPE.CAR1 || cell.type === CELL_TYPE.CAR2 || cell.type === CELL_TYPE.CAR3 || cell.type === CELL_TYPE.CAR4) {
                          // TODO: handle when target has a car
                        } else {
                          cell.type = CELL_TYPE.CRASH_TARGET;
                        }
                    }
                });
            });
        });
    }

    public static getPlayerTrajectoryCells(track: Cell[][], previousCell: Cell, currentCell: Cell): Cell[] {
        let deltaX = 0;
        let deltaY = 0;
        if (previousCell) {
            deltaX = currentCell.x - previousCell.x;
            deltaY = currentCell.y - previousCell.y;
        }
        const trajectoryX = currentCell.x + deltaX;
        const trajectoryY = currentCell.y + deltaY;
        const minX = trajectoryX - 1;
        const maxX = trajectoryX + 1;
        const minY = trajectoryY - 1;
        const maxY = trajectoryY + 1;

        let trajectoryCells: Cell[] = [];
        track.forEach(row => {
            row.forEach(cell => {
                if (cell.x >= minX && cell.x <= maxX && cell.y >= minY && cell.y <= maxY) {
                    if (!((cell.x === previousCell.x && cell.y === previousCell.y) || (cell.x === currentCell.x && cell.y === currentCell.y))) {
                        trajectoryCells.push(cell);
                    }
                }
            });
        });
        return trajectoryCells;
    }

    public static getLegalPlayerTrajectoryCells(track: Cell[][], previousCell: Cell, currentCell: Cell): Cell[] {
        let legalTrajectoryCells: Cell[] = [];
        let trajectoryCells: Cell[] = this.getPlayerTrajectoryCells(track, previousCell, currentCell);
        trajectoryCells.forEach(cell => {
            const cellsBetween = Tracks.getCellsBetweenTwoCells(track, currentCell, cell);
            let legal = true;
            cellsBetween.forEach(cb => {
                if (cb.basetype !== CELL_TYPE.TRACK && cb.basetype !== CELL_TYPE.START_STOP) {
                    legal = false;
                }
            });
            if (legal) {
                legalTrajectoryCells.push(cell);
            }
        });
        return legalTrajectoryCells;
    }

    public static doesTrajectoryIncludeFinishLine(track: Cell[][], previousCell: Cell, currentCell: Cell): boolean {
        const cellsBetween = Tracks.getCellsBetweenTwoCells(track, previousCell, currentCell);
        let includesFinishLine = false;
        cellsBetween.forEach(cb => {
            if (cb.basetype === CELL_TYPE.START_STOP) {
                includesFinishLine = true;
            }
        });
        return includesFinishLine;
    }

    public static getExtendedCells(track: Cell[][], crashCell: Cell): Cell[] {
        const trajectoryX = crashCell.x;
        const trajectoryY = crashCell.y;
        const minX = trajectoryX - 1;
        const maxX = trajectoryX + 1;
        const minY = trajectoryY - 1;
        const maxY = trajectoryY + 1;

        let extendedCells: Cell[] = [];
        track.forEach(row => {
            row.forEach(cell => {
                if (cell.x >= minX && cell.x <= maxX && cell.y >= minY && cell.y <= maxY) {
                    if (cell.basetype === CELL_TYPE.TRACK || cell.basetype === CELL_TYPE.START_STOP) {
                        if (cell.type === CELL_TYPE.CAR1 || cell.type === CELL_TYPE.CAR2 || cell.type === CELL_TYPE.CAR3 || cell.type === CELL_TYPE.CAR4) {
                        } else {
                            extendedCells.push(cell);
                        }
                    }
                }
            });
        });
        return extendedCells;
    }

    public static getTrackOne(): Cell[][] {
        const track: Cell[][] = [];

        track.push(this.getTrackRow(0,  'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'));
        track.push(this.getTrackRow(1,  'XXXXXXXXXXXXXXXXXXXXXXXXXX........XXXXXX'));
        track.push(this.getTrackRow(2,  'XXXXXX........XXXXXXXXXX...........XXXXX'));
        track.push(this.getTrackRow(3,  'XXXX.............XXXXXX.............XXXX'));
        track.push(this.getTrackRow(4,  'XX................XXXX..............XXXX'));
        track.push(this.getTrackRow(5,  'X..................XXX.......XXX.....XXX'));
        track.push(this.getTrackRow(6,  'X.........XX.......XXX.......XXXX.....XX'));
        track.push(this.getTrackRow(7,  'X........XXXX......XXXX.......XXX.....XX'));
        track.push(this.getTrackRow(8,  'XX......XXXXX......XXXXX......XXX......X'));
        track.push(this.getTrackRow(9,  'XXX.....XXXX......XXXXXX......XXX......X'));
        track.push(this.getTrackRow(10, 'XXXX.....XX......XXXXXXX.....XXX.......X'));
        track.push(this.getTrackRow(11, 'XXXXX....XX......XXXXXX.....XXXX......XX'));
        track.push(this.getTrackRow(12, 'XXXXX....XX......XXXXXX.....XXXX......XX'));
        track.push(this.getTrackRow(13, 'XXXXX....XX......XXXXX.....XXXXXX.....XX'));
        track.push(this.getTrackRow(14, 'XXXX.....XXX......XXXX.....XXXXXXX.....X'));
        track.push(this.getTrackRow(15, 'XXX.....XXXX......XXX.......XXXXXX.....X'));
        track.push(this.getTrackRow(16, 'XX......XXXX......XXX.......XXXXXX.....X'));
        track.push(this.getTrackRow(17, 'XX......XXXX.................XXXXX.....X'));
        track.push(this.getTrackRow(18, 'XX.....XXXXXX................XXXXX.....X'));
        track.push(this.getTrackRow(19, 'XX.....XXXXXX................XXXX......X'));
        track.push(this.getTrackRow(20, 'XX.....XXXXXX...............XXXXX......X'));
        track.push(this.getTrackRow(21, 'XX......XXXXX...............XXXX......XX'));
        track.push(this.getTrackRow(22, 'XXX......XXXXX.............XXXX.......XX'));
        track.push(this.getTrackRow(23, 'XXXX.......XXXX...........XXX........XXX'));
        track.push(this.getTrackRow(24, 'XXXXX.......XXXX.......XXXXX........XXXX'));
        track.push(this.getTrackRow(25, 'XXXXXXX.......XXXXXXXXXXXXXX.......XXXXX'));
        track.push(this.getTrackRow(26, 'XXXXXXXX.......XXXXXXXXXXXXX......XXXXXX'));
        track.push(this.getTrackRow(27, 'XXXXXXXX.......XXXXXXXXXXXXX......XXXXXX'));
        track.push(this.getTrackRow(28, 'XXXXXX........XXXXXXXXXXXXXX......XXXXXX'));
        track.push(this.getTrackRow(29, 'XXXX........XXXXXXXXXXXXXXXX.......XXXXX'));
        track.push(this.getTrackRow(30, 'XXX.......XXXXXXXXXXXXXXXXXXX.......XXXX'));
        track.push(this.getTrackRow(31, 'XX.......XXXXXXXXXXXXXXXXXXXXXX.......XX'));
        track.push(this.getTrackRow(32, 'XX.......XXXXXXXXXXXXXXXXXXXXXX.......XX'));
        track.push(this.getTrackRow(33, 'XX........XXXXXXXXXXXXXXXXXXX.........XX'));
        track.push(this.getTrackRow(34, 'XX.....................S..............XX'));
        track.push(this.getTrackRow(35, 'XXX....................3.............XXX'));
        track.push(this.getTrackRow(36, 'XXXX...................1............XXXX'));
        track.push(this.getTrackRow(37, 'XXXXXXX................2.........XXXXXXX'));
        track.push(this.getTrackRow(38, 'XXXXXXXXXX.............4......XXXXXXXXXX'));
        track.push(this.getTrackRow(39, 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'));

        if (track.length !== ROWS) {
            throw "Invalid track.";
        }

        return track;
    }

    private static getTrackRow(y: number, rowDesc: string): Cell[] {
        const row: Cell[] = [];
        let isTrack = false; // first col is offtrack
        for(let x = 0; x < rowDesc.length; x++){
            if (x >= COLS) { // row is filled
                break;
            }
            const cellDesc = rowDesc[x];
            switch(cellDesc) {
                case 'o':
                case '.':
                    row.push(new Cell(x, y, CELL_TYPE.TRACK));
                    break;
                case 's':
                case 'S':
                    row.push(new Cell(x, y, CELL_TYPE.START_STOP));
                    break;
                case '1':
                    row.push(new Cell(x, y, CELL_TYPE.CAR1, CELL_TYPE.START_STOP));
                    break;
                case '2':
                    row.push(new Cell(x, y, CELL_TYPE.CAR2, CELL_TYPE.START_STOP));
                    break;
                case '3':
                    row.push(new Cell(x, y, CELL_TYPE.CAR3, CELL_TYPE.START_STOP));
                    break;
                case '4':
                    row.push(new Cell(x, y, CELL_TYPE.CAR4, CELL_TYPE.START_STOP));
                    break;
                default:
                case 'x':
                case 'X':
                    row.push(new Cell(x, y, CELL_TYPE.OFFTRACK));
                    break;
            }
        }

        // fill unmarked cells as offtrack
        let x = row.length;
        while(x < COLS) {
            row.push(new Cell(x, y, CELL_TYPE.OFFTRACK));
            ++x;
        }

        if (row.length !== COLS) {
            throw "Invalid track row.";
        }

        return row;
    }
}
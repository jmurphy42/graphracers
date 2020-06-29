import {CELL_TYPE, COLS, ROWS, IPoint, BLOCK_SIZE, COLOR} from '../../consts'
import { Cell } from './cell';
import { Track } from './track';
import { Logger } from '../logger';

export class Tracks {

    public static getPlayer(track: Track, num: number): Cell {
        let player = track.getAllCellsThat(cell => Number(cell.type) === num);
        return player.length > 0 ? player[0] : null;
    }

    public static getPlayerSpeed(previousCell: Cell, currentCell: Cell): number {
        let deltaX = 0;
        let deltaY = 0;
        if (previousCell) {
            deltaX = currentCell.x - previousCell.x;
            deltaY = currentCell.y - previousCell.y;
        }
        
        return deltaX === 0 && deltaY === 0 ? 0 : Math.round(Math.sqrt(deltaX * deltaX + deltaY * deltaY) * 10) / 10.0;
    }

    public static getCellsBetweenTwoCells(track: Track, cellA: Cell, cellB: Cell, log: boolean = false): Cell[] {
        const minXCell = cellA.x < cellB.x ? cellA : cellB;
        const maxXCell = cellA.x > cellB.x ? cellA : cellB;
        const minYCell = cellA.y < cellB.y ? cellA : cellB;
        const maxYCell = cellA.y > cellB.y ? cellA : cellB;
        const range = track.getAllCellsThat(cell => cell.x >= minXCell.x && cell.x <= maxXCell.x && cell.y >= minYCell.y && cell.y <= maxYCell.y);
        let trajCells: Cell[] = [];

        let line: IPoint[] = [];
        let slope: number = (maxXCell.y - minXCell.y) / (maxXCell.x - minXCell.x + 0.0);
        if (maxXCell.x === minXCell.x) {
            if (maxYCell.y === minYCell.y) {
                Logger.verbose(`No change in cells.`);
            } else {
                for (let pxy = minYCell.centerPoint.y; pxy < maxYCell.centerPoint.y; pxy++) { // for every y pixel between the center points
                    let pxx = minXCell.centerPoint.x;
                    line.push({ x: pxx, y: pxy });
                }
            }
        } else {
            for (let pxx = minXCell.centerPoint.x; pxx < maxXCell.centerPoint.x; pxx++) { // for every x pixel between the center points
                let pxy = Math.round(minXCell.centerPoint.y + slope * (pxx - minXCell.centerPoint.x));
                line.push({ x: pxx, y: pxy });
            }
        }

        if (log) {
            const lineStr: string[] = [];
            line.forEach(pt => lineStr.push(`${pt.x},${pt.y}`));
            Logger.verbose("LINE: " + lineStr.join("; "));
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

        if (log) {
            const trajCellsStr: string[] = [];
            trajCells.forEach(c => trajCellsStr.push(`${c}`));
            Logger.verbose("TRAJECTORY CELLS: " + trajCellsStr.join("; "));
        }

        return trajCells;
    }

    public static addPlayerActionsToTrack(track: Track, previousCell: Cell, currentCell: Cell) {
        const allTrajectoryCells = this.getPlayerTrajectoryCells(track, previousCell, currentCell);
        const legalTrajectoryCells = this.getLegalPlayerTrajectoryCells(track, previousCell, currentCell);

        track.toTheseCells(allTrajectoryCells, cell => {
            if (Tracks.isLegalCellType(cell) && legalTrajectoryCells.indexOf(cell) > -1) {
                if (cell.type === CELL_TYPE.CAR1 || cell.type === CELL_TYPE.CAR2 || cell.type === CELL_TYPE.CAR3 || cell.type === CELL_TYPE.CAR4) {
                    // TODO: handle when target has a car
                } else {
                    cell.type = CELL_TYPE.TARGET;
                }
            } else {
                if (cell.type === CELL_TYPE.CAR1 || cell.type === CELL_TYPE.CAR2 || cell.type === CELL_TYPE.CAR3 || cell.type === CELL_TYPE.CAR4) {
                    // TODO: handle when target has a car
                } else if (cell.basetype === CELL_TYPE.TRACK) {
                    cell.type = CELL_TYPE.TRACK_CRASH_TARGET;
                } else {
                    cell.type = CELL_TYPE.CRASH_TARGET;
                }
            }
        });
    }

    public static getPlayerTrajectoryCells(track: Track, previousCell: Cell, currentCell: Cell): Cell[] {
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

        return track.getAllCellsThat(cell => {
            if (cell.x >= minX && cell.x <= maxX && cell.y >= minY && cell.y <= maxY) {
                if ((cell.x === previousCell.x && cell.y === previousCell.y) || (cell.x === currentCell.x && cell.y === currentCell.y)) {
                    return false; // don't include the current and target cells in the trajectory cells used to weed out possible targets
                }
                return true;
            }
            return false;
        });
    }

    public static getLegalPlayerTrajectoryCells(track: Track, previousCell: Cell, currentCell: Cell): Cell[] {
        let legalTrajectoryCells: Cell[] = [];
        let trajectoryCells: Cell[] = Tracks.getPlayerTrajectoryCells(track, previousCell, currentCell);
        trajectoryCells.forEach(cell => {
            const cellsBetween = Tracks.getCellsBetweenTwoCells(track, currentCell, cell);
            let legal = true;
            cellsBetween.forEach(cb => {
                if (!Tracks.isLegalCellType(cb)) {
                    legal = cell.basetype === CELL_TYPE.OFFTRACK; // still legal if it's a crash
                }
            });
            if (legal) {
                legalTrajectoryCells.push(cell);
            }
        });
        return legalTrajectoryCells;
    }

    public static isLegalCellType(cell: Cell) {
        return cell.basetype === CELL_TYPE.TRACK
               || cell.basetype === CELL_TYPE.START_STOP
               || cell.basetype === CELL_TYPE.CHECK_POINT1
               || cell.basetype === CELL_TYPE.CHECK_POINT2
               || cell.basetype === CELL_TYPE.CHECK_POINT3;
    }

    public static doesTrajectoryIncludeFinishLine(track: Track, previousCell: Cell, currentCell: Cell): boolean {
        return Tracks.doesTrajectoryIncludeCheckPoint(track, previousCell, currentCell) === 0;
    }

    public static doesTrajectoryIncludeCheckPointNumber(track: Track, previousCell: Cell, currentCell: Cell, checkpoint: number): boolean {
        return Tracks.doesTrajectoryIncludeCheckPoint(track, previousCell, currentCell) === checkpoint;
    }

    /**
     * Returns number of crossed checkpoint, where 0 is finish line and -1 is none.
     */
    public static doesTrajectoryIncludeCheckPoint(track: Track, previousCell: Cell, currentCell: Cell): number {
        const cellsBetween = Tracks.getCellsBetweenTwoCells(track, previousCell, currentCell);
        let checkpoint = -1;
        cellsBetween.forEach(cb => {
            if (cb.basetype === CELL_TYPE.START_STOP) {
                checkpoint = 0;
            } else if (cb.basetype === CELL_TYPE.CHECK_POINT1) {
                checkpoint = 1;
            } else if (cb.basetype === CELL_TYPE.CHECK_POINT2) {
                checkpoint = 2;
            } else if (cb.basetype === CELL_TYPE.CHECK_POINT3) {
                checkpoint = 3;
            }
        });
        return checkpoint;
    }

    public static getTrackOne(): Track {
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
        track.push(this.getTrackRow(16, 'XX......XXXX......XXX.......XXXXXXqqqqqX'));
        track.push(this.getTrackRow(17, 'XX......XXXX.................XXXXX.....X'));
        track.push(this.getTrackRow(18, 'XX.....XXXXXX................XXXXX.....X'));
        track.push(this.getTrackRow(19, 'XXwwwwwXXXXXX................XXXX......X'));
        track.push(this.getTrackRow(20, 'XX.....XXXXXX...............XXXXX......X'));
        track.push(this.getTrackRow(21, 'XX......XXXXX...............XXXX......XX'));
        track.push(this.getTrackRow(22, 'XXX......XXXXX.............XXXX.......XX'));
        track.push(this.getTrackRow(23, 'XXXX.......XXXX...........XXX........XXX'));
        track.push(this.getTrackRow(24, 'XXXXX.......XXXX.......XXXXX........XXXX'));
        track.push(this.getTrackRow(25, 'XXXXXXX.......XXXXXXXXXXXXXX.......XXXXX'));
        track.push(this.getTrackRow(26, 'XXXXXXXX.......XXXXXXXXXXXXX......XXXXXX'));
        track.push(this.getTrackRow(27, 'XXXXXX........XXXXXXXXXXXXXX......XXXXXX'));
        track.push(this.getTrackRow(28, 'XXXX........XXXXXXXXXXXXXXXX.......XXXXX'));
        track.push(this.getTrackRow(29, 'XXX.......XXXXXXXXXXXXXXXXXXX.......XXXX'));
        track.push(this.getTrackRow(30, 'XX.......XXXXXXXXXXXXXXXXXXXXXX.......XX'));
        track.push(this.getTrackRow(31, 'XX.......XXXXXXXXXXXXXXXXXXXXXX.......XX'));
        track.push(this.getTrackRow(32, 'XX........XXXXXXXXXXXXXXXXXXX.........XX'));
        track.push(this.getTrackRow(33, 'XX.....................S..............XX'));
        track.push(this.getTrackRow(34, 'XXX....................3.............XXX'));
        track.push(this.getTrackRow(35, 'XXXX...................1............XXXX'));
        track.push(this.getTrackRow(36, 'XXXXXXX................2.........XXXXXXX'));
        track.push(this.getTrackRow(37, 'XXXXXXXXXX.............4......XXXXXXXXXX'));
        track.push(this.getTrackRow(38, 'XXXXXXXXXXXXXX.........S..XXXXXXXXXXXXXX'));
        track.push(this.getTrackRow(39, 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'));

        track[32][23].text = "🡢"; // 🡠 🡢 🡡 🡣 🡤 🡥 🡦 🡧
        track[39][23].text = "🡢";
        track[8][32].text = "🡡";
        track[8][39].text = "🡡";
        track[12][4].text = "🡣";
        track[12][9].text = "🡣";
        track[16][33].text = "1";
        track[16][39].text = "1";
        track[16][33].textColor = COLOR.BLUE;
        track[16][39].textColor = COLOR.BLUE;
        track[19][1].text = "2";
        track[19][7].text = "2";
        track[19][1].textColor = COLOR.YELLOW;
        track[19][7].textColor = COLOR.YELLOW;
        track[27][17].text = "R";
        track[27][19].text = "I";
        track[27][21].text = "V";
        track[27][23].text = "E";
        track[27][25].text = "R";
        track[29][18].text = "W";
        track[29][20].text = "I";
        track[29][22].text = "L";
        track[29][24].text = "D";
        track[27][17].textColor = COLOR.GREEN;
        track[27][19].textColor = COLOR.GREEN;
        track[27][21].textColor = COLOR.GREEN;
        track[27][23].textColor = COLOR.GREEN;
        track[27][25].textColor = COLOR.GREEN;
        track[29][18].textColor = COLOR.GREEN;
        track[29][20].textColor = COLOR.GREEN;
        track[29][22].textColor = COLOR.GREEN;
        track[29][24].textColor = COLOR.GREEN;

        return new Track(track, 2);
    }

    public static getTrackTwo(): Track {
        const track: Cell[][] = [];

        track.push(this.getTrackRow(0,  'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'));
        track.push(this.getTrackRow(1,  'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'));
        track.push(this.getTrackRow(2,  'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'));
        track.push(this.getTrackRow(3,  'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'));
        track.push(this.getTrackRow(4,  'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'));
        track.push(this.getTrackRow(5,  'XXXXXXXXX......................XXXXXXXXX'));
        track.push(this.getTrackRow(6,  'XXXXXX............................XXXXXX'));
        track.push(this.getTrackRow(7,  'XXXX................................XXXX'));
        track.push(this.getTrackRow(8,  'XXX..................................XXX'));
        track.push(this.getTrackRow(9,  'XXX..................................XXX'));
        track.push(this.getTrackRow(10, 'XX....................................XX'));
        track.push(this.getTrackRow(11, 'XX...........XXXXXXXXXXXXXX...........XX'));
        track.push(this.getTrackRow(12, 'XX........XXXXXXXXXXXXXXXXXXXX........XX'));
        track.push(this.getTrackRow(13, 'X........XXXXXXXXXXXXXXXXXXXXXX........X'));
        track.push(this.getTrackRow(14, 'X.......XXXXXXXXXXXXXXXXXXXXXXXX.......X'));
        track.push(this.getTrackRow(15, 'X.......XXXXXXXXXXXXXXXXXXXXXXXX.......X'));
        track.push(this.getTrackRow(16, 'X......XXXXXXXXXXXXXXXXXXXXXXXXXX......X'));
        track.push(this.getTrackRow(17, 'X......XXXXXXXXXXXXXXXXXXXXXXXXXX......X'));
        track.push(this.getTrackRow(18, 'X......XXXXXXXXXXXXXXXXXXXXXXXXXX......X'));
        track.push(this.getTrackRow(19, 'XwwwwwwXXXXXXXXXXXXXXXXXXXXXXXXXXqqqqqqX'));
        track.push(this.getTrackRow(20, 'X......XXXXXXXXXXXXXXXXXXXXXXXXXX......X'));
        track.push(this.getTrackRow(21, 'X......XXXXXXXXXXXXXXXXXXXXXXXXXX......X'));
        track.push(this.getTrackRow(22, 'X......XXXXXXXXXXXXXXXXXXXXXXXXXX......X'));
        track.push(this.getTrackRow(23, 'X......XXXXXXXXXXXXXXXXXXXXXXXXXX......X'));
        track.push(this.getTrackRow(24, 'X.......XXXXXXXXXXXXXXXXXXXXXXXX.......X'));
        track.push(this.getTrackRow(25, 'X.......XXXXXXXXXXXXXXXXXXXXXXXX.......X'));
        track.push(this.getTrackRow(26, 'X........XXXXXXXXXXXXXXXXXXXXXX........X'));
        track.push(this.getTrackRow(27, 'XX........XXXXXXXXXXXXXXXXXXXX........XX'));
        track.push(this.getTrackRow(28, 'XX...........XXXXXXXXXXXXXX...........XX'));
        track.push(this.getTrackRow(29, 'XX.....................S..............XX'));
        track.push(this.getTrackRow(30, 'XXX....................3.............XXX'));
        track.push(this.getTrackRow(31, 'XXX....................1.............XXX'));
        track.push(this.getTrackRow(32, 'XXXX...................2............XXXX'));
        track.push(this.getTrackRow(33, 'XXXXXX.................4..........XXXXXX'));
        track.push(this.getTrackRow(34, 'XXXXXXXXX..............S.......XXXXXXXXX'));
        track.push(this.getTrackRow(35, 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'));
        track.push(this.getTrackRow(36, 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'));
        track.push(this.getTrackRow(37, 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'));
        track.push(this.getTrackRow(38, 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'));
        track.push(this.getTrackRow(39, 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'));

        track[35][23].text = "🡢"; // 🡠 🡢 🡡 🡣 🡤 🡥 🡦 🡧
        track[28][23].text = "🡢";
        track[4][17].text = "🡠";
        track[11][17].text = "🡠";
        track[19][32].text = "1";
        track[19][39].text = "1";
        track[19][32].textColor = COLOR.BLUE;
        track[19][39].textColor = COLOR.BLUE;
        track[19][0].text = "2";
        track[19][7].text = "2";
        track[19][0].textColor = COLOR.YELLOW;
        track[19][7].textColor = COLOR.YELLOW;
        track[18][16].text = "D";
        track[18][18].text = "O";
        track[18][20].text = "N";
        track[18][22].text = "U";
        track[18][24].text = "T";
        track[21][17].text = "H";
        track[21][19].text = "O";
        track[21][21].text = "L";
        track[21][23].text = "E";
        track[18][16].textColor = COLOR.GREEN;
        track[18][18].textColor = COLOR.GREEN;
        track[18][20].textColor = COLOR.GREEN;
        track[18][22].textColor = COLOR.GREEN;
        track[18][24].textColor = COLOR.GREEN;
        track[21][17].textColor = COLOR.GREEN;
        track[21][19].textColor = COLOR.GREEN;
        track[21][21].textColor = COLOR.GREEN;
        track[21][23].textColor = COLOR.GREEN;

        return new Track(track, 2);
    }

    public static getTrackThree(): Track {
        const track: Cell[][] = [];

        track.push(this.getTrackRow(0,  'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'));
        track.push(this.getTrackRow(1,  'XXXXXXXXXXXXXXXXXXXXXXXXXXX......XXXXXXX'));
        track.push(this.getTrackRow(2,  'XXXXXXXXXXXXXXXXXXXXXXXXX...........XXXX'));
        track.push(this.getTrackRow(3,  'XXXXXX.......w.XXXXXXXXX..............XX'));
        track.push(this.getTrackRow(4,  'XXXX.........w...XXXXXX...............XX'));
        track.push(this.getTrackRow(5,  'XXX..........w.....XXX.................X'));
        track.push(this.getTrackRow(6,  'XXX..........w.........................X'));
        track.push(this.getTrackRow(7,  'XXX..........w................XX.......X'));
        track.push(this.getTrackRow(8,  'XXX..........XXX.............XXXX......X'));
        track.push(this.getTrackRow(9,  'XXX........XXXXXXX.........XXXXXX......X'));
        track.push(this.getTrackRow(10, 'XXX........XXXXXXXXX.....XXXXXXX......XX'));
        track.push(this.getTrackRow(11, 'XXX........XXXXXXXXXXXXXXXXXXXX.......XX'));
        track.push(this.getTrackRow(12, 'XXXX.........XXXXXXXXXXXXXXXXX.......XXX'));
        track.push(this.getTrackRow(13, 'XXXXX...........XXXXXXXXXXXXX........XXX'));
        track.push(this.getTrackRow(14, 'XXXXXXX...........XXXXXXXXXX........XXXX'));
        track.push(this.getTrackRow(15, 'XXXXXXXXXX..........XXXXXXX........XXXXX'));
        track.push(this.getTrackRow(16, 'XXXXXXXXXXXX.........XXXXXX........XXXXX'));
        track.push(this.getTrackRow(17, 'XXXXXXXXXXXXXX........XXXXX.......XXXXXX'));
        track.push(this.getTrackRow(18, 'XXXXXXXXXXXXXXX........XXXXqqqqqqqXXXXXX'));
        track.push(this.getTrackRow(19, 'XXXXXXXXXXXXXXXX.......XXXX.......XXXXXX'));
        track.push(this.getTrackRow(20, 'XXXXXXXXXXXXXXXXX.......XXX........XXXXX'));
        track.push(this.getTrackRow(21, 'XXXX.......XXXXXXX......XXXX........XXXX'));
        track.push(this.getTrackRow(22, 'XX...........XXXXXX......XXX.........XXX'));
        track.push(this.getTrackRow(23, 'X..............XXXX.......XXX.........XX'));
        track.push(this.getTrackRow(24, 'X................XX........XXX........XX'));
        track.push(this.getTrackRow(25, 'X.................e........XXXXX.......X'));
        track.push(this.getTrackRow(26, 'X......XXX........e........XXXXXX......X'));
        track.push(this.getTrackRow(27, 'X......XXXX.......e........XXXXXXX.....X'));
        track.push(this.getTrackRow(28, 'X.......XXXX......e.......XXXXXXXX.....X'));
        track.push(this.getTrackRow(29, 'X.......XXXXXX....e.......XXXXXXX......X'));
        track.push(this.getTrackRow(30, 'X........XXXXXX...e......XXXXXXX.......X'));
        track.push(this.getTrackRow(31, 'XX........XXXXXXXXXXXXXXXXXXXXX.......XX'));
        track.push(this.getTrackRow(32, 'XX...........XXXXXXXXXXXXXXXX.........XX'));
        track.push(this.getTrackRow(33, 'XX.......................S...........XXX'));
        track.push(this.getTrackRow(34, 'XXX......................3...........XXX'));
        track.push(this.getTrackRow(35, 'XXX......................1..........XXXX'));
        track.push(this.getTrackRow(36, 'XXXX.....................2.........XXXXX'));
        track.push(this.getTrackRow(37, 'XXXXXX...................4.......XXXXXXX'));
        track.push(this.getTrackRow(38, 'XXXXXXXXX................S.....XXXXXXXXX'));
        track.push(this.getTrackRow(39, 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'));

        track[32][25].text = "🡢"; // 🡠 🡢 🡡 🡣 🡤 🡥 🡦 🡧
        track[39][25].text = "🡢";
        track[10][2].text = "🡣";
        track[10][11].text = "🡣";
        track[8][32].text = "🡤";
        track[2][36].text = "🡤";
        track[18][26].text = "1";
        track[18][34].text = "1";
        track[18][26].textColor = COLOR.BLUE;
        track[18][34].textColor = COLOR.BLUE;
        track[8][13].text = "2";
        track[2][13].text = "2";
        track[8][13].textColor = COLOR.YELLOW;
        track[2][13].textColor = COLOR.YELLOW;
        track[24][18].text = "3";
        track[31][18].text = "3";
        track[24][18].textColor = COLOR.PURPLE;
        track[31][18].textColor = COLOR.PURPLE;
        track[17][2].text = "C";
        track[17][3].text = "A";
        track[17][4].text = "P";
        track[17][5].text = "T";
        track[17][6].text = "A";
        track[17][7].text = "I";
        track[17][8].text = "N";
        track[18][2].text = "H";
        track[18][4].text = "O";
        track[18][6].text = "O";
        track[18][8].text = "K";
        track[17][2].textColor = COLOR.GREEN;
        track[17][3].textColor = COLOR.GREEN;
        track[17][4].textColor = COLOR.GREEN;
        track[17][5].textColor = COLOR.GREEN;
        track[17][6].textColor = COLOR.GREEN;
        track[17][7].textColor = COLOR.GREEN;
        track[17][8].textColor = COLOR.GREEN;
        track[18][2].textColor = COLOR.GREEN;
        track[18][4].textColor = COLOR.GREEN;
        track[18][6].textColor = COLOR.GREEN;
        track[18][8].textColor = COLOR.GREEN;

        return new Track(track, 3);
    }

    public static getTrackFour(): Track {
        const track: Cell[][] = [];

        track.push(this.getTrackRow(0,  'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'));
        track.push(this.getTrackRow(1,  'XXXXXXXXXXXXXXXXXXX..............XXXXXXX'));
        track.push(this.getTrackRow(2,  'XXXXXXXXXXXXX.......................XXXX'));
        track.push(this.getTrackRow(3,  'XXXXXXXXX.............................XX'));
        track.push(this.getTrackRow(4,  'XXXXXX................................XX'));
        track.push(this.getTrackRow(5,  'XXXXX......................XXXXX.......X'));
        track.push(this.getTrackRow(6,  'XXXX..................XXXXXXXXXXX......X'));
        track.push(this.getTrackRow(7,  'XXX..............XXXXXXXXXXXXXXX.......X'));
        track.push(this.getTrackRow(8,  'XXX..........XXXXXXXXXXXX..............X'));
        track.push(this.getTrackRow(9,  'XXX........XXXXXXXXXXX.................X'));
        track.push(this.getTrackRow(10, 'XXX........XXXXXXXXX..................XX'));
        track.push(this.getTrackRow(11, 'XXX........XXXXXXXX.................XXXX'));
        track.push(this.getTrackRow(12, 'XXXX........XXXXXX................XXXXXX'));
        track.push(this.getTrackRow(13, 'XXXXX........XXXX.............XXXXXXXXXX'));
        track.push(this.getTrackRow(14, 'XXXXXXX.......XXX.........XXXXXXXXXXXXXX'));
        track.push(this.getTrackRow(15, 'XXXXXXXXX......XX.......XXXXXXXXXXXXXXXX'));
        track.push(this.getTrackRow(16, 'XXXXXXXXXwwwwwwXXqqqqqqXXXXXXXXXXXXXXXXX'));
        track.push(this.getTrackRow(17, 'XXXXXXXX.......XX......XXXX.......XXXXXX'));
        track.push(this.getTrackRow(18, 'XXXXX..........XXX......XX..........XXXX'));
        track.push(this.getTrackRow(19, 'XXXX...........XXX...................XXX'));
        track.push(this.getTrackRow(20, 'XXX...........XXXXX...................XX'));
        track.push(this.getTrackRow(21, 'XX..........XXXXXXXX..................XX'));
        track.push(this.getTrackRow(22, 'XX.......XXXXXXXXXXXX........XXX.......X'));
        track.push(this.getTrackRow(23, 'X.......XXXXXXXXXXXXXX......XXXXX......X'));
        track.push(this.getTrackRow(24, 'X.......XXXXXXXXXXXXXXXXXXXXXXXXX......X'));
        track.push(this.getTrackRow(25, 'X......XXXXXXXXXXXXXXXXXXXXXXXXXX......X'));
        track.push(this.getTrackRow(26, 'X......XXXXXXXXXXXXXXXXXXXXXXXXXX......X'));
        track.push(this.getTrackRow(27, 'X......XXXXXXXXXXXXXXXXXXXXXXXXX.......X'));
        track.push(this.getTrackRow(28, 'X......XXXXXXXXXXXXXXXXXXXXXXXXX......XX'));
        track.push(this.getTrackRow(29, 'X......XXXXXXXXXXXXXXXXXXXXXXXX.......XX'));
        track.push(this.getTrackRow(30, 'X......XXXXXXX......S...XXXXXXX.......XX'));
        track.push(this.getTrackRow(31, 'XX......XXXX........3......XXX........XX'));
        track.push(this.getTrackRow(32, 'XX..................1................XXX'));
        track.push(this.getTrackRow(33, 'XX..................2................XXX'));
        track.push(this.getTrackRow(34, 'XXX.................4................XXX'));
        track.push(this.getTrackRow(35, 'XXX.................S...............XXXX'));
        track.push(this.getTrackRow(36, 'XXXX.............XXXXXX.............XXXX'));
        track.push(this.getTrackRow(37, 'XXXXX..........XXXXXXXXX...........XXXXX'));
        track.push(this.getTrackRow(38, 'XXXXXXXX.....XXXXXXXXXXXXX........XXXXXX'));
        track.push(this.getTrackRow(39, 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'));

        track[29][20].text = "🡢"; // 🡠 🡢 🡡 🡣 🡤 🡥 🡦 🡧
        track[36][20].text = "🡢";
        track[0][28].text = "🡠";
        track[5][28].text = "🡠";
        track[23][8].text = "🡧";
        track[18][4].text = "🡧";
        track[16][16].text = "1";
        track[16][23].text = "1";
        track[16][16].textColor = COLOR.BLUE;
        track[16][23].textColor = COLOR.BLUE;
        track[16][8].text = "2";
        track[16][15].text = "2";
        track[16][8].textColor = COLOR.YELLOW;
        track[16][15].textColor = COLOR.YELLOW;
        track[26][14].text = "A";
        track[26][15].text = "M";
        track[26][16].text = "P";
        track[26][17].text = "E";
        track[26][18].text = "R";
        track[26][20].text = "S";
        track[26][21].text = "A";
        track[26][22].text = "N";
        track[26][23].text = "D";
        track[26][24].text = "Y";
        track[26][14].textColor = COLOR.GREEN;
        track[26][15].textColor = COLOR.GREEN;
        track[26][16].textColor = COLOR.GREEN;
        track[26][17].textColor = COLOR.GREEN;
        track[26][18].textColor = COLOR.GREEN;
        track[26][20].textColor = COLOR.GREEN;
        track[26][21].textColor = COLOR.GREEN;
        track[26][22].textColor = COLOR.GREEN;
        track[26][23].textColor = COLOR.GREEN;
        track[26][24].textColor = COLOR.GREEN;

        return new Track(track, 2);
    }

    public static getTrackFive(): Track {
        const track: Cell[][] = [];

        track.push(this.getTrackRow(0,  'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'));
        track.push(this.getTrackRow(1,  'XXXXXXXXXXXXXXXXXXXXXXXXXX......XXXXXXXX'));
        track.push(this.getTrackRow(2,  'XXXXXXX.......XXXXXXXXX............XXXXX'));
        track.push(this.getTrackRow(3,  'XXXX..............XXX................XXX'));
        track.push(this.getTrackRow(4,  'XXX...................................XX'));
        track.push(this.getTrackRow(5,  'XX.........................XXXX.......XX'));
        track.push(this.getTrackRow(6,  'XX.......................XXXXXXX.......X'));
        track.push(this.getTrackRow(7,  'X........XXXX...........XXXXXXXXX......X'));
        track.push(this.getTrackRow(8,  'X.......XXXXXXXXX.....XXXXXXXXXXXeeeeeeX'));
        track.push(this.getTrackRow(9,  'X......XXXXXXXXXXXXXXXXXXXXXXXXXX......X'));
        track.push(this.getTrackRow(10, 'XwwwwwwXXXXXXXXXXXXXXXXXXXXXXXXX.......X'));
        track.push(this.getTrackRow(11, 'X......XXXXXXXXXXXXXXXXXXXXXXX........XX'));
        track.push(this.getTrackRow(12, 'X.......XXXXXXXXXXXXXXXXXXXX..........XX'));
        track.push(this.getTrackRow(13, 'X.......XXXXXXXXXXXXXXXXXX...........XXX'));
        track.push(this.getTrackRow(14, 'X........XXXXXXXXXXXXXXX...........XXXXX'));
        track.push(this.getTrackRow(15, 'X.........XXXXXXXXXXXX..........XXXXXXXX'));
        track.push(this.getTrackRow(16, 'XX.........XXXXXXXXX..........XXXXXXXXXX'));
        track.push(this.getTrackRow(17, 'XXX..........XXXXX..........XXXXXXXXXXXX'));
        track.push(this.getTrackRow(18, 'XXXX..........XX..........XXXXXXXXXXXXXX'));
        track.push(this.getTrackRow(19, 'XXXXXX..................XXXXXXXXXXXXXXXX'));
        track.push(this.getTrackRow(20, 'XXXXXXXX..............XXXXXXXXXXXXXXXXXX'));
        track.push(this.getTrackRow(21, 'XXXXXXXXXX...............XXXXXXXXXXXXXXX'));
        track.push(this.getTrackRow(22, 'XXXXXXXX....................XXXXXXXXXXXX'));
        track.push(this.getTrackRow(23, 'XXXXXX..........XX.............XXXXXXXXX'));
        track.push(this.getTrackRow(24, 'XXXX..........XXXXXX..............XXXXXX'));
        track.push(this.getTrackRow(25, 'XXX.........XXXXXXXXXXX..............XXX'));
        track.push(this.getTrackRow(26, 'XX........XXXXXXXXXXXXXXXX............XX'));
        track.push(this.getTrackRow(27, 'X........XXXXXXXXXXXXXXXXXXX...........X'));
        track.push(this.getTrackRow(28, 'X.......XXXXXXXXXXXXXXXXXXXXXX.........X'));
        track.push(this.getTrackRow(29, 'X......XXXXXXXXXXXXXXXXXXXXXXXXqqqqqqqqX'));
        track.push(this.getTrackRow(30, 'X......XXXXXXXXXXXXXXXXXXXXXXXX........X'));
        track.push(this.getTrackRow(31, 'X.......XXXXXXXXXXXXXXXXXXXXXX.........X'));
        track.push(this.getTrackRow(32, 'X.........XXXXXXXXXXXXXXXXXX...........X'));
        track.push(this.getTrackRow(33, 'X....................S................XX'));
        track.push(this.getTrackRow(34, 'XX...................3................XX'));
        track.push(this.getTrackRow(35, 'XXX..................1...............XXX'));
        track.push(this.getTrackRow(36, 'XXXXX................2.............XXXXX'));
        track.push(this.getTrackRow(37, 'XXXXXXXX.............4..........XXXXXXXX'));
        track.push(this.getTrackRow(38, 'XXXXXXXXXXXXX........S......XXXXXXXXXXXX'));
        track.push(this.getTrackRow(39, 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'));

        track[32][21].text = "🡢"; // 🡠 🡢 🡡 🡣 🡤 🡥 🡦 🡧
        track[39][21].text = "🡢";
        track[25][22].text = "🡤";
        track[21][25].text = "🡤";
        track[18][26].text = "🡧";
        track[14][23].text = "🡧";
        track[3][19].text = "🡢";
        track[9][19].text = "🡢";
        track[29][30].text = "1";
        track[29][39].text = "1";
        track[29][30].textColor = COLOR.BLUE;
        track[29][39].textColor = COLOR.BLUE;
        track[10][0].text = "2";
        track[10][7].text = "2";
        track[10][0].textColor = COLOR.YELLOW;
        track[10][7].textColor = COLOR.YELLOW;
        track[8][32].text = "3";
        track[8][39].text = "3";
        track[8][32].textColor = COLOR.PURPLE;
        track[8][39].textColor = COLOR.PURPLE;
        track[29][14].text = "L";
        track[29][15].text = "U";
        track[29][16].text = "C";
        track[29][17].text = "K";
        track[29][18].text = "Y";
        track[29][20].text = "8";
        track[29][21].text = "S";
        track[29][14].textColor = COLOR.GREEN;
        track[29][15].textColor = COLOR.GREEN;
        track[29][16].textColor = COLOR.GREEN;
        track[29][17].textColor = COLOR.GREEN;
        track[29][18].textColor = COLOR.GREEN;
        track[29][20].textColor = COLOR.GREEN;
        track[29][21].textColor = COLOR.GREEN;

        return new Track(track, 3);
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
                case 'q':
                case 'Q':
                    row.push(new Cell(x, y, CELL_TYPE.CHECK_POINT1));
                    break;
                case 'w':
                case 'W':
                    row.push(new Cell(x, y, CELL_TYPE.CHECK_POINT2));
                    break;
                case 'e':
                case 'E':
                    row.push(new Cell(x, y, CELL_TYPE.CHECK_POINT3));
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
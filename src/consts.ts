export const BASE_WIDTH = 1050;
export const BASE_HEIGHT = 800;
export const COLS = 40;
export const ROWS = 40;
export const BLOCK_SIZE = 20;
export enum CELL_TYPE {
    OFFTRACK = 'X',
    TRACK = '.',
    START_STOP = 'S',
    CHECK_POINT1 = 'q',
    CHECK_POINT2 = 'w',
    CHECK_POINT3 = 'e',
    TARGET = 'T',
    TRACK_CRASH_TARGET = '@',
    CRASH_TARGET = '!',
    SEVERE_CRASH_TARGET = '*',
    CAR1 = '1',
    CAR2 = '2',
    CAR3 = '3',
    CAR4 = '4'
};
export enum COLOR {
    BLACK = '#000000',
    BLACK_HOVER = '#080808',
    WHITE = '#FFFFFF',
    WHITE_HOVER = '#FFFFFF',
    LTGRAY = '#CCCCCC',
    LTGRAY_HOVER = '#DDDDDD',
    GRAY = '#AAAAAA',
    GRAY_HOVER = '#BBBBBB',
    MIDGRAY = '#888888',
    MIDGRAY_HOVER = '#999999',
    DARKGRAY = '#444444',
    DARKGRAY_HOVER = '#555555',
    GREEN = '#338800',
    GREEN_HOVER = '#55aa22',
    VRED = '#EE1111',
    VRED_HOVER = '#FF2222',
    RED = '#CC3333',
    RED_HOVER = '#EE5555',
    SEMIRED = '#BB6633',
    SEMIRED_HOVER = '#DD8855',
    BLUE = '#5577DD',
    BLUE_HOVER = '#7799FF',
    YELLOW = '#888800',
    YELLOW_HOVER = '#AAAA22',
    PURPLE = '#8855DD',
    PURPLE_HOVER = '#AA77FF',
    ORANGE = '#DD7733',
    ORANGE_HOVER = '#FF9955',
    INVALID_TRACK = '#FF0000'
};
export enum STATE {
    NOGAME,
    PREGAME,
    GAME,
    ENDGAME
}
export interface IPoint {
    x: number;
    y: number;
}
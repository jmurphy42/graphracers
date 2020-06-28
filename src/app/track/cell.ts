import {CELL_TYPE, COLOR, BLOCK_SIZE, IPoint} from '../../consts'

export class Cell {
    public x: number;
    public y: number;
    public basetype: CELL_TYPE;
    public type: CELL_TYPE;
    public hover: boolean = false;

    constructor(x: number, y: number, type: CELL_TYPE, basetype: CELL_TYPE = null) {
        this.x = x;
        this.y = y;
        this.basetype = basetype ? basetype : type;
        this.type = type;
    }

    public toString(): string {
        return this.code;
    }

    public get code(): string {
        return this.type;
    }

    public get centerPoint(): IPoint {
        return {
            x: this.x * BLOCK_SIZE + BLOCK_SIZE / 2.0,
            y: this.y * BLOCK_SIZE + BLOCK_SIZE / 2.0
        };
    }

    public isPointIn(point: IPoint): boolean {
        const left = this.x * BLOCK_SIZE;
        const right = this.x * BLOCK_SIZE + BLOCK_SIZE;
        const top = this.y * BLOCK_SIZE;
        const bottom = this.y * BLOCK_SIZE + BLOCK_SIZE;
        return point.x > left && point.x < right && point.y > top && point.y < bottom;
    }

    public draw(ctx: CanvasRenderingContext2D) {

        // special finish line pattern
        if (this.type === CELL_TYPE.START_STOP) {
            this.drawFinishLine(ctx);
            return;
        }

        // special car pattern
        if (this.isPlayer) {
            this.drawCar(ctx);            
            return;
        }

        this.drawBasic(ctx, this.hover ? this.colorHover : this.color);
    }

    public get isPlayer(): boolean {
        return this.type === CELL_TYPE.CAR1 || this.type === CELL_TYPE.CAR2 || this.type === CELL_TYPE.CAR3 || this.type === CELL_TYPE.CAR4
    }

    private drawBasic(ctx: CanvasRenderingContext2D, color: string) {
        ctx.fillStyle = color;
        ctx.fillRect(this.x * BLOCK_SIZE, this.y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        if (this.type !== CELL_TYPE.OFFTRACK) { // add grid to track
            ctx.strokeStyle = COLOR.GRAY;
            ctx.strokeRect(this.x * BLOCK_SIZE, this.y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        }
    }

    private drawFinishLine(ctx: CanvasRenderingContext2D) {
        const patternSize = 4.0;
        for (let smY = 0; smY < patternSize; smY++) {
            for (let smX = 0; smX < patternSize; smX++) {
                const blockSize = BLOCK_SIZE / patternSize;
                const xWhite = smX % 2 === 0;
                const yWhite = smY % 2 === 0;
                const isWhite = xWhite == yWhite;
                ctx.fillStyle = isWhite ? (this.hover ? COLOR.WHITE_HOVER : COLOR.WHITE) : (this.hover ? COLOR.DARKGRAY_HOVER : COLOR.DARKGRAY);
                ctx.fillRect(this.x * BLOCK_SIZE + smX * blockSize, this.y * BLOCK_SIZE + smY * blockSize, blockSize, blockSize);
            }
        }
        return;
    }

    private drawCar(ctx: CanvasRenderingContext2D) {

         // Draw background first
         if (this.basetype === CELL_TYPE.START_STOP) {
            this.drawFinishLine(ctx);
        } else {
            this.drawBasic(ctx, this.baseColor);
        }

        // Now draw car
        const patternSize = 8.0;
        const blockSize = BLOCK_SIZE / patternSize;
        for (let smY = 0; smY < patternSize; smY++) {
            for (let smX = 0; smX < patternSize; smX++) {
                const isCar = smY > 0 && smY < 7 && smX > 0 && smX < 7
                              && (smY === 1 ? smX > 1 && smX < 6 : true)
                              && (smY === 6 ? smX > 1 && smX < 6 : true)
                              && (smX === 1 ? smY > 1 && smY < 6 : true)
                              && (smX === 6 ? smY > 1 && smY < 6 : true)
                if (isCar) {
                    ctx.strokeStyle = this.hover ? this.colorHover : this.color;
                    ctx.fillStyle = this.hover ? this.colorHover : this.color;
                    ctx.fillRect(this.x * BLOCK_SIZE + smX * blockSize, this.y * BLOCK_SIZE + smY * blockSize, blockSize, blockSize);
                }
            }
        }
    }

    private get color(): string {
        switch (this.type) {
            case CELL_TYPE.OFFTRACK:
                return COLOR.BLACK;
            case CELL_TYPE.TRACK:
                return COLOR.LTGRAY;
            case CELL_TYPE.START_STOP:
                return COLOR.MIDGRAY;
            case CELL_TYPE.TARGET:
                return COLOR.GREEN;
            case CELL_TYPE.CRASH_TARGET:
                return COLOR.RED;
            case CELL_TYPE.CAR1:
                return COLOR.BLUE;
            case CELL_TYPE.CAR2:
                return COLOR.YELLOW;
            case CELL_TYPE.CAR3:
                return COLOR.PURPLE;
            case CELL_TYPE.CAR4:
                return COLOR.ORANGE;
        }
    }

    private get colorHover(): string {
        switch (this.type) {
            case CELL_TYPE.OFFTRACK:
                return COLOR.BLACK_HOVER;
            case CELL_TYPE.TRACK:
                return COLOR.LTGRAY_HOVER;
            case CELL_TYPE.TARGET:
                return COLOR.GREEN_HOVER;
            case CELL_TYPE.CRASH_TARGET:
                return COLOR.RED_HOVER;
            case CELL_TYPE.CAR1:
                return COLOR.BLUE_HOVER;
            case CELL_TYPE.CAR2:
                return COLOR.YELLOW_HOVER;
            case CELL_TYPE.CAR3:
                return COLOR.PURPLE_HOVER;
            case CELL_TYPE.CAR4:
                return COLOR.ORANGE_HOVER;
            default:
                return this.color;
        }
    }

    private get baseColor(): string {
        switch (this.basetype) {
            case CELL_TYPE.OFFTRACK:
                return COLOR.BLACK;
            case CELL_TYPE.TRACK:
                return COLOR.LTGRAY;
            case CELL_TYPE.START_STOP:
                return COLOR.MIDGRAY;
            case CELL_TYPE.TARGET:
                return COLOR.GREEN;
            case CELL_TYPE.CRASH_TARGET:
                return COLOR.RED;
            case CELL_TYPE.CAR1:
                return COLOR.BLUE;
            case CELL_TYPE.CAR2:
                return COLOR.YELLOW;
            case CELL_TYPE.CAR3:
                return COLOR.PURPLE;
            case CELL_TYPE.CAR4:
                return COLOR.ORANGE;
        }
    }
}
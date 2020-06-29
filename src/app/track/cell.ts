import {CELL_TYPE, COLOR, BLOCK_SIZE, IPoint, COLS, ROWS} from '../../consts'

export class Cell {
    public x: number;
    public y: number;
    public basetype: CELL_TYPE;
    public type: CELL_TYPE;
    public hover: boolean = false;
    public text: string = null;
    public textColor: string = null;

    constructor(x: number, y: number, type: CELL_TYPE, basetype: CELL_TYPE = null) {
        if (x < 0 || x >= COLS) {
            throw `Invalid cell (invalid x ${x})`;
        }
        if (y < 0 || y >= ROWS) {
            throw `Invalid cell (invalid y ${y})`;
        }
        if (type == null) {
            throw `Invalid cell (invalid type ${type})`;
        }
        this.x = x;
        this.y = y;
        this.basetype = basetype ? basetype : type;
        this.type = type;
    }

    public toString(): string {
        return `${this.x},${this.y} (${this.basetype})`;
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
        const left = this.x * BLOCK_SIZE + 2;
        const right = this.x * BLOCK_SIZE + BLOCK_SIZE - 2;
        const top = this.y * BLOCK_SIZE + 2;
        const bottom = this.y * BLOCK_SIZE + BLOCK_SIZE - 2;
        return point.x > left && point.x < right && point.y > top && point.y < bottom;
    }

    public isCheckpoint(): boolean {
        return this.basetype === CELL_TYPE.CHECK_POINT1 ||  this.basetype === CELL_TYPE.CHECK_POINT2 ||  this.basetype === CELL_TYPE.CHECK_POINT3;
    }

    public draw(ctx: CanvasRenderingContext2D) {

        if (this.text && this.type === CELL_TYPE.OFFTRACK) { // for now, only draw text offtrack
            this.drawBasic(ctx, this.hover ? this.colorHover : this.color);
            this.renderText(ctx, this.textColor ? this.textColor : COLOR.LTGRAY);
            return;
        }

        // special finish line pattern
        if (this.type === CELL_TYPE.START_STOP) {
            this.drawFinishLine(ctx);
            return;
        }

        // special checkpoint patterns
        if (this.type === CELL_TYPE.CHECK_POINT1) {
            this.drawCheckPoint(ctx, 1);
            return;
        }
        if (this.type === CELL_TYPE.CHECK_POINT2) {
            this.drawCheckPoint(ctx, 2);
            return;
        }
        if (this.type === CELL_TYPE.CHECK_POINT3) {
            this.drawCheckPoint(ctx, 3);
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
        ctx.lineWidth = 0;
        ctx.fillRect(this.x * BLOCK_SIZE, this.y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        if (this.type !== CELL_TYPE.OFFTRACK) { // add grid to track
            ctx.strokeStyle = COLOR.GRAY;
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x * BLOCK_SIZE, this.y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        }
    }

    private renderText(ctx: CanvasRenderingContext2D, color: string) {
        ctx.font = "bold 14px 'Press Start 2P', monospace";
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.fillText(this.text, this.centerPoint.x, this.centerPoint.y + BLOCK_SIZE / 4);
    }

    private drawFinishLine(ctx: CanvasRenderingContext2D) {
        this.drawCheckeredTrack(ctx, COLOR.DARKGRAY, COLOR.DARKGRAY_HOVER);
    }

    private drawCheckPoint(ctx: CanvasRenderingContext2D, ckpt: number) {
        this.drawBasic(ctx, COLOR.LTGRAY)
        let nonWhite: string = ckpt === 1 ? COLOR.BLUE
                             : ckpt === 2 ? COLOR.YELLOW
                             : ckpt === 3 ? COLOR.PURPLE
                             : COLOR.MIDGRAY;
        let nonWhiteHover: string = ckpt === 1 ? COLOR.BLUE_HOVER
                                  : ckpt === 2 ? COLOR.YELLOW_HOVER
                                  : ckpt === 3 ? COLOR.PURPLE_HOVER
                                  : COLOR.MIDGRAY_HOVER;
        nonWhite = `${nonWhite}80`; // add 50% transparency
        nonWhiteHover = `${nonWhiteHover}80`;
        this.drawCheckeredTrack(ctx, nonWhite, nonWhiteHover);
    }

    private drawCheckeredTrack(ctx: CanvasRenderingContext2D, nonWhite: string, nonWhiteHover: string) {
        const patternSize = 4.0;
        for (let smY = 0; smY < patternSize; smY++) {
            for (let smX = 0; smX < patternSize; smX++) {
                const blockSize = BLOCK_SIZE / patternSize;
                const xWhite = smX % 2 === 0;
                const yWhite = smY % 2 === 0;
                const isWhite = xWhite == yWhite;
                ctx.lineWidth = 0;
                ctx.fillStyle = isWhite ? (this.hover ? COLOR.WHITE_HOVER : COLOR.WHITE) : (this.hover ? nonWhiteHover : nonWhite);
                ctx.fillRect(this.x * BLOCK_SIZE + smX * blockSize, this.y * BLOCK_SIZE + smY * blockSize, blockSize, blockSize);
            }
        }
    }

    private drawCar(ctx: CanvasRenderingContext2D) {

        // Draw background first
        if (this.basetype === CELL_TYPE.START_STOP) {
            this.drawFinishLine(ctx);
        } else if (this.basetype === CELL_TYPE.CHECK_POINT1) {
            this.drawCheckPoint(ctx, 1);
        } else if (this.basetype === CELL_TYPE.CHECK_POINT2) {
            this.drawCheckPoint(ctx, 2);
        } else if (this.basetype === CELL_TYPE.CHECK_POINT3) {
            this.drawCheckPoint(ctx, 3);
        } else {
            this.drawBasic(ctx, this.baseColor);
        }

        // Now draw car
        ctx.strokeStyle = this.hover ? COLOR.DARKGRAY_HOVER : COLOR.DARKGRAY;
        ctx.fillStyle = this.hover ? this.colorHover : this.color;
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.arc(this.centerPoint.x, this.centerPoint.y, BLOCK_SIZE * 3 / 8, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fill();
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
            case CELL_TYPE.TRACK_CRASH_TARGET:
                return COLOR.SEMIRED;
            case CELL_TYPE.CRASH_TARGET:
                return COLOR.RED;
            case CELL_TYPE.SEVERE_CRASH_TARGET:
                return COLOR.VRED;
            case CELL_TYPE.CAR1:
                return COLOR.BLUE;
            case CELL_TYPE.CAR2:
                return COLOR.YELLOW;
            case CELL_TYPE.CAR3:
                return COLOR.PURPLE;
            case CELL_TYPE.CAR4:
                return COLOR.ORANGE;
            default:
                return this.baseColor;
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
            case CELL_TYPE.TRACK_CRASH_TARGET:
                return COLOR.SEMIRED_HOVER;
            case CELL_TYPE.CRASH_TARGET:
                return COLOR.RED_HOVER;
            case CELL_TYPE.SEVERE_CRASH_TARGET:
                return COLOR.VRED_HOVER;
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
            case CELL_TYPE.START_STOP: // These special tracks are just here as a fallback; they're painted special
            case CELL_TYPE.CHECK_POINT1:
            case CELL_TYPE.CHECK_POINT2:
            case CELL_TYPE.CHECK_POINT3:
                return COLOR.MIDGRAY;
            case CELL_TYPE.TARGET: // These targets are just here as a fallback; they shouldn't ever be base colors
                return COLOR.GREEN;
            case CELL_TYPE.TRACK_CRASH_TARGET:
                return COLOR.SEMIRED;
            case CELL_TYPE.CRASH_TARGET:
                return COLOR.RED;
            case CELL_TYPE.SEVERE_CRASH_TARGET:
                return COLOR.VRED;
            case CELL_TYPE.CAR1: // These cars are just here as a fallback; they shouldn't ever be base colors
                return COLOR.BLUE;
            case CELL_TYPE.CAR2:
                return COLOR.YELLOW;
            case CELL_TYPE.CAR3:
                return COLOR.PURPLE;
            case CELL_TYPE.CAR4:
                return COLOR.ORANGE;
            default:
                return COLOR.INVALID_TRACK;
        }
    }
}
export class Logger {

    public static enable: boolean = false;
    public static enableVerbose: boolean = false;

    public static get debounceMs(): number { return this._debounceMs; }
    public static set debounceMs(value: number) {
        if (value < 100) { // reasonable limits are 100-2000ms.
            value = 100;
        }
        if (value > 2000) {
            value = 2000;
        }
        this._debounceMs = value;
    }
    private static _debounceMs: number = 500;

    public static log(msg: string) {
        if (Logger.enable) {
            console.log(msg);
        }
    }

    public static verbose(msg: string) {
        if (Logger.enable && Logger.enableVerbose) {
            console.log(msg);
        }
    }

    private static debounceId: any = null;
    public static debounce(msg: string) {
        if (Logger.enable && Logger.enableVerbose) {
            if (this.debounceId) {
                clearTimeout(this.debounceId);
            }
            this.debounceId = setTimeout(() => {
                console.log(msg);
                this.debounceId = null;
            }, this._debounceMs);
        }
    }
}
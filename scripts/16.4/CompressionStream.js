// ChatGPT
(function () {
    const globals =
        typeof globalThis == 'undefined'
            ? typeof self == 'undefined'
                ? typeof global == 'undefined'
                    ? {}
                    : global
                : self
            : globalThis;

    if (typeof CompressionStream === "undefined") {
        globals.CompressionStream = class CompressionStream {
            constructor(format) {
                if (!["gzip", "deflate"].includes(format)) {
                    throw new TypeError("Supported formats: gzip, deflate");
                }

                let encoder = new pako.Deflate({ gzip: format === "gzip" });
                let done = false;

                const transform = new TransformStream({
                    transform(chunk, controller) {
                        if (done) return;
                        const input = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk);
                        encoder.push(input, false);
                        if (encoder.err) throw new Error("Compression error: " + encoder.msg);
                        if (encoder.result) {
                            controller.enqueue(new Uint8Array(encoder.result));
                            encoder.result = null;
                        }
                    },
                    flush(controller) {
                        done = true;
                        encoder.push(new Uint8Array(0), true);
                        if (encoder.err) throw new Error("Compression error: " + encoder.msg);
                        if (encoder.result) {
                            controller.enqueue(new Uint8Array(encoder.result));
                        }
                    }
                });

                this.readable = transform.readable;
                this.writable = transform.writable;
            }
        };
    }

    if (typeof DecompressionStream === "undefined") {
        globals.DecompressionStream = class DecompressionStream {
            constructor(format) {
                if (!["gzip", "deflate"].includes(format)) {
                    throw new TypeError("Supported formats: gzip, deflate");
                }

                let inflator = new pako.Inflate();
                let done = false;

                const transform = new TransformStream({
                    transform(chunk, controller) {
                        if (done) return;
                        const input = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk);
                        inflator.push(input, false);
                        if (inflator.err) throw new Error("Decompression error: " + inflator.msg);
                        if (inflator.result) {
                            controller.enqueue(new Uint8Array(inflator.result));
                            inflator.result = null;
                        }
                    },
                    flush(controller) {
                        done = true;
                        inflator.push(new Uint8Array(0), true);
                        if (inflator.err) throw new Error("Decompression error: " + inflator.msg);
                        if (inflator.result) {
                            controller.enqueue(new Uint8Array(inflator.result));
                        }
                    }
                });

                this.readable = transform.readable;
                this.writable = transform.writable;
            }
        };
    }
})();

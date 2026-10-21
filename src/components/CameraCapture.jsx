import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";

// A4 sheet 595.28 x 841.89 pt; corner squares are 18 pt, centered 23 pt
// from each edge. Keep in sync with scanning/layout.py.
const PAGE_RATIO = 595.28 / 841.89;
const MARKER_CENTER_X = 23 / 595.28;
const MARKER_CENTER_Y = 23 / 841.89;
const MARKER_SIZE = 18 / 595.28;

const ZONE_HALF = 0.10; // search area around each target (share of frame width)
const TARGET_SCALE = 4; // drawn guide box = marker size x this
const CHECK_MS = 200;
const HOLD_CHECKS = 6;
const ANALYSIS_WIDTH = 640;

function getFrame(w, h) {
    const fw = Math.min(w * 0.94, h * 0.94 * PAGE_RATIO);
    const fh = fw / PAGE_RATIO;
    return { x: (w - fw) / 2, y: (h - fh) / 2, w: fw, h: fh };
}

function cornerCenters(frame) {
    const left = frame.x + MARKER_CENTER_X * frame.w;
    const right = frame.x + frame.w - MARKER_CENTER_X * frame.w;
    const top = frame.y + MARKER_CENTER_Y * frame.h;
    const bottom = frame.y + frame.h - MARKER_CENTER_Y * frame.h;
    return [
        [left, top],
        [right, top],
        [left, bottom],
        [right, bottom],
    ];
}

function otsu(values) {
    const hist = new Array(256).fill(0);
    for (const v of values) hist[v] += 1;

    const total = values.length;
    let sum = 0;
    for (let i = 0; i < 256; i += 1) sum += i * hist[i];

    let sumB = 0;
    let wB = 0;
    let best = -1;
    let threshold = 128;
    let contrast = 0;

    for (let i = 0; i < 256; i += 1) {
        wB += hist[i];
        if (!wB) continue;
        const wF = total - wB;
        if (!wF) break;
        sumB += i * hist[i];
        const mB = sumB / wB;
        const mF = (sum - sumB) / wF;
        const between = wB * wF * (mB - mF) ** 2;
        if (between > best) {
            best = between;
            threshold = i;
            contrast = Math.abs(mF - mB);
        }
    }

    return { threshold, contrast };
}

// Looks for a solid, roughly square dark blob inside the search area.
function findMarker(data, width, height, cx, cy, half, expected) {
    const x1 = Math.max(0, Math.round(cx - half));
    const y1 = Math.max(0, Math.round(cy - half));
    const x2 = Math.min(width, Math.round(cx + half));
    const y2 = Math.min(height, Math.round(cy + half));
    const zw = x2 - x1;
    const zh = y2 - y1;

    if (zw < 8 || zh < 8) return null;

    const gray = new Uint8Array(zw * zh);
    for (let y = 0; y < zh; y += 1) {
        for (let x = 0; x < zw; x += 1) {
            const i = ((y1 + y) * width + (x1 + x)) * 4;
            gray[y * zw + x] =
                (data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) >> 8;
        }
    }

    const { threshold, contrast } = otsu(gray);
    if (contrast < 70) return null;

    const seen = new Uint8Array(zw * zh);
    const stack = [];
    let best = null;

    for (let start = 0; start < gray.length; start += 1) {
        if (seen[start] || gray[start] > threshold) continue;

        let count = 0;
        let minX = zw;
        let maxX = -1;
        let minY = zh;
        let maxY = -1;

        stack.push(start);
        seen[start] = 1;

        while (stack.length) {
            const p = stack.pop();
            const px = p % zw;
            const py = (p / zw) | 0;

            count += 1;
            if (px < minX) minX = px;
            if (px > maxX) maxX = px;
            if (py < minY) minY = py;
            if (py > maxY) maxY = py;

            const neighbors = [
                px > 0 ? p - 1 : -1,
                px < zw - 1 ? p + 1 : -1,
                py > 0 ? p - zw : -1,
                py < zh - 1 ? p + zw : -1,
            ];

            for (const n of neighbors) {
                if (n >= 0 && !seen[n] && gray[n] <= threshold) {
                    seen[n] = 1;
                    stack.push(n);
                }
            }
        }

        const w = maxX - minX + 1;
        const h = maxY - minY + 1;
        const touchesEdge =
            minX === 0 || minY === 0 || maxX === zw - 1 || maxY === zh - 1;
        const aspect = w / h;

        if (touchesEdge) continue;
        if (w < expected * 0.55 || w > expected * 1.8) continue;
        if (h < expected * 0.55 || h > expected * 1.8) continue;
        if (aspect < 0.7 || aspect > 1.4) continue;
        if (count / (w * h) < 0.7) continue;

        const mx = x1 + (minX + maxX) / 2;
        const my = y1 + (minY + maxY) / 2;
        const dist = Math.hypot(mx - cx, my - cy);

        if (!best || dist < best.dist) best = { x: mx, y: my, dist };
    }

    return best;
}

export default function CameraCapture({ onCapture, onClose, onFallback }) {
    const videoRef = useRef(null);
    const analysisRef = useRef(null);
    const streamRef = useRef(null);
    const holdRef = useRef(0);
    const capturedRef = useRef(false);
    const onCaptureRef = useRef(onCapture);

    const [error, setError] = useState("");
    const [dims, setDims] = useState(null);
    const [found, setFound] = useState([null, null, null, null]);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        onCaptureRef.current = onCapture;
    });

    const takePhoto = useCallback(() => {
        const video = videoRef.current;
        if (!video || capturedRef.current || !video.videoWidth) return;

        capturedRef.current = true;

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0);

        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    capturedRef.current = false;
                    return;
                }

                const file = new File([blob], `scan-${Date.now()}.jpg`, {
                    type: "image/jpeg",
                });
                onCaptureRef.current(file);
            },
            "image/jpeg",
            0.92,
        );
    }, []);

    // Start and stop the camera.
    useEffect(() => {
        let cancelled = false;

        async function start() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: { ideal: "environment" },
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                    },
                    audio: false,
                });

                if (cancelled) {
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }

                streamRef.current = stream;
                const video = videoRef.current;
                video.srcObject = stream;
                await video.play();
            } catch (err) {
                setError(
                    err?.name === "NotAllowedError"
                        ? "Camera permission was denied. Allow camera access for this site in your browser settings and try again."
                        : "Could not start the camera on this device.",
                );
            }
        }

        start();

        return () => {
            cancelled = true;
            streamRef.current?.getTracks().forEach((track) => track.stop());
        };
    }, []);

    // Look for the four black squares several times a second.
    useEffect(() => {
        if (!dims) return undefined;

        const frame = getFrame(dims.w, dims.h);
        const scale = ANALYSIS_WIDTH / dims.w;
        const cw = ANALYSIS_WIDTH;
        const ch = Math.round(dims.h * scale);

        const canvas = analysisRef.current;
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        const expected = MARKER_SIZE * frame.w * scale;
        const half = ZONE_HALF * frame.w * scale;
        const centers = cornerCenters(frame);

        const timer = setInterval(() => {
            if (capturedRef.current) return;

            const video = videoRef.current;
            if (!video || video.readyState < 2) return;

            ctx.drawImage(video, 0, 0, cw, ch);
            const { data } = ctx.getImageData(0, 0, cw, ch);

            const results = centers.map(([cx, cy]) =>
                findMarker(data, cw, ch, cx * scale, cy * scale, half, expected),
            );

            setFound(
                results.map((r) => (r ? { x: r.x / scale, y: r.y / scale } : null)),
            );

            holdRef.current = results.every(Boolean) ? holdRef.current + 1 : 0;
            setProgress(Math.min(1, holdRef.current / HOLD_CHECKS));

            if (holdRef.current >= HOLD_CHECKS) takePhoto();
        }, CHECK_MS);

        return () => clearInterval(timer);
    }, [dims, takePhoto]);

    const frame = dims ? getFrame(dims.w, dims.h) : null;
    const centers = frame ? cornerCenters(frame) : [];
    const foundCount = found.filter(Boolean).length;
    const allFound = foundCount === 4;
    const stroke = dims ? dims.w / 220 : 3;
    const targetSize = frame ? MARKER_SIZE * frame.w * TARGET_SCALE : 0;

    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-black">
            <div className="flex shrink-0 items-center justify-between px-4 py-3 text-white">
                <p className="text-sm font-semibold">Scan answer sheet</p>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close camera"
                    className="grid size-9 place-items-center rounded-lg hover:bg-white/10"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-center">
                {error ? (
                    <div className="mx-6 space-y-3 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                        <p>{error}</p>
                        {onFallback && (
                            <button
                                type="button"
                                onClick={onFallback}
                                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white"
                            >
                                Use the phone's camera app instead
                            </button>
                        )}
                    </div>
                ) : (
                    <div
                        className="relative"
                        style={{
                            aspectRatio: dims ? `${dims.w} / ${dims.h}` : "3 / 4",
                            width: dims
                                ? `min(100vw, calc((100dvh - 9rem) * ${dims.w / dims.h}))`
                                : "100%",
                        }}
                    >
                        <video
                            ref={videoRef}
                            playsInline
                            muted
                            onLoadedMetadata={(event) =>
                                setDims({
                                    w: event.currentTarget.videoWidth,
                                    h: event.currentTarget.videoHeight,
                                })
                            }
                            className="absolute inset-0 h-full w-full"
                        />

                        {dims && frame && (
                            <svg
                                viewBox={`0 0 ${dims.w} ${dims.h}`}
                                className="pointer-events-none absolute inset-0 h-full w-full"
                            >
                                <path
                                    fillRule="evenodd"
                                    fill="rgba(0,0,0,0.45)"
                                    d={`M0 0H${dims.w}V${dims.h}H0Z M${frame.x} ${frame.y}h${frame.w}v${frame.h}h${-frame.w}Z`}
                                />
                                <rect
                                    x={frame.x}
                                    y={frame.y}
                                    width={frame.w}
                                    height={frame.h}
                                    fill="none"
                                    stroke="white"
                                    strokeWidth={stroke}
                                    strokeDasharray={`${stroke * 6} ${stroke * 4}`}
                                />
                                {centers.map(([cx, cy], index) => {
                                    const ok = Boolean(found[index]);
                                    const color = ok ? "#22c55e" : "#f59e0b";

                                    return (
                                        <g key={index}>
                                            <rect
                                                x={cx - targetSize / 2}
                                                y={cy - targetSize / 2}
                                                width={targetSize}
                                                height={targetSize}
                                                rx={targetSize * 0.12}
                                                fill={ok ? "rgba(34,197,94,0.18)" : "rgba(245,158,11,0.12)"}
                                                stroke={color}
                                                strokeWidth={stroke * 2}
                                            />
                                            {ok && (
                                                <circle
                                                    cx={found[index].x}
                                                    cy={found[index].y}
                                                    r={stroke * 3}
                                                    fill={color}
                                                />
                                            )}
                                        </g>
                                    );
                                })}
                            </svg>
                        )}
                    </div>
                )}
            </div>

            <canvas ref={analysisRef} className="hidden" />

            <div className="shrink-0 px-4 pb-6 pt-3 text-center text-white">
                <p className="text-sm">
                    {allFound
                        ? "Hold steady..."
                        : `${foundCount} of 4 squares found. Fit the sheet in the frame so each black square lands in a box.`}
                </p>

                <div className="mx-auto mt-2 h-1 w-40 overflow-hidden rounded bg-white/20">
                    <div
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${progress * 100}%` }}
                    />
                </div>

                <button
                    type="button"
                    onClick={takePhoto}
                    disabled={!dims || !allFound}
                    aria-label="Take photo"
                    className="mx-auto mt-4 grid size-16 place-items-center rounded-full border-4 border-white bg-white/20 disabled:opacity-30"
                >
                    <Camera size={26} />
                </button>
            </div>
        </div>
    );
}
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CameraCapture from "../components/CameraCapture";
import ScanReviewPanel from "../components/ScanReviewPanel";
import {
    getScanPreview,
    getScanResults,
    processScanFile,
    uploadScans,
} from "../api/scanning";
import {
    ArrowLeft,
    Camera,
    CircleAlert,
    CircleCheck,
    Eye,
    ImagePlus,
    LoaderCircle,
    ScanLine,
    X,
} from "lucide-react";
import toast from "react-hot-toast";

import api from "../api/client";

const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp"];

function isAcceptedImage(file) {
    const name = file.name.toLowerCase();
    return (
        ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext)) ||
        ACCEPTED_MIME.includes(file.type)
    );
}

function getErrorMessage(error) {
    const data = error.response?.data;

    if (typeof data?.error === "string") return data.error;
    if (typeof data?.message === "string") return data.message;
    if (typeof data?.detail === "string") return data.detail;

    if (data && typeof data === "object") {
        return Object.entries(data)
            .map(([field, messages]) => {
                const text = Array.isArray(messages)
                    ? messages.join(" ")
                    : String(messages);

                return `${field}: ${text}`;
            })
            .join("\n");
    }

    return error.message || "Something went wrong. Please try again.";
}

function friendlyScanError(message, error) {
    const text = String(message || "");
    const lower = text.toLowerCase();

    if (error && !error.response) {
        return "Can't reach the server. Check your Wi-Fi and that the backend is running, then try again.";
    }

    if (lower.includes("corner markers")) {
        return "The four black corner squares weren't found. Retake the photo with the whole sheet in view, lying flat, with no shadows across the corners.";
    }

    if (lower.includes("resolution")) {
        return "The photo is too small or blurry. Move closer, hold steady, and use the rear camera.";
    }

    if (lower.includes("unable to read image") || lower.includes("invalid or unsupported")) {
        return "That file couldn't be read as an image. Use a JPG, PNG, or WebP photo (not HEIC).";
    }

    if (lower.includes("unsupported file type")) {
        return "Unsupported file type. Use JPG, PNG, or WebP.";
    }

    if (lower.includes("must be between 1 byte and 15 mb")) {
        return "The photo is larger than 15 MB. Retake it at a lower quality setting.";
    }

    if (lower.includes("published")) {
        return "This assessment isn't published, so it can't be scanned.";
    }

    return text || "The scan failed. Please retake the photo.";
}

function ScanItemCard({ item, onRetake }) {
    const result = item.result;

    const shaded = result
        ? result.answers.filter((a) => a.status !== "BLANK").length
        : 0;
    const blank = result
        ? result.answers.filter((a) => a.status === "BLANK").length
        : 0;
    const flagged = result
        ? result.answers.filter(
            (a) => a.status === "MULTIPLE_MARKS" || a.status === "UNCERTAIN",
        ).length
        : 0;

    const [previewUrl, setPreviewUrl] = useState("");
    const [previewLoading, setPreviewLoading] = useState(false);
    const [reviewOpen, setReviewOpen] = useState(false);
    const [recorded, setRecorded] = useState(null);

    const [live, setLive] = useState(null);

    async function refreshLive() {
        try {
            setLive(await getScanResults(item.id));
        } catch {
            /* keep the last known numbers */
        }
    }

    useEffect(() => {
        if (item.state === "done") refreshLive();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item.state]);

    useEffect(() => {
        return () => {
            if (previewUrl) window.URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    async function openPreview() {
        setPreviewLoading(true);

        try {
            // Fetched fresh each time so corrections show up.
            const url = await getScanPreview(item.id);
            setPreviewUrl(url);
        } catch (error) {
            toast.error(error.message || "Unable to load the marked sheet.");
        } finally {
            setPreviewLoading(false);
        }
    }

    return (
        <article className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-semibold text-slate-900">
                    {item.filename}
                </p>

                {item.state === "done" && (
                    <CircleCheck size={18} className="shrink-0 text-emerald-600" />
                )}
                {item.state === "failed" && (
                    <CircleAlert size={18} className="shrink-0 text-red-600" />
                )}
                {(item.state === "processing" || item.state === "queued") && (
                    <LoaderCircle
                        size={18}
                        className={`shrink-0 text-blue-600 ${item.state === "processing" ? "animate-spin" : "opacity-40"
                            }`}
                    />
                )}
            </div>

            {item.state === "queued" && (
                <p className="mt-2 text-xs text-slate-500">Waiting...</p>
            )}

            {item.state === "processing" && (
                <p className="mt-2 text-xs text-slate-500">Reading the sheet...</p>
            )}

            {item.state === "failed" && (
                <>
                    <p className="mt-2 whitespace-pre-line rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        {item.error}
                    </p>
                    <button
                        type="button"
                        onClick={onRetake}
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                        <Camera size={16} />
                        Retake photo
                    </button>
                </>
            )}

            {item.state === "done" && result && (
                <>
                    {recorded ? (
                        <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-center">
                            <p className="text-xs text-slate-500">{recorded.studentName}</p>
                            <p className="mt-1 text-2xl font-bold text-slate-900">
                                {recorded.score} / {recorded.possible}
                            </p>
                            <p className="mt-1 text-xs font-medium text-emerald-700">
                                Final score recorded
                            </p>
                        </div>
                    ) : (
                        <div className="mt-3 rounded-lg bg-blue-50 p-3 text-center">
                            <p className="text-xs text-slate-500">
                                Preliminary count (not the final score)
                            </p>
                            <p className="mt-1 text-2xl font-bold text-slate-900">
                                {live ? live.correct_count : result.correct_count} correct
                            </p>
                            {live ? live.shaded_count : shaded} shaded · {live ? live.blank_count : blank} blank
                            <p className="mt-1 text-xs text-slate-500">
                                Tap Review &amp; record score to get the final score.
                            </p>
                            {flagged > 0 && (
                                <p className="mt-1 text-xs text-amber-700">
                                    {flagged} unclear answer(s) are not counted yet.
                                </p>
                            )}
                        </div>
                    )}
                    <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <dt className="text-xs text-slate-500">ID read from sheet</dt>
                            <dd className="mt-1 font-mono font-semibold tracking-wider text-slate-900">
                                {result.detected_student_id || "—"}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-xs text-slate-500">Suggested student</dt>
                            <dd className="mt-1 font-medium text-slate-900">
                                {result.suggested_student
                                    ? result.suggested_student.name
                                    : "No match"}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-xs text-slate-500">Answers read</dt>
                            <dd className="mt-1 font-medium text-slate-900">
                                {shaded}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-xs text-slate-500">Need attention</dt>
                            <dd
                                className={`mt-1 font-medium ${flagged ? "text-amber-700" : "text-emerald-700"
                                    }`}
                            >
                                {flagged}
                            </dd>
                        </div>
                    </dl>

                    {!recorded && (!result.detected_student_id ||
                        result.detected_student_id.includes("?") ||
                        !result.suggested_student ||
                        flagged > 0) && (
                            <ul className="mt-3 space-y-1 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                                {(!result.detected_student_id ||
                                    result.detected_student_id.includes("?")) && (
                                        <li>The student ID wasn't read cleanly. You can type it in during review.</li>
                                    )}
                                {result.detected_student_id &&
                                    !result.detected_student_id.includes("?") &&
                                    !result.suggested_student && (
                                        <li>No enrolled student matches this ID.</li>
                                    )}
                                {flagged > 0 && (
                                    <li>{flagged} answer(s) are blank, double-marked, or unclear and need review.</li>
                                )}
                            </ul>
                        )}

                    {!recorded && (
                        <button
                            type="button"
                            onClick={() => setReviewOpen(true)}
                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                            Review &amp; record score
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={openPreview}
                        disabled={previewLoading}
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                        {previewLoading ? (
                            <LoaderCircle size={16} className="animate-spin" />
                        ) : (
                            <Eye size={16} />
                        )}
                        {previewLoading ? "Preparing..." : "View marked sheet"}
                    </button>
                </>
            )}

            {reviewOpen && (
                <ScanReviewPanel
                    scanFileId={item.id}
                    filename={item.filename}
                    onClose={() => {
                        setReviewOpen(false);
                        refreshLive();
                    }}
                    onRecorded={(info) => setRecorded(info)}
                />
            )}

            {previewUrl && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-4"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) setPreviewUrl("");
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-label="Marked answer sheet"
                        className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-w-3xl sm:rounded-2xl"
                    >
                        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
                            <div className="min-w-0">
                                <h2 className="truncate text-sm font-bold text-slate-900">
                                    {item.filename}
                                </h2>
                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="size-3 rounded-full border-2 border-emerald-600" />
                                        Correct
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="size-3 rounded-full border-2 border-red-600" />
                                        Wrong
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="size-3 rounded-full border-2 border-orange-500" />
                                        Duplicate / unclear
                                    </span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setPreviewUrl("")}
                                aria-label="Close preview"
                                className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                            >
                                <X size={19} />
                            </button>
                        </div>

                        <div className="overflow-auto bg-slate-100 p-2">
                            <img
                                src={previewUrl}
                                alt="Scanned answer sheet marked with correct and wrong answers"
                                className="mx-auto h-auto w-full max-w-2xl rounded bg-white"
                            />
                        </div>
                    </section>
                </div>
            )}
        </article>
    );
}

export default function ScanAnswers() {
    const { assessmentId } = useParams();
    const navigate = useNavigate();
    const inputRef = useRef(null);
    const cameraRef = useRef(null);

    const [assessment, setAssessment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [files, setFiles] = useState([]);
    const [items, setItems] = useState([]);
    const [busy, setBusy] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [cornerError, setCornerError] = useState("");

    const [cameraOpen, setCameraOpen] = useState(false);

    const canUseLiveCamera =
        typeof window !== "undefined" &&
        window.isSecureContext &&
        Boolean(navigator.mediaDevices?.getUserMedia);

    function openCamera() {
        if (canUseLiveCamera) {
            setCameraOpen(true);
        } else {
            cameraRef.current?.click();
        }
    }

    useEffect(() => {
        async function load() {
            try {
                const response = await api.get(`/assessments/${assessmentId}/`);
                setAssessment(response.data);
            } catch (error) {
                toast.error(getErrorMessage(error));
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [assessmentId]);

    function patchItem(id, changes) {
        setItems((current) =>
            current.map((item) => (item.id === id ? { ...item, ...changes } : item)),
        );
    }

    function handleSelect(event) {
        const picked = Array.from(event.target.files || []);
        event.target.value = "";

        if (picked.length === 0) return;

        const valid = picked.filter(isAcceptedImage);

        if (valid.length !== picked.length) {
            toast.error(
                "Some files were skipped. Use JPG, PNG, or WebP photos (not HEIC).",
            );
        }

        setFiles((current) => [...current, ...valid].slice(0, 50));
    }

    // Uploads and processes the given files. Returns true if the upload worked.
    async function runScan(list) {
        if (busy || list.length === 0) return false;

        setBusy(true);
        setUploadError("");
        setCornerError("");

        try {
            const upload = await uploadScans(assessmentId, list);

            const queued = upload.files.map((file) => ({
                id: file.id,
                filename: file.filename,
                state: "queued",
            }));

            setItems((current) => [...queued, ...current]);

            for (const item of queued) {
                patchItem(item.id, { state: "processing" });

                try {
                    const result = await processScanFile(item.id);
                    patchItem(item.id, { state: "done", result });
                } catch (error) {
                    const rawMessage = getErrorMessage(error);
                    const message = friendlyScanError(rawMessage, error);

                    if (rawMessage.toLowerCase().includes("corner markers")) {
                        // Not accepted: drop the card and make the teacher retake.
                        setItems((current) => current.filter((i) => i.id !== item.id));
                        setCornerError(message);
                    } else {
                        patchItem(item.id, { state: "failed", error: message });
                        toast.error(message);
                    }
                }
            }

            return true;
        } catch (error) {
            const message = friendlyScanError(getErrorMessage(error), error);
            setUploadError(message);
            toast.error(message);
            return false;
        } finally {
            setBusy(false);
        }
    }

    async function handleSubmit() {
        if (files.length === 0) return;

        const ok = await runScan(files);
        if (ok) setFiles([]);
    }

    async function handleCameraSelect(event) {
        const picked = Array.from(event.target.files || []);
        event.target.value = "";

        const valid = picked.filter(isAcceptedImage);

        if (picked.length > 0 && valid.length === 0) {
            toast.error("Use a JPG, PNG, or WebP photo (not HEIC).");
            return;
        }

        try {
            // Copy the bytes now, before the browser can drop the file handle.
            const copies = await Promise.all(
                valid.map(
                    async (file, index) =>
                        new File(
                            [await file.arrayBuffer()],
                            file.name || `photo-${Date.now()}-${index}.jpg`,
                            { type: file.type || "image/jpeg" },
                        ),
                ),
            );

            await runScan(copies);
        } catch {
            toast.error("Could not read the photo. Please try again.");
        }
    }

    function handleRetake() {
        openCamera();
    }

    if (loading) {
        return (
            <div className="grid min-h-64 place-items-center">
                <LoaderCircle className="animate-spin text-blue-600" size={28} />
            </div>
        );
    }

    if (!assessment) {
        return (
            <div className="mx-auto max-w-3xl p-4">
                <p className="text-sm text-slate-600">
                    Assessment could not be loaded.
                </p>
                <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="mt-3 text-sm font-semibold text-blue-600"
                >
                    Back to dashboard
                </button>
            </div>
        );
    }

    const published = assessment.status === "PUBLISHED";

    return (
        <div className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6">
            <button
                type="button"
                onClick={() => navigate("/")}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
                <ArrowLeft size={17} />
                Back
            </button>

            <header className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                    Scan answer sheets
                </p>
                <h1 className="mt-2 break-words text-xl font-bold text-slate-900">
                    {assessment.title}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Photograph each sheet flat, with all four black corner squares
                    visible and good light.
                </p>
            </header>

            {!published ? (
                <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                    Only published assessments can be scanned. Publish this
                    assessment first.
                </p>
            ) : (
                <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleSelect}
                        className="hidden"
                    />

                    <input
                        ref={cameraRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleCameraSelect}
                        className="hidden"
                    />

                    {!canUseLiveCamera && (
                        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                            The camera guide needs a secure (https) address. You are on a plain
                            http address, so Take photo will open your phone's camera app instead.
                        </p>
                    )}

                    <ul className="list-disc space-y-1 rounded-lg bg-slate-50 p-3 pl-7 text-xs text-slate-600">
                        <li>Lay the sheet flat and hold the phone upright above it.</li>
                        <li>Keep all four black corner squares fully in frame.</li>
                        <li>Avoid shadows across the page, especially at the corners.</li>
                        <li>Take photos in portrait with the sheet the right way up.</li>
                    </ul>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={openCamera}
                            disabled={busy}
                            className="flex flex-col items-center justify-center gap-2 rounded-xl bg-blue-50 px-3 py-6 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                        >
                            <Camera size={26} />
                            Take photo
                        </button>

                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            disabled={busy}
                            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-3 py-6 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                        >
                            <ImagePlus size={26} className="text-slate-400" />
                            Upload from gallery
                        </button>
                    </div>

                    <p className="text-center text-xs text-slate-500">
                        JPG, PNG, or WebP. Up to 50 sheets at a time.
                    </p>

                    {files.length > 0 && (
                        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                            {files.map((file, index) => (
                                <li
                                    key={`${file.name}-${index}`}
                                    className="flex items-center justify-between gap-3 px-3 py-2"
                                >
                                    <span className="min-w-0 truncate text-sm text-slate-700">
                                        {file.name}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setFiles((current) =>
                                                current.filter((_, i) => i !== index),
                                            )
                                        }
                                        disabled={busy}
                                        aria-label={`Remove ${file.name}`}
                                        className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-50"
                                    >
                                        <X size={16} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={busy || files.length === 0}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {busy ? (
                            <LoaderCircle size={17} className="animate-spin" />
                        ) : (
                            <ScanLine size={17} />
                        )}
                        {busy
                            ? "Scanning..."
                            : `Scan ${files.length || ""} sheet${files.length === 1 ? "" : "s"}`}
                    </button>
                </section>
            )}

            {uploadError && (
                <p className="whitespace-pre-line rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {uploadError}
                </p>
            )}

            {items.length > 0 && (
                <section className="space-y-3">
                    <h2 className="text-base font-semibold text-slate-900">Results</h2>
                    {items.map((item) => (
                        <ScanItemCard key={item.id} item={item} onRetake={handleRetake} />
                    ))}
                </section>
            )}

            {cornerError && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4">
                    <section
                        role="alertdialog"
                        aria-modal="true"
                        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
                    >
                        <div className="flex items-start gap-3">
                            <CircleAlert size={22} className="mt-0.5 shrink-0 text-red-600" />
                            <div>
                                <h2 className="text-base font-bold text-slate-900">
                                    Photo not accepted
                                </h2>
                                <p className="mt-1 text-sm text-slate-600">{cornerError}</p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setCornerError("");
                                openCamera();
                            }}
                            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                            <Camera size={16} />
                            Retake photo
                        </button>
                        <button
                            type="button"
                            onClick={() => setCornerError("")}
                            className="mt-2 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                    </section>
                </div>
            )}

            {cameraOpen && (
                <CameraCapture
                    onClose={() => setCameraOpen(false)}
                    onFallback={() => {
                        setCameraOpen(false);
                        cameraRef.current?.click();
                    }}
                    onCapture={(file) => {
                        setCameraOpen(false);
                        runScan([file]);
                    }}
                />
            )}
        </div>
    );
}
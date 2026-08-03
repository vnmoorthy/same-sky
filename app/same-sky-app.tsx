"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { FESTIVAL_ARTISTS, STAGES } from "../lib/artists";
import type { Artist, Postcard, SameSkySession, Senses } from "../lib/types";

type Bridge = { token: string; session: SameSkySession };
type ApiResult = { ok: boolean; error?: string; token?: string; session?: SameSkySession; serverNow?: number };
type View = "landing" | "join" | "bridge" | "demo";

const STORAGE_KEY = "same-sky-bridge-v1";
const SIGNAL_TAGS = ["Bass in my chest", "Cool wind", "Mist in the air", "Crowd singing", "Ground vibrating", "A quiet pause"];
const PULSE_COLORS = ["#ff7a61", "#8c7bff", "#55d6be", "#ffd166"];

async function api<T = ApiResult>(path: string, init?: RequestInit, timeout = 8_000): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(path, { ...init, signal: controller.signal, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
    const data = (await response.json()) as T & { error?: string };
    if (!response.ok) throw new Error(data.error || "The signal dropped. Try again.");
    return data;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new Error("The signal took too long. Try again.");
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
}

function auth(token: string): HeadersInit {
  return { authorization: `Bearer ${token}` };
}

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function timeLeft(expiresAt: number) {
  const minutes = Math.max(0, Math.floor((expiresAt - Date.now()) / 60_000));
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
}

function Logo() {
  return (
    <Link className="brand" href="/" aria-label="Same Sky home">
      <span className="brand-mark" aria-hidden="true"><i /><i /></span>
      <span>SAME SKY</span>
    </Link>
  );
}

function Icon({ children }: { children: string }) {
  return <span className="icon" aria-hidden="true">{children}</span>;
}

function Spinner({ label = "Holding the signal" }: { label?: string }) {
  return <span className="spinner" role="status"><i />{label}</span>;
}

function Notice({ tone = "info", children }: { tone?: "info" | "error" | "success"; children: React.ReactNode }) {
  return <div className={`notice ${tone}`} role={tone === "error" ? "alert" : "status"}>{children}</div>;
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => closeRef.current?.focus(), []);
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button ref={closeRef} className="icon-button modal-close" onClick={onClose} aria-label="Close dialog">×</button>
        <p className="eyebrow">PRIVATE BY DESIGN</p>
        <h2 id="modal-title">{title}</h2>
        {children}
      </section>
    </div>
  );
}

function AtmosphericArt({ compact = false }: { compact?: boolean }) {
  return (
    <div className={classNames("atmospheric-art", compact && "compact")} aria-hidden="true">
      <div className="moon" />
      <div className="beam beam-one" />
      <div className="beam beam-two" />
      <div className="crowd-shape crowd-one" />
      <div className="crowd-shape crowd-two" />
      <div className="fog fog-one" />
      <div className="fog fog-two" />
    </div>
  );
}

function Landing({ onHost, onGuest, onDemo, resume, onResume }: { onHost: () => void; onGuest: () => void; onDemo: () => void; resume: Bridge | null; onResume: () => void }) {
  const [privacy, setPrivacy] = useState(false);
  const [count, setCount] = useState(0);
  useEffect(() => {
    api<{ count: number }>("/api/sky", undefined, 4_000).then((result) => setCount(result.count)).catch(() => undefined);
  }, []);
  return (
    <main className="landing">
      <nav className="nav shell">
        <Logo />
        <div className="nav-actions">
          <a href="#ritual">The ritual</a>
          <button className="text-button" onClick={() => setPrivacy(true)}>Privacy</button>
        </div>
      </nav>

      <section className="hero shell">
        <div className="hero-copy">
          <p className="eyebrow"><span className="live-dot" /> OUTSIDE LANDS · PRIVATE RITUAL</p>
          <p className="hero-brand">SAME SKY</p>
          <h1>One set.<br /><em>Two skies.</em></h1>
          <p className="hero-lede">Livestreams transmit video. Same Sky transmits presence—one sensory postcard, one return pulse, eight seconds of shared light.</p>
          <div className="hero-actions">
            <button className="button primary" onClick={onHost}><Icon>↗</Icon>I’m at the festival</button>
            <button className="button secondary" onClick={onGuest}><Icon>⌂</Icon>I’m watching from home</button>
          </div>
          {resume && (
            <button className="resume" onClick={onResume}>
              <span><strong>Resume your bridge</strong><small>{resume.session.code} · {timeLeft(resume.session.expiresAt)} left</small></span><Icon>→</Icon>
            </button>
          )}
          <button className="demo-link" onClick={onDemo}><span className="play">▶</span> Judges: feel the full ritual in 30 seconds <span>→</span></button>
          <p className="trust-line">No account · No feed · Gone within 24 hours</p>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <AtmosphericArt />
        </div>
      </section>

      <section id="ritual" className="ritual shell">
        <p className="eyebrow">THE RITUAL</p>
        <h2>Livestreams carry the show.<br /><em>Same Sky carries presence.</em></h2>
        <div className="steps">
          <article><span>01</span><div><h3>Catch what video misses</h3><p>One resized photo, a few firsthand words, and an optional on-device intensity estimate. No audio is saved.</p></div></article>
          <article><span>02</span><div><h3>Send one honest postcard</h3><p>OpenAI turns only those facts into accessible language. The person onsite reviews every word.</p></div></article>
          <article><span>03</span><div><h3>Feel one pulse return</h3><p>The viewer sends a single signal back. Both screens become the same light at the same time.</p></div></article>
        </div>
      </section>

      <footer className="footer shell">
        <span>{count ? `${count} pulses in today’s sky` : "The first pulse can be yours"}</span>
        <span>Built for OutsideLLMs 2026 · OpenAI + ChatGPT Sites · <a href="https://www.jambase.com" rel="nofollow noreferrer" target="_blank">Powered by JamBase</a></span>
        <span>Festival prototype · not affiliated with Outside Lands</span>
      </footer>

      {privacy && <Modal title="One moment. Two people. Nothing else." onClose={() => setPrivacy(false)}>
        <div className="privacy-list">
          <p><strong>No identity layer.</strong> We never ask for names, email, GPS, contacts, or an account.</p>
          <p><strong>No recording.</strong> Ambient intensity is estimated for four seconds on your phone. Audio never leaves or saves.</p>
          <p><strong>Human approval.</strong> A resized, metadata-stripped image and your words may be sent to OpenAI. You approve the postcard before it crosses.</p>
          <p><strong>Automatic expiry.</strong> The private bridge and resized image disappear within 24 hours. Either person can delete sooner.</p>
        </div>
        <button className="button primary full" onClick={() => setPrivacy(false)}>That makes sense</button>
      </Modal>}
    </main>
  );
}

function JoinView({ initialCode, onBack, onJoined }: { initialCode: string; onBack: () => void; onJoined: (bridge: Bridge) => void }) {
  const [code, setCode] = useState(initialCode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function join(event: React.FormEvent) {
    event.preventDefault();
    setError(""); setBusy(true);
    try {
      const result = await api<ApiResult>("/api/sessions/join", { method: "POST", body: JSON.stringify({ code }) });
      if (!result.token || !result.session) throw new Error("The bridge did not open.");
      onJoined({ token: result.token, session: result.session });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That bridge is not active.");
    } finally { setBusy(false); }
  }
  return (
    <main className="flow-page">
      <header className="flow-nav shell"><Logo /><button className="text-button" onClick={onBack}>← Back</button></header>
      <section className="join-layout shell">
        <div className="join-art"><AtmosphericArt compact /><p>One private person.<br />One moment from the field.</p></div>
        <form className="join-card" onSubmit={join}>
          <p className="eyebrow">FAR AWAY</p>
          <h1>Enter your<br /><em>sky code.</em></h1>
          <p>Someone at the festival made this bridge for you. It can be claimed once.</p>
          <label htmlFor="join-code">Six-character code</label>
          <input id="join-code" className="code-input" value={code} onChange={(event) => setCode(event.target.value.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 6))} autoCapitalize="characters" autoComplete="one-time-code" inputMode="text" placeholder="SKY824" maxLength={6} autoFocus />
          {error && <Notice tone="error">{error}</Notice>}
          <button className="button primary full" disabled={busy || code.length !== 6}>{busy ? <Spinner label="Joining" /> : <>Step under the sky <Icon>→</Icon></>}</button>
          <p className="form-trust">Nothing is posted. This moment disappears within 24 hours.</p>
        </form>
      </section>
    </main>
  );
}

function makeSampleImage(): string {
  const canvas = document.createElement("canvas");
  canvas.width = 960; canvas.height = 720;
  const context = canvas.getContext("2d");
  if (!context) return "";
  const sky = context.createLinearGradient(0, 0, 0, 720);
  sky.addColorStop(0, "#171941"); sky.addColorStop(0.48, "#724f9b"); sky.addColorStop(1, "#ef8267");
  context.fillStyle = sky; context.fillRect(0, 0, 960, 720);
  context.globalAlpha = 0.22; context.fillStyle = "#f1f0ff";
  for (let index = 0; index < 7; index += 1) context.fillRect(80 + index * 138, 120, 48, 470);
  context.globalAlpha = 1; context.fillStyle = "#0d1026";
  context.beginPath(); context.moveTo(0, 610);
  for (let x = 0; x <= 960; x += 40) context.lineTo(x, 585 - (x % 120 === 0 ? 35 : Math.random() * 18));
  context.lineTo(960, 720); context.lineTo(0, 720); context.fill();
  context.globalAlpha = 0.18; context.fillStyle = "#fff";
  for (let index = 0; index < 5; index += 1) { context.beginPath(); context.ellipse(180 + index * 170, 360 + index * 20, 210, 44, 0, 0, Math.PI * 2); context.fill(); }
  return canvas.toDataURL("image/jpeg", 0.76);
}

async function resizeImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image from your camera or photo library.");
  const bitmap = await createImageBitmap(file);
  const max = 1280;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser could not prepare the image.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.76);
}

function AuthenticatedPhoto({ url, token, alt }: { url: string; token: string; alt: string }) {
  const [source, setSource] = useState<string | null>(null);
  useEffect(() => {
    let objectUrl = ""; let active = true;
    fetch(url, { headers: auth(token), cache: "no-store" })
      .then((response) => { if (!response.ok) throw new Error(); return response.blob(); })
      .then((blob) => { if (active) { objectUrl = URL.createObjectURL(blob); setSource(objectUrl); } })
      .catch(() => undefined);
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [url, token]);
  return source ? <img src={source} alt={alt} /> : <AtmosphericArt compact />;
}

function PostcardCard({ postcard, session, token, sampleImage, compact = false }: { postcard: Postcard; session: SameSkySession; token: string; sampleImage?: string; compact?: boolean }) {
  const style = { "--card-a": postcard.palette[0], "--card-b": postcard.palette[1], "--card-c": postcard.palette[2] } as React.CSSProperties;
  return (
    <article className={classNames("postcard", compact && "compact")} style={style}>
      <div className="postcard-image">
        {sampleImage ? <img src={sampleImage} alt={postcard.altText} /> : session.photoUrl ? <AuthenticatedPhoto url={session.photoUrl} token={token} alt={postcard.altText} /> : <AtmosphericArt compact />}
        <div className="postcard-wash" />
      </div>
      <div className="postcard-content">
        <span className="card-kicker">FROM THE FIELD · RIGHT NOW</span>
        <h3>{postcard.title}</h3>
        <p>{postcard.body}</p>
        <footer><span>{session.artist?.name ?? "Outside Lands"}</span><span>{session.stageName ?? "Golden Gate Park"}</span></footer>
        <small>{postcard.signal}</small>
      </div>
    </article>
  );
}

function HoldButton({ onComplete, disabled = false, label = "Hold to send a pulse" }: { onComplete: () => Promise<void> | void; disabled?: boolean; label?: string }) {
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const timer = useRef<number | null>(null);
  const fired = useRef(false);
  const stop = useCallback(() => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null; setHolding(false); if (!fired.current) setProgress(0);
  }, []);
  const start = useCallback(() => {
    if (disabled || holding || fired.current) return;
    const began = performance.now(); setHolding(true);
    timer.current = window.setInterval(() => {
      const next = Math.min(100, ((performance.now() - began) / 1400) * 100); setProgress(next);
      if (next >= 100 && !fired.current) { fired.current = true; stop(); void onComplete(); }
    }, 28);
  }, [disabled, holding, onComplete, stop]);
  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current); }, []);
  return (
    <div className="hold-wrap">
      <button className={classNames("hold-button", holding && "holding")} disabled={disabled} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); start(); }} onPointerUp={stop} onPointerCancel={stop} onKeyDown={(event) => { if (event.key === " " && !event.repeat) { event.preventDefault(); start(); } if (event.key === "Enter") { event.preventDefault(); fired.current = true; setProgress(100); void onComplete(); } }} onKeyUp={(event) => event.key === " " && stop()} style={{ "--hold-progress": `${progress}%` } as React.CSSProperties}>
        <span className="hold-ring"><span>↗</span></span><strong>{progress >= 100 ? "Pulse sent" : label}</strong><small>{holding ? "Keep holding…" : "1.4 seconds · Enter sends accessibly"}</small>
      </button>
    </div>
  );
}

function PulseOverlay({ session, onDone }: { session: SameSkySession; onDone?: () => void }) {
  const [phase, setPhase] = useState<"waiting" | "active" | "done">("waiting");
  useEffect(() => {
    if (!session.pulseAt || !session.pulseEndsAt) return;
    const begin = window.setTimeout(() => {
      setPhase("active");
      if (navigator.vibrate && session.role === "host") navigator.vibrate([90, 70, 180]);
    }, Math.max(0, session.pulseAt - Date.now()));
    const finish = window.setTimeout(() => { setPhase("done"); onDone?.(); }, Math.max(0, session.pulseEndsAt - Date.now()));
    return () => { window.clearTimeout(begin); window.clearTimeout(finish); };
  }, [session.pulseAt, session.pulseEndsAt, session.role, onDone]);
  if (!session.pulseAt || phase === "done") return null;
  return (
    <div className={classNames("pulse-overlay", phase)} style={{ "--pulse": session.pulseColor ?? "#ff7a61" } as React.CSSProperties} role="status" aria-live="assertive">
      <div className="pulse-orb"><i /><i /><i /></div>
      <p>{phase === "waiting" ? "The signal is crossing…" : "For eight seconds,"}<strong>{phase === "active" ? "you were under the same sky." : "Take one breath."}</strong></p>
    </div>
  );
}

function PresenceComposer({ bridge, onUpdate }: { bridge: Bridge; onUpdate: (bridge: Bridge) => void }) {
  const [artist, setArtist] = useState<Artist>(FESTIVAL_ARTISTS[0]);
  const [stage, setStage] = useState(STAGES[0]);
  const [observation, setObservation] = useState("Purple light is moving through the fog above the crowd.");
  const [tags, setTags] = useState<string[]>(["Cool wind", "Bass in my chest"]);
  const [energy, setEnergy] = useState(82);
  const [light, setLight] = useState("violet and amber");
  const [air, setAir] = useState("cool");
  const [soundLevel, setSoundLevel] = useState<number | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sampling, setSampling] = useState(false);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function sampleAir() {
    setError(""); setSampling(true);
    let stream: MediaStream | null = null; let context: AudioContext | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      context = new AudioContext();
      const analyser = context.createAnalyser(); analyser.fftSize = 512;
      context.createMediaStreamSource(stream).connect(analyser);
      const samples = new Uint8Array(analyser.fftSize); let total = 0; let frames = 0;
      const started = performance.now();
      while (performance.now() - started < 4000) {
        analyser.getByteTimeDomainData(samples);
        let sum = 0; for (const value of samples) { const centered = (value - 128) / 128; sum += centered * centered; }
        total += Math.sqrt(sum / samples.length); frames += 1;
        await new Promise((resolve) => window.setTimeout(resolve, 80));
      }
      setSoundLevel(Math.max(1, Math.min(100, Math.round((total / Math.max(1, frames)) * 210))));
    } catch {
      setError("Microphone stayed off. Use the energy slider instead—nothing is blocked.");
    } finally {
      stream?.getTracks().forEach((track) => track.stop());
      if (context) await context.close().catch(() => undefined);
      setSampling(false);
    }
  }

  async function choosePhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    try { setPhoto(await resizeImage(file)); setError(""); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Use a different image or continue with words."); }
    finally { event.target.value = ""; }
  }

  async function generate() {
    if (!consent) { setError("Confirm the capture promise before making the postcard."); return; }
    setBusy(true); setError("");
    const senses: Senses = { energy, soundLevel, tags, light, air };
    try {
      const result = await api<ApiResult>(`/api/sessions/${bridge.session.code}/presence`, { method: "POST", headers: auth(bridge.token), body: JSON.stringify({ artist, stageName: stage, observation, senses, photoDataUrl: photo }) }, 9_000);
      if (!result.session) throw new Error("The postcard did not form. Try again.");
      onUpdate({ token: bridge.token, session: result.session });
    } catch (caught) { setError(caught instanceof Error ? caught.message : "The postcard did not form. Try again."); }
    finally { setBusy(false); }
  }

  return (
    <section className="composer">
      <div className="section-heading"><p className="eyebrow">HERE · CAPTURE</p><h2>Catch what the<br /><em>livestream misses.</em></h2><p>Keep it literal. One thing they could not know from video alone.</p></div>
      <div className="composer-grid">
        <div className="capture-panel">
          <div className="capture-preview">
            {photo ? <img src={photo} alt="Your resized festival capture" /> : <AtmosphericArt compact />}
            <span>{photo ? "Resized · metadata removed" : "Aim above faces: lights, sky, hands, or ground"}</span>
          </div>
          <div className="capture-buttons">
            <input ref={fileRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/*" capture="environment" onChange={choosePhoto} />
            <button className="button secondary" onClick={() => fileRef.current?.click()}><Icon>◉</Icon>{photo ? "Retake photo" : "Take a photo"}</button>
            <button className="button ghost" onClick={() => setPhoto(makeSampleImage())}><Icon>✦</Icon>Use sample scene</button>
          </div>
          <p className="capture-note">A photo is optional. Never frame an identifiable stranger or the livestream screen.</p>
        </div>

        <div className="facts-panel">
          <div className="field-row"><label>Which set?</label><select value={artist.id} onChange={(event) => setArtist(FESTIVAL_ARTISTS.find((item) => item.id === event.target.value) ?? FESTIVAL_ARTISTS[0])}>{FESTIVAL_ARTISTS.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.day}</option>)}</select></div>
          <div className="field-row"><label>Stage</label><select value={stage} onChange={(event) => setStage(event.target.value)}>{STAGES.map((item) => <option key={item}>{item}</option>)}</select></div>
          <div className="field-row"><label htmlFor="observation">What can they not know?</label><textarea id="observation" value={observation} onChange={(event) => setObservation(event.target.value.slice(0, 240))} maxLength={240} placeholder="The wind turned cold between songs…" /><small>{observation.length}/240</small></div>
          <fieldset className="field-row"><legend>What is literally true?</legend><div className="chips">{SIGNAL_TAGS.map((tag) => <button type="button" key={tag} className={classNames("chip", tags.includes(tag) && "selected")} aria-pressed={tags.includes(tag)} onClick={() => setTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : current.length < 3 ? [...current, tag] : current)}>{tags.includes(tag) ? "✓ " : "+ "}{tag}</button>)}</div></fieldset>
          <div className="split-fields"><label>Air<input value={air} onChange={(event) => setAir(event.target.value.slice(0, 40))} /></label><label>Light<input value={light} onChange={(event) => setLight(event.target.value.slice(0, 40))} /></label></div>
          <label className="range-row">Sender-reported energy <strong>{energy}/100</strong><input type="range" min="0" max="100" value={energy} onChange={(event) => setEnergy(Number(event.target.value))} /></label>
          <div className="sensor-row"><div><strong>{soundLevel == null ? "Optional ambient estimate" : `Ambient estimate ${soundLevel}/100`}</strong><small>Measured for 4 seconds here. Audio never leaves or saves.</small></div><button className="button ghost small" onClick={sampleAir} disabled={sampling}>{sampling ? <Spinner label="Measuring" /> : soundLevel == null ? "Measure" : "Measure again"}</button></div>
          <label className="consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I have the right to share this capture, and I’ll review every generated word.</span></label>
          {error && <Notice tone="error">{error}</Notice>}
          <button className="button primary full" onClick={generate} disabled={busy || !consent}>{busy ? <Spinner label="Keeping only what is real" /> : <>Make the postcard <Icon>→</Icon></>}</button>
          <p className="form-trust">OpenAI is used when configured. If it is slow or unavailable, Same Sky immediately builds an honest postcard from your exact inputs.</p>
        </div>
      </div>
    </section>
  );
}

function Waiting({ role, paired }: { role: "host" | "guest"; paired: boolean }) {
  return (
    <section className="waiting-state" aria-live="polite">
      <div className="waiting-orbit"><i /><i /><span>{paired ? "✓" : "·"}</span></div>
      <p className="eyebrow">{paired ? "BRIDGE CONNECTED" : "HOLDING THE BRIDGE"}</p>
      <h2>{role === "host" ? (paired ? "They’re here with you." : "Waiting for your person.") : "They’re catching one moment."}</h2>
      <p>{role === "host" ? "You can start capturing now. The postcard will wait for your approval." : "Keep this screen open. The moment will arrive here without a refresh."}</p>
    </section>
  );
}

function CompletionActions({ bridge, onDelete, onNew }: { bridge: Bridge; onDelete: () => void; onNew: () => void }) {
  return <div className="completion-actions"><p>No reply needed. That moment was enough.<br /><small>This bridge disappears in {timeLeft(bridge.session.expiresAt)}.</small></p><div><button className="button secondary" onClick={onNew}>Create another bridge</button><button className="text-button danger" onClick={onDelete}>Delete now</button></div></div>;
}

function BridgeView({ bridge, onUpdate, onExit, onDelete, onNew }: { bridge: Bridge; onUpdate: (bridge: Bridge) => void; onExit: () => void; onDelete: () => void; onNew: () => void }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pulseColor, setPulseColor] = useState(PULSE_COLORS[0]);
  const session = bridge.session;

  async function copyInvite() {
    const invite = `${window.location.origin}/?join=${session.code}`;
    try { await navigator.clipboard.writeText(invite); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
    catch { window.prompt("Copy this private invite", invite); }
  }
  async function shareInvite() {
    const url = `${window.location.origin}/?join=${session.code}`;
    if (navigator.share) await navigator.share({ title: "Step under the same sky", text: "I made one private festival moment for you.", url }).catch(() => undefined);
    else await copyInvite();
  }
  async function publish() {
    setBusy(true); setError("");
    try { const result = await api<ApiResult>(`/api/sessions/${session.code}/publish`, { method: "POST", headers: auth(bridge.token), body: "{}" }); if (result.session) onUpdate({ token: bridge.token, session: result.session }); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "The postcard did not cross."); }
    finally { setBusy(false); }
  }
  async function pulse() {
    setBusy(true); setError("");
    try { const result = await api<ApiResult>(`/api/sessions/${session.code}/pulse`, { method: "POST", headers: auth(bridge.token), body: JSON.stringify({ color: pulseColor }) }); if (result.session) onUpdate({ token: bridge.token, session: result.session }); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "The pulse did not cross."); setBusy(false); }
  }
  const complete = session.status === "completed";
  const pulseActive = session.status === "pulse_ready" || complete;

  return (
    <main className="flow-page bridge-page">
      <header className="flow-nav shell"><Logo /><div className="bridge-meta"><span className={classNames("status-dot", session.paired && "paired")} />{session.paired ? "Two people connected" : "Private invite open"}<button className="text-button" onClick={onExit}>Leave screen</button></div></header>
      <div className="bridge-shell shell">
        <aside className="bridge-rail">
          <p className="eyebrow">{session.role === "host" ? "YOU ARE HERE" : "YOU ARE FAR AWAY"}</p>
          <div className="code-block"><small>SKY CODE</small><strong>{session.code}</strong></div>
          {session.role === "host" && <div className="invite-actions"><button className="button secondary full" onClick={copyInvite}>{copied ? "Copied ✓" : "Copy private invite"}</button><button className="button ghost full" onClick={shareInvite}>Share invite</button></div>}
          <ol className="progress-list">
            <li className="done"><span>1</span>Private bridge</li>
            <li className={session.paired ? "done" : "active"}><span>2</span>One person joins</li>
            <li className={session.postcard ? "done" : session.role === "host" ? "active" : ""}><span>3</span>Sensory postcard</li>
            <li className={pulseActive ? "done" : session.status === "postcard_ready" ? "active" : ""}><span>4</span>One pulse returns</li>
          </ol>
          <button className="text-button danger rail-delete" onClick={onDelete}>Delete this bridge</button>
        </aside>
        <div className="bridge-main">
          {session.role === "host" && !session.postcard && <PresenceComposer bridge={bridge} onUpdate={onUpdate} />}
          {session.role === "host" && session.status === "draft_ready" && session.postcard && <section className="review-layout"><div className="section-heading"><p className="eyebrow">HERE · REVIEW</p><h2>Every word waits<br /><em>for your approval.</em></h2><p>This is the human truth gate. If anything feels wrong, go back and remake it from your facts.</p><span className="mode-badge">{session.aiMode === "openai" ? "✦ OpenAI translation" : "✓ Festival-safe fallback"}</span></div><div><PostcardCard postcard={session.postcard} session={session} token={bridge.token} />{error && <Notice tone="error">{error}</Notice>}<div className="review-actions"><button className="button ghost" onClick={() => onUpdate({ token: bridge.token, session: { ...session, postcard: null, status: session.paired ? "connected" : "waiting" } })}>Remake from facts</button><button className="button primary" onClick={publish} disabled={busy}>{busy ? <Spinner label="Sending" /> : <>Send this moment <Icon>→</Icon></>}</button></div></div></section>}
          {session.role === "host" && session.status === "postcard_ready" && <section className="sent-layout"><PostcardCard postcard={session.postcard!} session={session} token={bridge.token} compact /><Waiting role="host" paired={session.paired} /><p className="sent-note">Keep your phone in your hand. Their one pulse will arrive here.</p></section>}
          {session.role === "guest" && !session.postcard && <Waiting role="guest" paired />}
          {session.role === "guest" && session.status === "draft_ready" && <Waiting role="guest" paired />}
          {session.role === "guest" && session.status === "postcard_ready" && session.postcard && <section className="received-layout"><div className="section-heading"><p className="eyebrow">FAR AWAY · ARRIVED</p><h2>One person sent<br /><em>this, right now.</em></h2><p>Read it. Then send one pulse back—no message, no reaction count.</p><div className="pulse-colors" aria-label="Choose a pulse color">{PULSE_COLORS.map((color) => <button key={color} style={{ background: color }} className={pulseColor === color ? "selected" : ""} aria-label={`Choose ${color} pulse`} aria-pressed={pulseColor === color} onClick={() => setPulseColor(color)} />)}</div></div><div><PostcardCard postcard={session.postcard} session={session} token={bridge.token} />{error && <Notice tone="error">{error}</Notice>}<HoldButton onComplete={pulse} disabled={busy} /></div></section>}
          {pulseActive && session.postcard && <section className="complete-layout"><PostcardCard postcard={session.postcard} session={session} token={bridge.token} compact /><div><p className="eyebrow">MOMENT COMPLETE</p><h2>For eight seconds,<br /><em>you were under the same sky.</em></h2><CompletionActions bridge={bridge} onDelete={onDelete} onNew={onNew} /></div></section>}
        </div>
      </div>
      {session.pulseAt && <PulseOverlay session={session} />}
    </main>
  );
}

function DemoStage({ onExit }: { onExit: () => void }) {
  const [host, setHost] = useState<Bridge | null>(null);
  const [guest, setGuest] = useState<Bridge | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sample] = useState(() => makeSampleImage());

  const refresh = useCallback(async (bridge: Bridge, setter: (value: Bridge) => void) => {
    const result = await api<ApiResult>(`/api/sessions/${bridge.session.code}`, { headers: auth(bridge.token) }, 4_000);
    if (result.session) setter({ token: bridge.token, session: result.session });
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const created = await api<ApiResult>("/api/sessions", { method: "POST", body: JSON.stringify({ demo: true }) });
        if (!created.token || !created.session) throw new Error("Demo bridge could not open.");
        const joined = await api<ApiResult>("/api/sessions/join", { method: "POST", body: JSON.stringify({ code: created.session.code }) });
        if (!joined.token || !joined.session) throw new Error("Demo viewer could not join.");
        if (active) { setHost({ token: created.token, session: { ...created.session, paired: true, status: "connected" } }); setGuest({ token: joined.token, session: joined.session }); }
      } catch (caught) { if (active) setError(caught instanceof Error ? caught.message : "Demo could not start."); }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!host || !guest) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      void refresh(host, setHost).catch(() => undefined); void refresh(guest, setGuest).catch(() => undefined);
    }, 650);
    return () => window.clearInterval(timer);
  }, [host?.token, guest?.token, host?.session.status, guest?.session.status, refresh]);

  async function make() {
    if (!host) return; setBusy(true); setError("");
    try {
      const result = await api<ApiResult>(`/api/sessions/${host.session.code}/presence`, { method: "POST", headers: auth(host.token), body: JSON.stringify({ artist: FESTIVAL_ARTISTS[0], stageName: STAGES[0], observation: "Purple light is moving through a band of fog above the crowd.", senses: { energy: 82, soundLevel: 71, tags: ["Cool wind", "Bass in my chest"], light: "violet and amber", air: "cool" }, photoDataUrl: sample }) }, 9_000);
      if (result.session) setHost({ token: host.token, session: result.session });
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Demo postcard failed."); } finally { setBusy(false); }
  }
  async function publish() { if (!host) return; setBusy(true); try { const result = await api<ApiResult>(`/api/sessions/${host.session.code}/publish`, { method: "POST", headers: auth(host.token), body: "{}" }); if (result.session) setHost({ token: host.token, session: result.session }); } catch (caught) { setError(caught instanceof Error ? caught.message : "Send failed."); } finally { setBusy(false); } }
  async function pulse() { if (!guest) return; setBusy(true); try { const result = await api<ApiResult>(`/api/sessions/${guest.session.code}/pulse`, { method: "POST", headers: auth(guest.token), body: JSON.stringify({ color: "#ff7a61" }) }); if (result.session) setGuest({ token: guest.token, session: result.session }); } catch (caught) { setError(caught instanceof Error ? caught.message : "Pulse failed."); setBusy(false); } }

  const status = host?.session.status ?? "loading";
  return (
    <main className="demo-page">
      <header className="demo-nav"><Logo /><div><span className="mode-badge">LIVE BACKEND · TWO PRIVATE CLIENTS</span><button className="text-button" onClick={() => window.location.reload()}>Reset</button><button className="text-button" onClick={onExit}>Exit demo</button></div></header>
      <section className="demo-intro"><p className="eyebrow">ONE-SCREEN JUDGE MODE</p><h1>Livestreams transmit video.<br /><em>This transmits presence.</em></h1><p>Everything below uses the real create, join, publish, polling, and synchronized-pulse APIs.</p></section>
      {error && <Notice tone="error">{error}</Notice>}
      {!host || !guest ? <div className="demo-loading"><Spinner label="Opening two ends of one private bridge" /></div> : (
        <div className="device-stage">
          <article className="device host-device">
            <header><span>HERE</span><small>GOLDEN GATE PARK</small></header>
            <div className="device-screen">
              {status === "connected" && <><div className="demo-image"><img src={sample} alt="Abstract rights-safe sample of festival lights and fog" /><span>SAMPLE CAPTURE · NO FACES</span></div><h2>What video can’t carry.</h2><div className="demo-facts"><span>Cool wind</span><span>Bass in my chest</span><span>82/100 energy</span></div><button className="button primary full" onClick={make} disabled={busy}>{busy ? <Spinner label="Making" /> : "Make the postcard →"}</button></>}
              {status === "draft_ready" && host.session.postcard && <><PostcardCard postcard={host.session.postcard} session={host.session} token={host.token} sampleImage={sample} compact /><button className="button primary full" onClick={publish} disabled={busy}>{busy ? <Spinner label="Sending" /> : "Approve & send →"}</button></>}
              {status === "postcard_ready" && <Waiting role="host" paired />}
              {(status === "pulse_ready" || status === "completed") && <div className="device-complete"><span>✓</span><h2>They were here with you.</h2><p>For eight seconds, you were under the same sky.</p></div>}
            </div>
          </article>
          <div className="bridge-line"><span>{host.session.code}</span><i /></div>
          <article className="device guest-device">
            <header><span>FAR AWAY</span><small>OFFICIAL LIVESTREAM VIEWER</small></header>
            <div className="device-screen">
              {!guest.session.postcard || guest.session.status === "draft_ready" ? <Waiting role="guest" paired /> : guest.session.status === "postcard_ready" ? <><PostcardCard postcard={guest.session.postcard} session={guest.session} token={guest.token} sampleImage={sample} compact /><HoldButton onComplete={pulse} disabled={busy} label="Hold to send back" /></> : <div className="device-complete"><span>✓</span><h2>Your pulse crossed.</h2><p>No likes. No chat. That one signal was enough.</p></div>}
            </div>
          </article>
        </div>
      )}
      {host?.session.pulseAt && <PulseOverlay session={host.session} />}
    </main>
  );
}

export function SameSkyApp() {
  const [view, setView] = useState<View>("landing");
  const [bridge, setBridge] = useState<Bridge | null>(null);
  const [resume, setResume] = useState<Bridge | null>(null);
  const [initialCode, setInitialCode] = useState("");
  const [opening, setOpening] = useState(false);
  const [globalError, setGlobalError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const join = params.get("join")?.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 6) ?? "";
    // This is the intentional client-only hydration point for a shared join URL.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (join) { setInitialCode(join); setView("join"); }
    try {
      const saved = localStorage.getItem(STORAGE_KEY); if (!saved) return;
      const parsed = JSON.parse(saved) as Bridge;
      if (parsed.session.expiresAt > Date.now()) setResume(parsed); else localStorage.removeItem(STORAGE_KEY);
    } catch { localStorage.removeItem(STORAGE_KEY); }
  }, []);

  const saveBridge = useCallback((next: Bridge) => {
    setBridge(next); setResume(next); setView("bridge"); localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  useEffect(() => {
    if (!bridge || view !== "bridge") return;
    let controller: AbortController | null = null;
    const poll = async () => {
      if (document.hidden) return;
      controller?.abort(); controller = new AbortController();
      try {
        const response = await fetch(`/api/sessions/${bridge.session.code}`, { headers: auth(bridge.token), cache: "no-store", signal: controller.signal });
        if (response.status === 404) { localStorage.removeItem(STORAGE_KEY); setBridge(null); setResume(null); setView("landing"); return; }
        if (!response.ok) return;
        const result = (await response.json()) as ApiResult;
        if (result.session) saveBridge({ token: bridge.token, session: result.session });
      } catch { /* a dropped poll is recovered on the next interval */ }
    };
    const interval = window.setInterval(poll, bridge.session.status === "postcard_ready" ? 500 : 1100);
    const onVisible = () => !document.hidden && void poll(); document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearInterval(interval); controller?.abort(); document.removeEventListener("visibilitychange", onVisible); };
  }, [bridge?.token, bridge?.session.code, bridge?.session.status, view, saveBridge]);

  async function createHost() {
    setOpening(true); setGlobalError("");
    try {
      const result = await api<ApiResult>("/api/sessions", { method: "POST", body: JSON.stringify({ demo: false }) });
      if (!result.token || !result.session) throw new Error("A private bridge could not open.");
      saveBridge({ token: result.token, session: result.session });
    } catch (caught) { setGlobalError(caught instanceof Error ? caught.message : "The bridge could not open."); }
    finally { setOpening(false); }
  }

  async function deleteBridge() {
    if (!bridge) return;
    await fetch(`/api/sessions/${bridge.session.code}/delete`, { method: "DELETE", headers: auth(bridge.token) }).catch(() => undefined);
    localStorage.removeItem(STORAGE_KEY); setBridge(null); setResume(null); setView("landing");
  }

  async function resumeBridge() {
    if (!resume) return;
    try {
      const result = await api<ApiResult>(`/api/sessions/${resume.session.code}`, { headers: auth(resume.token) }, 4_000);
      if (!result.session) throw new Error(); saveBridge({ token: resume.token, session: result.session });
    } catch { localStorage.removeItem(STORAGE_KEY); setResume(null); setGlobalError("That saved bridge has faded. Open a new one."); }
  }

  if (view === "demo") return <DemoStage onExit={() => setView("landing")} />;
  if (view === "join") return <JoinView initialCode={initialCode} onBack={() => setView("landing")} onJoined={saveBridge} />;
  if (view === "bridge" && bridge) return <BridgeView bridge={bridge} onUpdate={saveBridge} onExit={() => setView("landing")} onDelete={deleteBridge} onNew={createHost} />;
  return <>{opening && <div className="opening-overlay"><Spinner label="Opening your private bridge" /></div>}<Landing onHost={createHost} onGuest={() => setView("join")} onDemo={() => setView("demo")} resume={resume} onResume={resumeBridge} />{globalError && <div className="toast"><Notice tone="error">{globalError}</Notice></div>}</>;
}

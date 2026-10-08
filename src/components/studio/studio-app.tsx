import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  BookmarkPlus,
  Dices,
  Download,
  FlipHorizontal2,
  Pause,
  PenLine,
  Play,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import { commissionFighter } from "@/lib/studio/commission";
import { buildAtlas, canvasBlob, downloadBlob, slug } from "@/lib/studio/export";
import { expandClip, frameAdvantage, getClip, phaseCounts } from "@/lib/studio/poses";
import { paintCell } from "@/lib/studio/render";
import { persistStudio, useStudio } from "@/lib/studio/store";
import type { ClipId, FrameContacts, Phase } from "@/lib/studio/types";
import { ARCHETYPE_LABEL, ARCHETYPES, CELL_H, CELL_W, CLIP_IDS } from "@/lib/studio/types";
import { SpriteView } from "./sprite-view";

const COMBAT = new Set<ClipId>(["jab", "heavy", "special"]);

function phaseBar(phase: Phase) {
  if (phase === "active") return "bg-primary";
  if (phase === "startup") return "bg-line";
  if (phase === "recovery") return "bg-muted";
  return "bg-surface-2";
}

export function StudioApp() {
  const studio = useStudio();
  const [tab, setTab] = useState<"stage" | "fighter" | "moves">("stage");
  const [shelfOpen, setShelfOpen] = useState(false);
  const [vibe, setVibe] = useState("");
  const [busy, setBusy] = useState(false);
  const [sheet, setSheet] = useState<string | null>(null);
  const stageRef = useRef<HTMLCanvasElement>(null);
  const [contacts, setContacts] = useState<FrameContacts | null>(null);

  useEffect(() => {
    studio.hydrate();
  }, [studio.hydrate]);

  useEffect(() => {
    if (!studio.hydrated) return;
    persistStudio();
  }, [
    studio.hydrated,
    studio.dna,
    studio.tunes,
    studio.note,
    studio.shelf,
    studio.clip,
    studio.zoom,
    studio.onion,
    studio.showHit,
    studio.showHurt,
    studio.facing,
    studio.tempo,
    studio.repeat,
  ]);

  const tune = studio.tunes[studio.clip];
  const clip = useMemo(
    () => expandClip(getClip(studio.clip, studio.dna.archetype), tune),
    [studio.clip, studio.dna.archetype, tune],
  );
  const frame = Math.min(studio.frame, Math.max(0, clip.poses.length - 1));
  const pose = clip.poses[frame] ?? clip.poses[0]!;
  const hitActive = clip.hitActive[frame] ?? false;

  useEffect(() => {
    if (studio.frame !== frame) useStudio.setState({ frame });
  }, [studio.frame, frame]);

  useEffect(() => {
    if (!studio.playing) return;
    let raf = 0;
    let acc = 0;
    let last = performance.now();
    const stepMs = 1000 / (clip.fps * studio.tempo);
    const length = clip.poses.length;
    const loop = (now: number) => {
      acc += now - last;
      last = now;
      while (acc >= stepMs) {
        acc -= stepMs;
        useStudio.getState().advance(length);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [studio.playing, clip.fps, studio.tempo, clip.poses.length]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
      if (event.key === " ") {
        event.preventDefault();
        const playing = useStudio.getState().playing;
        useStudio.getState().setPlaying(!playing);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        useStudio.getState().step(1, clip.poses.length);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        useStudio.getState().step(-1, clip.poses.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clip.poses.length]);

  useEffect(() => {
    const canvas = stageRef.current;
    if (!canvas) return;
    const prevIndex = (frame - 1 + clip.poses.length) % clip.poses.length;
    const next = paintCell(canvas, studio.dna, pose, {
      hitActive,
      facing: studio.facing,
      onion: studio.onion
        ? { pose: clip.poses[prevIndex]!, hitActive: clip.hitActive[prevIndex] ?? false }
        : null,
    });
    setContacts(next);
  }, [studio.dna, pose, hitActive, studio.facing, studio.onion, frame, clip]);

  const counts = phaseCounts(clip.phases);
  const advantage = frameAdvantage(clip, frame, tune.hitstun);
  const stageWidth = CELL_W * studio.zoom;

  async function onCommission() {
    if (busy) return;
    setBusy(true);
    studio.setStatus("The desk is writing…");
    try {
      const res = await commissionFighter({ data: { vibe } });
      if (!res.ok) {
        studio.setStatus(res.error);
        return;
      }
      studio.applyBuilt(res.payload.dna, res.payload.tunes, res.payload.note);
    } catch {
      studio.setStatus("The commission failed. Roll a fighter instead.");
    } finally {
      setBusy(false);
    }
  }

  async function onSheet() {
    try {
      const { canvas, meta } = buildAtlas(studio.dna, studio.tunes, studio.note, studio.facing);
      const blob = await canvasBlob(canvas);
      downloadBlob(`${slug(studio.dna.name)}-sheet.png`, blob);
      setSheet(canvas.toDataURL("image/png"));
      studio.setStatus(`Sheet saved · ${meta.clips.length} rows.`);
    } catch {
      studio.setStatus("Could not build the sheet.");
    }
  }

  function onJson() {
    const { meta } = buildAtlas(studio.dna, studio.tunes, studio.note, studio.facing);
    downloadBlob(
      `${slug(studio.dna.name)}-moveset.json`,
      new Blob([JSON.stringify(meta, null, 2)], { type: "application/json" }),
    );
    studio.setStatus("Moveset JSON saved.");
  }

  const fighter = (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-muted">Archetype</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {ARCHETYPES.map((id) => {
            const on = studio.dna.archetype === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={on}
                onClick={() => studio.setArchetype(id)}
                className={`min-h-11 rounded-md border px-2 text-sm transition-transform duration-150 ease-out active:scale-[0.96] ${
                  on ? "border-primary text-fg" : "border-border bg-surface-2 text-muted"
                }`}
              >
                {ARCHETYPE_LABEL[id]}
              </button>
            );
          })}
        </div>
      </div>

      <label className="block">
        <span className="text-xs text-muted">Name</span>
        <input
          value={studio.dna.name}
          onChange={(event) => studio.patchDna({ name: event.target.value.slice(0, 48) })}
          className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-fg outline-none focus-visible:border-primary"
        />
      </label>
      <label className="block">
        <span className="text-xs text-muted">Epithet</span>
        <input
          value={studio.dna.epithet}
          onChange={(event) => studio.patchDna({ epithet: event.target.value.slice(0, 48) })}
          className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-fg outline-none focus-visible:border-primary"
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ["Skin", "skin"],
            ["Cloth", "cloth"],
            ["Trim", "cloth2"],
            ["Metal", "metal"],
            ["Accent", "accent"],
            ["Eye", "eye"],
          ] as const
        ).map(([label, key]) => (
          <label key={key} className="flex items-center justify-between gap-2 rounded-md border border-border bg-bg px-2 py-1.5">
            <span className="text-xs text-muted">{label}</span>
            <input
              type="color"
              aria-label={label}
              value={studio.dna[key]}
              onChange={(event) => studio.patchDna({ [key]: event.target.value })}
              className="h-8 w-10 border border-border bg-transparent"
            />
          </label>
        ))}
      </div>

      <Slider label="Bulk" value={studio.dna.bulk} onChange={(bulk) => studio.patchDna({ bulk })} />
      <Slider label="Height" value={studio.dna.height} onChange={(height) => studio.patchDna({ height })} />
      <Slider
        label="Weapon"
        value={studio.dna.weaponScale}
        onChange={(weaponScale) => studio.patchDna({ weaponScale })}
      />

      <div className="flex flex-wrap gap-2">
        <Toggle on={studio.dna.cape} label="Cape" onClick={() => studio.patchDna({ cape: !studio.dna.cape })} />
        <Toggle on={studio.dna.helm} label="Helm" onClick={() => studio.patchDna({ helm: !studio.dna.helm })} />
        <Toggle on={studio.dna.horns} label="Horns" onClick={() => studio.patchDna({ horns: !studio.dna.horns })} />
      </div>

      <label className="block">
        <span className="text-xs text-muted">Dossier</span>
        <textarea
          value={studio.note}
          onChange={(event) => useStudio.setState({ note: event.target.value.slice(0, 280) })}
          rows={3}
          className="mt-1 w-full resize-none rounded-md border border-border bg-bg px-3 py-2 text-sm text-fg outline-none focus-visible:border-primary"
        />
      </label>

      <div className="space-y-2 rounded-md border border-border bg-bg p-3">
        <p className="text-sm text-fg">Commission</p>
        <p className="text-xs text-pretty text-muted">
          The desk names a fighter and tunes the card. Every cell is still drawn here, so the sheet stays consistent.
        </p>
        <textarea
          value={vibe}
          onChange={(event) => setVibe(event.target.value.slice(0, 400))}
          rows={2}
          placeholder="A patient duelist who hates jumping"
          className="w-full resize-none rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg outline-none placeholder:text-muted focus-visible:border-primary"
        />
        <button
          type="button"
          disabled={busy}
          onClick={onCommission}
          className="inline-flex min-h-11 items-center gap-2 rounded-md bg-fg px-3 text-sm text-bg transition-transform duration-150 ease-out active:scale-[0.96] disabled:opacity-50"
        >
          <PenLine className="h-4 w-4" />
          {busy ? "Writing…" : "Ask the desk"}
        </button>
      </div>
    </div>
  );

  const stage = (
    <div className="flex min-h-0 flex-col gap-3">
      <div>
        <h2 className="font-display text-3xl leading-none text-fg">{studio.dna.name}</h2>
        <p className="mt-1 text-sm text-muted">{studio.dna.epithet}</p>
      </div>
      <div className="checker flex items-center justify-center rounded-lg border border-border p-3">
        <div
          className="relative mx-auto"
          style={{
            width: `min(100%, ${stageWidth}px, calc(42vh * ${CELL_W} / ${CELL_H}))`,
            aspectRatio: `${CELL_W} / ${CELL_H}`,
          }}
        >
          <canvas
            ref={stageRef}
            width={CELL_W}
            height={CELL_H}
            role="img"
            aria-label={`${studio.dna.name}, ${tune.name}, cell ${frame + 1} of ${clip.poses.length}`}
            className="pixel h-auto w-full"
          />
          {studio.showHurt && contacts ? (
            <BoxMark box={contacts.hurt} tone="hurt" label="Hurt" />
          ) : null}
          {studio.showHit && contacts?.hit ? <BoxMark box={contacts.hit} tone="hit" label="Hit" /> : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <IconButton label="Previous cell" onClick={() => studio.step(-1, clip.poses.length)}>
          <SkipBack className="h-4 w-4" />
        </IconButton>
        <button
          type="button"
          onClick={() => studio.setPlaying(!studio.playing)}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md bg-fg text-bg transition-transform duration-150 ease-out active:scale-[0.96]"
          aria-label={studio.playing ? "Pause" : "Play"}
        >
          <span className="relative grid h-4 w-4 place-items-center">
            <Play
              className={`col-start-1 row-start-1 h-4 w-4 transition-[opacity,filter,scale] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
                studio.playing ? "scale-[0.25] opacity-0 blur-xs" : "scale-100 opacity-100 blur-none"
              }`}
            />
            <Pause
              className={`col-start-1 row-start-1 h-4 w-4 transition-[opacity,filter,scale] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
                studio.playing ? "scale-100 opacity-100 blur-none" : "scale-[0.25] opacity-0 blur-xs"
              }`}
            />
          </span>
        </button>
        <IconButton label="Next cell" onClick={() => studio.step(1, clip.poses.length)}>
          <SkipForward className="h-4 w-4" />
        </IconButton>
        <p className="px-1 text-sm tabular-nums text-muted">
          {String(frame + 1).padStart(2, "0")} / {String(clip.poses.length).padStart(2, "0")}
          <span className="ml-2 text-fg">{tune.name}</span>
        </p>
        <div className="ml-auto flex flex-wrap gap-2">
          <Toggle on={studio.onion} label="Onion" onClick={() => studio.toggle("onion")} />
          <Toggle on={studio.showHit} label="Hit" onClick={() => studio.toggle("showHit")} />
          <Toggle on={studio.showHurt} label="Hurt" onClick={() => studio.toggle("showHurt")} />
          <IconButton label="Flip facing" onClick={() => studio.flip()}>
            <FlipHorizontal2 className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
      <div className="flex gap-3">
        <label className="block min-w-0 flex-1">
          <span className="flex justify-between text-xs text-muted">
            Zoom
            <span className="tabular-nums">{studio.zoom}×</span>
          </span>
          <input
            type="range"
            min={2}
            max={6}
            value={studio.zoom}
            onChange={(event) => studio.setZoom(Number(event.target.value))}
            className="mt-1 w-full accent-primary"
          />
        </label>
        <label className="block min-w-0 flex-1">
          <span className="flex justify-between text-xs text-muted">
            Tempo
            <span className="tabular-nums">{studio.tempo.toFixed(2)}</span>
          </span>
          <input
            type="range"
            min={50}
            max={200}
            value={Math.round(studio.tempo * 100)}
            onChange={(event) => studio.setTempo(Number(event.target.value) / 100)}
            className="mt-1 w-full accent-primary"
          />
        </label>
      </div>
      <div className="flex h-2 overflow-hidden rounded-sm">
        {clip.phases.map((phase, index) => (
          <button
            key={`${phase}-${index}`}
            type="button"
            aria-label={`Cell ${index + 1}, ${phase}`}
            onClick={() => studio.setFrame(index)}
            className={`h-2 flex-1 ${phaseBar(phase)} ${index === frame ? "outline outline-1 outline-fg" : ""}`}
          />
        ))}
      </div>
      <div className="overflow-x-auto">
        <div className="flex w-max gap-2 pb-1">
          {clip.poses.map((cellPose, index) => (
            <button
              key={index}
              type="button"
              onClick={() => studio.setFrame(index)}
              className={`rounded-sm border bg-surface p-1 transition-transform duration-150 ease-out active:scale-[0.96] ${
                index === frame ? "border-primary" : "border-border"
              }`}
              aria-label={`Show cell ${index + 1}`}
            >
              <SpriteView dna={studio.dna} pose={cellPose} hitActive={clip.hitActive[index] ?? false} />
              <span className={`mt-1 block h-1 ${phaseBar(clip.phases[index] ?? "loop")}`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const moves = (
    <div className="space-y-4">
      <div className="space-y-1">
        {CLIP_IDS.map((id) => {
          const on = id === studio.clip;
          const row = studio.tunes[id];
          return (
            <button
              key={id}
              type="button"
              onClick={() => studio.setClip(id)}
              className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-md border px-3 text-left text-sm transition-transform duration-150 ease-out active:scale-[0.96] ${
                on ? "border-primary text-fg" : "border-border bg-surface-2 text-muted"
              }`}
            >
              <span className="truncate">{row.name}</span>
              <span className="shrink-0 tabular-nums text-xs">{getClip(id, studio.dna.archetype).fps} fps</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2 rounded-md border border-border bg-bg p-3">
        <label className="block">
          <span className="text-xs text-muted">Move name</span>
          <input
            value={tune.name}
            onChange={(event) => studio.patchTune(studio.clip, { name: event.target.value.slice(0, 40) })}
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-fg outline-none focus-visible:border-primary"
          />
        </label>
        <p className="text-xs text-muted">
          {clip.loop
            ? `Loop · ${counts.loop || clip.poses.length} cells · ${clip.fps} fps`
            : `Startup ${counts.startup} · Active ${counts.active} · Recovery ${counts.recovery}`}
        </p>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
          <dt className="text-muted">Phase</dt>
          <dd className="text-right capitalize tabular-nums">{clip.phases[frame]}</dd>
          <dt className="text-muted">Invulnerable</dt>
          <dd className="text-right">{clip.invuln[frame] ? "Yes" : "No"}</dd>
          <dt className="text-muted">Airborne</dt>
          <dd className="text-right">{clip.airborne[frame] ? "Yes" : "No"}</dd>
          {advantage !== null ? (
            <>
              <dt className="text-muted">Advantage</dt>
              <dd className={`text-right tabular-nums ${advantage >= 0 ? "text-fg" : "text-primary"}`}>
                {advantage > 0 ? `+${advantage}` : advantage}
              </dd>
            </>
          ) : null}
        </dl>
        {COMBAT.has(studio.clip) ? (
          <div className="space-y-3 pt-1">
            <IntSlider
              label="Damage"
              min={1}
              max={32}
              value={tune.damage}
              onChange={(damage) => studio.patchTune(studio.clip, { damage })}
            />
            <IntSlider
              label="Hitstun"
              min={1}
              max={40}
              value={tune.hitstun}
              onChange={(hitstun) => studio.patchTune(studio.clip, { hitstun })}
            />
            <IntSlider
              label="Knockback"
              min={0}
              max={16}
              value={tune.knockback}
              onChange={(knockback) => studio.patchTune(studio.clip, { knockback })}
            />
          </div>
        ) : null}
        {!clip.loop || tune.windup > 0 || tune.recoverPad > 0 ? (
          <div className="space-y-3 pt-1">
            <IntSlider
              label="Extra startup"
              min={0}
              max={4}
              value={tune.windup}
              onChange={(windup) => studio.patchTune(studio.clip, { windup })}
            />
            <IntSlider
              label="Extra recovery"
              min={0}
              max={4}
              value={tune.recoverPad}
              onChange={(recoverPad) => studio.patchTune(studio.clip, { recoverPad })}
            />
          </div>
        ) : null}
        <button
          type="button"
          aria-pressed={studio.repeat}
          onClick={() => studio.toggle("repeat")}
          className={`min-h-11 rounded-md border px-3 text-sm ${studio.repeat ? "border-primary text-fg" : "border-border text-muted"}`}
        >
          Repeat playback
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSheet}
          className="inline-flex min-h-11 items-center gap-2 rounded-md bg-fg px-3 text-sm text-bg transition-transform duration-150 ease-out active:scale-[0.96]"
        >
          <Download className="h-4 w-4" />
          Sprite sheet
        </button>
        <button
          type="button"
          onClick={onJson}
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-surface-2 px-3 text-sm text-fg transition-transform duration-150 ease-out active:scale-[0.96]"
        >
          Moveset JSON
        </button>
      </div>
      <p className="text-xs text-pretty text-muted">
        Cells are {CELL_W}×{CELL_H}, origin top-left, one row per move. The JSON carries phases, hitstun, and boxes.
      </p>
      {sheet ? (
        <div className="overflow-auto rounded-md border border-border bg-bg p-2">
          <img src={sheet} alt="Exported sprite sheet" className="pixel h-56 max-w-none" />
        </div>
      ) : null}
    </div>
  );

  return (
    <main className="mx-auto flex min-h-dvh max-w-7xl flex-col px-3 py-3 lg:h-dvh lg:overflow-hidden lg:px-4" data-app="cellwright">
      <header className="flex flex-wrap items-center gap-3 border-b border-border pb-3">
        <div className="mr-auto">
          <p className="text-xs text-muted">Animation desk</p>
          <h1 className="font-display text-2xl leading-none">Cellwright</h1>
        </div>
        <button
          type="button"
          onClick={() => studio.roll()}
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-surface-2 px-3 text-sm text-fg transition-transform duration-150 ease-out active:scale-[0.96]"
        >
          <Dices className="h-4 w-4" />
          Roll
        </button>
        <button
          type="button"
          onClick={() => studio.rollColors()}
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-surface-2 px-3 text-sm text-fg transition-transform duration-150 ease-out active:scale-[0.96]"
        >
          Recolor
        </button>
        <button
          type="button"
          onClick={() => studio.pin()}
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-surface-2 px-3 text-sm text-fg transition-transform duration-150 ease-out active:scale-[0.96]"
        >
          <BookmarkPlus className="h-4 w-4" />
          Pin
        </button>
        <button
          type="button"
          onClick={() => setShelfOpen(true)}
          className="inline-flex min-h-11 items-center gap-2 rounded-md bg-fg px-3 text-sm text-bg transition-transform duration-150 ease-out active:scale-[0.96]"
        >
          Shelf
          <span className="tabular-nums">{studio.shelf.length}</span>
        </button>
      </header>

      <p className="sr-only" aria-live="polite">
        {studio.status}
      </p>
      {studio.status ? <p className="pt-2 text-xs text-muted">{studio.status}</p> : null}

      <div className="mt-3 flex gap-2 lg:hidden">
        {(
          [
            ["stage", "Stage"],
            ["fighter", "Fighter"],
            ["moves", "Moves"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`min-h-11 flex-1 rounded-md border text-sm ${tab === id ? "border-primary text-fg" : "border-border text-muted"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3 grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)_300px]">
        <section className={`min-h-0 overflow-y-auto pr-1 ${tab === "fighter" ? "block" : "hidden"} lg:block`}>
          {fighter}
        </section>
        <section className={`min-h-0 overflow-y-auto ${tab === "stage" ? "block" : "hidden"} lg:block`}>{stage}</section>
        <section className={`min-h-0 overflow-y-auto pr-1 ${tab === "moves" ? "block" : "hidden"} lg:block`}>
          {moves}
        </section>
      </div>

      {shelfOpen ? (
        <div className="fixed inset-0 z-30 flex justify-end bg-bg/80" role="presentation" onClick={() => setShelfOpen(false)}>
          <div
            role="dialog"
            aria-label="Shelf"
            className="h-full w-full max-w-md overflow-y-auto border-l border-border bg-surface p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl">Shelf</h2>
              <button
                type="button"
                aria-label="Close shelf"
                onClick={() => setShelfOpen(false)}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {studio.shelf.length === 0 ? (
              <p className="text-sm text-pretty text-muted">The shelf is empty. Pin a fighter before a reroll takes them.</p>
            ) : (
              <ul className="space-y-3">
                {studio.shelf.map((entry) => (
                  <li key={entry.id} className="flex gap-3 rounded-md border border-border bg-bg p-2">
                    <SpriteView
                      dna={entry.dna}
                      pose={getClip("idle", entry.dna.archetype).poses[0]!}
                      hitActive={false}
                      className="h-20 w-auto"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-lg leading-tight">{entry.dna.name}</p>
                      <p className="truncate text-xs text-muted">
                        {entry.dna.epithet} · {ARCHETYPE_LABEL[entry.dna.archetype]}
                      </p>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            studio.loadShelf(entry.id);
                            setShelfOpen(false);
                          }}
                          className="min-h-11 rounded-md bg-fg px-3 text-sm text-bg"
                        >
                          Open
                        </button>
                        <button
                          type="button"
                          onClick={() => studio.dropShelf(entry.id)}
                          className="min-h-11 rounded-md border border-border px-3 text-sm text-muted"
                        >
                          Drop
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block min-w-0 flex-1">
      <span className="flex justify-between text-xs text-muted">
        {label}
        <span className="tabular-nums">{Math.round(value * 100)}</span>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(event) => onChange(Number(event.target.value) / 100)}
        className="mt-1 w-full accent-primary"
      />
    </label>
  );
}

function IntSlider({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex justify-between text-xs text-muted">
        {label}
        <span className="tabular-nums text-fg">{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 w-full accent-primary"
      />
    </label>
  );
}

function Toggle({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`min-h-11 rounded-md border px-3 text-sm transition-transform duration-150 ease-out active:scale-[0.96] ${
        on ? "border-primary text-fg" : "border-border text-muted"
      }`}
    >
      {label}
    </button>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border bg-surface-2 text-fg transition-transform duration-150 ease-out active:scale-[0.96]"
    >
      {children}
    </button>
  );
}

function BoxMark({ box, tone, label }: { box: { x: number; y: number; w: number; h: number }; tone: "hit" | "hurt"; label: string }) {
  return (
    <div
      className={`pointer-events-none absolute border ${tone === "hit" ? "border-primary" : "border-fg"}`}
      style={{
        left: `${(box.x / CELL_W) * 100}%`,
        top: `${(box.y / CELL_H) * 100}%`,
        width: `${(box.w / CELL_W) * 100}%`,
        height: `${(box.h / CELL_H) * 100}%`,
      }}
    >
      <span className={`absolute -top-4 left-0 text-xs ${tone === "hit" ? "text-primary" : "text-fg"}`}>{label}</span>
    </div>
  );
}

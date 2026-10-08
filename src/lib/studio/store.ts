import { create } from "zustand";
import { BOOT_DNA, defaultTunes, describeFighter, makeDna, rerollColors } from "./dna";
import type { ArchetypeId, ClipId, Dna, MoveTune, ShelfEntry, Tunes } from "./types";

const KEY = "cellwright.studio.v1";

type Persisted = {
  dna: Dna;
  tunes: Tunes;
  note: string;
  shelf: ShelfEntry[];
  clip: ClipId;
  zoom: number;
  onion: boolean;
  showHit: boolean;
  showHurt: boolean;
  facing: 1 | -1;
  tempo: number;
  repeat: boolean;
};

type Studio = Persisted & {
  frame: number;
  playing: boolean;
  hydrated: boolean;
  status: string;
  setStatus: (status: string) => void;
  hydrate: () => void;
  patchDna: (patch: Partial<Dna>) => void;
  setArchetype: (archetype: ArchetypeId) => void;
  setClip: (clip: ClipId) => void;
  setFrame: (frame: number) => void;
  setPlaying: (playing: boolean) => void;
  setZoom: (zoom: number) => void;
  setTempo: (tempo: number) => void;
  toggle: (key: "onion" | "showHit" | "showHurt" | "repeat") => void;
  flip: () => void;
  step: (dir: number, length: number) => void;
  advance: (length: number) => void;
  patchTune: (id: ClipId, patch: Partial<MoveTune>) => void;
  roll: () => void;
  rollColors: () => void;
  applyBuilt: (dna: Dna, tunes: Tunes, note: string) => void;
  pin: () => void;
  loadShelf: (id: string) => void;
  dropShelf: (id: string) => void;
};

function fresh(seed = (Math.random() * 0xffffffff) >>> 0): Pick<Studio, "dna" | "tunes" | "note"> {
  const dna = makeDna(seed);
  return { dna, tunes: defaultTunes(dna.archetype), note: describeFighter(dna) };
}

const bootTunes = defaultTunes(BOOT_DNA.archetype);
const bootNote = "Mara Voss, the Red Ledger. Short tells, then the whole blade. Recovery is the price of the oath.";

export const useStudio = create<Studio>((set, get) => ({
  dna: BOOT_DNA,
  tunes: bootTunes,
  note: bootNote,
  shelf: [],
  clip: "idle",
  zoom: 4,
  onion: false,
  showHit: false,
  showHurt: false,
  facing: 1,
  tempo: 1,
  repeat: true,
  frame: 0,
  playing: true,
  hydrated: false,
  status: "",
  setStatus: (status) => set({ status }),
  hydrate: () => {
    if (get().hydrated) return;
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) {
        set({ hydrated: true });
        return;
      }
      const data = JSON.parse(raw) as Partial<Persisted>;
      if (!data.dna || !data.tunes) {
        set({ hydrated: true });
        return;
      }
      set({
        dna: data.dna,
        tunes: { ...defaultTunes(data.dna.archetype), ...data.tunes },
        note: data.note ?? describeFighter(data.dna),
        shelf: Array.isArray(data.shelf) ? data.shelf : [],
        clip: data.clip ?? "idle",
        zoom: data.zoom ?? 4,
        onion: Boolean(data.onion),
        showHit: Boolean(data.showHit),
        showHurt: Boolean(data.showHurt),
        facing: data.facing === -1 ? -1 : 1,
        tempo: data.tempo ?? 1,
        repeat: data.repeat !== false,
        frame: 0,
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },
  patchDna: (patch) => set({ dna: { ...get().dna, ...patch } }),
  setArchetype: (archetype) => {
    const dna = { ...get().dna, archetype };
    set({ dna, tunes: defaultTunes(archetype), note: describeFighter(dna), frame: 0 });
  },
  setClip: (clip) => set({ clip, frame: 0 }),
  setFrame: (frame) => set({ frame, playing: false }),
  setPlaying: (playing) => set({ playing }),
  setZoom: (zoom) => set({ zoom }),
  setTempo: (tempo) => set({ tempo }),
  toggle: (key) => set({ [key]: !get()[key] }),
  flip: () => set({ facing: get().facing === 1 ? -1 : 1 }),
  step: (dir, length) => {
    const n = Math.max(1, length);
    set({ frame: (get().frame + dir + n) % n, playing: false });
  },
  advance: (length) => {
    const n = Math.max(1, length);
    const next = get().frame + 1;
    if (next >= n) set({ frame: 0, playing: get().repeat });
    else set({ frame: next });
  },
  patchTune: (id, patch) => set({ tunes: { ...get().tunes, [id]: { ...get().tunes[id], ...patch } } }),
  roll: () => {
    const next = fresh();
    set({ ...next, frame: 0, clip: "idle", status: `Rolled ${next.dna.name}.` });
  },
  rollColors: () => {
    const dna = rerollColors(get().dna, (Math.random() * 0xffffffff) >>> 0);
    set({ dna, status: "Palette shifted." });
  },
  applyBuilt: (dna, tunes, note) => set({ dna, tunes, note, frame: 0, clip: "idle", status: `Commissioned ${dna.name}.` }),
  pin: () => {
    const { dna, tunes, note, shelf } = get();
    const entry: ShelfEntry = {
      id: `${dna.seed.toString(16)}-${Date.now().toString(36)}`,
      savedAt: Date.now(),
      dna,
      tunes,
      note,
    };
    const next = [entry, ...shelf].slice(0, 24);
    set({ shelf: next, status: `Pinned ${dna.name} to the shelf.` });
  },
  loadShelf: (id) => {
    const entry = get().shelf.find((item) => item.id === id);
    if (!entry) return;
    set({
      dna: entry.dna,
      tunes: entry.tunes,
      note: entry.note,
      frame: 0,
      clip: "idle",
      status: `Brought ${entry.dna.name} back to the desk.`,
    });
  },
  dropShelf: (id) => set({ shelf: get().shelf.filter((item) => item.id !== id) }),
}));

export function persistStudio() {
  const s = useStudio.getState();
  if (!s.hydrated) return;
  const data: Persisted = {
    dna: s.dna,
    tunes: s.tunes,
    note: s.note,
    shelf: s.shelf,
    clip: s.clip,
    zoom: s.zoom,
    onion: s.onion,
    showHit: s.showHit,
    showHurt: s.showHurt,
    facing: s.facing,
    tempo: s.tempo,
    repeat: s.repeat,
  };
  localStorage.setItem(KEY, JSON.stringify(data));
}

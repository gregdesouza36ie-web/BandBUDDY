import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  ExternalLink,
  GripVertical,
  LayoutDashboard,
  Library,
  MapPin,
  Menu,
  MoreHorizontal,
  Music2,
  Pencil,
  Play,
  Plus,
  Radio,
  Settings2,
  Share2,
  Sparkles,
  Trash2,
  UserRoundPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";

type SetName = "Set A" | "Set B" | "Set C";
const setNames: SetName[] = ["Set A", "Set B", "Set C"];

type Song = {
  id: number;
  title: string;
  artist: string;
  videoUrl: string;
  sourceKey: string;
  singerKey: string;
  duration: string;
  setName: SetName;
  status: "ready" | "needs-key";
};

const keyOptions = ["—", "C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

const initialSongs: Song[] = [
  { id: 1, title: "Valerie", artist: "Amy Winehouse", videoUrl: "https://www.youtube.com/watch?v=naXyF0rB0js", sourceKey: "E", singerKey: "D", duration: "3:38", setName: "Set A", status: "ready" },
  { id: 2, title: "Use Somebody", artist: "Kings of Leon", videoUrl: "https://www.youtube.com/watch?v=gnhXHSgNMJ0", sourceKey: "C#", singerKey: "B", duration: "3:51", setName: "Set A", status: "ready" },
  { id: 3, title: "Sweet Home Chicago", artist: "Robert Johnson", videoUrl: "https://www.youtube.com/watch?v=O8hqGu-leFc", sourceKey: "A", singerKey: "A", duration: "4:09", setName: "Set A", status: "ready" },
  { id: 4, title: "The Way You Make Me Feel", artist: "Michael Jackson", videoUrl: "https://www.youtube.com/watch?v=HzZ_urpj4As", sourceKey: "G", singerKey: "F", duration: "4:58", setName: "Set B", status: "ready" },
  { id: 5, title: "Mr. Brightside", artist: "The Killers", videoUrl: "https://www.youtube.com/watch?v=gGdGFtwCNBE", sourceKey: "D", singerKey: "—", duration: "3:42", setName: "Set B", status: "needs-key" },
];

const members = [
  { name: "Greg", role: "Band lead", initials: "G", tone: "red", online: true },
  { name: "Aoife", role: "Vocals", initials: "A", tone: "sage", online: true },
  { name: "Mark", role: "Guitar", initials: "M", tone: "blue", online: false },
  { name: "Sarah", role: "Keys", initials: "S", tone: "gold", online: false },
];

const activity = [
  { name: "Aoife", initials: "A", tone: "sage", action: "changed the singer key", detail: "Valerie · D", time: "2m" },
  { name: "Greg", initials: "G", tone: "red", action: "added a song", detail: "Mr. Brightside", time: "18m" },
  { name: "Mark", initials: "M", tone: "blue", action: "shared a video link", detail: "Sweet Home Chicago", time: "42m" },
];

function extractYouTubeId(value: string) {
  const match = value.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/i);
  return match?.[1] ?? null;
}

function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function getYouTubeDuration(videoUrl: string): Promise<number | null> {
  const videoId = extractYouTubeId(videoUrl);
  if (!videoId || typeof window === "undefined") return Promise.resolve(null);

  return new Promise(resolve => {
    const host = document.createElement("div");
    host.setAttribute("aria-hidden", "true");
    host.style.position = "fixed";
    host.style.width = "1px";
    host.style.height = "1px";
    host.style.opacity = "0";
    host.style.pointerEvents = "none";
    host.style.left = "-10000px";
    document.body.appendChild(host);
    let settled = false;
    let player: { getDuration?: () => number; destroy?: () => void } | undefined;
    const finish = (duration: number | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      player?.destroy?.();
      host.remove();
      resolve(duration && duration > 0 ? duration : null);
    };
    const createPlayer = () => {
      const api = (window as typeof window & { YT?: { Player?: new (element: HTMLElement, options: unknown) => typeof player } }).YT;
      if (!api?.Player) return finish(null);
      player = new api.Player(host, { videoId, events: { onReady: (event: { target: { getDuration: () => number } }) => finish(event.target.getDuration()) } });
    };
    const timeout = window.setTimeout(() => finish(null), 10000);
    const youtubeWindow = window as typeof window & { YT?: unknown; onYouTubeIframeAPIReady?: () => void };
    if ((youtubeWindow.YT as { Player?: unknown } | undefined)?.Player) {
      createPlayer();
      return;
    }
    const previousReady = youtubeWindow.onYouTubeIframeAPIReady;
    youtubeWindow.onYouTubeIframeAPIReady = () => { previousReady?.(); createPlayer(); };
    if (!document.getElementById("youtube-iframe-api")) {
      const script = document.createElement("script");
      script.id = "youtube-iframe-api";
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    }
  });
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const inspectVideo = trpc.video.inspect.useMutation();
  const [songs, setSongs] = useState<Song[]>(initialSongs);
  const [isAdding, setIsAdding] = useState(false);
  const [addToSet, setAddToSet] = useState<SetName>("Set A");
  const [newTitle, setNewTitle] = useState("");
  const [newArtist, setNewArtist] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newDuration, setNewDuration] = useState("—");
  const [newSourceKey, setNewSourceKey] = useState("—");
  const [metadataStatus, setMetadataStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [draggedSongId, setDraggedSongId] = useState<number | null>(null);
  const [dragOverSongId, setDragOverSongId] = useState<number | null>(null);
  const [editingSongId, setEditingSongId] = useState<number | null>(null);
  const [linkDraft, setLinkDraft] = useState("");
  const [note, setNote] = useState("Open with Valerie — vocals should sit just behind the pocket.");
  const [activeNav, setActiveNav] = useState("Setlists");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const readyCount = useMemo(() => songs.filter(song => song.sourceKey !== "—" && song.singerKey !== "—").length, [songs]);
  const totalMinutes = useMemo(() => songs.reduce((total, song) => {
    if (song.duration === "—") return total;
    const [minutes, seconds] = song.duration.split(":").map(Number);
    return total + (minutes || 0) + (seconds || 0) / 60;
  }, 0), [songs]);
  const progress = songs.length ? Math.round((readyCount / songs.length) * 100) : 0;
  const displayName = user?.name?.split(" ")[0] || "Guest";
  const songsBySet = useMemo(() => setNames.map(setName => ({ setName, songs: songs.filter(song => song.setName === setName) })), [songs]);

  const updateSong = (id: number, field: "sourceKey" | "singerKey", value: string) => {
    setSongs(current => current.map(song => {
      if (song.id !== id) return song;
      const next = { ...song, [field]: value };
      return { ...next, status: next.sourceKey !== "—" && next.singerKey !== "—" ? "ready" : "needs-key" };
    }));
  };

  const updateSongSet = (id: number, setName: SetName) => {
    setSongs(current => current.map(song => song.id === id ? { ...song, setName } : song));
    toast.success(`Song moved to ${setName}.`);
  };

  const moveSong = (song: Song, direction: "up" | "down") => {
    setSongs(current => {
      const inSet = current.filter(item => item.setName === song.setName);
      const index = inSet.findIndex(item => item.id === song.id);
      const target = direction === "up" ? index - 1 : index + 1;
      if (index < 0 || target < 0 || target >= inSet.length) return current;
      const swapped = [...inSet];
      [swapped[index], swapped[target]] = [swapped[target], swapped[index]];
      const reorderedIds = new Set(swapped.map(item => item.id));
      let setIndex = 0;
      return current.map(item => reorderedIds.has(item.id) ? swapped[setIndex++] : item);
    });
  };

  const dropSongOnSong = (targetSong: Song) => {
    if (draggedSongId === null || draggedSongId === targetSong.id) return;
    setSongs(current => {
      const dragged = current.find(song => song.id === draggedSongId);
      if (!dragged) return current;
      const withoutDragged = current.filter(song => song.id !== draggedSongId);
      const targetIndex = withoutDragged.findIndex(song => song.id === targetSong.id);
      if (targetIndex < 0) return current;
      withoutDragged.splice(targetIndex, 0, { ...dragged, setName: targetSong.setName });
      return withoutDragged;
    });
    setDraggedSongId(null);
    setDragOverSongId(null);
  };

  const dropSongOnSet = (setName: SetName) => {
    if (draggedSongId === null) return;
    setSongs(current => current.map(song => song.id === draggedSongId ? { ...song, setName } : song));
    setDraggedSongId(null);
    setDragOverSongId(null);
  };

  const inspectNewVideo = async (value: string) => {
    const url = value.trim();
    if (!/^https?:\/\//i.test(url) || inspectVideo.isPending) return;
    setMetadataStatus("loading");
    try {
      const metadata = await inspectVideo.mutateAsync({ videoUrl: url });
      const titleParts = metadata.title?.split(" - ") ?? [];
      if (!newTitle.trim() && metadata.title) setNewTitle(titleParts.length > 1 ? titleParts.slice(1).join(" - ").replace(/\s*\([^)]*\)\s*$/, "") : metadata.title);
      if (!newArtist.trim() && (metadata.artist || titleParts.length > 1)) setNewArtist(titleParts.length > 1 ? titleParts[0] : metadata.artist || "");
      if (metadata.sourceKey) setNewSourceKey(metadata.sourceKey);
      const duration = await getYouTubeDuration(url);
      if (duration) setNewDuration(formatDuration(duration));
      setMetadataStatus("ready");
      toast.success(duration ? "Song details and duration found." : "Song title found. Duration is still loading from the player.");
    } catch {
      setMetadataStatus("error");
      toast.error("We couldn't read that video link. You can still fill the song in manually.");
    }
  };

  const beginLinkEdit = (song: Song) => {
    setEditingSongId(song.id);
    setLinkDraft(song.videoUrl);
  };

  const saveLink = (song: Song) => {
    const nextLink = linkDraft.trim();
    if (nextLink && !/^https?:\/\//i.test(nextLink)) {
      toast.error("Paste a full video URL starting with https://");
      return;
    }
    setSongs(current => current.map(item => item.id === song.id ? { ...item, videoUrl: nextLink } : item));
    setEditingSongId(null);
    toast.success(nextLink ? "Video link updated." : "Video link removed.");
  };

  const addSong = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newTitle.trim()) {
      toast.error("Give the song a name before adding it.");
      return;
    }
    if (newVideoUrl.trim() && !/^https?:\/\//i.test(newVideoUrl.trim())) {
      toast.error("Video links need to start with https://");
      return;
    }
    setSongs(current => [...current, {
      id: Date.now(), title: newTitle.trim(), artist: newArtist.trim() || "New addition", videoUrl: newVideoUrl.trim(),
      sourceKey: newSourceKey, singerKey: "—", duration: newDuration, setName: addToSet, status: "needs-key",
    }]);
    setNewTitle(""); setNewArtist(""); setNewVideoUrl(""); setNewDuration("—"); setNewSourceKey("—"); setMetadataStatus("idle"); setIsAdding(false);
    toast.success(`Song added to ${addToSet}.`);
  };

  const removeSong = (song: Song) => {
    setSongs(current => current.filter(item => item.id !== song.id));
    toast.success(`${song.title} removed from this setlist.`);
  };

  const openVideo = (song: Song) => {
    if (!song.videoUrl) {
      beginLinkEdit(song);
      return;
    }
    window.open(song.videoUrl, "_blank", "noopener,noreferrer");
  };

  const showComingSoon = (label: string) => toast.info(`${label} is coming next in the shared workspace.`);

  const renderSongRow = (song: Song, index: number, setSongCount: number) => (
    <div className={`song-row ${song.status === "needs-key" ? "needs-key" : ""} ${draggedSongId === song.id ? "is-dragged" : ""} ${dragOverSongId === song.id ? "is-drag-over" : ""}`} key={song.id} draggable onDragStart={event => { event.dataTransfer.effectAllowed = "move"; setDraggedSongId(song.id); }} onDragOver={event => { event.preventDefault(); setDragOverSongId(song.id); }} onDrop={event => { event.preventDefault(); dropSongOnSong(song); }} onDragEnd={() => { setDraggedSongId(null); setDragOverSongId(null); }}>
      <div className="song-main">
        <button className="drag-handle" onClick={() => toast.info("Use the up/down arrows to move this song.")} aria-label={`Reorder ${song.title}`}><GripVertical size={16} /></button>
        <div className="track-number">{String(index + 1).padStart(2, "0")}</div>
        <div className="song-copy"><strong>{song.title}</strong><span>{song.artist}</span></div>
        <button className="video-button" onClick={() => openVideo(song)} title={song.videoUrl ? "Open video reference" : "Add a video reference"}><Play size={13} fill="currentColor" /></button>
        <button className="link-edit-button" onClick={() => beginLinkEdit(song)} title="Edit video link" aria-label={`Edit video link for ${song.title}`}><Pencil size={13} /></button>
      </div>
      <div className="key-field"><span className="mobile-key-label">Source · auto</span><div className="key-control"><span className="key-swatch source-swatch" /><select className="key-select source-select" aria-label={`Detected source key for ${song.title}`} value={song.sourceKey} onChange={event => updateSong(song.id, "sourceKey", event.target.value)}>{keyOptions.map(key => <option value={key} key={key}>{key}</option>)}</select><Sparkles size={12} className="key-sparkle" /></div></div>
      <div className="key-field"><span className="mobile-key-label">Singer · manual</span><div className="key-control"><span className="key-swatch singer-swatch" /><select className="key-select singer-select" aria-label={`Singer performance key for ${song.title}`} value={song.singerKey} onChange={event => updateSong(song.id, "singerKey", event.target.value)}>{keyOptions.map(key => <option value={key} key={key}>{key}</option>)}</select></div></div>
      <div className="song-actions"><span className={`song-status ${song.status}`} title={song.status === "ready" ? "Both keys are set" : "Singer key still needed"}>{song.status === "ready" ? <Check size={14} /> : <span className="status-dash">—</span>}</span><div className="reorder-actions"><button className="mini-icon-button" onClick={() => moveSong(song, "up")} disabled={index === 0} aria-label={`Move ${song.title} up`}><ArrowUp size={12} /></button><button className="mini-icon-button" onClick={() => moveSong(song, "down")} disabled={index === setSongCount - 1} aria-label={`Move ${song.title} down`}><ArrowDown size={12} /></button></div><button className="icon-button row-menu" onClick={() => removeSong(song)} aria-label={`Remove ${song.title}`}><Trash2 size={15} /></button></div>
      {editingSongId === song.id && <div className="link-editor"><div className="link-editor-label"><ExternalLink size={14} /><span>Video reference</span></div><Input value={linkDraft} onChange={event => setLinkDraft(event.target.value)} placeholder="https://youtube.com/watch?v=..." aria-label={`Video link for ${song.title}`} /><select className="set-form-select link-set-select" value={song.setName} onChange={event => updateSongSet(song.id, event.target.value as SetName)} aria-label={`Set section for ${song.title}`}>{setNames.map(setName => <option key={setName} value={setName}>{setName}</option>)}</select><div className="link-editor-actions"><button type="button" className="link-cancel" onClick={() => setEditingSongId(null)}>Cancel</button><button type="button" className="link-save" onClick={() => saveLink(song)}>Save link</button></div></div>}
    </div>
  );

  return (
    <div className="band-app min-h-screen">
      <aside className={`sidebar ${mobileMenuOpen ? "sidebar-open" : ""}`}>
        <div className="brand-lockup"><div className="brand-mark" aria-hidden="true">B</div><div><p className="brand-name">Band<span>BUDDY</span></p><p className="brand-kicker">shared setlists</p></div><button className="sidebar-close" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation"><X size={17} /></button></div>
        <button className="band-switcher" onClick={() => showComingSoon("Band switching")}><span className="band-switcher-dot" /><span className="band-switcher-copy"><strong>The Afterhours</strong><small>4 members</small></span><ChevronDown size={15} /></button>
        <p className="sidebar-label">Workspace</p>
        <nav className="sidebar-nav" aria-label="Workspace navigation">{[{ label: "Overview", icon: LayoutDashboard }, { label: "Setlists", icon: Music2 }, { label: "Song library", icon: Library }].map(item => { const Icon = item.icon; const selected = activeNav === item.label; return <button key={item.label} className={`nav-item ${selected ? "active" : ""}`} onClick={() => { setActiveNav(item.label); if (item.label !== "Setlists") showComingSoon(item.label); }}><Icon size={17} /><span>{item.label}</span>{item.label === "Setlists" && <span className="nav-count">3</span>}</button>; })}</nav>
        <p className="sidebar-label sidebar-label-spaced">Your bands</p>
        <div className="band-list"><button className="band-list-item active"><span className="band-list-icon">TA</span><span>The Afterhours</span><span className="live-dot" /></button><button className="band-list-item" onClick={() => showComingSoon("New band setup")}><span className="band-list-icon add-band"><Plus size={14} /></span><span>Add a band</span></button></div>
        <div className="sidebar-spacer" /><div className="sidebar-footer"><button className="nav-item" onClick={() => showComingSoon("Help center")}><CircleHelp size={17} /><span>Help center</span></button><button className="nav-item" onClick={() => showComingSoon("Settings")}><Settings2 size={17} /><span>Settings</span></button><div className="profile-card"><div className="avatar avatar-red">{user?.name?.slice(0, 1).toUpperCase() || "G"}</div><div className="profile-copy"><strong>{displayName}</strong><small>{isAuthenticated ? "Synced member" : "Preview mode"}</small></div><MoreHorizontal size={16} /></div></div>
      </aside>

      <main className="app-main">
        <div className="mobile-topbar"><button className="icon-button" onClick={() => setMobileMenuOpen(true)} aria-label="Open navigation"><Menu size={20} /></button><p className="mobile-brand">Band<span>BUDDY</span></p><button className="avatar avatar-red avatar-button" onClick={() => showComingSoon("Profile settings")} aria-label="Open profile">{user?.name?.slice(0, 1).toUpperCase() || "G"}</button></div>
        <header className="topbar"><div className="breadcrumbs"><span>The Afterhours</span><span className="breadcrumb-slash">/</span><strong>Setlists</strong><span className="breadcrumb-slash">/</span><strong>Summer Live</strong></div><div className="topbar-actions"><div className="live-presence"><span className="presence-dot" /> <span>3 online</span></div><button className="topbar-share" onClick={() => showComingSoon("Setlist sharing")}><Share2 size={15} /> Share</button>{!isAuthenticated && <Button className="sign-in-button" onClick={() => startLogin()}>Sign in to sync</Button>}</div></header>

        <div className="page-content">
          <div className="page-heading"><div><p className="eyebrow"><span className="eyebrow-mark" /> Friday, 18 July 2026 <span className="eyebrow-separator">·</span> 8:00 PM</p><h1>Summer Live</h1><p className="page-subtitle">Build the night in order. Everyone sees the latest version.</p><div className="event-meta"><span><MapPin size={14} /> The Workman's Cellar</span><span><CalendarDays size={14} /> {songs.length} songs planned</span></div></div><div className="heading-actions"><Button variant="outline" className="soft-button" onClick={() => showComingSoon("Run-through mode")}><Play size={16} /> Run through</Button><Button className="primary-button" onClick={() => showComingSoon("Setlist sharing")}><UserRoundPlus size={16} /> Invite bandmates</Button></div></div>

          <div className="workspace-grid"><section className="main-column"><div className="sync-banner"><div className="sync-banner-icon"><Radio size={17} /></div><div className="sync-banner-copy"><strong>{isAuthenticated ? "You're looking at the shared version" : "You're exploring a live setlist"}</strong><span>{isAuthenticated ? "Changes save for the whole band as you work." : "Sign in when you're ready to keep edits in sync across devices."}</span></div><div className="sync-banner-progress"><span>{readyCount}/{songs.length} ready</span><div className="progress-track"><div style={{ width: `${progress}%` }} /></div></div></div>

            <div className="paper-panel setlist-panel">
              <div className="panel-heading"><div><p className="panel-eyebrow">Running order</p><h2>Setlist <span>{songs.length}</span></h2></div><div className="panel-heading-actions"><button className="small-action" onClick={() => toast.info("Use the up/down arrows on a song row to change its order.")}><GripVertical size={15} /> Reorder</button><button className="icon-button subtle" onClick={() => showComingSoon("Setlist options")} aria-label="Setlist options"><MoreHorizontal size={18} /></button></div></div>
              <div className="set-tabs" aria-label="Set sections">{songsBySet.map(({ setName, songs: setSongs }) => <button key={setName} className={`set-tab ${addToSet === setName ? "active" : ""}`} onClick={() => setAddToSet(setName)}><span className="set-tab-mark">{setName.slice(-1)}</span><span>{setName}</span><b>{setSongs.length}</b></button>)}</div>
              <div className="setlist-summary"><span><Clock3 size={13} /> {Math.round(totalMinutes)} min total</span><span><Check size={13} /> {readyCount} songs ready</span><span className="summary-note">Last edited 2 min ago</span></div>
              <div className="setlist-table-head"><span className="head-track">Track</span><span>Source key <em>auto</em></span><span>Singer key <em>manual</em></span><span aria-hidden="true" /></div>
              <div className="song-list">{songsBySet.map(({ setName, songs: setSongs }) => <section className="set-section" key={setName} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); dropSongOnSet(setName); }}><div className="set-section-heading"><div className="set-title-lockup"><span className={`set-section-marker ${setName === "Set A" ? "set-a" : setName === "Set B" ? "set-b" : "set-c"}`}>{setName.slice(-1)}</span><div><strong>{setName}</strong><span>{setSongs.length ? `${setSongs.length} ${setSongs.length === 1 ? "song" : "songs"}` : "No songs yet"}</span></div></div><button className="set-add-button" onClick={() => { setAddToSet(setName); setIsAdding(true); }}><Plus size={13} /> Add to {setName}</button></div>{setSongs.length ? setSongs.map((song, index) => renderSongRow(song, index, setSongs.length)) : <button className="empty-set" onClick={() => { setAddToSet(setName); setIsAdding(true); }}><Plus size={15} /><span>Add the first song to {setName}</span><small>Drop a song here or add one</small></button>}</section>)}</div>

              {isAdding ? <form className="add-song-form" onSubmit={addSong}><div className="add-form-title"><span className="add-form-number">{String(songs.length + 1).padStart(2, "0")}</span><div><strong>Add a song to {addToSet}</strong><span>Paste a video link and BandBUDDY will fill what it can.</span></div></div><div className="add-form-fields"><Input autoFocus placeholder="Song name" value={newTitle} onChange={event => setNewTitle(event.target.value)} aria-label="Song name" /><Input placeholder="Artist (optional)" value={newArtist} onChange={event => setNewArtist(event.target.value)} aria-label="Artist" /><Input className="video-input" placeholder="Paste a YouTube or video link" value={newVideoUrl} onChange={event => setNewVideoUrl(event.target.value)} onBlur={event => void inspectNewVideo(event.target.value)} onPaste={event => { const pasted = event.clipboardData.getData("text"); window.setTimeout(() => void inspectNewVideo(pasted), 0); }} aria-label="Video link" /><select className="set-form-select" value={addToSet} onChange={event => setAddToSet(event.target.value as SetName)} aria-label="Set section">{setNames.map(setName => <option key={setName} value={setName}>{setName}</option>)}</select></div><div className={`metadata-status ${metadataStatus}`}><Sparkles size={13} /><span>{metadataStatus === "loading" ? "Reading video metadata…" : metadataStatus === "ready" ? `Auto-filled · ${newDuration !== "—" ? newDuration : "duration pending"} · key analysis pending` : metadataStatus === "error" ? "Could not read this link — fields are still editable." : "Paste a link to auto-fill the song details."}</span></div><div className="add-form-actions"><Button type="button" variant="ghost" className="cancel-button" onClick={() => setIsAdding(false)}>Cancel</Button><Button type="submit" className="primary-button" size="sm"><Plus size={15} /> Add song</Button></div></form> : <button className="add-song-trigger" onClick={() => setIsAdding(true)}><span><Plus size={17} /></span><strong>Add song to {addToSet}</strong><small>⌘ ↵</small></button>}
            </div>
            <div className="analysis-note"><div className="analysis-note-icon"><Sparkles size={15} /></div><p><strong>Source keys are detected from each video.</strong> <span>When a reference is ready, the auto key appears here. The singer's key stays yours to choose.</span></p><button onClick={() => showComingSoon("Key analysis details")}><ArrowUpRight size={15} /></button></div>
          </section>

          <aside className="context-column"><div className="paper-panel side-panel members-panel"><div className="side-panel-heading"><div><p className="panel-eyebrow">In the room</p><h3>Bandmates <span>4</span></h3></div><button className="icon-button subtle" onClick={() => showComingSoon("Member invitations")} aria-label="Invite a member"><Plus size={17} /></button></div><div className="member-list">{members.map(member => <div className="member-row" key={member.name}><div className={`avatar avatar-${member.tone}`}>{member.initials}<span className={`online-indicator ${member.online ? "online" : ""}`} /></div><div className="member-copy"><strong>{member.name}</strong><span>{member.role}</span></div>{member.online && <span className="member-online">live</span>}</div>)}</div><button className="invite-link" onClick={() => showComingSoon("Member invitations")}><UserRoundPlus size={14} /> Invite a bandmate</button></div><div className="paper-panel side-panel activity-panel"><div className="side-panel-heading"><div><p className="panel-eyebrow">Live log</p><h3>Recent changes</h3></div><Activity size={17} className="heading-icon" /></div><div className="activity-list">{activity.map(item => <div className="activity-item" key={`${item.name}-${item.time}`}><div className={`avatar avatar-small avatar-${item.tone}`}>{item.initials}</div><div className="activity-copy"><p><strong>{item.name}</strong> {item.action}</p><span>{item.detail} <em>· {item.time}</em></span></div></div>)}</div><button className="activity-link" onClick={() => showComingSoon("Full activity log")}>See all activity <ArrowUpRight size={14} /></button></div><div className="notes-card"><div className="notes-header"><span className="notes-pin" /><p className="panel-eyebrow">Band note</p><span className="notes-saved">Saved</span></div><textarea value={note} onChange={event => setNote(event.target.value)} aria-label="Band note" /><div className="notes-footer"><span>Visible to all members</span><button onClick={() => toast.success("Band note saved.")}><Check size={13} /> Save note</button></div></div><div className="help-prompt"><div className="help-prompt-icon"><Music2 size={15} /></div><div><strong>Need a quick reset?</strong><span>Run the setlist from the top before doors.</span></div><button onClick={() => showComingSoon("Run-through mode")} aria-label="Open run-through mode"><ExternalLink size={15} /></button></div></aside>
          </div>
        </div>
      </main>
    </div>
  );
}

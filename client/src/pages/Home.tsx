import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Activity,
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
  Play,
  Plus,
  Radio,
  Settings2,
  Share2,
  Sparkles,
  Trash2,
  UserRoundPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

type Song = {
  id: number;
  title: string;
  artist: string;
  videoUrl: string;
  sourceKey: string;
  singerKey: string;
  duration: string;
  status: "ready" | "needs-key";
};

const keyOptions = ["—", "C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

const initialSongs: Song[] = [
  {
    id: 1,
    title: "Valerie",
    artist: "Amy Winehouse",
    videoUrl: "https://www.youtube.com/watch?v=naXyF0rB0js",
    sourceKey: "E",
    singerKey: "D",
    duration: "3:38",
    status: "ready",
  },
  {
    id: 2,
    title: "Use Somebody",
    artist: "Kings of Leon",
    videoUrl: "https://www.youtube.com/watch?v=gnhXHSgNMJ0",
    sourceKey: "C#",
    singerKey: "B",
    duration: "3:51",
    status: "ready",
  },
  {
    id: 3,
    title: "Sweet Home Chicago",
    artist: "Robert Johnson",
    videoUrl: "https://www.youtube.com/watch?v=O8hqGu-leFc",
    sourceKey: "A",
    singerKey: "A",
    duration: "4:09",
    status: "ready",
  },
  {
    id: 4,
    title: "The Way You Make Me Feel",
    artist: "Michael Jackson",
    videoUrl: "https://www.youtube.com/watch?v=HzZ_urpj4As",
    sourceKey: "G",
    singerKey: "F",
    duration: "4:58",
    status: "ready",
  },
  {
    id: 5,
    title: "Mr. Brightside",
    artist: "The Killers",
    videoUrl: "https://www.youtube.com/watch?v=gGdGFtwCNBE",
    sourceKey: "D",
    singerKey: "—",
    duration: "3:42",
    status: "needs-key",
  },
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

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [songs, setSongs] = useState<Song[]>(initialSongs);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newArtist, setNewArtist] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [note, setNote] = useState("Open with Valerie — vocals should sit just behind the pocket.");
  const [activeNav, setActiveNav] = useState("Setlists");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const readyCount = useMemo(
    () => songs.filter(song => song.sourceKey !== "—" && song.singerKey !== "—").length,
    [songs]
  );
  const totalMinutes = useMemo(
    () => songs.reduce((total, song) => {
      const [minutes, seconds] = song.duration.split(":").map(Number);
      return total + (minutes || 0) + (seconds || 0) / 60;
    }, 0),
    [songs]
  );
  const progress = songs.length ? Math.round((readyCount / songs.length) * 100) : 0;
  const displayName = user?.name?.split(" ")[0] || "Guest";

  const updateSong = (id: number, field: "sourceKey" | "singerKey", value: string) => {
    setSongs(current =>
      current.map(song => {
        if (song.id !== id) return song;
        const next = { ...song, [field]: value };
        return {
          ...next,
          status: next.sourceKey !== "—" && next.singerKey !== "—" ? "ready" : "needs-key",
        };
      })
    );
  };

  const addSong = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newTitle.trim()) {
      toast.error("Give the song a name before adding it.");
      return;
    }
    setSongs(current => [
      ...current,
      {
        id: Date.now(),
        title: newTitle.trim(),
        artist: newArtist.trim() || "New addition",
        videoUrl: newVideoUrl.trim(),
        sourceKey: "—",
        singerKey: "—",
        duration: "—",
        status: "needs-key",
      },
    ]);
    setNewTitle("");
    setNewArtist("");
    setNewVideoUrl("");
    setIsAdding(false);
    toast.success("Song added to the setlist.");
  };

  const removeSong = (song: Song) => {
    setSongs(current => current.filter(item => item.id !== song.id));
    toast.success(`${song.title} removed from this setlist.`);
  };

  const openVideo = (song: Song) => {
    if (!song.videoUrl) {
      toast.info("Add a video link to open a reference.");
      return;
    }
    window.open(song.videoUrl, "_blank", "noopener,noreferrer");
  };

  const showComingSoon = (label: string) => toast.info(`${label} is coming next in the shared workspace.`);

  return (
    <div className="band-app min-h-screen">
      <aside className={`sidebar ${mobileMenuOpen ? "sidebar-open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">B</div>
          <div>
            <p className="brand-name">Band<span>BUDDY</span></p>
            <p className="brand-kicker">shared setlists</p>
          </div>
          <button className="sidebar-close" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation">
            <X size={17} />
          </button>
        </div>

        <button className="band-switcher" onClick={() => showComingSoon("Band switching")}>
          <span className="band-switcher-dot" />
          <span className="band-switcher-copy"><strong>The Afterhours</strong><small>4 members</small></span>
          <ChevronDown size={15} />
        </button>

        <p className="sidebar-label">Workspace</p>
        <nav className="sidebar-nav" aria-label="Workspace navigation">
          {[
            { label: "Overview", icon: LayoutDashboard },
            { label: "Setlists", icon: Music2 },
            { label: "Song library", icon: Library },
          ].map(item => {
            const Icon = item.icon;
            const selected = activeNav === item.label;
            return (
              <button
                key={item.label}
                className={`nav-item ${selected ? "active" : ""}`}
                onClick={() => {
                  setActiveNav(item.label);
                  if (item.label !== "Setlists") showComingSoon(item.label);
                }}
              >
                <Icon size={17} />
                <span>{item.label}</span>
                {item.label === "Setlists" && <span className="nav-count">3</span>}
              </button>
            );
          })}
        </nav>

        <p className="sidebar-label sidebar-label-spaced">Your bands</p>
        <div className="band-list">
          <button className="band-list-item active"><span className="band-list-icon">TA</span><span>The Afterhours</span><span className="live-dot" /></button>
          <button className="band-list-item" onClick={() => showComingSoon("New band setup")}><span className="band-list-icon add-band"><Plus size={14} /></span><span>Add a band</span></button>
        </div>

        <div className="sidebar-spacer" />
        <div className="sidebar-footer">
          <button className="nav-item" onClick={() => showComingSoon("Help center")}><CircleHelp size={17} /><span>Help center</span></button>
          <button className="nav-item" onClick={() => showComingSoon("Settings")}><Settings2 size={17} /><span>Settings</span></button>
          <div className="profile-card">
            <div className="avatar avatar-red">{user?.name?.slice(0, 1).toUpperCase() || "G"}</div>
            <div className="profile-copy"><strong>{displayName}</strong><small>{isAuthenticated ? "Synced member" : "Preview mode"}</small></div>
            <MoreHorizontal size={16} />
          </div>
        </div>
      </aside>

      <main className="app-main">
        <div className="mobile-topbar">
          <button className="icon-button" onClick={() => setMobileMenuOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
          <p className="mobile-brand">Band<span>BUDDY</span></p>
          <button className="avatar avatar-red avatar-button" onClick={() => showComingSoon("Profile settings")} aria-label="Open profile">{user?.name?.slice(0, 1).toUpperCase() || "G"}</button>
        </div>
        <header className="topbar">
          <div className="breadcrumbs"><span>The Afterhours</span><span className="breadcrumb-slash">/</span><strong>Setlists</strong><span className="breadcrumb-slash">/</span><strong>Summer Live</strong></div>
          <div className="topbar-actions">
            <div className="live-presence"><span className="presence-dot" /> <span>3 online</span></div>
            <button className="topbar-share" onClick={() => showComingSoon("Setlist sharing")}><Share2 size={15} /> Share</button>
            {!isAuthenticated && <Button className="sign-in-button" onClick={() => startLogin()}>Sign in to sync</Button>}
          </div>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow"><span className="eyebrow-mark" /> Friday, 18 July 2026 <span className="eyebrow-separator">·</span> 8:00 PM</p>
              <h1>Summer Live</h1>
              <p className="page-subtitle">Build the night in order. Everyone sees the latest version.</p>
              <div className="event-meta"><span><MapPin size={14} /> The Workman's Cellar</span><span><CalendarDays size={14} /> 12 songs planned</span></div>
            </div>
            <div className="heading-actions">
              <Button variant="outline" className="soft-button" onClick={() => showComingSoon("Run-through mode")}><Play size={16} /> Run through</Button>
              <Button className="primary-button" onClick={() => showComingSoon("Setlist sharing")}><UserRoundPlus size={16} /> Invite bandmates</Button>
            </div>
          </div>

          <div className="workspace-grid">
            <section className="main-column">
              <div className="sync-banner">
                <div className="sync-banner-icon"><Radio size={17} /></div>
                <div className="sync-banner-copy"><strong>{isAuthenticated ? "You're looking at the shared version" : "You're exploring a live setlist"}</strong><span>{isAuthenticated ? "Changes save for the whole band as you work." : "Sign in when you're ready to keep edits in sync across devices."}</span></div>
                <div className="sync-banner-progress"><span>{readyCount}/{songs.length} ready</span><div className="progress-track"><div style={{ width: `${progress}%` }} /></div></div>
              </div>

              <div className="paper-panel setlist-panel">
                <div className="panel-heading">
                  <div><p className="panel-eyebrow">Running order</p><h2>Setlist <span>{songs.length}</span></h2></div>
                  <div className="panel-heading-actions"><button className="small-action" onClick={() => showComingSoon("Setlist sort")}><GripVertical size={15} /> Reorder</button><button className="icon-button subtle" onClick={() => showComingSoon("Setlist options")} aria-label="Setlist options"><MoreHorizontal size={18} /></button></div>
                </div>
                <div className="setlist-summary"><span><Clock3 size={13} /> {Math.round(totalMinutes)} min total</span><span><Check size={13} /> {readyCount} songs ready</span><span className="summary-note">Last edited 2 min ago</span></div>

                <div className="setlist-table-head"><span className="head-track">Track</span><span>Source key <em>auto</em></span><span>Singer key <em>manual</em></span><span aria-hidden="true" /></div>
                <div className="song-list">
                  {songs.map((song, index) => (
                    <div className={`song-row ${song.status === "needs-key" ? "needs-key" : ""}`} key={song.id}>
                      <div className="song-main">
                        <button className="drag-handle" onClick={() => showComingSoon("Drag to reorder")} aria-label={`Reorder ${song.title}`}><GripVertical size={16} /></button>
                        <div className="track-number">{String(index + 1).padStart(2, "0")}</div>
                        <div className="song-copy"><strong>{song.title}</strong><span>{song.artist}</span></div>
                        <button className="video-button" onClick={() => openVideo(song)} title={song.videoUrl ? "Open video reference" : "Add a video reference"}><Play size={13} fill="currentColor" /></button>
                      </div>
                      <div className="key-field"><span className="mobile-key-label">Source · auto</span><div className="key-control"><span className="key-swatch source-swatch" /><select className="key-select source-select" aria-label={`Detected source key for ${song.title}`} value={song.sourceKey} onChange={event => updateSong(song.id, "sourceKey", event.target.value)}>{keyOptions.map(key => <option value={key} key={key}>{key}</option>)}</select><Sparkles size={12} className="key-sparkle" /></div></div>
                      <div className="key-field"><span className="mobile-key-label">Singer · manual</span><div className="key-control"><span className="key-swatch singer-swatch" /><select className="key-select singer-select" aria-label={`Singer performance key for ${song.title}`} value={song.singerKey} onChange={event => updateSong(song.id, "singerKey", event.target.value)}>{keyOptions.map(key => <option value={key} key={key}>{key}</option>)}</select></div></div>
                      <div className="song-actions"><span className={`song-status ${song.status}`} title={song.status === "ready" ? "Both keys are set" : "Singer key still needed"}>{song.status === "ready" ? <Check size={14} /> : <span className="status-dash">—</span>}</span><button className="icon-button row-menu" onClick={() => removeSong(song)} aria-label={`Remove ${song.title}`}><Trash2 size={15} /></button></div>
                    </div>
                  ))}
                </div>

                {isAdding ? (
                  <form className="add-song-form" onSubmit={addSong}>
                    <div className="add-form-title"><span className="add-form-number">{String(songs.length + 1).padStart(2, "0")}</span><div><strong>Add a song</strong><span>Drop in the essentials — keys can come later.</span></div></div>
                    <div className="add-form-fields"><Input autoFocus placeholder="Song name" value={newTitle} onChange={event => setNewTitle(event.target.value)} aria-label="Song name" /><Input placeholder="Artist (optional)" value={newArtist} onChange={event => setNewArtist(event.target.value)} aria-label="Artist" /><Input className="video-input" placeholder="Video link (optional)" value={newVideoUrl} onChange={event => setNewVideoUrl(event.target.value)} aria-label="Video link" /></div>
                    <div className="add-form-actions"><Button type="button" variant="ghost" className="cancel-button" onClick={() => setIsAdding(false)}>Cancel</Button><Button type="submit" className="primary-button" size="sm"><Plus size={15} /> Add song</Button></div>
                  </form>
                ) : (
                  <button className="add-song-trigger" onClick={() => setIsAdding(true)}><span><Plus size={17} /></span><strong>Add song to setlist</strong><small>⌘ ↵</small></button>
                )}
              </div>

              <div className="analysis-note"><div className="analysis-note-icon"><Sparkles size={15} /></div><p><strong>Source keys are detected from each video.</strong> <span>When a reference is ready, the auto key appears here. The singer's key stays yours to choose.</span></p><button onClick={() => showComingSoon("Key analysis details")}><ArrowUpRight size={15} /></button></div>
            </section>

            <aside className="context-column">
              <div className="paper-panel side-panel members-panel"><div className="side-panel-heading"><div><p className="panel-eyebrow">In the room</p><h3>Bandmates <span>4</span></h3></div><button className="icon-button subtle" onClick={() => showComingSoon("Member invitations")} aria-label="Invite a member"><Plus size={17} /></button></div><div className="member-list">{members.map(member => <div className="member-row" key={member.name}><div className={`avatar avatar-${member.tone}`}>{member.initials}<span className={`online-indicator ${member.online ? "online" : ""}`} /></div><div className="member-copy"><strong>{member.name}</strong><span>{member.role}</span></div>{member.online && <span className="member-online">live</span>}</div>)}</div><button className="invite-link" onClick={() => showComingSoon("Member invitations")}><UserRoundPlus size={14} /> Invite a bandmate</button></div>

              <div className="paper-panel side-panel activity-panel"><div className="side-panel-heading"><div><p className="panel-eyebrow">Live log</p><h3>Recent changes</h3></div><Activity size={17} className="heading-icon" /></div><div className="activity-list">{activity.map(item => <div className="activity-item" key={`${item.name}-${item.time}`}><div className={`avatar avatar-small avatar-${item.tone}`}>{item.initials}</div><div className="activity-copy"><p><strong>{item.name}</strong> {item.action}</p><span>{item.detail} <em>· {item.time}</em></span></div></div>)}</div><button className="activity-link" onClick={() => showComingSoon("Full activity log")}>See all activity <ArrowUpRight size={14} /></button></div>

              <div className="notes-card"><div className="notes-header"><span className="notes-pin" /> <p className="panel-eyebrow">Band note</p><span className="notes-saved">Saved</span></div><textarea value={note} onChange={event => setNote(event.target.value)} aria-label="Band note" /><div className="notes-footer"><span>Visible to all members</span><button onClick={() => toast.success("Band note saved.")}><Check size={13} /> Save note</button></div></div>

              <div className="help-prompt"><div className="help-prompt-icon"><Music2 size={15} /></div><div><strong>Need a quick reset?</strong><span>Run the setlist from the top before doors.</span></div><button onClick={() => showComingSoon("Run-through mode")} aria-label="Open run-through mode"><ExternalLink size={15} /></button></div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

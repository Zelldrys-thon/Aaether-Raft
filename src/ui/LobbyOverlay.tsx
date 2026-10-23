import React, { useState } from 'react';
import { FriendEntry, PlayerProfile } from '../types/game';
import {
  generatePlayerId,
  RANDOM_NICKNAME_SUGGESTIONS,
} from '../data/socialData';
import { HeroFacePortrait } from './HeroAvatarSvg';
import { soundEngine } from '../audio/soundEngine';

interface LobbyOverlayProps {
  profile: PlayerProfile;
  isFirstLogin: boolean;
  friends: FriendEntry[];
  onSaveProfile: (updatedProfile: PlayerProfile) => void;
  onAddFriend: (entry: FriendEntry) => void;
  onGoToPick: () => void;
}

export const LobbyOverlay: React.FC<LobbyOverlayProps> = ({
  profile,
  isFirstLogin,
  friends,
  onSaveProfile,
  onAddFriend,
  onGoToPick,
}) => {
  const [showProfileModal, setShowProfileModal] = useState<boolean>(isFirstLogin);
  const [draftId, setDraftId] = useState<string>(profile.id || generatePlayerId());
  const [draftNick, setDraftNick] = useState<string>(profile.nickname || '');
  const [nickError, setNickError] = useState<string>('');
  const [copiedId, setCopiedId] = useState<boolean>(false);

  const [showFriendDrawer, setShowFriendDrawer] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleRandomNickname = () => {
    soundEngine.playUiClick();
    const pick =
      RANDOM_NICKNAME_SUGGESTIONS[
        Math.floor(Math.random() * RANDOM_NICKNAME_SUGGESTIONS.length)
      ];
    const suffix = Math.floor(10 + Math.random() * 89);
    setDraftNick(`${pick}${suffix}`);
    setNickError('');
  };

  const handleSaveNicknameAndId = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = draftNick.trim();
    if (cleaned.length < 3) {
      setNickError('Nickname minimal 3 karakter.');
      return;
    }
    if (cleaned.length > 16) {
      setNickError('Nickname maksimal 16 karakter.');
      return;
    }
    soundEngine.playUiClick();
    onSaveProfile({
      ...profile,
      id: draftId,
      nickname: cleaned,
    });
    setShowProfileModal(false);
  };

  const handleCopyId = (idText: string) => {
    soundEngine.playUiClick();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(idText).catch(() => {});
    }
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1600);
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredFriends = friends.filter((f) => {
    if (!normalizedQuery) return f.isFriend;
    return (
      f.nickname.toLowerCase().includes(normalizedQuery) ||
      f.id.toLowerCase().includes(normalizedQuery)
    );
  });

  // Dynamic search result if user searches a specific Nick or ID not in default list
  const customSearchCandidate: FriendEntry | null =
    normalizedQuery.length >= 3 && filteredFriends.length === 0
      ? {
          id: normalizedQuery.startsWith('ar-')
            ? normalizedQuery.toUpperCase()
            : `AR-${Math.abs(
                normalizedQuery.split('').reduce((acc, c) => acc * 31 + c.charCodeAt(0), 7)
              )
                .toString()
                .slice(0, 6)
                .padEnd(6, '4')}`,
          nickname: normalizedQuery.startsWith('ar-')
            ? `RiftPlayer_${normalizedQuery.slice(-3).toUpperCase()}`
            : searchQuery.trim().slice(0, 15),
          rankTitle: 'Mythic V',
          status: 'online',
          favoriteHeroId: 'vanguard',
          isFriend: false,
        }
      : null;

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between py-6 px-5 md:px-8 select-none">
      {/* Top Bar: Left Profile Badge | Center Brand | Right Friendlist Button */}
      <div className="flex items-start justify-between gap-4">
        {/* Left: Player Profile & Auto-ID Badge */}
        <div className="pointer-events-auto flex items-center gap-3 bg-[#0b0f17]/92 border border-[#2a364f] hover:border-amber-400/70 rounded-xl p-2.5 pr-4 shadow-2xl transition-colors">
          <div className="relative">
            <HeroFacePortrait
              heroId={profile.avatarHeroId}
              className="w-12 h-12 rounded-lg border border-amber-400/80 shrink-0"
            />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0b0f17]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm text-white tracking-wide">
                {profile.nickname || 'Guest Player'}
              </span>
              <button
                onClick={() => {
                  soundEngine.playUiClick();
                  setDraftId(profile.id);
                  setDraftNick(profile.nickname);
                  setNickError('');
                  setShowProfileModal(true);
                }}
                className="text-[10px] px-1.5 py-0.5 rounded bg-[#151c28] hover:bg-slate-700 text-amber-300 border border-[#2a364f] cursor-pointer"
                title="Ubah Nickname & ID"
              >
                Edit
              </button>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono-tabular text-[11px] font-semibold text-sky-400">
                ID: {profile.id}
              </span>
              <button
                onClick={() => handleCopyId(profile.id)}
                className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
                title="Salin ID"
              >
                {copiedId ? 'Tersalin!' : 'Salin'}
              </button>
            </div>
            <span className="text-[10px] text-amber-400/90 font-semibold mt-0.5">
              {profile.rankTitle}
            </span>
          </div>
        </div>

        {/* Center Brand Lockup: Game Title + by zell studio */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#0b0f17] border border-amber-400/70 p-1 shadow-lg flex items-center justify-center shrink-0">
              <img
                src="/logo_zell.png"
                alt="Zell Studio"
                className="w-full h-full object-contain filter drop-shadow-[0_0_6px_rgba(245,158,11,0.4)]"
                onError={(e) => {
                  e.currentTarget.src = '/assets/aistudio/image_3db09b16.png';
                }}
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-display font-extrabold text-sm sm:text-lg text-white tracking-widest leading-none drop-shadow">
                AETHER RIFT
              </span>
              <span className="text-[8.5px] sm:text-[10px] font-mono-tabular font-bold text-amber-400 uppercase tracking-widest mt-0.5">
                by zell studio
              </span>
            </div>
          </div>
        </div>

        {/* Right: Friendlist & Search Player Toggle */}
        <div className="pointer-events-auto relative">
          <button
            onClick={() => {
              soundEngine.playUiClick();
              setShowFriendDrawer((prev) => !prev);
            }}
            className="flex items-center gap-2.5 px-4 py-2.5 bg-[#0b0f17]/92 hover:bg-[#151c28] border border-[#2a364f] hover:border-sky-400/60 rounded-xl text-xs font-semibold text-slate-100 shadow-2xl transition-colors cursor-pointer"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Friendlist & Cari ID</span>
            <span className="px-1.5 py-0.5 rounded bg-[#151c28] border border-[#2a364f] font-mono-tabular text-[11px] text-sky-400">
              {friends.filter((f) => f.isFriend).length}
            </span>
          </button>

          {/* Compact Friendlist & Search Dropdown in Lobby */}
          {showFriendDrawer && (
            <div className="absolute right-0 mt-2 w-80 bg-[#0b0f17]/96 border border-[#2a364f] rounded-xl p-3.5 shadow-2xl z-30">
              <div className="flex items-center justify-between mb-2.5">
                <span className="font-display font-bold text-xs text-white tracking-wider uppercase">
                  Friendlist & Cari Player
                </span>
                <button
                  onClick={() => setShowFriendDrawer(false)}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="mb-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari Nickname atau ID (cth: AR-882910)..."
                  className="w-full px-3 py-2 text-xs bg-[#151c28] border border-[#2a364f] focus:border-sky-400 rounded-lg text-white placeholder-slate-500 outline-none"
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {filteredFriends.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#151c28]/90 border border-[#2a364f]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <HeroFacePortrait
                        heroId={item.favoriteHeroId}
                        className="w-9 h-9 rounded-md shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-100 truncate">
                          {item.nickname}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono-tabular text-sky-400">
                          <span>{item.id}</span>
                          <span className="text-slate-500">•</span>
                          <span
                            className={
                              item.status === 'online'
                                ? 'text-emerald-400'
                                : item.status === 'in_match'
                                  ? 'text-amber-400'
                                  : 'text-slate-500'
                            }
                          >
                            {item.status === 'online'
                              ? 'Online'
                              : item.status === 'in_match'
                                ? 'In Match'
                                : 'Offline'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!item.isFriend ? (
                      <button
                        onClick={() => {
                          soundEngine.playUiClick();
                          onAddFriend(item);
                        }}
                        className="px-2.5 py-1 rounded bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-[10px] whitespace-nowrap cursor-pointer"
                      >
                        + Teman
                      </button>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-semibold">
                        Teman
                      </span>
                    )}
                  </div>
                ))}

                {customSearchCandidate && (
                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#151c28] border border-sky-500/50">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <HeroFacePortrait
                        heroId={customSearchCandidate.favoriteHeroId}
                        className="w-9 h-9 rounded-md shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {customSearchCandidate.nickname}
                        </div>
                        <div className="text-[10px] font-mono-tabular text-sky-400">
                          {customSearchCandidate.id} • Online
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        soundEngine.playUiClick();
                        onAddFriend(customSearchCandidate);
                        setSearchQuery('');
                      }}
                      className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] whitespace-nowrap cursor-pointer"
                    >
                      + Tambah
                    </button>
                  </div>
                )}

                {filteredFriends.length === 0 && !customSearchCandidate && (
                  <div className="text-center py-4 text-xs text-slate-400">
                    Ketik minimal 3 karakter Nickname atau ID untuk mencari player.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center 3D Viewport stays 100% open */}
      <div className="flex-1" />

      {/* Bottom: Primary PLAY CTA -> Opens Mode Selection & 5-Player Lobby */}
      <div className="pointer-events-auto flex flex-col items-center gap-1.5 sm:gap-2">
        <div className="text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase text-slate-400 bg-[#0b0f17]/85 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-[#2a364f]">
          Login sebagai <span className="text-amber-400">{profile.nickname}</span> ({profile.id})
        </div>
        <button
          onClick={() => {
            soundEngine.playUiClick();
            if (!profile.nickname.trim()) {
              setShowProfileModal(true);
              return;
            }
            onGoToPick();
          }}
          className="min-w-[140px] sm:min-w-[210px] min-h-[38px] sm:min-h-[50px] px-6 sm:px-10 py-1.5 sm:py-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-display font-bold text-sm sm:text-base tracking-widest rounded-lg sm:rounded-xl border-2 border-amber-300 shadow-2xl transition-all cursor-pointer whitespace-nowrap"
        >
          PLAY
        </button>
      </div>

      {/* LOGIN MODAL: HANYA BUAT NICKNAME (TANPA TAMPILAN ID) */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 pointer-events-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveNicknameAndId}
            className="w-full max-w-md bg-[#0b0f17] border-2 border-amber-500/70 rounded-2xl p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono-tabular font-bold uppercase tracking-widest text-amber-400">
                LOGIN AETHER RIFT
              </span>
              {!isFirstLogin && (
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <h2 className="font-display text-2xl font-bold text-white mb-1">
              Buat Nickname
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              Masukkan Nickname kamu untuk mulai bermain dan masuk ke dalam Lobby.
            </p>

            {/* Nickname Input Box Only */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Nickname Player
                </label>
                <button
                  type="button"
                  onClick={handleRandomNickname}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                >
                  + Acak Nickname
                </button>
              </div>
              <input
                type="text"
                value={draftNick}
                onChange={(e) => {
                  setDraftNick(e.target.value);
                  setNickError('');
                }}
                maxLength={16}
                placeholder="Masukkan Nickname (contoh: NightValkyrie)..."
                autoFocus
                className="w-full px-3.5 py-2.5 text-sm font-semibold bg-[#151c28] border border-[#2a364f] focus:border-amber-400 rounded-xl text-white placeholder-slate-500 outline-none"
              />
              {nickError ? (
                <p className="text-[11px] text-rose-400 mt-1.5 font-medium">{nickError}</p>
              ) : (
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Gunakan 3–16 karakter.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-display font-bold text-sm tracking-wider rounded-xl shadow-lg transition-all cursor-pointer"
            >
              MASUK LOBBY
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

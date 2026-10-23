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
                .padEnd(6, '9')}`,
          nickname: normalizedQuery.startsWith('ar-')
            ? `Player_${normalizedQuery.slice(-3).toUpperCase()}`
            : searchQuery.trim().slice(0, 15),
          rankTitle: 'Mythic IV',
          status: 'online',
          favoriteHeroId: 'vanguard',
          isFriend: false,
        }
      : null;

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between py-4 px-4 sm:py-6 sm:px-6 select-none">
      {/* Top Bar: Left Profile Badge | Center Brand | Right Friendlist Button */}
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        {/* Left: Player Profile & Auto-ID Badge (Low-Poly Semi-3D) */}
        <div className="pointer-events-auto flex items-center gap-2.5 sm:gap-3 bg-[#121722] border-t-2 border-l-2 border-b-2 border-r-2 border-t-[#475569] border-l-[#475569] border-b-[#0a0d14] border-r-[#0a0d14] p-2 sm:p-2.5 shadow-md">
          <div className="relative">
            <HeroFacePortrait
              heroId={profile.avatarHeroId}
              className="w-10 h-10 sm:w-11 sm:h-11 border border-[#334155] shrink-0"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-xs sm:text-sm text-white tracking-wide">
                {profile.nickname || 'Guest Player'}
              </span>
              <button
                onPointerDown={(e) => {
                  e.stopPropagation();
                  soundEngine.playUiClick();
                  setDraftId(profile.id);
                  setDraftNick(profile.nickname);
                  setNickError('');
                  setShowProfileModal(true);
                }}
                className="text-[9px] px-1 py-0.5 bg-[#1a2232] text-amber-300 border border-[#334155] cursor-pointer"
                title="Ubah Nickname & ID"
              >
                Edit
              </button>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono-tabular text-[10px] font-semibold text-slate-300">
                ID: {profile.id}
              </span>
              <button
                onPointerDown={(e) => {
                  e.stopPropagation();
                  handleCopyId(profile.id);
                }}
                className="text-[9px] text-amber-400 hover:text-white cursor-pointer"
                title="Salin ID"
              >
                {copiedId ? 'Tersalin' : 'Salin'}
              </button>
            </div>
            <span className="text-[9px] text-slate-400 font-semibold mt-0.5">
              {profile.rankTitle}
            </span>
          </div>
        </div>

        {/* Center Brand Lockup: Game Title + by zell studio */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#121722] border border-[#475569] p-1 flex items-center justify-center shrink-0">
              <img
                src="/logo_zell.png"
                alt="Zell Studio"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/assets/aistudio/image_3db09b16.png';
                }}
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-display font-extrabold text-xs sm:text-base text-white tracking-widest leading-none">
                AETHER RIFT
              </span>
              <span className="text-[8px] sm:text-[9px] font-mono-tabular font-bold text-amber-400 uppercase tracking-widest mt-0.5">
                by zell studio
              </span>
            </div>
          </div>
        </div>

        {/* Right: Friendlist & Search Player Toggle */}
        <div className="pointer-events-auto relative">
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              soundEngine.playUiClick();
              setShowFriendDrawer((prev) => !prev);
            }}
            className="flex items-center gap-2 px-3 py-2 bg-[#121722] hover:bg-[#1a2232] border-t-2 border-l-2 border-b-2 border-r-2 border-t-[#475569] border-l-[#475569] border-b-[#0a0d14] border-r-[#0a0d14] text-xs font-semibold text-slate-200 cursor-pointer"
          >
            <span className="w-2 h-2 bg-amber-400" />
            <span className="text-[11px] sm:text-xs">Teman & Cari ID</span>
            <span className="px-1.5 py-0.2 bg-[#1a2232] border border-[#334155] font-mono-tabular text-[10px] text-amber-300">
              {friends.filter((f) => f.isFriend).length}
            </span>
          </button>

          {/* Compact Friendlist & Search Dropdown in Lobby */}
          {showFriendDrawer && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-[#121722] border-t-2 border-l-2 border-b-2 border-r-2 border-t-[#475569] border-l-[#475569] border-b-[#0a0d14] border-r-[#0a0d14] p-3 shadow-2xl z-30">
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-[#242e42]">
                <span className="font-display font-bold text-[10px] sm:text-xs text-white tracking-wider uppercase">
                  Friendlist & Cari Player
                </span>
                <button
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setShowFriendDrawer(false);
                  }}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="mb-2.5">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari Nickname atau ID..."
                  className="w-full px-2.5 py-1.5 text-xs bg-[#0c1017] border border-[#334155] text-white placeholder-slate-500 outline-none"
                />
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {filteredFriends.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 p-1.5 bg-[#161d2a] border border-[#2d3748]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <HeroFacePortrait
                        heroId={item.favoriteHeroId}
                        className="w-8 h-8 border border-[#334155] shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-slate-100 truncate">
                          {item.nickname}
                        </div>
                        <div className="flex items-center gap-1 text-[9px] font-mono-tabular text-slate-400">
                          <span>{item.id}</span>
                          <span>•</span>
                          <span
                            className={
                              item.status === 'online'
                                ? 'text-amber-400'
                                : 'text-slate-500'
                            }
                          >
                            {item.status === 'online' ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!item.isFriend ? (
                      <button
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          soundEngine.playUiClick();
                          onAddFriend(item);
                        }}
                        className="px-2 py-0.5 bg-[#b45309] hover:bg-[#d97706] text-white font-bold text-[9px] cursor-pointer"
                      >
                        + Teman
                      </button>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-[#141a26] border border-[#334155] text-amber-300 text-[9px]">
                        Teman
                      </span>
                    )}
                  </div>
                ))}

                {customSearchCandidate && (
                  <div className="flex items-center justify-between gap-2 p-1.5 bg-[#161d2a] border border-[#b45309]">
                    <div className="flex items-center gap-2 min-w-0">
                      <HeroFacePortrait
                        heroId={customSearchCandidate.favoriteHeroId}
                        className="w-8 h-8 border border-[#334155] shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-white truncate">
                          {customSearchCandidate.nickname}
                        </div>
                        <div className="text-[9px] font-mono-tabular text-slate-400">
                          {customSearchCandidate.id} • Online
                        </div>
                      </div>
                    </div>
                    <button
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        soundEngine.playUiClick();
                        onAddFriend(customSearchCandidate);
                        setSearchQuery('');
                      }}
                      className="px-2 py-0.5 bg-[#b45309] hover:bg-[#d97706] text-white font-bold text-[9px] cursor-pointer"
                    >
                      + Tambah
                    </button>
                  </div>
                )}

                {filteredFriends.length === 0 && !customSearchCandidate && (
                  <div className="text-center py-3 text-[11px] text-slate-400">
                    Ketik minimal 3 karakter Nickname atau ID.
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
      <div className="pointer-events-auto flex flex-col items-center gap-1.5 pb-2">
        <div className="text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase text-slate-400 bg-[#121722] px-3 py-0.5 border border-[#334155]">
          Login: <span className="text-amber-400">{profile.nickname}</span> ({profile.id})
        </div>
        <button
          onPointerDown={(e) => {
            e.stopPropagation();
            soundEngine.playUiClick();
            if (!profile.nickname.trim()) {
              setShowProfileModal(true);
              return;
            }
            onGoToPick();
          }}
          className="min-w-[130px] sm:min-w-[180px] min-h-[36px] sm:min-h-[44px] px-6 sm:px-10 py-1.5 sm:py-2.5 bg-[#b45309] hover:bg-[#d97706] text-white font-display font-bold text-xs sm:text-sm tracking-widest border-t-2 border-l-2 border-b-2 border-r-2 border-t-[#f59e0b] border-l-[#f59e0b] border-b-[#451a03] border-r-[#451a03] cursor-pointer whitespace-nowrap"
        >
          PLAY
        </button>
      </div>

      {/* LOGIN MODAL: Low-Poly Semi-3D */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 pointer-events-auto bg-black/80 flex items-center justify-center p-4 select-none">
          <form
            onSubmit={handleSaveNicknameAndId}
            className="w-full max-w-sm bg-[#121722] border-t-2 border-l-2 border-b-2 border-r-2 border-t-[#475569] border-l-[#475569] border-b-[#0a0d14] border-r-[#0a0d14] p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-[#242e42]">
              <span className="text-[10px] font-mono-tabular font-bold uppercase tracking-widest text-amber-400">
                LOGIN AETHER RIFT
              </span>
              {!isFirstLogin && (
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setShowProfileModal(false);
                  }}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <h2 className="font-display text-lg font-bold text-white mb-1 tracking-wider uppercase">
              Buat Nickname
            </h2>
            <p className="text-[11px] text-slate-400 mb-4">
              Masukkan Nickname kamu untuk mulai bermain.
            </p>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-300">
                  Nickname Player
                </label>
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    handleRandomNickname();
                  }}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
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
                placeholder="Masukkan Nickname..."
                autoFocus
                className="w-full px-3 py-2 text-xs font-semibold bg-[#0c1017] border border-[#334155] focus:border-amber-400 text-white placeholder-slate-500 outline-none"
              />
              {nickError ? (
                <p className="text-[10px] text-amber-300 mt-1 font-medium">{nickError}</p>
              ) : (
                <p className="text-[10px] text-slate-500 mt-1">
                  Gunakan 3–16 karakter.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-[#b45309] hover:bg-[#d97706] text-white font-display font-bold text-xs uppercase tracking-wider border-t border-l border-t-[#f59e0b] border-l-[#f59e0b] border-b border-r border-b-[#451a03] border-r-[#451a03] cursor-pointer"
            >
              MASUK LOBBY
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

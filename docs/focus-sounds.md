# Focus Sounds Feature

## Summary

- Add a new public route at /focus for an Arabic-first focus tool with three bundled natural sounds: rain, fire, and
  lightning.
- Keep the page itself server-rendered by default, and move all audio/state logic into client components behind a
  clear 'use client' boundary.
- Make playback a layered mixer: users can play multiple sounds at once, control each track’s volume independently,
  and keep playback running while moving between student-facing pages.

## Key Changes

- Add app/focus/page.tsx and app/focus/loading.tsx.
  The page should provide metadata, the standard MobilePageHeaderMenu hero block, and render a client
  FocusSoundStudio island.
- Add a global FocusAudioProvider in app/layout.tsx, mounted outside the keyed PublicRouteFrame subtree so audio is
  not remounted on route changes.
  It should lazily create audio instances only after user interaction, avoid eager downloads, and manage all mixer
  state.
- Add a small persistent FloatingFocusPlayer that appears only while at least one track is active.
  It should show active playback status, support pause/resume all, stop all, and deep-link back to /focus.
- Introduce a shared student-tools nav definition and use it in the desktop header and the mobile sheet menu.
  Include /focus there, keep the mobile bottom nav unchanged, and keep theme/support actions separate from the tool
  links.
- Add bundled loopable sound files under public/sounds/focus/ for rain.mp3, fire.mp3, and lightning.mp3.
- Store focus preferences in local storage with a versioned key, and include that key in backup/export/import
  alongside the other local-first tools.

## Interfaces and State

- Add FocusSoundId = "rain" | "fire" | "lightning".
- Add a FocusSoundConfig catalog with label, description, icon/accent metadata, and asset path per sound.
- Add a FocusSoundPreferences shape persisted under one storage key, containing:
  - per-sound volume values
  - the last enabled track ids
- Add a useFocusAudio() context API exposing:
  - sounds
  - toggleSound(id)
  - setVolume(id, value)
  - pauseAll()
  - resumeAll()
  - stopAll()
- Persist volumes and last enabled tracks, but do not auto-start playback after a full reload; restore settings in a
  paused state to respect browser autoplay limits.
- Keep cross-page playback within the student-facing shell only; navigating to /login or /dashboard\* should stop
  playback and clear active runtime state.

- Desktop navbar and mobile sheet both include the new Focus link and navigate correctly; mobile bottom nav remains
  unchanged.
- Multiple sounds can play simultaneously, each slider changes only its own track volume, and changing one track
  does not restart the others.
- Playback survives navigation between student-facing pages, and the floating mini-player remains available until
  all tracks are stopped.
- Refresh restores saved volumes and track selection state but starts paused.
- Export/import from Settings includes the focus preferences key and restores it correctly.
- If local storage is blocked, playback still works for the current session without persistence.
- If an audio file is missing or play() fails, the UI shows a clear error/toast and leaves the track paused.

## Assumptions

- Initial sound catalog is exactly three tracks: rain, fire, and lightning.
- Bundled audio assets will be available locally in the repo at the agreed public/sounds/focus/ paths.
- The focus route label/copy will be Arabic-first, and the feature will reuse the project’s existing utility-minimal
  visual language rather than introducing a separate theme.
- No bottom-nav redesign is part of this change.

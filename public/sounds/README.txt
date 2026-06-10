Audio files
===========

The Liberto audio system expects six MP3 files in this folder. They are
loaded on demand by AudioService — missing files are skipped silently,
so the app keeps working without them, just without sound.

Required files:

  anthem.mp3            Loop. Plays in menus, standings, draw, etc.
                        Aim for the Libertadores anthem or a similar
                        anthemic loop. ~30s+ track, will loop.

  crowd.mp3             Loop. Plays during live matches. Stadium
                        ambience / crowd murmur. ~30s+ track.

  whistle-kickoff.mp3   One-shot. Fires on kickoff and on the start of
                        the second half.

  whistle-half.mp3      One-shot. Fires at half-time.

  whistle-end.mp3       One-shot. Fires at full-time.

  goal.mp3              One-shot. Fires every time a goal is scored.

Drop the files here with the exact names above and reload the page.
The mute button in the top-right corner toggles all audio (persisted
in localStorage as 'liberto.muted').

Free sources: freesound.org, pixabay.com/sound-effects, mixkit.co.

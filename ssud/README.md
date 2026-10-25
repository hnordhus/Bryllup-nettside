# Sunny Side Up & Down (SSUD)

A Norwegian scramble team planner, published at `/ssud/` and listed at
[`/apper/`](../apper/index.html).

Open [index.html](index.html) directly or serve the repository as a static site.
The app is self-contained, has no dependencies or network calls, and can be
downloaded as a single HTML file for offline use.

- Enter players, handicaps, team count, holes and required drives.
- Advanced mode adds low/medium/high ratings for driving, approach, chipping
  and putting. Medium means the expected level for the player's handicap.
- The scoring assumptions and limitations are documented inside the app.
  Scores are heuristic balancing points, not predicted golf scores.
- Player data is stored only in the current browser under
  `scramble-planner-v1`. Existing version 1 data is migrated to version 2.
- "Nullstill spillere" asks for confirmation, then clears all player names,
  handicaps and skill ratings, including temporarily hidden players and
  stored player data. It retains valid player count and round settings.
  Other apps' storage is not cleared.

The user-supplied players/golf-ball logo is preserved as [logo.png](logo.png).
The 64 px and 192 px PNG variants are resized from that original.
The HTML embeds the smaller variants for the header, favicon and touch icon
to preserve offline use.

GitHub Pages serves this directory in the same way as Ferd and Brain Train.
Deploy by committing the relevant files and pushing to the site's publishing
branch. No build step is needed.

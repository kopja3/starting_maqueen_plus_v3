# starting_maqueen_plus_v3

This MakeCode project now contains two selectable Maqueen Plus V3 programs in one GitHub repo:

- `ProgramMode.LineFollowing`
- `ProgramMode.LaserShuttle`

## How to choose the version in MakeCode

1. Open the project from GitHub in MakeCode.
2. Open `main.ts`.
3. Change this line:

```typescript
const ACTIVE_MODE = ProgramMode.LineFollowing
```

Change it to either:

```typescript
const ACTIVE_MODE = ProgramMode.LineFollowing
```

or

```typescript
const ACTIVE_MODE = ProgramMode.LaserShuttle
```

Then press **Download** to flash that version to the micro:bit.

## Buttons on the robot

- **B** = start
- **A** = stop
- **A+B** = in Laser Shuttle mode, toggle forward/reverse manually

## Notes

- Laser Shuttle mode requires the MakeCode dependency `matrixLidarDistance`.
- The project already includes that dependency in `pxt.json`.
- Laser mode initializes the matrix lidar and waits about 3.5 seconds before use.

## Edit this project

- Open [https://makecode.microbit.org/](https://makecode.microbit.org/)
- Click **Import**
- Click **Import URL**
- Paste `https://github.com/kopja3/starting_maqueen_plus_v3`

<script src="https://makecode.com/gh-pages-embed.js"></script><script>makeCodeRender("{{ site.makecode.home_url }}", "{{ site.github.owner_name }}/{{ site.github.repository_name }}");</script>

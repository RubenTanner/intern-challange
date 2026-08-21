// Hand-designed levels in a text-grid format. One character per tile.
//
//   LEGEND
//   .  empty space (short rows are padded with empty space)
//   #  solid block
//   =  moving platform, horizontal patrol (a run of = is one platform)
//   |  moving platform, vertical patrol (one cell; platform is 2 tiles wide)
//   ^  spike hazard (sits on the block below; touching it kills)
//   o  coin (collectible)
//   P  player start
//   E  exit door (reach it to finish the level)
//
// Design rule of thumb: the player can rise 2 tiles per jump and clear a
// 3-4 tile gap, so every required hop here is at most rise 2 / gap 3.

import { TILE, MOVER } from './config.js';
import { rect } from '/engine/entity.js';

export const LEVELS = [
  {
    name: 'AISLE ONE',
    grid: [
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '................................o..o..o',
      '..............................##########',
      '.........................o................E',
      '........................####..............####',
      '..................o.o',
      '..................####',
      '............o.o',
      '............####',
      '...P',
      '################################......##########################',
    ],
  },
  {
    name: 'CHILLED AISLE',
    grid: [
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '.....................................................o.E..o',
      '.....................................................######',
      '',
      '..................................................o',
      '..................................................|',
      '..............o.o.o.............o.o',
      '.............########',
      '............^^^^^^^^.............===.......^^^',
      '############################............########################',
    ],
  },
  {
    name: 'CLEARANCE',
    grid: [
      '',
      '',
      '',
      '',
      '',
      '',
      '.......................................................o......E',
      '..................................o.....o.......###...####...####',
      '.................................###...###',
      '.....................o',
      '....................###...===................|',
      '................o',
      '...............###',
      '...........o',
      '..........###',
      '..P......^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^',
      '########################################################################',
    ],
  },
];

// Turn a grid into world-space geometry. Horizontal runs of '#' in a row
// are merged into single rects so collision checks stay cheap.
export const parseLevel = ({ name, grid }) => {
  const rows = grid.length;
  const cols = Math.max(...grid.map((r) => r.length));
  const at = (col, row) => grid[row]?.[col] ?? '.';

  const solids = [];
  const movers = [];
  const spikes = [];
  const coins = [];
  let start = { x: TILE, y: TILE };
  let exit = null;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const ch = at(col, row);
      const x = col * TILE;
      const y = row * TILE;
      if (ch === '#' || ch === '=') {
        // extend a run started at this cell; skip cells inside a run
        if (at(col - 1, row) === ch) continue;
        let run = 1;
        while (at(col + run, row) === ch) run++;
        if (ch === '#') {
          solids.push(rect(x, y, run * TILE, TILE));
        } else {
          movers.push({
            ...rect(x, y, run * TILE, TILE / 2),
            baseX: x,
            baseY: y,
            axis: 'x',
            range: MOVER.range,
            speed: MOVER.speed,
            dx: 0,
            dy: 0,
          });
        }
      } else if (ch === '|') {
        movers.push({
          ...rect(x, y, TILE * 2, TILE / 2),
          baseX: x,
          baseY: y,
          axis: 'y',
          range: MOVER.range,
          speed: MOVER.speed,
          dx: 0,
          dy: 0,
        });
      } else if (ch === '^') {
        // visual triangle fills the cell's lower half; hitbox is smaller
        // than the drawing so grazing a spike's edge is forgiven
        spikes.push({ draw: rect(x, y, TILE, TILE), hit: rect(x + 5, y + TILE - 14, TILE - 10, 14) });
      } else if (ch === 'o') {
        coins.push({ x: x + TILE / 2, y: y + TILE / 2, taken: false });
      } else if (ch === 'P') {
        start = { x: x + TILE / 2, y: y + TILE };
      } else if (ch === 'E') {
        exit = rect(x + 3, y - TILE * 0.4, TILE - 6, TILE * 1.4);
      }
    }
  }

  return {
    name,
    width: cols * TILE,
    height: rows * TILE,
    solids,
    movers,
    spikes,
    coins,
    start,
    exit,
  };
};

// Advance moving platforms along their sine patrol and record the delta
// they moved this frame (the player script uses it to ride them).
export const updateMovers = (movers, time) => {
  for (const m of movers) {
    const offset = Math.sin(time * m.speed) * m.range;
    const nx = m.axis === 'x' ? m.baseX + offset : m.baseX;
    const ny = m.axis === 'y' ? m.baseY + offset : m.baseY;
    m.dx = nx - m.x;
    m.dy = ny - m.y;
    m.x = nx;
    m.y = ny;
  }
};

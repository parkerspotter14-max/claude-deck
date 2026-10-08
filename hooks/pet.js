// The pet: one design, drawn as animated SVG on the desktop and as RGBA frames
// (an Image) in terminals that show pictures. Pure functions, no $.

export const PET_ACTS = ['idle', 'walk', 'run', 'jump', 'console', 'read', 'sleep', 'celebrate', 'alert']

const SPEED = { walk: 0.035, run: 0.11 } // lane fractions per second

// ---------- behaviour: one scene at a time, the same on every surface ----------

export function createPet(now) {
  return { act: 'idle', dir: 1, x0: 0.3, x1: 0.3, start: now, dur: 3000, mood: 'calm', id: 1 }
}

export function petX(pet, now) {
  const p = pet.dur > 0 ? Math.min(1, Math.max(0, (now - pet.start) / pet.dur)) : 1
  return pet.x0 + (pet.x1 - pet.x0) * p
}

function pick(list, r) {
  return list[Math.floor(r * list.length) % list.length]
}

// mood: 'alert' | 'celebrate' | 'working' | 'sleepy' | 'calm'
export function stepPet(pet, mood, now, rand = Math.random) {
  const moodChanged = mood !== pet.mood && (mood === 'alert' || mood === 'celebrate' || pet.mood === 'alert')
  if (!moodChanged && now < pet.start + pet.dur) return false
  const x = petX(pet, now)
  pet.mood = mood
  pet.start = now
  pet.x0 = x
  pet.x1 = x
  pet.id++
  let act
  if (mood === 'alert') act = 'alert'
  else if (mood === 'celebrate') act = 'celebrate'
  else if (mood === 'working') act = pick(['console', 'console', 'read', 'walk', 'idle'], rand())
  else if (mood === 'sleepy') act = pick(['sleep', 'sleep', 'idle'], rand())
  else act = pick(['idle', 'walk', 'walk', 'run', 'jump', 'read'], rand())
  pet.act = act
  if (act === 'walk' || act === 'run') {
    let target = rand()
    if (Math.abs(target - x) < 0.15) target = x < 0.5 ? Math.min(1, x + 0.4) : Math.max(0, x - 0.4)
    pet.x1 = target
    pet.dir = target >= x ? 1 : -1
    pet.dur = (Math.abs(target - x) / SPEED[act]) * 1000
  } else {
    if (rand() < 0.3) pet.dir *= -1
    pet.dur = act === 'sleep' ? 14000 : act === 'alert' ? 2500 : act === 'celebrate' ? 3200 : act === 'jump' ? 2000 : 3000 + rand() * 4000
  }
  return true
}

// ---------- desktop: animated SVG ----------

export const PET_CSS =
  '.rw{fill:#eef1f6}.rs{fill:#b9c0cc}.rg{fill:#8d96a3}.rb{fill:#378ADD}.pd{fill:#1c1f26}' +
  '@keyframes rock{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}' +
  '.fb{transform-box:fill-box;transform-origin:center}.ft{transform-box:fill-box;transform-origin:top center}.fbot{transform-box:fill-box;transform-origin:bottom center}' +
  '@keyframes blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}' +
  '@keyframes breathe{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.965)}}' +
  '@keyframes legA{0%,100%{transform:rotate(18deg)}50%{transform:rotate(-18deg)}}' +
  '@keyframes legB{0%,100%{transform:rotate(-18deg)}50%{transform:rotate(18deg)}}' +
  '@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.2px)}}' +
  '@keyframes jump{0%,100%{transform:translateY(0) scaleY(.92)}12%{transform:translateY(0) scaleY(1.04)}45%{transform:translateY(-12px)}80%{transform:translateY(0)}}' +
  '@keyframes tap{0%,100%{transform:translateY(0)}50%{transform:translateY(1.5px)}}' +
  '@keyframes glow{0%,100%{opacity:1}50%{opacity:.55}}' +
  '@keyframes zz{0%{transform:translate(0,0);opacity:0}20%{opacity:1}100%{transform:translate(6px,-14px);opacity:0}}' +
  '@keyframes wave{0%,100%{transform:rotate(-20deg)}50%{transform:rotate(25deg)}}' +
  '@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-1px)}75%{transform:translateX(1px)}}' +
  '@keyframes conf{0%{transform:translateY(0);opacity:1}100%{transform:translateY(16px);opacity:0}}' +
  '@keyframes look{0%,40%{transform:translateX(-1px)}50%,90%{transform:translateX(1.2px)}}' +
  '@keyframes puff{0%{transform:translateX(0) scale(.6);opacity:.7}100%{transform:translateX(-8px) scale(1.3);opacity:0}}' +
  '@media (prefers-reduced-motion:reduce){*{animation:none!important}}'

// the pet in its own 48x38 box (viewBox -4 -6 48 38), facing right
export function petSvgBody(state) {
  const run = state === 'run'
  const walk = state === 'walk' || run
  const sit = state === 'console' || state === 'read'
  const sleep = state === 'sleep'
  const legDur = run ? '.28s' : '.6s'
  const rock = walk ? ` style="animation:rock ${legDur} ease-in-out infinite"` : ''
  const side = (x, rev) => {
    const leg = `<rect x="${x}" y="12" width="4" height="15" rx="2" class="rw"/><rect x="${x - 1.5}" y="25.5" width="7" height="3" rx="1.5" class="rg"/>`
    return state === 'celebrate' ? `<g class="fbot" style="animation:wave .5s ease-in-out infinite${rev ? ' reverse' : ''}">${leg}</g>` : leg
  }
  const eyes = sleep
    ? '<rect x="21" y="8.4" width="4" height="1.2" rx=".6" class="pd"/>'
    : `<g${state === 'read' ? ' style="animation:look 2.4s ease-in-out infinite"' : ''}><circle cx="23" cy="9" r="2.3" class="pd"/><circle cx="23" cy="9" r="1.3" fill="#E5484D" class="fb" style="animation:blink 3.6s infinite"/></g>`
  let props = ''
  if (state === 'console')
    props = '<rect x="27" y="19" width="13" height="8" rx="2" fill="#4a4a48"/><rect x="28.5" y="20.3" width="7" height="5" rx="1" fill="#5DCAA5" style="animation:glow .4s infinite"/><circle cx="37.5" cy="21.5" r=".9" fill="#E5484D"/><circle cx="37.5" cy="24" r=".9" fill="#378ADD"/>'
  if (state === 'read')
    props = '<rect x="26" y="17" width="14" height="9" rx="1.5" fill="#378ADD"/><rect x="27" y="18" width="6" height="7" rx=".8" fill="#f2f0ea"/><rect x="33.5" y="18" width="5.5" height="7" rx=".8" fill="#e8e4da"/><path d="M28 20h4M28 22h4M28 24h3M34.5 20h3.5M34.5 22h3.5" stroke="#9a9893" stroke-width=".5"/>'
  if (sleep)
    props = '<text x="31" y="6" font-size="6" fill="#9a9893" font-family="system-ui" style="animation:zz 2s infinite">z</text><text x="34" y="3" font-size="4.5" fill="#9a9893" font-family="system-ui" style="animation:zz 2s infinite .9s">z</text>'
  if (state === 'alert')
    props = '<g style="animation:shake .3s infinite"><rect x="29" y="-3" width="9" height="9" rx="4.5" fill="#E09A1E"/><text x="33.5" y="4.3" font-size="7" font-weight="600" text-anchor="middle" fill="#412402" font-family="system-ui">!</text></g>'
  if (state === 'celebrate')
    props = ['#EBA83A', '#9C95EC', '#5DCAA5', '#E2706F'].map((c, i) => `<rect x="${6 + i * 9}" y="-2" width="2" height="2" rx=".5" fill="${c}" style="animation:conf 1s infinite ${i * 0.22}s"/>`).join('')
  if (run) props = '<circle cx="6" cy="27" r="2" fill="#4a4a48" class="fb" style="animation:puff .5s infinite"/><circle cx="4" cy="25" r="1.5" fill="#4a4a48" class="fb" style="animation:puff .5s infinite .25s"/>'
  const bodyAnim =
    state === 'jump' || state === 'celebrate'
      ? 'animation:jump 1s cubic-bezier(.3,.6,.4,1) infinite'
      : walk
        ? `animation:bob ${legDur} ease-in-out infinite`
        : `animation:breathe ${sleep ? '3s' : '2.4s'} ease-in-out infinite`
  const lean = run ? ' style="transform:rotate(-7deg);transform-origin:20px 28px"' : ''
  // R2-D2: centre foot, two side legs, white torso with blue panels, domed head with a red eye
  return (
    `<ellipse cx="20" cy="29.5" rx="${state === 'jump' ? 8 : 12}" ry="1.6" fill="#000" opacity=".35"/>` +
    `<g${lean}><g class="fbot" style="${bodyAnim}"><g transform="translate(0 ${sit ? 2 : 0})"><g class="fbot"${rock}>` +
    `<rect x="17.5" y="22" width="5" height="6.5" rx="2" class="rg"/>${side(6, false)}${side(30, true)}` +
    '<rect x="10" y="13" width="20" height="11" rx="2" class="rw"/><rect x="10" y="21" width="20" height="3" rx="1.5" class="rs" opacity=".6"/>' +
    '<rect x="12" y="15.5" width="6" height="5" rx="1" class="rb"/><rect x="21" y="15.5" width="7" height="2.4" rx=".8" class="rb"/><circle cx="24.5" cy="20.2" r="1.2" class="rg"/>' +
    '<path d="M10 13A10 10 0 0 1 30 13Z" class="rw"/><path d="M10.63 9.5H29.37L29.8 11H10.2Z" class="rb"/><path d="M12.86 6H27.14L28.15 7.2H11.85Z" class="rb"/>' +
    `<circle cx="16" cy="8.5" r="1" class="rg"/>${eyes}</g></g></g></g>${props}`
  )
}

// Mustafar: red sky, black ridges, a lava river with falls, embers drifting up
function mustafarSvg(W, H) {
  const r = (a, k) => {
    const x = Math.sin(a * 127.1 + k * 311.7) * 43758.5453
    return x - Math.floor(x)
  }
  const g = Math.max(6, Math.round(H * 0.24))
  const gt = H - g
  const lh = Math.max(3, Math.round(H * 0.14))
  const lt = gt - lh
  const ridge = (lo, amp, step, k) => {
    let d = `M0 ${H}`
    for (let x = 0; x <= W + step; x += step) d += `L${x} ${(H * lo + r(x / step, k) * H * amp).toFixed(1)}`
    return d + `L${W + step} ${H}Z`
  }
  let falls = ''
  if (H >= 40)
    for (let i = 0; i < 3; i++) {
      const x = (W * (0.1 + 0.3 * i) + r(i, 9) * 40).toFixed(1)
      falls += `<rect x="${x}" y="${(H * 0.5).toFixed(1)}" width="2.5" height="${(lt - H * 0.5).toFixed(1)}" fill="#ff7a1a" opacity=".75" style="animation:glow ${(1.4 + i * 0.5).toFixed(1)}s infinite"/>`
    }
  let flecks = ''
  for (let x = 6; x < W; x += 23)
    if (r(x, 3) > 0.4)
      flecks += `<rect x="${x}" y="${(lt + r(x, 4) * (lh - 1.5)).toFixed(1)}" width="${(8 + r(x, 5) * 10).toFixed(1)}" height="1.2" rx=".6" fill="#ffd34d" opacity=".55" style="animation:glow ${(1.2 + r(x, 6) * 2).toFixed(1)}s infinite -${(r(x, 7) * 3).toFixed(1)}s"/>`
  let embers = ''
  for (let i = 0; i < Math.max(4, Math.floor(W / 45)); i++)
    embers += `<circle cx="${(r(i, 11) * W).toFixed(1)}" cy="${gt}" r="${(0.7 + r(i, 12) * 0.8).toFixed(1)}" fill="#ffb347" opacity="0" style="animation:emb${H} ${(3 + r(i, 13) * 3).toFixed(1)}s linear infinite -${(r(i, 14) * 6).toFixed(1)}s"/>`
  return (
    `<style>@keyframes emb${H}{0%{transform:translate(0,0);opacity:0}15%{opacity:.9}100%{transform:translate(8px,-${(H * 0.9).toFixed(0)}px);opacity:0}}</style>` +
    '<defs><linearGradient id="mfs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#12040a"/><stop offset=".55" stop-color="#5a0f0a"/><stop offset="1" stop-color="#d9480f"/></linearGradient>' +
    '<radialGradient id="mfg"><stop offset="0" stop-color="#ff7a1a" stop-opacity=".6"/><stop offset="1" stop-color="#ff7a1a" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="mfl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb02e"/><stop offset="1" stop-color="#e8400c"/></linearGradient></defs>' +
    `<rect width="${W}" height="${H}" fill="url(#mfs)"/>` +
    `<ellipse cx="${(W * 0.72).toFixed(1)}" cy="${(H * 0.78).toFixed(1)}" rx="${(W * 0.35).toFixed(1)}" ry="${H}" fill="url(#mfg)"/>` +
    `<path d="${ridge(0.3, 0.28, 18, 1)}" fill="#2a0a08"/><path d="${ridge(0.46, 0.2, 14, 2)}" fill="#170605"/>` +
    falls +
    `<rect y="${lt}" width="${W}" height="${lh}" fill="url(#mfl)" style="animation:glow 3s infinite"/>${flecks}` +
    `<rect y="${gt}" width="${W}" height="${g}" fill="#0d0605"/><rect y="${gt}" width="${W}" height="1" fill="#ff6a1a" opacity=".5"/>` +
    embers
  )
}

// the lane: the pet walks from x0 to x1 by CSS, phased by the scene's age so a redraw does not restart it
export function petLaneSvg(pet, now, W, H = 62, scale = 1.05) {
  const PW = 48 * scale
  const PH = 38 * scale
  const room = Math.max(0, W - PW)
  const a = pet.x0 * room
  const b = pet.x1 * room
  const age = Math.max(0, now - pet.start) / 1000
  const dur = Math.max(0.001, pet.dur / 1000)
  const move = `@keyframes mv${pet.id}{from{transform:translateX(${a.toFixed(1)}px)}to{transform:translateX(${b.toFixed(1)}px)}}`
  const flip = pet.dir < 0 ? `translate(${PW} 0) scale(-1 1)` : ''
  const dots = mustafarSvg(W, H)
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<style>${PET_CSS}${move}.mv{animation:mv${pet.id} ${dur.toFixed(2)}s linear both;animation-delay:-${Math.min(age, dur).toFixed(2)}s}</style>` +
    dots +
    `<g class="mv"><g transform="translate(0 ${H - PH - 2})"><g transform="${flip}"><svg width="${PW}" height="${PH}" viewBox="-4 -6 48 38" overflow="visible">${petSvgBody(pet.act)}</svg></g></g></g>` +
    '</svg>'
  )
}

// ---------- terminal: the same shapes rasterized, frame by frame ----------

const COL = {
  O: [217, 119, 87], C: [196, 98, 63], D: [42, 28, 23], G: [74, 74, 72], S: [93, 202, 165], R: [229, 72, 77],
  B: [55, 138, 221], W: [238, 241, 246], P: [232, 228, 218], Y: [224, 154, 30], Z: [154, 152, 147], K: [0, 0, 0],
  V: [156, 149, 236], E: [226, 112, 111], L: [141, 150, 163], T: [185, 192, 204],
}

function canvas(W, H) {
  return { W, H, px: new Uint8Array(W * H * 4) }
}

function blend(cv, x, y, rgb, a) {
  if (x < 0 || y < 0 || x >= cv.W || y >= cv.H || a <= 0) return
  const i = (y * cv.W + x) * 4
  const da = cv.px[i + 3] / 255
  const oa = a + da * (1 - a)
  for (let k = 0; k < 3; k++) cv.px[i + k] = Math.round((rgb[k] * a + cv.px[i + k] * da * (1 - a)) / (oa || 1))
  cv.px[i + 3] = Math.round(oa * 255)
}

// a shape in pet units, drawn at scale s with 2x2 coverage sampling
function shape(cv, s, inside, bx0, by0, bx1, by1, rgb, alpha = 1) {
  const X0 = Math.floor((bx0 + 4) * s)
  const Y0 = Math.floor((by0 + 6) * s)
  const X1 = Math.ceil((bx1 + 4) * s)
  const Y1 = Math.ceil((by1 + 6) * s)
  for (let py = Y0; py < Y1; py++) {
    for (let px = X0; px < X1; px++) {
      let hit = 0
      for (const [ox, oy] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) {
        if (inside((px + ox) / s - 4, (py + oy) / s - 6)) hit++
      }
      if (hit) blend(cv, px, py, rgb, (hit / 4) * alpha)
    }
  }
}

function rrect(cv, s, x, y, w, h, r, c, a) {
  const inside = (u, v) => {
    if (u < x || v < y || u > x + w || v > y + h) return false
    const cx = Math.min(Math.max(u, x + r), x + w - r)
    const cy = Math.min(Math.max(v, y + r), y + h - r)
    return (u - cx) ** 2 + (v - cy) ** 2 <= r * r
  }
  shape(cv, s, inside, x, y, x + w, y + h, COL[c], a)
}

function ellipse(cv, s, cx, cy, rx, ry, c, a) {
  shape(cv, s, (u, v) => ((u - cx) / rx) ** 2 + ((v - cy) / ry) ** 2 <= 1, cx - rx, cy - ry, cx + rx, cy + ry, COL[c], a)
}

export const PET_RASTER = { scale: 2, width: 96, height: 76 }

export function petFrame(act, tMs, dir) {
  const s = PET_RASTER.scale
  const cv = canvas(PET_RASTER.width, PET_RASTER.height)
  const ph = tMs / 1000
  const sin = (period, off = 0) => Math.sin(((ph + off) / period) * Math.PI * 2)
  const run = act === 'run'
  const walk = act === 'walk' || run
  const sit = act === 'console' || act === 'read'
  let dy = 0
  let squash = 0
  if (act === 'jump' || act === 'celebrate') {
    const p = ph % 1
    if (p < 0.12) squash = 1.2
    else if (p < 0.8) dy = -8 * Math.sin(((p - 0.12) / 0.68) * Math.PI)
  } else if (walk) dy = -Math.abs(sin(run ? 0.28 : 0.6)) * 1.2
  else dy = (sin(act === 'sleep' ? 3 : 2.4) * 0.5 + 0.5) * 0.6
  const lean = run ? 1.5 : 0
  const sy = sit ? 2 : 0
  ellipse(cv, s, 20, 29.5, act === 'jump' && dy < -4 ? 8 : 12, 1.6, 'K', 0.35)
  if (run) {
    const q = (ph % 0.5) / 0.5
    ellipse(cv, s, 6 - q * 8, 27, 2 * (0.6 + q * 0.7), 2 * (0.6 + q * 0.7), 'G', 0.7 * (1 - q))
  }
  const Y = (v) => v + dy + sy
  // R2-D2: centre foot, two side legs, white torso with blue panels, domed head with a red eye
  const up = act === 'celebrate' ? -2 - sin(0.5) * 2 : 0
  rrect(cv, s, 17.5 + lean, Y(22), 5, 6.5, 2, 'L')
  ;[6, 30].forEach((x) => {
    rrect(cv, s, x + lean, Y(12) + up, 4, 15, 2, 'W')
    rrect(cv, s, x - 1.5 + lean, Y(25.5) + up, 7, 3, 1.5, 'L')
  })
  rrect(cv, s, 10 + lean, Y(13), 20, 11, 2, 'W')
  rrect(cv, s, 10 + lean, Y(21), 20, 3, 1.5, 'T', 0.6)
  rrect(cv, s, 12 + lean, Y(15.5), 6, 5, 1, 'B')
  rrect(cv, s, 21 + lean, Y(15.5), 7, 2.4, 0.8, 'B')
  ellipse(cv, s, 24.5 + lean, Y(20.2), 1.2, 1.2, 'L')
  const cx = 20 + lean
  const cy = Y(13)
  const dome = (u, v) => v <= cy && (u - cx) ** 2 + (v - cy) ** 2 <= 100
  shape(cv, s, dome, cx - 10, cy - 10, cx + 10, cy, COL.W)
  shape(cv, s, (u, v) => dome(u, v) && v >= cy - 3.5 && v <= cy - 2, cx - 10, cy - 3.5, cx + 10, cy - 2, COL.B)
  shape(cv, s, (u, v) => dome(u, v) && v >= cy - 7 && v <= cy - 5.8, cx - 10, cy - 7, cx + 10, cy - 5.8, COL.B)
  ellipse(cv, s, 16 + lean, Y(8.5), 1, 1, 'L')
  if (act === 'sleep') {
    rrect(cv, s, 21 + lean, Y(8.4), 4, 1.2, 0.6, 'D')
  } else {
    const blinking = ph % 3.6 > 3.42
    const look = act === 'read' ? (ph % 2.4 < 1.2 ? -1 : 1.2) : 0
    ellipse(cv, s, 23 + lean + look, Y(9), 2.3, 2.3, 'D')
    ellipse(cv, s, 23 + lean + look, Y(9), 1.3, blinking ? 0.25 : 1.3, 'R')
  }
  if (act === 'console') {
    rrect(cv, s, 27, Y(19), 13, 8, 2, 'G')
    rrect(cv, s, 28.5, Y(20.3), 7, 5, 1, 'S', sin(0.4) > 0 ? 1 : 0.6)
    ellipse(cv, s, 37.5, Y(21.5), 0.9, 0.9, 'R')
    ellipse(cv, s, 37.5, Y(24), 0.9, 0.9, 'B')
  }
  if (act === 'read') {
    rrect(cv, s, 26, Y(17), 14, 9, 1.5, 'B')
    rrect(cv, s, 27, Y(18), 6, 7, 0.8, 'W')
    rrect(cv, s, 33.5, Y(18), 5.5, 7, 0.8, 'P')
  }
  if (act === 'sleep') {
    for (const [off, size] of [[0, 1], [0.9, 0.75]]) {
      const q = ((ph + off) % 2) / 2
      const zx = 31 + q * 6 + (off ? 3 : 0)
      const zy = 2 - q * 14 - (off ? 3 : 0)
      const a = q < 0.2 ? q * 5 : 1 - q
      rrect(cv, s, zx, zy, 3 * size, 0.8, 0.3, 'Z', a)
      rrect(cv, s, zx + 1.1 * size, zy + 0.8, 0.8, 1.6 * size, 0.3, 'Z', a)
      rrect(cv, s, zx, zy + 2.4 * size, 3 * size, 0.8, 0.3, 'Z', a)
    }
  }
  if (act === 'alert') {
    const sx = Math.sin(ph * 40) * 0.8
    rrect(cv, s, 29 + sx, -3, 9, 9, 4.5, 'Y')
    rrect(cv, s, 32.8 + sx, -1.5, 1.6, 3.6, 0.6, 'D')
    rrect(cv, s, 32.8 + sx, 2.8, 1.6, 1.5, 0.6, 'D')
  }
  if (act === 'celebrate') {
    ;['Y', 'V', 'S', 'E'].forEach((c, i) => {
      const q = ((ph + i * 0.22) % 1) / 1
      rrect(cv, s, 6 + i * 9, -2 + q * 16, 2, 2, 0.5, c, 1 - q)
    })
  }
  if (dir < 0) {
    const { W, H, px } = cv
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W / 2; x++) {
        const a = (y * W + x) * 4
        const b = (y * W + (W - 1 - x)) * 4
        for (let k = 0; k < 4; k++) {
          const t = px[a + k]
          px[a + k] = px[b + k]
          px[b + k] = t
        }
      }
    }
  }
  return cv.px
}

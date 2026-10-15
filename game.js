/* Crazy Yummy Rides - Platanus Hack 26 Arcade. Generado desde TypeScript con: npm run arcade (no editar a mano). */
"use strict";
(() => {
  var W = 320;
  var H = 240;
  var T = 16;
  var MAP = 100;
  var WORLD = MAP * T;
  var wx = (d) => d - WORLD * Math.round(d / WORLD);

  var { floor, round, random, abs, min, max, sin, cos, hypot, atan2, sign, sqrt, ceil, PI } = Math;
  var rint = (n) => floor(random() * n);
  var pickOf = (a) => a[rint(a.length)];
  var clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  var A;
  var M;
  var nb;
  var eng;
  var engG;
  var muted = false;
  var gn = () => A.createGain();
  var osc = () => A.createOscillator();
  function setMuted(m) {
    muted = m;
    if (M) M.gain.value = m ? 0 : 0.5;
  }
  function initAudio() {
    if (!A) {
      A = new AudioContext();
      M = gn();
      M.connect(A.destination);
      setMuted(muted);
    }
    if (A.state === "suspended") A.resume();
  }
  function tn(f, d, v, f2, t, out, type) {
    const o = osc(), g = gn();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (f2 !== f) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(1e-3, t + d);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + d);
  }
  function tone(f, d, v = 0.15, f2 = f, t02 = 0, type = "square") {
    if (A) tn(f, d, v, f2, A.currentTime + t02, M, type);
  }
  function noise(d, v = 0.2, t02 = 0, hp = 0) {
    if (A) nz(d, v, A.currentTime + t02, hp, M);
  }
  function nz(d, v, t, hp, out) {
    if (!nb) {
      nb = A.createBuffer(1, A.sampleRate, A.sampleRate);
      const ch = nb.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = random() * 2 - 1;
    }
    const s = A.createBufferSource(), g = gn();
    s.buffer = nb;
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(1e-3, t + d);
    let n = s;
    if (hp) {
      const f = A.createBiquadFilter();
      f.type = "highpass";
      f.frequency.value = hp;
      n = s.connect(f);
    }
    n.connect(g).connect(out);
    s.start(t);
    s.stop(t + d);
  }
  var arp = (fs, gap, d = 0.1, v = 0.12) => fs.forEach((f, i) => tone(f, d, v, f, i * gap));
  var sfx = {
    sel: () => tone(880, 0.06, 0.1),
    ok: () => arp([660, 990], 0.07),
    pick: () => arp([523, 659, 784, 1047], 0.06),
    cash: () => arp([1319, 1760, 2093], 0.07, 0.15),
    tip: () => arp([988, 1319], 0.05, 0.08, 0.08),
    crash: () => {
      noise(0.35, 0.4);
      tone(120, 0.3, 0.2, 40, 0, "sawtooth");
    },
    tick: () => tone(1200, 0.04, 0.08),
    miss: () => tone(400, 0.4, 0.18, 120, 0, "triangle"),
    over: () => arp([392, 370, 349, 330], 0.3, 0.3, 0.15),
    /** Corneta: dos cuadradas desafinadas. */
    horn: () => {
      tone(392, 0.3, 0.1, 380);
      tone(466, 0.3, 0.08, 452);
    },
    drift: () => noise(0.08, 0.05, 0, 2500),
    /** Balbuceo de voz: sílabas cuadradas al azar. */
    talk: () => {
      for (let i = 0; i < 5; i++) tone(250 + random() * 450, 0.05, 0.05, 200 + random() * 500, i * 0.065);
    }
  };
  function engine(r) {
    if (!A) return;
    if (!eng) {
      eng = osc();
      eng.type = "sawtooth";
      engG = gn();
      engG.gain.value = 0;
      const f = A.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 500;
      eng.connect(f).connect(engG).connect(M);
      eng.start();
    }
    eng.frequency.setTargetAtTime(45 + max(r, 0) * 110, A.currentTime, 0.05);
    engG.gain.setTargetAtTime(r < 0 ? 0 : 0.06 + r * 0.06, A.currentTime, 0.05);
  }
  var LEAD = "m-m-m-k-k--kk-i-i-f---.......ffim--mm-k-k-kkk-i-i-f---.......ffim-m-m-k--kkkk-ikn-m---...f..f--im--mn-m--....f-im--mn-m-p....fi.";
  var BASS = "a...m.h.d...p.k.i...m.i.d...f.d.";
  var DRUM = "1040304010403040";
  var U = 0.125;
  var on = false;
  var k = 0;
  var t0 = 0;
  var MB;
  var P1;
  var P2;
  var pw = (d) => {
    const r = new Float32Array(32), im = new Float32Array(32);
    for (let n = 1; n < 32; n++) r[n] = sin(2 * PI * n * d) / n, im[n] = (1 - cos(2 * PI * n * d)) / n;
    return A.createPeriodicWave(r, im);
  };
  function vo(m, t, d, v, w, vib) {
    const o = osc(), g = gn(), f = 440 * 2 ** ((m - 69) / 12), gg = g.gain;
    w ? o.setPeriodicWave(w) : o.type = "triangle";
    o.frequency.value = f;
    if (vib) {
      const l = osc(), lg = gn();
      l.frequency.value = 6;
      lg.gain.setValueAtTime(0, t);
      lg.gain.linearRampToValueAtTime(f * 0.012, t + d);
      l.connect(lg).connect(o.frequency);
      l.start(t);
      l.stop(t + d + 0.1);
    }
    gg.setValueAtTime(0, t);
    gg.linearRampToValueAtTime(v, t + 5e-3);
    gg.setTargetAtTime(v * 0.6, t + 0.01, 0.08);
    gg.setTargetAtTime(0, t + d - 0.02, 0.015);
    o.connect(g).connect(MB);
    o.start(t);
    o.stop(t + d + 0.1);
  }
  function music(play) {
    on = play;
    t0 = 0;
    MB?.disconnect();
    MB = void 0;
  }
  function musicTick() {
    if (!A || !on) return;
    const now = A.currentTime;
    if (!MB) (MB = gn()).connect(M), P1 ?? (P1 = pw(0.125)), P2 ?? (P2 = pw(0.25));
    if (!t0) t0 = now + 0.1, k = 0;
    if (t0 + k * U < now) k = ceil((now - t0) / U);
    for (let t; (t = t0 + k * U) < now + 0.2; k++) {
      const i = k & 127, h = k & 128, c = LEAD.charCodeAt(i) - 37, b = BASS.charCodeAt(k & 31) - 61, x = +DRUM[k & 15];
      if (c > 50) {
        let n = 1;
        while (LEAD[i + n & 127] == "-") n++;
        vo(c, t, n * U, 0.06, P1, n > 2);
        if (h) vo(c - (1451 >> (c + 9) % 12 & 1 ? 3 : 4), t, n * U, 0.03, P2);
        else vo(c, t + 3 * U, n * U, 0.025, P2);
      }
      if (b > 0) {
        let n = 1;
        while (n < 3 && BASS[k + n & 31] == ".") n++;
        vo(b, t, n * U * 0.9, 0.14);
      }
      if (h && k % 4 == 2) [56, 60, 63].forEach((m, j) => vo(m, t + j * U / 3, U / 3, 0.02, P2));
      if (x & 1) tn(150, 0.15, 0.16, 45, t, MB, "sine");
      if (x & 2) nz(0.09, 0.07, t, 1800, MB);
      if (x & 4) nz(0.03, 0.03, t, 7e3, MB);
    }
  }

  var PAL = "#0d0716,#2e1a4f,#512c85,#0f8a5f,#6b3e2e,#7b4fc2,#b8b3cc,#ffffff,#ff3d6e,#ff9f43,#ffd23f,#2ee59d,#3ec5ff,#a98be0,#ff5fb8,#ffc9a3".split(",");
  var RED = 16731501;
  var ORG = 16755021;
  var YEL = 16767053;
  var GRN = 4122272;
  var BLU = 5032447;
  var PNK = 16739016;
  var WHT = 16249599;
  var GRY = 10129336;
  var PUR = 8081346;
  var LAV = 12890357;

  var CH = " 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ!$.:-+/?<>%',*=()_";
  var G = "0000000>ACEIA>4<4444>>A1248OO2421A>26:BO22O@N11A>68@NAA>O124888>AA>AA>>AA?12<>AAAOAANAANAAN>A@@@A>LBAAABLO@@N@@OO@@N@@@>A@GAA?AAAOAAA>44444>72222B<ABDHDBA@@@@@@OAKEEAAAAAIECAA>AAAAA>NAAN@@@>AAAEB=NAANDBA?@@>11NO444444AAAAAA>AAAAA:4AAAEEE:AA:4:AAAAA:444O1248@O44444044?D>5N400000<<0<<0<<0000O000044O44001248@0>A12404248@8428421248HI248C3<4800000000<4804E>E4000O0O0024888428422248000000OcooccccccccoocNccgkcN<O`N3n<ac6<HcS0cNoNc0";
  var row = (i, y) => y >>> 0 < 7 ? G.charCodeAt(i * 7 + y) - 48 : 0;
  var bit = (i, x, y) => row(i, y) & 16 >> x;
  var BK = "MW0$%*";
  var fat = (i, x, y) => {
    const k2 = BK.indexOf(CH[i]), r = row(k2 < 0 ? i : 55 + k2, y);
    return (k2 < 0 ? r << 1 | r : r) & 32 >> x;
  };
  function makeFont(s) {
    const a = s.textures.createCanvas("fnt", 330, 8), b = s.textures.createCanvas("fntb", 440, 9), c = b.context, ac = a.context;
    ac.fillStyle = "#fff";
    for (let i = 0; i < 55; i++)
      for (let y = 0; y < 9; y++)
        for (let x = 0; x < 8; x++) {
          if (bit(i, x, y)) ac.fillRect(i * 6 + x, y, 1, 1);
          let o = 0;
          for (let d = 0; d < 9; d++) o |= fat(i, x - 2 + d % 3, y - 2 + ~~(d / 3));
          if (!o) continue;
          c.fillStyle = !fat(i, x - 1, y - 1) ? "#0d0716" : "#fff #fff #fff #e6e6ee #cfcfdc #babacb #a6a6ba".split(" ")[y - 1];
          c.fillRect(i * 8 + x, y, 1, 1);
        }
    a.refresh();
    b.refresh();
    const f = Phaser.GameObjects.RetroFont.Parse(s, { image: "fntb", width: 8, height: 9, chars: CH, lineSpacing: 1 });
    for (const k2 in f.data.chars) f.data.chars[k2].xAdvance = 7;
    s.cache.bitmapFont.add("px", f);
  }
  function txt(s, x, y, str, sz = 1, col = WHT, ox = 0.5) {
    return s.add.bitmapText(x, y, "px", str.toUpperCase(), 8 * sz).setOrigin(ox, 0).setTint(col).setDropShadow(sz, sz, 853782, 1);
  }
  var yoyo = (s, targets, d, c) => s.tweens.add({ targets, duration: d, yoyo: true, repeat: -1, ...c });

  function pix(s, key, w, d, pal = PAL) {
    const t = s.textures.createCanvas(key, w, d.length / w), c = t.context;
    [...d].forEach((ch, i) => {
      if (ch != ".") c.fillStyle = pal[parseInt(ch, 16)], c.fillRect(i % w, i / w | 0, 1, 1);
    });
    t.refresh();
  }

  var TAXI = ".200222222002.8dddddddddddd715551dddd0755615551daad0155615551d99d01556122215555012218111111111111a.000000000000.";
  var MOTO = "...dd..0....5ddd570.002257d00a..1222260....22..0..";
  var TP = "#0d0716,#2a2734,#6c6a78,#aeacb8,#e4e2ec,#fff,#fff2b0,#ff5a6a,#2a1a12,#6b3e2e,#e0b050,#ffc9a3,#d99a6c,#8d5a3b,#3ec5ff,#ff3d6e,#2ee59d,#ffd23f,#ff9f43,#c58cff".split(",");
  var CAR = ".200222222002.755555555555562444155551544324441555511443244415555114432333144441133272222222222226.000000000000.";
  var TMOTO = "....44....07555155560233113330....22....";
  var TRUCK = "2200222222002220022.7555555555555505555654545454545454055540" + "54545454545454044140".repeat(4) + "43434343434343033130722222222222220222260000000000000000000.";
  var PB = [
    ".111..222.3333523352.355..444..4.4..0.0.",
    ".1112.2223333352335..355..444..4.4..0.0.",
    ".111.122211335123352.355.33355.2.2..0.0.",
    ".111212223133352335..355.33355.2.2..0.0."
  ];
  var NPAX = 36;
  var dk = (h) => "#" + h.slice(1).replace(/../g, (x) => (parseInt(x, 16) * 0.7 | 0).toString(16).padStart(2, "0"));
  var TREE = "...0000....00bbbb00..0bb7bbb300bb7bbbb300bbbbbb3300bbbbb333003bb333330.03333330..00333300....0000...";
  function makeSprites(s) {
    pix(s, "taxi", 14, TAXI);
    pix(s, "moto", 10, MOTO);
    pix(s, "car", 14, CAR, TP);
    pix(s, "truck", 20, TRUCK, TP);
    pix(s, "tmoto", 10, TMOTO, TP);
    for (let v = 0; v < NPAX; v++) {
      const b = v % 2, c2 = (v >> 1) % 6, k2 = v / 12 | 0, h = TP[14 + c2];
      for (const f of [0, 1]) pix(s, `p${v}_${f}`, 5, PB[b * 2 + f], [TP[0], TP[8 + (c2 + k2) % 3], TP[11 + k2], h, b ? "" : c2 % 2 ? "#2e1a4f" : "#3d4a66", dk(h)]);
    }
    pix(s, "tree", 10, TREE);
    pix(s, "d0", 9, "....a.....a.....a....999.....9aaa9..aa9a7a9aa..9aaa9.....999....a.....a.....a....");
    pix(s, "d1", 9, ".............9.....9..9..9....999.....9aaa9...9aa7aa9.eeeeeeeee.88.888.....8.8...");
    pix(s, "d2", 9, "..ddd.....d77d...7d77d.....d7d......d7d...7..d77d......d77dd.....dddd............");
    pix(s, "mk", 5, "77776.776...6..");
    pix(s, "puff", 4, ".77.77777777.77.");
    pix(s, "skid", 2, "0000");
    const t = s.textures.createCanvas("shd", 16, 10), c = t.context, g = c.createRadialGradient(8, 5, 0, 8, 5, 8);
    g.addColorStop(0, "rgba(8,4,20,.45)");
    g.addColorStop(1, "rgba(8,4,20,0)");
    c.setTransform(1, 0, 0, 0.625, 0, 0);
    c.fillStyle = g;
    c.fillRect(0, 0, 16, 16);
    t.refresh();
  }

  var city = { solid: [], trees: [], marks: [] };
  var START = { x: 0, y: 0, a: 0 };
  var rd = new Uint8Array(MAP * MAP);
  var hl = new Uint8Array(MAP);
  var vl = new Uint8Array(MAP);
  var G2 = [];
  var sd = 2026;
  var rnd = () => {
    sd = sd + 1831565813 | 0;
    let t = Math.imul(sd ^ sd >>> 15, 1 | sd);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  var ri = (n) => floor(rnd() * n);
  var lines = (v, f, e) => {
    const L = [v];
    while (v + 25 <= e) L.push(v += L.length == f ? 16 : 10 + ri(6));
    L.push(e);
    return L;
  };
  var spot = ([x, y, w, h], s, f) => {
    const o = 16 + f * ((s % 2 ? h : w) - 32);
    return [[x + o, y + 7], [x + w - 7, y + o], [x + o, y + h - 7], [x + 7, y + o]][s];
  };
  function randomSpot() {
    const g = G2[rint(G2.length)];
    return spot(g, g[4] ? 2 * rint(2) : rint(4), random());
  }
  var P = [
    "#ff77a8",
    "#ffa300",
    "#29adff",
    "#00e436",
    "#ff004d",
    "#ffec27",
    "#5f574f",
    "#fff1e8",
    "#1d2b53",
    "#c2c3c7",
    "#e4e5e8",
    "#ab5236",
    "#2f8f4a",
    "#c7ecff",
    "#d9b77e",
    "#1f6b36",
    "#3b3b4f",
    "#857b70",
    "#83769c",
    "#4b6b8a",
    "#b0b1b8",
    "#cf7a55",
    "#000"
  ];
  var [, OR, BL, GN, RE, YE, DK, WH, NV, GY, LG, BR, GR, SK, SA, FO, AS, TA, LV, ST, SW, TC, BK2] = P;
  var K = (a, v = 0) => `rgba(${v},${v},${v},${a})`;
  var S3 = K(0.3);
  var S35 = K(0.35);
  var MARKC = P.slice(0, 6);
  var ROOFS = [
    [LV, "#a89bc0"],
    [BR, TC],
    [DK, TA],
    ["#7e2553", "#a8456f"],
    [NV, "#3a4f85"],
    [GY, LG],
    [ST, "#6f93b4"]
  ];
  var LM = "LA CARLOTA/.7/.42/a,PARQUE DEL ESTE/.86/.3/k,PLAZA BOLIVAR/.1/.3/p,CAPITOLIO/.2/.42/b/5,PARQUE CENTRAL/.3/.32/t,TERESA CARRENO/.4/.22/b/6,SABANA GRANDE/.5/.4/s,UCV/.42/.75/b/1,POLIEDRO/.18/.88/d,LAS MERCEDES/.6/.8/m,CCCT/.78/.72/b/0,ALTAMIRA/.76/.18/o,SAMBIL/.6/.2/b/2,PETARE/.95/.8/h".split(",");
  function genCity(s) {
    const X = lines(0, -1, MAP), Y = lines(8, 4, MAP - 2), nx = X.length - 1, ny = Y.length - 1, JR = 3;
    const br = (i) => i % 2 == 1 && i < nx;
    const g = new Int16Array(nx * ny).fill(-1), B = [];
    const grp = (i, j, i1, j1) => {
      for (let b = j; b <= j1; b++) for (let a2 = i; a2 <= i1; a2++) g[b * nx + a2] = B.length;
      B.push([i, j, i1, j1]);
    };
    for (let a2 = 0, i = 1; i <= nx; i++)
      if (i == nx || br(i)) {
        grp(a2, JR, i - 1, JR);
        a2 = i;
      }
    for (let t = 0; t < 60 && B.length < 13; t++) {
      const i = ri(nx), j = ri(ny), h = ri(2), i1 = i + h, j1 = j + 1 - h;
      if (i1 < nx && j1 < ny && g[j * nx + i] < 0 && g[j1 * nx + i1] < 0) grp(i, j, i1, j1);
    }
    g.forEach((v, k2) => v < 0 && grp(k2 % nx, k2 / nx | 0, k2 % nx, k2 / nx | 0));
    const gi = (i, j) => j < 0 || j >= ny ? NaN : g[j * nx + (i + nx) % nx];
    const E = [];
    for (let j = 0; j <= ny; j++) for (let i = 0; i < nx; i++) if (gi(i, j - 1) !== gi(i, j)) E.push([Y[j], X[i], X[i + 1], 1]);
    for (let i = 0; i < nx; i++)
      for (let j = 0; j < ny; j++) if (gi(i - 1, j) !== gi(i, j) && (j != JR || br(i))) E.push([X[i], Y[j], Y[j + 1], 0]);
    for (const [a2, p, q, h] of E)
      for (let u = p; u < q + 2; u++) for (let v = a2; v < a2 + 2; v++) rd[h ? v * MAP + u % MAP : u * MAP + v] = 1;
    const ln = (A2, l) => A2.forEach((v) => (l[v] = 1, l[v + 1] = 2));
    ln(X, vl);
    ln(Y, hl);
    const c = s.textures.createCanvas("city", WORLD, WORLD).context;
    c.imageSmoothingEnabled = false;
    const R = (x, y, w, h, f) => {
      c.fillStyle = f;
      c.fillRect(x, y, w, h);
    };
    const O = (x, y, r, f) => {
      c.fillStyle = f;
      c.beginPath();
      c.arc(x, y, r, 0, 7);
      c.fill();
    };
    const gs = (g2, ...k2) => (k2.forEach((v, i) => g2.addColorStop(i / (k2.length - 1), v)), g2);
    const vg = (y, Y2, a2, b) => gs(c.createLinearGradient(0, y, 0, Y2), a2, b);
    const sh = (h, a2) => `rgb(${[1, 3, 5].map((i) => {
      const v = parseInt(h.slice(i, i + 2), 16);
      return v + a2 * (a2 > 0 ? 255 - v : v) | 0;
    })})`;
    const sd2 = (x, y, w, h, n) => {
      for (let k2 = n; k2; k2--) R(x + k2, y + k2, w, h, K(0.13));
    };
    const wat = (x, y, w, h) => {
      R(x, y, w, h, vg(y, y + 6, NV, BL));
      R(x, y, 2, h, "#2186cc");
      R(x + w / 2, y + h - 4, w / 3, 1, SK);
    };
    const tx = (k2) => s.textures.get(k2);
    const font = tx("fnt").getSourceImage();
    const tree = tx("tree").getSourceImage();
    const write = (str, x, y, k2 = 1) => [...str].forEach((ch, i) => c.drawImage(font, CH.indexOf(ch) * 6, 0, 6, 8, x + i * 6 * k2, y, 6 * k2, 8 * k2));
    const sign2 = (n, x, y) => {
      const w = n.length * 6;
      R(x - w / 2 - 3, y - 6, w + 6, 13, BK2);
      write(n, x - w / 2, y - 3);
    };
    const solid = (x, y, w, h) => city.solid.push({ x, y, w, h });
    const mark = (n, x, y) => {
      R(x - 7, y - 7, 14, 14, RE);
      R(x - 5, y - 5, 10, 10, OR);
      city.marks.push({ n, x, y });
    };
    const bld = (x, y, w, h, [roof, rim], e = 0) => {
      const f = min(4 + ri(4) + e, h / 3) | 0, rh = h - f, fy = y + rh, d = (a2) => sh(rim, a2);
      solid(x, y, w, h);
      sd2(x, y, w, h, 3 + e / 2);
      R(x, y, w, h, BK2);
      R(x + 1, fy, w - 2, f - 1, vg(fy, y + h, d(-0.4), d(-0.75)));
      R(x + 1, fy, w - 2, 1, d(-0.2));
      for (let i = x + 3, k2; i < x + w - 3; i += 4) {
        k2 = ri(3);
        for (let j = fy + 1 + +(f > 5); j < y + h - 2; j += 3, k2++) {
          R(i, j, 2, 2, k2 % 3 ? NV : BR);
          R(i, j, 1, 1, k2 % 3 ? BL : YE);
        }
      }
      R(x + w - 2, fy, 1, f - 1, d(-0.8));
      if (w > 40) R(x + w / 2 - 2, y + h - 4, 4, 3, d(-0.9));
      R(x + 1, y + 1, w - 2, rh - 1, d(-0.3));
      R(x + 1, y + 1, w - 3, rh - 2, d(0.4));
      R(x + 2, y + 2, w - 4, rh - 3, rim);
      R(x + 3, y + 3, w - 6, rh - 5, gs(c.createLinearGradient(x, y, x + w, y + rh), sh(roof, 0.25), sh(roof, -0.15)));
      const q = sh(roof, -0.35);
      R(x + 3, y + 3, w - 6, 1, q);
      R(x + 3, y + 3, 1, rh - 5, q);
      if (w > 24 && rh > 24)
        for (let i = ri(4); i--; ) {
          const bw = 6 + ri(8), bh = 6 + ri(8), bx = x + 5 + ri(w - 10 - bw), by = y + 5 + ri(rh - 10 - bh), r = min(bw, bh) / 2;
          if (i % 2) {
            O(bx + r + 1, by + r + 2, r, S35);
            O(bx + r, by + r, r, d(-0.3));
            O(bx + r - 1, by + r - 1, r - 1.5, rim);
            R(bx + r - 2, by + r - 2, 1, 1, WH);
          } else {
            R(bx + 1, by + 2, bw, bh, S35);
            R(bx, by, bw, bh, d(-0.35));
            R(bx, by, bw - 1, bh - 2, rim);
            R(bx, by, bw - 1, 1, d(0.5));
            R(bx + 2, by + 2, bw - 5, 1, d(-0.4));
          }
        }
    };
    const curb = (x, y, w, h) => {
      sd2(x, y, w, h, 3);
      R(x, y, w, h, GY);
      R(x, y, w - 1, h - 1, WH);
      R(x + 1, y + 1, w - 2, h - 2, LG);
      R(x, y + h - 4, w, 4, vg(y + h - 4, y + h, TA, AS));
      solid(x, y, w, h);
    };
    const lots = (x, y, w, h, m = 24, cl) => {
      for (let a2 = 0, cw; a2 < w; a2 += cw) {
        cw = w - a2 < 3 * m ? w - a2 : m + ri(m);
        for (let b = 0, rh; b < h; b += rh) {
          rh = h - b < 3 * m ? h - b : m + ri(m);
          bld(x + a2 + 2, y + b + 2, cw - 4, rh - 4, cl ? [cl[ri(cl.length)], WH] : ROOFS[ri(ROOFS.length)]);
        }
      }
    };
    const park = (x, y, w, h, lk) => {
      const cx = x + w / 2, cy = y + h / 2;
      R(x, y, w, h, GR);
      for (let i = 0; i < w * h / 130; i++) R(x + ri(w), y + ri(h), 1, 1, i % 2 ? GN : FO);
      R(x, cy - 4, w, 8, SA);
      R(cx - 4, y, 8, h, SA);
      if (lk) {
        curb(x + 5, y + 5, w / 2 - 14, h / 2 - 14);
        wat(x + 7, y + 7, w / 2 - 18, h / 2 - 22);
      }
      for (let i = w * h / 600; i-- > 0; ) {
        const tx2 = x + 6 + ri(w - 12), ty = y + 6 + ri(h - 12), dx = abs(tx2 - cx), dy = abs(ty - cy);
        if (dx < 9 || dy < 9 || dx < 26 && dy < 26 || lk && tx2 < cx && ty < cy) continue;
        O(tx2 + 2, ty + 3, 5, K(0.25));
        c.drawImage(tree, tx2 - 5, ty - 5);
        city.trees.push([tx2, ty]);
      }
    };
    R(0, 0, WORLD, WORLD, AS);
    B.forEach(([i0, j0, i1, j1]) => {
      let x = (X[i0] + 2) * T, w = (X[i1 + 1] - X[i0] - 2) * T;
      const y = (Y[j0] + 2) * T, h = (Y[j1 + 1] - Y[j0] - 2) * T, r = +(j0 == JR);
      if (r && !i0) x = 0, w += 2 * T;
      if (r && i1 == nx - 1) w = WORLD - x;
      G2.push([x, y, w, h, r]);
      R(x + 1, y + 1, w, h, S3);
      if (x + w == WORLD) R(0, y + 1, 1, h, S3);
      R(x, y, w, h, DK);
      R(x, y, w - 1, h - 1, LG);
      R(x + 1, y + 1, w - 2, h - 2, GY);
      for (let i = 16; i < w; i += 16) R(x + i, y + 1, 1, h - 2, SW);
      for (let i = 16; i < h; i += 16) R(x + 1, y + i, w - 2, 1, SW);
      if (r) {
        lots(x + 16, y + 16, w - 32, 64);
        lots(x + 16, y + 144, w - 32, h - 160);
        for (const v of [0, WORLD - 1]) c.drawImage(c.canvas, 1, y, 1, h, v, y, 1, h);
      }
    });
    const free = G2.map((_, k2) => k2).filter((k2) => !G2[k2][4]);
    for (const str of LM) {
      const [n, fx, fy, t, col] = str.split("/");
      let bk = 0, bd = 1e9;
      for (const k2 of free) {
        const [x2, y2, w2, h2] = G2[k2], d = hypot(x2 + w2 / 2 - +fx * WORLD, y2 + h2 / 2 - +fy * WORLD) + ("ak".includes(t) && w2 * h2 < 45e3 ? 1e5 : 0);
        if (d < bd) bd = d, bk = k2;
      }
      free.splice(free.indexOf(bk), 1);
      const [x, y, w, h] = G2[bk], ix = x + 16, iy = y + 16, iw = w - 32, ih = h - 32, cx = ix + iw / 2;
      let cy = iy + ih / 2;
      if (t == "b") bld(ix + 2, iy + 2, iw - 4, ih - 4, [P[+col], WH], 4);
      else if (t == "p" || t == "o") {
        park(ix, iy, iw, ih, 0);
        if (t == "o") {
          curb(cx - 14, cy - 14, 28, 28);
          wat(cx - 12, cy - 12, 24, 20);
          for (let k2 = 0; k2 < 16; k2++) R(cx + k2, cy + k2, 4, 4, S3);
          R(cx - 3, cy - 3, 6, 6, WH);
        } else {
          curb(cx - 9, cy - 9, 18, 18);
          R(cx - 4, cy - 4, 8, 8, DK);
          R(cx - 2, cy - 3, 4, 3, OR);
        }
        cy += 28;
      } else if (t == "t") {
        R(ix, iy, iw, ih, LV);
        const tw = min(iw, ih) * 0.36;
        for (const a2 of [0, 1]) {
          const tx2 = a2 ? ix + iw - tw - 8 : ix + 8, ty = a2 ? iy + ih - tw - 8 : iy + 8;
          bld(tx2, ty, tw, tw, [NV, ST], 10);
          R(tx2 + tw / 2 - 4, ty + tw / 2 - 4, 8, 8, RE);
        }
      } else if (t == "d") {
        R(ix, iy, iw, ih, GR);
        const r = min(iw, ih) / 2 - 6;
        for (let k2 = 6; k2; k2--) O(cx + k2, cy + k2, r + 2, K(0.1));
        O(cx, cy, r + 2, DK);
        O(cx, cy, r, gs(c.createRadialGradient(cx - r / 3, cy - r / 3, 2, cx, cy, r), WH, GY, DK));
        for (let k2 = 1; k2 < 4; k2++) O(cx, cy, r * k2 / 4, K(0.08, 255));
        solid(cx - r * 0.8, cy - r * 0.8, r * 1.6, r * 1.6);
      } else if (t == "k") park(ix, iy, iw, ih, 1);
      else if (t == "a") {
        R(ix, iy, iw, ih, GR);
        R(ix, cy - 10, iw, 20, DK);
        for (let p = ix + 4; p < ix + iw - 12; p += 16) R(p, cy - 1, 8, 2, WH);
        bld(ix + 4, iy + 4, min(64, iw / 3), ih / 2 - 18, [GY, WH]);
      } else if (t == "s") {
        lots(ix, iy, iw, ih / 2 - 14);
        lots(ix, cy + 14, iw, ih / 2 - 14);
        R(x, cy - 12, w, 24, BR);
        for (let p = x; p < x + w; p += 8) R(p, cy - 1, 4, 2, SA);
      } else {
        if (t == "h") R(ix, iy, iw, ih, BR);
        lots(ix, iy, iw, ih, t == "h" ? 12 : 24, MARKC);
      }
      sign2(n, cx, cy);
      const [ex, ey] = spot(G2[bk], ri(4), 0.5);
      mark(n, ex, ey);
    }
    for (const k2 of free) {
      const [x, y, w, h] = G2[k2];
      if (rnd() < 0.18) park(x + 16, y + 16, w - 32, h - 32, ri(2));
      else lots(x + 16, y + 16, w - 32, h - 32);
    }
    const ry = (Y[JR] + 2) * T + 88;
    R(0, ry - 4, WORLD, 56, GR);
    R(0, ry, WORLD, 48, NV);
    R(0, ry + 2, WORLD, 44, vg(ry, ry + 10, NV, BL));
    R(0, ry + 44, WORLD, 1, SK);
    for (let i = 0; i < 90; i++) R(ri(WORLD), ry + 6 + ri(36), 6 + ri(8), 1, SK);
    for (let x = 40; x < WORLD; x += 300) write("RIO GUAIRE", x, ry + 20);
    let a = 0;
    X.forEach((v, i) => {
      if (!br(i)) return;
      v *= T;
      solid(a, ry, v - a, 48);
      a = v + 32;
      R(v - 3, ry - 6, 38, 60, DK);
      R(v, ry - 6, 32, 60, AS);
      R(v + 35, ry, 4, 48, S3);
    });
    solid(a, ry, WORLD - a, 48);
    for (const [a2, p, q, h] of E) {
      const A2 = a2 * T, s0 = (p + 2) * T, e0 = q * T, L = e0 - s0;
      const r = (u, v, w, hh, f) => h ? R(u, v, w, hh, f) : R(v, u, hh, w, f);
      if (h && a2 == Y[JR + 1]) for (const o of [14, 17, 1, 30]) r(s0, A2 + o, L, 1, o % 15 > 1 ? YE : WH);
      else for (let u = s0 + 16; u < e0 - 16; u += 16) r(u, A2 + 15, 8, 2, YE);
      for (let o = A2 + 2; o < A2 + 34; o += 4) for (const u of [s0 + 1, e0 - 7]) r(u, o, 6, 2, "#d8d8e0");
    }
    R(0, 0, WORLD, 112, vg(0, 112, "#00a85f", FO));
    const gv = vg(0, 90, "#00873f", "#123d22"), gb = vg(0, 45, TC, "#7e3a26"), gr = vg(0, 18, GY, DK);
    for (let x = 0; x < WORLD; x += 8) {
      const h = 48 + ri(20) + sin(x * 6 * PI / WORLD) * 20;
      R(x, 0, 8, h, gv);
      R(x, 0, 8, h * 0.5, gb);
      R(x, 0, 8, h * 0.2, gr);
      R(x + 5, 0, 3, h, K(0.2));
      R(x, 0, 1, h * 0.5, K(0.15, 255));
    }
    for (let i = 0; i < 600; i++) R(ri(WORLD), 30 + ri(78), 3, 3, i % 3 ? FO : GN);
    R(0, 112, WORLD, 16, GY);
    R(0, 112, WORLD, 4, vg(112, 116, K(0.4), K(0)));
    R(0, 127, WORLD, 1, DK);
    solid(0, 0, WORLD, 112);
    for (const x of [120, 1060]) write("EL AVILA", x, 40, 2);
    const sx = 560;
    for (let k2 = 0; k2 < 40; k2++) R(sx + k2 * 4, 78 - k2 * 1.9, 2, 1, BK2);
    for (const k2 of [9, 23, 35]) R(sx + k2 * 4 - 2, 78 - k2 * 1.9, 5, 4, RE);
    bld(sx - 36, 78, 72, 28, [RE, WH]);
    sign2("TELEFERICO", sx, 92);
    mark("EL AVILA", sx, 120);
    START.x = (X[nx >> 1] + 4) * T;
    START.y = (Y[JR + 1] + 1) * T + 8;
    START.a = 0;
    tx("city").refresh();
  }

  var DIFFS = [
    { n: "FACIL", time: 75, sl: 2.2, mn: 1.3, dk: 0.06, pk: 3, dp: [10, 6, 3], cr: [6, 14], pay: 0.8 },
    { n: "NORMAL", time: 60, sl: 1.8, mn: 1, dk: 0.05, pk: 2, dp: [8, 5, 2], cr: [10, 22], pay: 1 },
    { n: "DIFICIL", time: 45, sl: 1.4, mn: 0.8, dk: 0.05, pk: 1, dp: [6, 3, 1], cr: [14, 30], pay: 1.3 }
  ];
  var diff = { i: 1 };
  var D = () => DIFFS[diff.i];

  var KEY = "crazy-yummy-rides";
  var DEF = "VICENTE:3000,IGNACIO:1500,VICTOR:1200,EL SIFRINO:1000,YUMMYRIDER:800,CARAQUENO:600,DIEGO:400,LEANDER:300,RALPH:200,YURI:100".split(",").map((e) => {
    const [n, s] = e.split(":");
    return { n, s: +s };
  });
  var data = { v: 5, scores: DEF, mute: false, name: "", diff: 1, veh: 0 };
  var st = () => window.platanusArcadeStorage || {
    async get(k2) {
      const r = localStorage.getItem(k2);
      return { found: r != null, value: r && JSON.parse(r) };
    },
    async set(k2, v) {
      localStorage.setItem(k2, JSON.stringify(v));
    }
  };
  var dirty = false;
  var apply = (d) => {
    if (dirty || !d || typeof d != "object" || !(d.v > 1)) return;
    const sc = d.scores;
    if (d.v == 5 && Array.isArray(sc) && sc.length == 10 && sc.every((e) => e && typeof e.n == "string" && Number.isFinite(e.s)))
      data.scores = sc.map((e) => ({ n: e.n.toUpperCase().slice(0, 10), s: e.s })).sort((a, b) => b.s - a.s);
    data.mute = d.mute === true;
    if (typeof d.name == "string") data.name = d.name.toUpperCase().slice(0, 8);
    if (Number.isInteger(d.diff) && DIFFS[d.diff]) data.diff = d.diff;
    data.veh = +(d.veh === 1);
    diff.i = data.diff;
    setMuted(data.mute);
  };
  async function load() {
    try {
      await Promise.race([
        st().get(KEY).then((r) => r && r.found && apply(r.value)),
        new Promise((r) => setTimeout(r, 1500))
      ]);
    } catch {
    }
  }
  var save = () => {
    dirty = true;
    try {
      Promise.resolve(st().set(KEY, data)).catch(() => {
      });
    } catch {
    }
  };
  var qualifies = (s) => s > 0 && s > data.scores[data.scores.length - 1].s;
  function addScore(n, s) {
    const e = { n, s }, a = data.scores;
    a.push(e);
    a.sort((a2, b) => b.s - a2.s);
    a.length = 10;
    save();
    return a.indexOf(e);
  }

  var BootScene = class extends Phaser.Scene {
    constructor() {
      super("boot");
    }
    create() {
      makeFont(this);
      makeSprites(this);
      genCity(this);
      load().then(() => this.scene.start("menu"));
    }
  };

  var SH = 0.28;
  var YUM = ".;%-%'*';;*')2*;;.*;,B1>..1>556';;6&655B;.5B3I-G.;:1;.=/;;=/<7=<;.=<?BD>..D>F7G/;;G/F7G=;.G=JBO>;;P/P7P@.;P5R-X/;;X/Y7Y@.;Y5[-a/;;a/b7b=;.b=dBj>;;k/k7k@.;k5m-s/;;s/t7t@.;t5v-|/;;|/}7}=;.}=B>;;/7<;.<B>..>3';;&5A;;AHH;0H[G5M";
  var PY = ",#160b29,#2e1a4f,#dccbff,#3d1f6b,#512c85,#8a5fd6".split(",");
  var PC = ",#9c1458,#ff3d8b,#1a0d30,#f39a1c,#ffd23f,#fff6c2".split(",");
  function word(a, w, str, ox, oy, sp, sh = 0) {
    [...str].forEach((ch, j) => {
      const i = CH.indexOf(ch);
      for (let y = 0; y < 7; y++)
        for (let x = 0; x < 6; x++)
          if (bit(i, x, y) || bit(i, x - 1, y)) a[(oy + y) * w + ox + j * (6 + sp) + x + round((6 - y) * sh)] = 1;
    });
  }
  function bake(s, key, w, h, ink, P3) {
    const t = s.textures.createCanvas(key, w, h), at = (a, x, y) => x >= 0 && y >= 0 && x < w && y < h ? a[y * w + x] : 0, o = ink.map((_, k2) => {
      let d = 0;
      for (let j = -1; j < 2; j++) for (let i = -1; i < 2; i++) d |= at(ink, k2 % w + i, (k2 / w | 0) + j);
      return d;
    });
    ink.forEach((v, k2) => {
      const x = k2 % w, y = k2 / w | 0;
      v = v ? !at(ink, x, y - 1) ? 6 : !at(ink, x, y + 1) ? 4 : 5 : o[k2] ? 3 : at(o, x, y - 1) || at(o, x - 1, y - 2) ? 2 : at(o, x - 1, y - 3) ? 1 : 0;
      if (v) t.context.fillStyle = P3[v], t.context.fillRect(x, y, 1, 1);
    });
    t.refresh();
  }
  function logo(s, x, y) {
    if (!s.textures.exists("logo")) {
      const a = new Uint8Array(7280), c = new Uint8Array(576);
      for (let i = 0; i < 240; i += 8) {
        const [r0, r1, x0, y0, cx, cy, x1, y1] = [...YUM.slice(i, i + 8)].map((c2, j) => (c2.charCodeAt(0) - 35) / (j < 2 ? 10 : 1));
        for (let t = 0; t <= 1; t += 0.02) {
          const u = 1 - t, r = r0 + (r1 - r0) * t, y2 = u * u * y0 + 2 * u * t * cy + t * t * y1, x2 = u * u * x0 + 2 * u * t * cx + t * t * x1 + (29 - y2) * SH + 4;
          for (let py = y2 - r | 0; py <= y2 + r; py++)
            for (let px = x2 - r | 0; px <= x2 + r; px++)
              if ((px + 0.5 - x2) ** 2 + (py + 0.5 - y2) ** 2 <= r * r) a[(py + 2) * 130 + px] = 1;
        }
      }
      word(a, 130, "RIDES", 82, 45, 2);
      word(c, 48, "CRAZY", 1, 1, 1, SH);
      bake(s, "logo", 130, 56, a, PY);
      bake(s, "logo2", 48, 12, c, PC);
      pix(s, "lspk", 5, "..7....7..77777..7....7..");
    }
    const m = s.add.image(x, y, "logo").setOrigin(0.5, 0).setScale(2);
    const cz = s.add.image(x + 6, y + 9, "logo2").setScale(2).setAngle(-5);
    yoyo(s, m, 900, { y: y + 2, ease: "Sine.InOut" });
    yoyo(s, cz, 520, { angle: 3, y: y + 7, ease: "Sine.InOut" });
    const sp = s.add.image(x, y, "lspk").setScale(0);
    const move = () => sp.setPosition(x + rint(201) - 100, y + 20 + rint(51));
    move();
    yoyo(s, sp, 260, { scale: 2, angle: 90, repeatDelay: 900, onRepeat: move });
    const taxi = s.add.image(x - 104, y + 106, "taxi").setScale(2), fl2 = () => taxi.toggleFlipX();
    yoyo(s, taxi, 1800, { x: x + 14, ease: "Sine.InOut", onYoyo: fl2, onRepeat: fl2 });
  }

  const CABINET_KEYS = {
  P1_U: ['w'], P1_D: ['s'], P1_L: ['a'], P1_R: ['d'],
  P1_1: ['u'], P1_2: ['i'], P1_3: ['o'],
  P1_4: ['j'], P1_5: ['k'], P1_6: ['l'],
  P2_U: ['ArrowUp'], P2_D: ['ArrowDown'], P2_L: ['ArrowLeft'], P2_R: ['ArrowRight'],
  P2_1: ['r'], P2_2: ['t'], P2_3: ['y'],
  P2_4: ['f'], P2_5: ['g'], P2_6: ['h'],
  START1: ['Enter'], START2: ['2'],
};
  var nk = (k2) => k2.length == 1 ? k2.toLowerCase() : k2;
  var KEY_TO_ARCADE = {};
  for (const [c, ks] of Object.entries(CABINET_KEYS)) for (const k2 of ks) KEY_TO_ARCADE[nk(k2)] = c;
  var held = /* @__PURE__ */ Object.create(null);
  var act = (c) => c[0] == "S" ? "S" : { 1: "A", 2: "B", 6: "M" }[c[3]] || c[3];
  var on2 = (a) => held["P1_" + a] || held["P2_" + a];
  var ls = [];
  addEventListener("keydown", (e) => {
    const c = KEY_TO_ARCADE[nk(e.key)];
    if (!c || held[c]) return;
    held[c] = true;
    for (const f of [...ls]) f(act(c));
  });
  addEventListener("keyup", (e) => {
    const c = KEY_TO_ARCADE[nk(e.key)];
    if (c) held[c] = false;
  });
  addEventListener("blur", () => {
    for (const c in held) held[c] = false;
  });
  var press = (s, f) => {
    const g = (a) => s.sys.isActive() && f(a);
    ls.push(g);
    s.events.once("shutdown", () => ls = ls.filter((x) => x != g));
  };

  var tap = (o, f) => o.setInteractive().on("pointerdown", f);
  var fl = (t) => sin(t / 90) > -0.6 ? 1 : 0.4;
  var ud = (a, n) => a == "U" ? n - 1 : a == "D" ? 1 : 0;
  var nav = (s, b, ok, f) => press(s, (a) => a == "A" || a == "S" ? ok() : a == "B" ? s.scene.start(b) : f(a));
  var leave = (s, t, w, f) => {
    let d = 0;
    const g = () => d || (d = 1, f());
    s.time.delayedCall(t, g);
    s.time.delayedCall(w, () => {
      press(s, g);
      s.input.once("pointerdown", g);
    });
  };

  var ITEMS = ["JUGAR", "PUNTAJES", "COMO JUGAR", "SONIDO"];
  var HELP = "PALANCA: ACELERA, FRENA Y GIRA|BOTON 1 DERRAPE   BOTON 2 PITO|START PAUSA   BOTON 6 SONIDO||FRENA JUNTO A UN PASAJERO|SIGUE LA FLECHA AL DESTINO|FRENA EN EL ANILLO PARA COBRAR||ROJO CORTO  AMARILLO MEDIO  VERDE LARGO|LLEGA RAPIDO = MAS TIEMPO Y $|DERRAPES Y CASI CHOQUES = PROPINAS".split("|");
  var MenuScene = class extends Phaser.Scene {
    constructor() {
      super("menu");
    }
    create() {
      this.s = 0;
      const bg = this.add.image(0, 0, "city").setOrigin(0);
      yoyo(this, bg, 6e4, { x: W - WORLD });
      yoyo(this, bg, 47e3, { y: H - WORLD });
      this.add.rectangle(0, 0, W, H, 0, 0.6).setOrigin(0);
      logo(this, W / 2, 10);
      this.it = ITEMS.map((s, i) => tap(txt(this, W / 2, 130 + i * 15, s), () => {
        this.s = i;
        this.go();
      }));
      txt(this, W / 2, 204, "PALANCA + BOTON 1", 1, GRY);
      txt(this, W / 2, 226, "(C) 2026 YUMMY INC", 1, GRY);
      this.h = this.add.container(0, 0, [
        this.add.rectangle(0, 0, W, H, 0, 0.92).setOrigin(0),
        txt(this, W / 2, 16, "COMO JUGAR", 2, YEL),
        ...HELP.map((s, i) => txt(this, W / 2, 46 + i * 13, s, 1, WHT)),
        txt(this, W / 2, 210, "PRESIONA UN BOTON", 1, BLU)
      ]).setVisible(false).setDepth(10);
      press(this, (a) => this.ky(a));
      this.input.on("pointerdown", () => this.h.visible && this.hd());
      music(true);
      this.ri();
      this.rf();
    }
    /** Reinicia el timer del modo "attract": tras un rato sin input muestra la tabla de puntajes. */
    ri() {
      this.i?.remove();
      this.i = this.time.delayedCall(15e3, () => this.scene.start("scores", { hl: -1 }));
    }
    ky(a) {
      initAudio();
      this.ri();
      if (this.h.visible) return this.hd();
      const d = ud(a, 4);
      if (d) this.s = (this.s + d) % 4;
      else if (a == "A" || a == "S") return this.go();
      else if (a == "M") return this.mu();
      else return;
      sfx.sel();
      this.rf();
    }
    hd() {
      if (this.time.now - this.ha > 250) this.h.setVisible(false);
    }
    mu() {
      setMuted(!muted);
      data.mute = muted;
      save();
      sfx.sel();
      this.rf();
    }
    go() {
      if (this.h.visible) return;
      initAudio();
      if (this.s == 3) return this.mu();
      sfx.ok();
      if (this.s == 0) this.scene.start("name");
      else if (this.s == 1) this.scene.start("scores", { hl: -1 });
      else {
        this.ha = this.time.now;
        this.h.setVisible(true);
      }
    }
    rf() {
      this.it.forEach((t, i) => {
        const s = i == 3 ? `SONIDO ${muted ? "OFF" : "ON"}` : ITEMS[i];
        t.setText(i == this.s ? `> ${s} <` : s).setTint(i == this.s ? YEL : WHT);
      });
    }
    update(t) {
      this.it[this.s].setAlpha(fl(t));
    }
  };

  var [qHi, qNear, qCrash, qWild, qSlow, qFast, qOk, qLate, qBye, qDrift] = "EPALE CHAMO!|QUE MAS PANA!|LLEVAME A @!|PA @, RAPIDITO!|~DAME EL CASCO PANA!|~AGARRATE QUE NOS VAMOS!|^ME MONTO ATRAS!/CUIDADO!|EPA EPA!|CASI NOS MATAMOS!|AY MI MADRE!|CUIDADO #!|~ME RASPASTE LA RODILLA!|~AGARRATE!|^CASI ME QUEDO SIN PUERTA!/CONO!|AY NO CHAMO!|QUE LADILLA!|ME QUIERES MATAR?|EPA, #!|~SE ME CAYO EL CASCO!|^ME DI EN LA CABEZA!/MAS DESPACIO MARICO!|CHAMO TRANQUILO!|TE VAS A MATAR PANA!|BAJALE DOS!|ESTAS LOCO CHAMO?|~PILAS CON EL HUECO!|~ME VOY A CAER!|^ME ESTOY MAREANDO!/ECHALE BOLAS!|DALE QUE VOY TARDE!|MUEVETE PUES!|ESTO ES PA HOY?|~ESTA MOTO NO CORRE?|^ESTE CARRO NO CORRE?/QUE NOTA!|BURDA DE RAPIDO!|CHEVERE PANA!|ERES UN DURO!|~ESA MOTO VUELA!|^QUE NAVE!/GRACIAS PANA!|TA BIEN CHAMO/TARDASTE BURDA|NI MODO.../ME BAJO AQUI, CHAO!|MEJOR ME VOY EN METRO!/QUE LOCURA!|ESO ES!|~CASI ME BOTAS!".split("/").map((x) => x.split("|"));
  var pick = (a, m, d = "") => pickOf(a.filter((x) => x[0] != (m ? "^" : "~"))).replace(/^[~^]/, "").replace("#", m ? "LA MOTO" : "EL CARRO").replace("@", d);

  var MAX = 120;
  var BRK = 200;
  var REV = 40;
  var STEP = PI / 8;
  var snap = (a) => round(a / STEP) * STEP;
  var VEH = [
    { k: "taxi", m: MAX, ac: 80, t: 2.9, g: [14, 2.5], r: 5 },
    { k: "moto", m: 135, ac: 115, t: 3.4, g: [11, 1.6], r: 3 }
  ];
  var Taxi = class extends Phaser.Physics.Arcade.Sprite {
    constructor(s, x, y, i = 0) {
      super(s, x, y, VEH[i].k);
      /** Rumbo real (rad); el sprite se dibuja en 16 direcciones. */
      this.a = 0;
      /** Rapidez del último frame. */
      this.ls = 0;
      /** Velocidad lateral (derrape). */
      this.lat = 0;
      /** Dirección suavizada (-1..1) para que el volante no sea brusco. */
      this.st = 0;
      const v = this.v = VEH[i];
      s.add.existing(this);
      s.physics.add.existing(this);
      this.body.setCircle(v.r, this.width / 2 - v.r, this.height / 2 - v.r).setCollideWorldBounds(true).setBounce(0.15);
      this.setDepth(5);
    }
    /** Derrapando. */
    get df() {
      return abs(this.lat) > 25 && this.ls > 40;
    }
    drive(c, dt) {
      const v = this.body.velocity, { m, ac, t, g } = this.v;
      let fx = cos(this.a), fy = sin(this.a);
      let fw = v.x * fx + v.y * fy, lat = -v.x * fy + v.y * fx;
      if (c.u) fw += (fw < 0 ? BRK : ac * (1 - 0.6 * fw / m)) * dt;
      else if (c.d) fw -= (fw > 0 ? BRK : ac * 0.6) * dt;
      else fw -= sign(fw) * min(abs(fw), 45 * dt);
      if (c.b) fw -= fw * 0.6 * dt;
      fw = clamp(fw, -REV, m);
      const target = (c.r ? 1 : 0) - (c.l ? 1 : 0);
      this.st += (target - this.st) * min(1, (target ? 9 : 10) * dt);
      const k2 = clamp(fw / 30, -1, 1) * (1 - 0.25 * min(1, abs(fw) / m));
      this.a += this.st * t * (c.b ? 1.33 : 1) * k2 * dt;
      if (!target && fw > 20) this.a += (snap(this.a) - this.a) * min(1, 2.5 * dt);
      lat *= Math.exp(-g[+c.b] * dt);
      fx = cos(this.a);
      fy = sin(this.a);
      this.body.setVelocity(fw * fx - lat * fy, fw * fy + lat * fx);
      this.lat = lat;
      this.ls = hypot(fw, lat);
      this.rotation = snap(this.a);
    }
  };

  var DX = [1, 0, -1, 0];
  var DY = [0, 1, 0, -1];
  var TINTS = [16711757, 2731519, 58422, 16753408, 16742312, 12764103, 8615580, 16773608, 8267091];
  var md = (x) => (x % MAP + MAP) % MAP;
  var road = (x, y) => y >= 0 && y < MAP && rd[y * MAP + md(x)] > 0;
  var Car = class extends Phaser.Physics.Arcade.Sprite {
    /** k: 0 carro, 1 camión, 2 moto. */
    constructor(s, k2) {
      super(s, 0, 0, ["car", "truck", "tmoto"][k2]);
      this.dr = 0;
      this.sp = 50;
      this.px = 0;
      this.py = 0;
      /** Momento hasta el que no cuenta otro "casi choque". */
      this.nm = 0;
      /** Momento hasta el que va apurado por la corneta (ignora a otros autos y acelera). */
      this.hk = 0;
      this.big = k2 == 1;
      this.mo = k2 == 2;
      s.add.existing(this);
      s.physics.add.existing(this);
      this.body.setImmovable(true);
      this.setDepth(4);
    }
    sd(d) {
      this.dr = d;
      this.rotation = d * PI / 2;
      const l = this.big ? 18 : this.mo ? 9 : 13, w = this.mo ? 4 : 8;
      this.body.setSize(d % 2 ? w : l, d % 2 ? l : w, true);
    }
    /** Vuelta en U: pasa al carril contrario. */
    ut() {
      const d = this.dr;
      this.x += DY[d] * T;
      this.y -= DX[d] * T;
      this.px = this.x;
      this.py = this.y;
      this.sd((d + 2) % 4);
    }
    /**
     * Cruza el centro del tile i (columna si va horizontal, fila si vertical). Si es carril de una calle transversal
     * decide: seguir, girar (si hay calle hacia allá) o, en una calle sin salida, dar la vuelta en U.
     */
    cr(i, horiz) {
      const m = horiz ? vl[md(i)] : hl[i];
      if (!m) return;
      const d = this.dr, dx = DX[d], dy = DY[d], nd = horiz ? m == 1 ? 1 : 3 : m == 1 ? 2 : 0;
      const cx = horiz ? i : floor(this.x / T), cy = horiz ? floor(this.y / T) : i;
      const st2 = road(cx + 2 * dx, cy + 2 * dy), tn2 = road(cx + 2 * DX[nd], cy + 2 * DY[nd]);
      const last = !(horiz ? vl[md(i + dx)] : hl[i + dy]);
      if (tn2 && (st2 ? random() < 0.3 : last || random() < 0.5)) {
        if (horiz) this.x = i * T + 8;
        else this.y = i * T + 8;
        this.sd(nd);
      } else if (!st2 && last) this.ut();
    }
    ah(ox, oy, r) {
      const d = this.dr, ax = ox - this.x, ay = oy - this.y, dx = DX[d], dy = DY[d], f = ax * dx + ay * dy;
      return f > 0 && f < r && abs(ax * dy - ay * dx) < 9;
    }
    /** Le tocan corneta: se apura y, si el taxi le tapa el carril de frente, se cambia al otro y da la vuelta. */
    honk(t, tx) {
      const d = this.dr;
      this.hk = t + 2.5;
      if (this.ah(tx.x, tx.y, 60) && cos(tx.a) * DX[d] + sin(tx.a) * DY[d] < 0) this.ut();
    }
    tick(tx, cars, t) {
      const h = this.dr % 2 == 0, a = floor(((h ? this.px : this.py) - 8) / T), b = floor(((h ? this.x : this.y) - 8) / T);
      if (a != b) this.cr(max(a, b), h);
      this.px = this.x;
      this.py = this.y;
      const d = this.dr, hurry = t < this.hk, v = hurry ? this.sp * 1.8 : this.sp;
      let go = !this.ah(tx.x, tx.y, 26);
      if (!hurry) {
        for (const c of cars) if (go && c != this && c.dr == d && this.ah(c.x, c.y, this.big || c.big ? 28 : this.mo ? 16 : 22)) go = false;
      }
      this.body.setVelocity(go ? DX[d] * v : 0, go ? DY[d] * v : 0);
    }
  };
  function placeCar(c, x, y) {
    for (let t = 0; t < 120; t++) {
      const gx = rint(MAP), gy = rint(MAP), h = hl[gy], v = vl[gx];
      if (!road(gx, gy) || !h === !v) continue;
      const cx = x + wx(gx * T + 8 - x), cy = gy * T + 8, d = hypot(cx - x, cy - y);
      if (d < 230 || d > 520) continue;
      c.setPosition(cx, cy);
      c.px = cx;
      c.py = cy;
      c.sd(h ? h == 1 ? 2 : 0 : v == 1 ? 1 : 3);
      c.sp = c.big ? 38 : (c.mo ? 55 : 42) + random() * 28;
      c.setTint(pickOf(TINTS));
      c.body.reset(cx, cy);
      return;
    }
  }

  var touch = { l: false, r: false, u: false, d: false, b: false, h: false };
  var BIND = { l: "L", r: "R", u: "U", d: "D", b: "1", h: "2" };
  var read = () => {
    const c = {};
    for (const k2 in BIND) c[k2] = touch[k2] || !!on2(BIND[k2]);
    return c;
  };

  var dist = (a, b) => hypot(wx(a.x - b.x), a.y - b.y);
  var MAX_PAX = 6;
  var SKIDS = 400;
  var DAY = 80;
  var BLEND = 6;
  var SC = [16773320, 16740424, 659258];
  var SA2 = [0.07, 0.2, 0.52];
  var mix = (a, b, f) => {
    let r = 0;
    for (let s = 0; s < 24; s += 8) r |= round((a >> s & 255) * (1 - f) + (b >> s & 255) * f) << s;
    return r;
  };
  var GameScene = class extends Phaser.Scene {
    constructor() {
      super("game");
    }
    create() {
      Object.assign(this, {
        sc: 0,
        tl: D().time,
        fr: 0,
        co: 1,
        rd: null,
        tg: 0,
        ar: null,
        el: 0,
        ct: -9,
        ht: -9,
        dr: 0,
        st: -9,
        he: 0,
        sl: 0,
        wd: 0,
        cs: [],
        px: [],
        bs: [],
        sh: [],
        bi: 0
      });
      for (const x of [-WORLD, 0, WORLD]) this.add.image(x, 0, "city").setOrigin(0);
      const ph = this.physics;
      ph.world.setBounds(0, 0, WORLD, WORLD, false, false);
      const st2 = ph.add.staticGroup();
      const z = (x, y, w, h) => {
        for (const o of [0, WORLD, -WORLD])
          if (!o || (o > 0 ? x < 64 : x + w > WORLD - 64)) st2.add(this.add.zone(x + o + w / 2, y + h / 2, w, h));
      };
      for (const r of city.solid) z(r.x, r.y, r.w, r.h);
      for (const [x, y] of city.trees) z(x - 3.5, y - 3.5, 7, 7);
      this.sk = this.add.blitter(0, 0, "skid").setDepth(1).setAlpha(0.3);
      this.rg = this.add.graphics().setDepth(2);
      const tx = this.tx = new Taxi(this, START.x, START.y, data.veh), hit = () => this.hi();
      tx.a = START.a;
      ph.add.collider(tx, st2, hit);
      ph.add.collider(tx, this.cs, hit);
      this.fx = this.add.particles(0, 0, "puff", {
        lifespan: 500,
        speed: { min: 10, max: 50 },
        scale: { start: 1, end: 0 },
        alpha: { start: 0.8, end: 0 },
        emitting: false
      }).setDepth(6);
      this.sy = this.add.rectangle(-8, -8, W + 16, H + 16).setOrigin(0).setScrollFactor(0).setDepth(7);
      this.lt = this.add.graphics().setDepth(7.5).setBlendMode(1);
      this.dc = random() * 3 * DAY;
      this.dy(0);
      (this.cm = this.cameras.main).setBounds(-WORLD, 0, 3 * WORLD, WORLD).startFollow(tx, true, 0.15, 0.15);
      this.hd = this.scene.get("hud");
      this.scene.launch("hud");
      music(true);
      this.events.once("shutdown", () => engine(-1));
    }
    /** Posición del taxi en pantalla (para el globo de diálogo). */
    tp() {
      const c = this.cm;
      return [this.tx.x - c.scrollX, this.tx.y - c.scrollY];
    }
    /** El pasajero dice una frase de `a` (acorde al vehículo); sin `force` respeta una pausa para no saturar. */
    sa(a, c, force = false, d) {
      if (!force && this.el - this.st < 3) return;
      this.st = this.el;
      this.hd.say(pick(a, this.tx.v.k == "moto", d), c);
      sfx.talk();
    }
    /** Estallido de `n` partículas de color `c`, por defecto sobre el taxi. */
    bm(n, c, x = this.tx.x, y = this.tx.y) {
      this.fx.particleTint = c;
      this.fx.explode(n, x, y);
    }
    /** Choque contra sólidos o tráfico. */
    hi() {
      if (this.tx.ls < 50 || this.el - this.ct < 0.6) return;
      this.ct = this.el;
      this.he++;
      if (this.rd) this.sa(qCrash, RED);
      sfx.crash();
      this.cm.shake(100, 4e-3);
      this.bm(8, GRY);
      if (this.co > 1) this.hd.pop("COMBO PERDIDO", RED);
      this.co = 1;
    }
    /** Propina en combo. */
    ti(v, s) {
      const t = max(1, round(v * this.co * D().pay));
      this.sc += t;
      this.hd.pop(`${s} $${t}${this.co > 1 ? " X" + this.co : ""}`, ORG);
      this.co++;
      sfx.tip();
    }
    /** Envuelve el taxi a [0, WORLD) y mueve cámara y todo lo dinámico lo mismo para que nada salte. */
    sf(S) {
      this.tx.x += S;
      this.cm.scrollX += S;
      for (const c of this.cs) c.x += S, c.px += S;
      for (const p of this.px) p.s.x += S, p.k.x += S;
      for (const b of this.bs) b.x += S;
      this.fx.forEachAlive((p) => p.x += S, 0);
    }
    update(_, ms) {
      const dt = min(ms, 50) / 1e3, tx = this.tx;
      if (tx.x < 0 || tx.x >= WORLD) this.sf(tx.x < 0 ? WORLD : -WORLD);
      this.el += dt;
      const prev = ceil(this.tl);
      this.tl -= dt;
      if (this.tl <= 0) return this.ov();
      if (this.tl < 10 && ceil(this.tl) < prev) sfx.tick();
      const ctl = read();
      tx.drive(ctl, dt);
      if (ctl.h && this.el - this.ht > 0.4) this.hn();
      engine(tx.ls / tx.v.m);
      this.tf();
      this.pa(dt);
      this.ch(dt);
      if (tx.df) {
        this.dr += dt;
        const cx = cos(tx.a), sy = sin(tx.a), r = tx.v.r;
        for (const o of r > 4 ? [-3, 3] : [0]) this.mk(tx.x - cx * r - sy * o, tx.y - sy * r + cx * o);
        if (random() < 0.25) {
          sfx.drift();
          this.bm(1, WHT, tx.x - cx * 6, tx.y - sy * 6);
        }
      } else if (this.dr > 0) {
        if (this.dr > 0.5 && this.rd) {
          this.ti(1 + floor(this.dr * 3), "DERRAPE LOCO");
          this.sa(qDrift, PNK);
        }
        this.dr = 0;
      }
      const fo = this.cm.followOffset, v = tx.body.velocity;
      fo.x += (-v.x * 0.35 - fo.x) * 0.05;
      fo.y += (-v.y * 0.3 - fo.y) * 0.05;
      this.dy(dt);
      this.sd();
    }
    /** Sombra suave desplazada abajo-derecha (luz arriba-izquierda); los pasajeros solo a sus pies. */
    sd() {
      const sh = this.sh, o = [this.tx, ...this.cs, ...this.px.map((p) => p.s)];
      o.forEach((g, i) => {
        const s = sh[i] || (sh[i] = this.add.image(0, 0, "shd").setDepth(1.5)), p = i > this.cs.length;
        s.setPosition(g.x + 2, g.y + (p ? 4 : 2)).setRotation(g.rotation).setDisplaySize(g.width + 3, p ? 4 : g.height + 3).setVisible(true);
      });
      for (let i = o.length; i < sh.length; i++) sh[i].setVisible(false);
    }
    /** Avanza el ciclo del dia, tiñe el filtro y de noche dibuja faros, luces del trafico y halos de pasajeros. */
    dy(dt) {
      const dc = this.dc = (this.dc + dt) % (3 * DAY), p = floor(dc / DAY), n = (p + 1) % 3;
      const f = clamp((dc % DAY - DAY + BLEND) / BLEND, 0, 1), a = this.nt = (p > 1 ? 1 - f : 0) + (n > 1 ? f : 0);
      this.ph = f > 0.5 ? n : p;
      this.sy.setFillStyle(mix(SC[p], SC[n], f), SA2[p] + (SA2[n] - SA2[p]) * f);
      this.rg.setDepth(a > 0.5 ? 8 : 2);
      const g = this.lt.clear(), tx = this.tx;
      if (a < 0.02) return;
      const cx = cos(tx.rotation), sy = sin(tx.rotation), x = tx.x + cx * tx.width / 2, y = tx.y + sy * tx.width / 2;
      g.fillStyle(16773296, 0.1 * a).fillCircle(tx.x, tx.y, 11);
      for (const [l, w, o] of [[60, 24, 0.1], [42, 15, 0.12], [26, 8, 0.14]])
        g.fillStyle(16773296, o * a).fillTriangle(x, y, x + cx * l - sy * w, y + sy * l + cx * w, x + cx * l + sy * w, y + sy * l - cx * w);
      for (const c of this.cs) {
        if (dist(c, tx) > 260) continue;
        const h = c.width / 2 + 2, ex = c.x + cos(c.rotation) * h, ey = c.y + sin(c.rotation) * h;
        g.fillStyle(16769152, 0.18 * a).fillCircle(ex, ey, 6).fillStyle(16769152, 0.35 * a).fillCircle(ex, ey, 2);
      }
      for (const { s } of this.px) g.fillStyle(16774352, 0.13 * a).fillCircle(s.x, s.y, 10).fillCircle(s.x, s.y, 6);
    }
    /** Quejas por manejar muy loco o muy lento con pasajero a bordo. */
    ch(dt) {
      const tx = this.tx, r = !!this.rd;
      this.he = max(0, this.he - dt * 0.2);
      this.wd = r && tx.ls > tx.v.m * 0.85 && (tx.df || this.he > 1.5) ? this.wd + dt : max(0, this.wd - dt);
      this.sl = r && tx.ls < 30 ? this.sl + dt : 0;
      if (this.wd > 1) {
        this.wd = 0;
        this.sa(qWild, PNK);
      } else if (this.sl > 4) {
        this.sl = 0;
        this.sa(qSlow, YEL);
      }
    }
    /** Corneta: los autos cercanos se apuran y abren paso un rato. */
    hn() {
      const tx = this.tx, t = txt(this, tx.x, tx.y - 18, "PIIII!", 1, YEL).setDepth(8);
      this.ht = this.el;
      sfx.horn();
      this.tweens.add({ targets: t, y: t.y - 12, alpha: 0, duration: 600, onComplete: () => t.destroy() });
      for (const c of this.cs) if (dist(c, tx) < 90) c.honk(this.el, tx);
    }
    /** Marca de derrape (reutiliza la más vieja al llegar a SKIDS). */
    mk(x, y) {
      if (this.bs.length < SKIDS) this.bs.push(this.sk.create(x - 1, y - 1));
      else {
        const b = this.bs[this.bi++ % SKIDS];
        b.x = x - 1;
        b.y = y - 1;
      }
    }
    /** Tráfico: suma autos con el tiempo, los mueve, recicla los lejanos y premia los casi choques. */
    tf() {
      const tx = this.tx, cs = this.cs, [c0, c1] = D().cr, r = this.rd, el = this.el;
      if (cs.length < min(c1, c0 + floor(el / 8))) {
        const k2 = random(), c = new Car(this, k2 < 0.15 ? 1 : k2 < 0.4 ? 2 : 0);
        placeCar(c, tx.x, tx.y);
        cs.push(c);
      }
      for (const c of cs) {
        c.tick(tx, cs, el);
        const d = dist(c, tx);
        if (d > 600) placeCar(c, tx.x, tx.y);
        else if (r && d < 20 && d > 11 && tx.ls > 75 && el > c.nm && el - this.ct > 1) {
          c.nm = el + 3;
          this.ti(3, "CASI CHOQUE");
          this.sa(qNear, ORG);
        }
      }
    }
    /** Nuevo pasajero en la calle, lejos del taxi, con destino a más de 250 px. */
    sp() {
      const tx = this.tx;
      for (let t = 0; t < 20; t++) {
        const [sx, y] = randomSpot(), q = { x: tx.x + wx(sx - tx.x), y }, x = q.x, d = dist(q, tx);
        if (d < 120 || d > 550) continue;
        const m = pickOf(city.marks.filter((m2) => dist(m2, q) > 250)), md2 = dist(m, q);
        const c = md2 < 550 ? RED : md2 < 900 ? YEL : GRN;
        const v = rint(NPAX);
        this.px.push({
          s: this.add.image(x, y, `p${v}_0`).setDepth(3),
          k: this.add.image(x, y - 10, "mk").setTint(c).setDepth(8),
          m,
          c,
          d: md2,
          v
        });
        return;
      }
    }
    /** Pasajeros: animación, abordaje, viaje en curso, entrega y flecha guía. */
    pa(dt) {
      const tx = this.tx, pax = this.px, rg = this.rg.clear(), el = this.el, wave = floor(el * 3) % 2;
      for (let i = pax.length; i < MAX_PAX; i++) this.sp();
      let near = null, nd = 1e9;
      for (let i = pax.length; i--; ) {
        const p = pax[i], d = dist(p.s, tx);
        p.s.setTexture(`p${p.v}_${wave}`);
        p.k.y = p.s.y - 10 + sin(el * 6) * 1.5;
        if (!this.rd && d < 22 && tx.ls < 45) this.bd(p, i);
        else if (d > 650) {
          p.s.destroy();
          p.k.destroy();
          pax.splice(i, 1);
        } else if (d < nd) {
          nd = d;
          near = p;
        }
      }
      for (const { s } of pax) {
        const k2 = (el * 1.2 + s.x * 0.01) % 1;
        rg.lineStyle(1, WHT, 0.9 * (1 - k2)).strokeCircle(s.x, s.y + 3, 3 + k2 * 9);
      }
      let target = near && near.s, col = WHT;
      const r = this.rd;
      if (r) {
        r.l -= dt;
        target = r.m;
        col = r.c;
        const rr = 10 + sin(el * 8) * 3, mx = tx.x + wx(r.m.x - tx.x);
        rg.lineStyle(2, r.c).strokeCircle(mx, r.m.y, rr).lineStyle(1, WHT, 0.6).strokeCircle(mx, r.m.y, rr + 6);
        if (dist(r.m, tx) < 26 && tx.ls < 55) this.dq();
        else if (r.l <= 0) {
          this.rd = null;
          this.hd.pop("MUY LENTO! SE BAJO", RED);
          this.sa(qBye, RED, true);
          sfx.miss();
        }
      }
      this.ar = null;
      if (target) {
        const an = atan2(target.y - tx.y, wx(target.x - tx.x));
        this.tg = dist(target, tx);
        if (this.tg > 40) this.ar = [an, round(an / (PI / 8)) * (PI / 8), col];
      }
    }
    /** Sube el pasajero `p` (índice `i`) y arranca el viaje. */
    bd(p, i) {
      const tx = this.tx;
      this.px.splice(i, 1);
      p.k.destroy();
      this.tweens.add({ targets: p.s, x: tx.x, y: tx.y, duration: 200, onComplete: () => p.s.destroy() });
      const d = D(), t = (p.d / 62 + 6) * max(d.mn, d.sl - this.fr * d.dk);
      this.rd = { m: p.m, l: t, t, c: p.c, d: p.d };
      this.tl += d.pk;
      this.co = 1;
      sfx.pick();
      this.hd.bn(`+${d.pk}`, GRN);
      this.sa(qHi, p.c, true, p.m.n);
    }
    /** Entrega: pago y bono según qué tan rápido llegó. */
    dq() {
      const r = this.rd, q = r.l / r.t, i = q > 0.5 ? 0 : q > 0.25 ? 1 : 2, d = D(), bt = d.dp[i], col = [GRN, YEL, RED][i];
      const pay = round((10 + round(r.d / 10)) * [2, 1.5, 1][i] * d.pay);
      this.sc += pay;
      this.tl += bt;
      this.fr++;
      this.rd = null;
      sfx.cash();
      this.hd.bn(`+${bt}`, col);
      this.hd.pop(["RAPIDO!", "NORMAL", "LENTO"][i], col);
      this.sa([qFast, qOk, qLate][i], col, true);
      this.hd.bn(`+$${pay}`, YEL, false);
      this.bm(14, YEL);
    }
    /** Fin de partida. */
    ov() {
      this.tl = 0;
      engine(-1);
      music(false);
      sfx.over();
      this.scene.pause();
      this.scene.stop("hud");
      this.scene.launch("over", { score: this.sc, fares: this.fr });
    }
  };

  var FEED = H - 17;
  var MM = 56;
  var sec = (t) => max(0, ceil(t));
  var HudScene = class extends Phaser.Scene {
    constructor() {
      super("hud");
    }
    create() {
      this.g = this.scene.get("game");
      this.pp = [];
      this.add.rectangle(0, 0, W, 34, 0, 0.55).setOrigin(0);
      this.add.rectangle(0, H - 15, W, 15, 0, 0.45).setOrigin(0);
      txt(this, 6, 4, "DINERO", 1, BLU, 0);
      this.sc = txt(this, 6, 13, "", 2, WHT, 0);
      this.cb = txt(this, 6, H - 12, "", 1, YEL, 0);
      txt(this, W / 2, 3, "TIEMPO", 1, BLU);
      this.tm = txt(this, W / 2, 12, "", 3, YEL);
      this.dp = this.add.image(W / 2 + 30, 24, "d0").setOrigin(0);
      txt(this, W - 6, 4, "VIAJES", 1, BLU, 1);
      this.hi = txt(this, W - 6, 13, "", 2, WHT, 1);
      this.to = txt(this, W / 2, 40, "", 1, WHT);
      this.bar = this.add.rectangle(W / 2, 51, 0, 3, GRN);
      this.ds = txt(this, W / 2, H - 12, "", 1, WHT);
      this.bg = this.add.graphics();
      this.bt = txt(this, 0, -14, "", 1);
      this.bb = this.add.container(0, 0, [this.bg, this.bt]).setVisible(false).setDepth(4);
      this.bl = 0;
      this.by = -1;
      const tog = () => this.pa();
      const quit = () => {
        if (!this.scene.isPaused("game")) return;
        music(false);
        this.scene.stop("game");
        this.scene.start("menu");
      };
      this.pz = this.add.container(0, 0, [
        this.add.rectangle(0, 0, W, H, 0, 0.6).setOrigin(0),
        txt(this, W / 2, 80, "PAUSA", 4, YEL),
        txt(this, W / 2, 130, "START  CONTINUAR", 1).setInteractive().on("pointerdown", tog),
        txt(this, W / 2, 146, "BOTON 2  SALIR", 1).setInteractive().on("pointerdown", quit)
      ]).setVisible(false).setDepth(10);
      press(this, (a) => {
        const p = this.scene.isPaused("game");
        if (a == "S" || p && a == "A") tog();
        else if (p && a == "B") quit();
        else if (a == "M") {
          setMuted(!muted);
          data.mute = muted;
          save();
        }
      });
      const tc = this.sys.game.device.input.touch;
      if (tc) this.pd(tog);
      this.mn(tc);
      const aw = this.add.graphics().setDepth(9).setAlpha(0.7);
      this.events.on("prerender", () => {
        const a = this.g.ar, [x, y] = this.g.tp();
        aw.clear();
        if (!a) return;
        const c = cos(a[0]), s = sin(a[0]), r = 20 + sin(this.g.el * 8) * 1.5;
        const P3 = (o) => [[13, 0], [1, -9], [1, -4], [-9, -4], [-9, 4], [1, 4], [1, 9]].map(([u, v]) => new Phaser.Math.Vector2(x + c * r + (c * u - s * v) * 0.5 + o, y + s * r + (s * u + c * v) * 0.5 + o * 2));
        aw.fillStyle(0, 0.45).fillPoints(P3(1), true).fillStyle(a[2]).fillPoints(P3(0), true).lineStyle(2, 853782).strokePoints(P3(0), true).fillStyle(16777215, 0.85).fillCircle(x + c * (r + 3) - s, y + s * (r + 3) + c, 1);
      });
      this.events.once("shutdown", () => {
        this.events.off("prerender");
        for (const k2 in touch) touch[k2] = false;
      });
    }
    /** Minimapa translúcido abajo a la derecha (en táctil, sobre los botones). */
    mn(tc) {
      if (!this.textures.exists("mini")) {
        const c = this.textures.createCanvas("mini", MM, MM);
        c.context.drawImage(this.textures.get("city").getSourceImage(), 0, 0, WORLD, WORLD, 0, 0, MM, MM);
        c.refresh();
      }
      const x = this.mx = W - MM - 4, y = this.my = tc ? 76 : H - MM - 4;
      this.mi = this.add.image(x, y, "mini").setOrigin(0).setDepth(3);
      this.add.rectangle(x, y, MM, MM).setOrigin(0).setStrokeStyle(1, LAV, 0.5).setDepth(3);
      this.mm = this.add.graphics().setDepth(3);
    }
    pa() {
      if (this.scene.isPaused("game")) {
        this.scene.resume("game");
        this.pz.setVisible(false);
      } else {
        this.scene.pause("game");
        engine(-1);
        this.pz.setVisible(true);
      }
    }
    pd(tog) {
      this.input.addPointer(3);
      const pad = (x, y, h, label, k2) => {
        const r = this.add.rectangle(x, y, 48, h, 16777215, 0.12).setStrokeStyle(1, 16777215, 0.4).setInteractive();
        txt(this, x, y - 4, label, 1).setAlpha(0.8);
        const set = (v) => {
          touch[k2] = v;
          r.setFillStyle(16777215, v ? 0.35 : 0.12);
        };
        r.on("pointerdown", () => set(true)).on("pointerup", () => set(false)).on("pointerout", () => set(false)).on("pointerover", (p) => p.isDown && set(true));
      };
      pad(30, 210, 50, "<", "l");
      pad(82, 210, 50, ">", "r");
      pad(238, 210, 50, "FRENO", "d");
      pad(290, 210, 50, "ACEL", "u");
      pad(290, 158, 44, "DERRAPE", "b");
      pad(238, 158, 44, "PITO", "h");
      txt(this, W - 6, 40, "II", 2, WHT, 1).setInteractive().on("pointerdown", tog);
    }
    /** Bono que sube y se desvanece junto al reloj (t = true) o junto al dinero. */
    bn(s, c, t = true) {
      const b = txt(this, t ? W / 2 + 30 : 10 + this.sc.width, 14, s, 1, c, 0).setDepth(5);
      this.tweens.add({ targets: b, y: 6, alpha: 0, delay: 1400, duration: 500, onComplete: () => b.destroy() });
    }
    /** Aviso de texto simple (sin recuadro) en el feed inferior; dura ~1.8 s y se desvanece. */
    pop(s, c, big = false) {
      const t = txt(this, 0, 0, s, big ? 2 : 1, c), h = t.height + 4;
      const k2 = this.add.container(W / 2, FEED - h, [t]).setDepth(5).setSize(1, h);
      this.pp.push(k2);
      if (this.pp.length > 3) {
        const o = this.pp.shift();
        this.tweens.killTweensOf(o);
        o.destroy();
      }
      this.tweens.add({
        targets: k2,
        alpha: 0,
        delay: 1800,
        duration: 400,
        onComplete: () => {
          this.pp = this.pp.filter((o) => o !== k2);
          k2.destroy();
        }
      });
    }
    /** Frase del pasajero en un globo sobre el taxi (~2.8 s); si choca con los popups va debajo. */
    say(s, c) {
      const q = CH.includes('"') ? '"' : "'", w = s.length * 6 + 14, h = this.hw = w / 2;
      this.bt.setText(q + s + q).setTint(c);
      this.bg.clear().fillStyle(0, 0.85).fillRect(-h, -17, w, 13).lineStyle(1, c).strokeRect(-h, -17, w, 13).fillStyle(c).fillTriangle(-3, -4, 3, -4, 0, 0);
      this.bl = 2.8;
      this.by = -1;
      this.tweens.killTweensOf(this.bb);
      this.bb.setVisible(true).setScale(0.6);
      this.tweens.add({ targets: this.bb, scale: 1, duration: 120, ease: "Back.Out" });
    }
    update(_, ms) {
      const g = this.g, r = g.rd, k2 = MM / WORLD, m = this.mm.clear(), at = (x, y, c, s, a = 1) => m.fillStyle(c, a).fillRect(this.mx + (x % WORLD + WORLD) % WORLD * k2 - s / 2, this.my + y * k2 - s / 2, s, s);
      if (!r) for (const p of g.px) at(p.s.x, p.s.y, WHT, 2, 0.8);
      else at(r.m.x, r.m.y, r.c, 4);
      if (g.tx) at(g.tx.x, g.tx.y, floor(g.el * 4) % 2 ? WHT : LAV, 3);
      let y0 = FEED;
      for (let i = this.pp.length; i--; ) {
        const k3 = this.pp[i];
        y0 -= k3.height + 2;
        k3.y += (y0 - k3.y) * 0.25;
      }
      const bb = this.bb;
      if (this.bl > 0) {
        if (!g.cm.shakeEffect.isRunning) {
          const [x, y] = g.tp(), hw = this.hw, dn = y - 26 < 58, ty = dn ? y + 9 : y - 9, f = this.by < 0 ? 1 : 0.3;
          this.bg.scaleY = dn ? -1 : 1;
          this.bt.y = dn ? 7 : -14;
          bb.x += (clamp(x, hw + 2, W - hw - 2) - bb.x) * f;
          bb.y += (clamp(ty, 40, H - 40) - bb.y) * f;
          this.by = 1;
        }
        if ((this.bl -= ms / 1e3) <= 0) bb.setVisible(false);
      }
      const low = g.tl < 10, d = round(g.tg / 8);
      this.sc.setText(`$${g.sc}`);
      this.cb.setText(g.co > 1 && r ? `COMBO X${g.co}` : "");
      this.ds.setX(this.cb.text ? W / 2 + 30 : W / 2);
      this.tm.setText(`${sec(g.tl)}`).setTint(low && floor(g.tl * 4) % 2 ? RED : YEL);
      this.hi.setText(`${g.fr}`);
      this.dp.setTexture("d" + g.ph);
      this.mi.setAlpha(0.55 - 0.25 * g.nt);
      if (r) {
        this.to.setText(`A ${r.m.n}  ${sec(r.l)}`).setTint(r.c);
        this.bar.setSize(max(0, 90 * r.l / r.t), 3).setFillStyle(r.c);
        this.ds.setText(`DESTINO ${d}M`).setTint(WHT);
      } else {
        this.to.setText("BUSCA UN PASAJERO!").setTint(WHT);
        this.bar.setSize(0, 3);
        this.ds.setText(g.tg ? `PASAJERO ${d}M` : "").setTint(GRY);
      }
    }
  };

  var GameOverScene = class extends Phaser.Scene {
    constructor() {
      super("over");
    }
    create(d) {
      this.add.rectangle(0, 0, W, 240, 0, 0.65).setOrigin(0);
      const t = txt(this, W / 2, 60, "SE ACABO", 4, RED);
      txt(this, W / 2, 96, "EL TIEMPO!", 3, RED);
      yoyo(this, t, 300, { alpha: 0.3 });
      txt(this, W / 2, 136, `VIAJES  ${d.fares}`, 1, WHT);
      txt(this, W / 2, 150, `$${d.score}`, 3, YEL);
      const hl2 = qualifies(d.score) ? addScore(data.name || "ANONIMO", d.score) : -1;
      if (hl2 >= 0) yoyo(this, txt(this, W / 2, 182, "NUEVO RECORD!", 2, GRN), 250, { alpha: 0.3 });
      leave(this, 4e3, 1200, () => {
        this.scene.stop("game");
        this.scene.start("scores", { hl: hl2 });
      });
    }
  };

  var ROWS = ["ABCDEFGHIJ", "KLMNOPQRST", "UVWXYZ.-!?", "0123456789"];
  var MAXLEN = 8;
  var NameEntryScene = class extends Phaser.Scene {
    constructor() {
      super("name");
    }
    create() {
      Object.assign(this, { nm: data.name.slice(0, MAXLEN), cx: data.name ? 1 : 0, cy: data.name ? 4 : 0 });
      yoyo(this, txt(this, W / 2, 16, "INGRESA TU NOMBRE", 2, YEL), 400, { alpha: 0.4 });
      this.t = txt(this, W / 2, 52, "", 2, WHT);
      this.f = this.add.rectangle(0, 0, 14, 13).setStrokeStyle(1, YEL);
      const at = (x, y) => () => {
        this.cx = x;
        this.cy = y;
        this.pk();
      };
      this.c = ROWS.map((r, y) => [...r].map((ch, x) => tap(txt(this, 70 + x * 20, 94 + y * 16, ch), at(x, y))));
      this.c.push(["BORRAR", "OK"].map((s, x) => tap(txt(this, 110 + x * 100, 166, s), at(x, 4))));
      txt(this, W / 2, 196, "PALANCA + BOTON 1 = LETRA", 1, GRY);
      txt(this, W / 2, 210, "BOTON 2 = BORRAR   START = OK", 1, BLU);
      press(this, (a) => this.ky(a));
      this.rf();
    }
    /** START = OK, botón 1 = elegir celda, botón 2 = borrar (con el nombre vacío vuelve al menú), palanca = mover. */
    ky(a) {
      if (a == "S") return this.fn();
      if (a == "A") return this.pk();
      if (a == "B") return this.nm ? this.dl() : this.scene.start("menu");
      const n = () => this.c[this.cy].length;
      if (a == "L") this.cx = (this.cx + n() - 1) % n();
      else if (a == "R") this.cx = (this.cx + 1) % n();
      else if (a == "U" || a == "D") {
        const ny = (this.cy + (a == "U" ? 4 : 1)) % 5;
        if (ny == 4) this.cx = this.cx < 5 ? 0 : 1;
        else if (this.cy == 4) this.cx = this.cx ? 7 : 2;
        this.cy = ny;
      } else return;
      sfx.sel();
      this.rf();
    }
    ad(ch) {
      if (this.nm.length < MAXLEN) this.nm += ch;
      sfx.sel();
      this.rf();
    }
    dl() {
      this.nm = this.nm.slice(0, -1);
      sfx.sel();
      this.rf();
    }
    pk() {
      if (this.cy < 4) this.ad(ROWS[this.cy][this.cx]);
      else if (this.cx == 0) this.dl();
      else this.fn();
    }
    fn() {
      sfx.ok();
      data.name = this.nm;
      save();
      this.scene.start("diff");
    }
    rf() {
      this.t.setText((this.nm + "________").slice(0, MAXLEN));
      this.c.forEach((r, y) => r.forEach((c2, x) => c2.setTint(x == this.cx && y == this.cy ? YEL : WHT)));
      const c = this.c[this.cy][this.cx];
      this.f.setPosition(c.x, c.y + 4).setSize(c.width + 6, 14);
    }
  };

  var COLS = [GRN, YEL, RED];
  var TRAF = ["BAJO", "MEDIO", "ALTO"];
  var DiffScene = class extends Phaser.Scene {
    constructor() {
      super("diff");
      this.b = [];
      this.n = [];
    }
    create() {
      this.s = diff.i;
      txt(this, W / 2, 10, "DIFICULTAD", 2, YEL);
      txt(this, W / 2, 30, `CHOFER  ${data.name || "ANONIMO"}`, 1, BLU);
      DIFFS.forEach((d, i) => {
        const y = 50 + i * 48;
        this.b[i] = tap(this.add.rectangle(W / 2, y + 18, 250, 42), () => {
          this.s = i;
          this.go();
        });
        this.n[i] = txt(this, W / 2, y + 4, d.n, 2, COLS[i]);
        txt(this, W / 2, y + 24, `TIEMPO ${d.time}S  TRAFICO ${TRAF[i]}  $ X${d.pay}`, 1, WHT);
      });
      txt(this, W / 2, 210, "PALANCA + BOTON 1   BOTON 2 = VOLVER", 1, GRY);
      nav(this, "name", () => this.go(), (a) => {
        const d = ud(a, 3);
        if (!d) return;
        this.s = (this.s + d) % 3;
        sfx.sel();
        this.rf();
      });
      this.rf();
    }
    go() {
      sfx.ok();
      diff.i = data.diff = this.s;
      save();
      this.scene.start("veh");
    }
    rf() {
      this.b.forEach((b, i) => b.setStrokeStyle(1, i == this.s ? YEL : GRY, i == this.s ? 1 : 0.4));
    }
    update(t) {
      this.n.forEach((n, i) => n.setAlpha(i != this.s ? 1 : fl(t)));
    }
  };

  var COLS2 = [YEL, ORG, PNK, BLU, GRN];
  var ScoresScene = class extends Phaser.Scene {
    constructor() {
      super("scores");
    }
    create(d) {
      txt(this, W / 2, 10, "MEJORES PUNTAJES", 2, YEL);
      data.scores.forEach((s, i) => {
        const y = 40 + i * 15, c = i === d.hl ? WHT : COLS2[i % 5];
        const row2 = [
          txt(this, 76, y, `${i + 1}.`, 1, c, 1),
          txt(this, 86, y, s.n, 1, c, 0),
          txt(this, 244, y, `$${s.s}`, 1, c, 1)
        ];
        if (i === d.hl) yoyo(this, row2, 200, { alpha: 0.2 });
      });
      yoyo(this, txt(this, W / 2, 210, "PRESIONA UN BOTON", 1, BLU), 500, { alpha: 0 });
      leave(this, 12e3, 600, () => this.scene.start("menu"));
    }
  };

  var CARRO = "001>832002>8352005820900<820413;75<7138755515:76=636957:=11>32:=51>72:01113280511728";
  var MOTO2 = "0103330910<330212:34251383552146351904:456;13<34:11323484027151432745131563856069175636947531863:2618739<41:53;=";
  var MODELS = [CARRO, MOTO2];
  var VN = 16;
  var VF = 24;
  var shade = (i, k2) => {
    const n = parseInt(PAL[i].slice(1), 16);
    return `rgb(${[16, 8, 0].map((b) => min(255, (n >> b & 255) * k2) | 0)})`;
  };
  function vox(s, key, m) {
    if (s.textures.exists(key)) return;
    const g = new Int8Array(4096).fill(-1);
    const at = (x, y, z) => (x | y | z) >>> 4 ? -1 : g[x | y << 4 | z << 8];
    let mx = 0, my = 0;
    for (let i = 0; i < m.length; i += 7) {
      const [a, b, c, d, e, f, k2] = [...m.slice(i, i + 7)].map((ch) => ch.charCodeAt(0) - 48);
      for (let x = a; x < d; x++) for (let y = b; y < e; y++) for (let z = c; z < f; z++) g[x | y << 4 | z << 8] = k2;
      mx = max(mx, d);
      my = max(my, e);
    }
    const t = s.textures.createCanvas(key, VF * VN, VF), cx = t.context;
    for (let f = 0; f < VN; f++) {
      const an = f * PI * 2 / VN, co = cos(an), si = sin(an), P3 = [];
      for (let i = 0; i < 4096; i++) {
        const k2 = g[i];
        if (k2 < 0) continue;
        const x = i & 15, y = i >> 4 & 15, z = i >> 8, X = x + 0.5 - mx / 2, Y = y + 0.5 - my / 2;
        const rx = X * co - Y * si, ry = X * si + Y * co;
        let b = 0.55;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          if (at(x + dx, y + dy, z) < 0) b = max(b, 0.75 + 0.3 * (dx * si + dy * co) - 0.15 * (dx * co - dy * si));
        }
        P3.push([
          ry * 0.87 + z * 0.5,
          round(f * VF + VF / 2 - 1 + rx),
          round(16 + ry / 2 - z),
          at(x, y, z + 1) < 0 ? shade(k2, 1.3) : "",
          shade(k2, b)
        ]);
      }
      P3.sort((p, q) => p[0] - q[0]);
      for (const [, px, py, top, side] of P3) {
        cx.fillStyle = side;
        cx.fillRect(px, py, 2, 2);
        if (top) {
          cx.fillStyle = top;
          cx.fillRect(px, py, 2, 1);
        }
      }
      t.add(f, 0, f * VF, 0, VF, VF);
    }
    t.refresh();
  }

  var INFO = [
    { n: "CARRO", st: [3, 3, 5], d: "COMODO Y SEGURO" },
    { n: "MOTTO", st: [4, 5, 2], d: "ZIGZAG ENTRE LA COLA" }
  ];
  var STATS = ["VELOCIDAD", "MANEJO", "AGARRE"];
  var VehicleScene = class extends Phaser.Scene {
    constructor() {
      super("veh");
      this.b = [];
      this.m = [];
      this.n = [];
    }
    create() {
      this.s = data.veh;
      txt(this, W / 2, 10, "VEHICULO", 2, YEL);
      const bars = this.add.graphics();
      INFO.forEach((v, i) => {
        const x = 80 + i * 160;
        vox(this, "vx" + i, MODELS[i]);
        this.b[i] = tap(this.add.rectangle(x, 120, 152, 170), () => {
          this.s = i;
          this.go();
        });
        this.add.ellipse(x, 98, 54, 14, 0, 0.35);
        this.m[i] = this.add.image(x, 80, "vx" + i, 2).setScale(3);
        this.n[i] = txt(this, x, 122, v.n, 2, LAV);
        v.st.forEach((n, j) => {
          const y = 145 + j * 12;
          txt(this, x - 68, y, STATS[j], 1, GRY, 0);
          for (let k2 = 0; k2 < 5; k2++) bars.fillStyle(k2 < n ? PUR : 3021391).fillRect(x + 4 + k2 * 13, y, 11, 6);
        });
        txt(this, x, 186, v.d, 1, WHT);
      });
      txt(this, W / 2, 216, "PALANCA + BOTON 1   BOTON 2 = VOLVER", 1, GRY);
      nav(this, "diff", () => this.go(), (a) => {
        if (a != "L" && a != "R") return;
        this.s ^= 1;
        sfx.sel();
      });
    }
    go() {
      sfx.ok();
      data.veh = this.s;
      save();
      this.scene.start("game");
    }
    update(t) {
      this.b.forEach((b, i) => {
        const on3 = i == this.s;
        b.setStrokeStyle(1, on3 ? YEL : GRY, on3 ? 1 : 0.4);
        this.m[i].setFrame((t / (on3 ? 90 : 260) + i * 5 | 0) % VN).setAlpha(on3 ? 1 : 0.45).setY(80 - (on3 ? abs(sin(t / 200)) * 3 : 0));
        this.n[i].setTint(on3 ? YEL : LAV).setAlpha(on3 ? fl(t) : 1);
      });
    }
  };

  for (const e of ["pointerdown", "keydown", "touchend"]) addEventListener(e, initAudio);
  var game = new Phaser.Game({
    parent: "game-root",
    width: W,
    height: H,
    pixelArt: true,
    audio: { noAudio: true },
    physics: { default: "arcade" },
    scale: { mode: 3, autoCenter: 1 },
    scene: [BootScene, MenuScene, GameScene, HudScene, GameOverScene, NameEntryScene, DiffScene, VehicleScene, ScoresScene]
  });
  game.events.on("step", musicTick);
  if (false) Object.assign(window, { game });
})();

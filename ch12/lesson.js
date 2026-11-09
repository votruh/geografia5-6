'use strict';

const ink = '#183833';
const muted = '#4e685e';
const pine = '#166951';
const red = '#aa412c';
const gold = '#e0a350';
const blue = '#146478';
const paper = '#fffaf0';
const outline = '#b8c7a7';
const dialNames = ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ'];
const stations = [
  { x: 205, y: 465, name: 'Развилка', to: 'к развилке', kind: 'start' },
  { x: 445, y: 465, name: 'Мост', to: 'к мосту', kind: 'bridge' },
  { x: 445, y: 225, name: 'Сосна', to: 'к сосне', kind: 'tree' },
  { x: 605, y: 65, name: 'Башня', to: 'к башне', kind: 'tower' },
];
const routeTasks = [[0, 1], [1, 2], [2, 3], [3, 2]];
const sideCard = { x: 975, y: 186, w: 550, cls: 'side', maxH: 602 };
const compassCard = { x: 858, y: 186, w: 668, cls: 'side', maxH: 602 };

function geoText(parent, value, x, y, options = {}) {
  return T(parent, value, { x, y, fill: ink, size: 30, ...options });
}

function geoLine(parent, d, color, width, attrs = {}) {
  return path(parent, d, { fill: 'none', stroke: color, 'stroke-width': width,
    'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...attrs });
}

function geoRect(parent, x, y, width, height, fill, stroke = 'none', rx = 0) {
  return mk('rect', { x, y, width, height, rx, fill, stroke, 'stroke-width': 2 }, parent);
}

function geoCircle(parent, x, y, r, fill, stroke = 'none', width = 2) {
  return mk('circle', { cx: x, cy: y, r, fill, stroke, 'stroke-width': width }, parent);
}

function geoLabel(parent, value, x, y, color = muted) {
  const el = geoText(parent, value, x, y, { size: 21, weight: 750, fill: color });
  el.setAttribute('letter-spacing', '2');
  return el;
}

function geoHeading(label, title) {
  const p = panel(0);
  geoLabel(p, label, 69, 63, red);
  geoText(p, title, 66, 132, { size: 59, weight: 650, font: 'Georgia, serif' });
  geoLine(p, 'M70 156H1530', outline, 1.5);
  return p;
}

function geoNote(parent, number, title, lines, x, y, t0 = 0) {
  const g = G(parent, { o: 0, y: 11 });
  geoCircle(g, x + 25, y - 9, 24, '#e4ecdb', outline, 1.5);
  geoText(g, number, x + 25, y - 2, { anchor: 'middle', size: 19, weight: 800, fill: pine });
  geoText(g, title, x + 68, y, { size: 33, weight: 720 });
  lines.forEach((line, index) => geoText(g, line, x + 68, y + 46 + index * 36, { size: 27, fill: muted }));
  tw(g, { o: 1, y: 0 }, t0, .42, out);
  return g;
}

function dialPoint(angle, radius) {
  const radians = angle * Math.PI / 180;
  return [Math.sin(radians) * radius, -Math.cos(radians) * radius];
}

function drawDial(parent, x, y, { azimuth = 0, rimAngle = 0, magnetic = false, showCorners = true } = {}) {
  const dial = G(parent, { x, y });
  geoCircle(dial, 0, 0, 246, '#e4e9d6', outline, 2);
  geoCircle(dial, 0, 0, 207, '#f8f5e8', '#a6b699', 2);
  const rim = G(dial, { r: rimAngle });
  const corners = G(rim, { o: +showCorners });
  for (let angle = 0; angle < 360; angle += 5) {
    const major = angle % 45 === 0;
    const a = dialPoint(angle, major ? 175 : 186);
    const b = dialPoint(angle, 198);
    geoLine(rim, 'M' + a.join(' ') + 'L' + b.join(' '), major ? pine : outline, major ? 3 : 1.5);
  }
  dialNames.forEach((name, index) => {
    const main = index % 2 === 0;
    const [tx, ty] = dialPoint(index * 45, 223);
    geoText(main ? rim : corners, name, tx, ty + 8, {
      size: main ? 29 : 21, anchor: 'middle', weight: 800, fill: index ? pine : red,
    });
    if (!magnetic && main) {
      const [nx, ny] = dialPoint(index * 45, 151);
      geoText(rim, (index * 45) + '°', nx, ny + 7, { size: 23, anchor: 'middle', fill: muted });
    }
  });
  const needle = G(dial);
  const arc = geoLine(dial, 'M0 0', red, 8);
  const marker = G(dial);
  if (magnetic) {
    path(needle, 'M0-142L-24 0L0 12L24 0Z', { fill: red });
    path(needle, 'M0 142L-24 0L0-12L24 0Z', { fill: blue });
    geoCircle(needle, 0, 0, 10, paper, ink, 3);
  } else {
    geoLine(dial, 'M0 0V-132', pine, 4, { 'stroke-dasharray': '7 9' });
    geoLine(marker, 'M0 0V-126M-12-112L0-126L12-112', red, 6);
    geoCircle(dial, 0, 0, 7, ink);
  }
  const value = geoText(dial, '', 0, 299, { size: 45, weight: 760, anchor: 'middle', fill: red });
  const update = (angle) => {
    if (magnetic) {
      put(rim, { r: angle });
      value.textContent = angle ? 'Корпус повёрнут' : 'Шкала совмещена';
      return;
    }
    const [ex, ey] = dialPoint(angle, 95);
    arc.setAttribute('d', angle ? `M0 -95 A95 95 0 ${+(angle > 180)} 1 ${ex} ${ey}` : 'M0 -95');
    put(marker, { r: angle });
    value.textContent = Math.round(angle) + '°';
  };
  update(magnetic ? rimAngle : azimuth);
  return { dial, corners, needle, update };
}

function geoSymbol(parent, kind, x, y) {
  const icon = G(parent, { x, y });
  if (kind === 'bridge') {
    geoRect(icon, -19, -16, 38, 32, '#e8cc9c', '#694e37', 3);
    geoLine(icon, 'M-10-15V15M0-15V15M10-15V15', '#836749', 2);
  } else if (kind === 'tree') {
    geoRect(icon, -3, 2, 6, 17, '#694e37');
    path(icon, 'M0-23L-19 8H19Z M0-12L-22 15H22Z', { fill: pine });
  } else if (kind === 'tower') {
    geoRect(icon, -16, -16, 32, 36, '#d17a55', '#794534', 2);
    path(icon, 'M-22-14L0-31L22-14Z', { fill: '#794534' });
    geoRect(icon, -4, -9, 8, 11, paper, 'none', 1);
  } else {
    geoCircle(icon, 0, 0, 13, paper, pine, 4);
    geoCircle(icon, 0, 0, 4, pine);
  }
  return icon;
}

function drawGeoMap(parent) {
  const map = G(parent, { x: 69, y: 184 });
  geoRect(map, 0, 0, 868, 617, '#e9edd6', outline, 13);
  let gridPath = '';
  for (let x = 42; x < 868; x += 56) gridPath += `M${x} 1V616`;
  for (let y = 37; y < 617; y += 56) gridPath += `M1 ${y}H867`;
  geoLine(map, gridPath, '#d5dec1', 1);
  path(map, 'M2 112Q148 17 251 99T414 173Q364 233 258 246T2 360Z', { fill: '#d7e4bd' });
  path(map, 'M866 267Q745 244 670 327T657 479L866 508Z', { fill: '#d7e4bd' });
  const contours = [
    'M5 121Q120 33 239 93T402 171Q357 217 250 230T5 344',
    'M6 147Q128 59 232 120T371 173Q335 200 240 207T6 313',
    'M8 176Q139 92 228 143T335 174Q302 182 224 186T8 276',
    'M865 282Q742 258 674 336T661 468L864 497',
    'M865 310Q756 278 697 346T692 453L866 476',
    'M865 340Q775 310 725 363T724 436L866 455',
  ];
  contours.forEach(d => geoLine(map, d, '#a7bf8c', 1.8));
  const creek = 'M1 556C132 545 174 566 288 544S392 511 445 511C556 510 607 589 728 550Q792 528 867 538';
  geoLine(map, creek, '#72a7ac', 49, { 'stroke-linecap': 'butt' });
  geoLine(map, creek, '#a6cfd0', 41, { 'stroke-linecap': 'butt' });
  geoLine(map, creek, '#c5e0db', 2, { 'stroke-dasharray': '5 17' });
  geoText(map, 'Ручей', 697, 554, { size: 22, fill: '#275963', weight: 680 });
  const trails = 'M93 503L205 465H445V225L605 65L736 145M110 398L205 465M445 465V593M445 225H214L137 297';
  geoLine(map, trails, '#7b8c66', 9);
  geoLine(map, trails, '#fff5d9', 5);
  geoRect(map, 426, 478, 38, 62, '#d8bd89', '#846c4d', 4);
  for (let y = 488; y < 539; y += 10) geoLine(map, `M427 ${y}H463`, '#977b55', 1.5);
  const routeInk = G(map);
  const marks = G(map);
  stations.forEach(({ x, y, name, kind }) => {
    geoCircle(marks, x, y, 24, paper, '#9cac89', 2);
    geoSymbol(marks, kind, x, y);
    geoText(marks, name, x + 33, y + (kind === 'start' ? -19 : 8), { size: 25, weight: 730 });
  });
  const rose = G(map, { x: 797, y: 114 });
  geoCircle(rose, 0, 0, 41, paper, outline);
  path(rose, 'M0-28L-9 10L0 5L9 10Z', { fill: red });
  geoText(rose, 'С', 0, -48, { anchor: 'middle', size: 27, weight: 800, fill: red });
  const scale = G(map);
  geoLine(scale, 'M62 104V91H182V104M122 91V104', ink, 2.5);
  geoRect(scale, 62, 91, 60, 9, ink);
  geoText(scale, '0', 60, 78, { size: 18, weight: 650 });
  geoText(scale, '100 м', 182, 78, { size: 18, anchor: 'end', weight: 650 });
  return { map, routeInk, rose, scale };
}

function routeArrow(parent, from, to, color = red) {
  const a = stations[from];
  const b = stations[to];
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  const vx = (b.x - a.x) / length;
  const vy = (b.y - a.y) / length;
  const x = b.x - vx * 33;
  const y = b.y - vy * 33;
  const d = `M${a.x + vx * 30} ${a.y + vy * 30}L${x} ${y}
    M${x - vx * 15 - vy * 10} ${y - vy * 15 + vx * 10}L${x} ${y}L${x - vx * 15 + vy * 10} ${y - vy * 15 - vx * 10}`;
  return geoLine(parent, d, color, 6);
}

function bearing(from, to) {
  const a = stations[from];
  const b = stations[to];
  return (Math.round(Math.atan2(b.x - a.x, a.y - b.y) * 180 / Math.PI) + 360) % 360;
}

function practiceDial(update, initial, target, { step, max, label, format, why, hint }) {
  return (body, api) => {
    const slider = h('input', 'geo-slider');
    Object.assign(slider, { type: 'range', min: '0', max: String(max), step: String(step), value: String(initial) });
    slider.setAttribute('aria-label', label);
    const readout = h('output', 'geo-readout');
    const redraw = () => {
      const angle = Number(slider.value);
      update(angle);
      readout.textContent = format(angle);
      slider.setAttribute('aria-valuetext', format(angle));
    };
    const check = () => {
      const ok = Number(slider.value) === target;
      api.grade(ok, ok ? why : hint);
    };
    slider.oninput = redraw;
    slider.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        check();
      }
    });
    body.append(h('div', 'geo-control', [readout, slider]));
    redraw();
    return {
      check,
      reveal() {
        slider.value = String(target);
        redraw();
        return why;
      },
      lock() { slider.disabled = true; },
    };
  };
}

function geoCompassQuiz(done) {
  quiz(compassCard, [{
    id: 'c-align', prompt: ['Поверни корпус компаса так, чтобы буква «С» оказалась под красным концом стрелки.'],
    build: practiceDial(S.geoDial.update, 90, 0, {
      step: 15, max: 345, label: 'Угол поворота корпуса компаса',
      format: angle => 'Поворот шкалы · ' + angle + '°',
      why: ' Шкала ориентирована. Теперь по ней можно определить остальные стороны горизонта.',
      hint: ' Красный конец неподвижен. Передвинь отметку «С» к нему.',
    }),
  }], done, 'Практика · 1 из 3');
}

function geoAzimuthQuiz(done) {
  quiz(compassCard, [{
    id: 'c-aim', prompt: ['Наведи указатель на наблюдательный пункт на юго-востоке. Какой азимут получится?'],
    build: practiceDial(S.geoDial.update, 0, 135, {
      step: 5, max: 355, label: 'Азимут указателя',
      format: angle => 'Азимут · ' + angle + '°',
      why: ' 135° лежит посередине между востоком (90°) и югом (180°).',
      hint: ' Юго-восток находится между востоком и югом. Начни отсчёт с севера.',
    }),
  }], done, 'Практика · 2 из 3');
}

function routeQuiz(done) {
  const options = [45, 90, 0, 225];
  const questions = routeTasks.map(([from, to], index) => {
    const correct = bearing(from, to);
    const why = [
      ' От развилки к мосту идём на восток, по азимуту 90°.',
      ' Сосна прямо к северу от моста. Её азимут от моста — 0°.',
      ' От сосны к башне идём на северо-восток, по азимуту 45°.',
      ' Обратный азимут отличается на 180°. От башни к сосне идём на юго-запад, по азимуту 225°.',
    ][index];
    return {
      id: 'p-route-' + index,
      prompt: [`${stations[from].name} → ${stations[to].name}. По какому азимуту идти ${stations[to].to}?`],
      build(body, api) {
        const layer = qlayer();
        const history = G(layer, { x: 69, y: 184 });
        routeTasks.slice(0, index).forEach(([a, b]) => routeArrow(history, a, b, '#6c8d70'));
        const origin = stations[from];
        geoCircle(history, origin.x, origin.y, 29, 'none', red, 4);
        const showLeg = () => {
          routeArrow(history, from, to, red);
          const end = stations[to];
          const walker = G(history, { x: origin.x, y: origin.y });
          geoCircle(walker, 0, 0, 10, red, paper, 3);
          fx(walker, { x: end.x, y: end.y }, 0, .72, soft);
          fx(walker, { o: 0 }, .7, .15, out);
          const ring = G(history, { x: end.x, y: end.y, s: .75, o: 0 });
          geoCircle(ring, 0, 0, 30, 'none', red, 4);
          fx(ring, { s: 1, o: 1 }, .64, .35, out);
        };
        return choice(options.map(angle => [angle + '°']), options.indexOf(correct), why,
          options.map(angle => angle === correct ? null : ' Проверь направление от выделенной точки. Север здесь вверху.'), showLeg)(body, api);
      },
    };
  });
  quiz(sideCard, questions, done, 'Практика · 3 из 3');
}

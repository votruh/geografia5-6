'use strict';

const seaInk = '#183833';
const seaMuted = '#49655e';
const seaRed = '#aa412c';
const seaGreen = '#1c6552';
const seaBlue = '#236779';
const seaGold = '#916121';
const seaPaper = '#fffaf0';
const seaLine = '#b8c8b1';
const mapFrame = { x: 68, y: 186, w: 886, h: 571 };
const seaCard = { x: 986, y: 187, w: 545, cls: 'side', maxH: 580 };
const seaWorld = [-180, 180, -76, 84];
const seaAustralia = [104, 188, -53, 2];
const seaNorth = [-170, 190, 47, 86];

function seaText(parent, str, x, y, opts = {}) {
  return T(parent, str, { x, y, fill: seaInk, size: 28, ...opts });
}

function seaRect(parent, x, y, width, height, fill, stroke = 'none', rx = 0) {
  return mk('rect', { x, y, width, height, rx, fill, stroke, 'stroke-width': 2 }, parent);
}

function seaCircle(parent, cx, cy, r, fill, stroke = 'none', width = 2) {
  return mk('circle', { cx, cy, r, fill, stroke, 'stroke-width': width }, parent);
}

function seaStroke(parent, d, color, width, attrs = {}) {
  return path(parent, d, { fill: 'none', stroke: color, 'stroke-width': width,
    'stroke-linejoin': 'round', 'stroke-linecap': 'round', ...attrs });
}

function seaHeading(section, title) {
  const p = panel(0);
  const kicker = seaText(p, section, 69, 65, { size: 21, weight: 760, fill: seaRed });
  kicker.setAttribute('letter-spacing', '2.2');
  seaText(p, title, 65, 134, { size: 57, weight: 650, font: 'Georgia, serif' });
  seaStroke(p, 'M69 158H1531', seaLine, 1.5);
  return p;
}

function seaNote(p, year, title, lines, y, at, color = seaGreen) {
  const note = G(p, { o: 0, y: 9 });
  const kicker = seaText(note, year, 993, y, { size: 21, weight: 780, fill: color });
  kicker.setAttribute('letter-spacing', '1.5');
  seaText(note, title, 991, y + 40, { size: 33, weight: 740 });
  lines.forEach((line, i) => seaText(note, line, 992, y + 77 + i * 33, { size: 26, fill: seaMuted }));
  tw(note, { o: 1, y: 0 }, at, .48, out);
  return note;
}

function seaMap(parent, bounds, caption, frame = mapFrame) {
  const [west, east, south, north] = bounds;
  const { x, y, w, h } = frame;
  const sx = w / (east - west);
  const sy = h / (north - south);
  const at = ([lon, lat]) => [(lon - west) * sx, (north - lat) * sy];
  const area = mk('svg', { x, y, width: w, height: h, viewBox: `0 0 ${w} ${h}`,
    overflow: 'hidden', role: 'img', 'aria-label': caption }, parent);
  const defs = mk('defs', {}, area);
  const clipId = 'sea-map-' + parent.querySelectorAll('clipPath').length + '-' + caption.length;
  const clip = mk('clipPath', { id: clipId }, defs);
  seaRect(clip, 0, 0, w, h, '#fff', 'none', 13);
  const canvas = mk('g', { 'clip-path': `url(#${clipId})` }, area);
  seaRect(canvas, 0, 0, w, h, '#deece8');
  const lonStep = east - west > 160 ? 30 : 10;
  const latStep = north - south > 110 ? 30 : 10;
  let grid = '';
  for (let lon = Math.ceil(west / lonStep) * lonStep; lon < east; lon += lonStep) {
    const [u] = at([lon, north]);
    grid += `M${u.toFixed(2)} 0V${h}`;
  }
  for (let lat = Math.ceil(south / latStep) * latStep; lat < north; lat += latStep) {
    const [, v] = at([west, lat]);
    grid += `M0 ${v.toFixed(2)}H${w}`;
  }
  seaStroke(canvas, grid, '#bdd7d0', 1);
  mk('path', { d: EXPLORERS_WORLD.land(west, east, south, north),
    transform: `matrix(${sx} 0 0 ${sy} ${-west * sx} ${north * sy})`,
    fill: '#e8ecd2', 'fill-rule': 'evenodd', stroke: '#8fab9a', 'stroke-width': 1.35,
    'stroke-linejoin': 'round', 'vector-effect': 'non-scaling-stroke' }, canvas);
  seaRect(area, 1, 1, w - 2, h - 2, 'none', seaLine, 13);
  seaText(parent, caption, x + 1, y + h + 32, { size: 19, fill: seaMuted, weight: 560 });
  return { canvas, at, w, h };
}

function seaLabel(map, str, coords, { dx = 12, dy = -12, at = 0, color = seaInk, anchor = 'start', size = 22 } = {}) {
  const [x, y] = map.at(coords);
  const node = seaText(map.canvas, str, x + dx, y + dy, { size, fill: color, anchor, weight: 740, o: at ? 0 : 1 });
  node.setAttribute('paint-order', 'stroke fill');
  node.setAttribute('stroke', '#f4f5e7');
  node.setAttribute('stroke-width', '4');
  node.setAttribute('stroke-linejoin', 'round');
  if (at) show(node, at, .38);
  return node;
}

function seaPin(map, label, coords, options = {}) {
  const [x, y] = map.at(coords);
  const color = options.color || seaRed;
  const marker = G(map.canvas, { x, y, o: options.at ? 0 : 1 });
  seaCircle(marker, 0, 0, 10, seaPaper, color, 3);
  seaCircle(marker, 0, 0, 3.8, color);
  if (options.at) show(marker, options.at, .38);
  if (label) seaLabel(map, label, coords, { ...options, color });
  return { marker, box: [mapFrame.x + x - 23, mapFrame.y + y - 23, 46, 46] };
}

function seaRoute(map, points, at, dur, color = seaRed) {
  const d = points.map((point, index) => (index ? 'L' : 'M') + map.at(point).map(v => v.toFixed(1)).join(' ')).join('');
  const line = path(map.canvas, d, { fill: 'none', stroke: color, 'stroke-width': 4.6,
    'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, { d: 0 });
  draw(line, at, dur, soft);
  const ship = G(map.canvas, { o: 0 });
  seaCircle(ship, 0, 0, 8, color, seaPaper, 2.5);
  const length = line.getTotalLength();
  show(ship, at, .22);
  prog(f => {
    const point = line.getPointAtLength(f * length);
    put(ship, { x: point.x, y: point.y });
  }, at, dur, soft);
  hide(ship, at + dur, .24);
}

function seaIntro(question, lens) {
  const p = seaHeading('ПОЛЕВОЙ АТЛАС  /  § 05', 'Географические открытия XVII–XX вв.');
  const map = seaMap(p, seaWorld, 'Карта мира · места, к которым вернёмся в уроке');
  const highlights = [
    ['Новая Земля', [65, 75], 12, 26], ['Чимборасо', [-78.8, -1.5], -130, -15],
    ['Замбези', [25.9, -17.9], 14, 22], ['Австралия', [136, -26], -104, 25],
    ['Антарктида', [3, -69], 14, 6],
  ];
  highlights.forEach(([label, coords, dx, dy], i) => seaPin(map, label, coords, { at: question + i * .48, dx, dy }));
  seaNote(p, 'ВОПРОС УРОКА', 'Зачем отправлялись в путь?', ['Найти морской путь, изучить', 'природу или проверить догадку.'], 255, question);
  seaNote(p, 'ВАЖНОЕ РАЗЛИЧИЕ', 'Для кого это было новым?', ['У местных жителей уже были', 'свои названия, знания и маршруты.'], 493, lens, seaRed);
}

function seaDrake(route, passage, trade) {
  const p = seaHeading('01  /  МОРСКИЕ ПУТИ', 'Френсис Дрейк огибает Землю');
  const map = seaMap(p, seaWorld, 'Плавание Дрейка · линия показывает общее направление');
  seaRoute(map, [[-4,50],[-14,33],[-21,10],[-37,-14],[-49,-38],[-68.3,-52.5],[-71.2,-53.8],[-73.1,-53.6],[-74.7,-52.7],[-76,-52.7],[-86,-22],[-103,11],[-132,36],[-180,16]], route, 5.8);
  seaRoute(map, [[180,16],[158,9],[128,2],[119,-8],[106,-14],[77,-27],[46,-34],[23,-36],[9,-30],[-10,-10],[-26,12],[-29,32],[-4,50]], route + 5.8, 5.1);
  seaPin(map, 'Англия', [-4,50], { at: route, dx: 10, dy: -11 });
  seaPin(map, 'Магелланов пролив', [-70,-53], { at: route + 2.4, dx: -14, dy: -16, anchor: 'end', size: 19 });
  seaPin(map, 'Пролив Дрейка', [-64,-60], { at: passage, dx: 12, dy: 24, color: seaBlue, size: 20 });
  seaNote(p, '1577–1580', 'Кругосветное плавание', ['Атлантика → Тихий океан →', 'Индийский океан → Англия.'], 225, route);
  seaNote(p, 'ДВА ПРОЛИВА', 'Магелланов пролив', ['Через него Дрейк вышел в Тихий океан.', 'Пролив Дрейка лежит южнее.'], 407, passage, seaBlue);
  seaNote(p, 'МОТИВ', 'Борьба за торговлю', ['Дрейк нападал на испанские суда.', 'Плавание принесло и новые карты.'], 588, trade, seaRed);
}

function seaAtlases(ortelius, mercator, distort) {
  const p = seaHeading('02  /  КАРТОГРАФИЯ', 'Ортелий и Меркатор');
  const stage = G(p, { x: 68, y: 189 });
  seaRect(stage, 0, 0, 884, 568, '#e5e9d3', seaLine, 13);
  const spread = G(stage, { o: 0 });
  seaRect(spread, 38, 61, 310, 405, seaPaper, '#9daa90', 7);
  seaRect(spread, 66, 89, 255, 162, '#dce9e1', seaLine, 4);
  for (let x = 99; x < 321; x += 36) seaStroke(spread, `M${x} 90V250`, '#bfd4c8', 1.4);
  for (let y = 121; y < 251; y += 32) seaStroke(spread, `M67 ${y}H320`, '#bfd4c8', 1.4);
  path(spread, 'M88 147l39-29 51 9 14 29-27 39-32 16-17-25-30-12zM215 130l28-17 37 18 25 40-23 31-41-4-19-32z',
    { fill: '#adbd8f', stroke: '#789176', 'stroke-width': 2 });
  seaText(spread, 'АТЛАС', 85, 303, { size: 32, weight: 780 });
  seaText(spread, 'Карты разных земель', 85, 348, { size: 23, fill: seaMuted });
  seaText(spread, 'в одной книге', 85, 381, { size: 23, fill: seaMuted });
  seaStroke(spread, 'M85 411H290M85 434H262', '#bec9ae', 2);
  show(spread, ortelius, .48);
  const chart = G(stage, { o: 0 });
  seaRect(chart, 383, 62, 457, 406, '#dceae4', '#97afa4', 7);
  const mercY = lat => 273 - 103 * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
  for (const lat of [-55, -35, -15, 5, 25, 45, 65]) {
    seaStroke(chart, `M414 ${mercY(lat)}H812`, '#a1bdb3', 2);
  }
  for (let x = 423; x < 812; x += 60) seaStroke(chart, `M${x} 108V425`, '#a1bdb3', 2);
  seaStroke(chart, 'M465 365L774 172', seaRed, 5);
  seaCircle(chart, 465, 365, 7, seaPaper, seaRed, 3);
  seaCircle(chart, 774, 172, 7, seaPaper, seaRed, 3);
  show(chart, mercator, .45);
  const compare = G(chart, { o: 0 });
  seaRect(compare, 603, mercY(65), 60, mercY(45) - mercY(65), '#dbad56', seaGold, 3);
  seaRect(compare, 603, mercY(5), 60, mercY(-15) - mercY(5), '#dbad56', seaGold, 3);
  show(compare, distort, .55);
  seaText(stage, 'Упрощённая схема двух идей', 40, 525, { size: 21, fill: seaMuted });
  seaNote(p, '1570', 'Абрахам Ортелий', ['Собрал карты разных земель', 'в одном издании.'], 225, ortelius);
  seaNote(p, '1569', 'Герард Меркатор', ['Линия постоянного курса', 'в этой проекции прямая.'], 410, mercator);
  seaNote(p, 'ПРОЕКЦИЯ', 'Цена удобной карты', ['Чем ближе к полюсу, тем больше', 'кажется площадь.'], 590, distort, seaGold);
}

function seaBarents(north, winter, name) {
  const p = seaHeading('03  /  СЕВЕРНЫЕ МОРЯ', 'Виллем Баренц ищет путь в Азию');
  const map = seaMap(p, [-12, 86, 49, 84], 'Север Европы и Новая Земля · схема последней экспедиции');
  seaRoute(map, [[4,52],[2,57],[7,65],[18,72],[18,75],[15,78],[30,77],[53,77],[67,77],[69,76.2]], north, 5, seaBlue);
  seaPin(map, 'Амстердам', [4,52], { at: north, dx: 12, dy: -14, color: seaBlue, size: 20 });
  seaPin(map, 'Зимовка', [68,76.2], { at: winter, dx: -12, dy: -18, anchor: 'end' });
  seaLabel(map, 'Новая Земля', [66,72], { at: winter, dx: -14, dy: 18, anchor: 'end', size: 22 });
  seaLabel(map, 'Баренцево море', [32,72], { at: name, dx: -18, dy: -4, anchor: 'middle', color: seaBlue, size: 23 });
  seaNote(p, '1594–1597', 'Три северные экспедиции', ['Короткий путь из Европы', 'в Азию искали во льдах.'], 226, north, seaBlue);
  seaNote(p, '1596–1597', 'Зима на Новой Земле', ['Лёд зажал судно. Команда', 'построила укрытие на берегу.'], 416, winter);
  seaNote(p, 'ИМЯ НА КАРТЕ', 'Баренцево море', ['Лежит к северу от Европы,', 'к западу от Новой Земли.'], 592, name, seaBlue);
}

function seaTasman(people, janszoon, tasman) {
  const p = seaHeading('04  /  ЮЖНЫЕ ЗЕМЛИ', 'Кто нанёс Австралию на карту?');
  const map = seaMap(p, seaAustralia, 'Австралия, Тасмания и Новая Зеландия · направления плаваний показаны схематично');
  seaLabel(map, 'АВСТРАЛИЯ', [132,-28], { at: people, anchor: 'middle', size: 28 });
  seaRoute(map, [[126,-4],[134,-5],[137,-8],[138,-12],[141,-12.5]], janszoon, 2.5, seaGold);
  seaPin(map, 'Кейп-Йорк', [141,-12.5], { at: janszoon, dx: 14, dy: 21, color: seaGold });
  seaRoute(map, [[105,-40],[129,-44],[147.5,-43],[159,-45],[166.1,-45],[169.4,-42],[172.8,-40.3],[172.7,-34.4],[182,-29],[185,-21],[179,-17]], tasman, 4.2);
  seaPin(map, 'Тасмания', [147.5,-43], { at: tasman + 1.1, dx: -16, dy: 30, anchor: 'end' });
  seaPin(map, 'Новая Зеландия', [172.8,-40.7], { at: tasman + 2.2, dx: 17, dy: 41, anchor: 'middle', size: 20 });
  seaPin(map, 'Тонга', [185,-21], { at: tasman + 3.4, dx: -11, dy: -12, anchor: 'end', size: 20 });
  seaPin(map, 'Фиджи', [179,-17], { at: tasman + 4, dx: -12, dy: -8, anchor: 'end', size: 20 });
  seaNote(p, 'ЗАДОЛГО ДО ЭКСПЕДИЦИЙ', 'Коренные народы Австралии', ['Жили на материке уже', 'десятки тысяч лет.'], 226, people);
  seaNote(p, '1606', 'Виллем Янсзон', ['Нанёс на европейскую карту', 'часть северного побережья.'], 406, janszoon, seaGold);
  seaNote(p, '1642–1644', 'Абель Тасман', ['Тасмания, Новая Зеландия,', 'Тонга и Фиджи.'], 591, tasman, seaRed);
}

function seaCook(mapTime, botany, claim) {
  const p = seaHeading('05  /  ЮЖНЫЕ ЗЕМЛИ', 'Джеймс Кук и восточный берег');
  const map = seaMap(p, [117, 187, -53, -2], 'Первое плавание Джеймса Кука · участок от Новой Зеландии к Австралии');
  seaLabel(map, 'Австралия', [134,-25], { size: 26 });
  seaRoute(map, [[177,-37],[179,-41],[174,-45],[169,-48],[165,-47],[165,-43],[169,-40],[172,-38],[174,-35],[172,-34],[164,-35],[151,-38],[152,-34],[154,-29],[154,-25],[151,-21],[147,-18],[146.1,-16],[145.8,-14],[144.6,-12],[143.5,-11],[142.5,-10.3]], mapTime, 5.5);
  seaPin(map, 'Новая Зеландия', [173,-41], { at: mapTime, dx: 5, dy: 65, anchor: 'middle' });
  seaPin(map, 'Ботанический залив', [151.2,-34.0], { at: botany, dx: -16, dy: 30, anchor: 'end', size: 21 });
  seaPin(map, 'Кейп-Йорк', [142.5,-10.7], { at: claim, dx: 17, dy: -14, size: 21 });
  seaNote(p, '1768–1771', 'Первое из трёх плаваний', ['Кук составил карты берегов', 'Новой Зеландии и Австралии.'], 226, mapTime);
  seaNote(p, '1770', 'Ботанический залив', ['Участники плавания описывали', 'и собирали растения.'], 409, botany, seaGold);
  seaNote(p, 'ПОСЛЕДСТВИЯ', 'Британская колонизация', ['Кук заявил права Британии.', 'Местные народы теряли земли.'], 587, claim, seaRed);
}

function seaAntarctica(ships, ice, coast) {
  const p = seaHeading('06  /  ЮЖНЫЕ ЗЕМЛИ', 'Экспедиция к Антарктиде');
  const map = seaMap(p, [-89, 66, -90, -30], 'Южная Атлантика и Антарктида · район наблюдения указан приблизительно');
  seaLabel(map, 'Южная Америка', [-67,-43], { size: 21 });
  seaLabel(map, 'Антарктида', [-28,-84], { size: 27 });
  seaRoute(map, [[-53,-36],[-44,-48],[-36,-55],[-31,-59],[-21,-64],[-12,-67],[-2,-69]], ships, 4.4, seaBlue);
  seaPin(map, 'Январь 1820', [-2,-69], { at: ice, dx: 13, dy: -18 });
  seaLabel(map, 'К Южному полюсу ↓', [18,-86], { at: coast, dx: 0, dy: 0, color: seaGreen, size: 21 });
  seaNote(p, '1819–1821', 'Беллинсгаузен и Лазарев', ['На «Востоке» и «Мирном»', 'исследовали южные воды.'], 225, ships);
  seaNote(p, 'ЯНВАРЬ 1820', 'Льды у Антарктиды', ['Одно из первых документированных', 'наблюдений у берегов материка.'], 406, ice, seaBlue);
  seaNote(p, 'ДВЕ РАЗНЫЕ ЦЕЛИ', 'Берег и полюс', ['Увидеть берег с моря и дойти', 'до полюса — разные задачи.'], 590, coast, seaRed);
}

function seaHumboldt(climb, belts, compare) {
  const p = seaHeading('07  /  ИССЛЕДОВАНИЯ НА СУШЕ', 'Гумбольдт и высотные пояса');
  const mtn = G(p, { x: 69, y: 187 });
  seaRect(mtn, 0, 0, 884, 569, '#dfebe4', seaLine, 13);
  path(mtn, 'M14 522L141 468 236 370 323 338 407 224 453 201 544 65 607 145 688 234 758 352 864 464 866 522Z',
    { fill: '#c5d4ad', stroke: '#729785', 'stroke-width': 3 });
  const snow = path(mtn, 'M453 201L544 65 607 145 648 190 583 175 548 199 500 169Z',
    { fill: '#f5f6eb', stroke: '#93b6a8', 'stroke-width': 2 });
  put(snow, { o: 0 });
  const plant = (x, y, size, alpine) => {
    const g = G(mtn, { x, y, s: size, o: 0 });
    if (alpine) seaStroke(g, 'M0 0V-20M0-2L-11-13M0-2L10-15', '#85632d', 3);
    else {
      seaStroke(g, 'M0 0V-22', '#71593b', 4);
      path(g, 'M0-41L-18-13H18Z M0-28L-21-5H21Z', { fill: seaGreen });
    }
    show(g, belts + (alpine ? 1.4 : .2), .6);
  };
  [180, 223, 263, 304, 345].forEach((x, i) => plant(x, 493 - i * 9, 1 + i * .07, false));
  [343, 373, 404, 440, 471].forEach((x, i) => plant(x, 351 - i * 13, .8, true));
  show(snow, belts + 2.8, .55);
  const climbLine = path(mtn, 'M193 477Q239 434 284 406T365 343Q414 315 433 271L509 150',
    { fill: 'none', stroke: seaRed, 'stroke-width': 4, 'stroke-linecap': 'round' }, { d: 0 });
  draw(climbLine, climb, 4.4, soft);
  const cool = seaText(mtn, 'ВЫШЕ ОБЫЧНО ХОЛОДНЕЕ ↑', 36, 56, { size: 21, weight: 780, fill: seaBlue, o: 0 });
  show(cool, compare, .4);
  seaText(mtn, 'Пояса показаны условно', 32, 551, { size: 20, fill: seaMuted });
  seaNote(p, 'ЮЖНАЯ АМЕРИКА', 'Гумбольдт и Бонплан', ['Собирали растения и сравнивали', 'наблюдения из разных мест.'], 225, climb);
  seaNote(p, 'ОТ ПОДНОЖИЯ К ВЕРШИНЕ', 'Растения сменяют друг друга', ['Внизу больше тепла, выше', 'выживают холодостойкие виды.'], 410, belts);
  seaNote(p, 'ВЫВОД', 'Высотная поясность', ['По мере подъёма меняются', 'условия и живая природа.'], 591, compare, seaRed);
}

function seaContinents(africa, asia, evidence) {
  const p = seaHeading('08  /  ИССЛЕДОВАНИЯ НА СУШЕ', 'Замбези и Центральная Азия');
  const map = seaMap(p, [-25, 124, -39, 66], 'Африка и Азия · районы исследований Ливингстона и Пржевальского');
  seaPin(map, 'Водопад на Замбези', [25.86,-17.92], { at: africa, dx: 15, dy: 27, color: seaBlue });
  seaPin(map, 'Монголия', [103,47], { at: asia, dx: -17, dy: -15, anchor: 'end' });
  seaPin(map, 'Тибетское нагорье', [92,34], { at: asia + 1, dx: -14, dy: 22, anchor: 'end', size: 21 });
  seaNote(p, '1855', 'Давид Ливингстон', ['Описал водопад Виктория.', 'Местное имя — Моси-оа-Тунья.'], 225, africa, seaBlue);
  seaNote(p, '1870–1885', 'Николай Пржевальский', ['Четыре экспедиции, съёмка', 'маршрутов и природные коллекции.'], 409, asia, seaRed);
  seaNote(p, 'КАК РАБОТАЛИ', 'Записи и образцы', ['Их можно было изучать и сравнивать', 'после возвращения.'], 590, evidence);
}

function seaPassages(east, west, ice, practice = false) {
  const p = seaHeading('09  /  АРКТИКА', practice ? 'Вспомни два арктических прохода' : 'Два пути вокруг материков');
  const map = seaMap(p, seaNorth, 'Арктика · схема путей с обобщёнными контурами берегов');
  seaLabel(map, 'СЕВЕРНАЯ АМЕРИКА', [-128,56], { dx: -50, size: 21 });
  seaLabel(map, 'ЕВРАЗИЯ', [74,54], { size: 24 });
  seaRoute(map, [[4,59],[3,62],[6,65],[10,68],[15,71],[22,72.5],[33,72.5],[47,72.5],[57,70],[61,69.8],[67,72],[75,75],[88,76.5],[102,78.2],[110,78.1],[121,76.5],[130,74.5],[143,74],[154,73.7],[165,72.3],[175,70.3],[182,70.3],[186,69],[188.3,68],[189.6,66.6]], east, 4.2, seaRed);
  seaRoute(map, [[-39,59],[-52,61],[-58,65],[-59,70.5],[-61,73.5],[-78,74],[-85,74.5],[-96.8,74.1],[-98.1,73.6],[-98.5,73.2],[-98.5,72.6],[-97.6,72],[-96.9,71.6],[-96,71.2],[-95,70.8],[-94.9,70.3],[-94.1,69.75],[-95.8,68.8],[-97.5,68.55],[-99.2,68.65],[-101.5,68.65],[-103.3,68.75],[-105,68.95],[-106.3,68.84],[-108.4,68.99],[-110.5,68.93],[-112.2,68.78],[-113.6,69],[-115.1,69.25],[-116.9,69.05],[-118.1,69.2],[-121,69.4],[-124.4,70.1],[-126,70.5],[-128,70.6],[-138,70.9],[-147,71.7],[-156.5,72],[-162,71.2],[-165,69.6],[-167.7,68.5],[-168.5,67.6],[-169.2,66.1],[-168.9,65.8]], west, 4.2, seaBlue);
  seaLabel(map, 'К Берингову проливу →', [189.6,66.6], { at: east + 4, dx: -13, dy: 37, anchor: 'end', size: 20 });
  seaPin(map, '', [-169,65.8], { at: west + 4, color: seaBlue });
  seaLabel(map, 'Берингов пролив', [-169,65.8], { at: west + 4, dx: 16, dy: 36, size: 20 });
  if (practice) return;
  seaNote(p, '1878–1879', 'Адольф Норденшельд', ['«Вега» прошла вдоль Евразии.', 'Это Северо-восточный проход.'], 226, east, seaRed);
  seaNote(p, '1903–1906', 'Руаль Амундсен', ['«Йоа» прошла через Канадскую', 'Арктику. Это Северо-западный проход.'], 407, west, seaBlue);
  seaNote(p, 'ОБЩЕЕ ПРЕПЯТСТВИЕ', 'Лёд задерживал суда', ['Вместо недель плавание', 'могло занять годы.'], 593, ice);
}

function seaPoles(peary, south, north) {
  const p = seaHeading('10  /  ПОЛЯРНЫЕ ЭКСПЕДИЦИИ', 'Северный и Южный полюса');
  const g = G(p, { x: 68, y: 187 });
  seaRect(g, 0, 0, 886, 570, '#e9ebd8', seaLine, 13);
  const polar = (x, y, land, label) => {
    const dial = G(g, { x, y });
    seaCircle(dial, 0, 0, 173, land ? '#e1e6ce' : '#bddad8', '#88aca3', 2.4);
    [48, 96, 143].forEach(r => seaCircle(dial, 0, 0, r, 'none', '#a5beb3', 1.3));
    seaStroke(dial, 'M-166 0H166M0-166V166M-117-117L117 117M117-117L-117 117', '#a5beb3', 1.4);
    seaText(dial, label, 0, 221, { anchor: 'middle', size: 27, weight: 780 });
    return dial;
  };
  const n = polar(228, 253, false, 'Север · океан');
  const s = polar(659, 253, true, 'Юг · материк');
  const claim = seaText(n, '?', 1, 30, { anchor: 'middle', size: 94, weight: 750, fill: seaBlue, o: 0 });
  show(claim, peary, .5);
  const landPin = G(s, { o: 0 });
  const icePin = G(n, { o: 0 });
  seaCircle(landPin, 0, 0, 22, seaRed, seaPaper, 4);
  seaCircle(icePin, 0, 0, 22, seaBlue, seaPaper, 4);
  show(landPin, south, .5);
  hide(claim, north, .4);
  show(icePin, north, .55);
  seaText(g, 'Схема полюсов и поверхности под ними', 31, 539, { size: 21, fill: seaMuted });
  seaNote(p, '1909 · СЕВЕР', 'Роберт Пири', ['Заявил о достижении полюса.', 'Точность координат спорна.'], 226, peary, seaBlue);
  seaNote(p, '14 ДЕКАБРЯ 1911 · ЮГ', 'Команда Амундсена', ['Первой достигла Южного', 'полюса на материке.'], 410, south, seaRed);
  seaNote(p, '1948 · СЕВЕР', 'Экспедиция «Север-2»', ['Работала на дрейфующем льду', 'и измерила глубину океана.'], 591, north, seaBlue);
}

function seaSurvey(range, measure) {
  const p = seaHeading('11  /  ТОЧНЫЕ КАРТЫ', 'Как на карту попадают горы');
  const map = seaMap(p, [121, 163, 56, 75], 'Северо-восточная Сибирь · положение горной системы схематично');
  const coords = [[131,70],[135,68],[139,66],[145,64],[150,62]];
  seaRoute(map, coords, range, 3, seaGold);
  seaLabel(map, 'Хребет Черского', [137,65.5], { at: range, dx: -15, dy: 31, size: 24, anchor: 'end' });
  seaLabel(map, 'Якутия', [128,60], { size: 24 });
  [[132,67.8],[141,68.4],[146,62.4]].forEach((pt, i) => seaPin(map, '', pt, { at: measure + .5 * i, color: seaGreen }));
  seaNote(p, '1920–1930-е ГОДЫ', 'Обручев и Салищев', ['Исследовали горную систему', 'на северо-востоке Сибири.'], 257, range, seaGold);
  seaNote(p, 'РАБОТА ТОПОГРАФА', 'От наблюдений к карте', ['По измерениям из разных точек', 'уточняют положение рек и гор.'], 486, measure);
}

function seaKontiki(raft, landing, claim) {
  const p = seaHeading('12  /  ЭКСПЕРИМЕНТ', 'Тур Хейердал и плот «Кон-Тики»');
  const map = seaMap(p, [-162,-68,-28,4], 'Перу и восточная Полинезия · направление плавания плота');
  seaLabel(map, 'ТИХИЙ ОКЕАН', [-123,-5], { dx: 0, anchor: 'middle', size: 26, color: seaBlue });
  seaRoute(map, [[-77.2,-12],[-82,-12.8],[-94,-11.1],[-106,-9.7],[-118,-10.9],[-131,-13.1],[-142.5,-16.1]], raft, 5.3, seaRed);
  seaPin(map, 'Кальяо · Перу', [-77.2,-12], { at: raft, dx: -13, dy: -20, anchor: 'end' });
  seaPin(map, 'Рароиа · Полинезия', [-142.5,-16.1], { at: landing, dx: 12, dy: 32 });
  seaNote(p, '1947', 'Бальсовый плот', ['Ветры и течения несли команду', 'на запад через Тихий океан.'], 226, raft, seaRed);
  seaNote(p, '101 ДЕНЬ', 'От Перу до Полинезии', ['Плот достиг рифа у Рароиа.', 'Океан удалось пересечь.'], 410, landing, seaGold);
  seaNote(p, 'ГРАНИЦА ВЫВОДА', 'Плавание было возможно', ['Для истории заселения островов', 'нужны другие свидетельства.'], 591, claim);
}

function seaWrap(routes, study, test) {
  const p = seaHeading('ПОЛЕВОЙ АТЛАС  /  ИТОГ', 'От маршрутов к научным вопросам');
  const map = seaMap(p, seaWorld, 'Места действия · от арктических морей до Антарктиды');
  seaPin(map, 'Арктика', [45,73], { at: routes, color: seaBlue, dx: 9, dy: 24 });
  seaPin(map, 'Австралия', [145,-25], { at: routes + .35, dx: -14, dy: 21, anchor: 'end' });
  seaPin(map, 'Южная Америка', [-76,-4], { at: study, dx: 14, dy: -10, color: seaGreen });
  seaPin(map, 'Перу', [-77,-12], { at: test, dx: -15, dy: 18, anchor: 'end' });
  seaNote(p, '01', 'Искали пути и чертили карты', ['Уточняли берега, проливы', 'и направления плаваний.'], 226, routes);
  seaNote(p, '02', 'Изучали, как устроена природа', ['Сравнивали растения, рельеф', 'и условия жизни в разных местах.'], 409, study, seaBlue);
  seaNote(p, '03', 'Проверяли догадки', ['Спроси, что именно показала', 'экспедиция и как это проверили.'], 590, test, seaRed);
}

const seaLocations = {
  drake: {
    heading: 'Найди пролив на карте',
    bounds: [-86, -44, -65, -37],
    caption: 'Южная оконечность Южной Америки · нажми на одну из точек',
    labels: [['Тихий океан', [-83,-50]], ['Атлантический океан', [-64,-42]]],
    points: [['А', [-71,-53]], ['Б', [-65,-60]], ['В', [-57,-52]]],
    right: 0,
    prompt: 'Через какой пролив Дрейк вышел в Тихий океан? Выбери точку на карте.',
    why: ' Точка А — Магелланов пролив. Он отделяет Огненную Землю от материка.',
    wrong: ['',' Точка Б южнее Огненной Земли. Это пролив Дрейка.', ' Точка В в Атлантическом океане. Ищи узкий проход рядом с сушей.'],
  },
  cook: {
    heading: 'Какой берег исследовал Кук?',
    bounds: [106, 161, -47, -8],
    caption: 'Австралия · нажми на точку у нужного побережья',
    labels: [['Австралия', [122,-25]], ['Тасмания', [145,-44]]],
    points: [['А', [113,-26]], ['Б', [140,-12]], ['В', [151.2,-34]]],
    right: 2,
    prompt: 'Выбери берег Австралии, который Кук обследовал в 1770 году.',
    why: ' Точка В на восточном берегу. Там находится Ботанический залив.',
    wrong: [' Точка А у западного берега. Кук пришёл со стороны Новой Зеландии, с востока.', ' Точка Б на севере. Первый документированный европейский визит туда связан с Янсзоном.', ''],
  },
};

function seaLocate(key) {
  const q = seaLocations[key];
  const p = seaHeading('ПОЛЕВОЙ АТЛАС  /  ПРОВЕРЬ СЕБЯ', q.heading);
  const map = seaMap(p, q.bounds, q.caption);
  q.labels.forEach(([name, coords]) => seaLabel(map, name, coords, { size: 23 }));
  S.seaTargets = q.points.map(([label, coords]) => {
    const [x, y] = map.at(coords);
    const marker = G(map.canvas, { x, y });
    seaCircle(marker, 0, 0, 23, seaPaper, seaRed, 3);
    seaText(marker, label, 0, 8, { anchor: 'middle', size: 23, fill: seaRed, weight: 800 });
    return { el: marker, label: 'Точка ' + label, box: [mapFrame.x + x - 30, mapFrame.y + y - 30, 60, 60] };
  });
}

function seaLocateQuiz(key, done) {
  const q = seaLocations[key];
  quiz(seaCard, [{
    id: 'c-' + key, prompt: [q.prompt],
    build: pickEls(S.seaTargets, q.right, q.why, i => q.wrong[i]),
  }], done, 'Найди на карте');
}

function seaQuickPassage(done) {
  quiz(seaCard, [{
    id: 'c-passage', prompt: ['Какое судно прошло вдоль северных берегов Евразии?'],
    build: choice([['«Мирный»'], ['«Вега»'], ['«Йоа»']], 1,
      ' «Вега» Норденшельда прошла Северо-восточным проходом.',
      [' «Мирный» плавал в южных водах у Антарктиды.', null, ' «Йоа» шла вдоль Северной Америки.']),
  }], done, 'Проверь себя');
}

function seaPracticeStage() {
  const p = seaHeading('ПОЛЕВОЙ АТЛАС  /  ПРАКТИКА', 'Собери картину открытий');
  const map = seaMap(p, seaWorld, 'Карта для повторения · четыре вопроса по всему уроку');
  seaLabel(map, 'АРКТИКА', [-50,72], { size: 23 });
  seaLabel(map, 'АНДЫ', [-73,-17], { dx: -12, dy: 9, anchor: 'end', size: 21 });
  seaLabel(map, 'ТИХИЙ ОКЕАН', [-156,2], { size: 24, color: seaBlue });
  seaLabel(map, 'АВСТРАЛИЯ', [117,-29], { size: 22 });
}

function seaFinalQuiz(done) {
  const questions = [
    {
      id: 'p-timeline', prompt: ['Какое из этих событий произошло раньше остальных?'],
      build: choice([['Плавание Кука'], ['«Кон-Тики»'], ['Плавание Дрейка']], 2,
        ' Дрейк вернулся в 1580 году. Кук обследовал восток Австралии в 1770-м, а «Кон-Тики» плыл в 1947-м.',
        [' Кук плавал в XVIII веке. Вспомни, кто из списка путешествовал ещё в XVI.', ' Плот пересёк океан в XX веке. Ищи событие намного раньше.', null]),
    },
    {
      id: 'p-mercator', prompt: ['Что удобно показывать прямой линией на карте Меркатора?'],
      build: choice([['Постоянный курс'], ['Длину реки'], ['Площадь материка']], 0,
        ' Если компасный курс не меняется, в проекции Меркатора линия получается прямой.',
        [null, ' Реки извиваются и на такой карте. Подумай о направлении движения судна.', ' Площади на этой карте искажаются, особенно ближе к полюсам.']),
    },
    {
      id: 'p-humboldt', prompt: ['Что помогает объяснить наблюдения Гумбольдта на горных склонах?'],
      build: choice([['Течения океанов'], ['Смену растений с высотой'], ['Движение льдов']], 1,
        ' На разных высотах условия отличаются, поэтому и растения меняются.',
        [' Речь шла о наблюдениях за растениями на суше.', null, ' Наблюдения на горе касались живой природы на разных высотах.']),
    },
    {
      id: 'p-kontiki', prompt: ['Что позволило заключить плавание «Кон-Тики»?'],
      build: choice([['Плот может пересечь океан'], ['Установлен маршрут заселения'], ['Найдена точная дата заселения']], 0,
        ' Плавание показало возможность такого перехода. Для истории заселения нужны другие данные.',
        [null, ' Современный опыт показывает возможность, а для восстановления древнего маршрута нужны отдельные свидетельства.', ' Дату древнего заселения нельзя узнать из плавания 1947 года.']),
    },
  ];
  quiz(seaCard, questions, done, 'Итоговая проверка');
}

function seaFinish() {
  finishCard();
  const refs = h('a', 'btn quiet', 'Участники и источники');
  refs.href = 'sources.html';
  document.querySelector('.finwrap .acts').append(refs);
}

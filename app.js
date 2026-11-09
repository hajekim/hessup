/* ==========================================================================
   84㎡ 아파트 인테리어 공사 내역서
   - 최초 계약 2026. 08. 18 (견적 20260818)
   - 추가·정정 2026. 11. 03 (견적 202601103, 주방 상판 2안 비교)
   - 최종 추가·정정 2026. 11. 05 (견적 202601105, 칸스톤) ← 화면의 확정 금액
   화면에 보이는 금액·건수는 전부 견적 JSON에서 계산한다. 여기에 숫자를 적지 않는다.
   ========================================================================== */

// 11/3 견적서의 두 대안. 칸스톤을 골랐고, 두 안은 변경 탭의 상판 비교·금액 이력에만 쓴다.
const COUNTERTOP_OPTIONS = {
  v4: { file: './hup_quote_2622103.json', label: '칸스톤 에덴그레이', chosen: true },
  v4m: { file: './hup_quote_2622103_marble.json', label: '인조대리석 하이막스' }
};
// 화면의 확정 금액은 11/5 최종 추가·정정 견적(칸스톤) 기준이다
const FINAL_QUOTE = { key: 'v5', file: './hup_quote_2622105.json', countertop: 'v4' };
const DEFAULT_VERSION = FINAL_QUOTE.key;
// 과거 협의안은 협의 경과 타임라인에만 쓰므로 첫 화면을 그린 뒤 받아 온다
const HISTORY_FILES = { v2: './hup_quote_202608018_v2.json', v3: './hup_quote_202608018_v3.json' };
const SITE_CONTENT_FILE = './site_content.json';
const WORK_DATA_FILE = './work_data.json';
// 로컬 작업본에만 있는 확장 스크립트. 배포 서버에는 없으므로 404가 정상이다.
const LOCAL_EXTENSION_FILE = './private/local.js';
const VAT_RATE = 0.1;
const COUNTERTOP_ITEMS = ['2-h-12', '2-h-08', '2-h-09'];
const TABS = ['items', 'changes', 'schedule', 'specs'];
const isWorkMode = () => document.body?.dataset?.mode === 'work';

const state = {
  version: DEFAULT_VERSION,
  tab: 'items',
  room: null,
  trade: null,
  q: '',
  quotes: {},      // 버전 키 -> 견적 JSON
  content: {},     // site_content.json
  renderedTabs: new Set()
};

const $ = id => document.getElementById(id);

/* ==================== 1. 포맷 · 분류 ==================== */
function fmtKRW(num) {
  if (num === null || num === undefined || Number.isNaN(Number(num))) return '-';
  return Number(num).toLocaleString('ko-KR') + '원';
}

function fmtSignedKRW(num) {
  const n = Number(num) || 0;
  return (n > 0 ? '+' : '') + fmtKRW(n);
}

// 요약 문구용 축약 표기 (135000 -> '13.5만')
function fmtManwon(num) {
  const rounded = Math.round((Number(num) || 0) / 1000) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}만`;
}

// 속성값은 항상 큰따옴표로 감싸므로 작은따옴표는 이스케이프하지 않는다
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const tradeCode = it => `${it.section_code}-${it.category_code}`;
const isCommon = it => (it.rooms || []).includes('전체');
const itemCost = it => it.price?.total_cost || 0;
const sumCost = list => list.reduce((acc, it) => acc + itemCost(it), 0);
const isActiveWorkItem = it => it.customer_supplied || (it.change_status !== 'cancelled' && it.change_status !== 'deleted_partial_deduction');
const activeItems = data => (isWorkMode() ? data.items.filter(isActiveWorkItem) : data.items);

// 품목 옆 배지. 0원 추가·업그레이드도 데이터 분류대로 '추가'·'변경'으로만 적는다.
function changeBadge(it) {
  if (isWorkMode() && it.customer_supplied) return { text: '고객지급', cls: 'b-add' };
  const cs = it.change_status || 'normal';
  if (cs === 'added' || cs === 'service_added') return { text: '추가', cls: 'b-add' };
  if (cs === 'cancelled') return { text: '취소', cls: 'b-cut' };
  if (cs === 'deleted_partial_deduction') return { text: isWorkMode() ? '제외' : '감액', cls: 'b-cut' };
  if (cs === 'modified' || cs === 'service_upgraded') return { text: '변경', cls: 'b-mod' };
  return null;
}

/* ==================== 2. 원가계산서 읽기 ==================== */
// v1~v3(pure_construction_cost 중첩)과 v4(평탄화)의 원가계산서 구조가 다르다.
// 화면과 검산 스크립트가 같은 값을 보도록 하나의 형태로 읽는다.
function readCostSheet(data) {
  const cs = data.cost_summary || {};
  if (typeof cs.direct_cost_total === 'number') {
    return {
      directMaterial: cs.direct_material_cost || 0,
      directLabor: cs.direct_labor_cost || 0,
      directTotal: cs.direct_cost_total || 0,
      sanjae: cs.industrial_accident_insurance?.amount || 0,
      otherExpenses: cs.other_expenses?.amount || 0,
      expenses: cs.expenses_subtotal || 0,
      netCost: cs.net_construction_cost || 0,
      adminFee: cs.general_admin_fee?.amount || 0,
      profit: cs.corporate_profit?.amount || 0,
      rounding: cs.rounding_adjustment || 0,
      supply: cs.final_supply_amount || 0,
      vat: cs.vat_amount || 0,
      total: cs.final_total_with_vat || 0
    };
  }
  const supply = cs.final_contract_amount?.amount || 0;
  const vat = Math.round(supply * VAT_RATE);
  return { supply, vat, total: supply + vat };
}

const withVat = supply => supply + Math.round(supply * VAT_RATE);
const currentQuote = () => state.quotes[state.version];
const rejectedOption = () => Object.keys(COUNTERTOP_OPTIONS).find(k => !COUNTERTOP_OPTIONS[k].chosen);
// '2026-11-05' -> '2026. 11. 05'
const fmtDate = iso => (iso || '').replaceAll('-', '. ');
// '2026-11-05' -> '11/5'
const fmtMonthDay = iso => (iso || '').split('-').slice(1).map(Number).join('/');

/* ==================== 4. 검색 (유의어 확장) ==================== */
// "샷시"가 창호공사를, "화장실"이 욕실1·2를 함께 잡도록 site_content의 유의어 사전으로 넓힌다.
function expandQuery(rawQuery) {
  const q = rawQuery.trim().toLowerCase();
  const expanded = { raw: q, rooms: new Set(), trades: new Set(), keywords: q ? [q] : [] };
  if (!q) return expanded;
  (state.content.SYNONYM_DICTIONARY || []).forEach(entry => {
    const hit = entry.triggers.some(t => t.toLowerCase().includes(q) || q.includes(t.toLowerCase()));
    if (!hit) return;
    entry.matchRooms.forEach(r => expanded.rooms.add(r));
    entry.matchTrades.forEach(t => expanded.trades.add(t));
    entry.matchKeywords.forEach(k => expanded.keywords.push(k.toLowerCase()));
  });
  return expanded;
}

function itemMatchesSearch(it, expanded) {
  if (!expanded.raw) return true;
  if (expanded.trades.has(tradeCode(it))) return true;
  if ((it.rooms || []).some(r => expanded.rooms.has(r))) return true;
  const haystack = [it.id, it.task, it.task_raw, it.spec_raw, it.material, it.category_name, it.location_raw,
    it.note_raw, ...(it.rooms || []), it.change_history?.previous_spec_raw, it.change_history?.reason]
    .join(' ').toLowerCase();
  return expanded.keywords.some(k => haystack.includes(k));
}

/* ==================== 5. URL 해시 <-> 상태 (링크 공유) ==================== */
// 주소창을 그대로 복사하면 같은 탭·구역·공종·검색어가 열린 화면을 상대도 본다.
function readUrl() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  if (TABS.includes(params.get('tab'))) state.tab = params.get('tab');
  state.room = params.get('room') || null;
  state.trade = params.get('trade') || null;
  state.q = params.get('q') || '';
  return params.get('item');
}

function writeUrl() {
  const params = new URLSearchParams();
  if (state.tab !== 'items') params.set('tab', state.tab);
  if (state.room) params.set('room', state.room);
  if (state.trade) params.set('trade', state.trade);
  if (state.q) params.set('q', state.q);
  const query = params.toString();
  // 조작할 때마다 히스토리가 쌓이면 뒤로가기가 먹통이 되므로 교체만 한다
  window.history.replaceState(null, '', query ? `#${query}` : window.location.pathname + window.location.search);
}

// 공유 링크에 들어 있던 구역·공종이 데이터에 없으면 조용히 해제한다
function sanitizeState() {
  const data = currentQuote();
  const rooms = new Set((data.rooms_master || []).map(r => r.id));
  if (state.room && !rooms.has(state.room)) state.room = null;
  const trades = new Set(data.items.map(tradeCode));
  if (state.trade && !trades.has(state.trade)) state.trade = null;
}

/* ==================== 6. 요약 ==================== */
function renderSummary() {
  const data = currentQuote();
  const summary = $('summary');
  if (isWorkMode()) {
    const base = data.cost_summary.base_v1_summary;
    const added = data.cost_summary.added_summary;
    $('headMeta').textContent = `최초 내역 ${base.quote_number} · 최종 확정 ${added.quote_number} (${fmtDate(added.quote_date)} 확정 · 시공 공유용)`;
    const phases = state.content.CONSTRUCTION_SCHEDULE_PHASES || [];
    if (phases.length > 0) {
      const totalDays = Math.max(...phases.map(p => p.startOffset + p.spanDays));
      const start = phases[0].period.split('~')[0].trim();
      const end = phases[phases.length - 1].period.split('~').pop().trim();
      $('workSumPeriod').textContent = `${start} ~ ${end} (${totalDays}일)`;
      $('workSumToday').textContent = scheduleTodayText(phases, scheduleTodayOffset(phases), totalDays);
    }
    const active = activeItems(data);
    const changed = data.items.filter(changeBadge);
    $('workSumItems').textContent = `시공 ${active.length}건 · 변경·추가·제외 ${changed.length}건`;
    const apps = state.content.APPLIANCE_CHECKS?.rows || [];
    const renders = state.content.ROOM_3D_RENDERINGS || [];
    $('workSumSpecs').textContent = `가전 치수 ${apps.length}종 · 3D 시안 ${renders.length}컷`;
    summary.setAttribute('aria-busy', 'false');
    return;
  }
  const sheet = readCostSheet(data);
  const base = data.cost_summary.base_v1_summary;
  const delta = sheet.total - base.final_total_with_vat;

  const added = data.cost_summary.added_summary;
  const first = state.quotes[FINAL_QUOTE.countertop];
  const firstAdded = first?.cost_summary?.added_summary;
  $('headMeta').textContent = `최초 견적 ${base.quote_number}${firstAdded ? ` · 추가 견적 1차 ${firstAdded.quote_number}` : ''} · 2차 ${added.quote_number} (${fmtDate(added.quote_date)} 확정)`;
  $('sumTotal').textContent = fmtKRW(sheet.total);
  $('sumSupply').textContent = `공급가 ${fmtKRW(sheet.supply)} · 부가세 ${fmtKRW(sheet.vat)}`;
  // 견적 날짜별 부가세 포함 총액을 한 줄씩. 마지막 줄이 현재 확정 금액이다
  const history = [[base.quote_date, base.final_total_with_vat],
    ...(first ? [[firstAdded.quote_date, readCostSheet(first).total]] : []), [added.quote_date, sheet.total]];
  $('sumHistory').innerHTML = history.map(([d, m], i) =>
    `<li${i === history.length - 1 ? ' class="now"' : ''}>${escapeHtml(fmtMonthDay(d))} 견적: ${escapeHtml(fmtKRW(m))}</li>`).join('');
  $('sumDelta').textContent = fmtSignedKRW(delta);
  $('sumDelta').className = `delta num ${delta > 0 ? 'up' : 'down'}`;
  $('sumDeltaSub').textContent = `${fmtKRW(base.final_total_with_vat)} → ${fmtKRW(sheet.total)}`;

  extensions.forEach(ext => ext.summary?.(summary, data));
  summary.setAttribute('aria-busy', 'false');
}

/* ==================== 7. 내역: 도면 + 품목 ==================== */
function categoryList(data) {
  const cats = [];
  (data.section_summary || []).forEach(sec => (sec.categories || []).forEach(cat => {
    cats.push({ code: `${sec.section_code}-${cat.category_code}`, name: cat.category_name });
  }));
  return cats;
}

function rowHtml(it) {
  const badge = changeBadge(it);
  const ch = it.change_history || {};
  const rooms = (it.rooms || []).map(r => (r === '전체' ? '세대 공통' : r)).join(' · ');
  const notes = [
    ch.previous_spec_raw && ch.previous_spec_raw !== it.spec_raw ? `변경 전: ${ch.previous_spec_raw}` : '',
    ch.reason ? `변경 사유: ${ch.reason}` : '',
    it.note_raw ? `비고: ${it.note_raw}` : ''
  ].filter(Boolean);
  if (isWorkMode()) {
    return `
    <div class="row" role="button" tabindex="0" aria-expanded="false" data-item="${escapeHtml(it.id)}">
      <div class="row-1"><span class="t">${escapeHtml(it.task)}</span>
        <span class="a num">${escapeHtml(it.quantity)} ${escapeHtml(it.unit || '')}</span></div>
      <div class="row-2">${badge ? `<span class="badge ${badge.cls}">${badge.text}</span>` : ''}<span>${escapeHtml(it.material || it.spec_raw || '')}</span><span>· ${escapeHtml(rooms)}</span></div>
      <div class="detail num">
        <span>수량 ${escapeHtml(it.quantity)} ${escapeHtml(it.unit || '')}</span><span>품목 ${escapeHtml(it.id)}</span>
        ${notes.map(n => `<span class="note">${escapeHtml(n)}</span>`).join('')}
      </div>
    </div>`;
  }
  const price = it.price || {};
  const prev = ch.previous_total_cost ?? ch.previous_cost;
  return `
    <div class="row" role="button" tabindex="0" aria-expanded="false" data-item="${escapeHtml(it.id)}">
      <div class="row-1"><span class="t">${escapeHtml(it.task)}</span>
        <span class="a num">${prev > 0 && prev !== price.total_cost ? `<span class="was">${fmtKRW(prev)}</span>` : ''}${fmtKRW(price.total_cost)}</span></div>
      <div class="row-2">${badge ? `<span class="badge ${badge.cls}">${badge.text}</span>` : ''}<span>${escapeHtml(it.spec_raw || it.material || '')}</span><span>· ${escapeHtml(rooms)}</span></div>
      <div class="detail num">
        <span>재료비 ${fmtKRW(price.material_cost)}</span><span>노무비 ${fmtKRW(price.labor_cost)}</span>
        <span>수량 ${escapeHtml(it.quantity)} ${escapeHtml(it.unit || '')}</span><span>품목 ${escapeHtml(it.id)}</span>
        ${notes.map(n => `<span class="note">${escapeHtml(n)}</span>`).join('')}
      </div>
    </div>`;
}

function groupedHtml(items, data) {
  return categoryList(data).map(cat => {
    const list = items.filter(it => tradeCode(it) === cat.code);
    if (list.length === 0) return '';
    return `<div class="trade">
      <div class="trade-head"><div><b>${escapeHtml(cat.name)}</b><span>${list.length}건</span></div>${isWorkMode() ? '' : `<b class="num">${fmtKRW(sumCost(list))}</b>`}</div>
      ${list.map(rowHtml).join('')}
    </div>`;
  }).join('');
}

function renderPlan() {
  const zones = state.content.FLOORPLAN_ZONES || [];
  $('zones').innerHTML = zones.map(z => {
    const attrs = `class="zone${state.room === z.roomId ? ' active' : ''}" fill="${escapeHtml(z.baseColor)}" stroke="${escapeHtml(z.strokeColor)}" data-room="${escapeHtml(z.roomId)}"`;
    const shape = z.shapeType === 'path'
      ? `<path d="${escapeHtml(z.pathD)}" ${attrs}>`
      : `<rect x="${z.coords.x}" y="${z.coords.y}" width="${z.coords.width}" height="${z.coords.height}" ${attrs}>`;
    return `${shape}<title>${escapeHtml(z.title)}</title></${z.shapeType === 'path' ? 'path' : 'rect'}>`;
  }).join('');
  $('zoneLabels').innerHTML = zones.map(z =>
    `<text class="zone-label" x="${z.labelPos.x}" y="${z.labelPos.y}">${escapeHtml(z.cadName)}</text>`).join('');
  const zone = zones.find(z => z.roomId === state.room);
  $('planHint').textContent = zone ? zone.cadNote : '구역을 누르면 그 공간의 품목만 보입니다. 한 번 더 누르면 해제됩니다.';
  $('planToggle').textContent = state.room ? `도면: ${state.room} 선택됨 ▾` : '도면에서 구역 고르기 ▾';
}

function renderItems() {
  const data = currentQuote();
  const expanded = expandQuery(state.q);
  // 구역을 고르면 그 구역에 직접 지정된 품목만 본문에 두고, 세대 공통(구역별로 나눌 수 없는)
  // 품목은 아래 접힌 묶음으로 따로 보여준다. 세대 공통 품목이 모든 방에 해당하지는 않기 때문이다.
  const searched = activeItems(data).filter(it => itemMatchesSearch(it, expanded));
  const direct = state.room ? searched.filter(it => (it.rooms || []).includes(state.room)) : searched;
  const common = state.room ? searched.filter(it => !(it.rooms || []).includes(state.room) && isCommon(it)) : [];
  const counts = direct.reduce((m, it) => ({ ...m, [tradeCode(it)]: (m[tradeCode(it)] || 0) + 1 }), {});
  if (state.trade && !counts[state.trade]) state.trade = null;
  const byTrade = list => list.filter(it => !state.trade || tradeCode(it) === state.trade);
  const items = byTrade(direct);
  const commonItems = byTrade(common);

  $('tradeChips').innerHTML =
    (state.room ? `<button type="button" class="chip room" data-clear-room>${escapeHtml(state.room)} ✕</button>` : '') +
    `<button type="button" class="chip" data-trade="" aria-pressed="${!state.trade}">전체 공종 ${direct.length}</button>` +
    categoryList(data).filter(c => counts[c.code]).map(c =>
      `<button type="button" class="chip" data-trade="${c.code}" aria-pressed="${state.trade === c.code}">${escapeHtml(c.name.replace(/공사$/, ''))} ${counts[c.code]}</button>`).join('');

  $('resultCount').textContent = `${state.room ? `${state.room} ` : ''}${items.length}건${state.q ? ` · '${state.q}' 검색` : ''}`;
  $('resultSum').textContent = isWorkMode() ? '' : `합계 ${fmtKRW(sumCost(items))}`;
  $('itemList').innerHTML =
    (groupedHtml(items, data) || `<div class="empty">${state.room ? '이 구역에 직접 지정된 품목이 없습니다.' : '조건에 맞는 품목이 없습니다.'}</div>`) +
    (state.room && !state.trade && commonItems.length > 0 ? `
      <details class="fold" id="commonFold">
        <summary><b>세대 공통 공정 ${commonItems.length}건</b>${isWorkMode() ? '' : `<span class="num">${fmtKRW(sumCost(commonItems))}</span>`}
          <small>철거·전기·목공·도배·장판처럼 집 전체에 걸쳐 있어 구역별로 나눌 수 없는 품목입니다. ${escapeHtml(state.room)}에 모두 해당하지는 않습니다.</small></summary>
        ${groupedHtml(commonItems, data)}
      </details>` : '');
}

function selectRoom(roomId) {
  state.room = state.room === roomId ? null : roomId;
  renderPlan();
  renderItems();
  writeUrl();
}

/* ==================== 8. 변경 ==================== */
// v2·v3는 원가계산서 전체가 아니라 최초 계약에 얹은 조정분만 들고 있다
function historySupply(base) {
  const v2 = state.quotes.v2?.cost_summary?.v2_revision_adjustment;
  const v3 = state.quotes.v3?.cost_summary?.v3_pending_revision?.known_exclusions_deduction;
  const v2Supply = v2 ? base.final_supply_amount + (v2.stated_material_cost_increase || 0) : null;
  const v3Supply = v2Supply !== null && v3 ? v2Supply + (v3.bathroom_xl_heating_pipe_1c03 || 0) : null;
  return { v2Supply, v3Supply };
}

function renderTimeline() {
  const data = currentQuote();
  const base = data.cost_summary.base_v1_summary;
  const { v2Supply, v3Supply } = historySupply(base);
  const chosen = state.quotes[FINAL_QUOTE.countertop];
  const other = state.quotes[rejectedOption()];
  const added = data.cost_summary.added_summary;
  const steps = [
    { d: '2026. 08. 18', n: '최초 계약', m: base.final_total_with_vat, s: `견적번호 ${base.quote_number}` },
    { d: '2026. 11. 03', n: '위생도기 변경 가안', m: v2Supply === null ? null : withVat(v2Supply), s: '위생도기 변경분 반영 (PDF 원본 없음)' },
    { d: '2026. 11. 03', n: '카톡 협의 가안', m: v3Supply === null ? null : withVat(v3Supply), s: '욕실 난방배관 제외, 단가 산정 전 (PDF 원본 없음)' },
    {
      d: '2026. 11. 03', n: '추가·정정 (상판 2안)', m: chosen ? readCostSheet(chosen).total : null,
      s: `${COUNTERTOP_OPTIONS[FINAL_QUOTE.countertop].label}안${other ? ` · ${COUNTERTOP_OPTIONS[rejectedOption()].label}안 ${fmtKRW(readCostSheet(other).total)}` : ''}`
    },
    {
      d: fmtDate(added.quote_date), n: '최종 추가·정정 확정', m: readCostSheet(data).total, final: true,
      s: '싱크볼 고객 지급 · 주방수전 정리 · 방문 부속 추가 · 필름 범위 조정'
    }
  ];
  $('timeline').innerHTML = steps.map(st => `
    <div class="step${st.final ? ' final' : ''}"><div class="d">${st.d}</div><div class="n">${st.n}</div>
      <div class="m num">${st.m === null ? '불러오는 중' : fmtKRW(st.m)}</div><div class="s">${escapeHtml(st.s)}</div></div>`).join('');
}

// 요약 묶음의 금액은 글로 적어 두지 않고 묶인 품목의 증감액에서 계산한다
function highlightAmount(highlight, itemsMap) {
  return highlight.itemIds.reduce((acc, id) => {
    const it = itemsMap.get(id);
    const diff = it?.change_history?.cost_diff;
    return acc + (typeof diff === 'number' ? diff : itemCost(it || {}));
  }, 0);
}

function renderHighlights() {
  const itemsMap = new Map(currentQuote().items.map(it => [it.id, it]));
  $('highlights').innerHTML = (state.content.CHANGE_HIGHLIGHTS || []).map(h => {
    // note는 직접 쓴 문구이고 <strong>만 허용한다
    const note = escapeHtml(h.note || '').replace(/&lt;(\/?)strong&gt;/g, '<$1strong>');
    if (isWorkMode()) {
      return `<div class="hl"><div class="card-label">${escapeHtml(h.title)}</div><p>${note}</p></div>`;
    }
    const amount = highlightAmount(h, itemsMap);
    return `<div class="hl"><div class="card-label">${escapeHtml(h.title)}</div>
      <div class="v num ${amount < 0 ? 'down' : 'up'}">${fmtSignedKRW(amount)}</div><p>${note}</p></div>`;
  }).join('');
}

function renderCountertopCompare() {
  const [a, b] = Object.keys(COUNTERTOP_OPTIONS).map(k => ({ key: k, quote: state.quotes[k] }));
  if (!a.quote || !b.quote) {
    $('countertopCompare').innerHTML = '<tbody><tr><td class="note">두 안의 내역서를 불러오는 중입니다.</td></tr></tbody>';
    return;
  }
  const maps = [a, b].map(c => new Map(c.quote.items.map(it => [it.id, it])));
  const sheets = [a, b].map(c => readCostSheet(c.quote));
  $('countertopCompare').innerHTML = `
    <thead><tr><th scope="col">항목</th>${[a, b].map(c => `<th scope="col">${escapeHtml(COUNTERTOP_OPTIONS[c.key].label)}${COUNTERTOP_OPTIONS[c.key].chosen ? ' (선택)' : ''}</th>`).join('')}</tr></thead>
    <tbody>
      ${COUNTERTOP_ITEMS.map(id => `<tr><td>${escapeHtml(maps[0].get(id)?.task)}</td>${maps.map(m => `<td class="num">${fmtKRW(itemCost(m.get(id) || {}))}</td>`).join('')}</tr>`).join('')}
      <tr><td>공급가액</td>${sheets.map(s => `<td class="num">${fmtKRW(s.supply)}</td>`).join('')}</tr>
      <tr class="total"><td>부가세 포함 총액</td>${sheets.map(s => `<td class="num">${fmtKRW(s.total)}</td>`).join('')}</tr>
      <tr><td class="note" colspan="3">나머지 품목은 두 안이 같습니다. ${escapeHtml(COUNTERTOP_OPTIONS[a.key].label)}안이 부가세 포함 ${fmtSignedKRW(sheets[0].total - sheets[1].total)} 비쌉니다.</td></tr>
    </tbody>`;
}

function renderCostTable() {
  const cs = currentQuote().cost_summary;
  const base = cs.base_v1_summary;
  const added = cs.added_summary;
  const sheet = readCostSheet(currentQuote());
  const rows = [
    ['직접재료비', base.direct_material_cost, added.direct_material_cost_diff, sheet.directMaterial],
    ['직접노무비', base.direct_labor_cost, added.direct_labor_cost_diff, sheet.directLabor],
    ['산재보험료 (노무비의 4.34%)', base.industrial_accident_insurance, added.industrial_accident_insurance_diff, sheet.sanjae],
    ['기타경비 (재료비+노무비의 5%)', base.other_expenses, added.other_expenses_diff, sheet.otherExpenses],
    ['순공사원가', base.net_construction_cost, added.net_construction_cost_diff, sheet.netCost, true],
    ['일반관리비 (재료비+노무비의 6%)', base.general_admin_fee, added.general_admin_fee_diff, sheet.adminFee],
    ['기업이윤 (순공사원가의 10%)', base.corporate_profit, added.corporate_profit_diff, sheet.profit],
    ['단수조정', base.rounding_adjustment, added.rounding_adjustment_diff, sheet.rounding],
    ['공급가액', base.final_supply_amount, added.final_supply_amount_diff, sheet.supply, true],
    ['부가세 (10%)', base.vat_amount, added.vat_amount_diff, sheet.vat],
    ['총액', base.final_total_with_vat, added.final_total_with_vat_diff, sheet.total, true]
  ];
  $('costTable').innerHTML = `
    <thead><tr><th scope="col">구분</th><th scope="col">최초 계약</th><th scope="col">추가·정정</th><th scope="col">확정</th></tr></thead>
    <tbody>${rows.map(([label, b, d, t, strong]) => `
      <tr${strong ? ' class="total"' : ''}><td>${label}</td><td class="num">${fmtKRW(b)}</td><td class="num">${fmtSignedKRW(d)}</td><td class="num">${fmtKRW(t)}</td></tr>`).join('')}
    </tbody>`;
}

function renderChanges() {
  const data = currentQuote();
  const changed = data.items.filter(changeBadge);
  if (isWorkMode()) {
    renderHighlights();
    $('changedCount').textContent = `${changed.length}건`;
    $('changedList').innerHTML = groupedHtml(changed, data);
    return;
  }
  extensions.forEach(ext => ext.changes?.($('localBox'), data));
  renderTimeline();
  renderHighlights();
  renderCountertopCompare();
  renderCostTable();
  $('changedCount').textContent = `${changed.length}건`;
  $('changedList').innerHTML = groupedHtml(changed, data);
}

/* ==================== 9. 일정 ==================== */
function renderSchedule() {
  const phases = state.content.CONSTRUCTION_SCHEDULE_PHASES || [];
  if (phases.length === 0) return;
  // 막대 눈금은 마지막 공정이 끝나는 날을 기준으로 잡는다
  const totalDays = Math.max(...phases.map(p => p.startOffset + p.spanDays));
  const start = phases[0].period.split('~')[0].trim();
  const end = phases[phases.length - 1].period.split('~').pop().trim();
  $('scheduleLead').textContent = `${start} 착공 ~ ${end} 준공 (${totalDays}일). 현장 여건에 따라 세부 일자는 조정될 수 있습니다. 공정 이름을 누르면 해당 내역으로 이동합니다.`;
  const today = scheduleTodayOffset(phases);
  const inRange = today >= 0 && today < totalDays;
  const status = p => (today >= p.startOffset + p.spanDays ? 'done' : today >= p.startOffset ? 'now' : '');
  $('scheduleToday').textContent = scheduleTodayText(phases, today, totalDays);
  $('gantt').innerHTML = phases.map(p => `
    <div class="g-row ${status(p)}">
      <div><button type="button" class="g-name" data-jump-trade="${escapeHtml(p.LinkedTradeCode)}">${escapeHtml(p.tradeName)}</button>${status(p) === 'now' ? '<span class="g-now">진행 중</span>' : ''}<div class="g-date num">${escapeHtml(p.period)}</div></div>
      <div><div class="g-track"><div class="g-bar" style="left:${(p.startOffset / totalDays) * 100}%;width:${Math.max(3, (p.spanDays / totalDays) * 100)}%"></div>${inRange ? `<div class="g-today" style="left:${((today + 0.5) / totalDays) * 100}%"></div>` : ''}</div>
        <div class="g-work">${escapeHtml(p.workDetails)}</div></div>
    </div>`).join('');
}

// 공정표 날짜에는 연도가 없어 최종 견적서의 연도를 쓴다. 첫 공정 시작일('11. 02 (월)')부터 오늘까지 지난 날 수
function scheduleTodayOffset(phases) {
  const [month, day] = phases[0].period.match(/\d+/g).map(Number);
  const year = Number(currentQuote().cost_summary.added_summary.quote_date.slice(0, 4));
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((todayMidnight - new Date(year, month - 1, day)) / 86400000);
}

function scheduleTodayText(phases, today, totalDays) {
  if (today < 0) return `착공까지 ${-today}일 남았습니다.`;
  if (today >= totalDays) return '공정표 기간이 끝났습니다.';
  const now = new Date();
  const running = phases.filter(p => today >= p.startOffset && today < p.startOffset + p.spanDays).map(p => p.tradeName);
  const next = phases.find(p => p.startOffset > today);
  const nextDate = next ? next.period.match(/\d+/g).slice(0, 2).map(Number).join('/') : '';
  return [`오늘 ${now.getMonth() + 1}/${now.getDate()} (착공 ${today + 1}일째)`,
    running.length ? `진행 중: ${running.join(', ')}` : '',
    next ? `다음: ${nextDate} ${next.tradeName}` : ''].filter(Boolean).join(' · ');
}

/* ==================== 10. 자재 ==================== */
// 견적서에 가구 개구부 치수가 없어 자동 판정은 할 수 없다. 치수와 맞물리는 품목,
// 현장에서 재 봐야 할 지점을 나란히 두어 가구 제작 전에 대조하게 한다.
function renderAppliances() {
  const checks = state.content.APPLIANCE_CHECKS;
  if (!checks || !(checks.rows || []).length) return;
  const itemsMap = new Map(currentQuote().items.map(it => [it.id, it]));
  const dim = r => ([r.w, r.d, r.h].every(v => typeof v === 'number') ? `${r.w} × ${r.d} × ${r.h}` : '-');
  $('applianceBox').innerHTML = `
    <h2 class="section-title">가전 치수 · 가구 개구부 확인 <small>${escapeHtml(checks.caption)}</small></h2>
    <div class="table-wrap"><table class="compare">
      <thead><tr><th scope="col">가전</th><th scope="col">폭 × 깊이 × 높이 (mm)</th><th scope="col">맞물리는 품목</th></tr></thead>
      <tbody>${checks.rows.map(r => `
        <tr><td><b>${r.url ? `<a href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(r.appliance)} ↗</a>` : escapeHtml(r.appliance)}</b><br><small>${escapeHtml(r.model)}</small></td><td class="num">${escapeHtml(dim(r))}</td>
          <td class="note">${(r.itemIds || []).map(id => `<button type="button" class="jump" data-jump-item="${escapeHtml(id)}">${escapeHtml(id)} ${escapeHtml((itemsMap.get(id)?.task || '').slice(0, 18))} ↘</button>`).join('')}
            <div>${escapeHtml(r.check)}</div></td></tr>`).join('')}
      </tbody></table></div>`;
}

function renderSpecs() {
  renderAppliances();
  $('specs').innerHTML = (state.content.FINAL_MATERIAL_SPEC_SHEET || []).map(g => `
    <div class="spec"><h3>${escapeHtml(g.section)}</h3><ul>
      ${g.specs.map(s => `<li><b>${escapeHtml(s.label)}</b><span>${escapeHtml(s.model)}</span>${s.note ? `<small>${escapeHtml(s.note)}</small>` : ''}</li>`).join('')}
    </ul></div>`).join('');
  $('gallery').innerHTML = (state.content.ROOM_3D_RENDERINGS || []).map(r => `
    <button type="button" data-image="${escapeHtml(r.src)}" data-title="${escapeHtml(`${r.roomLabel} · ${r.title}`)}">
      <img src="${escapeHtml(r.src)}" alt="${escapeHtml(r.title)}" loading="lazy" /><span>${escapeHtml(r.roomLabel)} · ${escapeHtml(r.title)}</span>
    </button>`).join('');
}

function openImage(src, title) {
  const dialog = $('imageDialog');
  $('imageDialogImg').src = src;
  $('imageDialogImg').alt = title;
  $('imageDialogTitle').textContent = title;
  // jsdom 등 showModal이 없는 환경에서도 열리게 한다
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
}

/* ==================== 11. 탭 · 전체 렌더 ==================== */
const TAB_RENDERERS = { items: () => { renderPlan(); renderItems(); }, changes: renderChanges, schedule: renderSchedule, specs: renderSpecs };

function renderCounts() {
  const data = currentQuote();
  $('cntItems').textContent = activeItems(data).length;
  $('cntChanges').textContent = data.items.filter(changeBadge).length;
  const phases = state.content.CONSTRUCTION_SCHEDULE_PHASES || [];
  $('cntSchedule').textContent = phases.length ? `${Math.max(...phases.map(p => p.startOffset + p.spanDays))}일` : '';
  $('cntSpecs').textContent = `시안 ${(state.content.ROOM_3D_RENDERINGS || []).length}컷`;
}

function showTab(tab) {
  state.tab = tab;
  document.querySelectorAll('.tabs [role="tab"]').forEach(btn => {
    const on = btn.dataset.tab === tab;
    btn.setAttribute('aria-selected', String(on));
    btn.tabIndex = on ? 0 : -1; // 탭 목록 안에서는 선택된 탭만 Tab 순서에 넣고 나머지는 화살표로 이동
  });
  document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === `panel-${tab}`));
  // 보이지 않는 탭까지 매번 그리지 않고, 처음 열 때(또는 데이터가 바뀐 뒤 처음) 그린다
  if (!state.renderedTabs.has(tab)) {
    TAB_RENDERERS[tab]();
    state.renderedTabs.add(tab);
  }
  writeUrl();
}

function renderAll() {
  sanitizeState();
  state.renderedTabs.clear();
  renderSummary();
  renderCounts();
  showTab(state.tab);
}

function jumpToItem(itemId) {
  const it = currentQuote().items.find(x => x.id === itemId);
  if (!it) return;
  const targetTab = isWorkMode() && !isActiveWorkItem(it) ? 'changes' : 'items';
  const container = targetTab === 'changes' ? '#changedList' : '#itemList';
  // 필터 때문에 행이 숨어 있을 수 있으니 풀고 해당 탭으로 간다
  state.room = null;
  state.trade = null;
  state.q = '';
  $('searchInput').value = '';
  state.renderedTabs.delete(targetTab);
  showTab(targetTab);
  // itemId는 데이터에 있는 품목 코드(예: 2-h-15)로 확인했으므로 선택자에 그대로 넣어도 안전하다
  const row = document.querySelector(`${container} [data-item="${it.id}"]`);
  if (!row) return;
  row.setAttribute('aria-expanded', 'true');
  row.classList.remove('flash');
  void row.offsetWidth; // 같은 행을 다시 눌러도 애니메이션이 재생되게 리플로우를 건다
  row.classList.add('flash');
  row.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function jumpToTrade(code) {
  state.room = null;
  state.trade = code;
  state.renderedTabs.delete('items');
  showTab('items');
}

/* ==================== 12. 이벤트 ==================== */
function bindEvents() {
  document.addEventListener('click', e => {
    const t = e.target.closest('button, [role="button"], [data-room]');
    if (!t) return;
    if (t.classList.contains('zone')) {
      // SVG 요소는 환경에 따라 dataset이 없을 수 있어 속성으로 읽는다
      selectRoom(t.getAttribute('data-room'));
    } else if (t.hasAttribute('data-clear-room')) {
      selectRoom(state.room);
    } else if (t.dataset.trade !== undefined) {
      state.trade = t.dataset.trade || null;
      renderItems();
      writeUrl();
    } else if (t.dataset.jumpItem) {
      jumpToItem(t.dataset.jumpItem);
    } else if (t.dataset.jumpTrade) {
      jumpToTrade(t.dataset.jumpTrade);
    } else if (t.dataset.image) {
      openImage(t.dataset.image, t.dataset.title);
    } else if (t.id === 'planToggle') {
      const open = $('plan').classList.toggle('open');
      t.setAttribute('aria-expanded', String(open));
    } else if (t.classList.contains('row')) {
      t.setAttribute('aria-expanded', String(t.getAttribute('aria-expanded') !== 'true'));
    } else if (t.dataset.tab) {
      showTab(t.dataset.tab);
    }
  });

  document.addEventListener('keydown', e => {
    // 품목 행은 div라서 Enter·Space로도 펼쳐지게 한다
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList?.contains('row')) {
      e.preventDefault();
      e.target.click();
    }
    const tabBtn = e.target.closest?.('.tabs [role="tab"]');
    const moves = { ArrowRight: 1, ArrowLeft: -1, Home: -Infinity, End: Infinity };
    if (tabBtn && e.key in moves) {
      e.preventDefault();
      const idx = TABS.indexOf(tabBtn.dataset.tab);
      const next = e.key === 'Home' ? 0 : e.key === 'End' ? TABS.length - 1 : (idx + moves[e.key] + TABS.length) % TABS.length;
      showTab(TABS[next]);
      document.querySelector(`.tabs [data-tab="${TABS[next]}"]`).focus();
    }
  });

  $('searchInput').addEventListener('input', e => {
    state.q = e.target.value;
    renderItems();
    writeUrl();
  });
}

/* ==================== 13. 시작 ==================== */
// 공개 배포본은 데이터가 암호화된 묶음 하나뿐이다(scripts/encrypt_site.mjs). 비밀번호로 푼 뒤에는 묶음에서 꺼낸다
const ENCRYPTED_DATA_FILE = './data.enc.json';
const PASSWORD_KEY = 'hup-site-password';
let unlockedBundle = null;

async function fetchJson(url) {
  if (unlockedBundle) {
    const data = unlockedBundle[url.replace('./', '')];
    if (!data) throw new Error(`${url} 없음`);
    return data;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
  return res.json();
}

// 확장은 registerExtension({ ready, summary(el, data), changes(el, data) })로 자신을 등록한다
const extensions = [];
const registerExtension = ext => extensions.push(ext);

async function loadExtension() {
  try {
    const res = await fetch(LOCAL_EXTENSION_FILE, { cache: 'no-store' });
    if (!res.ok) return;
    const tag = document.createElement('script');
    tag.textContent = await res.text();
    document.body.appendChild(tag);
    await Promise.all(extensions.map(ext => ext.ready));
  } catch {
    // 배포본에는 없는 파일이다. 없는 게 정상이므로 알리지 않는다.
  }
}

async function decryptBundle(enc, password) {
  const bytes = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: bytes(enc.salt), iterations: enc.iter, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(enc.iv) }, key, bytes(enc.ct));
  return JSON.parse(new TextDecoder().decode(plain));
}

// 로컬 작업본에는 암호문이 없어 평문 JSON을 그대로 읽는다. 배포본이면 비밀번호를 받아 풀 때까지 기다린다
async function unlockIfEncrypted() {
  let res;
  try { res = await fetch(ENCRYPTED_DATA_FILE, { cache: 'no-store' }); } catch { return; }
  if (!res.ok) return;
  const enc = await res.json();
  const saved = localStorage.getItem(PASSWORD_KEY) || sessionStorage.getItem(PASSWORD_KEY);
  if (saved) {
    try { unlockedBundle = await decryptBundle(enc, saved); return; } catch {
      // 비밀번호가 바뀌었으면 저장해 둔 값을 지우고 다시 묻는다
      localStorage.removeItem(PASSWORD_KEY);
      sessionStorage.removeItem(PASSWORD_KEY);
    }
  }
  document.body.classList.add('locked');
  $('headMeta').textContent = '비밀번호를 입력하면 내역서가 열립니다.';
  $('unlockPassword').focus();
  await new Promise(resolve => {
    $('unlockForm').addEventListener('submit', async e => {
      e.preventDefault();
      $('unlockError').textContent = '';
      const password = $('unlockPassword').value;
      try {
        unlockedBundle = await decryptBundle(enc, password);
      } catch {
        $('unlockError').textContent = '비밀번호가 맞지 않습니다.';
        return;
      }
      ($('unlockRemember').checked ? localStorage : sessionStorage).setItem(PASSWORD_KEY, password);
      $('unlockPassword').value = '';
      document.body.classList.remove('locked');
      $('headMeta').textContent = '내역서를 불러오는 중…';
      resolve();
    });
  });
}

async function boot() {
  const highlightItem = readUrl();
  $('searchInput').value = state.q;
  bindEvents();
  if (isWorkMode()) {
    try {
      const workBundle = await fetchJson(WORK_DATA_FILE);
      state.content = workBundle.content;
      state.quotes[FINAL_QUOTE.key] = workBundle.quote;
    } catch (err) {
      console.error('내역서 로드 실패:', err);
      $('headMeta').textContent = `내역서를 불러오지 못했습니다 (${err.message}).`;
      return;
    }
    renderAll();
    if (highlightItem) jumpToItem(highlightItem);
    return;
  }
  await unlockIfEncrypted();
  try {
    const [content, final, ...quotes] = await Promise.all([
      fetchJson(SITE_CONTENT_FILE),
      fetchJson(FINAL_QUOTE.file),
      ...Object.values(COUNTERTOP_OPTIONS).map(o => fetchJson(o.file)),
      loadExtension()
    ]);
    state.content = content;
    state.quotes[FINAL_QUOTE.key] = final;
    Object.keys(COUNTERTOP_OPTIONS).forEach((key, i) => { state.quotes[key] = quotes[i]; });
  } catch (err) {
    console.error('내역서 로드 실패:', err);
    $('headMeta').textContent = `내역서를 불러오지 못했습니다 (${err.message}).`;
    return;
  }
  renderAll();
  if (highlightItem) jumpToItem(highlightItem);

  // 협의 경과 타임라인에만 쓰는 과거 협의안. 받아지면 변경 탭을 다시 그린다.
  try {
    const [v2, v3] = await Promise.all(Object.values(HISTORY_FILES).map(fetchJson));
    Object.assign(state.quotes, { v2, v3 });
    if (state.renderedTabs.has('changes')) renderTimeline();
  } catch (err) {
    console.error('과거 협의안 로드 실패:', err);
  }
}

// DOMContentLoaded가 두 번 오는 환경(테스트용 jsdom 등)에서도 이벤트를 이중으로 묶지 않게 한 번만 실행한다
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();

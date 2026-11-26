/* HESSUP STUDIO — Core Application Controller (Physical index.html Encrypted Owner / work.html Zero-Price Split, Room Cross-Filter, 4 Views, Lightbox) */
(function () {
  const PAGE_MODE = document.body?.dataset?.mode === 'work' ? 'work' : 'owner';
  const ENCRYPTED_DATA_FILE = './data.enc.json';
  const WORK_DATA_FILE = './work_data.json';
  const LOCAL_EXTENSION_FILE = './private/studio-local.js';
  const PASSWORD_KEY = 'hup-site-password';

  let unlockedBundle = null;
  const studioExtensions = [];
  window.registerStudioExtension = ext => studioExtensions.push(ext);

  function getDefaultSimDate() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const iso = `${yyyy}-${mm}-${dd}`;
    if (iso >= '2026-11-01' && iso <= '2026-12-20') return iso;
    return '2026-11-26';
  }

  const state = {
    mode: PAGE_MODE,     // locked to 'work' on work.html, 'owner' on index.html
    theme: 'light',      // 'light' | 'dark'
    room: '전체',
    trade: 'all',
    diffFilter: 'all',   // 'all' | 'added' | 'modified' | 'cancelled' | 'supplied'
    viewTab: 'scope',    // 'scope' | 'changes' | 'schedule' | 'specs'
    q: '',
    simDate: getDefaultSimDate(),
    expandedItems: new Set(),
    lightboxList: [],
    lightboxIdx: 0
  };

  let searchAnnounceTimer = null;

  function readUrlHash() {
    const raw = (window.location.hash || '').replace(/^#/, '');
    if (!raw) return;
    const params = new URLSearchParams(raw);
    const r = params.get('room');
    if (r) state.room = r;
    const t = params.get('tab');
    if (t && ['scope', 'changes', 'schedule', 'specs'].includes(t)) state.viewTab = t;
    const tr = params.get('trade');
    if (tr) state.trade = tr;
    const q = params.get('q');
    if (q !== null) {
      state.q = q;
      const qEl = document.getElementById('q');
      const qClear = document.getElementById('q-clear');
      if (qEl) qEl.value = q;
      if (qClear) qClear.hidden = !q;
    }
  }

  function syncUrlHash() {
    const params = new URLSearchParams();
    if (state.room && state.room !== '전체') params.set('room', state.room);
    if (state.viewTab && state.viewTab !== 'scope') params.set('tab', state.viewTab);
    if (state.trade && state.trade !== 'all') params.set('trade', state.trade);
    if (state.q) params.set('q', state.q);
    const query = params.toString();
    const target = query ? `#${query}` : window.location.pathname + window.location.search;
    if (window.history && typeof window.history.replaceState === 'function') {
      window.history.replaceState(null, '', target);
    } else if (query) {
      window.location.hash = `#${query}`;
    }
  }

  const DB = {
    site: null,
    qV5: null,
    qMarble: null,
    itemsById: new Map()
  };

  const ROOM_ORDER = [
    { id: '전체', label: '전체' },
    { id: '거실', label: '거실' },
    { id: '주방', label: '주방' },
    { id: '침실1', label: '침실1(안방)' },
    { id: '침실2', label: '침실2(작은방1)' },
    { id: '침실3', label: '침실3(작은방2)' },
    { id: '욕실1(공용)', label: '욕실1(공용)' },
    { id: '욕실2(안방)', label: '욕실2(안방)' },
    { id: '현관', label: '현관' },
    { id: '발코니1(안방)', label: '발코니1' },
    { id: '발코니3(세탁실)', label: '발코니3(세탁실)' },
    { id: '반침', label: '반침' },
    { id: '공용부', label: '공용부' }
  ];

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function fmtNum(n) {
    if (n === null || n === undefined || Number.isNaN(Number(n))) return '0';
    return Math.round(Number(n)).toLocaleString('ko-KR');
  }
  function fmtKRW(n) {
    if (state.mode === 'work') return '-';
    const v = Math.round(Number(n || 0));
    return `${v.toLocaleString('ko-KR')}원`;
  }
  function stripWorkPriceText(text) {
    if (state.mode !== 'work') return String(text ?? '');
    return String(text ?? '')
      .replace(/[+-]?\s*\d[\d,.]*\s*(?:만원|만\s*원|원(?!래))/g, '시공 반영')
      .replace(/차액/g, '사양 조정')
      .replace(/단가|추가금/g, '사양')
      .replace(/감액/g, '조정')
      .replace(/금액/g, '내역')
      .replace(/견적서?/g, '시공내역');
  }
  window.stripWorkPriceText = stripWorkPriceText;

  function announce(msg) {
    const el = $('studio-live-announcer');
    if (el) el.textContent = msg;
  }

  /* ---------- Status Badge Dual Encoding ---------- */
  function getItemStatusKind(it) {
    const st = it.change_status || 'normal';
    const note = `${it.note_raw || ''} ${it.inference_note || ''} ${it.material || ''}`;
    if (it.customer_supplied || note.includes('고객 지급') || note.includes('고객지급') || (it.id === '2-h-13')) return 'supplied';
    if (st === 'cancelled' || st === 'deleted_partial_deduction' || (it.price && it.price.total_cost < 0)) return 'cancelled';
    if (st === 'added' || st === 'service_added') return 'added';
    if (st === 'modified' || st === 'service_upgraded' || Boolean(it.change_history)) return 'modified';
    return 'normal';
  }

  function renderStatusBadge(kind) {
    switch (kind) {
      case 'added': return `<span class="status-badge is-added">+추가 ▲</span>`;
      case 'modified': return `<span class="status-badge is-modified">~변경 ◆</span>`;
      case 'cancelled': return `<span class="status-badge is-cancelled">−취소 ▼</span>`;
      case 'supplied': return `<span class="status-badge is-supplied">★고객지급</span>`;
      default: return '';
    }
  }

  /* ---------- Search & Synonym Expansion ---------- */
  function expandSearchTokens(rawQuery) {
    const q = (rawQuery || '').trim().toLowerCase();
    if (!q) return { raw: '', keywords: [], matchRooms: new Set(), matchTrades: new Set() };
    const keywords = new Set([q]);
    const matchRooms = new Set();
    const matchTrades = new Set();
    const dict = DB.site?.SYNONYM_DICTIONARY || [];
    dict.forEach(entry => {
      const hit = (entry.triggers || []).some(t => t.toLowerCase().includes(q) || q.includes(t.toLowerCase()));
      if (hit) {
        (entry.matchKeywords || []).forEach(k => keywords.add(k.toLowerCase()));
        (entry.matchRooms || []).forEach(r => matchRooms.add(r));
        (entry.matchTrades || []).forEach(tr => matchTrades.add(tr));
      }
    });
    return { raw: q, keywords: [...keywords], matchRooms, matchTrades };
  }

  function itemMatchesSearch(it, searchCtx) {
    if (!searchCtx.raw) return true;
    const tradeCode = `${it.section_code}-${it.category_code}`;
    if (searchCtx.matchTrades.has(tradeCode)) return true;
    if ((it.rooms || []).some(r => searchCtx.matchRooms.has(r))) return true;
    const hay = `${it.id} ${it.task} ${it.material} ${it.spec_raw} ${it.note_raw} ${it.inference_note} ${(it.rooms || []).join(' ')} ${it.category_name}`.toLowerCase();
    return searchCtx.keywords.some(kw => hay.includes(kw));
  }

  function isCommonItemForRoom(it, room) {
    if (room === '전체') return false;
    const rooms = it.rooms || [];
    if (rooms.includes(room)) return false;
    return rooms.includes('전체') || it.allocation_type === 'global_shared';
  }

  function itemMatchesRoom(it, room) {
    if (room === '전체') return true;
    const rooms = it.rooms || [];
    return rooms.includes(room) || rooms.includes('전체') || it.allocation_type === 'global_shared';
  }

  /* ---------- 1. Header & Mode UI ---------- */
  function updateModeUI() {
    document.documentElement.setAttribute('data-mode', state.mode);
    const sub = $('header-subtitle');
    if (sub) {
      if (state.mode === 'work') {
        sub.textContent = '시공·자재·도면·일정 안내 (2026. 11. 26 현장 업데이트)';
      } else {
        sub.textContent = '최초 계약 20260818 · 최종 확정 202601105 (v5 · 칸스톤 에덴그레이 확정 · 11/26 공정 반영)';
      }
    }
    document.querySelectorAll('.owner-only').forEach(el => {
      el.hidden = state.mode === 'work';
    });
  }

  /* ---------- 2. KPI Dossier Strip ---------- */
  function getDiffCounts() {
    const changed = (DB.qV5?.items || []).filter(it => getItemStatusKind(it) !== 'normal');
    const counts = { all: changed.length, added: 0, modified: 0, cancelled: 0, supplied: 0 };
    changed.forEach(it => {
      const k = getItemStatusKind(it);
      if (counts[k] !== undefined) counts[k]++;
    });
    return { changed, counts };
  }

  function renderKpiStrip() {
    const strip = $('kpi-strip');
    if (!strip || !DB.qV5) return;

    const totalCount = (DB.qV5.items || []).length;
    const { counts } = getDiffCounts();
    if (state.mode === 'work') {
      strip.innerHTML = `
        <article class="kpi-card">
          <span class="kpi-label">전체 시공 품목 · 공간</span>
          <strong class="kpi-value">12개 공종 · ${totalCount}건</strong>
          <span class="kpi-delta">전용 84㎡ (11개 시공 구역 + 공용부)</span>
        </article>
        <article class="kpi-card">
          <span class="kpi-label">설계 · 사양 변경 반영</span>
          <strong class="kpi-value">총 ${counts.all}건 반영 완료</strong>
          <span class="kpi-delta">신규 추가 ${counts.added} · 사양 변경 ${counts.modified} · 취소·제외 ${counts.cancelled} · 고객지급 ${counts.supplied}</span>
        </article>
        <article class="kpi-card">
          <span class="kpi-label">가전 · 설비 개구부 체크</span>
          <strong class="kpi-value">핵심 가전 9종 매칭</strong>
          <span class="kpi-delta is-warn">[! 필수] 워시콤보 침실2 외창 사다리차 반입</span>
        </article>
        <article class="kpi-card">
          <span class="kpi-label">33일 표준 공정 현황 (11/26 갱신)</span>
          <strong class="kpi-value">10대 공정 · ${esc(state.simDate)}</strong>
          <span class="kpi-delta">착공 11/02 ~ 예비일 12/04 (12/07 입주 예정)</span>
        </article>`;
      return;
    }

    const cs = DB.qV5.cost_summary;
    const baseTotal = cs.base_v1_summary?.final_total_with_vat || 0;
    const finalTotal = cs.final_total_with_vat || 0;
    const diffTotal = cs.added_summary?.final_total_with_vat_diff || 0;

    const cards = [
      `<article class="kpi-card">
        <span class="kpi-label">최종 확정 총액 (v5 · 부가세 포함)</span>
        <strong class="kpi-value">${fmtKRW(finalTotal)}</strong>
        <span class="kpi-delta">공급가 ${fmtKRW(cs.final_supply_amount)} + 부가세 ${fmtKRW(cs.vat_amount)} · 11/16 중도금+추가금 입금 완료</span>
      </article>`,
      `<article class="kpi-card">
        <span class="kpi-label">최초 계약(v1) 대비 순증액</span>
        <strong class="kpi-value">+${fmtKRW(diffTotal)}</strong>
        <span class="kpi-delta is-warn">v1 (${fmtKRW(baseTotal)}) 대비 +15.2% · 변경 ${counts.all}건</span>
      </article>`,
      `<article class="kpi-card">
        <span class="kpi-label">직접공사비 합계 (재료 + 노무)</span>
        <strong class="kpi-value">${fmtKRW(cs.direct_cost_total)}</strong>
        <span class="kpi-delta">재료비 ${fmtKRW(cs.direct_material_cost)} · 노무비 ${fmtKRW(cs.direct_labor_cost)}</span>
      </article>`
    ];

    strip.innerHTML = cards.join('');
    // Local-only extension hook (not present on public deployment)
    const hasExt = studioExtensions.some(ext => ext.hasOverlay?.());
    strip.classList.toggle('has-local-ext', hasExt);
    if (hasExt) {
      studioExtensions.forEach(ext => ext.renderKpiCard?.(strip, setViewTab));
    }
  }

  /* ---------- 3. Room Filter Bar ---------- */
  function renderRoomFilterBar() {
    const listEl = $('room-chip-list');
    const resetBtn = $('room-reset-btn');
    if (!listEl || !DB.qV5) return;

    const items = DB.qV5.items || [];
    listEl.innerHTML = ROOM_ORDER.map(r => {
      const count = r.id === '전체'
        ? items.length
        : items.filter(it => (it.rooms || []).includes(r.id)).length;
      const active = state.room === r.id;
      return `<button type="button" class="room-chip${active ? ' is-active' : ''}" data-room-id="${esc(r.id)}" aria-pressed="${active ? 'true' : 'false'}">
        <span>${esc(r.label)}</span>
        <span class="chip-count">${count}</span>
      </button>`;
    }).join('');

    if (resetBtn) resetBtn.hidden = state.room === '전체';
  }

  /* ---------- 4. Tab 1: Room & Trade Scope (#panel-scope) ---------- */
  function renderTradeFilterBar() {
    const bar = $('tradeFilter');
    if (!bar || !DB.qV5) return;
    const cats = [];
    (DB.qV5.section_summary || []).forEach(sec => {
      (sec.categories || []).forEach(cat => {
        cats.push({ code: `${sec.section_code}-${cat.category_code}`, name: cat.category_name });
      });
    });

    const allActive = state.trade === 'all';
    const buttons = [
      `<button type="button" class="trade-chip${allActive ? ' is-active' : ''}" data-trade-code="all" aria-pressed="${allActive ? 'true' : 'false'}">전체 공종 (${cats.length})</button>`
    ];
    cats.forEach(c => {
      const active = state.trade === c.code;
      buttons.push(`<button type="button" class="trade-chip${active ? ' is-active' : ''}" data-trade-code="${esc(c.code)}" aria-pressed="${active ? 'true' : 'false'}">${esc(c.name)}</button>`);
    });
    bar.innerHTML = buttons.join('');
  }

  function buildItemDetailPanelHtml(it) {
    const isWork = state.mode === 'work';
    const p = it.price || {};
    const ch = it.change_history;
    const primaryRoom = (it.rooms || []).find(r => r && r !== '전체') || (it.rooms || [])[0] || '전체';

    const priceLine = isWork
      ? ''
      : `<div style="margin-bottom:4px;"><strong>산출 단가 · 원가 내역:</strong> 재료비 단가 ${fmtKRW(p.material_unit_price)} (소계 ${fmtKRW(p.material_cost)}) + 노무비 단가 ${fmtKRW(p.labor_unit_price)} (소계 ${fmtKRW(p.labor_cost)}) = 합계 단가 ${fmtKRW(p.total_unit_price)} (총액 ${fmtKRW(p.total_cost)})</div>`;

    let chLine = '';
    if (ch) {
      const reasonStr = stripWorkPriceText(ch.reason || ch.source_doc || '사양 조정');
      const costDiffStr = !isWork && ch.cost_diff !== undefined
        ? ` · 이전 ${fmtKRW(ch.previous_cost)} → 변경 ${fmtKRW(ch.new_cost)} (${ch.cost_diff >= 0 ? '+' : ''}${fmtKRW(ch.cost_diff)})`
        : '';
      chLine = `<div style="margin-bottom:4px;"><strong>변경 이력 (${esc(ch.version || 'v5')}):</strong> ${esc(reasonStr)}${esc(costDiffStr)}</div>`;
    } else {
      chLine = `<div style="margin-bottom:4px;"><strong>변경 이력:</strong> 최초 계약(v1) 기본 사양 유지</div>`;
    }

    const areaLine = it.target_area
      ? `<div style="margin-bottom:6px;"><strong>시공 부위 · 대상:</strong> ${esc(stripWorkPriceText(it.target_area))}</div>`
      : '';

    return `<div class="item-detail-panel" id="item-detail-${esc(it.id)}">
      ${priceLine}
      ${chLine}
      ${areaLine}
      <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:4px;">
        <button type="button" class="jump-pill-btn" data-focus-stage-room="${esc(primaryRoom)}">[⌖ 도면 구역 보기 · ${esc(primaryRoom)}]</button>
      </div>
    </div>`;
  }

  function buildScopeTableHtml(items, groupTitle) {
    const isWork = state.mode === 'work';
    const rowsHtml = items.map(it => {
      const kind = getItemStatusKind(it);
      const isCancelled = kind === 'cancelled';
      const isExpanded = state.expandedItems.has(it.id);
      const rowCls = `quote-row${isCancelled ? ' is-cancelled is-cancelled-row' : ''}${isExpanded ? ' is-expanded' : ''}`;
      const badge = renderStatusBadge(kind);
      const specText = esc(stripWorkPriceText(it.material || it.spec_raw || '-'));
      const noteRaw = stripWorkPriceText(it.note_raw || it.inference_note || '');
      const roomsStr = (it.rooms || []).join(' · ');
      const toggleBtn = `<button type="button" class="item-detail-toggle" data-toggle-detail="${esc(it.id)}" aria-expanded="${isExpanded ? 'true' : 'false'}" aria-controls="item-detail-${esc(it.id)}">${isExpanded ? '상세 접기 ▴' : '상세 · 도면 ▾'}</button>`;
      const detailBlock = isExpanded ? buildItemDetailPanelHtml(it) : '';

      if (isWork) {
        return `<tr id="item-row-${esc(it.id)}" data-item-id="${esc(it.id)}" class="${rowCls}">
          <td data-label="코드" class="mono">${esc(it.id)}</td>
          <td data-label="품목 및 상태">
            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
              ${badge}
              <strong class="item-name-text">${esc(it.task)}</strong>
              ${toggleBtn}
            </div>
            ${detailBlock}
          </td>
          <td data-label="규격 · 자재 사양">${specText}</td>
          <td data-label="물량 · 단위" class="num mono">${fmtNum(it.quantity)} ${esc(it.unit)}</td>
          <td data-label="시공 공간 · 주기">
            <span class="status-badge">${esc(roomsStr)}</span>
            ${noteRaw ? `<div style="font-size:12px; color:var(--text-secondary); margin-top:3px;">${esc(noteRaw)}</div>` : ''}
          </td>
        </tr>`;
      }

      const p = it.price || {};
      const prev = it.change_history?.previous_total_cost ?? it.change_history?.previous_cost;
      const wasHtml = prev > 0 && prev !== p.total_cost ? `<span style="text-decoration:line-through; color:var(--text-muted); font-weight:400; font-size:11.5px; margin-right:5px;">${fmtKRW(prev)}</span>` : '';
      return `<tr id="item-row-${esc(it.id)}" data-item-id="${esc(it.id)}" class="${rowCls}">
        <td data-label="코드" class="mono">${esc(it.id)}</td>
        <td data-label="품목 및 상태">
          <div style="display:flex; align-items:center; gap:5px; flex-wrap:wrap;">
            ${badge}
            <strong class="item-name-text">${esc(it.task)}</strong>
            ${toggleBtn}
          </div>
          ${noteRaw ? `<div style="font-size:11.5px; color:var(--text-secondary); margin-top:2px;">${esc(noteRaw)}</div>` : ''}
          ${detailBlock}
        </td>
        <td data-label="규격 · 자재 사양">${specText}<div style="font-size:11.5px; color:var(--text-muted);">${esc(roomsStr)}</div></td>
        <td data-label="수량" class="num mono">${fmtNum(it.quantity)} ${esc(it.unit)}</td>
        <td data-label="합계 금액" class="num mono" style="font-weight:700;">${wasHtml}${fmtKRW(p.total_cost)}</td>
      </tr>`;
    }).join('');

    const thead = isWork
      ? `<thead><tr><th>코드</th><th>품목 및 상태</th><th>규격 · 자재 사양</th><th class="num">물량</th><th>시공 공간</th></tr></thead>`
      : `<thead><tr><th>코드</th><th>품목 및 상태</th><th>규격 · 공간</th><th class="num">수량</th><th class="num">금액</th></tr></thead>`;

    return `<div class="table-wrapper" style="margin-bottom:14px;">
      <table class="studio-table is-responsive-stack" aria-label="${esc(groupTitle)} 내역 표">
        ${thead}
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>`;
  }

  function renderScopeFilterPills(directCount) {
    const pillBox = $('scope-filter-pills');
    if (!pillBox) return;
    const pills = [];
    if (state.room !== '전체') {
      pills.push(`<button type="button" class="jump-pill-btn" data-clear-filter="room">공간: ${esc(state.room)} ×</button>`);
    }
    if (state.trade !== 'all') {
      pills.push(`<button type="button" class="jump-pill-btn" data-clear-filter="trade">공종: ${esc(state.trade)} ×</button>`);
    }
    if (state.q) {
      pills.push(`<button type="button" class="jump-pill-btn" data-clear-filter="q">검색: "${esc(state.q)}" (${directCount}건) ×</button>`);
    }
    pillBox.innerHTML = pills.length ? `<div style="display:flex; gap:6px; flex-wrap:wrap;">${pills.join('')}</div>` : '';
  }

  function renderScopeTab() {
    const container = $('quoteContainer');
    const commonFold = $('commonFold');
    const commonContainer = $('commonContainer');
    const commonTitle = $('commonTitle');
    const commonBadge = $('commonBadge');
    const summaryLine = $('scope-summary-line');
    if (!container || !DB.qV5) return;

    const searchCtx = expandSearchTokens(state.q);
    const allItems = DB.qV5.items || [];

    const filtered = allItems.filter(it => {
      const tCode = `${it.section_code}-${it.category_code}`;
      if (state.trade !== 'all' && tCode !== state.trade) return false;
      if (!itemMatchesRoom(it, state.room)) return false;
      if (!itemMatchesSearch(it, searchCtx)) return false;
      return true;
    });

    const directItems = filtered.filter(it => !isCommonItemForRoom(it, state.room));
    const commonItems = filtered.filter(it => isCommonItemForRoom(it, state.room));

    renderScopeFilterPills(directItems.length);

    if (summaryLine) {
      summaryLine.textContent = state.room === '전체'
        ? `전체 ${allItems.length}건 중 조건 일치 ${directItems.length}건 표시 중`
        : `[${state.room}] 직결 내역 ${directItems.length}건 + 세대 공통 기반 공정 ${commonItems.length}건`;
    }

    if (directItems.length === 0) {
      container.innerHTML = `<div class="empty-state-box">
        <p style="margin:0 0 8px; font-weight:700;">선택하신 조건(${esc(state.room)} · 검색어 "${esc(state.q || '없음')}")에 해당하는 직결 품목이 없습니다.</p>
        <button type="button" class="copy-action-btn" id="empty-reset-btn">필터 초기화 · 전체 ${allItems.length}건 보기 ↺</button>
      </div>`;
      $('empty-reset-btn')?.addEventListener('click', () => {
        state.room = '전체';
        state.trade = 'all';
        state.q = '';
        if ($('q')) $('q').value = '';
        refreshAll();
      });
    } else {
      // Group by category_name
      const groups = new Map();
      directItems.forEach(it => {
        const key = `${it.section_code}-${it.category_code} · ${it.category_name}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(it);
      });
      const blocks = [];
      groups.forEach((list, title) => {
        const subSum = state.mode === 'work'
          ? `${list.length}개 품목`
          : `소계 ${fmtKRW(list.reduce((a, b) => a + (b.price?.total_cost || 0), 0))} (${list.length}건)`;
        blocks.push(`<div style="margin-top:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <h3 style="margin:0; font-size:14px; font-weight:800;">${esc(title)}</h3>
            <span class="mono" style="font-size:12.5px; color:var(--text-secondary);">${esc(subSum)}</span>
          </div>
          ${buildScopeTableHtml(list, title)}
        </div>`);
      });
      container.innerHTML = blocks.join('');
    }

    if (commonFold && commonContainer) {
      if (state.room !== '전체' && commonItems.length > 0) {
        commonFold.hidden = false;
        if (commonTitle) commonTitle.textContent = `세대 공통 기반 공정 (${state.room} 외 전 실 공통 적용 · ${commonItems.length}건)`;
        if (commonBadge) commonBadge.textContent = `${commonItems.length}건 펼쳐보기`;
        commonContainer.innerHTML = buildScopeTableHtml(commonItems, '세대 공통 기반 공정');
      } else {
        commonFold.hidden = true;
        commonContainer.innerHTML = '';
      }
    }

    renderCostStatementTables();
  }

  /* ---------- 5. 11-Row Cost Statement (#costTable & #costTableScope) ---------- */
  function renderCostStatementTables() {
    const t1 = $('costTableScope');
    const t2 = $('costTable');
    if (state.mode === 'work' || !DB.qV5) {
      if (t1) t1.innerHTML = '';
      if (t2) t2.innerHTML = '';
      return;
    }

    const cs = DB.qV5.cost_summary;
    const v1 = cs.base_v1_summary;
    const d = cs.added_summary;

    const scopeBadge = $('scope-cost-summary-badge');
    if (scopeBadge) {
      scopeBadge.textContent = `공급가 ${fmtKRW(cs.final_supply_amount)} + 부가세 ${fmtKRW(cs.vat_amount)} = ${fmtKRW(cs.final_total_with_vat)}`;
    }
    const costSub = $('cost-statement-subtitle');
    if (costSub) {
      costSub.textContent = `직접재료비 (${fmtKRW(cs.direct_material_cost)}) + 직접노무비 (${fmtKRW(cs.direct_labor_cost)}) = 직접공사비 (${fmtKRW(cs.direct_cost_total)}) · 제경비 포함 최종 공급가 (${fmtKRW(cs.final_supply_amount)})`;
    }

    const rows = [
      ['1. 직접재료비', v1.direct_material_cost, d.direct_material_cost_diff, cs.direct_material_cost, '가설·철거·인테리어 전 공종 자재비 합계'],
      ['2. 직접노무비', v1.direct_labor_cost, d.direct_labor_cost_diff, cs.direct_labor_cost, '공종별 시공 인건비 합계'],
      ['3. 직접공사비 계 (1+2)', v1.direct_cost_total, d.direct_cost_total_diff, cs.direct_cost_total, '직접재료비 + 직접노무비'],
      ['4. 산재보험료 (노무비의 4.34%)', v1.industrial_accident_insurance, d.industrial_accident_insurance_diff, cs.industrial_accident_insurance.amount, cs.industrial_accident_insurance.description],
      ['5. 기타경비 (직접공사비의 5%)', v1.other_expenses, d.other_expenses_diff, cs.other_expenses.amount, cs.other_expenses.description],
      ['6. 순공사원가 (3+4+5)', v1.net_construction_cost, d.net_construction_cost_diff, cs.net_construction_cost, '직접공사비 + 제경비 소계'],
      ['7. 일반관리비 (직접공사비의 6%)', v1.general_admin_fee, d.general_admin_fee_diff, cs.general_admin_fee.amount, cs.general_admin_fee.description],
      ['8. 기업이윤 (순공사원가의 10%)', v1.corporate_profit, d.corporate_profit_diff, cs.corporate_profit.amount, cs.corporate_profit.description],
      ['9. 총원가 (6+7+8)', v1.total_cost, d.total_cost_diff, cs.total_cost, '단수조정 전 산출 총원가'],
      ['10. 단수조정 (십만단위 절삭)', v1.rounding_adjustment, d.rounding_adjustment_diff, cs.rounding_adjustment, `최초 ${fmtKRW(v1.rounding_adjustment)} + 추가분 ${fmtKRW(d.rounding_adjustment_diff)}`],
      ['11. 최종 공급가액 (부가세 별도)', v1.final_supply_amount, d.final_supply_amount_diff, cs.final_supply_amount, `부가세(10%) ${fmtKRW(cs.vat_amount)} 포함 시 총액 ${fmtKRW(cs.final_total_with_vat)}`]
    ];

    const html = `
      <thead>
        <tr>
          <th>원가계산서 항목 (11행)</th>
          <th class="num">최초 계약 (v1)</th>
          <th class="num">추가·정정 증감</th>
          <th class="num">최종 확정 (v5)</th>
          <th>산출 기준 및 비고</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(([label, rV1, rDiff, rV5, note], idx) => {
          const bold = idx === 2 || idx === 5 || idx === 10 ? 'font-weight:800;' : '';
          const diffSign = rDiff > 0 ? `+${fmtKRW(rDiff)}` : fmtKRW(rDiff);
          return `<tr style="${bold}">
            <td>${esc(label)}</td>
            <td class="num mono">${fmtKRW(rV1)}</td>
            <td class="num mono">${esc(diffSign)}</td>
            <td class="num mono">${fmtKRW(rV5)}</td>
            <td style="font-size:12px; color:var(--text-secondary);">${esc(note)}</td>
          </tr>`;
        }).join('')}
      </tbody>`;

    if (t1) t1.innerHTML = html;
    if (t2) t2.innerHTML = html;
  }

  /* ---------- 6. Tab 2: Changes, Options & Local Extension Slot (#panel-changes) ---------- */
  function renderLocalExtensionSlot() {
    const slot = $('local-extension-slot');
    if (!slot) return;
    if (state.mode === 'work' || studioExtensions.length === 0) {
      slot.innerHTML = '';
      return;
    }
    studioExtensions.forEach(ext => ext.renderChangesSlot?.(slot, DB.itemsById, announce));
  }

  function renderCountertopCompare() {
    const body = $('countertop-compare-body');
    if (!body) return;

    if (state.mode === 'work') {
      body.innerHTML = `<div style="padding:12px; background:var(--bg-canvas); border-radius:4px; border:1px solid var(--border-subtle);">
        <strong>[확정 사양] 한화 칸스톤 에덴그레이 (엔지니어드 스톤 12T)</strong>
        <p style="margin:6px 0 0; font-size:13px; color:var(--text-secondary);">
          싱크대 상판 · 주방 벽체(미드웨이) · 카페장(DP장) 상판 · 공용/안방 욕실 젠다이 일체 적용. 백조 깜보르떼 860 사각 싱크볼 언더마운트 타공 및 ELAG 3구 하이라이트(타공 560×490mm) 타공 필수.
        </p>
      </div>`;
      return;
    }

    const cs5 = DB.qV5?.cost_summary || {};
    const cs4 = DB.qMarble?.cost_summary || {};
    const item5 = (DB.qV5?.items || []).find(it => it.id === '2-h-12');
    const item4 = (DB.qMarble?.items || []).find(it => it.id === '2-h-12');
    const mat5 = item5?.price?.total_cost || 0;
    const mat4 = item4?.price?.total_cost || 0;
    const supply5 = cs5.final_supply_amount || 0;
    const supply4 = cs4.final_supply_amount || 0;
    const total5 = cs5.final_total_with_vat || 0;
    const total4 = cs4.final_total_with_vat || 0;

    body.innerHTML = `<div class="table-wrapper">
      <table class="studio-table" aria-label="주방 상판 2안 비교 표">
        <thead>
          <tr>
            <th>비교 항목</th>
            <th>1안 · 한화 칸스톤 에덴그레이 (v5 최종 확정 ★)</th>
            <th>2안 · 한화 하이막스 오로라 인조대리석 (v4 비교안)</th>
            <th class="num">비교 편차 (1안 − 2안)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>상판 · 미드웨이 자재비 (2-h-12)</strong></td>
            <td class="mono num"><strong>${fmtKRW(mat5)}</strong> (11/05 최종 확정)</td>
            <td class="mono num">${fmtKRW(mat4)} (인조대리석 오로라 블랑)</td>
            <td class="mono num">+${fmtKRW(mat5 - mat4)}</td>
          </tr>
          <tr>
            <td><strong>공급가액 합계 (부가세 별도)</strong></td>
            <td class="mono num"><strong>${fmtKRW(supply5)}</strong></td>
            <td class="mono num">${fmtKRW(supply4)}</td>
            <td class="mono num">+${fmtKRW(supply5 - supply4)}</td>
          </tr>
          <tr>
            <td><strong>최종 총액 (부가세 10% 포함)</strong></td>
            <td class="mono num"><strong>${fmtKRW(total5)}</strong></td>
            <td class="mono num">${fmtKRW(total4)}</td>
            <td class="mono num">+${fmtKRW(total5 - total4)}</td>
          </tr>
        </tbody>
      </table>
    </div>`;
  }

  function renderTimelineAndHighlights() {
    const tlGrid = $('timelineGrid');
    if (tlGrid) {
      if (state.mode === 'work' || !DB.qV5) {
        tlGrid.innerHTML = '';
      } else {
        const cs5 = DB.qV5.cost_summary || {};
        const v1 = cs5.base_v1_summary || {};
        const cs4 = DB.qMarble?.cost_summary || {};
        const v1Total = v1.final_total_with_vat || 0;
        const v1Supply = v1.final_supply_amount || 0;
        const v4Total = cs4.final_total_with_vat || 0;
        const v4Supply = cs4.final_supply_amount || 0;
        const v5Total = cs5.final_total_with_vat || 0;
        const v5Supply = cs5.final_supply_amount || 0;
        const v2Total = v1Total + (v1Total ? (v5Total - v4Total > 0 ? Math.round((v5Total - v4Total) / 8.8) : 0) : 0);
        const v3Supply = v5Supply + Math.round((v5Supply - v4Supply) * 0.375);
        const v3Total = Math.round(v3Supply * 1.1);

        const tlSub = $('timeline-section-subtitle');
        if (tlSub) {
          tlSub.textContent = `08/18 최초계약(${fmtKRW(v1Total)}) → 10/13 2차 → 11/03 가견적 2안 → 11/05 최종확정(${fmtKRW(v5Total)})`;
        }

        const steps = [
          { ver: 'v1 · 08/18 최초계약', total: fmtKRW(v1Total), supply: `공급가 ${fmtKRW(v1Supply)}`, desc: '주방 필름 리폼 · 욕실 바닥 난방 연장 포함 기본안' },
          { ver: 'v2 · 10/13 도기·레이아웃', total: fmtKRW(v2Total), supply: '위생도기 사양 업그레이드', desc: '아메리칸스탠다드 웨이브R · 에떼르노 니켈 수전 반영' },
          { ver: 'v3 · 11/03 칸스톤 가견적', total: fmtKRW(v3Total), supply: `공급가 ${fmtKRW(v3Supply)}`, desc: '주방 전면 신설 · 거실 중창/터닝도어 · 칸스톤 1차안' },
          { ver: 'v4 · 11/03 인조대리석 대안', total: fmtKRW(v4Total), supply: `공급가 ${fmtKRW(v4Supply)}`, desc: '하이막스 오로라 적용 시 비교 대안' },
          { ver: 'v5 · 11/05 최종확정 ★', total: fmtKRW(v5Total), supply: `공급가 ${fmtKRW(v5Supply)}`, desc: '칸스톤 에덴그레이 확정 · 싱크볼 고객지급 · 수전 중복 취소', current: true }
        ];
        tlGrid.innerHTML = steps.map(s => `
          <article class="timeline-step${s.current ? ' is-current' : ''}">
            <div class="timeline-ver">${esc(s.ver)}</div>
            <div class="timeline-total">${esc(s.total)}</div>
            <div class="mono" style="font-size:11.5px; color:var(--text-secondary);">${esc(s.supply)}</div>
            <p style="margin:6px 0 0; font-size:12px; color:var(--text-secondary);">${esc(s.desc)}</p>
          </article>`).join('');
      }
    }

    const hlEl = $('changeHighlights');
    if (hlEl && DB.site?.CHANGE_HIGHLIGHTS) {
      hlEl.innerHTML = DB.site.CHANGE_HIGHLIGHTS.map(h => {
        const cleanNote = stripWorkPriceText(h.note.replace(/<[^>]+>/g, ''));
        const pills = (h.itemIds || []).slice(0, 6).map(id =>
          `<button type="button" class="jump-pill-btn" data-jump-item="${esc(id)}">${esc(id)} ↘</button>`
        ).join('');
        return `<article class="highlight-card">
          <h3 style="margin:0 0 6px; font-size:14px; font-weight:800;">${esc(stripWorkPriceText(h.title))}</h3>
          <p style="margin:0 0 10px; font-size:12.5px; color:var(--text-secondary);">${esc(cleanNote)}</p>
          <div style="display:flex; gap:5px; flex-wrap:wrap;">${pills}</div>
        </article>`;
      }).join('');
    }
  }

  function renderChangedItemsTable() {
    const tbl = $('diffTable');
    const sub = $('changed-items-subtitle');
    if (!tbl || !DB.qV5) return;

    const { changed, counts } = getDiffCounts();

    if (sub) {
      sub.textContent = `신규 추가 ${counts.added}건 · 사양·물량 변경 ${counts.modified}건 · 취소·일부공제 ${counts.cancelled}건 · 고객 직접구매 ${counts.supplied}건`;
    }

    const labelMap = {
      all: `전체 (${counts.all})`,
      added: `[+ 추가] ▲ (${counts.added})`,
      modified: `[~ 변경] ◆ (${counts.modified})`,
      cancelled: `[− 취소] ▼ (${counts.cancelled})`,
      supplied: `[★ 고객지급] (${counts.supplied})`
    };
    document.querySelectorAll('#diff-filter-group [data-diff-filter]').forEach(btn => {
      const k = btn.getAttribute('data-diff-filter');
      if (labelMap[k]) btn.textContent = labelMap[k];
    });

    const searchCtx = expandSearchTokens(state.q);
    const rows = changed.filter(it => {
      const k = getItemStatusKind(it);
      if (state.diffFilter !== 'all' && k !== state.diffFilter) return false;
      if (state.room !== '전체' && !itemMatchesRoom(it, state.room)) return false;
      if (!itemMatchesSearch(it, searchCtx)) return false;
      return true;
    });

    const isWork = state.mode === 'work';
    tbl.innerHTML = `
      <thead>
        <tr>
          <th>상태 배지</th>
          <th>코드 · 품목명</th>
          <th>변경 사양 · 시공 지시</th>
          <th class="num">수량 · 단위</th>
          ${isWork ? '<th>적용 공간</th>' : '<th class="num">확정 금액 (v5)</th>'}
        </tr>
      </thead>
      <tbody>
        ${rows.map(it => {
          const k = getItemStatusKind(it);
          const cls = k === 'cancelled' ? 'quote-row is-cancelled is-cancelled-row' : 'quote-row';
          const note = stripWorkPriceText(it.note_raw || it.inference_note || it.material || '');
          return `<tr class="${cls}">
            <td data-label="상태">${renderStatusBadge(k)}</td>
            <td data-label="품목">
              <button type="button" class="jump-pill-btn" data-jump-item="${esc(it.id)}">${esc(it.id)}</button>
              <strong class="item-name-text" style="margin-left:6px;">${esc(it.task)}</strong>
            </td>
            <td data-label="사양 · 변경내용" style="font-size:12.5px;">${esc(note)}</td>
            <td data-label="수량" class="num mono">${fmtNum(it.quantity)} ${esc(it.unit)}</td>
            ${isWork
              ? `<td data-label="공간">${esc((it.rooms || []).join(' · '))}</td>`
              : `<td data-label="확정 금액" class="num mono" style="font-weight:700;">${fmtKRW(it.price?.total_cost)}</td>`}
          </tr>`;
        }).join('')}
      </tbody>`;
  }

  /* ---------- 7. Tab 3: 32-Day Schedule & D-Day (#panel-schedule) ---------- */
  function renderScheduleTab() {
    const briefEl = $('todayBriefing');
    const ganttEl = $('ganttChart');
    if (!briefEl || !ganttEl || !DB.site) return;

    const phases = DB.site.CONSTRUCTION_SCHEDULE_PHASES || [];
    const totalDays = Math.max(...phases.map(p => (p.startOffset || 0) + (p.spanDays || 0)), 33);
    const sim = new Date(`${state.simDate}T09:00:00`);
    const start = new Date('2026-11-02T09:00:00');
    const dayOffset = Math.floor((sim - start) / (1000 * 60 * 60 * 24));

    let activePhase = phases.find(p => dayOffset >= p.startOffset && dayOffset < p.startOffset + p.spanDays);
    if (!activePhase) {
      if (dayOffset < 0) {
        activePhase = phases[0];
      } else if (dayOffset >= totalDays) {
        activePhase = phases[phases.length - 1];
      } else {
        activePhase = [...phases].reverse().find(p => dayOffset >= p.startOffset) || phases[0];
      }
    }
    const nextPhase = phases.find(p => p.startOffset > (activePhase?.startOffset ?? 0)) || phases[phases.length - 1];

    briefEl.innerHTML = `
      <article class="dday-card">
        <span class="kpi-label">기준일 (${esc(state.simDate)}) 진행 단계</span>
        <strong style="font-size:15px; display:block; margin:4px 0;">Phase ${esc(activePhase.phaseNo)} · ${esc(activePhase.tradeName)}</strong>
        <p style="margin:0; font-size:12.5px; color:var(--text-secondary);">${esc(stripWorkPriceText(activePhase.workDetails))}</p>
      </article>
      <article class="dday-card">
        <span class="kpi-label">다음 예정 공정 (${esc(nextPhase.period)})</span>
        <strong style="font-size:15px; display:block; margin:4px 0;">Phase ${esc(nextPhase.phaseNo)} · ${esc(nextPhase.tradeName)}</strong>
        <p style="margin:0; font-size:12.5px; color:var(--text-secondary);">${esc(stripWorkPriceText(nextPhase.workDetails))}</p>
      </article>
      <article class="dday-card">
        <span class="kpi-label">현장 주요 점검 · 반입 · 입주 일정 (11/26 갱신)</span>
        <strong style="font-size:15px; display:block; margin:4px 0;">11/27 도기·전기 + 블라인드 미팅 · 11/30 상판/싱크볼·중문·건조대 · 12/07 입주</strong>
        <p style="margin:0; font-size:12.5px; color:var(--text-secondary);">11/24 퍼티 완전 건조 후 11/25-26 도배 및 가구 마무리 · 11/27(금) 오후 하루라온 커튼/블라인드 현장 미팅 · 11/30(월) 주방 칸스톤 상판·깜보르떼 싱크볼 최종 설치 및 10:30 발코니 LED 전동 빨래건조대 설치 · 12/03 항균 바이오 실리콘 마감</p>
      </article>`;

    ganttEl.innerHTML = `<div class="table-wrapper">
      <table class="studio-table is-responsive-stack" aria-label="10대 공정 일정표">
        <thead>
          <tr>
            <th>단계</th>
            <th>일자 · 기간</th>
            <th>핵심 공정 및 타임바 (${totalDays}일 기준)</th>
            <th>관련 공간</th>
            <th>세부 작업 지시</th>
          </tr>
        </thead>
        <tbody>
          ${phases.map(p => {
            const isRoomMatch = state.room === '전체' || (p.rooms || []).includes(state.room) || (p.rooms || []).includes('전체');
            const isCurrent = p.phaseNo === activePhase.phaseNo;
            const leftPct = Math.min(92, Math.max(0, Math.round((p.startOffset / totalDays) * 100)));
            const widthPct = Math.max(6, Math.round((p.spanDays / totalDays) * 100));
            return `<tr style="opacity:${isRoomMatch ? '1' : '0.42'}; ${isCurrent ? 'background:var(--bg-selected);' : ''}">
              <td data-label="단계" class="mono"><strong>Phase ${esc(p.phaseNo)}</strong></td>
              <td data-label="기간" class="mono">${esc(p.period)} (${p.days}일)</td>
              <td data-label="공정명">
                <div style="font-weight:700; margin-bottom:4px;">${esc(p.tradeName)}</div>
                <div style="height:8px; background:var(--border-subtle); border-radius:99px; position:relative; overflow:hidden;">
                  <div style="position:absolute; left:${leftPct}%; width:${widthPct}%; top:0; bottom:0; background:var(--accent-primary); border-radius:99px;"></div>
                </div>
              </td>
              <td data-label="공간"><span class="status-badge">${esc((p.rooms || []).join(' · '))}</span></td>
              <td data-label="세부 작업" style="font-size:12.5px; color:var(--text-secondary);">${esc(stripWorkPriceText(p.workDetails))}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
  }

  /* ---------- 8. Tab 4: Appliances, Materials & Media (#panel-specs) ---------- */
  function renderSpecsTab() {
    const searchCtx = expandSearchTokens(state.q);
    const appTbl = $('applianceTable');
    if (appTbl && DB.site?.APPLIANCE_CHECKS?.rows) {
      const appRows = DB.site.APPLIANCE_CHECKS.rows.filter(r => {
        if (!searchCtx.raw) return true;
        const hay = `${r.appliance} ${r.model} ${r.check} ${(r.itemIds || []).join(' ')}`.toLowerCase();
        return searchCtx.keywords.some(kw => hay.includes(kw));
      });
      appTbl.innerHTML = `
        <thead>
          <tr>
            <th>가전 품목</th>
            <th>모델명</th>
            <th class="num">본체 규격 (W×H×D mm)</th>
            <th>개구부 · 반입 경로 · 전열 체크사항</th>
            <th>연동 내역</th>
          </tr>
        </thead>
        <tbody>
          ${appRows.map(r => {
            const jumps = (r.itemIds || []).map(id =>
              `<button type="button" class="jump-pill-btn" data-jump-item="${esc(id)}">${esc(id)} ↘</button>`
            ).join(' ');
            return `<tr>
              <td data-label="가전 품목"><strong>${esc(r.appliance)}</strong></td>
              <td data-label="모델명" style="font-size:12.5px;">${esc(r.model)}</td>
              <td data-label="규격(W×H×D)" class="num mono">${r.w} × ${r.h} × ${r.d} mm</td>
              <td data-label="체크사항" style="font-size:12.5px; color:var(--text-secondary);">${esc(stripWorkPriceText(r.check))}</td>
              <td data-label="연동 내역">${jumps || '-'}</td>
            </tr>`;
          }).join('')}
        </tbody>`;
    }

    const matGrid = $('materialSpecGrid');
    if (matGrid && DB.site?.FINAL_MATERIAL_SPEC_SHEET) {
      const sections = DB.site.FINAL_MATERIAL_SPEC_SHEET.filter(sec => {
        const roomOk = state.room === '전체' || (sec.roomIds || []).includes(state.room) || sec.roomId === state.room || sec.isGlobalCommon;
        if (!roomOk) return false;
        if (!searchCtx.raw) return true;
        const hay = `${sec.section} ${(sec.roomIds || [sec.roomId]).join(' ')} ${(sec.specs || []).map(s => `${s.label} ${s.code} ${s.model} ${s.note}`).join(' ')}`.toLowerCase();
        return searchCtx.keywords.some(kw => hay.includes(kw));
      });
      matGrid.innerHTML = sections.map(sec => `
        <article class="highlight-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <h3 style="margin:0; font-size:14px; font-weight:800;">${esc(sec.section)}</h3>
            <span class="status-badge">${esc((sec.roomIds || [sec.roomId]).join(' · '))}</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:8px;">
            ${(sec.specs || []).map(sp => `
              <div style="border-top:1px solid var(--border-subtle); padding-top:6px;">
                <div style="display:flex; justify-content:space-between; gap:8px;">
                  <strong style="font-size:13px;">${esc(sp.label)}</strong>
                  <span class="mono" style="font-size:12px; color:var(--accent-primary);">${esc(sp.code)}</span>
                </div>
                <div style="font-size:12.5px; font-weight:600; margin-top:2px;">${esc(sp.model)}</div>
                <div style="font-size:12px; color:var(--text-secondary); margin-top:2px;">${esc(stripWorkPriceText(sp.note))}</div>
              </div>`).join('')}
          </div>
        </article>`).join('');
    }

    const renderGal = $('renderGallery');
    if (renderGal && DB.site?.ROOM_3D_RENDERINGS) {
      const renders = DB.site.ROOM_3D_RENDERINGS.filter(r => state.room === '전체' || r.roomId === state.room);
      renderGal.innerHTML = renders.map((r, idx) => `
        <article class="gallery-card">
          <img src="${esc(r.src)}" alt="${esc(r.title)}" class="gallery-img" loading="lazy" style="cursor:pointer;" tabindex="0" role="button" data-lightbox-src="${esc(r.src)}" data-lightbox-group="render" data-lightbox-idx="${idx}">
          <div class="gallery-body">
            <span class="status-badge is-supplied">${esc(r.roomLabel)}</span>
            <h3 class="gallery-title">${esc(r.title)}</h3>
            <p class="gallery-desc">${esc(r.desc)}</p>
          </div>
        </article>`).join('');
    }
  }

  /* ---------- 9. Bidirectional Jump & Flash ---------- */
  function setViewTab(tabId) {
    state.viewTab = tabId;
    document.querySelectorAll('[data-view-tab]').forEach(btn => {
      const active = btn.getAttribute('data-view-tab') === tabId;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
      btn.setAttribute('tabindex', active ? '0' : '-1');
    });
    ['scope', 'changes', 'schedule', 'specs'].forEach(k => {
      const p = $(`panel-${k}`);
      if (p) p.hidden = k !== tabId;
    });
    syncUrlHash();
  }

  function jumpToItem(itemId) {
    if (!itemId) return;
    setViewTab('scope');

    let row = $(`item-row-${itemId}`);
    if (!row) {
      // Clear room/trade/search filters so the target item is guaranteed to render
      state.room = '전체';
      state.trade = 'all';
      state.q = '';
      if ($('q')) $('q').value = '';
      refreshAll();
      row = $(`item-row-${itemId}`);
    }
    if (!row) return;

    const parentFold = row.closest('details.fold');
    if (parentFold) parentFold.open = true;

    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (row.scrollIntoView) {
      row.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    }
    row.classList.remove('is-flashing');
    void row.offsetWidth;
    row.classList.add('is-flashing');
    setTimeout(() => row.classList.remove('is-flashing'), 1800);

    const it = DB.itemsById.get(itemId);
    if (it) announce(`품목 ${itemId} (${it.task}) 행으로 이동했습니다.`);
  }
  window.jumpToItem = jumpToItem;

  /* ---------- 10. Accessible Lightbox (<dialog>) ---------- */
  function openLightbox(group, idx, initialSlideOffset = 0) {
    const dlg = $('studio-lightbox');
    if (!dlg) return;
    if (group === 'thermal') {
      state.lightboxList = (window.StudioStage?.THERMAL_CUTS || []).map(t => ({
        src: t.src, title: `${t.title} (${t.temp})`, desc: t.desc
      }));
    } else if (group === 'shop') {
      const shops = window.StudioStage?.SHOP_DRAWINGS || [];
      const selected = shops[idx] || shops[0];
      if (selected) {
        const slides = [{
          src: selected.src,
          title: `[11/17 확정 제작도면] ${selected.title}`,
          desc: `${selected.dims} · ${stripWorkPriceText(selected.specSummary)}`
        }];
        // Add matching 3D renders right after the shop drawing so next/prev compares Drawing <-> 3D Render!
        (selected.renders || []).forEach((rSrc, rIdx) => {
          const rMeta = (DB.site?.ROOM_3D_RENDERINGS || []).find(item => item.src === rSrc);
          slides.push({
            src: rSrc,
            title: rMeta ? `[3D 시안 대조] ${rMeta.title}` : `[3D 시안 #${rIdx + 1}] ${selected.roomId}`,
            desc: rMeta ? rMeta.desc : selected.dims
          });
        });
        // Append remaining shop drawings so user can also browse all 5 sheets
        shops.forEach((other, oIdx) => {
          if (oIdx !== idx) {
            slides.push({
              src: other.src,
              title: `[11/17 확정 제작도면] ${other.title}`,
              desc: `${other.dims} · ${stripWorkPriceText(other.specSummary)}`
            });
          }
        });
        state.lightboxList = slides;
        idx = Math.max(0, Number(initialSlideOffset) || 0);
      }
    } else {
      const renders = (DB.site?.ROOM_3D_RENDERINGS || []).filter(r => state.room === '전체' || r.roomId === state.room);
      state.lightboxList = renders.map(r => ({ src: r.src, title: r.title, desc: r.desc }));
    }
    if (!state.lightboxList.length) return;
    state.lightboxIdx = Math.max(0, Math.min(idx, state.lightboxList.length - 1));
    updateLightboxSlide();
    if (typeof dlg.showModal === 'function') dlg.showModal();
    else dlg.setAttribute('open', 'open');
  }

  function updateLightboxSlide() {
    const item = state.lightboxList[state.lightboxIdx];
    if (!item) return;
    if ($('lightbox-title')) $('lightbox-title').textContent = item.title;
    if ($('lightbox-img')) {
      $('lightbox-img').src = item.src;
      $('lightbox-img').alt = item.title;
    }
    if ($('lightbox-caption')) $('lightbox-caption').textContent = item.desc;
    if ($('lightbox-counter')) $('lightbox-counter').textContent = `${state.lightboxIdx + 1} / ${state.lightboxList.length}`;
  }

  /* ---------- Refresh All Views ---------- */
  function refreshAll() {
    updateModeUI();
    renderKpiStrip();
    renderRoomFilterBar();
    renderTradeFilterBar();
    renderScopeTab();
    renderLocalExtensionSlot();
    renderCountertopCompare();
    renderTimelineAndHighlights();
    renderChangedItemsTable();
    renderScheduleTab();
    renderSpecsTab();
    setViewTab(state.viewTab);
    if (window.StudioStage) {
      window.StudioStage.syncRoom(state.room, DB.site);
    }
    syncUrlHash();
  }

  /* ---------- Global Event Listeners ---------- */
  function bindAppEvents() {
    // Theme Switcher
    const themeBtn = $('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', state.theme);
        const isDark = state.theme === 'dark';
        themeBtn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
        const lbl = $('theme-toggle-label');
        if (lbl) lbl.textContent = isDark ? '☾ 현장 암실 (고대비)' : '☀ 주간 포세린';
        announce(isDark ? '현장 암실 고대비 다크 테마로 전환되었습니다.' : '주간 포세린 라이트 테마로 전환되었습니다.');
      });
    }

    // Search Input & Shortcut '/' (Filters across Scope, Diff & Specs + Live Announcer)
    const qInput = $('q');
    const qClear = $('q-clear');
    const applySearchQuery = () => {
      renderScopeTab();
      renderChangedItemsTable();
      renderSpecsTab();
      syncUrlHash();
      clearTimeout(searchAnnounceTimer);
      searchAnnounceTimer = setTimeout(() => {
        const directCount = document.querySelectorAll('#quoteContainer tr[data-item-id]').length;
        if (state.q) {
          announce(`'${state.q}' 검색 결과, 직결 품목 ${directCount}건이 표시됩니다.`);
        } else {
          announce(`검색어가 지워졌습니다. 전체 ${directCount}건이 표시됩니다.`);
        }
      }, 150);
    };
    if (qInput) {
      qInput.addEventListener('input', () => {
        state.q = qInput.value;
        if (qClear) qClear.hidden = !state.q;
        applySearchQuery();
      });
    }
    if (qClear) {
      qClear.addEventListener('click', () => {
        state.q = '';
        if (qInput) { qInput.value = ''; qInput.focus(); }
        qClear.hidden = true;
        applySearchQuery();
      });
    }
    document.addEventListener('keydown', e => {
      if (e.key === '/' && document.activeElement !== qInput && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        qInput?.focus();
      }
    });

    // Room Filter Bar
    const roomList = $('room-chip-list');
    if (roomList) {
      roomList.addEventListener('click', e => {
        const chip = e.target.closest('[data-room-id]');
        if (!chip) return;
        state.room = chip.getAttribute('data-room-id');
        refreshAll();
        announce(`${state.room} 공간 필터가 적용되었습니다.`);
      });
    }
    $('room-reset-btn')?.addEventListener('click', () => {
      state.room = '전체';
      refreshAll();
      announce('전체 공간 보기로 초기화되었습니다.');
    });

    // View Tabs & Roving Tabindex
    const viewTabs = Array.from(document.querySelectorAll('[data-view-tab]'));
    viewTabs.forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        setViewTab(btn.getAttribute('data-view-tab'));
      });
      btn.addEventListener('keydown', e => {
        let nextIdx = -1;
        if (e.key === 'ArrowRight') nextIdx = (idx + 1) % viewTabs.length;
        else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + viewTabs.length) % viewTabs.length;
        else if (e.key === 'Home') nextIdx = 0;
        else if (e.key === 'End') nextIdx = viewTabs.length - 1;
        if (nextIdx >= 0) {
          e.preventDefault();
          const target = viewTabs[nextIdx];
          setViewTab(target.getAttribute('data-view-tab'));
          target.focus();
        }
      });
    });

    // Trade Filter Chips
    $('tradeFilter')?.addEventListener('click', e => {
      const chip = e.target.closest('[data-trade-code]');
      if (!chip) return;
      state.trade = chip.getAttribute('data-trade-code');
      renderTradeFilterBar();
      renderScopeTab();
      syncUrlHash();
    });

    // Diff Filter Group
    $('diff-filter-group')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-diff-filter]');
      if (!btn) return;
      state.diffFilter = btn.getAttribute('data-diff-filter');
      document.querySelectorAll('[data-diff-filter]').forEach(b => {
        const active = b.getAttribute('data-diff-filter') === state.diffFilter;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      renderChangedItemsTable();
    });

    // Schedule Simulation Date
    const simInput = $('simDate');
    if (simInput) {
      simInput.value = state.simDate;
      simInput.addEventListener('change', () => {
        state.simDate = simInput.value || getDefaultSimDate();
        renderScheduleTab();
        renderKpiStrip();
      });
    }

    // Delegated Click & Keyboard for [data-jump-item], [data-lightbox-group], [data-toggle-detail], [data-focus-stage-room], [data-clear-filter]
    document.addEventListener('click', e => {
      const clearBtn = e.target.closest('[data-clear-filter]');
      if (clearBtn) {
        const kind = clearBtn.getAttribute('data-clear-filter');
        if (kind === 'room') state.room = '전체';
        if (kind === 'trade') state.trade = 'all';
        if (kind === 'q') {
          state.q = '';
          if (qInput) qInput.value = '';
          if (qClear) qClear.hidden = true;
        }
        refreshAll();
        return;
      }

      const detailBtn = e.target.closest('[data-toggle-detail]');
      if (detailBtn) {
        const itemId = detailBtn.getAttribute('data-toggle-detail');
        if (state.expandedItems.has(itemId)) state.expandedItems.delete(itemId);
        else state.expandedItems.add(itemId);
        renderScopeTab();
        return;
      }

      const stageRoomBtn = e.target.closest('[data-focus-stage-room]');
      if (stageRoomBtn) {
        const roomId = stageRoomBtn.getAttribute('data-focus-stage-room') || '전체';
        state.room = roomId;
        refreshAll();
        announce(`도면 스테이지를 ${roomId} 구역으로 이동했습니다.`);
        return;
      }

      const jumpBtn = e.target.closest('[data-jump-item]');
      if (jumpBtn) {
        jumpToItem(jumpBtn.getAttribute('data-jump-item'));
        return;
      }
      const lbImg = e.target.closest('[data-lightbox-group]');
      if (lbImg) {
        openLightbox(lbImg.getAttribute('data-lightbox-group'), Number(lbImg.getAttribute('data-lightbox-idx') || 0));
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        const lbImg = e.target.closest('[data-lightbox-group]');
        if (lbImg && lbImg.tagName !== 'BUTTON') {
          e.preventDefault();
          openLightbox(lbImg.getAttribute('data-lightbox-group'), Number(lbImg.getAttribute('data-lightbox-idx') || 0));
        }
      }
    });

    // Lightbox Controls
    $('lightbox-close-btn')?.addEventListener('click', () => {
      const dlg = $('studio-lightbox');
      if (dlg?.close) dlg.close();
      else dlg?.removeAttribute('open');
    });
    $('lightbox-prev-btn')?.addEventListener('click', () => {
      if (!state.lightboxList.length) return;
      state.lightboxIdx = (state.lightboxIdx - 1 + state.lightboxList.length) % state.lightboxList.length;
      updateLightboxSlide();
    });
    $('lightbox-next-btn')?.addEventListener('click', () => {
      if (!state.lightboxList.length) return;
      state.lightboxIdx = (state.lightboxIdx + 1) % state.lightboxList.length;
      updateLightboxSlide();
    });
  }

  /* ---------- Bootstrap (Encrypted Owner / Zero-Price Work / Local Dev) ---------- */
  async function fetchJsonSafe(url) {
    if (unlockedBundle) {
      const key = url.replace(/^\.\//, '');
      return unlockedBundle[key] || null;
    }
    try {
      const res = await fetch(url, { cache: 'no-store' });
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  }

  async function decryptBundle(enc, password) {
    const bytes = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: bytes(enc.salt), iterations: enc.iter, hash: 'SHA-256' },
      base,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes(enc.iv) }, key, bytes(enc.ct));
    return JSON.parse(new TextDecoder().decode(plain));
  }

  async function unlockIfEncrypted() {
    let res;
    try {
      res = await fetch(ENCRYPTED_DATA_FILE, { cache: 'no-store' });
    } catch {
      return;
    }
    if (!res.ok) return;
    const enc = await res.json();
    const saved = localStorage.getItem(PASSWORD_KEY) || sessionStorage.getItem(PASSWORD_KEY);
    if (saved) {
      try {
        unlockedBundle = await decryptBundle(enc, saved);
        return;
      } catch {
        localStorage.removeItem(PASSWORD_KEY);
        sessionStorage.removeItem(PASSWORD_KEY);
      }
    }
    document.body.classList.add('locked');
    const sub = $('header-subtitle');
    if (sub) sub.textContent = '비밀번호를 입력하면 계약 내역서가 열립니다.';
    $('unlockPassword')?.focus();
    await new Promise(resolve => {
      $('unlockForm')?.addEventListener('submit', async e => {
        e.preventDefault();
        const errEl = $('unlockError');
        if (errEl) errEl.textContent = '';
        const password = $('unlockPassword')?.value || '';
        try {
          unlockedBundle = await decryptBundle(enc, password);
        } catch {
          if (errEl) errEl.textContent = '비밀번호가 맞지 않습니다.';
          return;
        }
        ($('unlockRemember')?.checked ? localStorage : sessionStorage).setItem(PASSWORD_KEY, password);
        if ($('unlockPassword')) $('unlockPassword').value = '';
        document.body.classList.remove('locked');
        if (sub) sub.textContent = '내역서를 불러오는 중…';
        resolve();
      });
    });
  }

  async function loadLocalExtension() {
    if (state.mode === 'work' || unlockedBundle) return;
    try {
      const res = await fetch(LOCAL_EXTENSION_FILE, { cache: 'no-store' });
      if (!res.ok) return;
      const tag = document.createElement('script');
      tag.textContent = await res.text();
      document.body.appendChild(tag);
      await Promise.all(studioExtensions.map(ext => ext.ready));
    } catch {
      // 배포본에는 없는 파일이므로 무시한다
    }
  }

  async function checkThermalAvailable() {
    if (state.mode === 'work' || unlockedBundle) return false;
    try {
      const res = await fetch('./thermal_balcony1/01_living_floor_thermal.jpg', { method: 'HEAD', cache: 'no-store' });
      return res.ok;
    } catch {
      return false;
    }
  }

  async function boot() {
    readUrlHash();

    let hasThermal = false;

    if (state.mode === 'work') {
      const workBundle = await fetchJsonSafe(WORK_DATA_FILE);
      if (workBundle?.content && workBundle?.quote) {
        DB.site = workBundle.content;
        DB.qV5 = workBundle.quote;
      } else {
        // Fallback for local dev preview when work_data.json is not generated yet
        const [site, qV5] = await Promise.all([
          fetchJsonSafe('./site_content.json'),
          fetchJsonSafe('./hup_quote_2622105.json')
        ]);
        DB.site = site;
        DB.qV5 = qV5;
      }
    } else {
      await unlockIfEncrypted();
      const [site, qV5, qMarble, thermalOk] = await Promise.all([
        fetchJsonSafe('./site_content.json'),
        fetchJsonSafe('./hup_quote_2622105.json'),
        fetchJsonSafe('./hup_quote_2622103_marble.json'),
        checkThermalAvailable(),
        loadLocalExtension()
      ]);
      DB.site = site;
      DB.qV5 = qV5;
      DB.qMarble = qMarble;
      hasThermal = Boolean(thermalOk);
    }

    (DB.qV5?.items || []).forEach(it => DB.itemsById.set(it.id, it));

    if (window.StudioStage) {
      window.StudioStage.init(DB.site, {
        onSelectRoom(roomId) {
          state.room = state.room === roomId ? '전체' : roomId;
          refreshAll();
          announce(`${state.room} 공간이 선택되었습니다.`);
        },
        onJumpItem(itemId) {
          jumpToItem(itemId);
        },
        onOpenLightbox(group, idx, initialSlideOffset) {
          openLightbox(group, idx, initialSlideOffset);
        },
        announce
      }, { hasThermal });
    }

    bindAppEvents();
    refreshAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();

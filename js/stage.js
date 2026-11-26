/* HESSUP STUDIO — SpatialStage Controller (2D Zone Map, Full-Fidelity 1/60 CAD + Pin-to-Drawing, Large 3D Walk, Balcony 1 Thermal) */
(function () {
  const THERMAL_CUTS = [
    { id: 'TH-01', src: './thermal_balcony1/01_living_floor_thermal.jpg', title: '01 · 거실 확장부 바닥 난방 열화상', temp: '45.2℃', desc: '거실 확장부 XL 난방 배관 순환 열 분포 확인', roomId: '거실', items: ['1-c-03', '2-b-01'] },
    { id: 'TH-02', src: './thermal_balcony1/02_boiler_controller_wiring.jpg', title: '02 · 보일러 온도조절기 배선 점검', temp: '실온', desc: '거실 벽면 보일러 컨트롤러 배선 및 결선 상태 확인', roomId: '거실', items: ['1-c-03'] },
    { id: 'TH-03', src: './thermal_balcony1/03_heating_manifold_thermal.jpg', title: '03 · 싱크대 하부 난방 분배기 열화상', temp: '54.8℃', desc: '주방 싱크대 하부 온수 분배기 각 밸브 순환 온도 확인', roomId: '주방', items: ['1-c-03', '2-h-09'] },
    { id: 'TH-04', src: './thermal_balcony1/04_boiler_controller_58c.jpg', title: '04 · 보일러 가동 온도 58.6℃ 도달 확인', temp: '58.6℃', desc: '난방수 최고 가동 온도 58.6℃ 세팅 후 배관 추적 촬영', roomId: '발코니3(세탁실)', items: ['1-c-03'] },
    { id: 'TH-05', src: './thermal_balcony1/05_balcony1_corner_loop_left.jpg', title: '05 · 발코니1 좌측 코너 난방 루프', temp: '48.1℃', desc: '안방 발코니1 좌측 바닥 아래 통과하는 난방 코일 루프', roomId: '발코니1(안방)', items: ['1-c-03', '2-e-05'] },
    { id: 'TH-06', src: './thermal_balcony1/06_balcony1_corner_loop_right.jpg', title: '06 · 발코니1 우측 코너 난방 루프', temp: '47.9℃', desc: '발코니1 우측 코너 구간 바닥 매립 배관 열선 궤적', roomId: '발코니1(안방)', items: ['1-c-03', '2-e-05'] },
    { id: 'TH-07', src: './thermal_balcony1/07_balcony1_window_side_pipes_1.jpg', title: '07 · 발코니1 외창 측 바닥 배관 (1)', temp: '46.5℃', desc: '발코니1 외창(2-c-04) 하단 벽면 인접 배관 경로 (타일 덧방 주의)', roomId: '발코니1(안방)', items: ['2-e-05', '2-c-04'] },
    { id: 'TH-08', src: './thermal_balcony1/08_balcony1_inner_corner_pipes.jpg', title: '08 · 발코니1 내측 모서리 배관 분기', temp: '49.0℃', desc: '안방 분합창(2-c-03) 및 터닝도어(2-c-11) 인접 바닥 배관', roomId: '발코니1(안방)', items: ['2-c-11', '2-e-05'] },
    { id: 'TH-09', src: './thermal_balcony1/09_balcony1_to_living_pipes.jpg', title: '09 · 발코니1 → 거실 확장부 배관 연결부', temp: '51.2℃', desc: '터닝도어 하단 문턱 아래로 거실 확장부 난방관이 통과하는 핵심 구간', roomId: '발코니1(안방)', items: ['1-c-03', '2-c-11'] },
    { id: 'TH-10', src: './thermal_balcony1/10_balcony1_window_side_pipes_2.jpg', title: '10 · 발코니1 외창 측 바닥 배관 (2)', temp: '46.8℃', desc: '발코니1 전면 타일(66125) 시공 시 그라인더 커팅 깊이 주의 구간', roomId: '발코니1(안방)', items: ['2-e-05'] }
  ];

  // 11/17 Confirmed Furniture Shop Drawings (5 Sheets) + Balcony 1 Pin
  const SHOP_DRAWINGS = [
    {
      id: 'kitchen',
      pinLabel: '📐 주방 가구도면',
      title: '11/17 주방 상하부장 · 냉장고장 제작도면 (A3 1/30)',
      roomId: '주방',
      src: './shop_drawings/kitchen_cabinet.png',
      box: { x: 10061, y: 3000, w: 1641, h: 2799 },
      badgeX: 10880,
      badgeY: 4650,
      scale: 'A3 · 1/30 (2026-11-11 작성 / 11-17 확정)',
      dims: 'ㄱ자 싱크대 2,820 × 2,560 × H2,300mm · 냉장고장 W940 × H1,900 × D700-750mm',
      specSummary: '상부장 한솔 듀이클라우드 / 하부장·냉장고장 예림 딥오크 · 상판/미드웨이 한화 칸스톤 에덴그레이 · 상부장 하단 LED BAR 매립',
      checkPoints: [
        '빌트인 식기세척기(LG DUE6BGE) 좌측 끝 개구부 W600 × H818mm 및 걸레받이 H150mm 적용',
        '하부장 H880(걸레받이 150 + 도어 730) · 미드웨이 H620 · 상부장 H730 + 상부 몰딩 70',
        '싱크볼 백조 깜보르떼 860 언더마운트 · 주방 수전 슈티에 80127 니켈 · 하츠 침니후드 W900',
        '우측 냉장고장 개구부 W940 × H1,900 (LG 오브제 W823AAA472 W914×H1,860×D918 수납)'
      ],
      renders: [
        './img/Image_1DCD26FB-10C2-4D36-8E55-5EBBB0A8E097.png',
        './img/Image_535486A9-44FF-4EA5-BA16-4A36FBDD547C.png'
      ],
      items: ['2-h-08', '2-h-09', '2-h-10', '2-h-12', '2-h-13', '2-h-14', '2-h-15'],
      v3Idx: 4
    },
    {
      id: 'cafe',
      pinLabel: '📐 카페장 도면',
      title: '11/17 주방 카페장 (DP장) 제작도면 (A4 1/20)',
      roomId: '주방',
      src: './shop_drawings/cafe_cabinet.png',
      box: { x: 8321, y: 3000, w: 1400, h: 300 },
      badgeX: 9021,
      badgeY: 3150,
      scale: 'A4 · 1/20 (2026-11-11 작성 / 11-17 확정)',
      dims: '총 폭 W1,400 × 깊이 D300 × 높이 H2,300mm (3단 분할 × 4도어)',
      specSummary: '예림 딥오크 도어·바디 + 한화 칸스톤 에덴그레이 상판 + 오픈부 상단 LED BAR 매립',
      checkPoints: [
        '하부장 H900(걸레받이 100 + 도어 800) · 중앙 오픈 니치 H650 · 상부장 H750(도어 680 + 상부 몰딩 70)',
        '오픈부 깊이 D300: 소형 밥솥(3-6인용 D300 이하) 거치 가능, 10인용(D400 내외)은 앞 돌출 및 스팀 주의',
        '오픈부 벽면 콘센트(H1,800 표기 / 실장 확인) 및 상부장 하단 COB 간접조명 연동'
      ],
      renders: [
        './img/Image_0D6F704F-D75B-4336-A22C-2A9F68592ED3.png',
        './img/Image_D923CE41-9555-4FAA-A6C1-0F88D61F901D.png'
      ],
      items: ['2-h-11', '2-h-12'],
      v3Idx: 5
    },
    {
      id: 'living',
      pinLabel: '📐 거실 가구도면',
      title: '11/17 거실 무지주 선반 2단 · 하부 수납장 제작도면 (A4 1/20)',
      roomId: '거실',
      src: './shop_drawings/living_shelf.png',
      box: { x: 1350, y: 0, w: 2800, h: 320 },
      badgeX: 2650,
      badgeY: 220,
      scale: 'A4 · 1/20 (2026-11-12 작성 / 11-17 확정)',
      dims: '상부 선반 W2,600 × D200 × T50 (2단) · 하부 수납장 W1,425 × H650 × D300 · 우측 띠장 H1,236',
      specSummary: '예림 오크딥130 무지주 선반 2단 + 좌측 하부 4도어 수납장(예림 딥오크 몸통 + 듀이클라우드 40mm 라운드 알판) + 우측 오크딥 띠장 포인트',
      checkPoints: [
        '좌측 하부 수납장 W1,425 × H650 × D300 (걸레받이 H60 하단 LED BAR, 내부 조절 다보 선반, 블랙 1구·2구 손잡이)',
        '우측 하부 벽면 18×10 오크딥130 필름 띠장 마감 (수직 H1,236 · 수평 하단 250 / 250 간격)',
        '상부 무지주 선반 2단(각 W2,600 × D200 × 두께 50mm) + 선반 하단 10×10 LED BAR 간접조명'
      ],
      renders: [
        './img/Image_042A4155-89CF-47F5-8956-A54E0662B799.png',
        './img/Image_690D2D65-046F-4AAC-90F4-5DB1AE2D099E.png'
      ],
      items: ['2-h-02', '2-h-03', '2-a-01'],
      v3Idx: 3
    },
    {
      id: 'shoe_left',
      pinLabel: '📐 신발장 1 (좌)',
      title: '11/17 현관 왼쪽 신발장 (은경 거울도어 · 하부띄움) 제작도면 (A4 1/20)',
      roomId: '현관',
      src: './shop_drawings/shoe_left.png',
      box: { x: 4501, y: 0, w: 350, h: 1560 },
      badgeX: 4675,
      badgeY: 560,
      scale: 'A4 · 1/20 (2026-11-12 작성 / 11-17 확정)',
      dims: 'W1,560 × D355-375 · 몸통 H2,030 + 하부 띄움 H265 (총 H2,295mm)',
      specSummary: '4도어 (좌측 3짝 예림 듀이클라우드 · 우측 현관문 쪽 1짝 전신 은경 거울 도어) + 하부 띄움 H265 간접조명',
      checkPoints: [
        '현관문 쪽(도면 우측 끝) 도어 1짝 전신 은경(거울) 적용 · 나머지 3도어 예림 듀이클라우드 (thk18)',
        '내부 전 칸 이동식 선반 다보(높이 조절 가능) 시공 확정 (11/17 카톡 조율 완료)',
        '하부 띄움 H265mm 공간에 현관 센서 연동 간접조명 매립'
      ],
      renders: [
        './img/Image_3E7A9403-D90F-420E-81C6-93E6CE2C2343.png',
        './img/Image_0EF9CA83-BCC0-4ABA-84B7-6DABB20FFAAA.png'
      ],
      items: ['2-h-05', '1-b-13'],
      v3Idx: 3
    },
    {
      id: 'shoe_right',
      pinLabel: '📐 신발장 2 (우·벤치)',
      title: '11/17 현관 오른쪽 벤치형 신발장 · 우산꽂이 제작도면 (A4 1/20)',
      roomId: '현관',
      src: './shop_drawings/shoe_right.png',
      box: { x: 5852, y: 0, w: 348, h: 1560 },
      badgeX: 6026,
      badgeY: 1120,
      scale: 'A4 · 1/20 (2026-11-12 작성 / 11-17 확정)',
      dims: '총 폭 W1,560 (좌측 키큰장 W600 [띄움 350 + 몸통 2,030] + 우측 벤치장 W960) × D350mm',
      specSummary: '좌측 2도어 키큰장(예림 듀이클라우드 도어 + 오크딥 몸통 엣지) + 우측 오픈 벤치 시트(하부 H420 + 36T 오크딥 의자상판 + 등받이 H420 + 상부장)',
      checkPoints: [
        '우측 벤치 시트(W960): 하부장 H420 위 36T 오크딥 의자 상판(350×960) + 오크딥 의자 뒷판(420×960) + 상부장 구성',
        '우측 끝 칸(현관문 쪽) 하부에 우산꽂이 배치 및 내부 전 선반 이동식 다보 적용 (11/17 확정)',
        '좌측 키큰장(W600)은 하부 띄움 H350mm 적용'
      ],
      renders: [
        './img/Image_0EF9CA83-BCC0-4ABA-84B7-6DABB20FFAAA.png',
        './img/Image_3E7A9403-D90F-420E-81C6-93E6CE2C2343.png'
      ],
      items: ['2-h-05', '2-h-04', '2-e-03'],
      v3Idx: 3
    }
  ];

  // Map canonical roomId to CAD room names & 3D preset index
  const ROOM_CAD_MAP = {
    '전체': { cadNames: [], viewBox: [-1100, -1400, 13300, 10500], presetIdx: 0 },
    '거실': { cadNames: ['거실 (확장부 포함)', '복도'], viewBox: [-950, -400, 7200, 6400], presetIdx: 2 },
    '주방': { cadNames: ['주방 · 식당'], viewBox: [6000, 2500, 6200, 3700], presetIdx: 4 },
    '침실1': { cadNames: ['침실1'], viewBox: [-300, 4500, 5400, 4400], presetIdx: 6 },
    '침실2': { cadNames: ['침실2'], viewBox: [6100, -350, 3800, 3450], presetIdx: 8 },
    '침실3': { cadNames: ['침실3'], viewBox: [8000, 5700, 4050, 3100], presetIdx: 10 },
    '욕실1(공용)': { cadNames: ['욕실1'], viewBox: [6250, 5750, 2050, 3000], presetIdx: 0 },
    '욕실2(안방)': { cadNames: ['욕실2'], viewBox: [4750, 5750, 1800, 3000], presetIdx: 6 },
    '현관': { cadNames: ['현관'], viewBox: [4250, -1250, 2200, 3300], presetIdx: 3 },
    '발코니1(안방)': { cadNames: ['발코니1'], viewBox: [-350, 4500, 1650, 4300], presetIdx: 6 },
    '발코니3(세탁실)': { cadNames: ['발코니3 (세탁실)', '보일러실'], viewBox: [9400, -250, 2600, 3300], presetIdx: 1 },
    '반침': { cadNames: ['반침'], viewBox: [4700, 5600, 1800, 1400], presetIdx: 0 },
    '공용부': { cadNames: ['현관'], viewBox: [4250, -1250, 2200, 3300], presetIdx: 3 }
  };

  // Exact colors matching plan.html
  const LIGHT_COLORS = {
    DL51: '#d9480f',
    T3: '#1971c2',
    COB: '#2f9e44',
    WP75: '#0c8599',
    SPOT: '#9c36b5',
    RAIL: '#5f3dc4',
    D200: '#e67700',
    SENSOR: '#c2255c',
    PEND: '#a5532a',
    COVE: '#74a9e0'
  };

  const ELEC_COLORS = {
    STD: '#343a40',
    DED: '#c92a2a',
    AC: '#c92a2a',
    ID: '#c92a2a',
    DW: '#c92a2a',
    MM: '#c92a2a',
    CC: '#c92a2a',
    DM: '#c92a2a',
    WP: '#1864ab',
    SW: '#2b8a3e',
    LAN: '#862e9c',
    PANEL: '#495057'
  };

  const stageState = {
    submode: 'zone',
    expanded: false,
    userCollapsedExpand: false,
    hasThermal: false,
    activeRoom: '전체',
    activeShopPin: null,
    hangerPlan: 'B',
    layers: {
      shopPins: true,
      fixtures: true,
      elec: true,
      ldims: false,
      furniture: true,
      appliances: true,
      grid: false
    },
    measureMode: false,
    measurePts: [],
    vb: [-1100, -1400, 13300, 10500],
    plan3d: null,
    threeLoading: false
  };

  let appCallbacks = {
    onSelectRoom: () => {},
    onJumpItem: () => {},
    onOpenLightbox: () => {},
    onOpenCustomLightbox: () => {},
    announce: () => {}
  };

  function esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function fmt(n) {
    return Math.round(Number(n || 0)).toLocaleString('ko-KR');
  }

  function scrubWorkText(str) {
    return window.stripWorkPriceText ? window.stripWorkPriceText(str) : String(str ?? '');
  }

  function updateInspector(title, coordText, bodyHtml) {
    const tEl = document.getElementById('inspector-title');
    const cEl = document.getElementById('inspector-coord');
    const bEl = document.getElementById('inspector-body');
    if (tEl) tEl.textContent = scrubWorkText(title);
    if (cEl) cEl.textContent = scrubWorkText(coordText);
    if (bEl) bEl.innerHTML = bodyHtml;
  }

  function setStageExpanded(expanded) {
    stageState.expanded = Boolean(expanded);
    const ws = document.getElementById('main-workspace');
    const btn = document.getElementById('stage-expand-btn');
    if (ws) ws.classList.toggle('is-stage-expanded', stageState.expanded);
    if (btn) {
      btn.classList.toggle('is-active', stageState.expanded);
      btn.setAttribute('aria-pressed', stageState.expanded ? 'true' : 'false');
      btn.textContent = stageState.expanded ? '⤡ 좌우 분할로 복귀' : '⤢ 크게 보기';
    }
    if (stageState.plan3d) {
      setTimeout(() => stageState.plan3d.resize(), 60);
    }
  }

  /* ---------- Inspect a 11/17 Furniture Shop Drawing Pin ---------- */
  function inspectShopDrawing(pinId, openModal = false) {
    if (pinId === 'balcony1') {
      if (!stageState.hasThermal) return;
      stageState.activeShopPin = 'balcony1';
      updateInspector(
        '[열화상 점검] 발코니1 바닥 XL 난방배관 10컷',
        '최고 가동 온도 58.6℃ · 안방 앞 발코니',
        `<div style="display:flex; flex-direction:column; gap:8px;">
          <div>안방 앞 비확장 발코니1 바닥 아래로 <strong>거실 확장부 XL 난방 배관</strong>이 통과하는 궤적을 열화상 카메라로 촬영한 10컷입니다. 타일 덧방·그라인더 작업 시 깊이 주의가 필수입니다.</div>
          <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:6px;">
            <img src="./thermal_balcony1/09_balcony1_to_living_pipes.jpg" alt="발코니1 거실 연결 배관" style="width:100%; height:90px; object-fit:cover; border-radius:6px; cursor:pointer; border:1px solid var(--border-subtle);" data-lightbox-group="thermal" data-lightbox-idx="8">
            <img src="./thermal_balcony1/05_balcony1_corner_loop_left.jpg" alt="발코니1 좌측 코너 루프" style="width:100%; height:90px; object-fit:cover; border-radius:6px; cursor:pointer; border:1px solid var(--border-subtle);" data-lightbox-group="thermal" data-lightbox-idx="4">
          </div>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button type="button" class="copy-action-btn" data-open-thermal-lightbox="0">열화상 10컷 크게 보기 🔍</button>
            <button type="button" class="jump-pill-btn" data-jump-item="1-c-03">1-c-03 난방연장 내역 ↘</button>
            <button type="button" class="jump-pill-btn" data-jump-item="2-e-05">2-e-05 발코니 타일 ↘</button>
          </div>
        </div>`
      );
      if (openModal) appCallbacks.onOpenLightbox('thermal', 8);
      return;
    }

    const sd = SHOP_DRAWINGS.find(d => d.id === pinId);
    if (!sd) return;
    stageState.activeShopPin = sd.id;

    document.querySelectorAll('[data-shop-pin]').forEach(b => {
      b.classList.toggle('is-active', b.getAttribute('data-shop-pin') === sd.id);
    });

    const shopIdx = SHOP_DRAWINGS.findIndex(d => d.id === sd.id);
    const bullets = sd.checkPoints.map(c => `<li>${esc(scrubWorkText(c))}</li>`).join('');
    const renderThumbs = (sd.renders || []).slice(0, 2).map((rSrc, rIdx) =>
      `<img src="${esc(rSrc)}" alt="${esc(sd.title)} 3D 시안" style="width:100%; height:82px; object-fit:cover; border-radius:6px; border:1px solid var(--border-subtle); cursor:pointer;" data-open-shop-slide="${esc(sd.id)}" data-shop-idx="${shopIdx}" data-render-offset="${rIdx + 1}">`
    ).join('');
    const itemPills = (sd.items || []).map(code =>
      `<button type="button" class="jump-pill-btn" data-jump-item="${esc(code)}">${esc(code)} 내역 ↘</button>`
    ).join('');

    updateInspector(
      `[11/17 제작도면] ${sd.title}`,
      sd.scale,
      `<div style="display:flex; flex-direction:column; gap:8px;">
        <div style="font-weight:700; color:var(--text-primary);">${esc(sd.dims)}</div>
        <div style="font-size:12px; color:var(--text-secondary);">${esc(scrubWorkText(sd.specSummary))}</div>
        <div style="background:#ffffff; border:1px solid var(--border-strong); border-radius:6px; padding:4px; cursor:pointer;" data-lightbox-group="shop" data-lightbox-idx="${shopIdx}" title="클릭하면 고해상도 제작도면과 3D 시안을 크게 봅니다">
          <img src="${esc(sd.src)}" alt="${esc(sd.title)}" style="width:100%; max-height:190px; object-fit:contain; display:block;">
        </div>
        ${renderThumbs ? `<div style="display:grid; grid-template-columns:repeat(2,1fr); gap:6px;">${renderThumbs}</div>` : ''}
        <ul style="margin:0; padding-left:16px; font-size:11.5px; color:var(--text-secondary); display:flex; flex-direction:column; gap:3px;">${bullets}</ul>
        <div style="display:flex; gap:5px; flex-wrap:wrap; margin-top:2px;">
          <button type="button" class="copy-action-btn" data-lightbox-group="shop" data-lightbox-idx="${shopIdx}">📐 제작도면 + 3D 시안 크게 보기 🔍</button>
          ${itemPills}
        </div>
      </div>`
    );

    if (stageState.submode === 'cad') {
      renderCadSvg();
    } else if (stageState.submode === '3d' && stageState.plan3d && sd.v3Idx !== undefined) {
      const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      stageState.plan3d.view(sd.v3Idx, !reduced);
    }

    if (openModal) {
      appCallbacks.onOpenLightbox('shop', shopIdx);
    }
  }

  /* ---------- Submode 1: Zone Map SVG ---------- */
  function renderZoneMap(siteContent, activeRoom) {
    const svg = document.getElementById('zone-map-svg');
    if (!svg || !siteContent) return;
    const zones = siteContent.FLOORPLAN_ZONES || [];

    const bgImage = `<image href="./floorplan_unit.png" x="0" y="0" width="2200" height="1634" preserveAspectRatio="none" />`;

    const zoneNodes = zones.map(z => {
      const isSelected = activeRoom !== '전체' && z.roomId === activeRoom;
      const cls = `zone-poly${isSelected ? ' is-selected' : ''}`;
      const commonAttrs = `class="${cls}" fill="${esc(z.baseColor || '#8a5a33')}" stroke="${esc(z.strokeColor || '#5e4130')}" data-zone-room="${esc(z.roomId)}" tabindex="0" role="button" aria-pressed="${isSelected ? 'true' : 'false'}" aria-label="${esc(z.title)} (${esc(z.areaM2)}) 선택"`;
      const shape = z.shapeType === 'path'
        ? `<path d="${esc(z.pathD)}" ${commonAttrs}><title>${esc(z.title)}</title></path>`
        : `<rect x="${z.coords.x}" y="${z.coords.y}" width="${z.coords.width}" height="${z.coords.height}" ${commonAttrs}><title>${esc(z.title)}</title></rect>`;
      return shape;
    }).join('');

    const labelNodes = zones.map(z => {
      const lx = z.labelPos?.x || (z.coords ? z.coords.x + z.coords.width / 2 : 600);
      const ly = z.labelPos?.y || (z.coords ? z.coords.y + z.coords.height / 2 : 400);
      return `<text x="${lx}" y="${ly}" class="zone-label">${esc(z.cadName || z.title)}</text>`;
    }).join('');

    svg.setAttribute('viewBox', '290 230 1080 1180');
    svg.innerHTML = `${bgImage}<g class="zones-layer">${zoneNodes}</g><g class="zone-labels-layer">${labelNodes}</g>`;

    if (activeRoom && activeRoom !== '전체') {
      const z = zones.find(item => item.roomId === activeRoom);
      if (z) {
        updateInspector(
          `${z.title} (${z.areaM2} · ${z.areaPy})`,
          `Zone ID: ${z.zoneId}`,
          `<div>${esc(scrubWorkText(z.cadNote || ''))}</div>`
        );
      }
    }
  }

  /* ---------- Submode 2: Full-Fidelity 1/60 Vector CAD (100% plan.html rendering + 11/17 Shop Pins) ---------- */
  function renderCadSvg() {
    const svg = document.getElementById('cad-svg');
    const cad = window.HESSUP_CAD;
    if (!svg || !cad) return;

    const { DATA, ROOMS, TYPES, ELEC, ETYPES, LAYOUT, SITE_ELEC, LDIMS } = cad;
    const typeMap = Object.fromEntries((Array.isArray(TYPES) ? TYPES : []).map(t => [t.id, t]));
    const etypeMap = Object.fromEntries((Array.isArray(ETYPES) ? ETYPES : []).map(t => [t.id, t]));
    const parts = [];

    // 1. Optional 100mm / 1000mm Grid (exact plan.html coordinates)
    if (stageState.layers.grid) {
      const gridLines = [];
      for (let x = -1000; x <= 12100; x += 100) {
        const major = x % 1000 === 0;
        gridLines.push(`<line x1="${x}" y1="-1300" x2="${x}" y2="9000" stroke="${major ? '#ddd5c7' : '#eee9df'}" stroke-width="${major ? 8 : 4}" />`);
      }
      for (let y = -1300; y <= 9000; y += 100) {
        const major = y % 1000 === 0;
        gridLines.push(`<line x1="-1000" y1="${y}" x2="12100" y2="${y}" stroke="${major ? '#ddd5c7' : '#eee9df'}" stroke-width="${major ? 8 : 4}" />`);
      }
      parts.push(`<g class="cad-layer-grid">${gridLines.join('')}</g>`);
    }

    // 2. Room Base Fills (exact plan.html colors + active highlight)
    const activeCadNames = (ROOM_CAD_MAP[stageState.activeRoom] || ROOM_CAD_MAP['전체']).cadNames;
    const roomRects = (ROOMS || []).map((r, idx) => {
      const isHighlighted = activeCadNames.includes(r.name);
      const baseFill = r.fill || '#f4f1ea';
      const fill = isHighlighted ? '#efe4cf' : baseFill;
      const stroke = isHighlighted ? '#8a5a33' : 'none';
      const sw = isHighlighted ? 28 : 0;
      const dimStr = !r.noDim ? `${fmt(r.w)} × ${fmt(r.h)}` : '';
      return `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" data-cad-room="${esc(r.name)}" data-cad-room-idx="${idx}" tabindex="0" role="button" aria-label="CAD 구역 ${esc(r.name)} (${esc(dimStr)})" style="cursor:pointer;" />`;
    }).join('');
    parts.push(`<g class="cad-layer-rooms">${roomRects}</g>`);

    // 3. Architectural Reference Vectors (DATA.ref: curved balcony, double windows, entrance shoes, bathroom fixtures, kitchen sink & stove) + 11/17 Built-in Cabinet Footprints
    const refPaths = (DATA.ref || []).map(d =>
      `<path d="${d}" fill="none" stroke="#b9b2a6" stroke-width="0.6" vector-effect="non-scaling-stroke" />`
    ).join('');
    const builtinCabinetPaths = [
      // 거실 하부 수납장 W1,425 × D300 (x 1,350-2,775) & 상부 선반 W2,600 × D200 (x 1,350-3,950) & 우측 띠장
      `<rect x="1350" y="0" width="1425" height="300" fill="rgba(122, 90, 60, 0.14)" stroke="#7a5a3c" stroke-width="18" />`,
      `<rect x="1350" y="0" width="2600" height="200" fill="none" stroke="#7a5a3c" stroke-width="14" stroke-dasharray="45 30" />`,
      `<line x1="2775" y1="18" x2="4150" y2="18" stroke="#7a5a3c" stroke-width="24" />`,
      // 현관 왼쪽 신발장 W1,560 × D350 (y 0-390 은경 도어 / y 390-1,560 듀이클라우드 3도어)
      `<line x1="4501" y1="390" x2="4851" y2="390" stroke="#7a5a3c" stroke-width="18" />`,
      `<line x1="4501" y1="1560" x2="4851" y2="1560" stroke="#7a5a3c" stroke-width="18" />`,
      // 현관 오른쪽 신발장 W1,560 × D350 (y 0-960 벤치장 / y 960-1,560 키큰장 W600)
      `<rect x="5852" y="0" width="348" height="960" fill="rgba(122, 90, 60, 0.14)" stroke="#7a5a3c" stroke-width="16" />`,
      `<rect x="5852" y="960" width="348" height="600" fill="rgba(244, 241, 234, 0.65)" stroke="#7a5a3c" stroke-width="16" />`
    ].join('');
    parts.push(`<g class="cad-layer-ref">${refPaths}${builtinCabinetPaths}</g>`);

    // 4. Structural Walls (DATA.walls)
    const wallRects = (DATA.walls || []).map(([x, y, w, h]) =>
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#3a3733" />`
    ).join('');
    parts.push(`<g class="cad-layer-walls">${wallRects}</g>`);

    // 5. Doors: Open Leaf + Dashed Swing Arc (DATA.doors)
    const doorNodes = (DATA.doors || []).map(d => {
      const [hx, hy] = d.hinge;
      const [lx, ly] = d.leaf;
      const other = (lx === d.p0[0] && ly === d.p0[1]) ? d.p3 : d.p0;
      const cross = (lx - hx) * (other[1] - hy) - (ly - hy) * (other[0] - hx);
      const sweep = cross > 0 ? 1 : 0;
      return `<line x1="${hx}" y1="${hy}" x2="${lx}" y2="${ly}" stroke="#7a5a3c" stroke-width="30" />
        <path d="M${lx} ${ly} A${d.r} ${d.r} 0 0 ${sweep} ${other[0]} ${other[1]}" fill="none" stroke="#7a5a3c" stroke-width="12" stroke-dasharray="50 40" />`;
    }).join('');
    parts.push(`<g class="cad-layer-doors">${doorNodes}</g>`);

    // 6. Ceiling Cove / Indirect Lighting Lines (DATA.lines72)
    if (stageState.layers.fixtures && DATA.lines72) {
      const coveLines = [];
      DATA.lines72.forEach(([x1, y1, x2, y2]) => {
        const isRail = Math.min(y1, y2) > 4000 && Math.max(y1, y2) < 4200 && Math.min(x1, x2) >= 7700;
        if (isRail) return;
        coveLines.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${LIGHT_COLORS.COVE}" stroke-width="26" stroke-linecap="round" />`);
      });
      parts.push(`<g class="cad-layer-cove">${coveLines.join('')}</g>`);
    }

    // 7. Furniture, Bed & System Hanger Plan A/B (exact plan.html colors & labels)
    if (stageState.layers.furniture && LAYOUT) {
      const furnNodes = [];
      if (LAYOUT.bed) {
        const b = LAYOUT.bed;
        const headY = b.head === 'bottom' ? b.y + b.h - 140 : b.y;
        const textY = b.head === 'bottom' ? b.y + b.h - 620 : b.y + 420;
        const tip = `${b.name}<br>x ${fmt(b.x)}-${fmt(b.x + b.w)} · y ${fmt(b.y)}-${fmt(b.y + b.h)}`;
        furnNodes.push(`<g class="cad-symbol" tabindex="0" role="button" aria-label="[가구] ${esc(b.name)}" data-sym-kind="가구" data-sym-name="${esc(b.name)}" data-sym-spec="2,000 × 2,140 mm · 침실1" data-sym-note="침실1 방문 회전반경 밖 배치" data-sym-x="${b.x}" data-sym-y="${b.y}" data-tip="${esc(tip)}" style="cursor:pointer;">
          <rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="#efe6d8" stroke="#a89272" stroke-width="18" rx="30" />
          <rect x="${b.x}" y="${headY}" width="${b.w}" height="140" fill="#a89272" />
          <text x="${b.x + b.w / 2}" y="${textY}" text-anchor="middle" font-size="120" font-weight="700" fill="#7a6547">IKEA 비에르크스네스</text>
          <text x="${b.x + b.w / 2}" y="${textY + 150}" text-anchor="middle" font-size="115" fill="#7a6547">2,000 × 2,140</text>
        </g>`);
      }

      (LAYOUT.furniture || []).forEach(f => {
        const tip = `${f.name} · ${f.model || ''}<br>${fmt(f.w)}×${fmt(f.d)}×${fmt(f.h)} · ${f.room || ''}<br>${f.note || ''}`;
        if (f.round) {
          furnNodes.push(`<g class="cad-symbol" tabindex="0" role="button" aria-label="[가구] ${esc(f.name)}" data-sym-kind="가구" data-sym-name="${esc(f.name)}" data-sym-spec="${fmt(f.w)}×${fmt(f.d)}×${fmt(f.h)}mm" data-sym-note="${esc(f.note)}" data-sym-x="${f.x}" data-sym-y="${f.y}" data-tip="${esc(tip)}" style="cursor:pointer;">
            <circle cx="${f.x + f.rw / 2}" cy="${f.y + f.rh / 2}" r="${f.rw / 2}" fill="#e9dcc8" stroke="#7a5a3c" stroke-width="18" />
          </g>`);
        } else {
          const shortTitle = f.name.split(' (')[0];
          const fs = Math.min(110, Math.round(f.rh * 0.3));
          furnNodes.push(`<g class="cad-symbol" tabindex="0" role="button" aria-label="[가구] ${esc(f.name)}" data-sym-kind="가구" data-sym-name="${esc(f.name)} (${esc(f.model)})" data-sym-spec="W${fmt(f.w)}×D${fmt(f.d)}×H${fmt(f.h)}mm · ${esc(f.room)}" data-sym-note="${esc(f.note)}" data-sym-x="${f.x}" data-sym-y="${f.y}" data-tip="${esc(tip)}" style="cursor:pointer;">
            <rect x="${f.x}" y="${f.y}" width="${f.rw}" height="${f.rh}" fill="#e9dcc8" stroke="#7a5a3c" stroke-width="18" rx="24" />
            <text x="${f.x + f.rw / 2}" y="${f.y + f.rh / 2 + fs * 0.35}" text-anchor="middle" font-size="${fs}" font-weight="700" fill="#5a4126">${esc(shortTitle)}</text>
          </g>`);
        }
      });

      const activePlan = (LAYOUT.plans || []).find(p => p.id === stageState.hangerPlan);
      if (activePlan) {
        activePlan.modules.forEach(m => {
          const c = m.kind === 'desk' ? '#8a5a2b' : m.kind === 'corner' ? '#7048e8' : m.kind === 'long' ? '#1c7ed6' : '#0ca678';
          const pts = m.poly.map(p => p.join(',')).join(' ');
          const drawerPoly = m.drawer ? `<polygon points="${m.drawer.map(p => p.join(',')).join(' ')}" fill="${c}" fill-opacity="0.35" stroke="${c}" stroke-width="10" stroke-dasharray="30 20" />` : '';
          const xs = m.poly.map(p => p[0]), ys = m.poly.map(p => p[1]);
          const x0 = Math.min(...xs), y0 = Math.min(...ys), w = Math.max(...xs) - x0, h = Math.max(...ys) - y0;
          const cx = x0 + w / 2, cy = y0 + h / 2;
          const lines = m.kind === 'desk' ? ['책상 1600×800'] : m.kind === 'corner' ? ['코너장'] : m.kind === 'long' ? ['긴옷장', '+서랍'] : ['짧은옷장'];
          const textHtml = lines.map((s, i) =>
            `<text x="${cx}" y="${cy - (lines.length - 1) * 55 + i * 110 + 32}" text-anchor="middle" font-size="95" font-weight="${i ? 400 : 700}" fill="${c}">${esc(s)}</text>`
          ).join('');
          const tip = `${m.label}${m.kind === 'long' ? ' (서랍장 D500, 100 돌출)' : ''}<br>x ${fmt(x0)}-${fmt(x0 + w)} · y ${fmt(y0)}-${fmt(y0 + h)}${m.note ? '<br>' + m.note : ''}`;
          furnNodes.push(`<g class="cad-symbol" tabindex="0" role="button" aria-label="[행거 ${stageState.hangerPlan}안] ${esc(m.label)}" data-sym-kind="시스템행거 ${stageState.hangerPlan}안" data-sym-name="${esc(m.label)}" data-sym-spec="${esc(activePlan.name)}" data-sym-note="${esc(m.note || activePlan.summary)}" data-sym-x="${Math.round(cx)}" data-sym-y="${Math.round(cy)}" data-sym-items="2-a-12,2-f-01" data-tip="${esc(tip)}" style="cursor:pointer;">
            <polygon points="${pts}" fill="${c}" fill-opacity="0.18" stroke="${c}" stroke-width="24" />
            ${drawerPoly}
            ${textHtml}
          </g>`);
        });
      }
      parts.push(`<g class="cad-layer-furniture">${furnNodes.join('')}</g>`);
    }

    // 8. Appliances & AC Pipes (exact plan.html style)
    if (stageState.layers.appliances && LAYOUT) {
      const appItemMap = {
        fridge: '2-h-10,1-c-04',
        dw: '2-h-09,1-b-20',
        oven: '2-h-12,1-b-20',
        wc: '2-e-05,2-a-04,2-c-02',
        styler: '1-b-20',
        ac_stand: '1-b-20',
        ac_wall: '1-b-20',
        ac_out: '1-b-20',
        tv: '1-b-19'
      };
      const shortMap = { fridge: '냉장고', dw: '식세기', oven: '광파', wc: '워시콤보', ac_stand: '에어컨', ac_wall: '벽걸이', ac_out: '실외기', styler: '스타일러', tv: 'TV' };
      const appNodes = (LAYOUT.appliances || []).map(a => {
        const dash = a.onCounter || a.wall ? 'stroke-dasharray="40 30"' : '';
        const fill = (a.onCounter || a.wall) ? 'none' : (a.existing ? '#dfe7ef' : '#e3efe1');
        const stroke = a.existing ? '#3b5b7a' : '#2f7a43';
        const textCol = a.existing ? '#2c4660' : '#245e33';
        const short = shortMap[a.id] || a.name;
        const fs = Math.min(120, Math.max(80, Math.round(Math.min(a.rw, a.rh) * 0.35)));
        const items = appItemMap[a.id] || '2-h-09';
        const tip = `${a.name} · ${a.model}<br>${fmt(a.w)}×${fmt(a.d)}×${fmt(a.h)} (W×D×H) · ${a.room}<br>${a.note}`;
        return `<g class="cad-symbol" tabindex="0" role="button" aria-label="[가전·설비] ${esc(a.name)} (W${a.w}×D${a.d}×H${a.h}mm)" data-sym-kind="가전·설비" data-sym-name="${esc(a.name)} (${esc(a.model)})" data-sym-spec="W${fmt(a.w)}×D${fmt(a.d)}×H${fmt(a.h)}mm · ${esc(a.room)}" data-sym-note="${esc(a.note)}" data-sym-x="${a.x}" data-sym-y="${a.y}" data-sym-items="${items}" data-tip="${esc(tip)}" style="cursor:pointer;">
          <rect x="${a.x}" y="${a.y}" width="${a.rw}" height="${a.rh}" fill="${fill}" stroke="${stroke}" stroke-width="22" rx="14" ${dash} />
          <text x="${a.x + a.rw / 2}" y="${a.y + a.rh / 2 + fs * 0.35}" text-anchor="middle" font-size="${fs}" font-weight="700" fill="${textCol}">${esc(short)}</text>
        </g>`;
      });

      // AC Pipes & Holes
      if (LAYOUT.acPipes) {
        (LAYOUT.acPipes.routes || []).forEach(r => {
          const pts = r.pts.map(p => p.join(',')).join(' ');
          const tip = `에어컨 배관: ${r.label}${r.sure ? '' : '<br>실외기까지 경로는 아직 확인 안 됨'}`;
          appNodes.push(`<polyline points="${pts}" fill="none" stroke="#0b7285" stroke-width="${r.sure ? 46 : 30}" stroke-dasharray="${r.sure ? '0' : '60 50'}" stroke-linecap="round" stroke-linejoin="round" opacity="${r.sure ? 0.9 : 0.6}" data-tip="${esc(tip)}" />`);
        });
        (LAYOUT.acPipes.holes || []).forEach(h => {
          const tx = h.x + (h.id === 'h1' ? -150 : 150);
          const ty = h.y + (h.id === 'h1' ? -150 : 60);
          const anchor = h.id === 'h1' ? 'end' : 'start';
          const tip = `${h.label} · 높이 ${h.h}<br>${h.wall}<br>${h.note}`;
          appNodes.push(`<g class="cad-symbol" tabindex="0" role="button" aria-label="[에어컨 배관구멍] ${esc(h.label)}" data-sym-kind="에어컨 배관" data-sym-name="${esc(h.label)}" data-sym-spec="높이 ${esc(h.h)} · ${esc(h.wall)}" data-sym-note="${esc(h.note)}" data-sym-x="${h.x}" data-sym-y="${h.y}" data-tip="${esc(tip)}" style="cursor:pointer;">
            <circle cx="${h.x}" cy="${h.y}" r="95" fill="#fff" stroke="#0b7285" stroke-width="36" />
            <circle cx="${h.x}" cy="${h.y}" r="32" fill="#0b7285" />
            <text x="${tx}" y="${ty}" text-anchor="${anchor}" font-size="120" font-weight="700" fill="#0b7285" stroke="#fff" stroke-width="30" paint-order="stroke">${esc(h.label)}</text>
          </g>`);
        });
      }
      parts.push(`<g class="cad-layer-appliances">${appNodes.join('')}</g>`);
    }

    // 9. Lighting Fixtures (exact plan.html symbols: RAIL, T3, COB, D200, SENSOR, PEND, DL51, WP75, SPOT)
    if (stageState.layers.fixtures && DATA.fixtures) {
      const fixNodes = [];
      // Magnetic rail line
      const railTip = '28×55 마그네틱 매입레일 · 길이 3,000 · x 7,800→10,800 / y 4,100';
      fixNodes.push(`<g class="cad-symbol" tabindex="0" role="button" aria-label="[조명기구] 28×55 마그네틱 매입레일 (주방)" data-sym-kind="조명기구" data-sym-name="28×55 마그네틱 매입레일" data-sym-spec="길이 3,000mm · 주방 · 식당" data-sym-note="x 7,800→10,800 / y 4,100" data-sym-x="9300" data-sym-y="4100" data-sym-items="1-b-09" data-tip="${esc(railTip)}" style="cursor:pointer;">
        <line x1="7800" y1="4100" x2="10800" y2="4100" stroke="${LIGHT_COLORS.RAIL}" stroke-width="60" stroke-linecap="round" />
      </g>`);

      DATA.fixtures.forEach(f => {
        const t = typeMap[f.t];
        if (!t) return;
        const c = LIGHT_COLORS[t.id] || '#d9480f';
        const itemCode = t.id === 'PEND' ? '1-b-11' : (t.id === 'T3' || t.id === 'COB' ? '1-b-10' : (t.id === 'SENSOR' ? '1-b-13' : '1-b-09'));
        const tip = `${t.name}<br>x ${fmt(f.x)} · y ${fmt(f.y)} mm${f.room ? ' · ' + f.room : ''}${f.memo ? '<br>' + f.memo : ''}`;
        let shape = '';
        if (t.id === 'T3' || t.id === 'COB') {
          const L = f.len || 600, th = t.id === 'T3' ? 70 : 55;
          shape = f.o === 'V'
            ? `<rect x="${f.x - th / 2}" y="${f.y - L / 2}" width="${th}" height="${L}" rx="${th / 2}" fill="${c}" />`
            : `<rect x="${f.x - L / 2}" y="${f.y - th / 2}" width="${L}" height="${th}" rx="${th / 2}" fill="${c}" />`;
        } else if (t.id === 'D200') {
          shape = `<rect x="${f.x - 100}" y="${f.y - 100}" width="200" height="200" fill="#fff" stroke="${c}" stroke-width="40" />`;
        } else if (t.id === 'SENSOR') {
          shape = `<path d="M${f.x - 90} ${f.y}H${f.x + 90}M${f.x} ${f.y - 90}V${f.y + 90}" stroke="${c}" stroke-width="34" />
            <circle cx="${f.x}" cy="${f.y}" r="140" fill="none" stroke="${c}" stroke-width="14" stroke-dasharray="30 26" />`;
        } else if (t.id === 'PEND') {
          shape = `<circle cx="${f.x}" cy="${f.y}" r="150" fill="#fff" stroke="${c}" stroke-width="40" />
            <circle cx="${f.x}" cy="${f.y}" r="55" fill="${c}" />`;
        } else {
          const r = { DL51: 70, WP75: 95, SPOT: 55 }[t.id] || 70;
          shape = `<circle cx="${f.x}" cy="${f.y}" r="${r}" fill="${t.id === 'WP75' ? '#fff' : c}" stroke="${c}" stroke-width="${t.id === 'WP75' ? 34 : 0}" />` +
            (t.id === 'WP75' ? `<circle cx="${f.x}" cy="${f.y}" r="34" fill="${c}" />` : '');
        }
        fixNodes.push(`<g class="cad-symbol" tabindex="0" role="button" aria-label="[조명기구] ${esc(t.name)} (${esc(f.room)})" data-sym-kind="조명기구" data-sym-name="${esc(t.name)}" data-sym-spec="${esc(f.room)}" data-sym-note="${esc(f.memo || '천장 조명 기구')}" data-sym-x="${f.x}" data-sym-y="${f.y}" data-sym-items="${itemCode}" data-tip="${esc(tip)}" style="cursor:pointer;">${shape}</g>`);
      });
      parts.push(`<g class="cad-layer-fixtures">${fixNodes.join('')}</g>`);
    }

    // 10. Electrical Outlets (2-prong symbols + H450), Switches (green circles with 1/3), LAN (@), Panel, and Site-verified dashed markers
    if (stageState.layers.elec && ELEC) {
      const elecNodes = [];
      (ELEC.outlets || []).forEach(o => {
        const grpId = o.kind === 'STD' ? 'STD' : o.kind === 'WP' ? 'WP' : 'DED';
        const col = ELEC_COLORS[grpId];
        const one = o.kind === 'MM' || o.kind === 'CC';
        const prongs = (one ? [[0, 0]] : [[-45, 0], [45, 0]]).map(([dx, dy]) =>
          `<circle cx="${o.x + dx}" cy="${o.y + dy}" r="26" fill="${col}" />`
        ).join('');
        const kindLbl = o.kind !== 'STD'
          ? `<text x="${o.x + 140}" y="${o.y - 110}" font-size="120" font-weight="700" fill="${col}">${esc(o.kind)}</text>`
          : '';
        const hLbl = o.h
          ? `<text x="${o.x}" y="${o.y + 260}" text-anchor="middle" font-size="110" fill="#5c564c">H${o.h}</text>`
          : '';
        const etName = etypeMap[o.kind]?.name || '220V 콘센트';
        const tip = `${etName}${o.h ? ' · 높이 ' + fmt(o.h) : ' · 높이 표기 없음'}<br>x ${fmt(o.x)} · y ${fmt(o.y)} mm${o.room ? ' · ' + o.room : ''}`;
        elecNodes.push(`<g class="cad-symbol" tabindex="0" role="button" aria-label="[전열·콘센트] ${esc(etName)} (설치 높이 H${o.h || 300}mm)" data-sym-kind="전열·콘센트" data-sym-name="${esc(etName)}" data-sym-spec="설치 높이 H${o.h || 300}mm · ${esc(o.room || '')}" data-sym-note="전열평면도 기호" data-sym-x="${o.x}" data-sym-y="${o.y}" data-sym-items="1-b-20,1-b-17" data-tip="${esc(tip)}" style="cursor:pointer;">
          <circle cx="${o.x}" cy="${o.y}" r="120" fill="#fff" stroke="${col}" stroke-width="30" />
          ${prongs}${kindLbl}${hLbl}
        </g>`);
      });

      (ELEC.switches || []).forEach(s => {
        const col = ELEC_COLORS.SW;
        const gang = s.kind === 'SW1' ? '1' : '3';
        const name = s.kind === 'SW1' ? '1구 스위치' : '3구 스위치';
        const tip = `${name}<br>x ${fmt(s.x)} · y ${fmt(s.y)} mm${s.room ? ' · ' + s.room : ''}`;
        elecNodes.push(`<g class="cad-symbol" tabindex="0" role="button" aria-label="[스위치] ${name} (${esc(s.room || '')})" data-sym-kind="스위치" data-sym-name="${name}" data-sym-spec="설치 높이 H1,100-1,200mm · ${esc(s.room || '')}" data-sym-note="조명 스위치" data-sym-x="${s.x}" data-sym-y="${s.y}" data-sym-items="1-b-16" data-tip="${esc(tip)}" style="cursor:pointer;">
          <circle cx="${s.x}" cy="${s.y}" r="165" fill="#fff" stroke="${col}" stroke-width="26" />
          <text x="${s.x}" y="${s.y + 52}" text-anchor="middle" font-size="150" font-weight="700" fill="${col}">${gang}</text>
        </g>`);
      });

      (ELEC.lan || []).forEach(l => {
        const col = ELEC_COLORS.LAN;
        const tip = `LAN 단자 (거실 TV 벽)<br>x ${fmt(l.x)} · y ${fmt(l.y)} mm`;
        elecNodes.push(`<g class="cad-symbol" tabindex="0" role="button" aria-label="[통신] LAN 단자 (거실 TV 벽)" data-sym-kind="통신·LAN" data-sym-name="LAN 단자 (거실 TV 벽)" data-sym-spec="x ${fmt(l.x)} · y ${fmt(l.y)} mm" data-sym-note="거실 TV 벽면 유선 인터넷 단자" data-sym-x="${l.x}" data-sym-y="${l.y}" data-sym-items="1-b-19" data-tip="${esc(tip)}" style="cursor:pointer;">
          <rect x="${l.x - 120}" y="${l.y - 120}" width="240" height="240" fill="#fff" stroke="${col}" stroke-width="26" />
          <text x="${l.x}" y="${l.y + 60}" text-anchor="middle" font-size="170" font-weight="700" fill="${col}">@</text>
        </g>`);
      });

      (SITE_ELEC || []).forEach(o => {
        const y = o.y + (o.dy || 0);
        const col = o.kind === 'SW' ? ELEC_COLORS.SW : o.kind === 'LAN' ? ELEC_COLORS.LAN : ELEC_COLORS.STD;
        const name = { SW: '스위치 박스', LAN: '랜 단자 자리', STD: '콘센트' }[o.kind] || '콘센트';
        const tip = `${name} (기존, 현장 사진 ${o.photo})<br>${o.room} · 높이 ${o.h}<br>${o.note}`;
        const itemCode = o.kind === 'LAN' ? '1-b-19' : '1-b-20';
        let shape = '';
        if (o.kind === 'SW') {
          shape = `<circle cx="${o.x}" cy="${y}" r="140" fill="#fff" stroke="${col}" stroke-width="24" stroke-dasharray="50 30" />
            <text x="${o.x}" y="${y + 45}" text-anchor="middle" font-size="120" font-weight="700" fill="${col}">S</text>`;
        } else if (o.kind === 'LAN') {
          shape = `<rect x="${o.x - 110}" y="${y - 110}" width="220" height="220" fill="#fff" stroke="${col}" stroke-width="24" stroke-dasharray="50 30" />
            <text x="${o.x}" y="${y + 55}" text-anchor="middle" font-size="150" font-weight="700" fill="${col}">@</text>`;
        } else {
          shape = `<circle cx="${o.x}" cy="${y}" r="110" fill="#fff" stroke="${col}" stroke-width="24" stroke-dasharray="50 30" />
            <circle cx="${o.x - 40}" cy="${y}" r="22" fill="${col}" />
            <circle cx="${o.x + 40}" cy="${y}" r="22" fill="${col}" />`;
        }
        elecNodes.push(`<g class="cad-symbol" tabindex="0" role="button" aria-label="[현장실측 전열·통신] ${esc(name)} (${esc(o.room)})" data-sym-kind="현장실측 전열·통신" data-sym-name="${esc(name)} [현장사진 ${esc(o.photo)}]" data-sym-spec="높이 ${esc(o.h)}mm · ${esc(o.room)}" data-sym-note="${esc(o.note)}" data-sym-x="${o.x}" data-sym-y="${y}" data-sym-items="${itemCode}" data-tip="${esc(tip)}" style="cursor:pointer;">${shape}</g>`);
      });

      if (ELEC.panel) {
        const p = ELEC.panel;
        const tip = `6회로 분전함 · 폭 약 ${fmt(p.w)}<br>x ${fmt(p.x)}-${fmt(p.x + p.w)} · y ${fmt(p.y)} mm`;
        elecNodes.push(`<g class="cad-symbol" tabindex="0" role="button" aria-label="[분전함] 6회로 분전함" data-sym-kind="분전함" data-sym-name="6회로 세대 분전함" data-sym-spec="폭 ${fmt(p.w)}mm · 주방 카페장 상부" data-sym-note="인덕션·식세기·워시콤보·오븐 단독회로 증설 연동" data-sym-x="${p.x}" data-sym-y="${p.y}" data-sym-items="1-b-20" data-tip="${esc(tip)}" style="cursor:pointer;">
          <rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="#fff" stroke="${ELEC_COLORS.PANEL}" stroke-width="26" />
          <path d="M${p.x} ${p.y}L${p.x + p.w} ${p.y + p.h}M${p.x + p.w} ${p.y}L${p.x} ${p.y + p.h}" stroke="${ELEC_COLORS.PANEL}" stroke-width="14" />
        </g>`);
      }
      parts.push(`<g class="cad-layer-elec">${elecNodes.join('')}</g>`);
    }

    // 11. Plan Notes (smps, ch2300, ch2450, 센터로) & Room Labels
    const noteNodes = (DATA.notes || []).map(n => {
      if (n.text === 'p') return '';
      const fs = Math.max(110, Math.min(n.size, 200));
      return `<text x="${n.x}" y="${n.y}" font-size="${fs}" fill="#8a847a" pointer-events="none">${esc(n.text)}</text>`;
    }).join('');
    const roomLabels = (ROOMS || []).map(r => {
      const lx = r.lx ?? (r.x + r.w / 2);
      const ly = r.ly ?? (r.y + r.h / 2);
      const dim = !r.noDim
        ? `<text x="${lx}" y="${ly + (r.small ? 170 : 230)}" text-anchor="middle" font-size="${r.small ? 120 : 150}" fill="#8a847a" pointer-events="none">${fmt(r.w)} × ${fmt(r.h)}</text>`
        : '';
      return `<text x="${lx}" y="${ly}" text-anchor="middle" font-size="${r.small ? 150 : 210}" font-weight="700" fill="#4a453e" pointer-events="none">${esc(r.name)}</text>${dim}`;
    }).join('');
    parts.push(`<g class="cad-layer-labels">${noteNodes}${roomLabels}</g>`);

    // 12. Design Dimension Lines (LDIMS - exact plan.html ticks & extension lines)
    if (stageState.layers.ldims && LDIMS) {
      const dimNodes = LDIMS.map(d => {
        const extLines = (d.ext || []).map(([o, c, a, b]) =>
          o === 'V'
            ? `<line x1="${c}" y1="${a}" x2="${c}" y2="${b}" stroke="#8a847a" stroke-width="6" />`
            : `<line x1="${a}" y1="${c}" x2="${b}" y2="${c}" stroke="#8a847a" stroke-width="6" />`
        ).join('');
        const L = d.o === 'V' ? { x1: d.c, y1: d.a, x2: d.c, y2: d.b } : { x1: d.a, y1: d.c, x2: d.b, y2: d.c };
        const ticks = [[L.x1, L.y1], [L.x2, L.y2]].map(([x, y]) =>
          `<line x1="${x - 45}" y1="${y + 45}" x2="${x + 45}" y2="${y - 45}" stroke="#3a3733" stroke-width="16" />`
        ).join('');
        const rot = d.o === 'V' ? `transform="rotate(-90 ${d.tx} ${d.ty})"` : '';
        return `<g opacity="${d.stale ? 0.35 : 1}">
          ${extLines}
          <line x1="${L.x1}" y1="${L.y1}" x2="${L.x2}" y2="${L.y2}" stroke="#3a3733" stroke-width="10" />
          ${ticks}
          <text x="${d.tx}" y="${d.ty}" font-size="140" text-anchor="middle" dominant-baseline="central" fill="#23211d" stroke="#fbfaf7" stroke-width="28" paint-order="stroke" ${rot}>${esc(d.t)}</text>
        </g>`;
      }).join('');
      parts.push(`<g class="cad-layer-ldims">${dimNodes}</g>`);
    }

    // 13. Interactive 11/17 Furniture Shop Drawing Hotspots & Pins (Idea 2: Pin-to-Drawing)
    if (stageState.layers.shopPins) {
      const pinNodes = SHOP_DRAWINGS.map(sd => {
        const isSel = stageState.activeShopPin === sd.id;
        const b = sd.box;
        const pillW = sd.pinLabel.length * 105 + 180;
        const pillH = 250;
        const px = sd.badgeX - pillW / 2;
        const py = sd.badgeY - pillH / 2;
        const tip = `<strong>${sd.title}</strong><br>${sd.dims}<br>클릭하면 11/17 확정 제작도면과 3D 시안을 봅니다.`;
        return `<g class="cad-shop-pin" data-shop-pin-svg="${esc(sd.id)}" tabindex="0" role="button" aria-label="${esc(sd.title)} 도면 보기" data-tip="${esc(tip)}">
          <rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="${isSel ? 'rgba(196, 86, 43, 0.22)' : 'rgba(196, 86, 43, 0.08)'}" stroke="#c4562b" stroke-width="${isSel ? 34 : 22}" stroke-dasharray="${isSel ? '0' : '70 45'}" rx="24" />
          <rect class="pin-pill" x="${px}" y="${py}" width="${pillW}" height="${pillH}" rx="125" fill="${isSel ? '#a53c16' : '#23211d'}" stroke="#ffffff" stroke-width="24" />
          <text x="${sd.badgeX}" y="${sd.badgeY + 42}" text-anchor="middle" font-size="122" font-weight="700" fill="#ffffff" pointer-events="none">${esc(sd.pinLabel)}</text>
        </g>`;
      });

      // Balcony 1 Thermal Pin (Local Only)
      if (stageState.hasThermal) {
        const isBalSel = stageState.activeShopPin === 'balcony1';
        pinNodes.push(`<g class="cad-shop-pin" data-shop-pin-svg="balcony1" tabindex="0" role="button" aria-label="발코니1 바닥 열화상 10컷 보기" data-tip="<strong>발코니1 바닥 난방 열화상 (10컷)</strong><br>최고 58.6℃ · 거실 확장부 연결 배관 경로 확인">
          <rect x="30" y="4850" width="840" height="3650" fill="${isBalSel ? 'rgba(217, 72, 15, 0.20)' : 'rgba(217, 72, 15, 0.06)'}" stroke="#d9480f" stroke-width="22" stroke-dasharray="60 45" rx="24" />
          <rect class="pin-pill" x="-110" y="7200" width="1120" height="250" rx="125" fill="#b43c18" stroke="#ffffff" stroke-width="24" />
          <text x="450" y="7365" text-anchor="middle" font-size="118" font-weight="700" fill="#ffffff" pointer-events="none">🔥 열화상 10컷</text>
        </g>`);
      }

      parts.push(`<g class="cad-layer-shop-pins">${pinNodes.join('')}</g>`);
    }

    // 14. Active Distance Measurement Ruler Overlay
    if (stageState.measurePts.length > 0) {
      const p0 = stageState.measurePts[0];
      const p1 = stageState.measurePts[1] || p0;
      const dx = p1.x - p0.x, dy = p1.y - p0.y;
      const dist = Math.round(Math.hypot(dx, dy));
      const mx = (p0.x + p1.x) / 2;
      const my = (p0.y + p1.y) / 2;
      parts.push(`<g class="cad-layer-measure">
        <line x1="${p0.x}" y1="${p0.y}" x2="${p1.x}" y2="${p1.y}" stroke="#c4562b" stroke-width="24" />
        <line x1="${p0.x}" y1="${p0.y}" x2="${p1.x}" y2="${p0.y}" stroke="#c4562b" stroke-width="12" stroke-dasharray="40 30" />
        <line x1="${p1.x}" y1="${p0.y}" x2="${p1.x}" y2="${p1.y}" stroke="#c4562b" stroke-width="12" stroke-dasharray="40 30" />
        <circle cx="${p0.x}" cy="${p0.y}" r="55" fill="#c4562b" />
        <circle cx="${p1.x}" cy="${p1.y}" r="55" fill="#c4562b" />
        <rect x="${mx - 420}" y="${my - 210}" width="840" height="220" rx="35" fill="#23211d" />
        <text x="${mx}" y="${my - 55}" text-anchor="middle" font-size="140" font-weight="700" fill="#fff">${fmt(dist)} mm</text>
      </g>`);
    }

    const [vx, vy, vw, vh] = stageState.vb;
    svg.setAttribute('viewBox', `${vx} ${vy} ${vw} ${vh}`);
    svg.innerHTML = parts.join('');
  }

  /* ---------- Submode 3: 3D Walk (Three.js Lazy Loader + Interactive Minimap) ---------- */
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) { resolve(); return; }
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = err => reject(err);
      document.head.appendChild(s);
    });
  }

  async function ensure3DInitialized() {
    if (stageState.plan3d) {
      setTimeout(() => stageState.plan3d.resize(), 40);
      return;
    }
    if (stageState.threeLoading) return;
    const container = document.getElementById('v3canvas');
    const cad = window.HESSUP_CAD;
    if (!container || !cad) return;

    stageState.threeLoading = true;
    const cap = document.getElementById('v3caption');
    if (cap) cap.textContent = '3D 공간 모형 엔진(Three.js)을 초기화하고 있습니다...';

    try {
      if (!window.THREE) {
        await loadScript('./vendor/three-r128.min.js');
        await loadScript('./vendor/OrbitControls-r128.js');
      }
      if (window.Plan3D && window.THREE) {
        const siteList = (cad.SITE_ELEC || []).map(s => ({ ...s }));
        const elecMerged = { ...(cad.ELEC || {}), site: siteList };
        stageState.plan3d = window.Plan3D.create(container, cad.DATA, cad.LAYOUT, cad.VIEWS3D, elecMerged);
        stageState.plan3d.setPlan(stageState.hangerPlan);

        const bar = document.getElementById('v3-preset-bar');
        if (bar && cad.VIEWS3D) {
          bar.innerHTML = cad.VIEWS3D.map((v, idx) =>
            `<button type="button" class="cad-tool-btn${idx === 0 ? ' is-active' : ''}" data-v3-idx="${idx}" aria-pressed="${idx === 0 ? 'true' : 'false'}">${esc(v.short || v.name || v.title)}</button>`
          ).join('');
        }
        if (cap && cad.VIEWS3D?.[0]) {
          cap.innerHTML = `<b>${esc(cad.VIEWS3D[0].title)}</b> — ${esc(cad.VIEWS3D[0].note || '')}`;
        }
        setupMinimap(cad.DATA, cad.ROOMS);
        window.addEventListener('resize', () => {
          if (stageState.plan3d) stageState.plan3d.resize();
        });
      }
    } catch (e) {
      if (cap) cap.textContent = '3D 뷰어 스크립트를 불러오지 못했습니다. 2D 평면도 탭을 이용해 주세요.';
    } finally {
      stageState.threeLoading = false;
    }
  }

  function setupMinimap(DATA, ROOMS) {
    const canvas = document.getElementById('v3minimap');
    if (!canvas || !stageState.plan3d || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mmBox = { x: -900, y: -500, w: 13200, h: 9600 };
    const W = canvas.width, H = canvas.height;
    const s = Math.min((W - 14) / mmBox.w, (H - 14) / mmBox.h);
    const ox = (W - mmBox.w * s) / 2 - mmBox.x * s;
    const oy = (H - mmBox.h * s) / 2 - mmBox.y * s;
    const mx = x => ox + x * s;
    const my = y => oy + y * s;

    stageState.plan3d.onFrame(() => {
      const night = stageState.plan3d.isNight();
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = night ? '#23201d' : '#f4f1ea';
      (ROOMS || []).forEach(r => ctx.fillRect(mx(r.x), my(r.y), r.w * s, r.h * s));
      ctx.fillStyle = night ? '#8a8278' : '#3a3733';
      (DATA.walls || []).forEach(([x, y, w, h]) => ctx.fillRect(mx(x), my(y), Math.max(1, w * s), Math.max(1, h * s)));

      const c = stageState.plan3d.cam();
      const cx = mx(c.x), cy = my(c.y);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(c.dir);
      ctx.fillStyle = '#c4562b44';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 26, -0.55, 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#c4562b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(16, 0);
      ctx.stroke();
      ctx.fillStyle = '#c4562b';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    const pickMM = e => {
      const r = canvas.getBoundingClientRect();
      const x = ((e.clientX - r.left) * (W / r.width) - ox) / s;
      const y = ((e.clientY - r.top) * (H / r.height) - oy) / s;
      stageState.plan3d.walkTo(Math.max(-400, Math.min(11600, x)), Math.max(100, Math.min(8500, y)));
      const cap = document.getElementById('v3caption');
      if (cap) cap.innerHTML = `<b>눈높이 이동</b> · x ${fmt(x)} · y ${fmt(y)} mm — 마우스로 둘러보세요.`;
    };

    let mdrag = false;
    canvas.addEventListener('pointerdown', e => {
      mdrag = true;
      canvas.setPointerCapture?.(e.pointerId);
      pickMM(e);
    });
    canvas.addEventListener('pointermove', e => { if (mdrag) pickMM(e); });
    canvas.addEventListener('pointerup', () => { mdrag = false; });
  }

  /* ---------- Submode 4: Balcony 1 Thermal 10-Cut & Tab 4 Shop Drawings Gallery ---------- */
  function renderThermalAndShopGalleries() {
    const stageGrid = document.getElementById('stage-thermal-grid');
    const tabGallery = document.getElementById('thermalGallery');
    const shopGallery = document.getElementById('shopDrawingGallery');

    const cardHtml = (t, idx) => `
      <article class="gallery-card" data-thermal-idx="${idx}">
        <img src="${esc(t.src)}" alt="${esc(t.title)} (${esc(t.temp)})" class="gallery-img" loading="lazy" style="cursor:pointer;" tabindex="0" role="button" data-lightbox-src="${esc(t.src)}" data-lightbox-group="thermal" data-lightbox-idx="${idx}">
        <div class="gallery-body">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
            <span class="status-badge is-modified">${esc(t.temp)}</span>
            <span class="mono" style="font-size:12px; color:var(--text-muted);">${esc(t.roomId)}</span>
          </div>
          <h3 class="gallery-title">${esc(t.title)}</h3>
          <p class="gallery-desc">${esc(t.desc)}</p>
          <div style="display:flex; gap:4px; flex-wrap:wrap; margin-top:4px;">
            ${t.items.map(code => `<button type="button" class="jump-pill-btn" data-jump-item="${esc(code)}">${esc(code)} 내역 ↘</button>`).join('')}
          </div>
        </div>
      </article>`;

    if (stageState.hasThermal) {
      const html = THERMAL_CUTS.map(cardHtml).join('');
      if (stageGrid) stageGrid.innerHTML = html;
      if (tabGallery) tabGallery.innerHTML = html;
    } else {
      if (stageGrid) stageGrid.innerHTML = '';
      if (tabGallery) tabGallery.innerHTML = '';
    }

    if (shopGallery) {
      shopGallery.innerHTML = SHOP_DRAWINGS.map((sd, idx) => `
        <article class="gallery-card" data-shop-card="${esc(sd.id)}">
          <img src="${esc(sd.src)}" alt="${esc(sd.title)}" class="gallery-img" loading="lazy" style="cursor:pointer; object-fit:contain; background:#fff; padding:4px;" tabindex="0" role="button" data-lightbox-group="shop" data-lightbox-idx="${idx}">
          <div class="gallery-body">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
              <span class="status-badge is-added">11/17 확정 도면</span>
              <span class="mono" style="font-size:11.5px; color:var(--text-muted);">${esc(sd.roomId)} · ${esc(sd.scale.split('(')[0].trim())}</span>
            </div>
            <h3 class="gallery-title">${esc(sd.title)}</h3>
            <p class="gallery-desc"><strong>${esc(sd.dims)}</strong><br>${esc(scrubWorkText(sd.specSummary))}</p>
            <div style="display:flex; gap:4px; flex-wrap:wrap; margin-top:4px;">
              <button type="button" class="jump-pill-btn" data-focus-shop-pin="${esc(sd.id)}">⌖ 2D 평면도 위치 보기</button>
              ${sd.items.slice(0, 3).map(code => `<button type="button" class="jump-pill-btn" data-jump-item="${esc(code)}">${esc(code)} ↘</button>`).join('')}
            </div>
          </div>
        </article>`
      ).join('');
    }
  }

  /* ---------- Submode Switching & Room Camera Sync ---------- */
  function setSubmode(submode) {
    stageState.submode = submode;
    document.querySelectorAll('[data-submode]').forEach(btn => {
      const active = btn.getAttribute('data-submode') === submode;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
      btn.setAttribute('tabindex', active ? '0' : '-1');
    });
    ['zone', 'cad', '3d', 'thermal'].forEach(k => {
      const panel = document.getElementById(`stage-panel-${k}`);
      if (panel) panel.hidden = k !== submode;
    });

    // Auto-expand into large studio canvas when entering 2D CAD or 3D (unless user explicitly collapsed)
    if ((submode === 'cad' || submode === '3d') && !stageState.userCollapsedExpand) {
      setStageExpanded(true);
    } else if (submode === 'zone' || submode === 'thermal') {
      setStageExpanded(false);
    }

    if (submode === 'cad') renderCadSvg();
    if (submode === '3d') ensure3DInitialized();
  }

  function syncRoom(roomId, siteContent) {
    stageState.activeRoom = roomId || '전체';
    const badge = document.getElementById('stage-active-room-badge');
    if (badge) badge.textContent = stageState.activeRoom === '전체' ? '전체 세대' : stageState.activeRoom;

    const mapEntry = ROOM_CAD_MAP[stageState.activeRoom] || ROOM_CAD_MAP['전체'];
    stageState.vb = [...mapEntry.viewBox];

    renderZoneMap(siteContent, stageState.activeRoom);
    renderCadSvg();

    // Auto-populate shop drawing inspector if room has a confirmed shop drawing
    if (stageState.submode === 'cad' || stageState.submode === '3d') {
      const roomToPin = { '주방': 'kitchen', '거실': 'living', '현관': 'shoe_left' };
      if (stageState.hasThermal) roomToPin['발코니1(안방)'] = 'balcony1';
      if (roomToPin[stageState.activeRoom]) {
        inspectShopDrawing(roomToPin[stageState.activeRoom], false);
      }
    }

    if (stageState.plan3d && window.HESSUP_CAD?.VIEWS3D) {
      const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      stageState.plan3d.view(mapEntry.presetIdx || 0, !reduced);
    }
  }

  /* ---------- Event Wiring ---------- */
  function bindStageEvents(siteContent) {
    // Expand / Collapse Button
    const expandBtn = document.getElementById('stage-expand-btn');
    if (expandBtn) {
      expandBtn.addEventListener('click', () => {
        const next = !stageState.expanded;
        stageState.userCollapsedExpand = !next && (stageState.submode === 'cad' || stageState.submode === '3d');
        setStageExpanded(next);
      });
    }

    // Submode Tabs & Roving Tabindex
    const submodeTabs = Array.from(document.querySelectorAll('[data-submode]'));
    submodeTabs.forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        setSubmode(btn.getAttribute('data-submode'));
      });
      btn.addEventListener('keydown', e => {
        let nextIdx = -1;
        if (e.key === 'ArrowRight') nextIdx = (idx + 1) % submodeTabs.length;
        else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + submodeTabs.length) % submodeTabs.length;
        else if (e.key === 'Home') nextIdx = 0;
        else if (e.key === 'End') nextIdx = submodeTabs.length - 1;
        if (nextIdx >= 0) {
          e.preventDefault();
          const target = submodeTabs[nextIdx];
          setSubmode(target.getAttribute('data-submode'));
          target.focus();
        }
      });
    });

    // Quick Shop Pin Bar Buttons (in 2D CAD & 3D toolbars)
    document.querySelectorAll('[data-shop-pin]').forEach(btn => {
      btn.addEventListener('click', () => {
        const pinId = btn.getAttribute('data-shop-pin');
        const sd = SHOP_DRAWINGS.find(d => d.id === pinId);
        if (sd && stageState.submode === 'cad') {
          stageState.vb = [sd.box.x - 1200, sd.box.y - 900, Math.max(3800, sd.box.w + 2400), Math.max(2800, sd.box.h + 1800)];
        }
        inspectShopDrawing(pinId, true);
      });
    });

    // Zone Map Click & Keyboard
    const zoneSvg = document.getElementById('zone-map-svg');
    if (zoneSvg) {
      const handleZoneActivate = e => {
        const grp = e.target.closest('[data-zone-room]');
        if (grp) {
          const rId = grp.getAttribute('data-zone-room');
          appCallbacks.onSelectRoom(rId);
        }
      };
      zoneSvg.addEventListener('click', handleZoneActivate);
      zoneSvg.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleZoneActivate(e);
        }
      });
    }

    // CAD Layer Toggles
    document.querySelectorAll('[data-cad-layer]').forEach(btn => {
      btn.addEventListener('click', () => {
        const layer = btn.getAttribute('data-cad-layer');
        stageState.layers[layer] = !stageState.layers[layer];
        btn.classList.toggle('is-active', stageState.layers[layer]);
        btn.setAttribute('aria-pressed', stageState.layers[layer] ? 'true' : 'false');
        renderCadSvg();
      });
    });

    // CAD Grid Toggle
    const gridBtn = document.getElementById('cad-grid-btn');
    if (gridBtn) {
      gridBtn.addEventListener('click', () => {
        stageState.layers.grid = !stageState.layers.grid;
        gridBtn.classList.toggle('is-active', stageState.layers.grid);
        gridBtn.setAttribute('aria-pressed', stageState.layers.grid ? 'true' : 'false');
        renderCadSvg();
      });
    }

    // Hanger Plan A / B Toggle
    document.querySelectorAll('[data-hanger-plan]').forEach(btn => {
      btn.addEventListener('click', () => {
        const planId = btn.getAttribute('data-hanger-plan');
        stageState.hangerPlan = planId;
        document.querySelectorAll('[data-hanger-plan]').forEach(b => {
          const active = b.getAttribute('data-hanger-plan') === planId;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        const warnBanner = document.getElementById('hanger-warning-banner');
        if (warnBanner) {
          warnBanner.innerHTML = planId === 'B'
            ? '<strong>[! 스위치 간섭 주의 · B안]</strong> 침실2 문 옆 기존 스위치(H1100 추정)와 시스템행거 프레임 간격 확인 필요 — 서랍 돌출(D500) 및 문 회전반경(6,401~7,221) 간섭 없음 확인됨'
            : '<strong>[! 서랍·창문 간섭 주의 · A안]</strong> 침실2 4모듈 배치 시 코너장과 800 서랍장이 겹치며, 책상이 창문(2-c-02) 앞을 가립니다. B안(3모듈)을 추천합니다.';
        }
        renderCadSvg();
        if (stageState.plan3d) stageState.plan3d.setPlan(planId);
        appCallbacks.announce(`침실2 시스템행거 ${planId}안이 적용되었습니다.`);
      });
    });

    // CAD Measure & Fit Buttons
    const measureBtn = document.getElementById('cad-measure-btn');
    if (measureBtn) {
      measureBtn.addEventListener('click', () => {
        stageState.measureMode = !stageState.measureMode;
        stageState.measurePts = [];
        measureBtn.classList.toggle('is-active', stageState.measureMode);
        measureBtn.setAttribute('aria-pressed', stageState.measureMode ? 'true' : 'false');
        document.getElementById('cad-svg')?.classList.toggle('is-measuring', stageState.measureMode);
        renderCadSvg();
      });
    }
    const fitBtn = document.getElementById('cad-fit-btn');
    if (fitBtn) {
      fitBtn.addEventListener('click', () => {
        stageState.vb = [-1100, -1400, 13300, 10500];
        stageState.measurePts = [];
        stageState.activeShopPin = null;
        renderCadSvg();
      });
    }

    // CAD SVG Click, Hover Tooltip, Keyboard, Drag Panning & Shift Ruler Snap
    const cadSvg = document.getElementById('cad-svg');
    const hoverTip = document.getElementById('cad-hover-tip');
    const wrapEl = document.getElementById('cad-canvas-wrap');

    if (cadSvg) {
      let dragState = null;

      const svgPoint = evt => {
        const rect = cadSvg.getBoundingClientRect();
        if (!rect.width || !rect.height) return { x: 0, y: 0 };
        const [vx, vy, vw, vh] = stageState.vb;
        return {
          x: Math.round(vx + ((evt.clientX - rect.left) / rect.width) * vw),
          y: Math.round(vy + ((evt.clientY - rect.top) / rect.height) * vh)
        };
      };

      const inspectCadElement = (target, openPinModal = false) => {
        const shopPinEl = target.closest('[data-shop-pin-svg]');
        if (shopPinEl) {
          const pinId = shopPinEl.getAttribute('data-shop-pin-svg');
          inspectShopDrawing(pinId, openPinModal);
          return true;
        }

        const sym = target.closest('.cad-symbol');
        if (sym) {
          const kind = scrubWorkText(sym.getAttribute('data-sym-kind') || '기호');
          const name = scrubWorkText(sym.getAttribute('data-sym-name') || '');
          const spec = scrubWorkText(sym.getAttribute('data-sym-spec') || '');
          const note = scrubWorkText(sym.getAttribute('data-sym-note') || '');
          const sx = sym.getAttribute('data-sym-x') || '0';
          const sy = sym.getAttribute('data-sym-y') || '0';
          const items = (sym.getAttribute('data-sym-items') || '').split(',').filter(Boolean);
          const jumpHtml = items.length
            ? `<div style="margin-top:6px; display:flex; gap:6px; flex-wrap:wrap;">${items.map(id => `<button type="button" class="jump-pill-btn" data-jump-item="${esc(id)}">${esc(id)} 내역으로 이동 ↘</button>`).join('')}</div>`
            : '';
          updateInspector(
            `[${kind}] ${name}`,
            `x ${Number(sx).toLocaleString('ko-KR')} · y ${Number(sy).toLocaleString('ko-KR')} mm`,
            `<div><strong>${esc(spec)}</strong> — ${esc(note)}</div>${jumpHtml}`
          );
          return true;
        }
        const roomGrp = target.closest('[data-cad-room-idx]');
        if (roomGrp && window.HESSUP_CAD?.ROOMS) {
          const r = window.HESSUP_CAD.ROOMS[Number(roomGrp.getAttribute('data-cad-room-idx'))];
          if (r) {
            const dimStr = r.w && r.h ? `${r.w.toLocaleString('ko-KR')} × ${r.h.toLocaleString('ko-KR')} mm` : '';
            // Check if this room has a shop drawing pin
            const cadNameMap = {
              '주방 · 식당': 'kitchen',
              '거실 (확장부 포함)': 'living',
              '현관': 'shoe_left'
            };
            if (stageState.hasThermal) cadNameMap['발코니1'] = 'balcony1';
            if (cadNameMap[r.name]) {
              inspectShopDrawing(cadNameMap[r.name], false);
              return true;
            }
            updateInspector(
              `[CAD 구역] ${r.name}`,
              dimStr,
              `<div>${esc(scrubWorkText(r.memo || '정밀 CAD 구역 치수 및 설비 배치'))}</div>`
            );
            return true;
          }
        }
        return false;
      };

      cadSvg.addEventListener('pointerdown', e => {
        if (stageState.measureMode) return;
        if (e.button !== undefined && e.button !== 0) return;
        dragState = {
          startX: e.clientX,
          startY: e.clientY,
          startVb: [...stageState.vb],
          moved: false
        };
        cadSvg.classList.add('is-dragging');
      });

      cadSvg.addEventListener('pointermove', e => {
        const pt = svgPoint(e);
        const ro = document.getElementById('cad-readout');
        if (ro) ro.textContent = `x ${pt.x.toLocaleString('ko-KR')} · y ${pt.y.toLocaleString('ko-KR')} mm`;

        if (hoverTip && wrapEl) {
          const tipTarget = e.target.closest('[data-tip]');
          if (tipTarget && !dragState?.moved) {
            const wRect = wrapEl.getBoundingClientRect();
            hoverTip.innerHTML = scrubWorkText(tipTarget.getAttribute('data-tip'));
            hoverTip.hidden = false;
            const left = Math.min(wRect.width - 280, Math.max(8, e.clientX - wRect.left + 14));
            const top = Math.min(wRect.height - 90, Math.max(8, e.clientY - wRect.top + 14));
            hoverTip.style.left = `${left}px`;
            hoverTip.style.top = `${top}px`;
          } else {
            hoverTip.hidden = true;
          }
        }

        if (dragState && !stageState.measureMode) {
          const dxPx = e.clientX - dragState.startX;
          const dyPx = e.clientY - dragState.startY;
          if (Math.hypot(dxPx, dyPx) > 4) {
            dragState.moved = true;
            const rect = cadSvg.getBoundingClientRect();
            const [vx, vy, vw, vh] = dragState.startVb;
            const scaleX = rect.width ? vw / rect.width : 1;
            const scaleY = rect.height ? vh / rect.height : 1;
            stageState.vb = [
              Math.round(vx - dxPx * scaleX),
              Math.round(vy - dyPx * scaleY),
              vw,
              vh
            ];
            cadSvg.setAttribute('viewBox', stageState.vb.join(' '));
          }
        }
      });

      const endDrag = () => {
        if (dragState) {
          cadSvg.classList.remove('is-dragging');
          setTimeout(() => { dragState = null; }, 0);
        }
        if (hoverTip) hoverTip.hidden = true;
      };
      cadSvg.addEventListener('pointerup', endDrag);
      cadSvg.addEventListener('pointercancel', endDrag);
      cadSvg.addEventListener('pointerleave', endDrag);

      cadSvg.addEventListener('click', e => {
        if (dragState?.moved) return;
        if (stageState.measureMode) {
          let pt = svgPoint(e);
          if (stageState.measurePts.length === 1 && e.shiftKey) {
            const p0 = stageState.measurePts[0];
            let dx = pt.x - p0.x;
            let dy = pt.y - p0.y;
            if (Math.abs(dx) > Math.abs(dy)) dy = 0;
            else dx = 0;
            pt = { x: p0.x + dx, y: p0.y + dy };
          }
          if (stageState.measurePts.length >= 2) stageState.measurePts = [pt];
          else stageState.measurePts.push(pt);
          renderCadSvg();
          return;
        }
        inspectCadElement(e.target, true);
      });

      cadSvg.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (inspectCadElement(e.target, true)) {
            e.preventDefault();
          }
        }
      });

      // Wheel zoom on CAD
      cadSvg.addEventListener('wheel', e => {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 1.12 : 0.88;
        const [vx, vy, vw, vh] = stageState.vb;
        const nw = Math.min(18000, Math.max(1800, vw * factor));
        const nh = Math.min(14000, Math.max(1300, vh * factor));
        stageState.vb = [vx + (vw - nw) / 2, vy + (vh - nh) / 2, nw, nh];
        renderCadSvg();
      }, { passive: false });
    }

    // 3D Controls
    const presetBar = document.getElementById('v3-preset-bar');
    if (presetBar) {
      presetBar.addEventListener('click', e => {
        const btn = e.target.closest('[data-v3-idx]');
        if (!btn || !stageState.plan3d) return;
        const idx = Number(btn.getAttribute('data-v3-idx'));
        presetBar.querySelectorAll('[data-v3-idx]').forEach(b => {
          const active = Number(b.getAttribute('data-v3-idx')) === idx;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        stageState.plan3d.view(idx, !reduced);
        const v = window.HESSUP_CAD?.VIEWS3D?.[idx];
        const cap = document.getElementById('v3caption');
        if (cap && v) cap.innerHTML = `<b>${esc(v.title || v.name)}</b> — ${esc(v.note || v.caption || '')}`;
      });
    }

    const nightBtn = document.getElementById('v3-night-btn');
    if (nightBtn) {
      nightBtn.addEventListener('click', () => {
        if (!stageState.plan3d) return;
        const next = !stageState.plan3d.isNight();
        stageState.plan3d.setNight(next);
        nightBtn.classList.toggle('is-active', next);
        nightBtn.setAttribute('aria-pressed', next ? 'true' : 'false');
        nightBtn.textContent = next ? '낮 조명으로 전환' : '밤 조명 켜기';
      });
    }

    // Delegated clicks inside Inspector or Tab 4 for focusing shop pins
    document.addEventListener('click', e => {
      const focusPinBtn = e.target.closest('[data-focus-shop-pin]');
      if (focusPinBtn) {
        const pinId = focusPinBtn.getAttribute('data-focus-shop-pin');
        setSubmode('cad');
        const sd = SHOP_DRAWINGS.find(d => d.id === pinId);
        if (sd) {
          stageState.vb = [sd.box.x - 1200, sd.box.y - 900, Math.max(3800, sd.box.w + 2400), Math.max(2800, sd.box.h + 1800)];
          renderCadSvg();
        }
        inspectShopDrawing(pinId, false);
        const stageEl = document.getElementById('spatial-stage');
        stageEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      const openThermalBtn = e.target.closest('[data-open-thermal-lightbox]');
      if (openThermalBtn) {
        appCallbacks.onOpenLightbox('thermal', Number(openThermalBtn.getAttribute('data-open-thermal-lightbox') || 0));
        return;
      }

      const openShopSlideImg = e.target.closest('[data-open-shop-slide]');
      if (openShopSlideImg) {
        const shopIdx = Number(openShopSlideImg.getAttribute('data-shop-idx') || 0);
        const renderOffset = Number(openShopSlideImg.getAttribute('data-render-offset') || 1);
        appCallbacks.onOpenLightbox('shop', shopIdx, renderOffset);
      }
    });

    // Mobile Floating Drawer Toggle Button
    const fab = document.getElementById('mobile-stage-fab');
    const stageAside = document.getElementById('spatial-stage');
    if (fab && stageAside) {
      fab.addEventListener('click', () => {
        const collapsed = stageAside.classList.toggle('is-mobile-collapsed');
        fab.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        fab.textContent = collapsed ? '도면 · 3D 펼치기 ▾' : '도면 · 3D 접기 ▴';
      });
    }
  }

  window.StudioStage = {
    THERMAL_CUTS,
    SHOP_DRAWINGS,
    init(siteContent, callbacks, options = {}) {
      appCallbacks = { ...appCallbacks, ...callbacks };
      stageState.hasThermal = Boolean(options.hasThermal);
      document.querySelectorAll('.local-thermal-only').forEach(el => {
        el.hidden = !stageState.hasThermal || el.id === 'stage-panel-thermal';
      });
      renderZoneMap(siteContent, '전체');
      renderCadSvg();
      renderThermalAndShopGalleries();
      bindStageEvents(siteContent);
    },
    setSubmode,
    setStageExpanded,
    syncRoom,
    inspectShopDrawing,
    updateInspector
  };
})();

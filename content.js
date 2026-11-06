import { getCurrentWeekDates, formatTimeSlot, clearSelection, getDayStartMonday } from './calendar-utils.js';
import { fetchEvaluation, deleteEvaluation } from './evaluation-handler.js';
import { selectCellsBetween } from './selection-handler.js';
import { handleEvaluationRequest } from './evaluation-handler.js';

const setUpToggleButtonOnOriginCalendar = () => {
    const originalCalendarBoard = document.querySelector('div.mBox1.mSche1.isProgress');
    const originalHeader = originalCalendarBoard.querySelector('.title');
    if (originalHeader) {
        const originalToggleButton = document.createElement('button');
        originalToggleButton.className = 'toggle-button';
        originalToggleButton.textContent = '평가 하기';
        originalHeader.appendChild(originalToggleButton);
        originalToggleButton.addEventListener('click', toggleView);
    }
}

const createNewCalendar = () => {
    const newCalendar = document.createElement('div');
    newCalendar.id = 'newCalendar';
    
    const calendarContent = document.createElement('div');
    const timeTable = createTimeTable();
    setupDragSelection(timeTable);
    
    calendarContent.appendChild(timeTable);
    calendarContent.appendChild(createBottomContainer(timeTable));
    newCalendar.appendChild(calendarContent);
    
    // 현재 시간 선 추가
    updateCurrentTimeLine(timeTable);

    // 1분마다 시간 선 위치 업데이트
    setInterval(() => updateCurrentTimeLine(timeTable), 60000);
    
    // 30분마다 비활성화 셀 업데이트
    setInterval(() => updateDisabledCells(timeTable), 30 * 60 * 1000);
    return newCalendar;
};

const createTimeTable = () => {
    const timeTable = document.createElement('div');
    timeTable.className = 'time-table';
    
    const { today } = getCurrentWeekDates();
    const currentDay = today.getDay() || 7;
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();
    const currentTimeSlot = currentHour * 2 + (currentMinute >= 30 ? 1 : 0) - 1;
    
    addHeaderRow(timeTable);
    addTimeSlots(timeTable, currentDay, currentTimeSlot);
    
    return timeTable;
};

const addHeaderRow = (timeTable) => {
    const days = ['시간'];
    const dayNames = ['월', '화', '수', '목', '금', '토', '일'];
    const { monday } = getCurrentWeekDates();
    
    dayNames.forEach((day, index) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + index);
        days.push(`${day} ${date.getMonth() + 1}/${date.getDate()}`);
    });

    days.forEach(day => {
        const dayCell = document.createElement('div');
        dayCell.className = 'time-cell day-header';
        dayCell.innerHTML = day.replace('\n', '<br>');
        timeTable.appendChild(dayCell);
    });
};

const addTimeSlots = (timeTable, currentDay, currentTimeSlot) => {
    for (let timeSlot = 0; timeSlot <= 47; timeSlot++) {
        const { startTime, endTime } = formatTimeSlot(timeSlot);
        
        // 시간 라벨 추가
        const timeLabel = document.createElement('div');
        timeLabel.className = 'time-cell time-label';
        timeLabel.textContent = `${startTime}~${endTime}`;
        timeTable.appendChild(timeLabel);
        
        // 요일별 셀 추가
        addDayCells(timeTable, timeSlot, currentDay, currentTimeSlot);
    }
};

const addDayCells = (timeTable, timeSlot, currentDay, currentTimeSlot) => {
    for (let day = 0; day < 7; day++) {
        const cell = document.createElement('div');
        cell.className = 'time-cell selectable-cell';
        cell.dataset.timeSlot = timeSlot;
        cell.dataset.day = day;
        
        if (day + 1 < currentDay || (day + 1 === currentDay && timeSlot <= currentTimeSlot)) {
            cell.classList.add('disabled');
        }
        
        timeTable.appendChild(cell);
    }
};

const setupDragSelection = (timeTable) => {
    let isSelecting = false;
    let startCell = null;
    let lastHoveredCell = null;
    let isRemoving = false;

    timeTable.addEventListener('mousedown', (e) => {
        const cell = e.target;
        if (!cell.classList.contains('selectable-cell') || 
            cell.classList.contains('disabled') || 
            cell.classList.contains('already-selected')) return;
        
        isSelecting = true;
        startCell = cell;
        lastHoveredCell = cell;
        isRemoving = cell.classList.contains('selected');
        selectCellsBetween(timeTable, startCell, lastHoveredCell, isRemoving);
        e.preventDefault();
    });

    timeTable.addEventListener('mousemove', (e) => {
        const cell = e.target;
        if (!isSelecting || !cell.classList.contains('selectable-cell')) return;
        
        lastHoveredCell = cell;
        selectCellsBetween(timeTable, startCell, lastHoveredCell, isRemoving);
    });

    document.addEventListener('mouseup', () => {
        isSelecting = false;
        startCell = null;
        lastHoveredCell = null;
        isRemoving = false;
    });
};

const createBottomContainer = (timeTable) => {
    const bottomContainer = document.createElement('div');
    bottomContainer.className = 'bottom-button-container';
    
    const clearButton = document.createElement('button');
    clearButton.className = 'clear-button';
    clearButton.textContent = '선택된 셀 지우기';
    clearButton.addEventListener('click', () => clearSelection(timeTable));
    
    // 평가 취소 버튼 추가
    const cancelAllButton = document.createElement('button');
    cancelAllButton.className = 'cancel-all-button';
    cancelAllButton.textContent = '평가 전체 취소';
    cancelAllButton.addEventListener('click', () => handleAllEvaluationCancel(timeTable));
    
    const evaluationButton = document.createElement('button');
    evaluationButton.className = 'evaluation-button';
    evaluationButton.textContent = '평가 하기';
    evaluationButton.addEventListener('click', () => {
        const selectedCells = timeTable.querySelectorAll('.selected');
        if (selectedCells.length > 0) {
            handleEvaluationRequest(selectedCells);
        } else {
            alert('평가를 요청할 시간을 선택해주세요.');
        }
    });
    
    bottomContainer.appendChild(clearButton);
    bottomContainer.appendChild(cancelAllButton);  // 새 버튼 추가
    bottomContainer.appendChild(evaluationButton);
    return bottomContainer;
};

// 모든 평가 취소 처리 함수
const handleAllEvaluationCancel = async (timeTable) => {
    const alreadySelectedCells = timeTable.querySelectorAll('.already-selected');
    if (alreadySelectedCells.length === 0) {
        alert('취소할 평가 요청이 없습니다.');
        return;
    }

    if (confirm(`전체 ${alreadySelectedCells.length}개의 평가 요청을 취소하시겠습니까?`)) {
        try {
            // 모든 취소 요청을 동시에 처리
            await Promise.all(
                Array.from(alreadySelectedCells).map(cell => {
                    const evlScdlSn = cell.dataset.evlScdlSn;
                    return deleteEvaluation(evlScdlSn);
                })
            );
            
            // 성공적으로 취소된 셀들 초기화
            alreadySelectedCells.forEach(cell => {
                cell.classList.remove('already-selected');
                delete cell.dataset.evlScdlSn;
                
                // 이벤트 리스너 제거
                const newCell = cell.cloneNode(true);
                cell.parentNode.replaceChild(newCell, cell);
            });
            
        } catch (error) {
            console.error('Error canceling all evaluations:', error);
            alert('평가 요청 취소 중 오류가 발생했습니다.');
        }
    }
};

const updateCurrentTimeLine = (timeTable) => {
    const existingLine = timeTable.querySelector('.current-time-line');
    if (existingLine) existingLine.remove();

    const currentTime = new Date();
    const hours = currentTime.getHours(); // 0-23
    const minutes = currentTime.getMinutes(); // 0-59
    
    const timeSlotHeight = 30;
    const gapHeight = 1;
    
    const startPosition = 10 + 40;
    const timeSlotCount = hours * 2;
    const position = startPosition + (timeSlotCount * timeSlotHeight) + gapHeight * (timeSlotCount - 1) + (timeSlotHeight * 2) * (minutes / 60);
    // 시간 선 추가
    const timeLine = document.createElement('div');
    timeLine.className = 'current-time-line';
    timeLine.style.top = `${position}px`;
    timeTable.appendChild(timeLine);
};

/**
 * 원본 캘린더의 평가시간 목록을 새로운 캘린더에 적용하는 함수
 * @param {Object} timeList - 날짜별 평가시간 객체
 * @example
 * {
 *   "2025.01.01": ["00:00 ~ 00:30", "00:30 ~ 01:00", "01:00 ~ 01:30"],
 *   "2025.01.02": ["00:00 ~ 00:30", "00:30 ~ 01:00", "01:00 ~ 01:30"]
 * }
 */
const applyOriginTimeListToNewCalendar = (timeList) => {
    const timeTable = document.querySelector('.time-table');
    if (!timeTable) return;

    Object.entries(timeList).forEach(([date, times]) => {
        const [year, month, day] = date.split('.').map(Number);
        const targetDate = new Date(year, month - 1, day);
        
        // 해당 날짜가 현재 주에 속하는지 확인
        const currentDay = getDayStartMonday(targetDate);
        times.forEach(({ timeSlot: curTimeSlot, evlScdlSn }) => {
            const startTime = curTimeSlot.split(' ~ ')[0];
            const [hours, minutes] = startTime.split(':').map(Number);
            
                // timeSlot 계산 (0-47)
                const timeSlot = hours * 2 + (minutes === 30 ? 1 : 0);
                
                // 해당하는 셀 찾아서 선택 표시
                const cell = timeTable.querySelector(
                    `[data-time-slot="${timeSlot}"][data-day="${currentDay}"]`
                );
                if (cell && !cell.classList.contains('disabled')) {
                    cell.classList.add('already-selected');
                    cell.dataset.evlScdlSn = evlScdlSn;  // evlScdlSn 저장
                    
                    // 클릭 이벤트 추가
                    cell.addEventListener('click', () => {
                        if (confirm('이 시간의 평가 요청을 취소하시겠습니까?')) {
                            handleEvaluationCancel(cell);
                        }
                    });
            }
        });
    });
};

// 평가 취소 처리 함수
const handleEvaluationCancel = async (cell) => {
    try {
        const evlScdlSn = cell.dataset.evlScdlSn;
        await deleteEvaluation(evlScdlSn);
        
        // 셀 초기화
        cell.classList.remove('already-selected');
        delete cell.dataset.evlScdlSn;
        
        // 이벤트 리스너 제거 (새로운 이벤트 리스너가 추가되지 않도록)
        const newCell = cell.cloneNode(true);
        cell.parentNode.replaceChild(newCell, cell);
        
    } catch (error) {
        console.error('Error canceling evaluation:', error);
        alert('평가 요청 취소 중 오류가 발생했습니다.');
    }
};



const createNewCalendarModal = () => {
    const modal = document.createElement('div');
    modal.id = 'newCalendarModal';
    
    const content = document.createElement('div');
    content.id = 'newCalendarContent';
    
    content.appendChild(createNewCalendar());
    modal.appendChild(content);
    
    // 외부 클릭 시 닫기
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    const { monday } = getCurrentWeekDates();
    const startYmd = monday.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').slice(0, -1);
    const endYmd = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').slice(0, -1);

    fetchEvaluation(startYmd, endYmd).then(data => {
        applyOriginTimeListToNewCalendar(data);
    });
    
    return modal;
};

const toggleView = () => {
    const newCalendarModal = document.getElementById('newCalendarModal');
    newCalendarModal.style.display = 'block';
};

const createCalendars = () => {
    const newCalendarModal = createNewCalendarModal();
    document.body.appendChild(newCalendarModal);
    
    const originalCalendarBoard = document.querySelector('div.mBox1.mSche1.isProgress');
    if (originalCalendarBoard) {
        setUpToggleButtonOnOriginCalendar();
    }
};

const setIndexBoxNoShow = () => {
    const indexBox = document.getElementById('jsOpt2');
    if (indexBox) {
        indexBox.classList.remove('active');
    }
}

const changeInputToTextArea = () => {
    const input = document.getElementById('evlFdbkCn');
    if (input) {
        const textarea = document.createElement('textarea');
        textarea.id = 'evlFdbkCn';
        textarea.name = input.name;
        textarea.value = input.value;
        textarea.className = 'it h48';
        textarea.title = '평가 피드백';
        textarea.placeholder = '내용';
        textarea.style.width = '808px';
        textarea.style.height = '200px';
        input.parentNode.replaceChild(textarea, input);
    }
}

const updateDisabledCells = (timeTable) => {
    const { today } = getCurrentWeekDates()
    const currentDay = today.getDay() || 7
    const currentHour = today.getHours()
    const currentMinute = today.getMinutes()
    const currentTimeSlot = currentHour * 2 + (currentMinute >= 30 ? 1 : 0) - 1

    // 모든 선택 가능한 셀을 순회
    const cells = timeTable.querySelectorAll('.selectable-cell')
    cells.forEach(cell => {
        const cellDay = parseInt(cell.dataset.day) + 1 // 0-based to 1-based
        const cellTimeSlot = parseInt(cell.dataset.timeSlot)

        // 과거 날짜이거나 현재 날짜의 지난 시간인 경우 비활성화
        if (cellDay < currentDay || (cellDay === currentDay && cellTimeSlot <= currentTimeSlot)) {
            cell.classList.add('disabled')
        }
    })
}

createCalendars();
setIndexBoxNoShow();
changeInputToTextArea();
/* ===== CIM: React Big Calendar 월간 뷰(/main/month) 전체 일정 표시 ===== */
(() => {
    const ROOT_KEY = '__cimRbcMonthRoot';
    const VERSION = '2026-11-05-rbc-v36';

    // 같은 버전이 이미 활성 상태면 중복 등록하지 않는다
    const prev = window[ROOT_KEY];
    if (prev && prev.version === VERSION && prev.active) return;

    const state = { version: VERSION, active: true, scheduled: false, observer: null, clickInstalled: false, lastHref: location.href };
    window[ROOT_KEY] = state;

    const LOG = '[CIM][RBC]';
    const debug = (...args) => {
        try { console.debug(LOG, ...args); } catch (_) {}
    };

    const isMonthRoute = () => location.hostname === 'usr.codyssey.kr' && (location.pathname.startsWith('/main/month') || location.pathname.startsWith('/ev/schedule/evaluationScheduleList'));
    const hasMonthView = () => !!document.querySelector('.rbc-month-view, .rbc-calendar');

    // React 내부(fiber)에서 컴포넌트 속성을 읽기 위한 도우미
    const getFiber = (element) => {
        if (!element) return null;
        for (const key of Object.keys(element)) {
            if (key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$')) return element[key];
        }
        return null;
    };

    const propsOf = (fiber) => (fiber && (fiber.memoizedProps || fiber.pendingProps)) || null;

    const walkFiber = (start, predicate, max = 140) => {
        let fiber = start;
        let i = 0;
        while (fiber && i++ < max) {
            try { if (predicate(fiber)) return fiber; } catch (_) {}
            fiber = fiber.return;
        }
        return null;
    };

    // 날짜를 'YYYY.MM.DD' 형식으로 바꾼다
    const fmtDate = (date) => {
        if (!date) return '';
        const dt = date instanceof Date ? date : new Date(date);
        if (Number.isNaN(dt.getTime())) return String(date).replace(/-/g, '.').slice(0, 10);
        return dt.getFullYear() + '.' + String(dt.getMonth() + 1).padStart(2, '0') + '.' + String(dt.getDate()).padStart(2, '0');
    };

    // 일정 객체를 화면에서 재식별할 수 있는 텀으로 바꾼다
    const eventId = (event) => {
        if (!event || typeof event !== 'object') return String(event ?? '');
        for (const key of ['id', 'scdlId', 'evlScdlSn', 'scheduleId', 'sn']) {
            const value = event[key];
            if (value != null && String(value) !== '') return String(value);
        }
        return String(event.title ?? event.fixedNm ?? event.name ?? '') + '|' + fmtDate(event.start ?? event.dt ?? event.bgngYmd ?? event.evlPsblYmd);
    };

    // 일정이 속한 날짜의 텀을 구한다
    const eventDayKey = (event, range) => {
        const raw = event?.start ?? event?.dt ?? event?.bgngYmd ?? event?.evlPsblYmd;
        if (raw != null) {
            const s = String(raw).replace(/-/g, '.');
            if (/^\d{4}\.\d{2}\.\d{2}/.test(s)) return s.slice(0, 10);
            const key = fmtDate(raw);
            if (key) return key;
        }
        return fmtDate(range?.[0]);
    };

    // 캘린더 전체(range/events) 속성을 fiber 탐색으로 수집한다
    const scanCalendarRangeEvents = () => {
        const calendar = document.querySelector('.rbc-month-view') || document.querySelector('.rbc-calendar');
        const root = getFiber(calendar);
        const result = [];
        const seen = new Set();
        const stack = root ? [{ fiber: root, depth: 0 }] : [];
        while (stack.length) {
            const { fiber, depth } = stack.pop();
            if (!fiber || depth > 16 || seen.has(fiber)) continue;
            seen.add(fiber);
            const props = propsOf(fiber);
            if (props && Array.isArray(props.range) && props.range.length === 7 && Array.isArray(props.events) && props.events.length > 0) {
                result.push({ range: props.range, events: props.events, fiber });
            }
            if (fiber.child) stack.push({ fiber: fiber.child, depth: depth + 1 });
            if (fiber.sibling) stack.push({ fiber: fiber.sibling, depth });
        }
        return result;
    };

    // fiber 탐색 결과 캐시(짧은 시간 동안 재사용)
    let calCache = { at: 0, items: [] };
    const getCalendarRangeEvents = (force) => {
        const now = Date.now();
        if (!force && now - calCache.at < 250 && calCache.items.length) return calCache.items;
        calCache = { at: now, items: scanCalendarRangeEvents() };
        return calCache.items;
    };

    const clearCalCache = () => { calCache = { at: 0, items: [] }; };

    const sameRange = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((date, i) => fmtDate(date) === fmtDate(b[i]));

    // 행(row)에 대응하는 range/events 정보를 구한다
    const getRowInfo = (rowContent) => {
        const fiber = walkFiber(getFiber(rowContent), (node) => {
            const props = propsOf(node);
            return props && Array.isArray(props.range) && Array.isArray(props.events);
        }, 100);
        const direct = fiber ? propsOf(fiber) : null;
        const range = direct?.range;
        if (!range || range.length !== 7) return null;
        const calendar = getCalendarRangeEvents().find((item) => sameRange(item.range, range));
        const events = (calendar && (!direct || calendar.events.length >= direct.events.length)) ? calendar.events : (direct?.events || []);
        return { range, events, fiber: calendar?.fiber || fiber };
    };

    // 행에서 일정 클릭 핸들러(onSelectEvent 등)를 찾는다
    const getHandlers = (startFiber) => propsOf(walkFiber(startFiber, (node) => {
        const props = propsOf(node);
        return props && (typeof props.onSelectEvent === 'function' || typeof props.onDoubleClickEvent === 'function');
    }, 180));

    const xsrfToken = () => {
        try {
            const match = (document.cookie || '').match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
            return match ? decodeURIComponent(match[1]) : '';
        } catch (_) {
            return '';
        }
    };

    // 요청 그룹별 평가자 정보 캐시: key -> {status, byId, at}
    const evalCache = new Map();

    // reqDetail('R||id|projectNo|lcorsNo|uqstnNo') 해석
    const parseReqDetail = (detail) => {
        const parts = String(detail || '').split('||');
        if (parts.length < 5 || (parts[0] !== 'R' && parts[0] !== 'A')) return null;
        return { kind: parts[0], id: parts[1], projectNo: Number(parts[2]), lcorsNo: Number(parts[3]), uqstnNo: Number(parts[4]) };
    };

    const reqCacheKey = (event) => {
        const detail = parseReqDetail(event?.resource?.reqDetail);
        return detail ? [detail.projectNo, detail.lcorsNo, detail.uqstnNo].join('|') : null;
    };

    // 평가 요청 일정의 평가자 이름이 있으면 반환한다
    const lookupEvaluator = (event) => {
        const resource = event?.resource && typeof event.resource === 'object' ? event.resource : {};
        const detail = parseReqDetail(resource.reqDetail);
        if (!detail || detail.kind !== 'R') return '';
        const cache = evalCache.get(reqCacheKey(event));
        if (!cache || cache.status !== 'done') return '';
        const ids = [detail.id, String(event?.id || ''), String(resource.scdlId || ''), String(resource.evlNo || ''), String(resource.mtlEvlSn || '')].filter(Boolean);
        for (const id of ids) {
            const record = cache.byId.get(String(id));
            if (record && record.evlMbrNm) return String(record.evlMbrNm).trim();
        }
        // 식별자로 못 찾으면 날짜+시간으로 유일한 후보를 찾는다
        const date = String(resource.bgngYmd || '').replace(/\./g, '-');
        const time = String(resource.bgngTm || '').trim();
        if (date && time) {
            const want = date + ' ' + time;
            let hit = null;
            let count = 0;
            for (const record of cache.byId.values()) {
                const started = String(record.mtlEvlPamBgngDtTxt || record.mtlEvlPamBgngDt || '').slice(0, 16);
                if (started === want) {
                    hit = record;
                    count++;
                }
            }
            if (count === 1 && hit && hit.evlMbrNm) return String(hit.evlMbrNm).trim();
        }
        return '';
    };

    // 평가자 이름이 비어 있을 때 필요한 요청 그룹만 서버에서 조회한다
    const ensureEvaluatorData = (events) => {
        const needed = new Map();
        (events || []).forEach((event) => {
            const resource = event?.resource && typeof event.resource === 'object' ? event.resource : {};
            if (!/^R\|\|/.test(String(resource.reqDetail || ''))) return;
            if (lookupEvaluator(event)) return;
            const detail = parseReqDetail(resource.reqDetail);
            const key = reqCacheKey(event);
            if (!detail || !key || evalCache.get(key)) return;
            needed.set(key, detail);
        });
        needed.forEach((detail, key) => {
            const token = xsrfToken();
            evalCache.set(key, { status: 'loading', byId: new Map() });
            fetch('https://api.usr.codyssey.kr/ev/request/mtlEvlTxnDtoByPkList', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': token
                },
                body: JSON.stringify({ projectNo: detail.projectNo, lcorsNo: detail.lcorsNo, uqstnNo: detail.uqstnNo })
            }).then((response) => response.text()).then((text) => {
                let json;
                try { json = JSON.parse(text); } catch (_) { json = null; }
                return json;
            }).then((json) => {
                const byId = new Map();
                const list = json && Array.isArray(json.result) ? json.result : [];
                list.forEach((record) => {
                    ['mtlEvlSn', 'evlNo', 'mteDmndSn'].forEach((k) => { if (record && record[k] != null) byId.set(String(record[k]), record); });
                });
                evalCache.set(key, { status: 'done', byId, count: list.length, at: Date.now() });
                debug('evaluator cache', key, list.length);
                clearCalCache();
                schedule('evaluator');
            }).catch((error) => {
                console.warn(LOG, 'evaluator fetch failed', key, error);
                evalCache.set(key, { status: 'error', byId: new Map(), at: Date.now() });
            });
        });
    };

    // 일정 유형에 따라 칩에 표시할 문구를 만든다
    const eventLabel = (event) => {
        const resource = event?.resource && typeof event.resource === 'object' ? event.resource : {};
        const title = String(event?.title ?? resource.title ?? resource.scheduleTitle ?? resource.fixedNm ?? '').trim();
        const gubun = String(resource.scdlGubunCd || '').toUpperCase();
        const detail = String(resource.reqDetail || '');

        let type = '';
        let status = String(resource.fixedNm || '').trim().replace(/^평가/, '');
        if (/진행/.test(status)) status = '진행중';
        else if (/취소/.test(status)) status = '취소';
        else if (/완료/.test(status)) status = '완료';

        const isReq = /^R\|\|/.test(detail);
        const isPart = /^A\|\|/.test(detail);
        const reqUsr = String(resource.scdlReqUsr || '').trim();
        const otherUsr = String(resource.scdlOwnUsr || resource.mbrNm || resource.scdlUsr || '').trim();

        let person;
        if (isPart) person = reqUsr || otherUsr;
        else if (isReq) person = otherUsr || '';
        else person = reqUsr || otherUsr;

        if (isReq) {
            const evaluator = lookupEvaluator(event);
            if (evaluator) person = evaluator;
        }

        if (gubun === 'EV' || isReq || isPart) {
            if (isReq) type = '평가요청';
            else if (isPart) type = '평가참여';
            else type = String(resource.scdlGubunNm || '평가').trim();
        } else if (gubun === 'AM' || String(resource.scheduleTypeNm || '').includes('이벤트') || String(resource.scdlGubunNm || '').includes('학사')) {
            const scheduleTypeNm = String(resource.scheduleTypeNm || '').trim();
            type = scheduleTypeNm || String(resource.scdlGubunNm || '학사일정').trim();
            if (type === '이벤트' && /교류|세션/.test(title)) type = '교류세션';
        } else {
            type = String(resource.scdlGubunNm || resource.fixedNm || '').trim();
        }

        const isEval = gubun === 'EV' || isReq || isPart;
        const time = String(resource.bgngTm && resource.endTm ? resource.bgngTm + '~' + resource.endTm : '').trim();

        let main = '';
        let sub = '';
        if (isEval) {
            main = type || title || '(일정)';
            if (person) main += ' · ' + person;
        } else {
            main = type || '(일정)';
            sub = title && title !== type ? title : '';
        }

        let statusText = '';
        let statusClass = 'event-tag';
        if (status && isEval && /^평가(요청|참여)/.test(type)) {
            statusText = status;
        } else if (!isEval) {
            try {
                if (gubun === 'AM' && String(resource.publicAt) === '1' && String(resource.cancelAt) !== '1') {
                    // заявку 가능 기간/일정 시작 기준으로 상태 문구를 정한다
                    const parseDt = (value) => {
                        const s = String(value || '').trim().replace(/\./g, '-').replace(' ', 'T');
                        const date = new Date(s.length === 16 ? s + ':00' : s);
                        return Number.isNaN(date.getTime()) ? NaN : date.getTime();
                    };
                    const now = Date.now();
                    const rcptBegin = parseDt(resource.rcptBgngDt);
                    const rcptEnd = parseDt(resource.rcptEndDt);
                    const scheduleBegin = parseDt(resource.scdlBgngDt || (resource.bgngYmd && resource.bgngTm ? resource.bgngYmd + ' ' + resource.bgngTm : ''));
                    const atnd = String(resource.atndAt || resource.myAtndAt || '');
                    if (atnd === '1' || atnd === 'Y') { statusText = '신청 완료'; statusClass = 'status-chip status-completed'; }
                    else if (Number.isFinite(scheduleBegin) && now >= scheduleBegin) { if (status && status !== '예정') statusText = status; }
                    else if (Number.isFinite(rcptBegin) && now < rcptBegin) { statusText = '신청 예정'; statusClass = 'status-chip status-upcoming'; }
                    else if (Number.isFinite(rcptEnd) && now > rcptEnd) { statusText = '신청 마감'; statusClass = 'status-chip status-closed'; }
                    else if (Number.isFinite(rcptBegin) && Number.isFinite(rcptEnd) && now >= rcptBegin && now <= rcptEnd) { statusText = '신청 가능'; statusClass = 'status-chip status-statusAvailable'; }
                }
                if (!statusText && status && status !== '예정') statusText = status;
            } catch (_) {
                if (status && status !== '예정') statusText = status;
            }
        }
        return { main, sub, time, statusText, statusClass, type, title, status, person, isEval };
    };

    // 칩 내용을 기존 표시 형식에 맞게 채운다
    const renderChipContent = (chip, event) => {
        const info = eventLabel(event);
        const content = chip.querySelector('.rbc-event-content') || chip;
        content.textContent = '';

        const resource = event?.resource && typeof event.resource === 'object' ? event.resource : {};
        const detail = String(resource.reqDetail || '');
        const gubun = String(resource.scdlGubunCd || '').toUpperCase();
        const isReq = /^R\|\|/.test(detail);
        const isPart = /^A\|\|/.test(detail);

        const kind = isReq ? 'ev-req' : isPart ? 'ev-res' : gubun === 'AM' ? 'academic' : '';
        const wrap = document.createElement('div');
        wrap.className = 'calendar-event' + (kind ? ' ' + kind : '');
        if (event?.resource?.fixedCd === '00006' || info.status === '완료') wrap.classList.add('event-over');

        const title = document.createElement('p');
        title.textContent = info.main;
        wrap.appendChild(title);

        if (info.sub) {
            const sub = document.createElement('small');
            sub.className = 'duration cim-subline';
            sub.textContent = info.sub;
            wrap.appendChild(sub);
        }
        if (info.time) {
            const time = document.createElement('small');
            time.className = 'duration';
            time.textContent = info.time;
            wrap.appendChild(time);
        }
        if (info.statusText) {
            const status = document.createElement('span');
            status.className = info.statusClass || 'event-tag';
            status.textContent = info.statusText;
            wrap.appendChild(status);
        }
        content.appendChild(wrap);

        // 도우미 텍스트(tooltip)로 전체 내용을 보여준다
        const full = info.title + (info.person ? ' / ' + info.person : '') + (info.time ? ' (' + info.time + ')' : '') + (info.status ? ' - ' + info.status : '');
        if (chip.setAttribute) chip.setAttribute('title', full);
        const existing = chip.querySelector('[title]');
        if (existing) existing.setAttribute('title', full);
    };

    // 일정의 종료 시각(ms). 구할 수 없으면 NaN
    const eventEndTime = (event) => {
        try {
            const resource = event?.resource && typeof event.resource === 'object' ? event.resource : {};
            if (resource.bgngYmd && resource.endTm && /^\d{1,2}:\d{2}$/.test(String(resource.endTm))) {
                const dt = new Date(String(resource.bgngYmd).replace(/\./g, '-') + 'T' + resource.endTm + ':00');
                if (!Number.isNaN(dt.getTime())) return dt.getTime();
            }
            const end = event?.end instanceof Date ? event.end : new Date(event?.end);
            if (!Number.isNaN(end?.getTime?.())) return end.getTime();
        } catch (_) {}
        return NaN;
    };

    // 일정 칩을 만든다. 기존 칩(템플릿)이 있으면 그것을 복제해 모양을 유지한다
    const makeChip = (event, handlers, template) => {
        const safeEvent = event && typeof event === 'object' ? event : {};
        let chip;
        if (template instanceof HTMLElement) {
            chip = template.cloneNode(true);
            chip.classList.add('cim-rbc-chip');
            chip.style.pointerEvents = 'auto';
            try {
                renderChipContent(chip, safeEvent);
            } catch (error) {
                (chip.querySelector('.rbc-event-content') || chip).textContent = String(safeEvent.title || '');
            }
        } else {
            chip = document.createElement('div');
            chip.className = 'rbc-event cim-rbc-chip';
            try {
                renderChipContent(chip, safeEvent);
            } catch (error) {
                chip.textContent = String(safeEvent.title || '');
            }
        }
        chip.dataset.cim = '1';
        chip.dataset.cimEventId = eventId(safeEvent);
        applyEventDim(chip, safeEvent);
        chip.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // 상세/신청 흐름 이후 사이트가 일정 상태를 갱신할 수 있으므로 한 동안 재확인한다
            cimBurst('chip-click', 15000);
            try {
                if (handlers && typeof handlers.onSelectEvent === 'function') return handlers.onSelectEvent(safeEvent, e);
                if (handlers && typeof handlers.onDoubleClickEvent === 'function') return handlers.onDoubleClickEvent(safeEvent, e);
            } catch (error) {
                console.warn('[CIM][RBC]', 'handler failed', error);
            }
        }, true);
        return chip;
    };

    // 지난/완료/취소 일정은 옅게 표시한다
    const applyEventDim = (chip, event) => {
        try {
            const end = eventEndTime(event);
            const resource = event?.resource && typeof event.resource === 'object' ? event.resource : {};
            const statusName = String(resource.fixedNm || '');
            const isDone = resource.fixedCd === '00006' || /완료/.test(statusName);
            const isCancel = resource.fixedCd === '00005' || /취소/.test(statusName);
            const dim = isDone || isCancel || (Number.isFinite(end) && end <= Date.now());
            if (chip && chip.classList) {
                chip.classList.toggle('cim-past', !!dim);
                if (dim) {
                    chip.style.opacity = '0.55';
                    chip.style.filter = 'saturate(0.55)';
                }
            }
            const over = chip && chip.querySelector ? chip.querySelector('.calendar-event') : null;
            if (over && over.classList) over.classList.toggle('event-over', !!dim);
        } catch (_) {}
    };

    // +N(더보기) 버튼을 숨긴다
    const hideShowMore = (rowContent) => {
        rowContent.querySelectorAll('.rbc-show-more').forEach((button) => {
            button.classList.add('cim-rbc-hidden');
            button.setAttribute('aria-hidden', 'true');
            button.tabIndex = -1;
        });
    };

    // 날짜 1칸 분량의 세그먼트(칩의 받침)를 만든다
    const makeSegment = (event, handlers, template) => {
        const segment = document.createElement('div');
        segment.className = 'rbc-row-segment';
        segment.style.flexBasis = '14.2857%';
        segment.style.maxWidth = '14.2857%';
        segment.style.boxSizing = 'border-box';
        segment.style.padding = '0 1px 1px';
        if (event) segment.appendChild(makeChip(event, handlers, template));
        return segment;
    };

    // 한 주(rowContent)의 모든 일정을 날짜별로 다시 표시한다
    const processRow = (rowContent) => {
        if (!(rowContent instanceof HTMLElement)) return;
        const info = getRowInfo(rowContent);
        if (!info || !Array.isArray(info.range) || !Array.isArray(info.events)) return;

        const template = rowContent.querySelector('.rbc-event:not(.cim-rbc-chip)');
        try { ensureEvaluatorData(info.events); } catch (_) {}

        // 시간 오름차순 정렬을 위한 텀
        const eventSortKey = (event) => {
            const resource = event?.resource && typeof event.resource === 'object' ? event.resource : {};
            const start = String(resource.bgngTm || '').trim();
            if (/^\d{1,2}:\d{2}/.test(start)) return start.padStart(5, '0');
            const startDate = event?.start instanceof Date ? event.start : new Date(event?.start);
            if (!Number.isNaN(startDate?.getTime?.())) {
                return String(startDate.getHours()).padStart(2, '0') + ':' + String(startDate.getMinutes()).padStart(2, '0');
            }
            return '99:99';
        };

        // 날짜별 일정 목록(중복 제외)
        const queues = info.range.map(() => []);
        const seenIds = info.range.map(() => new Set());
        info.events.forEach((event) => {
            try {
                const key = eventDayKey(event, info.range);
                const idx = info.range.findIndex((date) => fmtDate(date) === key);
                if (idx < 0) return;
                const id = eventId(event);
                if (seenIds[idx].has(id)) return;
                seenIds[idx].add(id);
                queues[idx].push(event);
            } catch (_) {}
        });
        queues.forEach((queue) => queue.sort((a, b) => eventSortKey(a).localeCompare(eventSortKey(b)) || eventId(a).localeCompare(eventId(b))));
        const total = queues.reduce((sum, queue) => sum + queue.length, 0);

        // 신청/상태 변화를 잡기 위한 시그니처
        const statusSig = (info.events || []).map((event) => {
            const resource = event && event.resource || {};
            return [eventId(event), resource.fixedCd || '', resource.fixedNm || '', resource.atndAt ?? '', resource.myAtndAt ?? '', resource.atndYn ?? '', resource.cancelAt ?? ''].join(':');
        }).join(',');
        const sig = fmtDate(info.range[0]) + '|' + info.events.length + '|' + total + '|all|' + statusSig.length + ':' + statusSig.slice(0, 120);

        const hasExtraRows = rowContent.querySelectorAll('.cim-rbc-extra-row').length > 0;
        if (rowContent.dataset.cimSig === sig && hasExtraRows === (total > 0)) return;
        rowContent.dataset.cimSig = sig;
        debug('render', { start: fmtDate(info.range[0]), events: info.events.length, total });

        const handlers = getHandlers(info.fiber);
        const fragment = document.createDocumentFragment();
        let built = 0;
        if (total) {
            let guard = 0;
            while (queues.some((queue) => queue.length) && guard++ < 60) {
                const extraRow = document.createElement('div');
                extraRow.className = 'rbc-row cim-rbc-extra-row';
                extraRow.dataset.cim = '1';
                for (let i = 0; i < 7; i++) {
                    try {
                        extraRow.appendChild(makeSegment(queues[i].shift() || null, handlers, template));
                    } catch (_) {
                        extraRow.appendChild(makeSegment(null, handlers, template));
                    }
                }
                fragment.appendChild(extraRow);
                built++;
            }
        }

        // 기존 칩 행을 지우고 새로 채운다
        rowContent.querySelectorAll('.cim-rbc-extra-row').forEach((node) => node.remove());
        if (built) {
            rowContent.appendChild(fragment);
            rowContent.querySelectorAll(':scope > .rbc-row:not(.cim-rbc-extra-row)').forEach((row) => {
                if (row.querySelector('.rbc-date-cell, .rbc-header')) return;
                row.classList.add('cim-rbc-native-row-hidden');
                row.style.display = 'none';
                row.setAttribute('aria-hidden', 'true');
            });
        } else {
            // 일정이 없는 주는 사이트의 기본 표시로 되돌린다
            rowContent.querySelectorAll('.cim-rbc-native-row-hidden').forEach((row) => {
                row.classList.remove('cim-rbc-native-row-hidden');
                row.style.display = '';
                row.removeAttribute('aria-hidden');
            });
        }
        hideShowMore(rowContent);
    };

    const run = () => {
        state.scheduled = false;
        if (!isMonthRoute()) {
            document.body.classList.remove('cim-rbc-month');
            return;
        }
        document.body.classList.toggle('cim-rbc-month', hasMonthView());
        if (!hasMonthView()) return;
        document.querySelectorAll('.rbc-month-view .rbc-month-row .rbc-row-content').forEach((rowContent) => {
            try { processRow(rowContent); } catch (error) { console.warn(LOG, 'row failed', error); }
        });
    };

    // 한 프레임에 한 번만 실행되도록 예약한다
    const schedule = (reason) => {
        if (state.scheduled) return;
        state.scheduled = true;
        requestAnimationFrame(() => run(reason));
    };

    // 상태 변화 재확인(재계산)용
    let burstUntil = 0;

    const cimRefresh = (reason) => {
        try {
            clearCalCache();
            document.querySelectorAll('[data-cim-sig]').forEach((el) => { delete el.dataset.cimSig; });
            schedule(reason || 'refresh');
        } catch (_) {}
    };

    // 일정 기간 동간 반복 재확인(신청/취소 직후 반영용)
    const cimBurst = (reason, ms) => {
        burstUntil = Math.max(burstUntil, Date.now() + (ms || 12000));
        [120, 400, 800, 1400, 2200, 3200, 4500, 6000, 8000, 11000].forEach((delay) => {
            setTimeout(() => cimRefresh((reason || 'burst') + ':' + delay), delay);
        });
    };

    // 사이트의 신청/수정 통신과 모달 열림/닫힘을 지켜본다
    const installApplyWatcher = () => {
        if (window.__cimApplyWatcher) return;
        window.__cimApplyWatcher = true;
        const watchUrl = (url) => /academicSchedule|schedule|atnd|attend|apply|rcpt|lecture/i.test(String(url || ''));

        // fetch 감시
        try {
            const originalFetch = window.fetch;
            if (typeof originalFetch === 'function') {
                window.fetch = function(input, init) {
                    const url = typeof input === 'string' ? input : (input && input.url) || '';
                    const promise = originalFetch.apply(this, arguments);
                    if (watchUrl(url)) promise.then(() => cimBurst('fetch')).catch(() => {});
                    return promise;
                };
            }
        } catch (_) {}

        // XMLHttpRequest 감시
        try {
            const origOpen = XMLHttpRequest.prototype.open;
            const origSend = XMLHttpRequest.prototype.send;
            XMLHttpRequest.prototype.open = function(method, url) { this.__cimUrl = url; return origOpen.apply(this, arguments); };
            XMLHttpRequest.prototype.send = function() {
                if (watchUrl(this.__cimUrl)) this.addEventListener('loadend', () => cimBurst('xhr'), { once: true });
                return origSend.apply(this, arguments);
            };
        } catch (_) {}

        // 모달 열림/닫힘 감시와 주기 확인, 주요 버튼 클릭 감시
        try {
            let modalSeen = false;
            const hasModal = () => {
                const selectors = document.querySelectorAll('[role="dialog"],[aria-modal="true"],.modal,[class*="modal"],[class*="Modal"],[class*="popup"],[class*="Popup"],[class*="drawer"],[class*="Drawer"],[class*="layer"],[class*="Layer"]');
                return !!Array.from(selectors).find((el) => {
                    const style = getComputedStyle(el);
                    const rect = el.getBoundingClientRect();
                    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && rect.width > 30 && rect.height > 30;
                });
            };
            new MutationObserver(() => {
                const now = hasModal();
                if (now) {
                    modalSeen = true;
                    burstUntil = Math.max(burstUntil, Date.now() + 12000);
                } else if (modalSeen) {
                    modalSeen = false;
                    cimBurst('modal-close');
                }
            }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class', 'aria-hidden', 'open', 'aria-modal'] });
            setInterval(() => { if (Date.now() < burstUntil) cimRefresh('poll'); }, 900);
            document.addEventListener('click', (e) => {
                const target = e.target instanceof Element ? e.target.closest('button,a,[role="button"],input[type="submit"]') : null;
                if (!target) return;
                const text = (target.textContent || target.value || '').replace(/\s+/g, ' ').trim();
                if (/신청|취소|확인|저장|완료|등록|삭제|닫기|apply|save|confirm|submit|ok/i.test(text)) cimBurst('action', 15000);
            }, true);
        } catch (_) {}
    };

    // 월간 화면에서 일정 DOM 변화를 지켜본다
    const observe = () => {
        if (state.observer) return;
        state.observer = new MutationObserver((mutations) => {
            if (!isMonthRoute()) return;
            for (const mutation of mutations) {
                if (mutation.type !== 'childList') continue;
                const isOwnRow = (node) => node instanceof Element && !!node.closest?.('.cim-rbc-extra-row');
                [...mutation.addedNodes].some((node) => !isOwnRow(node))
                    || [...mutation.removedNodes].some((node) => !isOwnRow(node))
                    ? (Date.now() < burstUntil ? cimRefresh('mut-burst') : schedule('mut'), null)
                    : null;
                return;
            }
        });
        state.observer.observe(document.body, { childList: true, subtree: true });
    };

    // '오픈 스케줄등록' 버튼을 찾는다
    const findOpenScheduleBtn = () => Array.from(document.querySelectorAll('button,a,[role="button"]')).find((el) => {
        const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
        return (/open/i.test(text) && /schedule|스케줄/i.test(text)) || (text.includes('오픈') && text.includes('등록'));
    }) || null;

    // 오픈 일정 등록 모달의 날짜 입력란에 클릭한 날짜를 넣는다(best-effort)
    const prefillDate = (ymdDot) => {
        const ymd = String(ymdDot || '').replace(/\./g, '-');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return;
        for (const element of Array.from(document.querySelectorAll('input'))) {
            if (!(element instanceof HTMLInputElement)) continue;
            const style = getComputedStyle(element);
            if (style.display === 'none' || style.visibility === 'hidden') continue;
            const meta = (element.id + ' ' + element.name + ' ' + element.className + ' ' + element.placeholder + ' ' + (element.getAttribute('aria-label') || '')).toLowerCase();
            if (!(element.type === 'date' || /date|ymd|day|일자|날짜/.test(meta))) continue;
            try {
                const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
                if (setter) setter.call(element, ymd);
                else element.value = ymd;
                element.dispatchEvent(new Event('input', { bubbles: true }));
                element.dispatchEvent(new Event('change', { bubbles: true }));
                debug('prefill', ymd, element.id || element.name || element.type);
                return;
            } catch (_) {}
        }
    };

    // 행 결과에서 날짜 컬럼 인덱스의 날짜 텍스트를 구한다
    const dateFromRowIndex = (row, index) => {
        if (!row || index < 0 || index > 6) return null;
        const backgrounds = Array.from(row.querySelectorAll('.rbc-row-bg .rbc-day-bg'));
        const bg = backgrounds[index];
        if (bg && bg.classList.contains('rbc-off-range-bg')) return null;
        const info = getRowInfo(row.querySelector('.rbc-row-content'));
        return info?.range?.[index] ? fmtDate(info.range[index]) : null;
    };

    // 클릭 X 좌표가 어느 날짜 컬럼에 속하는지 구한다
    const indexFromPointInRow = (row, clientX) => {
        if (!row) return -1;
        const backgrounds = Array.from(row.querySelectorAll('.rbc-row-bg .rbc-day-bg'));
        for (let i = 0; i < backgrounds.length; i++) {
            const rect = backgrounds[i].getBoundingClientRect();
            if (clientX >= rect.left && clientX <= rect.right) return i;
        }
        const rowRect = row.getBoundingClientRect();
        if (rowRect.width <= 0) return -1;
        const index = Math.floor(((clientX - rowRect.left) / rowRect.width) * 7);
        return Math.max(0, Math.min(6, index));
    };

    // 빈 날짜 칸 클릭 시 기존 '오픈 스케줄등록'과 같은 동작을 실행한다
    // '오픈 스케줄등록' 모달이 화면 정가운데 뜨도록 위치 보정(빈 날짜 클릭 시 더블 센터링 방지)
    const centerOpenScheduleModal = () => {
        const modal = Array.from(document.querySelectorAll('.modal-overlay .modal-content')).find((el) => el.querySelector('.open-schedule-popup'));
        if (!modal) return;
        try {
            modal.style.top = 'auto';
            modal.style.left = 'auto';
            modal.style.transform = 'none';
        } catch (_) {}
    };

    const onEmptyDayClick = (e) => {
        if (!isMonthRoute()) return;
        const target = e.target;
        if (!(target instanceof Element)) return;
        // 일정/더보기/버튼 칸은 기존 동작을 유지한다
        if (target.closest('.rbc-event,.rbc-show-more,button,a,[role="button"],input,select,textarea,.cim-rbc-chip,.cim-rbc-extra-row .rbc-event')) return;
        const row = target.closest('.rbc-month-row');
        if (!row) return;

        // day-bg 또는 row-content/배경 클릭을 허용한다(버튼/a는 이미 위에서 걸러진다)
        const dayBg = target.closest('.rbc-day-bg');
        let index = -1;
        if (dayBg) {
            const backgrounds = Array.from(row.querySelectorAll('.rbc-row-bg .rbc-day-bg'));
            index = backgrounds.indexOf(dayBg);
            if (dayBg.classList.contains('rbc-off-range-bg')) return;
        } else if (target.closest('.rbc-row-content') || target.closest('.rbc-month-row')) {
            index = indexFromPointInRow(row, e.clientX);
        }
        if (index < 0) return;
        const dateKey = dateFromRowIndex(row, index);
        if (!dateKey) return;
        // preventDefault 하지 않는다: 사이트 모달 위치가 네이티브 클릭 흐름에 의존할 수 있다
        e.stopPropagation();
        const button = findOpenScheduleBtn();
        if (button) button.click();
        [60, 120, 250, 400].forEach((delay) => {
            setTimeout(() => {
                prefillDate(dateKey);
                centerOpenScheduleModal();
            }, delay);
        });
    };

    const install = () => {
        if (!isMonthRoute()) {
            document.body.classList.remove('cim-rbc-month');
            return;
        }
        observe();
        installApplyWatcher();
        if (!state.clickInstalled) {
            document.addEventListener('click', onEmptyDayClick, true);
            state.clickInstalled = true;
        }
        schedule('install');
        setTimeout(() => { if (isMonthRoute()) schedule('d300'); }, 300);
        setTimeout(() => { if (isMonthRoute()) schedule('d1200'); }, 1200);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', install, { once: true });
    } else {
        install();
    }

    // 라우트 변경 후에도 몇 번 더 다시 그린다
    let installSeq = 0;
    const installBurst = (reason) => {
        const seq = ++installSeq;
        clearCalCache();
        install();
        [120, 350, 700, 1400, 2400].forEach((delay) => {
            setTimeout(() => {
                if (seq !== installSeq || !isMonthRoute()) return;
                clearCalCache();
                schedule(reason + ':' + delay);
            }, delay);
        });
    };

    // 주기 확인: 더보기가 아직 보이거나 이 경로가 아니면 정리한다
    setInterval(() => {
        if (!isMonthRoute()) {
            document.body.classList.remove('cim-rbc-month');
            return;
        }
        if (location.href !== state.lastHref) {
            state.lastHref = location.href;
            installBurst('route');
            return;
        }
        if (!hasMonthView()) return;
        if (document.querySelectorAll('.rbc-show-more:not(.cim-rbc-hidden)').length) {
            clearCalCache();
            schedule('poll');
        }
    }, 800);

    window.addEventListener('popstate', () => installBurst('popstate'));
    window.addEventListener('hashchange', () => installBurst('hashchange'));

    // React Router가 URL 변화 없이 뷰를 바꿀 수 있으므로 history API도 감시한다
    ['pushState', 'replaceState'].forEach((method) => {
        const original = history[method];
        if (typeof original !== 'function' || history.__cimWrapped) return;
        history[method] = function(...args) {
            const result = original.apply(this, args);
            setTimeout(() => installBurst('history'), 50);
            return result;
        };
    });
    history.__cimWrapped = true;
})();

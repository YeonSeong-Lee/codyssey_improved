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
    addCurrentTimeLine(timeTable);
    // 1분마다 시간 선 위치 업데이트
    setInterval(() => addCurrentTimeLine(timeTable), 60000);
    
    return newCalendar;
};

const createTimeTable = () => {
    const timeTable = document.createElement('div');
    timeTable.className = 'time-table';
    
    const { today } = getCurrentWeekDates();
    const currentDay = today.getDay() || 7;
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();
    const currentTimeSlot = currentHour * 2 + (currentMinute >= 30 ? 1 : 0);
    
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

const addCurrentTimeLine = (timeTable) => {
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

    console.log('startYmd', startYmd);
    console.log('endYmd', endYmd);
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
        textarea.type = 'text';
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

createCalendars();
setIndexBoxNoShow();
changeInputToTextArea();
const setUpToggleButtonOnOriginCalendar = () => {
    const originalCalendarBoard = document.querySelector('div.mBox1.mSche1.isProgress');
    const originalHeader = originalCalendarBoard.querySelector('.title');
    if (originalHeader) {
        const originalToggleButton = document.createElement('button');
        originalToggleButton.className = 'toggle-button';
        originalToggleButton.textContent = 'CIM';
        originalHeader.appendChild(originalToggleButton);
        originalToggleButton.addEventListener('click', toggleView);
    }
}


const createNewCalendar = () => {
    const newCalendar = document.createElement('div');
    newCalendar.id = 'newCalendar';
    
    // 기본 구조 생성
    const calendarContent = document.createElement('div');
    
    // 시간 테이블 생성
    const timeTable = document.createElement('div');
    timeTable.className = 'time-table';
    
    // 헤재 날짜 기준으로 이번 주 월요일부터 일요일까지의 날짜 계산
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1); // 이번 주 월요일

    // 헤더 행 추가
    const days = ['시간'];
    const dayNames = ['월', '화', '수', '목', '금', '토', '일'];
    dayNames.forEach((day, index) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + index);
        days.push(`${day}\n${date.getMonth() + 1}/${date.getDate()}`);
    });

    days.forEach(day => {
        const dayCell = document.createElement('div');
        dayCell.className = 'time-cell day-header';
        dayCell.innerHTML = day.replace('\n', '<br>');
        timeTable.appendChild(dayCell);
    });
    
    // 현재 시간 정보 가져오기
    const now = new Date();
    const currentDay = now.getDay() || 7; // 0(일요일)을 7로 변경
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeSlot = currentHour * 2 + (currentMinute >= 30 ? 1 : 0);
    
    // 시간별 행 추가 (00:00부터 24:00까지, 30분 단위)
    for (let timeSlot = 0; timeSlot <= 47; timeSlot++) {
        const currentHour = Math.floor(timeSlot / 2);
        const nextHour = Math.floor((timeSlot + 1) / 2);
        const isFirstHalf = timeSlot % 2 === 0;
        
        // 시간 라벨 텍스트 생성
        const startTime = `${currentHour.toString().padStart(2, '0')}:${isFirstHalf ? '00' : '30'}`;
        const endTime = `${(isFirstHalf ? currentHour : nextHour).toString().padStart(2, '0')}:${isFirstHalf ? '30' : '00'}`;
        
        // 시간 라벨
        const timeLabel = document.createElement('div');
        timeLabel.className = 'time-cell time-label';
        timeLabel.textContent = `${startTime}~${endTime}`;
        timeTable.appendChild(timeLabel);
        
        // 각 요일별 셀 추가 (7일)
        for (let day = 0; day < 7; day++) {
            const cell = document.createElement('div');
            cell.className = 'time-cell selectable-cell';
            cell.dataset.timeSlot = timeSlot;
            cell.dataset.day = day;
            
            // 과거 시간 비활성화
            if (day + 1 < currentDay || (day + 1 === currentDay && timeSlot <= currentTimeSlot)) {
                cell.classList.add('disabled');
            }
            
            timeTable.appendChild(cell);
        }
    }
    
    // 드래그 선택 기능 추가
    let isSelecting = false;
    let startCell = null;
    let lastHoveredCell = null;
    let isRemoving = false;

    const clearSelection = () => {
        const selectedCells = timeTable.querySelectorAll('.selected');
        selectedCells.forEach(cell => cell.classList.remove('selected'));
    };

    const selectCellsBetween = (start, end, shouldRemove = false) => {
        if (!start || !end) return;
        
        const startTimeSlot = parseInt(start.dataset.timeSlot);
        const startDay = parseInt(start.dataset.day);
        const endTimeSlot = parseInt(end.dataset.timeSlot);
        const endDay = parseInt(end.dataset.day);
        
        const minTimeSlot = Math.min(startTimeSlot, endTimeSlot);
        const maxTimeSlot = Math.max(startTimeSlot, endTimeSlot);
        const minDay = Math.min(startDay, endDay);
        const maxDay = Math.max(startDay, endDay);
        
        // 새로운 영역 선택 또는 취소
        for (let timeSlot = minTimeSlot; timeSlot <= maxTimeSlot; timeSlot++) {
            for (let day = minDay; day <= maxDay; day++) {
                const cell = timeTable.querySelector(`[data-time-slot="${timeSlot}"][data-day="${day}"]`);
                if (cell && !cell.classList.contains('disabled')) {
                    if (shouldRemove) {
                        cell.classList.remove('selected');
                    } else {
                        cell.classList.add('selected');
                    }
                }
            }
        }
    };

    timeTable.addEventListener('mousedown', (e) => {
        const cell = e.target;
        if (!cell.classList.contains('selectable-cell') || cell.classList.contains('disabled')) return;
        
        isSelecting = true;
        startCell = cell;
        lastHoveredCell = cell;
        
        // 이미 선택된 셀을 클릭하면 선택 취소 모드로 전환
        isRemoving = cell.classList.contains('selected');
        selectCellsBetween(startCell, lastHoveredCell, isRemoving);
        
        e.preventDefault();
    });

    timeTable.addEventListener('mousemove', (e) => {
        const cell = e.target;
        if (!isSelecting || !cell.classList.contains('selectable-cell')) return;
        
        lastHoveredCell = cell;
        selectCellsBetween(startCell, lastHoveredCell, isRemoving);
    });

    document.addEventListener('mouseup', () => {
        isSelecting = false;
        startCell = null;
        lastHoveredCell = null;
        isRemoving = false;
    });
    
    calendarContent.appendChild(timeTable);
    
    // 하단 버튼 컨테이너 추가
    const bottomContainer = document.createElement('div');
    bottomContainer.className = 'bottom-button-container';
    
    // 초기화 버튼 추가
    const clearButton = document.createElement('button');
    clearButton.className = 'clear-button';
    clearButton.textContent = '시간 다 지우기';
    clearButton.addEventListener('click', () => {
        const selectedCells = timeTable.querySelectorAll('.selected');
        selectedCells.forEach(cell => {
            cell.classList.remove('selected');
        });
    });
    
    const evaluationButton = document.createElement('button');
    evaluationButton.className = 'evaluation-button';
    evaluationButton.textContent = '평가 요청하기';
    evaluationButton.addEventListener('click', () => {
        const selectedCells = timeTable.querySelectorAll('.selected');
        if (selectedCells.length > 0) {
            selectedCells.forEach(cell => {
                console.log(cell);
            });
        } else {
            alert('평가를 요청할 시간을 선택해주세요.');
        }
    });
    
    bottomContainer.appendChild(clearButton);
    bottomContainer.appendChild(evaluationButton);
    calendarContent.appendChild(bottomContainer);
    
    newCalendar.appendChild(calendarContent);
    
    // 현재 시간 선 추가
    const addCurrentTimeLine = () => {
        const existingLine = timeTable.querySelector('.current-time-line');
        const existingDot = timeTable.querySelector('.current-time-dot');
        if (existingLine) existingLine.remove();
        if (existingDot) existingDot.remove();

        const currentTime = new Date();
        const hours = currentTime.getHours();
        const minutes = currentTime.getMinutes();
        
        // 하루의 총 분 중 현재 시간이 차지하는 비율 계산
        const minutesSinceMidnight = hours * 60 + minutes;
        const totalMinutesInDay = 24 * 60;
        const progress = minutesSinceMidnight / totalMinutesInDay;
        
        // 전체 타임테이블 높이 (30px * 48슬롯)
        const totalHeight = 30 * 48;
        const headerHeight = 50;
        
        // 정확한 현재 시간 위치 계산
        const position = totalHeight * progress;
        
        // 시간 선 추가
        const timeLine = document.createElement('div');
        timeLine.className = 'current-time-line';
        timeLine.style.top = `${position + headerHeight}px`;
        timeTable.appendChild(timeLine);
    };

    // 초기 시간 선 추가
    addCurrentTimeLine();

    // 1분마다 시간 선 위치 업데이트
    setInterval(addCurrentTimeLine, 60000);
    
    return newCalendar;
}


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
    
    return modal;
};

const toggleView = () => {
    const newCalendarModal = document.getElementById('newCalendarModal');
    newCalendarModal.style.display = 'block';
};

const createEvaluationModal = () => {
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // 모달 헤더
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    
    const modalTitle = document.createElement('div');
    modalTitle.className = 'modal-title';
    modalTitle.textContent = '평가 요청';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.textContent = '×';
    closeButton.onclick = () => modal.style.display = 'none';
    
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);
    
    // 모달 바디
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    
    const selectedTimesDiv = document.createElement('div');
    selectedTimesDiv.id = 'selected-times';
    modalBody.appendChild(selectedTimesDiv);
    
    // 모달 푸터
    const modalFooter = document.createElement('div');
    modalFooter.className = 'modal-footer';
    
    const cancelButton = document.createElement('button');
    cancelButton.className = 'modal-button cancel-button';
    cancelButton.textContent = '취소';
    cancelButton.onclick = () => modal.style.display = 'none';
    
    const submitButton = document.createElement('button');
    submitButton.className = 'modal-button submit-button';
    submitButton.textContent = '평가 요청';
    submitButton.onclick = () => {
        const selectedCells = document.querySelectorAll('.selected');
        if (selectedCells.length > 0) {
            // 선택된 시간을 날짜별로 그룹화
            const dateGroups = {};
            selectedCells.forEach(cell => {
                const timeSlot = parseInt(cell.dataset.timeSlot);
                const day = parseInt(cell.dataset.day);
                const hour = Math.floor(timeSlot / 2);
                const minute = (timeSlot % 2) * 30;
                
                // 현재 날짜 기준으로 선택된 날짜 계산
                const today = new Date();
                const monday = new Date(today);
                monday.setDate(today.getDate() - today.getDay() + 1);
                const targetDate = new Date(monday);
                targetDate.setDate(monday.getDate() + day);
                
                const dateKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
                
                if (!dateGroups[dateKey]) {
                    dateGroups[dateKey] = [];
                }
                dateGroups[dateKey].push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
            });
            
            // 즉시 알림 표시
            alert('평가 요청 완료');
            modal.style.display = 'none';
            
            // 각 날짜별로 평가 요청
            Object.entries(dateGroups).forEach(([date, times]) => {
                // 평가 요청 버튼 클릭 이벤트 시뮬레���션
                const evaluationRequestButton = document.querySelector('button.btn.btn-primary[onclick^="fnEvalReqPopup"]');
                if (evaluationRequestButton) {
                    evaluationRequestButton.click();
                    
                    // 시간 입력
                    setTimeout(() => {
                        const timeInput = document.querySelector('input[name="evalReqTime"]');
                        if (timeInput) {
                            timeInput.value = times.join(', ');
                            
                            // 날짜 입력
                            const dateInput = document.querySelector('input[name="evalReqDate"]');
                            if (dateInput) {
                                dateInput.value = date;
                                
                                // 평가 요청 제출
                                const submitEvalButton = document.querySelector('button[onclick^="fnEvalReqSave"]');
                                if (submitEvalButton) {
                                    submitEvalButton.click();
                                }
                            }
                        }
                    }, 500);
                }
            });
        }
    };
    
    modalFooter.appendChild(cancelButton);
    modalFooter.appendChild(submitButton);
    
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);
    modal.appendChild(modalContent);
    
    // 외부 클릭 시 모달 닫기
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    };
    
    return modal;
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

createCalendars();
setIndexBoxNoShow();

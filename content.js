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
    calendarContent.className = 'mBox1 mSche1 isProgress';
    
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
            timeTable.appendChild(cell);
        }
    }
    
    // 드래그 선택 기능 추가
    let isSelecting = false;
    let isAdding = true;

    timeTable.addEventListener('mousedown', (e) => {
        if (!e.target.classList.contains('selectable-cell')) return;
        isSelecting = true;
        isAdding = !e.target.classList.contains('selected');
        e.target.classList.toggle('selected');
        e.preventDefault();
    });

    timeTable.addEventListener('mouseover', (e) => {
        if (!isSelecting || !e.target.classList.contains('selectable-cell')) return;
        if (isAdding) {
            e.target.classList.add('selected');
        } else {
            e.target.classList.remove('selected');
        }
    });

    document.addEventListener('mouseup', () => {
        isSelecting = false;
    });
    
    calendarContent.appendChild(timeTable);
    newCalendar.appendChild(calendarContent);
    return newCalendar;
}


const toggleView = () => {
    const originalCalendar = document.querySelector('div.list');
    const newCalendar = document.getElementById('newCalendar');
    if (originalCalendar.style.display === 'none') {
        originalCalendar.style.display = 'block';
        newCalendar.style.display = 'none';
    } else {
        originalCalendar.style.display = 'none';
        newCalendar.style.display = 'block';
    }
}

const createCalendars = () => {
    const newCalendar = createNewCalendar();
    const originalCalendarBoard = document.querySelector('div.mBox1.mSche1.isProgress');
    if (originalCalendarBoard) {
        originalCalendarBoard.appendChild(newCalendar);
        setUpToggleButtonOnOriginCalendar();
    }
}

const setIndexBoxNoShow = () => {
    const indexBox = document.getElementById('jsOpt2');
    if (indexBox) {
        indexBox.classList.remove('active');
    }
}

createCalendars();
setIndexBoxNoShow();

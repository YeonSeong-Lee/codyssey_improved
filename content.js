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
    // 메인 캘린더 컨테이너 생성
    const newCalendar = document.createElement('div');
    newCalendar.id = 'newCalendar';
    newCalendar.className = 'fc fc-unthemed fc-ltr';
    
    // 툴바 섹션 생성
    const toolbar = document.createElement('div');
    toolbar.className = 'fc-toolbar';
    
    // 툴바 왼쪽 영역
    const toolbarLeft = document.createElement('div');
    toolbarLeft.className = 'fc-left';
    
    // 툴바 오른쪽 영역 (버튼들)
    const toolbarRight = document.createElement('div');
    toolbarRight.className = 'fc-right';
    
    // Today 버튼
    const todayButton = document.createElement('button');
    todayButton.type = 'button';
    todayButton.className = 'fc-today-button fc-button fc-state-default fc-corner-left fc-corner-right';
    todayButton.textContent = 'today';
    
    // 이전/다음 버튼
    const prevButton = document.createElement('button');
    prevButton.type = 'button';
    prevButton.className = 'fc-prev-button fc-button fc-state-default fc-corner-left fc-corner-right';
    prevButton.innerHTML = '<span class="fc-icon fc-icon-left-single-arrow"></span>';
    
    const nextButton = document.createElement('button');
    nextButton.type = 'button';
    nextButton.className = 'fc-next-button fc-button fc-state-default fc-corner-left fc-corner-right';
    nextButton.innerHTML = '<span class="fc-icon fc-icon-right-single-arrow"></span>';
    
    // 툴바 중앙 영역 (타이틀)
    const toolbarCenter = document.createElement('div');
    toolbarCenter.className = 'fc-center';
    const title = document.createElement('h2');
    title.textContent = 'Dec 16 – 22, 2024';
    toolbarCenter.appendChild(title);
    
    // 툴바 클리어 div
    const toolbarClear = document.createElement('div');
    toolbarClear.className = 'fc-clear';
    
    // 툴바 조립
    toolbarRight.appendChild(todayButton);
    toolbarRight.appendChild(prevButton);
    toolbarRight.appendChild(nextButton);
    
    toolbar.appendChild(toolbarLeft);
    toolbar.appendChild(toolbarRight);
    toolbar.appendChild(toolbarCenter);
    toolbar.appendChild(toolbarClear);
    
    // 메인 캘린더에 툴바 추가
    newCalendar.appendChild(toolbar);
    
    // 캘린더 뷰 컨테이너 생성
    const viewContainer = document.createElement('div');
    viewContainer.className = 'fc-view-container';
    newCalendar.appendChild(viewContainer);
    
    newCalendar.style.display = 'none';
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
    originalCalendarBoard.appendChild(newCalendar);
    setUpToggleButtonOnOriginCalendar();
}

createCalendars();

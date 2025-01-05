// 날짜 관련 유틸리티 함수들
export const getCurrentWeekDates = () => {
    const today = new Date();
    const monday = new Date(today);
    const dayOfWeek = today.getDay();
    // 일요일(0)인 경우 이전 주의 월요일로 설정
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    monday.setDate(today.getDate() - daysToSubtract);
    return { today, monday };
};

export const formatDateKey = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const formatTimeSlot = (timeSlot) => {
    const hour = Math.floor(timeSlot / 2);
    const isFirstHalf = timeSlot % 2 === 0;
    const startTime = `${hour.toString().padStart(2, '0')}:${isFirstHalf ? '00' : '30'}`;
    const endTime = `${(isFirstHalf ? hour : Math.floor((timeSlot + 1) / 2)).toString().padStart(2, '0')}:${isFirstHalf ? '30' : '00'}`;
    return { startTime, endTime };
};

// 선택 관련 유틸리티 함수들
export const clearSelection = (timeTable) => {
    const selectedCells = timeTable.querySelectorAll('.selected');
    selectedCells.forEach(cell => cell.classList.remove('selected'));
};

export const getSelectedCellsGroups = (selectedCells) => {
    const dateGroups = {};
    selectedCells.forEach(cell => {
        const timeSlot = parseInt(cell.dataset.timeSlot);
        const day = parseInt(cell.dataset.day);
        const hour = Math.floor(timeSlot / 2);
        const minute = (timeSlot % 2) * 30;
        
        const { monday } = getCurrentWeekDates();
        const targetDate = new Date(monday);
        targetDate.setDate(monday.getDate() + day);
        
        const dateKey = formatDateKey(targetDate);
        if (!dateGroups[dateKey]) {
            dateGroups[dateKey] = [];
        }
        dateGroups[dateKey].push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    });
    return dateGroups;
};

export const getAfter30Minutes = (time) => {
    const [hour, minute] = time.split(':').map(Number);
    const newMinute = minute + 30;
    const newHour = newMinute === 60 ? hour + 1 : hour;
    const endMinute = newMinute === 60 ? '00' : String(newMinute).padStart(2, '0');
    const endTime = `${String(newHour).padStart(2, '0')}:${endMinute}`;
    return endTime;
};

export const getAfter6Months = (date) => {
    const endDate = new Date(date);
    endDate.setMonth(endDate.getMonth() + 6);
    const rpttEndYmd = endDate.toISOString().split('T')[0];
    return rpttEndYmd;
};

/**
 * 월요일 기준으로 요일 계산
 * 월 : 0, 화 : 1, 수 : 2, 목 : 3, 금 : 4, 토 : 5, 일 : 6
 */
export const getDayStartMonday = (date) => {
    const day = new Date(date).getDay()
    return day === 0 ? 6 : day - 1
};
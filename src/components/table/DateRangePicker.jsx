import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const DateRangePicker = ({
  initialStart = "",
  initialEnd = "",
  onApply,
  onClose,
}) => {
  const [startDate, setStartDate] = useState(
    initialStart ? new Date(initialStart) : null,
  );
  const [endDate, setEndDate] = useState(
    initialEnd ? new Date(initialEnd) : null,
  );
  const [currentMonth, setCurrentMonth] = useState(
    initialStart ? new Date(initialStart) : new Date(),
  );
  const [hoverDate, setHoverDate] = useState(null);

  const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];

  // Helpers
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateWithYear = (date) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  const generateDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const prevMonthDays = getDaysInMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );

    // Arrays to hold the days
    const days = [];

    // Previous month inactive days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() - 1,
          prevMonthDays - i,
        ),
        isCurrentMonth: false,
      });
    }

    // Current month active days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i),
        isCurrentMonth: true,
      });
    }

    // Next month inactive days (to fill 6 rows if necessary, or just up to 42 items)
    const remainingSlots = 42 - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      days.push({
        date: new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() + 1,
          i,
        ),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const isSameDate = (date1, date2) => {
    if (!date1 || !date2) return false;
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const isDateBetween = (date, start, end) => {
    if (!start || !end || !date) return false;
    // Strip time for accurate day comparison
    const d = new Date(date).setHours(0, 0, 0, 0);
    const s = new Date(start).setHours(0, 0, 0, 0);
    const e = new Date(end).setHours(0, 0, 0, 0);
    return d > s && d < e;
  };

  const handleDateClick = (dayDate) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(dayDate);
      setEndDate(null);
    } else if (startDate && !endDate) {
      if (dayDate < startDate) {
        setStartDate(dayDate);
      } else {
        setEndDate(dayDate);
      }
    }
  };

  const handleApply = () => {
    // Format YYYY-MM-DD for consistency with input type="date"
    const formatForInput = (d) => {
      if (!d) return "";
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    onApply({
      start: formatForInput(startDate),
      end: formatForInput(endDate),
    });
  };

  const calendarDays = generateDays();

  return (
    <div className="absolute right-0 top-full mt-2 bg-white border border-gray-100 shadow-xl rounded-2xl w-[380px] z-50 p-4 flex flex-col font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2 text-dark-blue">
          <CalendarIcon size={20} className="stroke-[1.5]" />
          <h4 className="text-[17px] font-semibold">Select Date Range</h4>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition"
        >
          <X size={20} className="stroke-[1.5]" />
        </button>
      </div>

      {/* Date Inputs */}
      <div className="flex gap-4 mb-2">
        <div className="flex-1">
          <label className="block text-gray-500 text-[13px] font-medium mb-1.5 ml-1">
            From
          </label>
          <div className="flex items-center gap-2 border border-gray-200 rounded-[10px] px-3 py-1 text-[14px]">
            <CalendarIcon size={16} className="text-gray-400 stroke-[1.5]" />
            <input
              type="text"
              readOnly
              placeholder="Start Date"
              value={formatDateWithYear(startDate)}
              className="outline-none border-none text-dark-blue font-medium w-full placeholder-gray-400 bg-transparent"
            />
          </div>
        </div>
        <div className="flex-1">
          <label className="block text-gray-500 text-[13px] font-medium mb-1.5 ml-1">
            To
          </label>
          <div className="flex items-center gap-2 border border-gray-200 rounded-[10px] px-3 py-1 text-[14px]">
            <CalendarIcon size={16} className="text-gray-400 stroke-[1.5]" />
            <input
              type="text"
              readOnly
              placeholder="End Date"
              value={formatDateWithYear(endDate)}
              className="outline-none border-none text-dark-blue font-medium w-full placeholder-gray-400 bg-transparent"
            />
          </div>
        </div>
      </div>

      {/* Calendar Area */}
      <div className="border border-gray-100 rounded-[16px] p-3 mb-3 shadow-sm">
        {/* Calendar Header Nav */}
        <div className="flex justify-between items-center mb-2">
          <h5 className="text-dark-blue font-medium text-[15px]">
            {formatMonthYear(currentMonth)}
          </h5>
          <div className="flex gap-1 text-gray-400">
            <button
              onClick={prevMonth}
              className="p-1 hover:bg-gray-100 rounded-full transition"
            >
              <ChevronLeft size={16} className="stroke-2" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1 hover:bg-gray-100 rounded-full transition"
            >
              <ChevronRight size={16} className="stroke-2" />
            </button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 mb-1">
          {daysOfWeek.map((day, idx) => (
            <div
              key={idx}
              className="text-center text-dark-blue font-semibold text-[13px] pb-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-y-0.5 relative">
          {calendarDays.map((dayObj, idx) => {
            const isStart = isSameDate(dayObj.date, startDate);
            const isEnd = isSameDate(dayObj.date, endDate);

            // For hover styling
            const effectiveEnd = endDate || hoverDate;
            let isBetween = false;
            let isEndHover = false;

            if (startDate && effectiveEnd) {
              const startDateTime = startDate.setHours(0, 0, 0, 0);
              const endDateTime = effectiveEnd.setHours(0, 0, 0, 0);

              if (startDateTime < endDateTime) {
                isBetween = isDateBetween(dayObj.date, startDate, effectiveEnd);
                if (!endDate && hoverDate) {
                  isEndHover = isSameDate(dayObj.date, hoverDate);
                }
              }
            }

            const inRangeBg =
              isBetween ||
              isEndHover ||
              (isStart &&
                effectiveEnd &&
                !isEndHover &&
                dayObj.date < effectiveEnd)
                ? "bg-active-bg"
                : "";

            let cornerClasses = "";
            if (isStart && effectiveEnd && startDate < effectiveEnd)
              cornerClasses = "rounded-l-lg";
            if ((isEnd || isEndHover) && startDate)
              cornerClasses = "rounded-r-lg";

            // Text color based on state
            let textColor = "text-gray-700";
            if (!dayObj.isCurrentMonth) textColor = "text-gray-300";
            if (isStart || isEnd) textColor = "text-white";
            else if (isBetween || isEndHover) textColor = "text-dark-blue"; // Dark text in light blue bg

            return (
              <div
                key={idx}
                className={`relative h-9 flex items-center justify-center text-[14px] ${inRangeBg} ${cornerClasses}`}
                onMouseEnter={() => {
                  if (startDate && !endDate && dayObj.date > startDate) {
                    setHoverDate(dayObj.date);
                  }
                }}
                onMouseLeave={() => setHoverDate(null)}
              >
                <button
                  onClick={() => handleDateClick(dayObj.date)}
                  className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all absolute z-10 ${
                    isStart || isEnd
                      ? "bg-purple font-medium shadow-md"
                      : dayObj.isCurrentMonth
                        ? "hover:bg-gray-100"
                        : "hover:bg-transparent"
                  } ${textColor} ${
                    !isStart && !isEnd && (isBetween || isEndHover)
                      ? "hover:bg-active-bg"
                      : ""
                  }`}
                >
                  {dayObj.date.getDate()}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <button
        onClick={handleApply}
        className="w-full bg-purple hover:bg-dark-blue text-white font-medium py-3 rounded-[10px] transition shadow-md"
      >
        Apply
      </button>
    </div>
  );
};

export default DateRangePicker;

"use client";

import { useState } from "react";

type Props = {
  selectedDate: string;
  onChange: (date: string) => void;
};

export default function CalendarPicker({ selectedDate, onChange }: Props) {

  const today = new Date();

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const daysOfWeek = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  const firstDay = new Date(currentYear,currentMonth,1).getDay();
  const daysInMonth = new Date(currentYear,currentMonth+1,0).getDate();

  const monthNames = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec"
  ];

  const prevMonth = () => {
    if(currentMonth === 0){
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    }else{
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if(currentMonth === 11){
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    }else{
      setCurrentMonth(currentMonth + 1);
    }
  };

  const days = [];

  for(let i=0;i<firstDay;i++){
    days.push(<div key={"empty"+i}></div>);
  }

  for(let day=1;day<=daysInMonth;day++){

    const dateString = `${currentYear}-${String(currentMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;

    const isSelected = selectedDate === dateString;

    days.push(
      <button
        key={day}
        onClick={()=>onChange(dateString)}
        className={`
        h-10 w-10 rounded-lg text-sm flex items-center justify-center
        transition-all duration-200
        ${
          isSelected
          ? "bg-indigo-600 text-white shadow-md"
          : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-700"
        }
        `}
      >
        {day}
      </button>
    );
  }

  return (

    <div className="w-85 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-5">

        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100"
        >
          ←
        </button>

        <div className="flex gap-2">

          <select
            value={currentMonth}
            onChange={(e)=>setCurrentMonth(Number(e.target.value))}
            className="text-sm border border-gray-200 rounded-md px-2 py-1 bg-white"
          >
            {monthNames.map((m,i)=>(
              <option key={i} value={i}>{m}</option>
            ))}
          </select>

          <select
            value={currentYear}
            onChange={(e)=>setCurrentYear(Number(e.target.value))}
            className="text-sm border border-gray-200 rounded-md px-2 py-1 bg-white"
          >
            {Array.from({length:10}).map((_,i)=>{

              const year = currentYear - 5 + i;

              return(
                <option key={year} value={year}>
                  {year}
                </option>
              )
            })}
          </select>

        </div>

        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100"
        >
          →
        </button>

      </div>

      {/* WEEK DAYS */}
      <div className="grid grid-cols-7 text-xs text-gray-400 mb-3">
        {daysOfWeek.map((day)=>(
          <div key={day} className="text-center font-medium">
            {day}
          </div>
        ))}
      </div>

      {/* DAYS GRID */}
      <div className="grid grid-cols-7 gap-2">
        {days}
      </div>

    </div>
  );
}
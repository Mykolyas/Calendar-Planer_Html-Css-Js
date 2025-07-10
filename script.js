// Константи
const MAX_TITLE_LENGTH = 24;

// Отримання елементів DOM
const monthYearLabel = document.getElementById("month-year");
const calendar = document.getElementById("calendar");
const weekdaysEl = document.getElementById("weekdays");
const eventForm = document.getElementById("event-form");
const eventDate = document.getElementById("event-date");
const eventTitle = document.getElementById("event-title");
const modal = document.getElementById("modal");
const modalEvents = document.getElementById("modal-events");
const closeBtn = document.getElementById("close-button");

// Поточна дата
let currentDate = new Date();

// Дні тижня
const daysOfWeek = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

// Перевірка довжини назви події
function validateEventLength(title) {
  if (!title) {
    return { isValid: false, message: "Назва події не може бути порожньою." };
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return {
      isValid: false,
      message: `Назва події задовга! Максимум: ${MAX_TITLE_LENGTH} символи. Введено: ${title.length}`
    };
  }
  return { isValid: true };
}

// Вивід помилки
function showValidationError(message) {
  alert(message);
}

function setTodayAsDefaultEventDate() {
  const today = new Date();
  // Встановлюємо локальний час на північ, щоб уникнути зсуву через часовий пояс
  today.setHours(0, 0, 0, 0);
  const offset = today.getTimezoneOffset();
  const localDate = new Date(today.getTime() - offset * 60000);
  const formatted = localDate.toISOString().slice(0, 10);
  eventDate.value = formatted;
}

// Отримання назви місяця
function getMonthName(month) {
  return new Date(0, month).toLocaleString("default", { month: "long" });
}

// Збереження змін подій
function saveEventChanges(date, updatedEvents) {
  try {
    const allEvents = JSON.parse(localStorage.getItem("events") || "[]");
    const filtered = allEvents.filter(e => e.date !== date);
    const updated = [...filtered, ...updatedEvents];
    localStorage.setItem("events", JSON.stringify(updated));
  } catch (err) {
    console.error("Помилка при збереженні змін подій:", err);
    showValidationError("Сталася помилка при збереженні змін. Спробуйте ще раз.");
  }
}

// Показ модального вікна з подіями
function showModal(events, date) {
  modalEvents.innerHTML = "";

  events.forEach((e) => {
    const li = document.createElement("li");

    // Кнопка редагування
    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.onclick = () => {
      const newTitle = prompt("Edit event title:", e.title);
      if (newTitle !== null) {
        const trimmedTitle = newTitle.trim();
        const lengthCheck = validateEventLength(trimmedTitle);

        if (!lengthCheck.isValid) {
          showValidationError(lengthCheck.message);
          return;
        }

        try {
          const allEvents = JSON.parse(localStorage.getItem("events") || "[]");

          const duplicate = allEvents.find(ev =>
            ev.date === date &&
            ev.title.toLowerCase() === trimmedTitle.toLowerCase() &&
            ev.title !== e.title
          );

          if (duplicate) {
            showValidationError("Подія з такою назвою вже існує на цю дату.");
            return;
          }

          const updatedEvents = allEvents.map(ev => {
            if (ev.date === date && ev.title === e.title) {
              return { ...ev, title: trimmedTitle };
            }
            return ev;
          });

          localStorage.setItem("events", JSON.stringify(updatedEvents));
          renderCalendar(currentDate);
          modal.style.display = "none";
        } catch (err) {
          console.error("Помилка при оновленні події:", err);
          showValidationError("Сталася помилка при редагуванні події. Спробуйте ще раз.");
        }
      }
    };

    // Кнопка видалення
    const delBtn = document.createElement("button");
    delBtn.textContent = "❌";
    delBtn.onclick = () => {
      if (confirm("Ти точно хочеш видалити цю подію?")) {
      try {
        const allEvents = JSON.parse(localStorage.getItem("events") || "[]");
        const updatedEvents = allEvents.filter(ev => !(ev.date === date && ev.title === e.title));
        localStorage.setItem("events", JSON.stringify(updatedEvents));
        renderCalendar(currentDate);
        modal.style.display = "none";
      } catch (err) {
        console.error("Помилка при видаленні події:", err);
        showValidationError("Сталася помилка при видаленні події. Спробуйте ще раз.");
      }
      }
    };

    // Назва події
    const titleSpan = document.createElement("span");
    titleSpan.textContent = e.title;

    // Додавання елементів
    li.appendChild(editBtn);
    li.appendChild(delBtn);
    li.appendChild(titleSpan);
    modalEvents.appendChild(li);
  });

  modal.style.display = "flex";
}

// Закриття модального вікна
document.body.onclick = (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
  }
};

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    modal.style.display = "none";
  }
});

closeBtn.onclick = () => {
  modal.style.display = "none";
};

// Рендеринг календаря
function renderCalendar(date) {
  calendar.innerHTML = "";
  weekdaysEl.innerHTML = "";
  // Додавання заголовків днів тижня
  for (const day of daysOfWeek) {
    const dayEl = document.createElement("div");
    dayEl.className = "day-header";
    dayEl.textContent = day;
    weekdaysEl.appendChild(dayEl);
  }
  
  // Налаштування дати
  const year = date.getFullYear();
  const month = date.getMonth();
  monthYearLabel.textContent = `${getMonthName(month)} ${year}`;

  // Визначення першого та останнього днів місяця
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let startDay = firstDay.getDay();
  startDay = startDay === 0 ? 6 : startDay - 1;
  
  // Налаштування комірок календаря
  const totalDays = lastDay.getDate();
  const totalCells = Math.ceil((startDay + totalDays) / 7) * 7;
  const maxEventsToShow = 2;

  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement("div");
    cell.className = "day";

    const dayNum = i - startDay + 1;
    if (i >= startDay && dayNum <= totalDays) {
            
      // Номер дня
      cell.innerHTML = `<div class="day-number">${dayNum}</div>`;
      
      // Формування дати
      const thisDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            
      // Отримання подій
      let events = [];
      try {
        events = JSON.parse(localStorage.getItem("events") || "[]");
      } catch (err) {
        console.error("Помилка при отриманні подій:", err);
        showValidationError("Сталася помилка при завантаженні подій. Спробуйте ще раз.");
        events = [];
      }
      const dayEvents = events.filter(e => e.date === thisDate);
      
      // Показ обмеженої кількості подій
      const showable = dayEvents.slice(0, maxEventsToShow);

      for (const e of showable) {
        const eventEl = document.createElement("div");
        eventEl.className = "event";
        eventEl.textContent = e.title;
        eventEl.onclick = () => showModal([e], thisDate);
        cell.appendChild(eventEl);
      }

      // Кнопка "More" для додаткових подій
      if (dayEvents.length > maxEventsToShow) {
        const moreBtn = document.createElement("div");
        moreBtn.className = "more-events";
        moreBtn.textContent = `+${dayEvents.length - maxEventsToShow} more`;
        moreBtn.onclick = () => showModal(dayEvents, thisDate);
        cell.appendChild(moreBtn);
      }
    }

    calendar.appendChild(cell);
  }
}

// Додавання нової події
eventForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const titleInput = eventTitle.value.trim();
  const selectedDate = eventDate.value;

  // Перевірка довжини події
  const lengthCheck = validateEventLength(titleInput);
  if (!lengthCheck.isValid) {
    showValidationError(lengthCheck.message);
    return;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
    showValidationError("Невірний формат дати. Використовуйте формат YYYY-MM-DD.");
    return;
  }

  // Формування нового об'єкта події
  const newEvent = { date: selectedDate, title: titleInput };

  try {
    const events = JSON.parse(localStorage.getItem("events") || "[]");

    const duplicate = events.find(ev =>
      ev.date === newEvent.date && ev.title.toLowerCase() === newEvent.title.toLowerCase()
    );

    if (duplicate) {
      showValidationError("Подія з такою назвою вже існує на цю дату.");
      return;
    }

    events.push(newEvent);
    localStorage.setItem("events", JSON.stringify(events));
    renderCalendar(currentDate);

    eventForm.reset();
    setTodayAsDefaultEventDate();
  } catch (err) {
    console.error("Помилка при роботі з подіями:", err);
    showValidationError("Сталася помилка при збереженні події. Спробуйте ще раз.");
  }
});

// Перехід до попереднього місяця
document.getElementById("prev-month").onclick = () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar(currentDate);
};

// Перехід до наступного місяця
document.getElementById("next-month").onclick = () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar(currentDate);
};

// Ініціалізація
setTodayAsDefaultEventDate();
renderCalendar(currentDate);

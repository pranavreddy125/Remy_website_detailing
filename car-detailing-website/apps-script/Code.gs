const SHEET_NAME = "Bookings";
const BUFFER_MINUTES = 150; // 2.5 hours

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action || "").toLowerCase();
  if (action !== "check") {
    return textOutput_("unknown action");
  }

  const dateStr = e.parameter.date;
  const timeStr = e.parameter.time;
  if (!dateStr || !timeStr) {
    return textOutput_("missing date/time");
  }

  const requestedDate = buildDateTime_(dateStr, timeStr);
  if (!requestedDate) {
    return textOutput_("invalid datetime");
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME) || SpreadsheetApp.getActiveSheet();
  const values = sheet.getDataRange().getValues();
  if (!values.length) {
    return textOutput_("available");
  }

  // Locate date/time columns based on headers when possible, otherwise fall back to first two columns.
  const headers = values[0].map(String).map(h => h.trim().toLowerCase());
  const dateIndex = headers.indexOf("date");
  const timeIndex = headers.indexOf("time");
  const dateCol = dateIndex !== -1 ? dateIndex : 0;
  const timeCol = timeIndex !== -1 ? timeIndex : 1;

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const existingDate = buildDateTime_(row[dateCol], row[timeCol]);
    if (!existingDate) continue;

    const diffMinutes = Math.abs((existingDate.getTime() - requestedDate.getTime()) / 60000);
    if (diffMinutes < BUFFER_MINUTES) {
      return textOutput_("unavailable");
    }
  }

  return textOutput_("available");
}

function buildDateTime_(dateValue, timeValue) {
  const date = normalizeDate_(dateValue);
  if (!date) return null;

  const timeParts = extractTimeParts_(timeValue);
  if (!timeParts) return null;

  const combined = new Date(date.getTime());
  combined.setHours(timeParts.hours, timeParts.minutes, 0, 0);
  return combined;
}

function normalizeDate_(value) {
  if (value instanceof Date && !isNaN(value)) {
    const clone = new Date(value.getTime());
    clone.setHours(0, 0, 0, 0);
    return clone;
  }

  if (typeof value === "string") {
    const parts = value.split("-").map(Number);
    if (parts.length === 3) {
      const [year, month, day] = parts;
      const parsed = new Date(year, month - 1, day);
      if (!isNaN(parsed)) return parsed;
    }
    const fallback = new Date(value);
    if (!isNaN(fallback)) {
      fallback.setHours(0, 0, 0, 0);
      return fallback;
    }
  }

  return null;
}

function extractTimeParts_(value) {
  if (value instanceof Date && !isNaN(value)) {
    return { hours: value.getHours(), minutes: value.getMinutes() };
  }

  if (typeof value === "string") {
    const match = value.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      const hours = Number(match[1]);
      const minutes = Number(match[2]);
      if (!isNaN(hours) && !isNaN(minutes)) {
        return { hours, minutes };
      }
    }
  }

  if (typeof value === "number" && !isNaN(value)) {
    // Google Sheets can store times as fractions of a day.
    const date = new Date(Math.round(value * 24 * 60 * 60 * 1000));
    return { hours: date.getHours(), minutes: date.getMinutes() };
  }

  return null;
}

function textOutput_(message) {
  return ContentService.createTextOutput(message).setMimeType(ContentService.MimeType.TEXT);
}

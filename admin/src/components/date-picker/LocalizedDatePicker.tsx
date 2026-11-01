import { useMemo } from "react";
import DatePicker from "react-multi-date-picker";
import type { Calendar, Locale } from "react-date-object";
import DateObject from "react-date-object";

import gregorian from "react-date-object/calendars/gregorian";
import persian from "react-date-object/calendars/persian";
import arabic from "react-date-object/calendars/arabic";

import gregorian_en from "react-date-object/locales/gregorian_en";
import persian_fa from "react-date-object/locales/persian_fa";
import arabic_ar from "react-date-object/locales/arabic_ar";

import "./LocalizedDatePicker.css";

export type SupportedLanguage = "fa" | "en" | "tr" | "ar";

interface LocalizedDatePickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  language: SupportedLanguage;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
}

interface CalendarConfig {
  calendar: Calendar;
  locale: Locale;
  months?: string[];
  weekDays?: string[];
}

const turkishMonths = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

const turkishWeekDays = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

const calendarConfig: Record<SupportedLanguage, CalendarConfig> = {
  fa: {
    calendar: persian,
    locale: persian_fa,
  },
  en: {
    calendar: gregorian,
    locale: gregorian_en,
  },
  tr: {
    calendar: gregorian,
    locale: gregorian_en,
    months: turkishMonths,
    weekDays: turkishWeekDays,
  },
  ar: {
    calendar: arabic,
    locale: arabic_ar,
  },
};

function parseDate(
  value: string | null,
  calendar: Calendar,
): DateObject | null {
  if (!value) return null;

  const normalizedValue = value.slice(0, 10);

  const gregorianDate = new DateObject({
    date: normalizedValue,
    format: "YYYY-MM-DD",
    calendar: gregorian,
  });

  return gregorianDate.convert(calendar);
}

export default function LocalizedDatePicker({
  value,
  onChange,
  language,
  label,
  placeholder,
  disabled = false,
  required = false,
  error,
  className = "",
}: LocalizedDatePickerProps) {
  const config = calendarConfig[language];

  const pickerValue = useMemo(
    () => parseDate(value, config.calendar),
    [value, config.calendar],
  );

  const isRTL = language === "fa" || language === "ar";

  const handleChange = (date: DateObject | null) => {
    if (!date) {
      onChange(null);
      return;
    }

    const gregorianDate = date.convert(gregorian).format("YYYY-MM-DD");

    onChange(gregorianDate);
  };

  return (
    <div
      className={`localized-date-picker ${className}`}
      dir={isRTL ? "rtl" : "ltr"}>
      {label && (
        <label className="localized-date-picker__label">
          {label}
          {required && (
            <span className="localized-date-picker__required">*</span>
          )}
        </label>
      )}

      <DatePicker
        value={pickerValue}
        onChange={handleChange}
        calendar={config.calendar}
        locale={config.locale}
        months={config.months}
        weekDays={config.weekDays}
        format="YYYY/MM/DD"
        calendarPosition={isRTL ? "bottom-right" : "bottom-left"}
        placeholder={
          placeholder ??
          (language === "fa"
            ? "انتخاب تاریخ"
            : language === "ar"
              ? "اختر التاريخ"
              : language === "tr"
                ? "Tarih seçin"
                : "Select date")
        }
        disabled={disabled}
        required={required}
        editable={false}
        inputClass="localized-date-picker__input"
        containerClassName="localized-date-picker__container"
        className="localized-date-picker__calendar"
      />

      {error && <span className="localized-date-picker__error">{error}</span>}
    </div>
  );
}

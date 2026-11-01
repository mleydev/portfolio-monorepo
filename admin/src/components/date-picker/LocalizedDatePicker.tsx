import { useState } from "react";
import { Calendar } from "react-multi-date-picker";
import DateObject from "react-date-object";

import type { Calendar as CalendarType, Locale } from "react-date-object";

import gregorian from "react-date-object/calendars/gregorian";
import persian from "react-date-object/calendars/persian";
import arabic from "react-date-object/calendars/arabic";

import gregorian_en from "react-date-object/locales/gregorian_en";
import persian_fa from "react-date-object/locales/persian_fa";
import arabic_ar from "react-date-object/locales/arabic_ar";

import { CalendarDays, ChevronDown, X } from "lucide-react";

import "./LocalizedDatePicker.css";

export type SupportedLanguage = "fa" | "en" | "tr" | "ar";

interface Props {
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
  calendar: CalendarType;
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

const configs: Record<SupportedLanguage, CalendarConfig> = {
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

const placeholders: Record<SupportedLanguage, string> = {
  fa: "انتخاب تاریخ",
  en: "Select date",
  tr: "Tarih seçin",
  ar: "اختر التاريخ",
};

const normalizeDigits = (value: string): string => {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
};

/**
 * Parse a Gregorian ISO date and convert it to the requested calendar.
 */
const getDateObject = (
  value: string | null,
  calendar: CalendarType,
): DateObject | null => {
  if (!value) return null;

  const normalizedValue = normalizeDigits(value.trim());
  const match = normalizedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new DateObject({
    year,
    month,
    day,
    calendar: gregorian,
  });

  return date.convert(calendar);
};

/**
 * Convert a selected calendar date into a Gregorian ISO date.
 */
const toGregorianISO = (date: DateObject): string => {
  const formattedDate = date.convert(gregorian).format("YYYY-MM-DD");

  return formattedDate.replace(/[۰-۹]/g, (digit) =>
    String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)),
  );
};

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
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const config = configs[language];
  const isRTL = language === "fa" || language === "ar";
  const selectedDate = getDateObject(value, config.calendar);

  const displayValue = selectedDate ? selectedDate.format("YYYY/MM/DD") : "";

  const handleDateChange = (date: DateObject | DateObject[] | null) => {
    if (!date || Array.isArray(date)) return;

    const isoDate = toGregorianISO(date);

    console.log("Selected date:", date.format("YYYY/MM/DD"));
    console.log("ISO date:", isoDate);

    onChange(isoDate);
    setIsOpen(false);
  };
  const handleClear = () => {
    onChange(null);
    setIsOpen(false);
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

      <div className="localized-date-picker__wrapper">
        <button
          type="button"
          disabled={disabled}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          className={`localized-date-picker__trigger ${
            isOpen ? "is-open" : ""
          } ${error ? "has-error" : ""}`}
          onClick={() => setIsOpen((previous) => !previous)}>
          <CalendarDays size={17} />

          <span className={displayValue ? "" : "is-placeholder"}>
            {displayValue || placeholder || placeholders[language]}
          </span>

          <span className="localized-date-picker__actions">
            {value && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Clear date"
                className="localized-date-picker__clear"
                onClick={(event) => {
                  event.stopPropagation();
                  handleClear();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    event.stopPropagation();
                    handleClear();
                  }
                }}>
                <X size={14} />
              </span>
            )}

            <ChevronDown size={16} className={isOpen ? "is-rotated" : ""} />
          </span>
        </button>

        {isOpen && !disabled && (
          <div className="localized-date-picker__popup">
            <Calendar
              value={selectedDate ?? undefined}
              onChange={handleDateChange}
              calendar={config.calendar}
              locale={config.locale}
              months={config.months}
              weekDays={config.weekDays}
              format="YYYY/MM/DD"
              shadow={false}
              highlightToday
            />
          </div>
        )}
      </div>

      {error && <span className="localized-date-picker__error">{error}</span>}
    </div>
  );
}

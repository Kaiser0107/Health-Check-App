import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface DatePickerFieldProps {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (dateString: string, calculatedAge?: number) => void;
  error?: string;
  helperText?: string;
  maxYear?: number;
  minYear?: number;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function calculateAgeFromDate(dobString: string): number | null {
  if (!dobString) return null;
  const parts = dobString.split('-');
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;

  const birthDate = new Date(y, m, d);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 && age <= 140 ? age : null;
}

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  value,
  onChange,
  error,
  helperText,
  maxYear = new Date().getFullYear(),
  minYear = 1920,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [yearPickerVisible, setYearPickerVisible] = useState(false);

  // Parse initial selected date or default to 2000-01-01
  const initialDate = useMemo(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          return new Date(y, m, d);
        }
      }
    }
    return new Date(2000, 0, 1);
  }, [value]);

  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());
  const [selectedDay, setSelectedDay] = useState<number>(initialDate.getDate());

  const openCalendar = () => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          setViewYear(y);
          setViewMonth(m);
          setSelectedDay(d);
        }
      }
    }
    setYearPickerVisible(false);
    setModalVisible(true);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      if (viewYear > minYear) {
        setViewYear(viewYear - 1);
        setViewMonth(11);
      }
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      if (viewYear < maxYear) {
        setViewYear(viewYear + 1);
        setViewMonth(0);
      }
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Generate calendar days for the current viewMonth & viewYear
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const blanks: number[] = Array.from({ length: firstDayIndex }, (_, i) => i);
    const days: number[] = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return { blanks, days };
  }, [viewYear, viewMonth]);

  // Generate list of selectable years
  const availableYears = useMemo(() => {
    const years: number[] = [];
    for (let y = maxYear; y >= minYear; y--) {
      years.push(y);
    }
    return years;
  }, [maxYear, minYear]);

  const handleDaySelect = (day: number) => {
    setSelectedDay(day);
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const formatted = `${viewYear}-${mm}-${dd}`;
    const calculatedAge = calculateAgeFromDate(formatted);
    onChange(formatted, calculatedAge ?? undefined);
    setModalVisible(false);
  };

  const handleYearSelect = (year: number) => {
    setViewYear(year);
    setYearPickerVisible(false);
  };

  // Human readable display
  const displayFormatted = useMemo(() => {
    if (!value) return 'Tap to select date from calendar';
    const parts = value.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (m >= 0 && m < 12) {
        return `${MONTH_NAMES[m]} ${d}, ${y}`;
      }
    }
    return value;
  }, [value]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        style={[styles.inputButton, error ? styles.inputError : null]}
        onPress={openCalendar}
        accessibilityRole="button"
        accessibilityLabel={`Select date, currently ${displayFormatted}`}
      >
        <View style={styles.inputInnerRow}>
          <Ionicons name="calendar-outline" size={18} color="#2563eb" style={styles.calendarIcon} />
          <Text style={[styles.inputText, !value ? styles.placeholderText : null]}>
            {displayFormatted}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={16} color="#64748b" />
      </TouchableOpacity>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}

      {/* ─── CALENDAR MODAL ─────────────────────────────────────────────────── */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalHeaderTitle}>Select Date</Text>
                <Text style={styles.modalHeaderSubtitle}>
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                accessibilityLabel="Close date selector"
              >
                <Ionicons name="close-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {yearPickerVisible ? (
              /* Year Selection Grid */
              <View style={styles.yearPickerContainer}>
                <View style={styles.yearPickerHeader}>
                  <Text style={styles.yearPickerTitle}>Select Year</Text>
                  <TouchableOpacity
                    style={styles.backToCalButton}
                    onPress={() => setYearPickerVisible(false)}
                  >
                    <Ionicons name="arrow-back" size={16} color="#2563eb" />
                    <Text style={styles.backToCalText}>Back to Calendar</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.yearsScroll} contentContainerStyle={styles.yearsGrid}>
                  {availableYears.map((yr) => (
                    <TouchableOpacity
                      key={yr}
                      style={[styles.yearChip, yr === viewYear && styles.yearChipActive]}
                      onPress={() => handleYearSelect(yr)}
                    >
                      <Text
                        style={[
                          styles.yearChipText,
                          yr === viewYear && styles.yearChipTextActive,
                        ]}
                      >
                        {yr}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : (
              /* Month & Day Calendar */
              <>
                {/* Month & Year Navigation Row */}
                <View style={styles.navRow}>
                  <TouchableOpacity
                    style={styles.navArrow}
                    onPress={handlePrevMonth}
                    accessibilityLabel="Previous month"
                  >
                    <Ionicons name="chevron-back" size={20} color="#334155" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.yearMonthButton}
                    onPress={() => setYearPickerVisible(true)}
                    accessibilityLabel="Click to choose year"
                  >
                    <Text style={styles.monthYearText}>
                      {MONTH_NAMES[viewMonth]} {viewYear}
                    </Text>
                    <Ionicons
                      name="caret-down"
                      size={14}
                      color="#2563eb"
                      style={{ marginLeft: 4 }}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.navArrow}
                    onPress={handleNextMonth}
                    accessibilityLabel="Next month"
                  >
                    <Ionicons name="chevron-forward" size={20} color="#334155" />
                  </TouchableOpacity>
                </View>

                {/* Day of Week Row */}
                <View style={styles.weekRow}>
                  {DAYS_OF_WEEK.map((d, idx) => (
                    <Text key={idx} style={styles.weekDayText}>
                      {d}
                    </Text>
                  ))}
                </View>

                {/* Days Grid */}
                <View style={styles.daysGrid}>
                  {calendarDays.blanks.map((_, idx) => (
                    <View key={`b-${idx}`} style={styles.dayCell} />
                  ))}
                  {calendarDays.days.map((day) => {
                    const isSelected =
                      day === selectedDay &&
                      value ===
                        `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(
                          day
                        ).padStart(2, '0')}`;

                    return (
                      <TouchableOpacity
                        key={`d-${day}`}
                        style={[styles.dayCell, isSelected && styles.dayCellActive]}
                        onPress={() => handleDaySelect(day)}
                        accessibilityLabel={`${MONTH_NAMES[viewMonth]} ${day}, ${viewYear}`}
                      >
                        <Text
                          style={[styles.dayCellText, isSelected && styles.dayCellTextActive]}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Quick Shortcuts */}
                <View style={styles.shortcutsRow}>
                  <TouchableOpacity
                    style={styles.shortcutButton}
                    onPress={() => {
                      const today = new Date();
                      setViewYear(today.getFullYear());
                      setViewMonth(today.getMonth());
                      handleDaySelect(today.getDate());
                    }}
                  >
                    <Text style={styles.shortcutText}>Today</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.shortcutButton}
                    onPress={() => setYearPickerVisible(true)}
                  >
                    <Text style={styles.shortcutText}>Jump to Year</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  inputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 46,
  },
  inputInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  calendarIcon: {
    marginRight: 8,
  },
  inputText: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  placeholderText: {
    color: '#94a3b8',
    fontWeight: '400',
  },
  inputError: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 4,
  },
  helperText: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 360,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 10,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalHeaderSubtitle: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
    marginTop: 2,
  },

  // Navigation
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  navArrow: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  yearMonthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  monthYearText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1d4ed8',
  },

  // Week Days
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
    paddingHorizontal: 4,
  },
  weekDayText: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },

  // Days Grid
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  dayCell: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    marginVertical: 2,
  },
  dayCellActive: {
    backgroundColor: '#2563eb',
  },
  dayCellText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  dayCellTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },

  // Shortcuts
  shortcutsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: 6,
  },
  shortcutButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  shortcutText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },

  // Year Picker
  yearPickerContainer: {
    height: 280,
  },
  yearPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  yearPickerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  backToCalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backToCalText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
  },
  yearsScroll: {
    flex: 1,
  },
  yearsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 16,
  },
  yearChip: {
    width: '30%',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  yearChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  yearChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  yearChipTextActive: {
    color: '#ffffff',
  },
});

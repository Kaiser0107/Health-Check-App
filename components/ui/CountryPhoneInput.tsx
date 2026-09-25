import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface CountryInfo {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
  formatPlaceholder: string;
}

export const COUNTRIES: CountryInfo[] = [
  { name: 'Philippines', code: 'PH', dialCode: '+63', flag: '🇵🇭', formatPlaceholder: '912 345 6789' },
  { name: 'United States', code: 'US', dialCode: '+1', flag: '🇺🇸', formatPlaceholder: '202 555 0123' },
  { name: 'Canada', code: 'CA', dialCode: '+1', flag: '🇨🇦', formatPlaceholder: '416 555 0123' },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44', flag: '🇬🇧', formatPlaceholder: '7911 123456' },
  { name: 'Singapore', code: 'SG', dialCode: '+65', flag: '🇸🇬', formatPlaceholder: '8123 4567' },
  { name: 'Japan', code: 'JP', dialCode: '+81', flag: '🇯🇵', formatPlaceholder: '90 1234 5678' },
  { name: 'Australia', code: 'AU', dialCode: '+61', flag: '🇦🇺', formatPlaceholder: '412 345 678' },
  { name: 'Saudi Arabia', code: 'SA', dialCode: '+966', flag: '🇸🇦', formatPlaceholder: '50 123 4567' },
  { name: 'United Arab Emirates', code: 'AE', dialCode: '+971', flag: '🇦🇪', formatPlaceholder: '50 123 4567' },
  { name: 'Hong Kong', code: 'HK', dialCode: '+852', flag: '🇭🇰', formatPlaceholder: '9123 4567' },
  { name: 'Taiwan', code: 'TW', dialCode: '+886', flag: '🇹🇼', formatPlaceholder: '912 345 678' },
  { name: 'South Korea', code: 'KR', dialCode: '+82', flag: '🇰🇷', formatPlaceholder: '10 1234 5678' },
  { name: 'India', code: 'IN', dialCode: '+91', flag: '🇮🇳', formatPlaceholder: '98765 43210' },
  { name: 'Germany', code: 'DE', dialCode: '+49', flag: '🇩🇪', formatPlaceholder: '151 12345678' },
  { name: 'Malaysia', code: 'MY', dialCode: '+60', flag: '🇲🇾', formatPlaceholder: '12 345 6789' },
  { name: 'Indonesia', code: 'ID', dialCode: '+62', flag: '🇮🇩', formatPlaceholder: '812 3456 7890' },
  { name: 'Vietnam', code: 'VN', dialCode: '+84', flag: '🇻🇳', formatPlaceholder: '91 234 5678' },
  { name: 'Thailand', code: 'TH', dialCode: '+66', flag: '🇹🇭', formatPlaceholder: '81 234 5678' },
  { name: 'Qatar', code: 'QA', dialCode: '+974', flag: '🇶🇦', formatPlaceholder: '3312 3456' },
  { name: 'Kuwait', code: 'KW', dialCode: '+965', flag: '🇰🇼', formatPlaceholder: '9123 4567' },
  { name: 'Italy', code: 'IT', dialCode: '+39', flag: '🇮🇹', formatPlaceholder: '312 345 6789' },
  { name: 'Spain', code: 'ES', dialCode: '+34', flag: '🇪🇸', formatPlaceholder: '612 34 56 78' },
  { name: 'New Zealand', code: 'NZ', dialCode: '+64', flag: '🇳🇿', formatPlaceholder: '21 123 4567' },
];

export interface CountryPhoneInputProps {
  label: string;
  value: string;
  onChange: (fullNumber: string) => void;
  error?: string;
  helperText?: string;
}

export const CountryPhoneInput: React.FC<CountryPhoneInputProps> = ({
  label,
  value,
  onChange,
  error,
  helperText,
}) => {
  // Parse incoming value to find matching country code and local number
  const parsed = useMemo(() => {
    const trimmed = (value || '').trim();
    if (!trimmed) {
      return { country: COUNTRIES[0], localNumber: '' };
    }

    // Check if starts with a known dialCode (sort longest dialCode first, e.g. +971 before +1)
    const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
    for (const c of sorted) {
      if (trimmed.startsWith(c.dialCode)) {
        const local = trimmed.slice(c.dialCode.length).trim();
        return { country: c, localNumber: local };
      }
    }

    // If starts with '09' (Philippine standard local format: 09123456789)
    if (trimmed.startsWith('09')) {
      return { country: COUNTRIES[0], localNumber: trimmed.slice(1) };
    }

    // Default to Philippines with raw value
    return { country: COUNTRIES[0], localNumber: trimmed };
  }, [value]);

  const [selectedCountry, setSelectedCountry] = useState<CountryInfo>(parsed.country);
  const [localNumber, setLocalNumber] = useState<string>(parsed.localNumber);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Synchronize when value changes externally (e.g. resetting form)
  useEffect(() => {
    setSelectedCountry(parsed.country);
    setLocalNumber(parsed.localNumber);
  }, [parsed.country.code, parsed.localNumber]);

  const handleCountrySelect = (country: CountryInfo) => {
    setSelectedCountry(country);
    setModalVisible(false);
    setSearchQuery('');
    const full = localNumber.trim() ? `${country.dialCode} ${localNumber.trim()}` : country.dialCode;
    onChange(full);
  };

  const handleNumberChange = (text: string) => {
    // Strip unwanted chars, keep digits and spaces
    let clean = text.replace(/[^0-9]/g, '');
    // If user types '09...' when Philippines is selected, trim leading 0
    if (selectedCountry.code === 'PH' && clean.startsWith('09')) {
      clean = clean.slice(1);
    }
    setLocalNumber(clean);
    const full = clean ? `${selectedCountry.dialCode} ${clean}` : '';
    onChange(full);
  };

  const filteredCountries = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
        {/* Country Selector Trigger */}
        <TouchableOpacity
          style={styles.countryTrigger}
          onPress={() => setModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={`Select country code, currently ${selectedCountry.name} ${selectedCountry.dialCode}`}
        >
          <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
          <Text style={styles.countryDialCode}>{selectedCountry.dialCode}</Text>
          <Ionicons name="chevron-down" size={14} color="#64748b" style={styles.chevron} />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Local Number Input */}
        <TextInput
          style={styles.numberInput}
          value={localNumber}
          onChangeText={handleNumberChange}
          placeholder={selectedCountry.formatPlaceholder}
          placeholderTextColor="#94a3b8"
          keyboardType="phone-pad"
          autoCorrect={false}
          accessibilityLabel="Mobile phone number input"
        />
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}

      {/* ─── COUNTRY SELECTION MODAL ────────────────────────────────────────── */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Country Code</Text>
                <Text style={styles.modalSubtitle}>Auto-formats your mobile contact number</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setSearchQuery('');
                }}
                accessibilityLabel="Close country selector"
              >
                <Ionicons name="close-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search country name or code..."
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close" size={16} color="#94a3b8" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Country List */}
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => `${item.code}-${item.dialCode}`}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const isSelected = item.code === selectedCountry.code;
                return (
                  <TouchableOpacity
                    style={[styles.countryItem, isSelected && styles.countryItemActive]}
                    onPress={() => handleCountrySelect(item)}
                    accessibilityLabel={`Choose ${item.name} ${item.dialCode}`}
                  >
                    <Text style={styles.itemFlag}>{item.flag}</Text>
                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemName, isSelected && styles.itemNameActive]}>
                        {item.name}
                      </Text>
                      <Text style={styles.itemCode}>{item.code}</Text>
                    </View>
                    <Text style={[styles.itemDialCode, isSelected && styles.itemDialCodeActive]}>
                      {item.dialCode}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color="#2563eb"
                        style={{ marginLeft: 8 }}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    minHeight: 46,
  },
  inputRowError: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  countryTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  countryFlag: {
    fontSize: 20,
    marginRight: 6,
  },
  countryDialCode: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  chevron: {
    marginLeft: 4,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#cbd5e1',
    marginRight: 8,
  },
  numberInput: {
    flex: 1,
    paddingVertical: 10,
    paddingRight: 12,
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '500',
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
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  listContent: {
    paddingBottom: 20,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    borderRadius: 8,
  },
  countryItemActive: {
    backgroundColor: '#eff6ff',
  },
  itemFlag: {
    fontSize: 22,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  itemNameActive: {
    fontWeight: '700',
    color: '#1d4ed8',
  },
  itemCode: {
    fontSize: 11,
    color: '#94a3b8',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  itemDialCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  itemDialCodeActive: {
    color: '#2563eb',
    fontWeight: '700',
  },
});

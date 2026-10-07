import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardTypeOptions,
} from 'react-native';
import { theme } from '../../constants/theme';

export interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  editable?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  accessibilityLabel?: string;
  helperText?: string;
  style?: any;
  inputStyle?: any;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  placeholder,
  keyboardType = 'default',
  editable = true,
  multiline = false,
  numberOfLines = 1,
  accessibilityLabel,
  helperText,
  style,
  inputStyle,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
          error ? styles.inputError : null,
          !editable ? styles.inputDisabled : null,
          inputStyle,
        ]}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        keyboardType={keyboardType}
        editable={editable}
        multiline={multiline}
        numberOfLines={numberOfLines}
        accessibilityLabel={accessibilityLabel || label}
      />
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopColor: '#cbd5e1',
    borderLeftColor: '#cbd5e1',
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderRightColor: '#ffffff',
    borderBottomColor: '#ffffff',
    minHeight: 48,
  },
  multilineInput: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  inputError: {
    borderTopColor: '#fca5a5',
    borderLeftColor: '#fca5a5',
    borderRightColor: '#fee2e2',
    borderBottomColor: '#fee2e2',
    backgroundColor: '#fff5f5',
  },
  inputDisabled: {
    backgroundColor: '#e2e8f0',
    color: '#64748b',
    borderTopColor: '#cbd5e1',
    borderLeftColor: '#cbd5e1',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  helperText: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export interface AvatarPickerProps {
  uri?: string;
  name?: string;
  size?: number;
  label?: string;
  onChange: (uri?: string) => void;
  editable?: boolean;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  uri,
  name = 'Patient',
  size = 80,
  label = 'Profile Photo',
  onChange,
  editable = true,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const initialLetter = (name.trim().charAt(0) || 'P').toUpperCase();

  const handlePickFromLibrary = async () => {
    setModalVisible(false);
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Needed', 'Please allow photo library access in device settings.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const mimeType = asset.mimeType || 'image/jpeg';
        const imageUri = asset.base64
          ? `data:${mimeType};base64,${asset.base64}`
          : asset.uri;
        onChange(imageUri);
      }
    } catch (err) {
      console.error('[AvatarPicker] Library error:', err);
      Alert.alert('Error', 'Unable to pick photo from library.');
    }
  };

  const handlePickFromCamera = async () => {
    setModalVisible(false);
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Needed', 'Please allow camera access in device settings.');
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const mimeType = asset.mimeType || 'image/jpeg';
        const imageUri = asset.base64
          ? `data:${mimeType};base64,${asset.base64}`
          : asset.uri;
        onChange(imageUri);
      }
    } catch (err) {
      console.error('[AvatarPicker] Camera error:', err);
      Alert.alert(
        'Camera Unavailable',
        'Camera could not be opened. Please choose a photo from your library instead.'
      );
    }
  };

  const handleRemovePhoto = () => {
    setModalVisible(false);
    onChange(undefined);
  };

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={styles.avatarRow}>
        <TouchableOpacity
          style={[
            styles.avatarCircle,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
          onPress={() => editable && setModalVisible(true)}
          disabled={!editable}
          accessibilityRole="button"
          accessibilityLabel="Change profile picture"
        >
          {uri ? (
            <Image
              source={{ uri }}
              style={[
                styles.avatarImage,
                { width: size, height: size, borderRadius: size / 2 },
              ]}
            />
          ) : (
            <View style={styles.placeholderContainer}>
              <Text style={[styles.avatarInitial, { fontSize: size * 0.42 }]}>
                {initialLetter}
              </Text>
            </View>
          )}

          {editable && (
            <View style={styles.badgeIcon}>
              <Ionicons name="camera" size={14} color="#ffffff" />
            </View>
          )}
        </TouchableOpacity>

        {editable && (
          <TouchableOpacity
            style={styles.changeTextButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.changePhotoText}>
              {uri ? 'Change Photo' : 'Upload Photo'}
            </Text>
            <Text style={styles.tapPromptText}>Tap to take photo or choose from gallery</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ─── ACTION MODAL ────────────────────────────────────────────────────── */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Patient Profile Photo</Text>
            <Text style={styles.modalSubtitle}>
              Select a source to set or update patient photo
            </Text>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={handlePickFromLibrary}
              accessibilityLabel="Choose photo from library"
            >
              <View style={[styles.optionIconCircle, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name="images-outline" size={20} color="#2563eb" />
              </View>
              <View style={styles.optionTextCol}>
                <Text style={styles.optionTitle}>Choose from Gallery</Text>
                <Text style={styles.optionDesc}>Select an existing image from device</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={handlePickFromCamera}
              accessibilityLabel="Take a photo with camera"
            >
              <View style={[styles.optionIconCircle, { backgroundColor: '#f0fdf4' }]}>
                <Ionicons name="camera-outline" size={20} color="#16a34a" />
              </View>
              <View style={styles.optionTextCol}>
                <Text style={styles.optionTitle}>Take Photo</Text>
                <Text style={styles.optionDesc}>Use camera to capture new photo</Text>
              </View>
            </TouchableOpacity>

            {uri ? (
              <TouchableOpacity
                style={styles.modalOption}
                onPress={handleRemovePhoto}
                accessibilityLabel="Remove photo"
              >
                <View style={[styles.optionIconCircle, { backgroundColor: '#fef2f2' }]}>
                  <Ionicons name="trash-outline" size={20} color="#dc2626" />
                </View>
                <View style={styles.optionTextCol}>
                  <Text style={[styles.optionTitle, { color: '#dc2626' }]}>Remove Photo</Text>
                  <Text style={styles.optionDesc}>Revert to initial avatar letter</Text>
                </View>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    backgroundColor: '#eff6ff',
    borderWidth: 2,
    borderColor: '#bfdbfe',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarImage: {
    resizeMode: 'cover',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontWeight: '700',
    color: '#2563eb',
  },
  badgeIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#2563eb',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  changeTextButton: {
    marginLeft: 14,
    flex: 1,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
  },
  tapPromptText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    width: '100%',
    maxWidth: 360,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  optionIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionTextCol: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  optionDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  cancelButton: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
});

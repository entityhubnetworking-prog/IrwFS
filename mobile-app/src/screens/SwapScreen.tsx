import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { launchImageLibrary, launchCamera, ImagePickerResponse } from 'react-native-image-picker';
import { useAuth } from '../context/AuthContext';
import { swapAPI } from '../services/api';

export const SwapScreen: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [swapType, setSwapType] = useState<'image' | 'video'>('image');
  const [sourceUri, setSourceUri] = useState<string | null>(null);
  const [targetUri, setTargetUri] = useState<string | null>(null);
  const [resultUri, setResultUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async (type: 'source' | 'target') => {
    const options = {
      mediaType: swapType === 'image' || type === 'source' ? 'photo' : 'video' as const,
      quality: 0.8 as const,
    };

    const callback = (response: ImagePickerResponse) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Error', response.errorMessage || 'Failed to pick image');
        return;
      }
      
      const uri = response.assets?.[0]?.uri;
      if (uri) {
        if (type === 'source') {
          setSourceUri(uri);
        } else {
          setTargetUri(uri);
        }
      }
    };

    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => launchCamera(options, callback) },
        { text: 'Gallery', onPress: () => launchImageLibrary(options, callback) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSwap = async () => {
    if (!sourceUri || !targetUri) {
      Alert.alert('Error', 'Please select both source and target');
      return;
    }

    setLoading(true);
    try {
      let result;
      if (swapType === 'image') {
        result = await swapAPI.swapImage(sourceUri, targetUri);
      } else {
        result = await swapAPI.swapVideo(sourceUri, targetUri);
      }
      
      setResultUri(result.result_url);
      await refreshUser();
      Alert.alert('Success', 'Face swap completed!');
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Face swap failed';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSourceUri(null);
    setTargetUri(null);
    setResultUri(null);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.username}!</Text>
        <View style={styles.quotaContainer}>
          <Text style={styles.quotaText}>
            📷 Images: {user?.images_used}/{user?.image_quota}
          </Text>
          <Text style={styles.quotaText}>
            🎬 Videos: {user?.videos_used}/{user?.video_quota}
          </Text>
        </View>
      </View>

      <View style={styles.typeSelector}>
        <TouchableOpacity
          style={[styles.typeBtn, swapType === 'image' && styles.typeBtnActive]}
          onPress={() => { setSwapType('image'); resetForm(); }}
        >
          <Text style={[styles.typeBtnText, swapType === 'image' && styles.typeBtnTextActive]}>
            📷 Image
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, swapType === 'video' && styles.typeBtnActive]}
          onPress={() => { setSwapType('video'); resetForm(); }}
        >
          <Text style={[styles.typeBtnText, swapType === 'video' && styles.typeBtnTextActive]}>
            🎬 Video
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.swapContainer}>
        <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage('source')}>
          {sourceUri ? (
            <Image source={{ uri: sourceUri }} style={styles.previewImage} />
          ) : (
            <View style={styles.uploadPlaceholder}>
              <Text style={styles.uploadIcon}>👤</Text>
              <Text style={styles.uploadText}>Source Face</Text>
              <Text style={styles.uploadHint}>Tap to select</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.arrow}>➡️</Text>

        <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage('target')}>
          {targetUri ? (
            swapType === 'image' ? (
              <Image source={{ uri: targetUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.videoPlaceholder}>
                <Text style={styles.videoIcon}>🎬</Text>
                <Text style={styles.videoText}>Video selected</Text>
              </View>
            )
          ) : (
            <View style={styles.uploadPlaceholder}>
              <Text style={styles.uploadIcon}>🖼️</Text>
              <Text style={styles.uploadText}>Target {swapType === 'image' ? 'Image' : 'Video'}</Text>
              <Text style={styles.uploadHint}>Tap to select</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.swapButton, (!sourceUri || !targetUri || loading) && styles.swapButtonDisabled]}
        onPress={handleSwap}
        disabled={!sourceUri || !targetUri || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.swapButtonText}>🔄 Start Face Swap</Text>
        )}
      </TouchableOpacity>

      {resultUri && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Result</Text>
          {swapType === 'image' ? (
            <Image source={{ uri: resultUri }} style={styles.resultImage} />
          ) : (
            <View style={styles.videoResult}>
              <Text style={styles.videoResultIcon}>🎬</Text>
              <Text style={styles.videoResultText}>Video ready!</Text>
            </View>
          )}
          <TouchableOpacity style={styles.newSwapButton} onPress={resetForm}>
            <Text style={styles.newSwapButtonText}>New Swap</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 8,
  },
  quotaContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  quotaText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  typeBtn: {
    flex: 1,
    padding: 12,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    alignItems: 'center',
  },
  typeBtnActive: {
    backgroundColor: '#6366f1',
  },
  typeBtnText: {
    color: '#94a3b8',
    fontWeight: '600',
  },
  typeBtnTextActive: {
    color: '#fff',
  },
  swapContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  uploadBox: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#334155',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  uploadIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  uploadText: {
    color: '#f1f5f9',
    fontWeight: '600',
    marginBottom: 4,
  },
  uploadHint: {
    color: '#94a3b8',
    fontSize: 12,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  videoText: {
    color: '#f1f5f9',
    fontWeight: '600',
  },
  arrow: {
    fontSize: 24,
  },
  swapButton: {
    backgroundColor: '#6366f1',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  swapButtonDisabled: {
    opacity: 0.5,
  },
  swapButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  resultContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  resultTitle: {
    color: '#f1f5f9',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  resultImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  videoResult: {
    width: '100%',
    height: 200,
    backgroundColor: '#334155',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoResultIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  videoResultText: {
    color: '#f1f5f9',
    fontWeight: '600',
  },
  newSwapButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 24,
  },
  newSwapButtonText: {
    color: '#f1f5f9',
    fontWeight: '600',
  },
});

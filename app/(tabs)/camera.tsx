import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, PermissionsAndroid, Platform, Alert } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '../../lib/supabase';
import { useGroupStore, useAuthStore } from '../../lib/store';
import { useRouter } from 'expo-router';
import { moti } from 'moti';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { triggerWidgetReload, updateWidgetData } from '../../lib/widget';

// Toast component
const SendingToast = moti(View)({
  initial: { opacity: 0, scale: 0.5 },
  enter: { opacity: 1, scale: 1, transition: { type: 'spring', damping: 15, stiffness: 200 } },
  exit: { opacity: 0, scale: 0.5, transition: { type: 'timing', duration: 300 } },
});

// Ripple effect component
const Ripple = moti(View)({
  initial: { opacity: 0, scale: 0 },
  enter: { opacity: 0.2, scale: 3, transition: { type: 'timing', duration: 600 } },
});

export default function CameraScreen() {
  const router = useRouter();
  const { currentGroup } = useGroupStore();
  const { user } = useAuthStore();
  const [cameraRef, setCameraRef] = useState(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  [hasMediaPickerPermission, setHasMediaPickerPermission] = useState(null);
  const [type, setType] = useState(CameraType.back);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const [optimisticPhotoId, setOptimisticPhotoId] = useState(null); // For optimistic UI

  // Request camera permission
  useEffect(() => {
    (async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'LiveSnap needs access to your camera to take photos.',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        setHasCameraPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasCameraPermission(status === 'granted');
      }
    })();
  }, []);

  // Request media picker permission
  useEffect(() => {
    (async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Media Permission',
            message: 'LiveSnap needs access to your photos to pick images.',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        setHasMediaPickerPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        setHasMediaPickerPermission(status === 'granted');
      }
    })();
  }, []);

  if (hasCameraPermission === null) {
    return <View></View>;
  }
  if (hasCameraPermission === false) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-center text-foreground">
          Camera permission is required to use LiveSnap
        </Text>
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS === 'android') {
              PermissionsAndroid.openSettings();
            } else {
              // Linking.openSettings() would be used here
              Alert.alert('Please go to Settings to enable camera permission');
            }
          }}
          className="mt-4"
        >
          <Text className="text-warm-white">Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef || isProcessing) return;

    setIsProcessing(true);
    setShowToast(true);
    setShowRipple(true);

    // Generate optimistic ID for immediate UI update
    const optimisticId = Date.now() + Math.random();
    setOptimisticPhotoId(optimisticId);

    try {
      // 1. Take picture
      const photo = await cameraRef.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      // 2. Resize to 800x800 max with aspect ratio maintained
      const manipulated = await ImageManipulator.manipulate(
        photo.uri,
        [
          {
            resize: {
              width: 800,
              height: 800,
            },
          },
        ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      // 3. Show "sending..." toast (already set via state)

      // 4. Upload to Supabase Storage
      const fileName = `photos/${currentGroup.id}/${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}.jpg`;
      const { data, error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, manipulated.uri, {
          contentType: 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      // 5. Get public URL
      const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName);
      const imageUrl = urlData.publicUrl;

      // 6. Insert into photos table
      const { error: dbError, data: insertedData } = await supabase.from('photos').insert({
        group_id: currentGroup.id,
        sender_id: user.id,
        image_url: imageUrl,
      }).select().single();

      if (dbError) throw dbError;

      // 7. Trigger widget reload and update widget data
      const senderName = `${user.username || `User ${user.id}`}`;
      await triggerWidgetReload(currentGroup.id);
      await updateWidgetData(imageUrl, senderName);

      // Clear optimistic ID and show success
      setTimeout(() => {
        setIsProcessing(false);
        setShowToast(false);
        setShowRipple(false);
        setOptimisticPhotoId(null);
      }, 1500);
    } catch (err) {
      console.error(err);
      // Clear optimistic ID on error
      setOptimisticPhotoId(null);
      Alert.alert('Failed to process photo', 'Please try again.');
      setIsProcessing(false);
      setShowToast(false);
      setShowRipple(false);
      
      // Show error toast or shake animation would go here
    }
  };

  const pickImage = async () => {
    if (!hasMediaPickerPermission || isProcessing) return;

    setIsProcessing(true);
    setShowToast(true);
    setShowRipple(true);

    // Generate optimistic ID for immediate UI update
    const optimisticId = Date.now() + Math.random();
    setOptimisticPhotoId(optimisticId);

    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.cancelled) {
        // 2. Resize to 800x800 max with aspect ratio maintained
        const manipulated = await ImageManipulator.manipulate(
          result.uri,
          [
            {
              resize: {
                width: 800,
                height: 800,
              },
            },
          ],
          {
            compress: 0.8,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );

        // 3. Show "sending..." toast (already set via state)

        // 4. Upload to Supabase Storage
        const fileName = `photos/${currentGroup.id}/${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 9)}.jpg`;
        const { data, error: uploadError } = await supabase.storage
          .from('photos')
          .upload(fileName, manipulated.uri, {
            contentType: 'image/jpeg',
          });

        if (uploadError) throw uploadError;

        // 5. Get public URL
        const { data: urlData } = supabase.storage
          .from('photos')
          .getPublicUrl(fileName);
        const imageUrl = urlData.publicUrl;

        // 6. Insert into photos table
        const { error: dbError, data: insertedData } = await supabase.from('photos').insert({
          group_id: currentGroup.id,
          sender_id: user.id,
          image_url: imageUrl,
        }).select().single();

        if (dbError) throw dbError;

        // 7. Trigger widget reload and update widget data
        const senderName = `${user.username || `User ${user.id}`}`;
        await triggerWidgetReload(currentGroup.id);
        await updateWidgetData(imageUrl, senderName);

        // Clear optimistic ID and show success
        setTimeout(() => {
          setIsProcessing(false);
          setShowToast(false);
          setShowRipple(false);
          setOptimisticPhotoId(null);
        }, 1500);
      } else {
        setIsProcessing(false);
        setShowToast(false);
        setShowRipple(false);
        setOptimisticPhotoId(null);
      }
    } catch (err) {
      console.error(err);
      // Clear optimistic ID on error
      setOptimisticPhotoId(null);
      Alert.alert('Failed to process photo', 'Please try again.');
      setIsProcessing(false);
      setShowToast(false);
      setShowRipple(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Top bar */}
      <View className="flex-row items-center justify-between px-4 pb-4">
        <Text className="text-lg font-semibold text-foreground">
          {currentGroup?.name || 'LiveSnap'}
        </Text>
        <View className="flex-row space-x-2">
          {/* Member avatar row - simplified for now */}
          {[1, 2, 3].map((_, index) => (
            <View key={index} className="w-8 h-8 rounded-full overflow-hidden border-2 border-warm-white">
              <Image
                source={{ uri: 'https://via.placeholder.com/40' }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </View>
          ))}
        </View>
      </View>

      {/* Camera view */}
      <Camera
        ref={setCameraRef}
        style={StyleSheet.absoluteFill}
        type={type}
        className="flex-1"
      >
        {/* Bottom bar */}
        <View className="absolute bottom-0 left-0 right-0 flex-row items-center justify-between px-6 pb-12">
          {/* Left: Image picker */}
          <TouchableOpacity onPress={pickImage} className="p-4">
            <View className="w-12 h-12 rounded-xl overflow-hidden bg-white/10">
              {hasMediaPickerPermission === false ? (
                <MaterialCommunityIcons name="camera-off" size={20} color="white/50" />
              ) : (
                <Image
                  source={{ uri: 'https://via.placeholder.com/300x300' }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              )}
            </View>
          </TouchableOpacity>

          {/* Center: Shutter button */}
          <TouchableOpacity
            onPress={takePicture}
            className="relative w-18 h-18"
            disabled={isProcessing}
          >
            <View className="absolute inset-0 w-full h-full rounded-full bg-white/20" />
            <View className="absolute inset-0 w-full h-full rounded-full border-2 border-warm-white" />
            {showRipple && (
              <Ripple className="absolute inset-0 rounded-full bg-warm-white/20" />
            )}
            {isProcessing ? (
              <ActivityIndicator size="small" color="white" className="absolute inset-0 m-auto" />
            ) : (
              <View className="absolute inset-0 w-full h-full rounded-full bg-white" />
            )}
          </TouchableOpacity>

          {/* Right: Flip camera */}
          <TouchableOpacity
            onPress={() => setType(type === CameraType.back ? CameraType.front : CameraType.back)}
            className="p-4"
          >
            <MaterialCommunityIcons name="rotate-right" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </Camera>

      {/* Sending toast */}
      {showToast && (
        <View className="absolute bottom-24 left-0 right-0 flex items-center justify-center">
          <SendingToast className="bg-white/20 rounded-xl px-6 py-3">
            <Text className="text-warm-white">sending...</Text>
          </SendingToast>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({});
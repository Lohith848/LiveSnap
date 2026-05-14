import { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { moti } from 'moti';

// Animated input container
const AnimatedInput = moti(View)({
  initial: { opacity: 0, y: 20 },
  enter: { opacity: 1, y: 0, transition: { type: 'spring', damping: 15, stiffness: 200 } },
});

export default function Username() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [username, setUsername] = useState('');
  const [avatarUri, setAvatarUri] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pickImage = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access camera roll is required!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.cancelled) {
      setAvatarUri(result.uri);
    }
  };

  const handleSubmit = async () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (username.length > 20) {
      setError('Username must be 20 characters or less');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Upload avatar if selected
      let avatarUrl = null;
      if (avatarUri) {
        const fileName = `avatars/${Date.now()}.jpg`;
        const { data, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarUri, {
            contentType: 'image/jpeg',
          });

        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
        avatarUrl = urlData.publicUrl;
      }

      // Get current user from auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Update user metadata with username and avatar
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          username: username.trim(),
          avatar_url: avatarUrl,
        }
      });

      if (updateError) throw updateError;

      // Create profile record
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          username: username.trim(),
          avatar_url: avatarUrl,
          expo_push_token: null, // Will be updated later when we get the token
        });

      if (profileError) throw profileError;

      // Update auth store
      setUser(user);

      // Navigate to group onboarding
      router.replace('/onboarding/group');
    } catch (err) {
      console.error(err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 flex-col items-center justify-center bg-background px-6">
      <AnimatedInput delay={100}>
        <Text className="text-3xl font-serif text-warm-white mb-4">
          LiveSnap
        </Text>
      </AnimatedInput>
      
      <AnimatedInput delay={200}>
        <Text className="text-lg text-foreground/80 mb-6">
          What should we call you?
        </Text>
      </AnimatedInput>

      <AnimatedInput delay={300} className="w-full space-y-6">
        <View className="items-center">
          {avatarUri ? (
            <TouchableOpacity onPress={pickImage} className="w-24 h-24 rounded-full overflow-hidden border-2 border-warm-white/50">
              <Image
                source={{ uri: avatarUri }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={pickImage} className="w-24 h-24 rounded-full border-2 border-white/20 bg-white/10 flex items-center justify-center">
              <MaterialCommunityIcons name="camera" size={24} color="white" />
            </TouchableOpacity>
          )}
          <Text className="mt-2 text-xs text-foreground/60">
            Tap to add avatar
          </Text>
        </View>

        <TextInput
          placeholder="Username (max 20 chars)"
          value={username}
          onChangeText={setUsername}
          maxLength={20}
          className="w-full bg-white/10 border border-white/20 rounded-xl px-5 py-4 text-white placeholder-white/50"
          autoCapitalize="words"
          autoCorrect={false}
        />

        <Button
          title={loading ? 'Saving...' : 'Continue'}
          onPress={handleSubmit}
          loading={loading}
          color="#F5F5F0"
          className="w-full"
          disabled={loading || !username.trim()}
        />

        {error && (
          <Text className="text-sm text-red-400 text-center mt-2">
            {error}
          </Text>
        )}
      </AnimatedInput>
    </View>
  );
}

const styles = StyleSheet.create({});
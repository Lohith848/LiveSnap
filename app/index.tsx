import { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Image, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { moti } from 'moti';
import * as ImagePicker from 'expo-image-picker';

// Animated logo component
const Logo = moti(Text)({
  initial: { scale: 0.8, opacity: 0 },
  enter: { scale: 1, opacity: 1, transition: { type: 'spring', damping: 15, stiffness: 200 } },
  loop: { scale: [1, 1.05, 1], transition: { type: 'timing', duration: 2000 } },
});

export default function Index() {
  const router = useRouter();
  const { setUser, setSession } = useAuthStore();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [step, setStep] = useState('phone'); // phone, otp, verifying, authenticated
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Focus next input when a digit is entered
  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    
    if (text && index < 5) {
      setFocusedIndex(index + 1);
    } else if (!text && index > 0) {
      setFocusedIndex(index - 1);
    }
    
    // If all 6 digits are entered, verify
    if (!text && index === 5) {
      // Do nothing on backspace in last field
    } else if (text && index === 5) {
      verifyOtp();
    }
  };

  const sendOtp = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      // Format phone number (assuming US format for simplicity)
      const formatted = phoneNumber.replace(/\D/g, '');
      if (!/^\d{10}$/.test(formatted)) {
        setError('Please enter a valid 10-digit phone number');
        setLoading(false);
        return;
      }
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: `+1${formatted}`,
        options: {
          channel: 'sms'
        }
      });
      
      if (error) throw error;
      setStep('otp');
      setFocusedIndex(0);
    } catch (err) {
      console.error(err);
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    const code = otp.join('');
    if (!code || code.length < 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    
    setStep('verifying');
    setLoading(true);
    setError('');
    try {
      // Format phone number
      const formatted = phoneNumber.replace(/\D/g, '');
      const { data, error } = await supabase.auth.verifyOtp({
        phone: `+1${formatted}`,
        token: code,
        type: 'sms'
      });
      
      if (error) throw error;
      
      // Set user and session in store
      setUser(data.user);
      setSession(data.session);
      
      // Check if user has a profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      
      if (profile) {
        // User has profile, go to group onboarding
        router.replace('/onboarding/group');
      } else {
        // No profile, go to username onboarding
        router.replace('/onboarding/username');
      }
    } catch (err) {
      console.error(err);
      setError('Invalid code. Please try again.');
      setStep('otp');
    } finally {
      setLoading(false);
    }
  };

  // Handle back button on Android
  useEffect(() => {
    const backHandler = () => {
      if (step === 'otp') {
        setStep('phone');
        setPhoneNumber('');
        setOtp(Array(6).fill(''));
        setFocusedIndex(0);
        return true;
      }
      if (step === 'verifying') {
        setStep('otp');
        return true;
      }
      return false;
    };
    
    // This is a simplified version - in a real app you'd use BackHandler
    return () => {};
  }, [step]);

  if (step === 'phone') {
    return (
      <View className="flex-1 flex-col items-center justify-center bg-background px-6">
        <Logo className="text-5xl font-serif text-warm-white mb-4">
          LiveSnap
        </Logo>
        <Text className="text-lg text-foreground/80 mb-8">
          Share moments. Live on screens.
        </Text>
        
        <View className="w-full space-y-6">
          <TextInput
            placeholder="Phone Number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            className="w-full bg-white/10 border border-white/20 rounded-xl px-5 py-4 text-white placeholder-white/50"
            autoComplete="tel"
          />
          
          <Button
            title="Continue with Phone"
            onPress={sendOtp}
            loading={loading}
            color="#F5F5F0"
            className="w-full"
            disabled={!phoneNumber.trim() || loading}
          />
          
          {error && (
            <Text className="text-sm text-red-400 text-center mt-2">
              {error}
            </Text>
          )}
        </View>
      </View>
    );
  }

  if (step === 'otp' || step === 'verifying') {
    return (
      <View className="flex-1 flex-col items-center justify-center bg-background px-6">
        <Logo className="text-5xl font-serif text-warm-white mb-4">
          LiveSnap
        </Logo>
        <Text className="text-lg text-foreground/80 mb-6">
          Enter the 6-digit code sent to
        </Text>
        <Text className="text-xl font-medium text-foreground mb-8">
          +1 {phoneNumber.replace(/^(\d{3})(\d{3})(\d{4})$/, '$1-$2-$3')}
        </Text>
        
        <View className="w-[200px]">
          <View className="flex space-x-2">
            {otp.map((digit, index) => (
              <View key={index} className="flex-1 aspect-square">
                <TextInput
                  maxLength={1}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  keyboardType="number-pad"
                  className={`bg-white/10 border border-white/20 rounded-xl text-center text-2xl font-bold text-white placeholder-white/50 
                    ${index === focusedIndex ? 'border-warm-white/50' : ''}`}
                  autoFocus={index === focusedIndex}
                  placeholder=" "
                />
              </View>
            ))}
          </View>
        </View>
        
        {step === 'verifying' && (
          <View className="mt-6">
            <Text className="text-foreground/60">Verifying...</Text>
          </View>
        )}
        
        {step === 'otp' && error && (
          <Text className="text-sm text-red-400 text-center mt-4">
            {error}
          </Text>
        )}
        
        <Button
          title="Resend Code"
          onPress={sendOtp}
          className="mt-6 w-full"
          color="#F5F5F0"
          disabled={loading}
        />
      </View>
    );
  }
  
  // Should not reach here due to redirects
  return null;
}

const styles = StyleSheet.create({});
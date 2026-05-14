import { useState } from 'react';
import { View, Text, StyleSheet, Button, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { moti } from 'moti';

// Animated container
const AnimatedView = moti(View)({
  initial: { opacity: 0, y: 20 },
  enter: { opacity: 1, y: 0, transition: { type: 'spring', damping: 15, stiffness: 200 } },
});

// Animated text
const AnimatedText = moti(Text)({
  initial: { opacity: 0, y: 20 },
  enter: { opacity: 1, y: 0, transition: { type: 'spring', damping: 15, stiffness: 200 } },
});

export default function Widget() {
  const router = useRouter();

  return (
    <View className="flex-1 flex-col bg-background">
      <AnimatedView delay={100} className="flex-1 items-center justify-center px-6">
        <AnimatedText delay={200} className="text-3xl font-serif text-warm-white mb-8">
          LiveSnap
        </AnimatedText>
        
        <AnimatedText delay={300} className="text-lg text-foreground/80 text-center mb-12">
          Now add your widget
        </AnimatedText>
        
        {/* Static illustration placeholder */}
        <View className="w-full h-80 bg-white/10 rounded-2xl border border-white/20 flex items-center justify-center mb-12">
          <Text className="text-foreground/60 text-center">
            [Widget Illustration]\niOS Home Screen\nwith LiveSnap Widget
          </Text>
        </View>
        
        {/* Numbered steps */}
        <View className="w-full space-y-6">
          <View className="flex items-start space-x-4">
            <View className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <AnimatedText delay={400} className="text-sm font-bold text-foreground">
                1
              </AnimatedText>
            </View>
            <View className="flex-1">
              <AnimatedText delay={500} className="text-foreground">
                Long press on your home screen
              </AnimatedText>
            </View>
          </View>
          
          <View className="flex items-start space-x-4">
            <View className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <AnimatedText delay={600} className="text-sm font-bold text-foreground">
                2
              </AnimatedText>
            </View>
            <View className="flex-1">
              <AnimatedText delay={700} className="text-foreground">
                Tap the + button in the top-left
              </AnimatedText>
            </View>
          </View>
          
          <View className="flex items-start space-x-4">
            <View className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <AnimatedText delay={800} className="text-sm font-bold text-foreground">
                3
              </AnimatedText>
            </View>
            <View className="flex-1">
              <AnimatedText delay={900} className="text-foreground">
                Find and select LiveSnap widget
              </AnimatedText>
            </View>
          </View>
          
          <View className="flex items-start space-x-4">
            <View className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <AnimatedText delay={1000} className="text-sm font-bold text-foreground">
                4
              </AnimatedText>
            </View>
            <View className="flex-1">
              <AnimatedText delay={1100} className="text-foreground">
                Tap Add Widget
              </AnimatedText>
            </View>
          </View>
        </View>
        
        <View className="mt-auto mb-12">
          <Button
            title="I've added it — let's go!"
            onPress={() => router.replace('/(tabs)/camera')}
            color="#F5F5F0"
            className="w-full"
          />
        </View>
      </AnimatedView>
    </View>
  );
}

const styles = StyleSheet.create({});
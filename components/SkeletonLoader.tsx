import { View, StyleSheet } from 'react-native';

export default function SkeletonLoader({ count = 1, height = 200 }) {
  return (
    <View className={`flex-col space-y-4 ${count > 1 ? 'space-y-4' : ''}`}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          className="h-[200px] w-full rounded-xl bg-white/20 animate-pulse"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({});
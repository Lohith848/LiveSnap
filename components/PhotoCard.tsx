import { useState, useMemo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { BlurHash } from 'react-native-blurhash';
import { moti } from 'moti';

// Reaction emojis
const REACTIONS = ['❤️', '😂', '😮', '😢', '🔥', '🎉'];

export default function PhotoCard({ photo, onPress, onReactionPress }) {
  // Format time ago
  const timeAgo = photo.created_at 
    ? timeAgoFormatter(new Date(photo.created_at))
    : '';

  // Get sender avatar and username (assuming they're in the photo object or need to be fetched)
  // For now, we'll use placeholder data
  const senderAvatar = photo.sender_avatar_url || 'https://via.placeholder.com/40';
  const senderUsername = photo.sender_username || `User ${photo.sender_id}`;
  
  // Get reaction counts
  const reactions = photo.reactions || {};
  
  // Memo-ize the reactions object to prevent unnecessary re-renders
  const memoizedReactions = useMemo(() => reactions, [JSON.stringify(reactions)]);

  return (
    <View className="w-full" onPress={onPress}>
      {/* Image container */}
      <View className="relative w-full h-[200px] overflow-hidden rounded-xl">
        {/* BlurHash placeholder */}
        {photo.blurhash ? (
          <BlurHash
            blurHash={photo.blurhash}
            style={{ 
              width: '100%', 
              height: '100%', 
            }}
          />
        ) : null}
        
        {/* Actual image */}
        <ImageBackground
          source={{ uri: photo.image_url }}
          style={{ 
            width: '100%', 
            height: '100%', 
          }}
          imageStyle={{ borderRadius: 12 }}
          contentContainerStyle={{ 
            borderRadius: 12 
          }}
        >
          {/* Bottom overlay gradient */}
          <View className="absolute bottom-0 left-0 right-0 h-20">
            {/* Linear gradient (simplified with background color) */}
            <View className="absolute inset-0 bg-black/50" />
            
            {/* Sender info */}
            <View className="absolute bottom-4 left-4 flex-row items-center space-x-2">
              <Image
                source={{ uri: senderAvatar }}
                style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: '#F5F5F0'
                }}
              />
              <View className="flex-col">
                <Text className="text-white font-medium text-sm">
                  {senderUsername}
                </Text>
                {timeAgo && (
                  <Text className="text-white/70 text-xs">
                    {timeAgo}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </ImageBackground>
        
        {/* Fallback image if image fails to load */}
        <Image
          source={{ uri: `https://via.placeholder.com/300?text=${photo.id || 'Photo'}` }}
          style={{ 
            width: '100%', 
            height: '100%', 
            borderRadius: 12,
          }}
          resizeMode="cover"
        />
      </View>
      
      {/* Reaction bar */}
      <View className="mt-3 flex-row space-x-2">
        {REACTIONS.map((emoji, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => onReactionPress(emoji)}
            activeOpacity={0.7}
          >
            <moti.View
              initial={{ scale: 1 }}
              whileTap={{ scale: 1.4 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            >
              <View className="flex-row items-center space-x-1">
                <Text className="text-2xl">{emoji}</Text>
                {memoizedReactions[emoji] && memoizedReactions[emoji] > 0 && (
                  <Text className="text-white/80 text-sm font-medium">
                    {memoizedReactions[emoji]}
                  </Text>
                )}
              </View>
            </moti.View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// Helper function to format time ago
function timeAgoFormatter(date) {
  const now = new Date();
  const secondsAgo = Math.floor((now - date) / 1000);
  
  if (secondsAgo < 60) {
    return `${secondsAgo}s`;
  }
  
  const minutesAgo = Math.floor(secondsAgo / 60);
  if (minutesAgo < 60) {
    return `${minutesAgo}m`;
  }
  
  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) {
    return `${hoursAgo}h`;
  }
  
  const daysAgo = Math.floor(hoursAgo / 24);
  if (daysAgo < 7) {
    return `${daysAgo}d`;
  }
  
  const weeksAgo = Math.floor(daysAgo / 7);
  if (weeksAgo < 4) {
    return `${weeksAgo}w`;
  }
  
  const monthsAgo = Math.floor(daysAgo / 30);
  if (monthsAgo < 12) {
    return `${monthsAgo}mo`;
  }
  
  const yearsAgo = Math.floor(daysAgo / 365);
  return `${yearsAgo}y`;
}

const styles = StyleSheet.create({});
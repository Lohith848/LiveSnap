// Constants for the LiveSnap app
export const COLORS = {
  background: '#09090B',
  foreground: '#FFFFFF',
  warmWhite: '#F5F5F0',
};

export const GROUP_STORAGE_KEY = '@livesnap:group';
export const USER_STORAGE_KEY = '@livesnap:user';

export const CAMERA_SETTINGS = {
  quality: 0.8,
  width: 800,
  height: 800,
  compress: 0.8,
  format: 'jpeg',
};

export const SUPABASE_TABLES = {
  GROUPS: 'groups',
  GROUP_MEMBERS: 'group_members',
  PHOTOS: 'photos',
};

export const NOTIFICATION_CHANNELS = {
  GROUP_UPDATES: 'group-updates',
  NEW_PHOTO: 'new-photo',
};
import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  session: null,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  clearAuth: () => set({ user: null, session: null }),
}))

export const useGroupStore = create((set) => ({
  currentGroup: null,
  members: [],
  setCurrentGroup: (group) => set({ currentGroup: group }),
  setMembers: (members) => set({ members }),
  clearGroup: () => set({ currentGroup: null, members: [] }),
}))

export const usePhotoStore = create((set) => ({
  photoList: [],
  loading: false,
  setPhotoList: (photos) => set({ photoList: photos }),
  setLoading: (loading) => set({ loading }),
  addPhoto: (photo) => set((state) => ({ photoList: [photo, ...state.photoList] })),
  updatePhotoById: (id, updates) => set((state) => ({
    photoList: state.photoList.map(photo =>
      photo.id === id ? { ...photo, ...updates } : photo
    ),
  })),
  removePhotoById: (id) => set((state) => ({
    photoList: state.photoList.filter(photo => photo.id !== id),
  })),
  clearPhotos: () => set({ photoList: [], loading: false }),
}))
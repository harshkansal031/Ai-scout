import AsyncStorage from '@react-native-async-storage/async-storage';
import { createLocalBackend } from './createLocalBackend.js';

const STORAGE_KEY = 'ai-scout-local-backend-v1';

const storage = {
  async getItem() {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  async setItem(value) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  },
};

export const localBackend = createLocalBackend(storage);

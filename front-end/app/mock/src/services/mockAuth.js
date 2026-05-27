import { createMockDataset } from '../mocks/sharedMockData.js';

const MOCK_AUTH_STORAGE_KEY = 'gestaofood.mockAuthUserEmail';
const MOCK_PASSWORD = 'admin';

function getMockUsers() {
  return createMockDataset().users;
}

export function getMockAuthEmail() {
  return window.localStorage.getItem(MOCK_AUTH_STORAGE_KEY) || '';
}

export function getMockAuthUser() {
  const email = getMockAuthEmail().toLowerCase();
  if (!email) return null;

  return getMockUsers().find((user) => user.email.toLowerCase() === email) || null;
}

export async function signInWithMockPassword({ email, password }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '');
  const user = getMockUsers().find((item) => item.email.toLowerCase() === normalizedEmail);

  if (!user || normalizedPassword !== MOCK_PASSWORD) {
    throw new Error('E-mail ou senha mock inválidos. No mock, todas as senhas são admin.');
  }

  window.localStorage.setItem(MOCK_AUTH_STORAGE_KEY, user.email);
  window.dispatchEvent(new Event('mock-auth-change'));

  return { user };
}

export async function signOutMock() {
  window.localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
  window.dispatchEvent(new Event('mock-auth-change'));
}

export function onMockAuthStateChange(callback) {
  const listener = () => callback();
  window.addEventListener('mock-auth-change', listener);
  window.addEventListener('storage', listener);

  return () => {
    window.removeEventListener('mock-auth-change', listener);
    window.removeEventListener('storage', listener);
  };
}

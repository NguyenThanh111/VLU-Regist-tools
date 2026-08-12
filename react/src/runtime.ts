import { getAnalytics } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getPerformance } from 'firebase/performance';

export const isProd = process.env.NODE_ENV === 'production';

const firebaseApiKey = process.env.REACT_APP_FIREBASE_API_KEY;
const firebaseConfig = {
  apiKey: firebaseApiKey,
  authDomain: 'tool-dkhp-uit.firebaseapp.com',
  projectId: 'tool-dkhp-uit',
  storageBucket: 'tool-dkhp-uit.appspot.com',
  messagingSenderId: '473962295838',
  appId: '1:473962295838:web:24fcf634d9eee42d2db40f',
};

const firebaseApp = firebaseApiKey ? initializeApp(firebaseConfig, { automaticDataCollectionEnabled: true }) : null;

export const analytics = firebaseApp ? getAnalytics(firebaseApp) : null;
export const db = firebaseApp ? getFirestore(firebaseApp) : null;

if (firebaseApp) getPerformance(firebaseApp);

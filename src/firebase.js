import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig =  {
  apiKey: "AIzaSyBBbezOlYsEQD-1EQ7oxC1BlFREj-4JXHE",
  authDomain: "lavasa-52e19.firebaseapp.com",
  projectId: "lavasa-52e19",
  storageBucket: "lavasa-52e19.firebasestorage.app",
  messagingSenderId: "487517193462",
  appId: "1:487517193462:web:7caddd9b4e0cec5a1658d7",
  measurementId: "G-PRY4H1CGDV"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

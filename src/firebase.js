import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDPOCPfX1-tB0BfSfku8Oer4tY9foqGE8s",
  authDomain: "hotel-frontend-d7ed9.firebaseapp.com",
  projectId: "hotel-frontend-d7ed9",
  storageBucket: "hotel-frontend-d7ed9.appspot.com",
  messagingSenderId: "367253457199",
  appId: "1:367253457199:web:df21590fc3673ab2c40c83",
  databaseURL: "https://hotel-frontend-d7ed9-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

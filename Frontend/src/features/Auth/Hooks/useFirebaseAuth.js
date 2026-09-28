import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "../../../Config/firebase.js";
import axios from "axios";
import { API_URL } from "../../../Config/api.js";

export const useFirebaseAuth = () => {
  const signInWithGoogle = async (intent) => {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();
    const { data } = await axios.post(
      `${API_URL}/api/auth/firebase`,
      { idToken, intent },
      { withCredentials: true }
    );
    return data;
  };

  const signOutFromFirebase = async () => {
    await signOut(auth);
  };

  return { signInWithGoogle, signOutFromFirebase };
};
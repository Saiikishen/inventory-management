// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc, doc, updateDoc } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const createProject = async (projectName) => {
    try {
        const docRef = await addDoc(collection(db, "projects"), {
            name: projectName,
            createdAt: new Date(),
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating project: ", error);
        return null;
    }
};

export const updateProjectName = async (projectId, newName) => {
    try {
        const projectRef = doc(db, "projects", projectId);
        await updateDoc(projectRef, {
            name: newName,
        });
        return true;
    } catch (error) {
        console.error("Error updating project name: ", error);
        return false;
    }
};

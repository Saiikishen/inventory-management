// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc, doc, updateDoc } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "inventory-management-chargemod",
  "appId": "1:1063128859463:web:cac3762c0951e0b8940262",
  "storageBucket": "inventory-management-chargemod.appspot.com",
  "apiKey": "",
  "authDomain": "inventory-management-chargemod.firebaseapp.com",
  "messagingSenderId": "1063128859463",
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

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, collection, addDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDCVsvDqn5_QqqGfVR9wggWprbtDYVrQXs",
  authDomain: "my-protfolio-c481f.firebaseapp.com",
  projectId: "my-protfolio-c481f",
  storageBucket: "my-protfolio-c481f.firebasestorage.app",
  messagingSenderId: "895873463739",
  appId: "1:895873463739:web:a590f5957c2c7143d2009e",
  measurementId: "G-Z2Y7LE7XW5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("-> Contact script loaded successfully!");

document.addEventListener("DOMContentLoaded", () => {
    const contactForm = document.querySelector(".contact-form");
    
    if (!contactForm) {
        console.error("-> ERROR: Could not find any element with class '.contact-form'!");
        return;
    }
    
    console.log("-> Contact form found! Attaching submit listener...");

    contactForm.addEventListener("submit", async (e) => {
        e.preventDefault(); 
        console.log("-> Submit button clicked, prevented default refresh.");

        const inputs = contactForm.querySelectorAll("input, textarea");
        let name = "";
        let email = "";
        let message = "";

        inputs.forEach(input => {
            const type = input.type;
            const placeholder = (input.placeholder || "").toLowerCase();
            
            if (type === "text" || placeholder.includes("name")) {
                name = input.value.trim();
            } else if (type === "email" || placeholder.includes("email")) {
                email = input.value.trim();
            } else if (input.tagName === "TEXTAREA" || placeholder.includes("message")) {
                message = input.value.trim();
            }
        });

        console.log("-> Form data collected:", { name, email, message });

        if (!name || !email || !message) {
            alert("Please fill in all fields before sending.");
            return;
        }

        try {
            console.log("-> Saving to Firestore...");
            await addDoc(collection(db, "messages"), {
                name: name,
                email: email,
                message: message,
                createdAt: serverTimestamp()
            });

            alert("Success! Your message has been sent to HUSSEIN KAMAL.");
            contactForm.reset();

        } catch (err) {
            console.error("-> Firestore Save Error:", err);
            alert("FIREBASE ERROR: " + err.message);
        }
    });
});
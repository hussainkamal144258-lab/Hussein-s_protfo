import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp 
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
const auth = getAuth(app);
const db = getFirestore(app);


document.addEventListener("DOMContentLoaded", () => {
    console.log("-> DOM fully loaded and parsed");

    
    if (window.location.pathname.includes("dash.html")) {
        protectDashboard();
    }

    initAuthForms();
    initNavigationTabs();
    loadMessages();
    loadUsers();
    initBlogCreator();
});


function protectDashboard() {
    console.log("-> Checking dashboard authentication state...");
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            console.log("-> No authenticated user found. Redirecting to login.html...");
            window.location.href = "login.html";
        } else {
            console.log("-> User authenticated:", user.email);
        }
    });
}


function initAuthForms() {

    const loginForm = document.querySelector(".login-form");
    const loginBtnDirect = document.querySelector(".btn-login");

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        console.log("-> Login event triggered!");

        const emailInput = document.querySelector('input[type="email"]') || document.getElementById("email");
        const passwordInput = document.querySelector('input[type="password"]') || document.getElementById("password");
        const loginBtn = document.querySelector(".btn-login") || document.querySelector('button[type="submit"]');

        const email = emailInput ? emailInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value.trim() : "";

        console.log("-> Email entered:", email ? "Yes" : "No");
        console.log("-> Password entered:", password ? "Yes" : "No");

        if (!email || !password) {
            showNotification("Please enter both email and password.", "error");
            return;
        }

        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.dataset.originalText = loginBtn.textContent;
            loginBtn.textContent = "Logging in...";
        }

        try {
            console.log("-> Calling Firebase signInWithEmailAndPassword...");
            await signInWithEmailAndPassword(auth, email, password);
            console.log("-> Firebase authentication SUCCESSFUL!");
            
            showNotification("Login successful! Welcome back.", "success");

            setTimeout(() => {
                console.log("-> Redirecting to dash.html...");
                window.location.href = "dash.html";
            }, 1000);

        } catch (err) {
            console.error("-> Firebase Login Error Code:", err.code);
            console.error("-> Firebase Login Error Message:", err.message);
            
           
            alert("Login Failed!\nCode: " + err.code + "\nMessage: " + err.message);

            let errorMsg = "Invalid email or password. Please try again.";
            if (err.code === "auth/invalid-email") {
                errorMsg = "Please enter a valid email address.";
            } else if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
                errorMsg = "Invalid email or password. Please try again.";
            } else if (err.code === "auth/operation-not-allowed") {
                errorMsg = "Email/Password sign-in is disabled in Firebase Console.";
            } else if (err.code === "auth/too-many-requests") {
                errorMsg = "Access temporarily blocked due to many failed attempts.";
            }

            showNotification(errorMsg, "error");

            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.textContent = loginBtn.dataset.originalText || "Login";
            }
        }
    };

    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
        console.log("-> Attached submit listener to .login-form");
    }

    if (loginBtnDirect && !loginForm) {
        loginBtnDirect.addEventListener("click", handleLogin);
        console.log("-> Attached click listener directly to .btn-login");
    }

  
    const signupForm = document.querySelector(".auth-form") || document.querySelector("#signupForm");
    if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const emailInput = signupForm.querySelector('input[type="email"]');
            const passwordInput = signupForm.querySelector('input[type="password"]');
            const submitBtn = signupForm.querySelector(".btn-submit") || signupForm.querySelector('button[type="submit"]');

            const email = emailInput ? emailInput.value.trim() : "";
            const password = passwordInput ? passwordInput.value.trim() : "";

            if (!email || !password) {
                showNotification("Please fill in all fields.", "error");
                return;
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = "Signing up...";
            }

            try {
                await createUserWithEmailAndPassword(auth, email, password);
                showNotification("Account created successfully!", "success");
                signupForm.reset();
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 1000);
            } catch (err) {
                console.error("Signup Error:", err);
                showNotification("Registration failed: " + err.message, "error");
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Sign Up";
                }
            }
        });
    }
}


function initNavigationTabs() {
    const navItems = document.querySelectorAll(".nav-item[data-tab]");
    const tabContents = document.querySelectorAll(".tab-content");

    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();

            navItems.forEach(nav => nav.classList.remove("active"));
            tabContents.forEach(content => content.classList.remove("active"));

            item.classList.add("active");
            const targetTabId = item.getAttribute("data-tab");
            const targetSection = document.getElementById(targetTabId);

            if (targetSection) {
                targetSection.classList.add("active");
            }
        });
    });
}


async function loadMessages() {
    const tableBody = document.getElementById("messagesTable");
    const msgCountElem = document.getElementById("msgCount");
    const badgeMsgElem = document.getElementById("badgeMsg");

    try {
        const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        const count = snapshot.size;
        if (msgCountElem) msgCountElem.textContent = count;
        if (badgeMsgElem) badgeMsgElem.textContent = count;

        if (!tableBody) return;
        tableBody.innerHTML = "";

        if (snapshot.empty) {
            tableBody.innerHTML = `<tr><td colspan="4" class="empty-msg">No messages received yet.</td></tr>`;
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            const date = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : "N/A";
            tableBody.innerHTML += `
                <tr>
                    <td>${escapeHTML(data.name || 'Anonymous')}</td>
                    <td>${escapeHTML(data.email || 'N/A')}</td>
                    <td>${escapeHTML(data.message || '')}</td>
                    <td>${date}</td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Error loading messages:", err);
        if (tableBody) tableBody.innerHTML = `<tr><td colspan="4" class="empty-msg">Error loading messages.</td></tr>`;
    }
}


async function loadUsers() {
    const tableBody = document.getElementById("usersTable");
    const userCountElem = document.getElementById("userCount");

    try {
        const snapshot = await getDocs(collection(db, "users"));
        if (userCountElem) userCountElem.textContent = snapshot.size;

        if (!tableBody) return;
        tableBody.innerHTML = "";

        if (snapshot.empty) {
            tableBody.innerHTML = `<tr><td colspan="3" class="empty-msg">No registered users found.</td></tr>`;
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            const date = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString() : 'N/A';
            tableBody.innerHTML += `
                <tr>
                    <td>${escapeHTML(data.email || 'N/A')}</td>
                    <td>${doc.id}</td>
                    <td>${date}</td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Error loading users:", err);
        if (tableBody) tableBody.innerHTML = `<tr><td colspan="3" class="empty-msg">Error loading registered users.</td></tr>`;
    }
}


function initBlogCreator() {
    const blogForm = document.getElementById("blogForm");
    const postCountElem = document.getElementById("postCount");

    getDocs(collection(db, "blogs")).then(snapshot => {
        if (postCountElem) postCountElem.textContent = snapshot.size;
    }).catch(() => {});

    if (!blogForm) return;

    blogForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const titleInput = document.getElementById("blogTitle");
        const contentInput = document.getElementById("blogContent");
        const submitBtn = blogForm.querySelector('button[type="submit"]');

        const title = titleInput ? titleInput.value.trim() : "";
        const content = contentInput ? contentInput.value.trim() : "";

        if (!title || !content) {
            alert("Please fill in both the blog title and content.");
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Publishing...";
        }

        try {
            await addDoc(collection(db, "blogs"), {
                title: title,
                content: content,
                createdAt: serverTimestamp()
            });

            blogForm.reset();
            window.location.href = "blog.html";
        } catch (err) {
            console.error("Error publishing blog post:", err);
            alert("Error publishing blog post: " + err.message);

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Publish Blog";
            }
        }
    });
}


function showNotification(message, type = "success") {
    let notif = document.getElementById("notification-banner");
    if (!notif) {
        notif = document.createElement("div");
        notif.id = "notification-banner";
        notif.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 6px;
            font-weight: bold;
            z-index: 10000;
            transition: opacity 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(notif);
    }

    notif.textContent = message;
    notif.style.backgroundColor = type === "success" ? "#D70812" : "#222";
    notif.style.color = "#fff";
    notif.style.border = type === "error" ? "1px solid #D70812" : "none";
    notif.style.opacity = "1";

    setTimeout(() => {
        notif.style.opacity = "0";
    }, 4000);
}


function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
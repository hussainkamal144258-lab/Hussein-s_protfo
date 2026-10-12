import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
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
const db = getFirestore(app);

 
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}

function init() {
    initNavigationTabs();
    loadMessages();
    loadUsers();
    initBlogCreator();
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


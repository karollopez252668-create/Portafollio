/* UTILIDADES PARA MOSTRAR MENSAJES*/

function showError(message) {
    const errorDiv = document.getElementById('login-error');
    
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.style.color = 'red';

        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 4000);
    } else {
        alert(message);
    }
}

function showSuccess(message) {
    const successDiv = document.getElementById('login-success');

    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        successDiv.style.color = 'green';

        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 3000);
    }
}


/*JWT FUNCTIONS */

function parseJWT(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
}

function isTokenExpired(token) {
    const decoded = parseJWT(token);
    if (!decoded || !decoded.exp) return false;

    const now = Date.now() / 1000;
    return decoded.exp < now;
}


/* MANEJO DE AUTENTICACIÓN (LOCALSTORAGE) */

function saveToken(token) {
    localStorage.setItem("authToken", token);
}

function getToken() {
    return localStorage.getItem("authToken");
}

function saveCurrentUser(user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
}

function getCurrentUser() {
    const data = localStorage.getItem("currentUser");
    return data ? JSON.parse(data) : null;
}

function isAuthenticated() {
    const token = getToken();
    if (!token) return false;
    if (isTokenExpired(token)) {
        localStorage.clear();
        return false;
    }
    return true;
}

function logout() {
    localStorage.clear();
    // Redirigir a index.html
    window.location.href = "index.html";
}


/* PETICIONES A LA API */

async function loginUser(credentials) {
    const response = await fetch(
        "https://portfolio-api-three-black.vercel.app/api/v1/auth/login",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials)
        }
    );

    const data = await response.json();

    if (!response.ok) throw new Error(data.message || "Error al iniciar sesión");

    return data; // token + user
}


/* PROTECCIÓN DE PAGINA HOME */
function protectHomePage() {
    // Solo ejecutar si estamos en el home
    const homeView = document.getElementById("home-view");
    
    if (homeView) {
        if (!isAuthenticated()) {
            console.log('Usuario no autenticado, redirigiendo a login...');
            window.location.replace("index.html");
            return false;
        }
        
        console.log('Usuario autenticado en home.html');
        
        // boton de logout
        const logoutBtn = document.getElementById("logout-btn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", logout);
        }
        
        return true;
    }
    
    return false;
}


/* MANEJO DEL LOGIN */
function setupLogin() {
    const loginBtn = document.getElementById("loginBtn");
    
    if (!loginBtn) return;
    
    console.log('Configurando login...');
    
    loginBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        // Limpiar mensajes previos
        const errorDiv = document.getElementById("login-error");
        const successDiv = document.getElementById("login-success");
        
        if (errorDiv) errorDiv.style.display = "none";
        if (successDiv) successDiv.style.display = "none";

        // Validaciones
        if (!email) {
            showError("Ingresa tu correo electronico");
            return;
        }

        if (!password) {
            showError("Ingresa tu contraseña");
            return;
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showError("Ingresa un correo electrónico válido");
            return;
        }

        // Deshabilitar boton mientras se procesa
        loginBtn.disabled = true;
        loginBtn.textContent = "Iniciando sesión...";

        try {
            console.log('Intentando login con:', email);
            
            // Peticion al backend
            const data = await loginUser({ email, password });

            console.log('Login exitoso:', data);

            // Guardar token y usuario
            saveToken(data.token);

            const decoded = parseJWT(data.token);
            if (decoded && decoded.user) {
                saveCurrentUser(decoded.user);
            }

            showSuccess("Inicio de sesion exitoso");

            // REDIRIGIR A HOME
            setTimeout(() => {
                window.location.href = "home.html";
            }, 800);

        } catch (error) {
            console.error('Error en login:', error);
            showError(error.message);
            
            // Rehabilitar boton
            loginBtn.disabled = false;
            loginBtn.textContent = "Iniciar Sesión";
        }
    });
    
    // Tambien permitir submit con Enter
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    
    if (emailInput && passwordInput) {
        [emailInput, passwordInput].forEach(input => {
            input.addEventListener("keypress", (e) => {
                if (e.key === "Enter") {
                    loginBtn.click();
                }
            });
        });
    }
}



 /*  VERIFICAR AUTENTICACIÓN EN INDEX.HTML*/

function checkAuthOnIndex() {
    const welcomeView = document.getElementById("welcome-view");
    const loginView = document.getElementById("login-view");
    
    if (welcomeView || loginView) {
        // Estamos en index.html
        if (isAuthenticated()) {
            console.log('Usuario ya autenticado, redirigiendo a home...');
            window.location.replace("home.html");
            return;
        }
    }
}


document.addEventListener("DOMContentLoaded", () => {
    console.log('App.js cargado');
    
    // p1 Verificar si ya esta autenticado
    checkAuthOnIndex();
    
    // p2 Proteger página home
    protectHomePage();
    
    // p3 Configurar login 
    setupLogin();
});
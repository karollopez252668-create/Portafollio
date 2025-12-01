
// URL api brianda
const API_BASE = "https://portfolio-api-three-black.vercel.app/api/v1";

const $ = (sel) => document.querySelector(sel);
let editingProjectId = null;

// HELPERS PARA TOKEN Y USUARIO
function getToken() {
    return localStorage.getItem("authToken");
}

function getUser() {
    let raw = localStorage.getItem("currentUser");
    
    //  buscar en otras posibles claves sino existe
    if (!raw || raw === 'undefined') {
        raw = localStorage.getItem("authUser");
    }
    
    if (!raw || raw === 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.includes('user') || key.includes('User')) {
                const value = localStorage.getItem(key);
                if (value && value !== 'undefined' && value !== 'null') {
                    raw = value;
                    break;
                }
            }
        }
    }
    
    if (!raw || raw === 'undefined' || raw === 'null') {
        console.error('No se encontro información del usuario en localStorage');
        console.log('Contenido actual de localStorage:');
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            console.log(`${key}:`, localStorage.getItem(key));
        }
        return null;
    }
    
    try {
        return JSON.parse(raw);
    } catch (error) {
        console.error('Error al parsear usuario:', error);
        console.log('Datos crudos del usuario:', raw);
        return null;
    }
}

function removeAuth() {
    const keysToRemove = [
        "authToken", 
        "authUser", 
        "currentUser",
        "user",
        "token"
    ];
    
    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
    });
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('user') || key.includes('token') || key.includes('User') || key.includes('Token'))) {
            localStorage.removeItem(key);
        }
    }
}


// NOTIFICACIONES
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// VALIDACION DE URL
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// API Helper base
async function apiFetch(path, options = {}) {
    const headers = options.headers || {};

    if (options.body && typeof options.body === 'string') {
        headers["Content-Type"] = "application/json";
    }

    const token = getToken();
    if (token) {
        headers["auth-token"] = token;
    }

    console.log('=== API REQUEST ===');
    console.log('URL:', API_BASE + path);
    console.log('Method:', options.method || 'GET');
    console.log('Headers:', headers);
    console.log('Body:', options.body);

    try {
        const res = await fetch(API_BASE + path, { ...options, headers });
        
        console.log('Response Status:', res.status);
        
        // Manejar aulguna respuesta sin contenido
        if (res.status === 204) {
            return { success: true };
        }

        //JSON parsear
        let data;
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await res.json();
        } else {
            data = {};
        }

        console.log('Response Data:', data);

        // sesion expirada
        if (res.status === 401) {
            showNotification('Sesion expirada. Por favor inicia sesion nuevamente.', 'error');
            setTimeout(() => {
                removeAuth();
                window.location.href = "index.html";
            }, 2000);
            throw new Error('Sesion expirada');
        }

        if (!res.ok) {
            throw new Error(data.message || data.error || data.msg || `Error ${res.status}`);
        }

        return data;
    } catch (err) {
        console.error('API Error:', err);
        throw err;
    }
}


// CARGAR PROYECTOS
async function loadProjects() {
    const grid = $("#projectsGrid");
    
    try {
        //skeleton loader
        grid.innerHTML = `
            <div class="skeleton-card">
                <div class="skeleton-line short"></div>
                <div class="skeleton-line long"></div>
                <div class="skeleton-line long"></div>
            </div>
            <div class="skeleton-card">
                <div class="skeleton-line short"></div>
                <div class="skeleton-line long"></div>
                <div class="skeleton-line long"></div>
            </div>
            <div class="skeleton-card">
                <div class="skeleton-line short"></div>
                <div class="skeleton-line long"></div>
                <div class="skeleton-line long"></div>
            </div> `;
        
        const projects = await apiFetch("/projects");
        console.log('Proyectos cargados:', projects);
        renderProjects(projects);
    } catch (err) {
        console.error('Error al cargar proyectos:', err);
        grid.innerHTML = `
            <div class="empty-state">
                <p>Error al cargar proyectos</p>
                <p>${err.message}</p>
            </div> `;
        
        if (err.message.includes('expirada') || err.message.includes('401')) {
            showNotification('Sesión expirada', 'error');
            setTimeout(() => {
                removeAuth();
                window.location.href = "index.html";
            }, 2000);
        } else {
            showNotification('Error al cargar proyectos: ' + err.message, 'error');
        }
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderProjects(projects) {
    const grid = $("#projectsGrid");
    grid.innerHTML = "";

    if (!projects || projects.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <p>No hay proyectos aun</p>
                <p>Haz clic en "Agregar Proyecto" para comenzar</p>
            </div>
        `;
        return;
    }

    projects.forEach((p) => {
        const card = document.createElement("div");
        card.className = "project-card";

        card.innerHTML = `
            ${p.images && p.images.length > 0 ? `
                <img src="${escapeHtml(p.images[0])}" 
                     alt="${escapeHtml(p.title)}"
                     class="project-image"
                     onerror="this.style.display='none'">
            ` : '<div class="project-image" style="background-color: #e9ecef;"></div>'}
            
            <div class="project-content">
                <div class="project-header">
                    <h3 class="project-title">${escapeHtml(p.title)}</h3>
                </div>
                
                <p class="project-description">${escapeHtml(p.description)}</p>
                
                ${p.technologies && p.technologies.length > 0 ? `
                    <div class="project-tech-section">
                        <span class="tech-label">Tecnologías</span>
                        <div class="project-technologies">
                            ${p.technologies.map(tech => `<span class="tech-tag">${escapeHtml(tech)}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="project-divider"></div>
                
                ${p.repository ? `
                    <a href="${escapeHtml(p.repository)}" target="_blank" rel="noopener noreferrer" class="project-link">
                        Ver Repositorio
                    </a>
                ` : ''}
                
                <div class="project-actions">
                    <button class="btn-edit" data-id="${p._id}">Editar</button>
                    <button class="btn-delete" data-id="${p._id}">Eliminar</button>
                </div>
            </div>
        `;

        grid.appendChild(card);
    });

    //Eventos para boton Editar
    document.querySelectorAll(".btn-edit").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const projectId = btn.getAttribute("data-id");
            console.log('Clic en editar, ID:', projectId);
            openEditModal(projectId);
        });
    });

    // Eventos para boton Eliminar
    document.querySelectorAll(".btn-delete").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const projectId = btn.getAttribute("data-id");
            console.log('Clic en eliminar, ID:', projectId);
            deleteProject(projectId);
        });
    });
}


// MODAL
function openCreateModal() {
    console.log('=== ABRIENDO MODAL CREAR ===');
    editingProjectId = null;

    $("#modalTitle").textContent = "Agregar Proyecto";
    $("#title").value = "";
    $("#description").value = "";
    $("#technologiesInput").value = "";
    $("#repository").value = "";
    $("#imagesInput").value = "";

    const submitBtn = $("#projectForm").querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.textContent = 'Guardar';
        submitBtn.disabled = false;
    }

    const modal = $("#projectModal");
    modal.style.display = "flex";
    document.body.style.overflow = 'hidden';
}

async function openEditModal(id) {
    console.log('=== ABRIENDO MODAL EDITAR ===');
    console.log('ID del proyecto:', id);
    
    editingProjectId = id;

    try {
        const project = await apiFetch(`/projects/${id}`);
        console.log('Proyecto a editar:', project);

        $("#modalTitle").textContent = "Editar Proyecto";
        $("#title").value = project.title || "";
        $("#description").value = project.description || "";
        $("#technologiesInput").value = project.technologies ? project.technologies.join(", ") : "";
        $("#repository").value = project.repository || "";
        $("#imagesInput").value = project.images ? project.images.join(", ") : "";

        const submitBtn = $("#projectForm").querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Actualizar';
            submitBtn.disabled = false;
        }

        const modal = $("#projectModal");
        modal.style.display = "flex";
        document.body.style.overflow = 'hidden';
    } catch (err) {
        console.error('Error al cargar proyecto:', err);
        showNotification('Error al cargar proyecto: ' + err.message, 'error');
    }
}

function closeProjectModal() {
    const modal = $("#projectModal");
    modal.style.display = "none";
    document.body.style.overflow = 'auto';
    
    // Resetear formulario
    $("#projectForm").reset();
    editingProjectId = null;
}

// GUARDAR PROYECTO
async function handleProjectFormSubmit(e) {
    e.preventDefault();

    console.log('=== GUARDANDO PROYECTO ===');
    console.log('editingProjectId:', editingProjectId);

    const title = $("#title").value.trim();
    const description = $("#description").value.trim();

    if (!title || !description) {
        showNotification('El titulo y la descripcion son obligatorios', 'error');
        return;
    }

    // Procesar tecnologias e imagenes
    const technologiesInput = $("#technologiesInput").value.trim();
    const repositoryInput = $("#repository").value.trim();
    const imagesInput = $("#imagesInput").value.trim();

    // Validar repository URL
    if (repositoryInput && !isValidUrl(repositoryInput)) {
        showNotification('Por favor ingresa una URL valida para el repositorio', 'error');
        return;
    }

    const technologies = technologiesInput 
        ? technologiesInput.split(",").map(t => t.trim()).filter(t => t)
        : [];
    
    const images = imagesInput 
        ? imagesInput.split(",").map(i => i.trim()).filter(i => i)
        : [];


    const project = {
        title: title,
        description: description,
        technologies: technologies,
        repository: repositoryInput,
        images: images
    };

    console.log('Datos del proyecto a enviar:', project);

    const submitBtn = $("#projectForm").querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;

    try {
        if (!editingProjectId) {
            // CREAR NUEVO PROYECTO
            console.log('Creando nuevo proyecto...');
            submitBtn.textContent = 'Guardando...';
            
            const result = await apiFetch("/projects", {
                method: "POST",
                body: JSON.stringify(project)
            });
            
            console.log('Proyecto creado:', result);
            showNotification('Proyecto creado exitosamente', 'success');
        } else {
            // ACTUALIZAR PROYECTO EXISTENTE
            console.log('Actualizando proyecto ID:', editingProjectId);
            submitBtn.textContent = 'Actualizando...';
            
            const result = await apiFetch(`/projects/${editingProjectId}`, {
                method: "PUT",
                body: JSON.stringify(project)
            });
            
            console.log('Proyecto actualizado:', result);
            showNotification('Proyecto actualizado exitosamente', 'success');
        }

        closeProjectModal();
        await loadProjects();
    } catch (err) {
        console.error('Error al guardar proyecto:', err);
        showNotification('Error: ' + err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}
// ELIMINAR PROYECTO

async function deleteProject(id) {
    if (!confirm("¿Estas seguro que deseas eliminar este proyecto?")) return;

    console.log('=== ELIMINANDO PROYECTO ===');
    console.log('ID:', id);

    try {
        await apiFetch(`/projects/${id}`, { method: "DELETE" });
        showNotification('Proyecto eliminado exitosamente', 'success');
        await loadProjects();
    } catch (err) {
        console.error('Error al eliminar proyecto:', err);
        showNotification('Error al eliminar: ' + err.message, 'error');
    }
}


// LOGOUT 
function handleLogout() {
    console.log('Cerrando sesión...');
    removeAuth();
    window.location.href = "index.html";
}

// INICIALIZAR TODO
function init() {
    console.log('=== INICIALIZANDO PROYECTOS ===');
    
    // Revisar si hay token
    const token = getToken();
    if (!token) {
        console.log('No hay token, redirigiendo a login...');
        window.location.href = "index.html";
        return;
    }

    console.log('Token encontrado');
    console.log('Usuario:', getUser());

    // Cargar proyectos
    loadProjects();

    // EVENTO: Boton Agregar Proyecto
    const addBtn = $("#addProjectBtn");
    if (addBtn) {
        addBtn.addEventListener("click", (e) => {
            e.preventDefault();
            console.log('Clic en Agregar Proyecto');
            openCreateModal();
        });
    } else {
        console.error('No se encontró el botón #addProjectBtn');
    }

    // EVENTO: Cerrar Modal (X)
    const closeBtn = $("#closeModal");
    if (closeBtn) {
        closeBtn.addEventListener("click", (e) => {
            e.preventDefault();
            closeProjectModal();
        });
    }

    // EVENTO: Botón Cancelar
    const cancelBtn = $("#cancelBtn");
    if (cancelBtn) {
        cancelBtn.addEventListener("click", (e) => {
            e.preventDefault();
            closeProjectModal();
        });
    }

    // EVENTO: Submit del formulario
    const projectForm = $("#projectForm");
    if (projectForm) {
        projectForm.addEventListener("submit", handleProjectFormSubmit);
    }

    // EVENTO: Logout
    const logoutBtn = $("#logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", handleLogout);
    }

    // EVENTO: Cerrar modal al hacer clic fuera
    const modal = $("#projectModal");
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                closeProjectModal();
            }
        });
    }
}

document.addEventListener("DOMContentLoaded", init);

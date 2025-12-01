
        const ITSON_ID = '252668';
        const API_BASE = 'https://portfolio-api-three-black.vercel.app/api/v1';

        window.addEventListener('load', () => {
            document.querySelectorAll('.skill-progress').forEach(bar => {
                const progress = bar.getAttribute('data-progress');
                setTimeout(() => {
                    bar.style.width = progress + '%';
                }, 500);
            });
        });

        // Cargar proyectos
        async function loadProjects() {
            const grid = document.getElementById('projectsGrid');

            try {
                const response = await fetch(`${API_BASE}/publicProjects/${ITSON_ID}`);

                if (!response.ok) {
                    throw new Error('Error al cargar proyectos');
                }

                const projects = await response.json();

                // Actualizar contador
                document.getElementById('projectCount').textContent = projects.length;

                if (projects.length === 0) {
                    grid.innerHTML = '<div class="loading">No hay proyectos públicos aún</div>';
                    return;
                }

                grid.innerHTML = projects.map(project => `
                    <div class="project-card">
                        <img src="${project.images?.[0] || 'https://via.placeholder.com/400x200/667eea/fff?text=Proyecto'}" 
                             alt="${project.title}" 
                             class="project-image"
                             onerror="this.src='https://via.placeholder.com/400x200/667eea/fff?text=Proyecto'">
                        <div class="project-content">
                            <h3 class="project-title">${project.title}</h3>
                            <p>${project.description}</p>
                            ${project.technologies ? `
                                <div>
                                    ${project.technologies.map(tech =>
                    `<span class="tech-badge">${tech}</span>`
                ).join('')}
                                </div>
                            ` : ''}
                            <div class="project-links">
                                ${project.repository ? `
                                    <a href="${project.repository}" target="_blank" class="project-link">
                                        <i class="fab fa-github"></i> Código
                                    </a>
                                ` : ''}
                                ${project.liveUrl ? `
                                    <a href="${project.liveUrl}" target="_blank" class="project-link">
                                        <i class="fas fa-external-link-alt"></i> Demo
                                    </a>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `).join('');

            } catch (error) {
                grid.innerHTML = `<div class="loading">Error: ${error.message}</div>`;
            }
        }





        
        // Inicializar
        loadProjects();
  
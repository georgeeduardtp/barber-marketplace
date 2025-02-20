// Funciones del panel de administración
function showAdminPanel() {
    // Remover panel existente si hay uno
    const existingPanel = document.getElementById('adminPanel');
    if (existingPanel) existingPanel.remove();

    const adminPanel = `
        <div id="adminPanel" class="admin-panel">
            <h2>Panel de Administración</h2>
            <div class="admin-actions">
                <button onclick="showCreateSalonAccountModal()">Crear Cuenta de Peluquería</button>
                <div class="search-admin-container" style="margin: 1rem 0; position: relative;">
                    <div class="search-admin-bar" style="display: flex; gap: 0.5rem;">
                        <input type="text" 
                               id="searchSalonAdmin" 
                               placeholder="Buscar peluquerías..." 
                               style="flex: 1; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                        <button onclick="filterSalons()" 
                                style="background-color: var(--primary-color); color: white; border: none; border-radius: 4px; padding: 0.5rem 1rem;">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                    <div id="searchSuggestions" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: white; border-radius: 4px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 1000; margin-top: 0.5rem;"></div>
                </div>
                <div id="salonAccountsList" class="salon-accounts-list">
                    <h3>Peluquerías Registradas</h3>
                    <!-- Lista de peluquerías se cargará aquí -->
                </div>
            </div>
        </div>
    `;
    
    document.querySelector('main').insertAdjacentHTML('afterbegin', adminPanel);
    loadSalonAccounts();

    // Añadir evento para búsqueda en vivo
    document.getElementById('searchSalonAdmin').addEventListener('input', debounce(showSuggestions, 300));

    // Añadir evento para buscar al presionar Enter
    document.getElementById('searchSalonAdmin').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            filterSalons();
            hideSuggestions();
        }
    });

    // Cerrar sugerencias al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-admin-container')) {
            hideSuggestions();
        }
    });
} 
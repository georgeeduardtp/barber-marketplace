// Funciones de búsqueda

// Función para buscar peluquerías
async function searchSalons(query) {
    try {
        query = query.toLowerCase().trim();
        
        // Si la consulta está vacía, devolver peluquerías destacadas
        if (!query) {
            return getFeaturedSalons();
        }

        const snapshot = await db.collection('peluquerias').get();
        const results = [];

        snapshot.forEach(doc => {
            const salon = doc.data();
            
            // Buscar en nombre, ciudad, servicios y descripción
            const matchesName = salon.nombre.toLowerCase().includes(query);
            const matchesCity = salon.ciudad.toLowerCase().includes(query);
            const matchesDescription = salon.descripcion?.toLowerCase().includes(query);
            const matchesServices = salon.servicios?.some(
                service => service.nombre.toLowerCase().includes(query)
            );

            if (matchesName || matchesCity || matchesDescription || matchesServices) {
                results.push({
                    id: doc.id,
                    ...salon
                });
            }
        });

        // Ordenar por relevancia y valoración
        return results.sort((a, b) => {
            // Priorizar coincidencias en el nombre
            const aMatchesName = a.nombre.toLowerCase().includes(query);
            const bMatchesName = b.nombre.toLowerCase().includes(query);
            
            if (aMatchesName && !bMatchesName) return -1;
            if (!aMatchesName && bMatchesName) return 1;
            
            // Si ambos coinciden o no coinciden en el nombre, ordenar por valoración
            return (b.valoracion || 0) - (a.valoracion || 0);
        });
    } catch (error) {
        console.error('Error en la búsqueda:', error);
        throw error;
    }
}

// Función para obtener peluquerías destacadas
async function getFeaturedSalons() {
    try {
        const snapshot = await db.collection('peluquerias')
            .where('destacado', '==', true)
            .limit(6)
            .get();
            
        const salons = [];
        snapshot.forEach(doc => {
            salons.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return salons;
    } catch (error) {
        console.error('Error al obtener peluquerías destacadas:', error);
        throw error;
    }
}

// Función para mostrar sugerencias de búsqueda
function showSearchSuggestions(results) {
    const suggestionsContainer = document.getElementById('searchResults');
    
    if (!results.length) {
        suggestionsContainer.innerHTML = `
            <div class="no-results">
                <p>No se encontraron resultados</p>
            </div>
        `;
        suggestionsContainer.style.display = 'block';
        return;
    }

    const html = results.map(salon => `
        <div class="search-result" onclick="window.location.href='salon.html?id=${salon.id}'">
            <div class="result-image">
                <img src="${salon.fotos?.[0] || 'img/default-salon.jpg'}" alt="${salon.nombre}">
            </div>
            <div class="result-info">
                <h3>${salon.nombre}</h3>
                <p><i class="fas fa-map-marker-alt"></i> ${salon.ciudad}</p>
                <div class="result-rating">
                    ${generateStars(salon.valoracion || 0)}
                    <span>(${salon.numValoraciones || 0})</span>
                </div>
            </div>
        </div>
    `).join('');

    suggestionsContainer.innerHTML = html;
    suggestionsContainer.style.display = 'block';
}

// Función para ocultar sugerencias
function hideSearchSuggestions() {
    const suggestionsContainer = document.getElementById('searchResults');
    suggestionsContainer.style.display = 'none';
}

// Función para manejar la búsqueda
async function handleSearch(event) {
    const query = event.target.value;
    
    if (!query.trim()) {
        hideSearchSuggestions();
        return;
    }

    try {
        const results = await searchSalons(query);
        showSearchSuggestions(results);
    } catch (error) {
        console.error('Error en la búsqueda:', error);
        showSearchSuggestions([]);
    }
}

// Función debounce para evitar muchas llamadas seguidas
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Exportar funciones al objeto window
window.searchSalons = searchSalons;
window.getFeaturedSalons = getFeaturedSalons;
window.showSearchSuggestions = showSearchSuggestions;
window.hideSearchSuggestions = hideSearchSuggestions;
window.handleSearch = handleSearch;
window.debounce = debounce; 
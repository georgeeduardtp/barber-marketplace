// Funciones de gestión de reseñas
async function loadReviews(salonId) {
    if (!reviewsList) return;
    
    try {
        const snapshot = await db.collection('reviews')
            .where('salonId', '==', salonId)
            .orderBy('fecha', 'desc')
            .limit(10)
            .get();
        
        if (snapshot.empty) {
            reviewsList.innerHTML = '<p>No hay reseñas todavía</p>';
            return;
        }
        
        let html = '';
        for (const doc of snapshot.docs) {
            const review = doc.data();
            const userDoc = await db.collection('users').doc(review.userId).get();
            const userData = userDoc.data();
            
            html += `
                <div class="review-item">
                    <div class="review-header">
                        <span class="reviewer-name">${userData.name || 'Usuario'}</span>
                        <span class="review-date">${new Date(review.fecha.toDate()).toLocaleDateString()}</span>
                    </div>
                    <div class="review-rating">
                        ${generateStars(review.valoracion)}
                    </div>
                    <p class="review-comment">${review.comentario}</p>
                </div>
            `;
        }
        
        reviewsList.innerHTML = html;
    } catch (error) {
        console.error('Error al cargar reseñas:', error);
        reviewsList.innerHTML = '<p>Error al cargar las reseñas</p>';
    }
}

async function addReview(reviewData) {
    try {
        // Verificar si el usuario está logueado
        const user = auth.currentUser;
        if (!user) {
            alert('Debes iniciar sesión para dejar una reseña');
            return;
        }
        
        // Crear la reseña
        await db.collection('reviews').add({
            salonId: salonId,
            userId: user.uid,
            valoracion: reviewData.rating,
            comentario: reviewData.comment,
            fecha: new Date()
        });
        
        // Actualizar la valoración promedio del salón
        const salonDoc = await db.collection('peluquerias').doc(salonId).get();
        const salon = salonDoc.data();
        const numValoraciones = (salon.numValoraciones || 0) + 1;
        const valoracionTotal = (salon.valoracion || 0) * (numValoraciones - 1) + reviewData.rating;
        const valoracionPromedio = valoracionTotal / numValoraciones;
        
        await db.collection('peluquerias').doc(salonId).update({
            valoracion: valoracionPromedio,
            numValoraciones: numValoraciones
        });
        
        // Recargar reseñas
        loadReviews(salonId);
        alert('Reseña añadida exitosamente');
    } catch (error) {
        console.error('Error al añadir reseña:', error);
        alert('Error al añadir la reseña');
    }
}

async function deleteReview(reviewId) {
    try {
        await db.collection('reviews').doc(reviewId).delete();
        loadReviews(salonId);
        alert('Reseña eliminada exitosamente');
    } catch (error) {
        console.error('Error al eliminar reseña:', error);
        alert('Error al eliminar la reseña');
    }
} 
// Función para crear usuario administrador
async function createAdminUser() {
    try {
        // Primero intentamos hacer login con el usuario admin
        const email = 'admin@marketplace.com';
        const password = 'admin123';

        try {
            await auth.signInWithEmailAndPassword(email, password);
            console.log('Admin logueado correctamente');
            return true;
        } catch (loginError) {
            // Si el login falla, creamos el usuario
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            
            // Crear el documento del usuario en Firestore
            await db.collection('users').doc(userCredential.user.uid).set({
                email: email,
                role: 'admin',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('Usuario admin creado correctamente');
            return true;
        }
    } catch (error) {
        console.error('Error al crear/loguear admin:', error);
        return false;
    }
}

// Función para agregar peluquerías de prueba
async function setupPeluquerias() {
    try {
        // Datos de ejemplo
        const peluquerias = [
            {
                nombre: "Peluquería Style & Cut",
                direccion: "Calle Mayor 123, Madrid",
                valoracion: 4.5,
                numValoraciones: 28,
                destacada: true,
                fotos: [
                    "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?ixlib=rb-4.0.3",
                    "https://images.unsplash.com/photo-1562322140-8baeececf3df?ixlib=rb-4.0.3"
                ],
                servicios: [
                    {
                        id: "1",
                        nombre: "Corte de Cabello",
                        precio: 15,
                        duracion: 30
                    },
                    {
                        id: "2",
                        nombre: "Tinte",
                        precio: 40,
                        duracion: 120
                    },
                    {
                        id: "3",
                        nombre: "Peinado",
                        precio: 25,
                        duracion: 45
                    }
                ],
                horarios: {
                    lunes: { inicio: "09:00", fin: "20:00" },
                    martes: { inicio: "09:00", fin: "20:00" },
                    miercoles: { inicio: "09:00", fin: "20:00" },
                    jueves: { inicio: "09:00", fin: "20:00" },
                    viernes: { inicio: "09:00", fin: "20:00" },
                    sabado: { inicio: "09:00", fin: "14:00" },
                    domingo: { inicio: "", fin: "" }
                }
            },
            {
                nombre: "Barbería Modern",
                direccion: "Avenida Principal 45, Barcelona",
                valoracion: 4.8,
                numValoraciones: 42,
                destacada: true,
                fotos: [
                    "https://images.unsplash.com/photo-1503951914436-79e4cd2f0f67?ixlib=rb-4.0.3",
                    "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?ixlib=rb-4.0.3"
                ],
                servicios: [
                    {
                        id: "1",
                        nombre: "Corte de Cabello + Barba",
                        precio: 25,
                        duracion: 45
                    },
                    {
                        id: "2",
                        nombre: "Afeitado Tradicional",
                        precio: 20,
                        duracion: 30
                    },
                    {
                        id: "3",
                        nombre: "Arreglo de Barba",
                        precio: 15,
                        duracion: 20
                    }
                ],
                horarios: {
                    lunes: { inicio: "10:00", fin: "21:00" },
                    martes: { inicio: "10:00", fin: "21:00" },
                    miercoles: { inicio: "10:00", fin: "21:00" },
                    jueves: { inicio: "10:00", fin: "21:00" },
                    viernes: { inicio: "10:00", fin: "21:00" },
                    sabado: { inicio: "10:00", fin: "18:00" },
                    domingo: { inicio: "", fin: "" }
                }
            }
        ];

        // Agregar cada peluquería a Firestore
        for (const peluqueria of peluquerias) {
            await db.collection('peluquerias').add(peluqueria);
            console.log(`Peluquería ${peluqueria.nombre} agregada correctamente`);
        }

        console.log('Todas las peluquerías han sido agregadas');
    } catch (error) {
        console.error('Error al agregar peluquerías:', error);
    }
}

// Función para agregar reseñas de prueba
async function setupResenas() {
    try {
        // Primero obtener las peluquerías
        const peluqueriasSnapshot = await db.collection('peluquerias').get();
        
        for (const doc of peluqueriasSnapshot.docs) {
            const peluqueriaId = doc.id;
            
            // Reseñas de ejemplo para cada peluquería
            const resenas = [
                {
                    peluqueriaId: peluqueriaId,
                    usuarioId: "usuario1",
                    nombreUsuario: "María García",
                    valoracion: 5,
                    comentario: "Excelente servicio, muy profesionales y amables.",
                    fecha: firebase.firestore.Timestamp.fromDate(new Date())
                },
                {
                    peluqueriaId: peluqueriaId,
                    usuarioId: "usuario2",
                    nombreUsuario: "Juan Pérez",
                    valoracion: 4,
                    comentario: "Buen servicio, precios razonables.",
                    fecha: firebase.firestore.Timestamp.fromDate(new Date(Date.now() - 86400000))
                }
            ];

            // Agregar reseñas
            for (const resena of resenas) {
                await db.collection('resenas').add(resena);
                console.log(`Reseña agregada para ${doc.data().nombre}`);
            }
        }

        console.log('Todas las reseñas han sido agregadas');
    } catch (error) {
        console.error('Error al agregar reseñas:', error);
    }
} 
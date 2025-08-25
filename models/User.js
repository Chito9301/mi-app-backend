const mongoose = require('mongoose');

// Definición del esquema de usuario para MongoDB usando Mongoose
const UserSchema = new mongoose.Schema({
  // Nombre de usuario único y obligatorio
  username: { 
    type: String, 
    required: true, 
    unique: true
  },
  // Email único y obligatorio para contacto y autenticación
  email: { 
    type: String, 
    required: true, 
    unique: true
  },
  // Contraseña cifrada (obligatoria)
  password: { 
    type: String, 
    required: true 
  },
  // URL de la foto de perfil, por defecto vacío si no se proporciona
  photoURL: { 
    type: String, 
    default: '' 
  },
  // Rol del usuario, por defecto 'user', puede ser usado para permisos
  role: { 
    type: String, 
    default: 'user' 
  },
  // Fecha de creación automática con fecha actual al crear el usuario
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  // Fecha de última actualización, será actualizada automáticamente al modificar
  updatedAt: { 
    type: Date 
  },
});

// Middleware que se ejecuta antes de guardar (create o update)
// Actualiza la propiedad updatedAt con la fecha actual
UserSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Middleware para actualizar updatedAt cuando se usa findOneAndUpdate u otros métodos que modifican documentos
UserSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Exportamos el modelo para ser usado en el backend
module.exports = mongoose.model('User', UserSchema);

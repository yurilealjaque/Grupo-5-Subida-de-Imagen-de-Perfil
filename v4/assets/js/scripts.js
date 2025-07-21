// Importamos la función getRandomUser desde api.js (RandomUser API)
import { getRandomUser } from './api.js';

// ======================
// VARIABLES GLOBALES
// ======================
const USERS_API_URL = 'http://localhost:3000/users'; // URL base para json-server
export let users = []; // Lista en memoria
let editingIndex = null;
let deleteIndex = null;

// ======================
// EVENTOS PRINCIPALES
// ======================
document.addEventListener('DOMContentLoaded', () => {
    // Cargar usuarios desde json-server al iniciar
    loadUsersFromJSON();

    // Configurar eventos
    document.getElementById('autoFillBtn').addEventListener('click', autoFillForm);
    document.getElementById('clearBtn').addEventListener('click', clearForm);
    document.getElementById('userForm').addEventListener('submit', handleSubmit);
    document.getElementById('saveEditBtn').addEventListener('click', saveEdit);
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
});

// ======================
// FUNCIONES CRUD CON JSON-SERVER
// ======================
async function loadUsersFromJSON() {
    try {
        const response = await fetch(USERS_API_URL);
        if (!response.ok) throw new Error('Error al cargar usuarios');
        users = await response.json();
        renderUsers();
    } catch (error) {
        console.error('Error al leer JSON:', error);
        showToast('No se pudo cargar el archivo JSON', 'danger');
    }
}

async function createUserOnServer(user) {
    try {
        const response = await fetch(USERS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
        return await response.json();
    } catch (error) {
        console.error('Error en POST:', error);
    }
}

async function updateUserOnServer(id, user) {
    try {
        const response = await fetch(`${USERS_API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
        return await response.json();
    } catch (error) {
        console.error('Error en PUT:', error);
    }
}

async function deleteUserOnServer(id) {
    try {
        const response = await fetch(`${USERS_API_URL}/${id}`, { method: 'DELETE' });
        return response.ok;
    } catch (error) {
        console.error('Error en DELETE:', error);
    }
}

// ======================
// FUNCIONES DEL FORMULARIO
// ======================
function getFormData() {
    return {
        fullName: document.getElementById('fullName').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        profileImage: document.getElementById('profileImage').src
    };
}

function fillForm(user) {
    document.getElementById('fullName').value = user.fullName;
    document.getElementById('email').value = user.email;
    document.getElementById('phone').value = user.phone;
    document.getElementById('profileImage').src = user.profileImage;
}

async function autoFillForm() {
    try {
        const user = await getRandomUser(); // Datos desde RandomUser
        fillForm(user);
        showToast('Formulario auto-rellenado con datos de RandomUser', 'success');
    } catch {
        showToast('Error al obtener datos de la API', 'danger');
    }
}

async function handleSubmit(e) {
    e.preventDefault();
    const userData = getFormData();

    if (!validateUser(userData)) return;

    const createdUser = await createUserOnServer(userData);
    if (createdUser) {
        users.push(createdUser);
        clearForm();
        renderUsers();
        showToast('Usuario agregado correctamente', 'success');
    }
}

function clearForm() {
    document.getElementById('userForm').reset();
    document.getElementById('profileImage').src = 'https://via.placeholder.com/100x100/6c757d/ffffff?text=Foto';
}

let previewImageResult = null;
 
document.getElementById("confirmNewImageBtn").addEventListener("click", () => {
  document.getElementById("profileImage").src = previewImageResult;
  document.getElementById("editProfileImage").src = previewImageResult;
 
  bootstrap.Modal.getInstance(
    document.getElementById("previewImageModal")
  ).hide();
 
  showToast("Imagen de perfil actualizada", "success");
});
 

document
  .getElementById("newProfileImg")
  .addEventListener("change", function (event) {
    const file = event.target.files[0]; // toma el primer archivo
 
    if (file) {
      const reader = new FileReader();
 
      reader.readAsDataURL(file);
 
      reader.onload = () => {
        const img = document.getElementById("loadedImageModal");
        img.style.height = "50vh";
        img.style.objectFit = "contain";
        img.src = reader.result;
        previewImageResult= reader.result;
        
        const previewImageModal = document.getElementById("previewImageModal");
 
        new bootstrap.Modal(previewImageModal).show();
      };
 
      reader.onerror = function () {
        console.error("Error leyendo el archivo", reader.error);
      };
    }
  });
 

// ======================
// RENDERIZADO DE USUARIOS
// ======================
export function renderUsers(filteredList = null) {
    const list = filteredList || users;
    const container = document.getElementById('usersList');
    document.getElementById('userCount').textContent = `${list.length} usuarios`;

    container.innerHTML = list.length
        ? list.map((u, i) => userCard(u, i)).join('')
        : `<div class="col-12 text-center text-muted py-5">No hay usuarios</div>`;
}

function userCard(user) {
    return `
        <div class="col-md-6 mb-3">
            <div class="card shadow-sm">
                <div class="card-body text-center">
                    <img src="${user.profileImage}" class="rounded-circle mb-2" width="80">
                    <h5>${user.fullName}</h5>
                    <p>${user.email}</p>
                    <p>${user.phone}</p>
                   <button class="btn btn-sm btn-outline-primary" onclick="editUser('${user.id}')">Editar</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="askDelete('${user.id}')">Eliminar</button>
                </div>
            </div>
        </div>`;
}

// ======================
// MODAL DE EDICIÓN
// ======================
window.editUser = (id) => {
    editingIndex = id;
    const user = users.find(u => u.id === id);
    document.getElementById('editUserIndex').value = id;
    document.getElementById('editProfileImage').src = user.profileImage;
    document.getElementById('editFullName').value = user.fullName;
    document.getElementById('editEmail').value = user.email;
    document.getElementById('editPhone').value = user.phone;
    new bootstrap.Modal(document.getElementById('editModal')).show();
};

async function saveEdit() {
    const id = editingIndex;
    if (id === null) return;

    const email = document.getElementById('editEmail').value.trim();
    const phone = document.getElementById('editPhone').value.trim();
    const image = document.getElementById("editProfileImage").src;

    if (!validateEmail(email) || !validatePhone(phone)) {
        showToast('Datos inválidos al editar', 'danger');
        return;
    }

    const userIndex = users.findIndex(u => u.id === id);
    users[userIndex].email = email;
    users[userIndex].phone = phone;
    users[userIndex].profileImage = image;

    await updateUserOnServer(id, users[userIndex]);
    editingIndex = null;
    bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
    renderUsers();
    showToast('Usuario actualizado correctamente', 'success');
}

// ======================
// MODAL DE ELIMINACIÓN
// ======================
window.askDelete = (id) => {
    deleteIndex = id;
    const user = users.find(u => u.id === id);
    document.getElementById('deleteUserName').textContent = user.fullName;
    new bootstrap.Modal(document.getElementById('deleteModal')).show();
};

async function confirmDelete() {
    if (deleteIndex === null) return;

    await deleteUserOnServer(deleteIndex);
    users = users.filter(u => u.id !== deleteIndex);
    deleteIndex = null;
    bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
    renderUsers();
    showToast('Usuario eliminado', 'warning');
}

// ======================
// VALIDACIONES
// ======================
function validateUser(user) {
    if (!user.fullName || user.fullName.length < 2) {
        showToast('Nombre inválido', 'danger');
        return false;
    }
    if (!validateEmail(user.email)) {
        showToast('Email inválido', 'danger');
        return false;
    }
    if (!validatePhone(user.phone)) {
        showToast('Teléfono inválido', 'danger');
        return false;
    }
    return true;
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
    return /^[0-9+\-()\s]{7,15}$/.test(phone);
}

// ======================
// NOTIFICACIONES (TOAST)
// ======================
function showToast(message, type = 'primary') {
    const toast = document.getElementById('mainToast');
    toast.className = `toast align-items-center text-bg-${type} border-0`;
    document.getElementById('toastMessage').textContent = message;
    new bootstrap.Toast(toast).show();
}

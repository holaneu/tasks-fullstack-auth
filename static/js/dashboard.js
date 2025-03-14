/**
 * Dashboard Functions
 */

let currentFilter = 'all';

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;  // ✅ Ensures authentication before loading dashboard

    setupEventListeners();
    await loadUserData();
    await loadTasks();
});

// Set up event listeners
function setupEventListeners() {
    document.getElementById('logout-button')?.addEventListener('click', handleLogout);
    document.getElementById('add-task-form')?.addEventListener('submit', handleAddTask);

    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', async (event) => {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            currentFilter = event.target.dataset.filter;
            await filterTasks(currentFilter);
        });
    });

    document.getElementById('tasks-list')?.addEventListener('click', handleTaskAction);
}

// Load user data
async function loadUserData() {
    const response = await apiRequest(API.profile);

    if (response.ok) {
        const user = response.data;
        document.getElementById('user-name').textContent = user.name;
        document.getElementById('profile-info').innerHTML = `<p><strong>Name:</strong> ${user.name}</p>`;
    } else {
        showNotification("Failed to load user profile", "error");
    }
}

// Load tasks
async function loadTasks() {
    const tasksList = document.getElementById('tasks-list');
    tasksList.innerHTML = '<p class="loading-message">Loading tasks...</p>';

    const response = await apiRequest(API.tasks);

    if (response.ok) {
        renderTasks(response.data);
    } else {
        tasksList.innerHTML = '<p class="error-message">Failed to load tasks.</p>';
    }
}

// Handle adding a new task
async function handleAddTask(event) {
    event.preventDefault();

    const taskInput = document.getElementById('new-task-title');
    const taskTitle = taskInput.value.trim();
    if (!taskTitle) return;

    const response = await apiRequest(API.tasks, 'POST', { title: taskTitle });

    if (response.ok) {
        taskInput.value = '';
        await loadTasks();
        showNotification("Task added successfully!", "success");
    } else {
        showNotification("Failed to add task", "error");
    }
}

// Filter tasks
async function filterTasks(filter) {
    const response = await apiRequest(API.tasks);

    if (!response.ok) {
        showNotification("Failed to filter tasks", "error");
        return;
    }

    let filteredTasks = response.data;

    if (filter === 'completed') {
        filteredTasks = response.data.filter(task => task.completed);
    } else if (filter === 'active') {
        filteredTasks = response.data.filter(task => !task.completed);
    }

    renderTasks(filteredTasks);
}

// Handle task actions (edit, delete, toggle completion)
async function handleTaskAction(event) {
    const taskElement = event.target.closest('.task-item');
    if (!taskElement) return;

    const taskId = taskElement.dataset.id;

    if (event.target.classList.contains('delete-btn')) {
        await deleteTask(taskId);
    } else if (event.target.classList.contains('edit-btn')) {
        await editTask(taskId);
    } else if (event.target.classList.contains('toggle-btn')) {
        await toggleTaskCompletion(taskId);
    }

    await loadTasks();
}

// Render tasks
function renderTasks(tasks) {
    const taskList = document.getElementById('tasks-list');
    taskList.innerHTML = tasks.length ? '' : '<p>No tasks available.</p>';

    tasks.forEach(task => {
        const taskItem = document.createElement('div');
        taskItem.classList.add('task-item');
        taskItem.dataset.id = task.id;
        taskItem.innerHTML = `
            <span class="${task.completed ? 'completed' : ''}">${task.title}</span>
            <button class="toggle-btn">${task.completed ? 'Undo' : 'Complete'}</button>
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
        `;

        taskList.appendChild(taskItem);
    });
}

// Delete task
async function deleteTask(taskId) {
    const response = await apiRequest(`${API.tasks}/${taskId}`, 'DELETE');

    if (response.ok) {
        showNotification("Task deleted", "success");
    } else {
        showNotification("Failed to delete task", "error");
    }
}

// Edit task
async function editTask(taskId) {
    const newText = prompt("Edit task:");
    if (!newText) return;

    const response = await apiRequest(`${API.tasks}/${taskId}/edit`, 'PATCH', { title: newText });

    if (response.ok) {
        showNotification("Task updated successfully", "success");
    } else {
        showNotification("Failed to update task", "error");
    }
}

// Toggle task completion
async function toggleTaskCompletion(taskId) {
    const taskElement = document.querySelector(`.task-item[data-id="${taskId}"]`);
    if (!taskElement) return;

    const isCompleted = taskElement.querySelector('.toggle-btn').textContent === 'Undo';

    const response = await apiRequest(`${API.tasks}/${taskId}`, 'PUT', { completed: !isCompleted });

    if (response.ok) {
        showNotification("Task updated successfully", "success");
    } else {
        showNotification("Failed to update task", "error");
    }
}

// Handle logout
function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    window.location.href = '/login';  // ✅ Redirect to Flask login page
}

// Require authentication
function requireAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login?session=expired';  // ✅ Correct Flask route
        return false;
    }
    return true;
}

// Show notification
function showNotification(message, type) {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');

    notificationMessage.textContent = message;
    notification.classList.remove('hidden');
    notification.classList.add(type === 'error' ? 'error' : 'success');

    setTimeout(() => {
        notification.classList.add('hidden');
        notification.classList.remove('error', 'success');
    }, 3000);
}

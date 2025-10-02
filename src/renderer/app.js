import 'vis-network/styles/vis-network.css';
import './styles.css';

import { TaskList } from './modules/TaskList.js';
import { TaskGraph } from './modules/TaskGraph.js';
import { ContextMenu } from './modules/ContextMenu.js';
import { STATUS, STATUS_TEXT } from './utils/constants.js';
import { generateId, getStatusColor, getStatusBorderColor, getStatusHighlightColor, wrapText } from './utils/helpers.js';

class TaskManagerApp {
    constructor() {
        this.tasks = [];
        this.currentTaskId = null;

        // Инициализация компонентов
        this.contextMenu = new ContextMenu();
        this.taskList = new TaskList('tasks-container', this.contextMenu);
        this.taskGraph = new TaskGraph('graph-container', this.contextMenu);

        // Текущий контекст
        this.currentContext = {
            taskId: null,
            stageId: null,
        };

        this.init();
    }

    async init() {
        // Проверка лицензии
        const licenseValid = await window.electronAPI.checkLicense();
        if (!licenseValid) {
            this.showLicenseError();
            return;
        }

        // Загрузка данных
        await this.loadData();

        // Рендер списка задач
        this.renderTaskList();

        // Обработчики кнопок
        this.attachEventHandlers();

        // Слушаем изменения лицензии
        window.electronAPI.onLicenseInvalid(() => {
            this.showLicenseError();
        });
    }

    attachEventHandlers() {
        // Кнопка "Назад"
        const backButton = document.querySelector('.back-button');
        if (backButton) {
            backButton.addEventListener('click', () => this.showTaskList());
        }

        // Обработчики модальных окон
        this.attachModalHandlers();
    }

    attachModalHandlers() {
        // Обработчики для всех кнопок в модальных окнах
        document.addEventListener('click', (e) => {
            const target = e.target;

            // Кнопки отмены
            if (target.matches('[data-action="cancel"]')) {
                const modalId = target.dataset.modal;
                this.closeModalById(modalId);
            }

            // Кнопки подтверждения
            if (target.matches('[data-action="confirm"]')) {
                const modalId = target.dataset.modal;
                this.confirmModalById(modalId);
            }

            // Опции статусов задач
            if (target.closest('.status-option') && target.closest('#task-status-options')) {
                const option = target.closest('.status-option');
                const status = option.dataset.status;
                if (status && this.currentContext.taskId) {
                    this.changeTaskStatus(this.currentContext.taskId, status);
                    this.closeModalById('change-task-status-modal');
                }
            }
        });

        // Обработчики Enter для input полей
        const modalInputs = [
            { id: 'rename-input', modal: 'rename-modal' },
            { id: 'add-task-input', modal: 'add-task-modal' },
            { id: 'add-stage-input', modal: 'add-stage-modal' },
            { id: 'edit-task-input', modal: 'edit-task-modal' }
        ];

        modalInputs.forEach(({ id, modal }) => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.confirmModalById(modal);
                    }
                });
            }
        });

        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Закрываем все видимые модальные окна
                document.querySelectorAll('.modal').forEach(modal => {
                    if (modal.style.display === 'block') {
                        modal.style.display = 'none';
                    }
                });
            }
        });

        // Закрытие по клику на фон
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }

    closeModalById(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    confirmModalById(modalId) {
        switch (modalId) {
            case 'rename-modal':
                this.confirmRenameStage();
                break;
            case 'add-task-modal':
                this.confirmAddTask();
                break;
            case 'add-stage-modal':
                this.confirmAddStage();
                break;
            case 'edit-task-modal':
                this.confirmEditTask();
                break;
            case 'delete-task-modal':
                this.confirmDeleteTask();
                break;
        }
    }

    confirmRenameStage() {
        const input = document.getElementById('rename-input');
        const newName = input.value.trim();

        if (newName && this.currentContext.stageId) {
            this.renameStage(this.currentContext.stageId, newName);
        }
        this.closeModalById('rename-modal');
    }

    confirmAddTask() {
        const input = document.getElementById('add-task-input');
        const taskName = input.value.trim();

        if (taskName) {
            this.addTask(taskName);
        }
        this.closeModalById('add-task-modal');
    }

    confirmAddStage() {
        const input = document.getElementById('add-stage-input');
        const stageName = input.value.trim();

        if (stageName && this.currentContext.stageId) {
            this.addStage(this.currentContext.stageId, stageName);
        }
        this.closeModalById('add-stage-modal');
    }

    confirmEditTask() {
        const input = document.getElementById('edit-task-input');
        const newName = input.value.trim();

        if (newName && this.currentContext.taskId) {
            this.editTask(this.currentContext.taskId, newName);
        }
        this.closeModalById('edit-task-modal');
    }

    confirmDeleteTask() {
        if (this.currentContext.taskId) {
            this.deleteTask(this.currentContext.taskId);
        }
        this.closeModalById('delete-task-modal');
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    confirmModal(modalId) {
        // Обработка подтверждения в соответствующих методах
    }

    // === РАБОТА С ДАННЫМИ ===

    async loadData() {
        try {
            const data = await window.electronAPI.loadData();
            this.tasks = data.tasks || [];

            // Создаем демо-задачу если список пуст
            if (this.tasks.length === 0) {
                await this.createDemoTask();
            }
        } catch (error) {
            console.error('Load data error:', error);
            this.tasks = [];
        }
    }

    async saveData() {
        try {
            const data = {
                tasks: this.tasks,
                updatedAt: new Date().toISOString(),
            };
            await window.electronAPI.saveData(data);
            return true;
        } catch (error) {
            console.error('Save data error:', error);
            alert('Ошибка сохранения данных');
            return false;
        }
    }

    async createDemoTask() {
        const demoTask = {
            id: generateId('task'),
            name: 'Пример задачи',
            status: STATUS.IN_PROGRESS,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            stages: {
                root: {
                    id: 'root',
                    label: 'Пример задачи',
                    status: STATUS.IN_PROGRESS,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
            },
        };

        this.tasks.push(demoTask);
        await this.saveData();
    }

    // === УПРАВЛЕНИЕ ЭКРАНАМИ ===

    showTaskList() {
        document.getElementById('task-list-screen').classList.add('active');
        document.getElementById('task-graph-screen').classList.remove('active');

        // Уничтожаем граф для освобождения ресурсов
        this.taskGraph.destroy();
        this.currentTaskId = null;

        // Перерисовываем список
        this.renderTaskList();
    }

    async showTaskGraph(taskId) {
        // Проверка лицензии
        const licenseValid = await window.electronAPI.checkLicense();
        if (!licenseValid) {
            alert('Ошибка лицензии. Функция недоступна.');
            return;
        }

        const task = this.tasks.find(t => t.id === taskId);
        if (!task) {
            console.error('Task not found:', taskId);
            return;
        }

        this.currentTaskId = taskId;
        document.getElementById('current-task-name').textContent = task.name;
        document.getElementById('task-list-screen').classList.remove('active');
        document.getElementById('task-graph-screen').classList.add('active');

        // Небольшая задержка для плавности
        setTimeout(() => {
            this.renderTaskGraph(task);
        }, 50);
    }

    // === РЕНДЕРИНГ ===

    renderTaskList() {
        this.taskList.render(this.tasks, {
            onTaskClick: (taskId) => this.showTaskGraph(taskId),
            onAddTask: () => this.openAddTaskModal(),
            onEditTask: (taskId) => this.openEditTaskModal(taskId),
            onChangeStatus: (taskId) => this.openChangeTaskStatusModal(taskId),
            onDeleteTask: (taskId) => this.openDeleteTaskModal(taskId),
        });
    }

    renderTaskGraph(task) {
        this.taskGraph.init(task, {
            onRename: (nodeId) => this.openRenameStageModal(nodeId),
            onContextMenu: (nodeId, x, y) => this.showStageContextMenu(nodeId, x, y),
        });
    }

    // === РАБОТА С ЗАДАЧАМИ ===

    openAddTaskModal() {
        const modal = document.getElementById('add-task-modal');
        const input = document.getElementById('add-task-input');

        if (input) {
            input.value = '';
            input.focus();
        }

        if (modal) {
            modal.style.display = 'block';
        }
    }

    async addTask(name) {
        const newTask = {
            id: generateId('task'),
            name: name,
            status: STATUS.IN_PROGRESS,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            stages: {},
        };

        this.tasks.push(newTask);
        await this.saveData();
        this.renderTaskList();
    }

    openEditTaskModal(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        this.currentContext.taskId = taskId;

        const modal = document.getElementById('edit-task-modal');
        const input = document.getElementById('edit-task-input');

        if (input) {
            input.value = task.name;
            input.focus();
            input.select();
        }

        if (modal) {
            modal.style.display = 'block';
        }
    }

    async editTask(taskId, newName) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        task.name = newName;
        task.updatedAt = new Date().toISOString();

        // Обновляем корневой этап если есть
        if (task.stages && task.stages.root) {
            task.stages.root.label = newName;
            task.stages.root.updatedAt = new Date().toISOString();
        }

        await this.saveData();
        this.renderTaskList();

        // Если открыт граф этой задачи, обновляем заголовок
        if (this.currentTaskId === taskId) {
            document.getElementById('current-task-name').textContent = newName;
        }
    }

    openDeleteTaskModal(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        this.currentContext.taskId = taskId;

        const modal = document.getElementById('delete-task-modal');
        const nameSpan = modal.querySelector('#delete-task-name');
        if (nameSpan) {
            nameSpan.textContent = task.name;
        }
        modal.style.display = 'block';
    }

    async deleteTask(taskId) {
        // Если удаляем текущую открытую задачу, возвращаемся к списку
        if (this.currentTaskId === taskId) {
            this.showTaskList();
        }

        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            this.tasks.splice(taskIndex, 1);
            await this.saveData();
            this.renderTaskList();
        }
    }

    openChangeTaskStatusModal(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        this.currentContext.taskId = taskId;

        const modal = document.getElementById('change-task-status-modal');
        const nameSpan = modal.querySelector('[data-task-name]');

        if (nameSpan) {
            nameSpan.textContent = task.name;
        }

        // Сбрасываем выделение
        modal.querySelectorAll('.status-option').forEach(option => {
            option.classList.remove('selected');
            if (option.dataset.status === task.status) {
                option.classList.add('selected');
            }
        });

        if (modal) {
            modal.style.display = 'block';
        }
    }

    async changeTaskStatus(taskId, status) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        task.status = status;
        task.updatedAt = new Date().toISOString();

        await this.saveData();
        this.renderTaskList();
    }

    // === РАБОТА С ЭТАПАМИ ===

    showStageContextMenu(nodeId, x, y) {
        const task = this.tasks.find(t => t.id === this.currentTaskId);
        if (!task) return;

        const stage = task.stages[nodeId];
        if (!stage) return;

        this.currentContext.stageId = nodeId;

        const menuItems = [
            {
                label: 'Добавить этап',
                onClick: () => this.openAddStageModal(nodeId),
            },
            {
                label: 'Статус',
                submenu: Object.entries(STATUS).map(([key, value]) => ({
                    label: STATUS_TEXT[value],
                    onClick: async () => await this.changeStageStatus(nodeId, value),
                })),
            },
            {
                label: 'Переименовать',
                onClick: () => this.openRenameStageModal(nodeId),
            },
        ];

        // Добавляем "Удалить" только если это не root
        if (nodeId !== 'root') {
            menuItems.push({
                label: 'Удалить',
                color: '#dc3545',
                onClick: () => this.deleteStage(nodeId),
            });
        }

        this.contextMenu.show(x, y, menuItems, { nodeId, task });
    }

    openAddStageModal(parentNodeId) {
        this.currentContext.stageId = parentNodeId;

        const modal = document.getElementById('add-stage-modal');
        const input = document.getElementById('add-stage-input');

        if (input) {
            input.value = '';
            input.focus();
        }

        if (modal) {
            modal.style.display = 'block';
        }
    }

    async addStage(parentNodeId, name) {
        const task = this.tasks.find(t => t.id === this.currentTaskId);
        if (!task) return;

        const parentStage = task.stages[parentNodeId];
        if (!parentStage) return;

        const stageId = generateId('stage');
        const newStage = {
            id: stageId,
            label: name,
            status: STATUS.IN_PROGRESS,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // Добавляем в stages
        task.stages[stageId] = newStage;

        // Добавляем в children родителя
        if (!parentStage.children) {
            parentStage.children = [];
        }
        parentStage.children.push(stageId);

        parentStage.updatedAt = new Date().toISOString();
        task.updatedAt = new Date().toISOString();

        // Добавляем узел в граф без перерисовки
        this.taskGraph.addNode(newStage, parentNodeId);

        await this.saveData();
    }

    openRenameStageModal(nodeId) {
        const task = this.tasks.find(t => t.id === this.currentTaskId);
        if (!task) return;

        const stage = task.stages[nodeId];
        if (!stage) return;

        this.currentContext.stageId = nodeId;

        const modal = document.getElementById('rename-modal');
        const input = document.getElementById('rename-input');

        if (input) {
            input.value = stage.label || stage.name;
            input.focus();
            input.select();
        }

        if (modal) {
            modal.style.display = 'block';
        }
    }

    async renameStage(nodeId, newName) {
        const task = this.tasks.find(t => t.id === this.currentTaskId);
        if (!task) return;

        const stage = task.stages[nodeId];
        if (!stage) return;

        stage.label = newName;
        stage.updatedAt = new Date().toISOString();
        task.updatedAt = new Date().toISOString();

        // Обновляем только узел в графе
        const wrappedLabel = wrapText(newName, 18);
        this.taskGraph.updateNode(nodeId, {
            label: wrappedLabel,
        });

        await this.saveData();
    }

    async changeStageStatus(nodeId, status) {
        const task = this.tasks.find(t => t.id === this.currentTaskId);
        if (!task) return;

        const stage = task.stages[nodeId];
        if (!stage) return;

        stage.status = status;
        stage.updatedAt = new Date().toISOString();
        task.updatedAt = new Date().toISOString();

        // Обновляем только цвет узла
        this.taskGraph.updateNode(nodeId, {
            color: {
                background: getStatusColor(status),
                border: getStatusBorderColor(status),
                highlight: {
                    background: getStatusHighlightColor(status),
                    border: getStatusBorderColor(status),
                },
                hover: {
                    background: getStatusHighlightColor(status),
                    border: getStatusBorderColor(status),
                },
            },
        });

        await this.saveData();
    }

    async deleteStage(nodeId) {
        if (nodeId === 'root') {
            alert('Нельзя удалить корневой этап!');
            return;
        }

        if (!confirm('Удалить этот этап и все его подэтапы?')) {
            return;
        }

        const task = this.tasks.find(t => t.id === this.currentTaskId);
        if (!task) return;

        // Удаляем рекурсивно
        this.deleteStageRecursive(task, nodeId);
        task.updatedAt = new Date().toISOString();

        // Удаляем из графа
        this.taskGraph.removeNode(nodeId);

        await this.saveData();
    }

    deleteStageRecursive(task, stageId) {
        const stage = task.stages[stageId];
        if (!stage) return;

        // Рекурсивно удаляем детей
        if (stage.children) {
            stage.children.forEach(childId => {
                this.deleteStageRecursive(task, childId);
            });
        }

        // Удаляем из children родителя
        for (const key in task.stages) {
            const parentStage = task.stages[key];
            if (parentStage && parentStage.children) {
                const index = parentStage.children.indexOf(stageId);
                if (index > -1) {
                    parentStage.children.splice(index, 1);
                    parentStage.updatedAt = new Date().toISOString();
                    break;
                }
            }
        }

        // Удаляем сам этап
        delete task.stages[stageId];
    }

    // === ОБРАБОТКА ОШИБОК ===

    showLicenseError() {
        document.body.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; background: #f5f5f5;">
        <h2 style="color: #dc3545; margin-bottom: 20px;">Ошибка лицензии</h2>
        <p style="text-align: center; margin-bottom: 20px;">
          Лицензия не найдена или недействительна.<br>
          Пожалуйста, убедитесь что файл LICENSE присутствует в корневой директории приложения.
        </p>
        <button onclick="window.location.reload()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
          Повторить
        </button>
      </div>
    `;
    }
}

// Глобальные функции для обработчиков модальных окон
window.closeRenameModal = function () {
    document.getElementById('rename-modal').style.display = 'none';
};

window.confirmRename = function () {
    const app = window.taskManagerApp;
    const input = document.getElementById('rename-input');
    const newName = input.value.trim();

    if (newName && app.currentContext.stageId) {
        app.renameStage(app.currentContext.stageId, newName);
    }
    window.closeRenameModal();
};

window.closeAddTaskModal = function () {
    document.getElementById('add-task-modal').style.display = 'none';
};

window.confirmAddTask = function () {
    const app = window.taskManagerApp;
    const input = document.getElementById('add-task-input');
    const taskName = input.value.trim();

    if (taskName) {
        app.addTask(taskName);
    }
    window.closeAddTaskModal();
};

window.closeAddStageModal = function () {
    document.getElementById('add-stage-modal').style.display = 'none';
};

window.confirmAddStage = function () {
    const app = window.taskManagerApp;
    const input = document.getElementById('add-stage-input');
    const stageName = input.value.trim();

    if (stageName && app.currentContext.stageId) {
        app.addStage(app.currentContext.stageId, stageName);
    }
    window.closeAddStageModal();
};

window.closeEditTaskModal = function () {
    document.getElementById('edit-task-modal').style.display = 'none';
};

window.confirmEditTask = function () {
    const app = window.taskManagerApp;
    const input = document.getElementById('edit-task-input');
    const newName = input.value.trim();

    if (newName && app.currentContext.taskId) {
        app.editTask(app.currentContext.taskId, newName);
    }
    window.closeEditTaskModal();
};

window.closeDeleteTaskModal = function () {
    document.getElementById('delete-task-modal').style.display = 'none';
};

window.confirmDeleteTask = function () {
    const app = window.taskManagerApp;

    if (app.currentContext.taskId) {
        app.deleteTask(app.currentContext.taskId);
    }
    window.closeDeleteTaskModal();
};

window.closeChangeTaskStatusModal = function () {
    document.getElementById('change-task-status-modal').style.display = 'none';
};

window.selectTaskStatus = function (status) {
    const app = window.taskManagerApp;

    if (app.currentContext.taskId) {
        app.changeTaskStatus(app.currentContext.taskId, status);
    }
    window.closeChangeTaskStatusModal();
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    window.taskManagerApp = new TaskManagerApp();
});

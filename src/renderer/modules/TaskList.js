import { getStatusText, formatDate } from '../utils/helpers.js';

export class TaskList {
    constructor(containerId, contextMenu) {
        this.container = document.getElementById(containerId);
        this.contextMenu = contextMenu;
        this.eventHandlers = {};
    }

    render(tasks, eventHandlers = {}) {
        this.eventHandlers = eventHandlers;

        if (!this.container) return;

        // Очищаем контейнер
        this.container.innerHTML = '';

        // Сортируем задачи
        const sortedTasks = this.sortTasks(tasks);

        // Создаем элементы задач
        sortedTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            this.container.appendChild(taskElement);
        });

        // Добавляем кнопку создания новой задачи
        const addButton = this.createAddButton();
        this.container.appendChild(addButton);
    }

    sortTasks(tasks) {
        const statusOrder = {
            'in-progress': 0,
            'frozen': 1,
            'completed': 2,
            'waiting': 3,
            'failed': 4,
        };

        return [...tasks].sort((a, b) => {
            const statusCompare = statusOrder[a.status] - statusOrder[b.status];
            if (statusCompare === 0) {
                return a.name.localeCompare(b.name);
            }
            return statusCompare;
        });
    }

    createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item task-${task.status}`;
        taskElement.dataset.taskId = task.id;

        // Основной контент
        const mainContent = document.createElement('div');
        mainContent.className = 'task-main-content';
        mainContent.innerHTML = `
      <div class="task-header">
        <span class="task-name">${this.escapeHtml(task.name)}</span>
        <span class="task-status status-${task.status}">
          ${getStatusText(task.status)}
        </span>
      </div>
      <div class="task-info">Этапов: ${task.stages ? Object.keys(task.stages).length : 0}</div>
      <small class="task-updated">Обновлено: ${formatDate(task.updatedAt)}</small>
    `;

        // Кнопка контекстного меню
        const contextBtn = document.createElement('div');
        contextBtn.className = 'task-item-context';
        contextBtn.textContent = '⋮';

        // Собираем элемент
        taskElement.appendChild(mainContent);
        taskElement.appendChild(contextBtn);

        // Обработчики событий
        mainContent.addEventListener('click', () => {
            if (this.eventHandlers.onTaskClick) {
                this.eventHandlers.onTaskClick(task.id);
            }
        });

        contextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showTaskContextMenu(e, task);
        });

        taskElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showTaskContextMenu(e, task);
        });

        return taskElement;
    }

    createAddButton() {
        const addBtn = document.createElement('div');
        addBtn.className = 'task-item task-item-add';
        addBtn.innerHTML = '<span>+ Добавить новую задачу</span>';

        addBtn.addEventListener('click', () => {
            if (this.eventHandlers.onAddTask) {
                this.eventHandlers.onAddTask();
            }
        });

        return addBtn;
    }

    showTaskContextMenu(event, task) {
        const menuItems = [
            {
                label: 'Редактировать название',
                onClick: () => {
                    if (this.eventHandlers.onEditTask) {
                        this.eventHandlers.onEditTask(task.id);
                    }
                },
            },
            {
                label: 'Изменить статус',
                onClick: () => {
                    if (this.eventHandlers.onChangeStatus) {
                        this.eventHandlers.onChangeStatus(task.id);
                    }
                },
            },
            {
                label: 'Удалить задачу',
                color: '#dc3545',
                onClick: () => {
                    if (this.eventHandlers.onDeleteTask) {
                        this.eventHandlers.onDeleteTask(task.id);
                    }
                },
            },
        ];

        this.contextMenu.show(event.pageX, event.pageY, menuItems, task);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

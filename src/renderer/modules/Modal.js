export class Modal {
    constructor(id) {
        this.modal = document.getElementById(id);
        this.input = this.modal?.querySelector('input[type="text"]');
        this.confirmCallback = null;

        // Закрытие по клику вне модального окна
        this.modal?.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) {
                this.close();
            }
        });
    }

    open(initialValue = '', onConfirm) {
        if (!this.modal) return;

        this.confirmCallback = onConfirm;

        if (this.input) {
            this.input.value = initialValue;
            this.input.focus();
            this.input.select();

            // Обработчик Enter
            const handleEnter = (e) => {
                if (e.key === 'Enter') {
                    this.confirm();
                    this.input.removeEventListener('keypress', handleEnter);
                }
            };
            this.input.addEventListener('keypress', handleEnter);
        }

        this.modal.style.display = 'block';
    }

    close() {
        if (this.modal) {
            this.modal.style.display = 'none';
            this.confirmCallback = null;
        }
    }

    confirm() {
        if (this.confirmCallback) {
            const value = this.input ? this.input.value.trim() : null;
            this.confirmCallback(value);
        }
        this.close();
    }

    isOpen() {
        return this.modal && this.modal.style.display === 'block';
    }
}

// Специальный модальный класс для выбора статуса
export class StatusModal extends Modal {
    constructor(id) {
        super(id);
        this.statusOptions = this.modal?.querySelectorAll('.status-option');
    }

    open(taskName, currentStatus, onConfirm) {
        if (!this.modal) return;

        const nameElement = this.modal.querySelector('[data-task-name]');
        if (nameElement) {
            nameElement.textContent = taskName;
        }

        // Сбрасываем выделение
        this.statusOptions?.forEach(option => {
            option.classList.remove('selected');
            if (option.dataset.status === currentStatus) {
                option.classList.add('selected');
            }

            // Добавляем обработчик клика
            option.onclick = () => {
                const status = option.dataset.status;
                if (onConfirm) {
                    onConfirm(status);
                }
                this.close();
            };
        });

        this.modal.style.display = 'block';
    }
}

// Модальное окно подтверждения
export class ConfirmModal extends Modal {
    open(message, onConfirm, onCancel) {
        if (!this.modal) return;

        const messageElement = this.modal.querySelector('[data-message]');
        if (messageElement) {
            messageElement.textContent = message;
        }

        this.confirmCallback = onConfirm;
        this.cancelCallback = onCancel;

        this.modal.style.display = 'block';
    }

    cancel() {
        if (this.cancelCallback) {
            this.cancelCallback();
        }
        this.close();
    }
}

import {
    STATUS_TEXT,
    STATUS_COLORS,
    STATUS_BORDER_COLORS,
    STATUS_HIGHLIGHT_COLORS,
} from './constants.js';

// Генерация уникального ID
export function generateId(prefix = 'item') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Форматирование даты
export function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU');
}

// Получение текста статуса
export function getStatusText(status) {
    return STATUS_TEXT[status] || status;
}

// Получение цвета статуса
export function getStatusColor(status) {
    return STATUS_COLORS[status] || '#969696';
}

// Получение цвета границы статуса
export function getStatusBorderColor(status) {
    return STATUS_BORDER_COLORS[status] || '#616161';
}

// Получение цвета подсветки статуса
export function getStatusHighlightColor(status) {
    return STATUS_HIGHLIGHT_COLORS[status] || '#9E9E9E';
}

// Разбивка текста на строки с учетом максимальной длины
export function wrapText(text, maxLength = 18) {
    if (!text || text.length <= maxLength) {
        return text || '';
    }

    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
        if (word.length > maxLength) {
            // Добавляем текущую строку если она не пуста
            if (currentLine) {
                lines.push(currentLine);
                currentLine = '';
            }

            // Разбиваем длинное слово
            const chunks = word.match(new RegExp(`.{1,${maxLength - 2}}`, 'g'));
            if (chunks) {
                // Добавляем все куски кроме последнего с дефисом
                for (let i = 0; i < chunks.length - 1; i++) {
                    lines.push(chunks[i] + '-');
                }
                currentLine = chunks[chunks.length - 1];
            }
        } else {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (testLine.length <= maxLength) {
                currentLine = testLine;
            } else {
                if (currentLine) {
                    lines.push(currentLine);
                }
                currentLine = word;
            }
        }
    }

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines.join('\n');
}

// Поиск самых глубоких узлов в дереве
export function findDeepestNodes(stages) {
    let maxDepth = 0;
    const nodesAtMaxDepth = [];

    function traverse(nodeId, depth, visited = new Set()) {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);

        const node = stages[nodeId];
        if (!node) return;

        if (depth > maxDepth) {
            maxDepth = depth;
            nodesAtMaxDepth.length = 0;
            nodesAtMaxDepth.push(nodeId);
        } else if (depth === maxDepth) {
            nodesAtMaxDepth.push(nodeId);
        }

        if (node.children) {
            node.children.forEach(childId => {
                traverse(childId, depth + 1, visited);
            });
        }
    }

    if (stages.root) {
        traverse('root', 0);
    }

    return nodesAtMaxDepth;
}

// Debounce функция для оптимизации
export function debounce(func, wait) {
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

// Статусы задач и этапов
export const STATUS = {
    IN_PROGRESS: 'in-progress',
    WAITING: 'waiting',
    COMPLETED: 'completed',
    FAILED: 'failed',
    FROZEN: 'frozen',
};

// Текстовые представления статусов
export const STATUS_TEXT = {
    [STATUS.IN_PROGRESS]: 'В процессе',
    [STATUS.WAITING]: 'Жду другого',
    [STATUS.COMPLETED]: 'Завершено',
    [STATUS.FAILED]: 'Провалено',
    [STATUS.FROZEN]: 'Заморожено',
};

// Цвета для статусов (фон узлов)
export const STATUS_COLORS = {
    [STATUS.IN_PROGRESS]: '#2196F3',
    [STATUS.WAITING]: '#FF9800',
    [STATUS.COMPLETED]: '#4CAF50',
    [STATUS.FAILED]: '#F44336',
    [STATUS.FROZEN]: '#9E9E9E',
};

// Цвета границ для статусов
export const STATUS_BORDER_COLORS = {
    [STATUS.IN_PROGRESS]: '#1976D2',
    [STATUS.WAITING]: '#F57C00',
    [STATUS.COMPLETED]: '#388E3C',
    [STATUS.FAILED]: '#D32F2F',
    [STATUS.FROZEN]: '#616161',
};

// Цвета подсветки для статусов
export const STATUS_HIGHLIGHT_COLORS = {
    [STATUS.IN_PROGRESS]: '#42A5F5',
    [STATUS.WAITING]: '#FFB74D',
    [STATUS.COMPLETED]: '#66BB6A',
    [STATUS.FAILED]: '#EF5350',
    [STATUS.FROZEN]: '#BDBDBD',
};

// Опции для vis-network
export const NETWORK_OPTIONS = {
    layout: {
        hierarchical: {
            enabled: true,
            direction: 'UD',
            sortMethod: 'directed',
            levelSeparation: 200,
            nodeSpacing: 180,
            treeSpacing: 300,
            blockShifting: true,
            edgeMinimization: true,
            parentCentralization: true,
        },
    },
    interaction: {
        dragNodes: false,
        dragView: true,
        zoomView: true,
        hover: true,
        zoomSpeed: 1.0,
        tooltipDelay: 200,
    },
    physics: {
        enabled: false,
    },
    edges: {
        arrows: {
            to: {
                enabled: true,
                scaleFactor: 1.2,
                type: 'arrow',
            },
        },
        smooth: {
            enabled: true,
            type: 'cubicBezier',
            forceDirection: 'vertical',
            roundness: 0.5,
        },
        color: {
            color: '#666666',
            highlight: '#333333',
            hover: '#333333',
        },
        width: 2,
        hoverWidth: 3,
    },
    nodes: {
        shape: 'box',
        margin: 15,
        widthConstraint: {
            minimum: 140,
            maximum: 220,
        },
        borderWidth: 2,
        borderWidthSelected: 4,
        shadow: {
            enabled: true,
            color: 'rgba(0,0,0,0.2)',
            size: 8,
            x: 3,
            y: 3,
        },
        font: {
            size: 14,
            face: 'Arial',
            color: '#ffffff',
            multi: true,
        },
    },
};

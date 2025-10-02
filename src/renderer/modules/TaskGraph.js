import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { NETWORK_OPTIONS, STATUS } from '../utils/constants.js';
import {
    getStatusColor,
    getStatusBorderColor,
    getStatusHighlightColor,
    wrapText,
    findDeepestNodes,
} from '../utils/helpers.js';

export class TaskGraph {
    constructor(containerId, contextMenu) {
        this.container = document.getElementById(containerId);
        this.contextMenu = contextMenu;
        this.network = null;
        this.nodes = null;
        this.edges = null;
        this.currentTask = null;
        this.eventHandlers = {};
    }

    // Инициализация графа
    init(task, eventHandlers = {}) {
        this.currentTask = task;
        this.eventHandlers = eventHandlers;

        // Очищаем предыдущий граф
        this.destroy();

        // Создаем DataSet для узлов и связей
        this.nodes = new DataSet();
        this.edges = new DataSet();

        // Создаем корневой узел если его нет
        if (!task.stages) {
            task.stages = {};
        }

        if (!task.stages.root) {
            task.stages.root = {
                id: 'root',
                label: task.name,
                status: STATUS.IN_PROGRESS,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
        }

        // Добавляем все узлы в граф
        this.buildGraph(task.stages.root, null, task.stages);

        // Создаем сеть
        const data = { nodes: this.nodes, edges: this.edges };
        this.network = new Network(this.container, data, NETWORK_OPTIONS);

        // Добавляем обработчики событий
        this.attachEventHandlers();

        // Фокусируемся на самых глубоких узлах
        this.focusOnDeepest();
    }

    // Построение графа рекурсивно
    buildGraph(stage, parentId, allStages) {
        // Добавляем узел
        this.nodes.add(this.createNodeData(stage));

        // Добавляем связь с родителем
        if (parentId) {
            this.edges.add(this.createEdgeData(parentId, stage.id));
        }

        // Рекурсивно добавляем детей
        if (stage.children) {
            stage.children.forEach(childId => {
                const childStage = allStages[childId];
                if (childStage) {
                    this.buildGraph(childStage, stage.id, allStages);
                }
            });
        }
    }

    // Создание данных узла
    createNodeData(stage) {
        const label = wrapText(stage.label || stage.name, 18);

        return {
            id: stage.id,
            label: label,
            color: {
                background: getStatusColor(stage.status),
                border: getStatusBorderColor(stage.status),
                highlight: {
                    background: getStatusHighlightColor(stage.status),
                    border: getStatusBorderColor(stage.status),
                },
                hover: {
                    background: getStatusHighlightColor(stage.status),
                    border: getStatusBorderColor(stage.status),
                },
            },
            font: {
                color: 'white',
                size: 14,
                face: 'Arial',
                multi: true,
            },
        };
    }

    // Создание данных связи
    createEdgeData(from, to) {
        return {
            from: from,
            to: to,
            arrows: {
                to: {
                    enabled: true,
                    type: 'arrow',
                },
            },
            smooth: {
                enabled: true,
                type: 'cubicBezier',
                roundness: 0.4,
            },
        };
    }

    // Добавление обработчиков событий
    attachEventHandlers() {
        if (!this.network) return;

        // Двойной клик - переименование
        this.network.on('doubleClick', (params) => {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                if (this.eventHandlers.onRename) {
                    this.eventHandlers.onRename(nodeId);
                }
            }
        });

        // Правая кнопка - контекстное меню
        this.network.on('oncontext', (params) => {
            params.event.preventDefault();
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                if (this.eventHandlers.onContextMenu) {
                    this.eventHandlers.onContextMenu(nodeId, params.event.clientX, params.event.clientY);
                }
            }
        });
    }

    // Обновление узла без перерисовки графа
    updateNode(nodeId, updates) {
        if (!this.nodes) return;

        // Сохраняем текущую позицию камеры
        const viewState = this.getViewState();

        // Обновляем узел
        const existingNode = this.nodes.get(nodeId);
        if (existingNode) {
            this.nodes.update({
                id: nodeId,
                ...existingNode,
                ...updates,
            });
        }

        // Восстанавливаем позицию камеры
        this.restoreViewState(viewState);
    }

    // Добавление нового узла
    addNode(stage, parentId) {
        if (!this.nodes || !this.edges) return;

        // Сохраняем состояние камеры
        const viewState = this.getViewState();

        // Добавляем узел
        this.nodes.add(this.createNodeData(stage));

        // Добавляем связь
        if (parentId) {
            this.edges.add(this.createEdgeData(parentId, stage.id));
        }

        // Обновляем layout
        this.network.setOptions({
            layout: {
                hierarchical: {
                    enabled: true,
                },
            },
        });

        // Восстанавливаем камеру после небольшой задержки
        setTimeout(() => {
            this.restoreViewState(viewState);
        }, 100);
    }

    // Удаление узла и всех его потомков
    removeNode(nodeId) {
        if (!this.nodes || !this.edges) return;

        const viewState = this.getViewState();

        // Находим все узлы для удаления (включая потомков)
        const nodesToRemove = this.getNodeWithDescendants(nodeId);

        // Удаляем связи
        const edgesToRemove = this.edges.get().filter(edge =>
            nodesToRemove.includes(edge.from) || nodesToRemove.includes(edge.to)
        );
        this.edges.remove(edgesToRemove.map(e => e.id));

        // Удаляем узлы
        this.nodes.remove(nodesToRemove);

        // Восстанавливаем камеру
        setTimeout(() => {
            this.restoreViewState(viewState);
        }, 100);
    }

    // Получение узла со всеми потомками
    getNodeWithDescendants(nodeId) {
        const result = [nodeId];
        const edges = this.edges.get();

        function findChildren(parentId) {
            edges.forEach(edge => {
                if (edge.from === parentId && !result.includes(edge.to)) {
                    result.push(edge.to);
                    findChildren(edge.to);
                }
            });
        }

        findChildren(nodeId);
        return result;
    }

    // Получение состояния камеры
    getViewState() {
        if (!this.network) return null;

        return {
            position: this.network.getViewPosition(),
            scale: this.network.getScale(),
        };
    }

    // Восстановление состояния камеры
    restoreViewState(viewState) {
        if (!this.network || !viewState) return;

        this.network.moveTo({
            position: viewState.position,
            scale: viewState.scale,
            animation: false,
        });
    }

    // Фокус на самых глубоких узлах
    focusOnDeepest() {
        if (!this.network || !this.currentTask) return;

        setTimeout(() => {
            const deepestNodes = findDeepestNodes(this.currentTask.stages);
            if (deepestNodes.length > 0) {
                this.network.focus(deepestNodes[0], {
                    scale: 1.0,
                    animation: {
                        duration: 800,
                        easingFunction: 'linear',
                    },
                });
            } else {
                this.network.fit({
                    animation: {
                        duration: 800,
                        easingFunction: 'linear',
                    },
                });
            }
        }, 300);
    }

    // Уничтожение графа
    destroy() {
        if (this.network) {
            this.network.destroy();
            this.network = null;
        }
        this.nodes = null;
        this.edges = null;
    }
}

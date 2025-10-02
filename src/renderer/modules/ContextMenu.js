export class ContextMenu {
    constructor() {
        this.menu = document.getElementById('context-menu');
        this.currentContext = null;

        // Закрытие меню по клику вне его
        document.addEventListener('click', () => {
            this.close();
        });
    }

    show(x, y, items, context = null) {
        if (!this.menu) return;

        this.currentContext = context;
        this.menu.innerHTML = '';

        items.forEach(item => {
            const menuItem = this.createMenuItem(item);
            this.menu.appendChild(menuItem);
        });

        // Позиционирование с учетом краев экрана
        const menuWidth = 200;
        const menuHeight = items.length * 40;

        let finalX = x;
        let finalY = y;

        if (x + menuWidth > window.innerWidth) {
            finalX = window.innerWidth - menuWidth - 10;
        }

        if (y + menuHeight > window.innerHeight) {
            finalY = window.innerHeight - menuHeight - 10;
        }

        this.menu.style.left = `${finalX}px`;
        this.menu.style.top = `${finalY}px`;
        this.menu.style.display = 'block';

        // Предотвращаем немедленное закрытие
        setTimeout(() => {
            this.menu.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }, 0);
    }

    createMenuItem(item) {
        const menuItem = document.createElement('div');
        menuItem.className = 'context-menu-item';

        if (item.color) {
            menuItem.style.color = item.color;
        }

        if (item.submenu) {
            menuItem.classList.add('with-submenu');
            menuItem.innerHTML = `
        ${item.label}
        <span style="float: right; margin-left: 20px;">▶</span>
      `;

            const submenu = document.createElement('div');
            submenu.className = 'submenu';

            item.submenu.forEach(subItem => {
                const subMenuItem = this.createMenuItem(subItem);
                submenu.appendChild(subMenuItem);
            });

            menuItem.appendChild(submenu);

            // Показываем подменю при наведении
            menuItem.addEventListener('mouseenter', () => {
                submenu.style.display = 'block';
            });

            menuItem.addEventListener('mouseleave', () => {
                setTimeout(() => {
                    if (!submenu.matches(':hover')) {
                        submenu.style.display = 'none';
                    }
                }, 100);
            });
        } else {
            menuItem.textContent = item.label;

            if (item.onClick) {
                menuItem.addEventListener('click', (e) => {
                    e.stopPropagation();
                    item.onClick(this.currentContext);
                    this.close();
                });
            }
        }

        return menuItem;
    }

    close() {
        if (this.menu) {
            this.menu.style.display = 'none';
            this.currentContext = null;
        }
    }
}

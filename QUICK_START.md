# 🚀 Быстрый старт

## Новый проект (с нуля)

```bash
# 1. Создайте структуру папок
mkdir -p task-manager/src/{main,renderer/{modules,utils},preload}
cd task-manager

# 2. Скопируйте все файлы в соответствующие папки

# 3. Установите зависимости
npm install

# 4. Соберите проект
npm run webpack

# 5. Запустите
npm start
```

## Обновление существующего проекта

```bash
# 1. Бэкап
cp tasks.json tasks.json.backup
cp LICENSE LICENSE.backup

# 2. Создайте новую структуру
mkdir -p src/{main,renderer/{modules,utils},preload}

# 3. Переместите LICENSE и tasks.json в корень (если они не там)

# 4. Скопируйте новые файлы

# 5. Обновите package.json

# 6. Установите зависимости
npm install

# 7. Соберите
npm run webpack

# 8. Запустите
npm start
```

## 📁 Список файлов для копирования

### Корневые файлы:
- ✅ `package.json` (обновленный)
- ✅ `webpack.config.js` (новый)
- ✅ `LICENSE` (ваш существующий)
- ✅ `tasks.json` (если есть)

### src/main/:
- ✅ `main.js`
- ✅ `license.js`
- ✅ `storage.js`

### src/renderer/:
- ✅ `index.html`
- ✅ `styles.css`
- ✅ `app.js`

### src/renderer/modules/:
- ✅ `TaskList.js`
- ✅ `TaskGraph.js`
- ✅ `ContextMenu.js`
- ✅ `Modal.js`

### src/renderer/utils/:
- ✅ `constants.js`
- ✅ `helpers.js`

### src/preload/:
- ✅ `preload.js`

## 🎯 Проверка установки

После установки проверьте:

```bash
# Структура создана?
tree src/

# Зависимости установлены?
npm list --depth=0

# Bundle создан?
ls dist/renderer/bundle.js

# Приложение запускается?
npm start
```

## ⚡ Команды для работы

```bash
# Разработка (watch mode)
npm run webpack -- --watch  # В одном терминале
npm start                   # В другом терминале

# Production сборка
npm run webpack
npm start

# Создание установщика
npm run build
```

## 🔧 Первый запуск

1. Убедитесь что файл `LICENSE` существует
2. При первом запуске создастся демо-задача
3. Откройте DevTools (F12) чтобы видеть логи

## 🐛 Быстрое решение проблем

**Не собирается:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run webpack
```

**Не запускается:**
```bash
# Проверьте консоль (F12)
# Проверьте что bundle.js создан
ls dist/renderer/bundle.js
```

**Ошибка лицензии:**
```bash
# Убедитесь что LICENSE в корне
ls LICENSE

# Проверьте содержимое
cat LICENSE
```

## 📖 Дальнейшее чтение

- `README.md` - полная документация
- `MIGRATION_GUIDE.md` - детальный гид по миграции
- Комментарии в коде - объяснения архитектурных решений

---

**Готово! Приложение должно работать без прыжков графа и с улучшенной производительностью.**

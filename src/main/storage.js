const fs = require('fs').promises;
const path = require('path');

class StorageManager {
    constructor() {
        this.dataPath = path.join(process.cwd(), 'tasks.json');
    }

    async saveData(data) {
        try {
            await fs.writeFile(
                this.dataPath,
                JSON.stringify(data, null, 2),
                'utf8'
            );
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    }

    async loadData() {
        try {
            const fileExists = await fs.access(this.dataPath)
                .then(() => true)
                .catch(() => false);

            if (!fileExists) {
                return { tasks: [] };
            }

            const data = await fs.readFile(this.dataPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading data:', error);
            return { tasks: [] };
        }
    }
}

module.exports = StorageManager;

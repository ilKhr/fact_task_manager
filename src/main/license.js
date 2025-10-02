const fs = require('fs');
const path = require('path');
const { dialog } = require('electron');

class LicenseManager {
    constructor() {
        this.licenseValid = false;
        this.monitoringInterval = null;
        this.licensePath = path.join(process.cwd(), 'LICENSE');
    }

    async checkLicense() {
        try {
            if (!fs.existsSync(this.licensePath)) {
                return false;
            }

            const licenseContent = fs.readFileSync(this.licensePath, 'utf8');

            // Проверка ключевых слов
            const requiredKeywords = ['Copyright', 'Все права защищены', 'коммерческой тайной'];
            const hasAllKeywords = requiredKeywords.every(keyword =>
                licenseContent.includes(keyword)
            );

            // Проверка года
            const currentYear = new Date().getFullYear();
            const hasCurrentYear = licenseContent.includes(currentYear.toString());

            this.licenseValid = hasAllKeywords && hasCurrentYear;
            return this.licenseValid;
        } catch (error) {
            console.error('License check error:', error);
            this.licenseValid = false;
            return false;
        }
    }

    showLicenseDialog(window, onClose) {
        dialog.showMessageBox(window, {
            type: 'error',
            title: 'Ошибка лицензии',
            message: 'Лицензия не найдена или недействительна',
            detail: 'Пожалуйста, убедитесь что файл LICENSE присутствует в корневой директории приложения.',
            buttons: ['Выход', 'Повторить проверку'],
            defaultId: 0,
            cancelId: 0
        }).then(result => {
            if (result.response === 0) {
                onClose();
            } else {
                this.checkLicense().then(valid => {
                    if (valid) {
                        this.licenseValid = true;
                        window.show();
                    } else {
                        this.showLicenseDialog(window, onClose);
                    }
                });
            }
        });
    }

    startMonitoring(onInvalidCallback) {
        // Проверка каждые 30 секунд
        this.monitoringInterval = setInterval(async () => {
            const valid = await this.checkLicense();
            if (!valid && this.licenseValid) {
                this.licenseValid = false;
                onInvalidCallback();
            }
        }, 30000);
    }

    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }
}

module.exports = LicenseManager;

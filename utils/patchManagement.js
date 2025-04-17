const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { logger } = require('./logger');

class PatchManagement {
    static async checkDependencies() {
        try {
            // Baca package.json
            const packageJson = JSON.parse(
                await fs.readFile(path.join(process.cwd(), 'package.json'), 'utf8')
            );

            // Jalankan npm audit
            const auditResult = await this.#runCommand('npm audit --json');
            const vulnerabilities = JSON.parse(auditResult);

            // Baca package-lock.json jika ada
            let packageLock;
            try {
                packageLock = JSON.parse(
                    await fs.readFile(path.join(process.cwd(), 'package-lock.json'), 'utf8')
                );
            } catch (error) {
                logger.warn('package-lock.json not found');
            }

            return {
                dependencies: packageJson.dependencies,
                devDependencies: packageJson.devDependencies,
                vulnerabilities: vulnerabilities,
                lockfileExists: !!packageLock
            };
        } catch (error) {
            logger.error('Error checking dependencies:', error);
            throw error;
        }
    }

    static async updateDependencies(options = { autoFix: false }) {
        try {
            const results = {
                outdated: [],
                updated: [],
                errors: []
            };

            // Cek package yang outdated
            const outdatedPackages = await this.#runCommand('npm outdated --json');
            results.outdated = JSON.parse(outdatedPackages);

            if (options.autoFix) {
                // Update dependencies dengan vulnerabilities
                await this.#runCommand('npm audit fix');
                
                // Update ke versi minor/patch terbaru
                await this.#runCommand('npm update');
                
                // Log hasil update
                const updatedPackages = await this.#runCommand('npm list --json');
                results.updated = JSON.parse(updatedPackages);
            }

            return results;
        } catch (error) {
            logger.error('Error updating dependencies:', error);
            throw error;
        }
    }

    static async #runCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error && !stdout) {
                    reject(error);
                    return;
                }
                resolve(stdout || stderr);
            });
        });
    }

    // Schedule pengecekan otomatis (setiap minggu)
    static scheduleChecks() {
        const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;
        
        setInterval(async () => {
            try {
                logger.info('Running scheduled dependency check');
                const checkResult = await this.checkDependencies();
                
                // Jika ada high/critical vulnerabilities, kirim alert
                if (checkResult.vulnerabilities.metadata?.vulnerabilities?.high > 0 ||
                    checkResult.vulnerabilities.metadata?.vulnerabilities?.critical > 0) {
                    logger.error('Critical/High vulnerabilities found:', checkResult.vulnerabilities);
                    // Implementasi alert (email/slack/dll) bisa ditambahkan di sini
                }
                
            } catch (error) {
                logger.error('Scheduled check failed:', error);
            }
        }, WEEK_IN_MS);
    }
}

module.exports = PatchManagement;
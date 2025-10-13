import { Package, TerminalCommands } from './types.js';
import { PACKAGES, SECRET_MESSAGE, WELCOME_MESSAGE } from './package-data.js';
import { AptSimulator } from './apt-simulator.js';
import { formatOutput } from '../common/helper.js';

class PackageHuntGame {
    private packages: Package[];
    private selectedPackage: string | null;
    private puzzleSolved: boolean;
    private secretMessage: string;
    private currentInput: string;
    private commandHistory: string[];
    private historyIndex: number;
    private commands: TerminalCommands;
    private boundHandleKeyDown: (e: KeyboardEvent) => void;
    private isExecutingCommand: boolean;
    private aptSimulator: AptSimulator;

    constructor() {
        this.packages = [...PACKAGES];
        this.selectedPackage = null;
        this.puzzleSolved = false;
        this.secretMessage = SECRET_MESSAGE;
        this.currentInput = '';
        this.commandHistory = [];
        this.historyIndex = -1;
        this.boundHandleKeyDown = this.handleKeyDown.bind(this);
        this.isExecutingCommand = false;
        this.aptSimulator = new AptSimulator(this.packages);

        this.commands = this.createCommands();
        this.init();
    }

    private createCommands(): TerminalCommands {
        return {
            help: () => {
                const lines = [
                    'Available commands:',
                    '  help - Show this help message',
                    '  clear - Clear the terminal',
                    '  apt update - Update package lists',
                    '  apt install <package> - Install a package',
                    '  apt remove <package> - Remove a package',
                    '  dpkg -l - List installed packages',
                    '  apt list --installed - List installed packages',
                    '  apt search <term> - Search for packages',
                    '  apt show <package> - Show package information'
                ];

                const ubdecodePackage = this.packages.find(p => p.name === 'ubdecode');
                if (ubdecodePackage?.installed) {
                    lines.push('  ubdecode <file> - Decrypt an encrypted file');
                }

                return formatOutput(lines);
            },
            clear: () => {
                const terminalContent = document.getElementById('terminalContent');
                if (terminalContent) {
                    terminalContent.innerHTML = '';
                }
                return '';
            },
            'apt': (args: string[]) => {
                if (args.length === 0) {
                    return formatOutput([
                        'apt: missing command',
                        'Try: apt update, apt install, apt remove, apt list, apt search, apt show'
                    ]);
                }
                const subcommand = args[0];
                const remainingArgs = args.slice(1);

                switch (subcommand) {
                    case 'update':
                        return this.aptSimulator.update();
                    case 'install':
                        if (remainingArgs.length === 0) {
                            return formatOutput([
                                'apt install: missing package name',
                                'Try: apt install <package-name>'
                            ]);
                        }
                        const installResult = this.aptSimulator.install(remainingArgs[0] || '');
                        this.renderPackages();
                        this.updateButtonStates();
                        return installResult;
                    case 'remove':
                        if (remainingArgs.length === 0) {
                            return formatOutput([
                                'apt remove: missing package name',
                                'Try: apt remove <package-name>'
                            ]);
                        }
                        const removeResult = this.aptSimulator.remove(remainingArgs[0] || '');
                        this.renderPackages();
                        this.updateButtonStates();
                        return removeResult;
                    case 'list':
                        if (remainingArgs.includes('--installed')) {
                            return this.aptSimulator.listInstalled();
                        }
                        return 'apt list: use --installed to list installed packages';
                    case 'search':
                        if (remainingArgs.length === 0) {
                            return formatOutput([
                                'apt search: missing search term',
                                'Try: apt search <term>'
                            ]);
                        }
                        return this.aptSimulator.search(remainingArgs[0] || '');
                    case 'show':
                        if (remainingArgs.length === 0) {
                            return formatOutput([
                                'apt show: missing package name',
                                'Try: apt show <package-name>'
                            ]);
                        }
                        return this.aptSimulator.show(remainingArgs[0] || '');
                    default:
                        return formatOutput([
                            `apt: unknown command '${subcommand}'`,
                            'Try: apt update, apt install, apt remove, apt list, apt search, apt show'
                        ]);
                }
            },
            'dpkg': (args: string[]) => {
                if (args.length === 0) {
                    return formatOutput([
                        'dpkg: missing command',
                        'Try: dpkg -l'
                    ]);
                }
                if (args[0] === '-l') {
                    return this.aptSimulator.dpkgList();
                }
                return formatOutput([
                    `dpkg: unknown option '${args[0]}'`,
                    'Try: dpkg -l'
                ]);
            },
            'ubdecode': (args: string[]) => {
                const ubdecodePackage = this.packages.find(p => p.name === 'ubdecode');
                if (!ubdecodePackage?.installed) {
                    return formatOutput([
                        'ubdecode: command not found',
                        '',
                        'The ubdecode package is not installed.',
                        'Install it using: apt install ubdecode'
                    ]);
                }
                if (args.length === 0) {
                    return formatOutput([
                        'ubdecode: missing file argument',
                        'Usage: ubdecode <file>'
                    ]);
                }
                const filename = args[0] || '';
                if (filename === 'clue.enc' || filename.endsWith('.enc')) {
                    this.revealSecretMessage();
                    return formatOutput([
                        `🔓 Decrypting ${filename}...`,
                        '✓ Decryption successful!',
                        '',
                        '📜 Decrypted content:',
                        this.secretMessage,
                        '',
                        '🎉 Puzzle completed! Congratulations!'
                    ]);
                }
                return formatOutput([
                    `ubdecode: cannot find file '${filename}'`,
                    'Try: ubdecode clue.enc'
                ]);
            }
        };
    }

    private init(): void {
        this.renderPackages();
        this.setupEventListeners();
        this.addTerminalOutput(WELCOME_MESSAGE);
    }

    private setupEventListeners(): void {
        const searchInput = document.getElementById('searchInput') as HTMLInputElement;
        if (searchInput) {
            searchInput.addEventListener('input', (e: Event) => {
                const target = e.target as HTMLInputElement;
                this.filterPackages(target.value);
            });
        }

        const installBtn = document.getElementById('installBtn') as HTMLButtonElement;
        if (installBtn) {
            installBtn.addEventListener('click', () => this.installPackage());
        }

        const removeBtn = document.getElementById('removeBtn') as HTMLButtonElement;
        if (removeBtn) {
            removeBtn.addEventListener('click', () => this.removePackage());
        }

        const updateBtn = document.getElementById('updateBtn') as HTMLButtonElement;
        if (updateBtn) {
            updateBtn.addEventListener('click', () => this.updatePackageList());
        }

        this.setupTerminalInput();

        const terminalContent = document.getElementById('terminalContent');
        if (terminalContent) {
            terminalContent.tabIndex = 0;
            terminalContent.style.outline = 'none';
            terminalContent.addEventListener('click', () => terminalContent.focus());
            setTimeout(() => terminalContent.focus(), 100);
        }
    }

    private renderPackages(): void {
        const packagesList = document.getElementById('packagesList');
        if (!packagesList) return;

        packagesList.innerHTML = '';

        this.packages.forEach(pkg => {
            const packageItem = document.createElement('div');
            packageItem.className = `package-item ${pkg.installed ? 'installed' : ''}`;
            packageItem.dataset.packageName = pkg.name;

            packageItem.innerHTML = `
                <div class="package-icon">${pkg.icon}</div>
                <div class="package-info">
                    <div class="package-name">${pkg.name}</div>
                    <div class="package-description">${pkg.description}</div>
                </div>
                <div class="package-status ${pkg.installed ? 'status-installed' : 'status-available'}">
                    ${pkg.installed ? 'Installed' : 'Available'}
                </div>
            `;

            packageItem.addEventListener('click', () => this.selectPackage(pkg.name));
            packagesList.appendChild(packageItem);
        });
    }

    private filterPackages(searchTerm: string): void {
        const packages = document.querySelectorAll('.package-item');
        const term = searchTerm.toLowerCase();

        packages.forEach(item => {
            const packageName = item.getAttribute('data-package-name')?.toLowerCase() || '';
            const packageDesc = item.querySelector('.package-description')?.textContent?.toLowerCase() || '';

            if (packageName.includes(term) || packageDesc.includes(term)) {
                (item as HTMLElement).style.display = 'flex';
            } else {
                (item as HTMLElement).style.display = 'none';
            }
        });
    }

    private selectPackage(packageName: string): void {
        document.querySelectorAll('.package-item').forEach(item => {
            item.classList.remove('selected');
        });

        const selectedItem = document.querySelector(`[data-package-name="${packageName}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
            this.selectedPackage = packageName;
            this.updateButtonStates();
        }
    }

    private updateButtonStates(): void {
        const installBtn = document.getElementById('installBtn') as HTMLButtonElement;
        const removeBtn = document.getElementById('removeBtn') as HTMLButtonElement;

        if (this.selectedPackage) {
            const pkg = this.packages.find(p => p.name === this.selectedPackage);
            if (installBtn) installBtn.disabled = pkg?.installed || false;
            if (removeBtn) removeBtn.disabled = !pkg?.installed;
        } else {
            if (installBtn) installBtn.disabled = true;
            if (removeBtn) removeBtn.disabled = true;
        }
    }

    private installPackage(): void {
        if (!this.selectedPackage) return;

        const pkg = this.packages.find(p => p.name === this.selectedPackage);
        if (!pkg || pkg.installed) return;

        const installOutput = formatOutput([
            `sudo apt install ${this.selectedPackage}`,
            'Reading package lists... Done',
            'Building dependency tree... Done',
            'Reading state information... Done',
            'The following NEW packages will be installed:',
            `  ${this.selectedPackage}`,
            '0 upgraded, 1 newly installed, 0 to remove and 0 not upgraded.',
            'Need to get 0 B/2.5 MB of archives.',
            'After this operation, 5.2 MB of additional disk space will be used.',
            `Get:1 http://archive.ubuntu.com/ubuntu focal/main amd64 ${this.selectedPackage} amd64 1.0-1 [2.5 MB]`,
            'Fetched 2.5 MB in 2s (1,250 kB/s)',
            `Selecting previously unselected package ${this.selectedPackage}.`,
            '(Reading database ... 185,000 files and directories currently installed.)',
            `Preparing to unpack .../${this.selectedPackage}_1.0-1_amd64.deb ...`,
            `Unpacking ${this.selectedPackage} (1.0-1) ...`,
            `Setting up ${this.selectedPackage} (1.0-1) ...`,
            'Processing triggers for man-db (2.9.1-1) ...',
            `✓ ${this.selectedPackage} successfully installed!`
        ]);

        this.addTerminalOutput(installOutput);

        pkg.installed = true;
        this.renderPackages();
        this.updateButtonStates();
    }

    private removePackage(): void {
        if (!this.selectedPackage) return;

        const pkg = this.packages.find(p => p.name === this.selectedPackage);
        if (!pkg || !pkg.installed) return;

        const removeOutput = formatOutput([
            `sudo apt remove ${this.selectedPackage}`,
            'Reading package lists... Done',
            'Building dependency tree... Done',
            'Reading state information... Done',
            'The following packages will be REMOVED:',
            `  ${this.selectedPackage}`,
            '0 upgraded, 0 newly installed, 1 to remove and 0 not upgraded.',
            'After this operation, 5.2 MB disk space will be freed.',
            '(Reading database ... 185,001 files and directories currently installed.)',
            `Removing ${this.selectedPackage} (1.0-1) ...`,
            'Processing triggers for man-db (2.9.1-1) ...',
            `✓ ${this.selectedPackage} successfully removed!`
        ]);

        this.addTerminalOutput(removeOutput);

        pkg.installed = false;
        this.renderPackages();
        this.updateButtonStates();
    }

    private updatePackageList(): void {
        const updateOutput = formatOutput([
            'sudo apt update',
            'Hit:1 http://archive.ubuntu.com/ubuntu focal InRelease',
            'Hit:2 http://archive.ubuntu.com/ubuntu focal-updates InRelease',
            'Hit:3 http://archive.ubuntu.com/ubuntu focal-backports InRelease',
            'Hit:4 http://security.ubuntu.com/ubuntu focal-security InRelease',
            'Reading package lists... Done',
            'Building dependency tree... Done',
            'Reading state information... Done',
            'All packages are up to date.',
            '✓ Package list updated successfully!'
        ]);

        this.addTerminalOutput(updateOutput);
    }

    private setupTerminalInput(): void {
        const terminalContent = document.getElementById('terminalContent');
        if (terminalContent) {
            terminalContent.removeEventListener('keydown', this.boundHandleKeyDown);
            terminalContent.addEventListener('keydown', this.boundHandleKeyDown);
        }
    }

    private handleKeyDown = (e: KeyboardEvent): void => {
        const terminalContent = document.getElementById('terminalContent');
        if (!terminalContent) return;

        const currentLine = terminalContent.querySelector('.terminal-line:last-child');
        if (!currentLine) return;

        const cursor = currentLine.querySelector('.cursor') as HTMLElement;
        if (!cursor) return;

        if (e.key === 'Enter') {
            e.preventDefault();
            if (e.repeat || this.isExecutingCommand) return;

            this.isExecutingCommand = true;

            const existingCommandSpan = currentLine.querySelector('.command') as HTMLElement;
            if (existingCommandSpan) {
                cursor.remove();
            } else {
                const commandSpan = document.createElement('span');
                commandSpan.className = 'command';
                commandSpan.textContent = this.currentInput;
                cursor.parentNode?.replaceChild(commandSpan, cursor);
            }

            const output = this.executeCommand(this.currentInput);
            this.addTerminalOutput(output);

            if (this.currentInput.trim()) {
                this.commandHistory.push(this.currentInput);
                this.historyIndex = this.commandHistory.length;
            }

            this.currentInput = '';
            this.isExecutingCommand = false;

        } else if (e.key === 'Backspace') {
            e.preventDefault();
            if (this.currentInput.length > 0) {
                this.currentInput = this.currentInput.slice(0, -1);
                this.updateCurrentLine();
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (this.historyIndex > 0) {
                this.historyIndex--;
                this.currentInput = this.commandHistory[this.historyIndex] ?? '';
                this.updateCurrentLine();
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (this.historyIndex < this.commandHistory.length - 1) {
                this.historyIndex++;
                this.currentInput = this.commandHistory[this.historyIndex] ?? '';
                this.updateCurrentLine();
            } else if (this.historyIndex === this.commandHistory.length - 1) {
                this.historyIndex = this.commandHistory.length;
                this.currentInput = '';
                this.updateCurrentLine();
            }
        } else if (e.key.length === 1) {
            this.currentInput += e.key;
            this.updateCurrentLine();
        }
    };

    private updateCurrentLine(): void {
        const terminalContent = document.getElementById('terminalContent');
        if (!terminalContent) return;

        const currentLine = terminalContent.querySelector('.terminal-line:last-child');
        if (!currentLine) return;

        const commandSpan = currentLine.querySelector('.command') as HTMLElement;
        const cursor = currentLine.querySelector('.cursor') as HTMLElement;

        if (commandSpan) {
            commandSpan.textContent = this.currentInput;
        } else if (cursor) {
            const newCommandSpan = document.createElement('span');
            newCommandSpan.className = 'command';
            newCommandSpan.textContent = this.currentInput;
            cursor.parentNode?.insertBefore(newCommandSpan, cursor);
        }
    }

    private executeCommand(input: string): string {
        const parts = input.trim().split(' ');
        const command = parts[0]?.toLowerCase() ?? '';
        const args = parts.slice(1);

        if (this.commands[command]) {
            return this.commands[command](args);
        } else if (command === '') {
            return '';
        } else {
            return `Command not found: ${command}. Type 'help' for available commands.`;
        }
    }

    private addTerminalOutput(text: string): void {
        const terminalContent = document.getElementById('terminalContent');
        if (!terminalContent) return;

        const outputDiv = document.createElement('div');
        outputDiv.className = 'terminal-output';
        outputDiv.textContent = text;
        terminalContent.appendChild(outputDiv);

        const lastLine = terminalContent.querySelector('.terminal-line:last-child');
        if (lastLine) {
            const cursor = lastLine.querySelector('.cursor');
            if (cursor) {
                cursor.remove();
            }
        }

        const newLine = document.createElement('div');
        newLine.className = 'terminal-line';
        newLine.innerHTML = `
            <span class="prompt">user@ubuntu:~$</span>
            <span class="cursor">_</span>
        `;
        terminalContent.appendChild(newLine);
        terminalContent.scrollTop = terminalContent.scrollHeight;
    }

    private revealSecretMessage(): void {
        this.puzzleSolved = true;
        const secretMessageElement = document.getElementById('secretMessage');
        const overlay = document.getElementById('overlay');
        const messageReveal = document.getElementById('messageReveal');

        if (secretMessageElement) {
            secretMessageElement.textContent = this.secretMessage;
        }
        if (overlay) {
            overlay.style.display = 'block';
        }
        if (messageReveal) {
            messageReveal.style.display = 'block';
        }
    }
}

// Global function for closing the message
function closeMessage(): void {
    const overlay = document.getElementById('overlay');
    const messageReveal = document.getElementById('messageReveal');

    if (overlay) {
        overlay.style.display = 'none';
    }
    if (messageReveal) {
        messageReveal.style.display = 'none';
    }
}

// Make closeMessage available globally
(window as any).closeMessage = closeMessage;

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PackageHuntGame();
});


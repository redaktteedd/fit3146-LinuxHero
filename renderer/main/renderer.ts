// Terminal-like renderer process TypeScript
interface TerminalCommand {
    (args: string[]): string;
}

interface TerminalCommands {
    [key: string]: TerminalCommand;
}

class TerminalApp {
    private terminalContent: HTMLElement | null;
    private terminalBody: HTMLElement | null;
    private currentInput: string = '';
    private commandHistory: string[] = [];
    private historyIndex: number = -1;
    
    // Math puzzle state
    private mathPuzzle: { question: string; answer: number } | null = null;
    private puzzleSolved: boolean = false;
    
    private commands: TerminalCommands = {
        help: () => 'Available commands:\n  help - Show this help message\n  clear - Clear the terminal\n  echo <text> - Echo text\n  date - Show current date\n  whoami - Show current user\n  ls - List files\n  pwd - Show current directory\n  puzzle - Start a math puzzle\n  solve <answer> - Submit your puzzle answer',
        clear: () => {
            if (this.terminalContent) {
                this.terminalContent.innerHTML = '';
            }
            return '';
        },
        echo: (args: string[]) => args.join(' '),
        date: () => new Date().toString(),
        whoami: () => 'user',
        ls: () => 'total 8\ndrwxr-xr-x  2 user user 4096 Jan  1 12:00 .\ndrwxr-xr-x  3 user user 4096 Jan  1 12:00 ..\n-rw-r--r--  1 user user  220 Jan  1 12:00 .bashrc\n-rw-r--r--  1 user user 3526 Jan  1 12:00 .bash_history',
        pwd: () => '/home/user',
        puzzle: () => this.startPuzzle(),
        solve: (args: string[]) => this.solvePuzzle(args)
    };

    constructor() {
        this.terminalContent = document.querySelector('.terminal-content');
        this.terminalBody = document.querySelector('.terminal-body');
    }

    public init(): void {
        if (!this.terminalContent || !this.terminalBody) {
            console.error('Terminal elements not found');
            return;
        }


        
        // Add initial prompt
        this.addPrompt();
        
        this.terminalBody.tabIndex = 0;
        this.terminalBody.style.outline = 'none';
        
        this.terminalBody.addEventListener('click', () => {
            this.terminalBody?.focus();
        });
        
        setTimeout(() => {
            this.terminalBody?.focus();
        }, 100);
        
        document.title = 'Terminal App - Ready!';
    }

    private startPuzzle(): string {
        const num1 = Math.floor(Math.random() * 20) + 1;
        const num2 = Math.floor(Math.random() * 20) + 1;
        const operators = ['+', '-', '*'];
        const operator = operators[Math.floor(Math.random() * operators.length)];
        
        let answer: number;
        switch (operator) {
            case '+':
                answer = num1 + num2;
                break;
            case '-':
                answer = num1 - num2;
                break;
            case '*':
                answer = num1 * num2;
                break;
            default:
                answer = 0;
        }
        
        this.mathPuzzle = {
            question: `What is ${num1} ${operator} ${num2}?`,
            answer: answer
        };
        
        this.displayPuzzleBox(this.mathPuzzle.question);
        return '';
    }
    
    private displayPuzzleBox(question: string): void {
        if (!this.terminalContent) return;
        
        const puzzleBox = document.createElement('div');
        puzzleBox.className = 'puzzle-box';
        puzzleBox.innerHTML = `
            <div class="puzzle-title">Loading...</div>
            <div class="puzzle-question">${question}</div>
            <div class="puzzle-hint">Use: solve &lt;answer&gt;</div>
        `;
        this.terminalContent.appendChild(puzzleBox);
        this.scrollToBottom();
        
        this.loadPuzzleTitle(puzzleBox);
    }
    
    private async loadPuzzleTitle(puzzleBox: HTMLElement): Promise<void> {
        const titleElement = puzzleBox.querySelector('.puzzle-title');
        if (!titleElement) return;
        
        try {
            const response = await fetch('../../assets/txt/math-puzzle.txt');
            const asciiArt = await response.text();
            titleElement.textContent = asciiArt;
        } catch (error) {
            console.error('Failed to load puzzle title:', error);
            titleElement.textContent = 'MATH PUZZLE';
        }
    }

    private solvePuzzle(args: string[]): string {
        if (!this.mathPuzzle) {
            return 'No puzzle is active! Type "puzzle" to start one.';
        }
        
        if (args.length === 0 || !args[0]) {
            return 'Usage: solve <answer>\nExample: solve 42';
        }
        
        const userAnswer = parseInt(args[0]);
        
        if (isNaN(userAnswer)) {
            return 'Please provide a valid number.\nUsage: solve <answer>';
        }
        
        if (userAnswer === this.mathPuzzle.answer) {
            this.puzzleSolved = true;
            this.mathPuzzle = null;
            setTimeout(() => {
                window.location.href = '../page2/index.html';
            }, 1500);
            return '✓ Correct! Well done!\nRedirecting to next page...';
        } else {
            const correctAnswer = this.mathPuzzle.answer;
            this.mathPuzzle = null;
            return `✗ Wrong! The answer was ${correctAnswer}.\nType "puzzle" to try again!`;
        }
    }

    private createPrompt(): HTMLElement {
        const promptLine = document.createElement('div');
        promptLine.className = 'terminal-line';
        promptLine.innerHTML = `
            <span class="prompt">user@computer:~$</span>
            <span class="cursor">_</span>
        `;
        return promptLine;
    }

    private addPrompt(): void {
        if (!this.terminalContent) return;
        
        const promptLine = this.createPrompt();
        this.terminalContent.appendChild(promptLine);
        this.scrollToBottom();
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

    private addOutput(text: string): void {
        if (!text || !this.terminalContent) return;
        
        const outputDiv = document.createElement('div');
        outputDiv.className = 'terminal-output';
        outputDiv.textContent = text;
        this.terminalContent.appendChild(outputDiv);
    }

    private scrollToBottom(): void {
        if (this.terminalBody) {
            this.terminalBody.scrollTop = this.terminalBody.scrollHeight;
        }
    }

    private updateCurrentLine(): void {
        const currentLine = document.querySelector('.terminal-line:last-child');
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

    private handleKeyDown = (e: KeyboardEvent): void => {
        const currentLine = document.querySelector('.terminal-line:last-child');
        if (!currentLine) return;
        
        const cursor = currentLine.querySelector('.cursor') as HTMLElement;
        if (!cursor) return;
        
        if (e.key === 'Enter') {
            e.preventDefault();
            
            const commandSpan = document.createElement('span');
            commandSpan.className = 'command';
            commandSpan.textContent = this.currentInput;
            cursor.parentNode?.replaceChild(commandSpan, cursor);
            
            const output = this.executeCommand(this.currentInput);
            this.addOutput(output);
            
            if (this.currentInput.trim()) {
                this.commandHistory.push(this.currentInput);
                this.historyIndex = this.commandHistory.length;
            }
            
            this.currentInput = '';
            this.addPrompt();
            
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

    public start(): void {
        document.addEventListener('keydown', this.handleKeyDown);
    }

    public stop(): void {
        document.removeEventListener('keydown', this.handleKeyDown);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const terminalApp = new TerminalApp();
    terminalApp.init();
    terminalApp.start();
});

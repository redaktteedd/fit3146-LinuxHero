import { loadReadPuzzle, Puzzle } from "../common/puzzles.js";

// Terminal-like renderer process TypeScript
interface TerminalCommand {
    (args: string[]): string;
}

interface TerminalCommands {
    [key: string]: TerminalCommand;
}

export class TerminalApp {
    public terminalContent: HTMLElement | null;
    private terminalBody: HTMLElement | null;
    private currentInput: string = '';
    private commandHistory: string[] = [];
    private historyIndex: number = -1;
    private eventListenerAdded: boolean = false;
    
    private puzzleSolved: boolean = false;
    private activatePuzzle: Puzzle | null = null;
    
    private commands: TerminalCommands = {
        help: () => 'Available commands:\n  help - Show this help message\n  clear - Clear the terminal\n  echo <text> - Echo text\n  date - Show current date\n  whoami - Show current user\n  ls - List files\n  pwd - Show current directory\n  cat <filename> - Read a file\n  play - Show Terminal Challenge menu\n  puzzle - Start a puzzle\n  solve <answer> - Submit your puzzle answer\n  rpg - Start a RPG game\n  commandrace - Start a command race game\n  notes - List all notes\n  note <title> - Create or edit a note\n  rmnote <title> - Delete a note\n\nShell shortcuts:\n  Ctrl+A - Move to beginning of line\n  Ctrl+E - Move to end of line\n  Ctrl+K - Delete to end of line\n  Ctrl+U - Delete to beginning of line\n  Ctrl+W - Delete previous word\n  Ctrl+C - Interrupt command\n  Ctrl+D - Exit (on empty line)\n  Ctrl+L - Clear screen\n  Ctrl+R - Reverse search history\n  Ctrl+T - Transpose characters',
        clear: () => {
            if (this.terminalContent) {
                this.terminalContent.innerHTML = '';
            }
            return '';
        },
        cat: (args: string[]) => {
            if(!this.activatePuzzle) {
                return 'No puzzle is active! Type "puzzle" to start one.';
            }
            if (args.length === 0) {
                return 'cat: missing file operand\nTry "ls" to see available files.';
            }
            const filename = args[0];
            const file = this.activatePuzzle.files.find(f => f.name === filename);  
            if (file) {
                return file.content;
            } else {
                return `cat: ${filename}: No such file or directory`;
            }
        },
        echo: (args: string[]) => args.join(' '),
        date: () => new Date().toString(),
        whoami: () => 'user',
        ls: () => {
            if (!this.activatePuzzle) {
                return 'total 8\ndrwxr-xr-x  2 user user 4096 Jan  1 12:00 .\ndrwxr-xr-x  3 user user 4096 Jan  1 12:00 ..\n-rw-r--r--  1 user user  220 Jan  1 12:00 .bashrc\n-rw-r--r--  1 user user 3526 Jan  1 12:00 .bash_history';
            }
            let output = 'total ' + (this.activatePuzzle.files.length * 4) + '\n';
            output += 'drwxr-xr-x  2 user user 4096 Jan  1 12:00 .\n';
            output += 'drwxr-xr-x  3 user user 4096 Jan  1 12:00 ..\n';
            this.activatePuzzle.files.forEach(file => {
                output += `-rw-r--r--  1 user user  ${file.content.length.toString().padStart(4)} Jan  1 12:00 ${file.name}\n`;
            });
            return output;
        },
        pwd: () => '/home/user',
        puzzle: () => this.startPuzzle(),
        rpg: () => this.startRPG(),
        commandrace: () => this.startCommandRace(),
        quit: () => this.handleQuit(),
        solve: (args: string[]) => this.solvePuzzle(args),
        notes: () => this.listNotes(),
        note: (args: string[]) => this.editNote(args),
        rmnote: (args: string[]) => this.deleteNoteTerminal(args),
        play: () => this.showTerminalChallenge()
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
        // Don't show welcome message immediately - wait for start menu selection
        // this.showWelcomeMessage();
        
        // Remove tabIndex to prevent Tab key interference
        // this.terminalBody.tabIndex = 0;
        this.terminalBody.style.outline = 'none';
        
        // Optimized event handling for Orange Pi
        this.terminalBody.addEventListener('click', () => {
            this.terminalBody?.focus();
        });
        
        // Immediate focus - no timeout for Orange Pi
            this.terminalBody?.focus();
        
        document.title = 'Linux App - Ready!';
    }

    public initTerminal(): void {
        // Show welcome message when terminal is selected from start menu
        this.showWelcomeMessage();
    }

    private showWelcomeMessage(): void {
        this.addOutput('🐧 Welcome to Linux Hero! 🐧');
        this.addOutput('');
        this.addOutput('This is your Linux learning terminal. Here you can:');
        this.addOutput('');
        this.addOutput('📚 Learn Linux commands and concepts');
        this.addOutput('🎮 Play interactive games (puzzle, rpg, commandrace)');
        this.addOutput('📝 Take notes and manage your learning');
        this.addOutput('💻 Practice real Linux commands');
        this.addOutput('');
        this.addOutput('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.addOutput('');
        this.addOutput('Quick Start Commands:');
        this.addOutput('  help        - Show all available commands');
        this.addOutput('  play        - Show Terminal Challenge menu');
        this.addOutput('  notes       - View your saved notes');
        this.addOutput('');
        this.addOutput('');
        this.addOutput('Ready to start your Linux journey? Type any command!');
        this.addOutput('');
        
        // Add the first prompt after welcome message
        this.addPrompt();
    }

    public showTerminalChallenge(): string {
        // Clear the terminal first
        if (this.terminalContent) {
            this.terminalContent.innerHTML = '';
        }
        
        this.addOutput('╔══════════════════════════════════════════════════════════════╗');
        this.addOutput('║                 Welcome to the Terminal Challenge!           ║');
        this.addOutput('╚══════════════════════════════════════════════════════════════╝');
        this.addOutput('');
        this.addOutput('Ready to test your skills?');
        this.addOutput('Type \'puzzle\' to start terminal puzzle game!');
        this.addOutput('Type \'rpg\' to start terminal rpg game!');
        this.addOutput('Type \'commandrace\' to start terminal command race game!');
        this.addOutput('Type \'help\' for available commands.');
        this.addOutput('Type \'quit\' to go back.');
        this.addOutput('');
        
        return '';
    }

    private startPuzzle(): string {
        if (this.activatePuzzle) {
            return 'A puzzle is already active! Use "solve <answer>" to submit your answer or "quit" to exit.';
        }
        
        loadReadPuzzle().then(puzzle => {
            this.activatePuzzle = puzzle;
            this.displayPuzzleBox(puzzle.description);
        }).catch(error => {
            console.error('Failed to load puzzle:', error);
        });
        
        return 'Loading puzzle...\nPlease wait...';
    }

    private startRPG(): string {
        if ((window as any).rpgMode) {
            return 'RPG mode is already active! Type "quit" to exit RPG mode.';
        }
        
        // Initialize RPG mode
        rpgMode = true;
        (window as any).rpgMode = true;
        rpgHealth = 100;
        rpgLevel = 1;
        rpgXp = 0;
        rpgLocation = '/home/wizard';
        
        // Show RPG intro
        this.addOutput('🎮 TERMINAL RPG STARTED! 🎮');
        this.addOutput('');
        this.addOutput('You are a Linux wizard on a magical adventure!');
        this.addOutput('Use Linux commands to explore, fight monsters, and level up!');
        this.addOutput('');
        this.addOutput('Type "help" to see available commands');
        this.addOutput('Type "status" to see your stats');
        this.addOutput('Type "quit" to exit RPG mode');
        this.addOutput('');
        this.addOutput('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.addOutput('');
        this.addOutput('Welcome to Terminal RPG! You are a Linux wizard. Type "help" to see available commands.');
        this.addOutput(`Location: ${rpgLocation}`);
        this.addOutput(`Health: ${rpgHealth} | Level: ${rpgLevel} | XP: ${rpgXp}`);
        
        // Add a new prompt for input
        this.addPrompt();
        
        return '';
    }

    private startCommandRace(): string {
        if ((window as any).commandRaceMode) {
            return 'Command Race is already active! Type "quit" to exit Command Race mode.';
        }
        
        // Initialize Command Race mode
        commandRaceMode = true;
        (window as any).commandRaceMode = true;
        
        // Select random text
        const randomIndex = Math.floor(Math.random() * commandRaceTexts.length);
        commandRaceCurrentText = commandRaceTexts[randomIndex] || 'ls -la';
        
        // Show Command Race intro
        this.addOutput('🏃‍♂️ COMMAND RACE! 🏃‍♂️');
        this.addOutput('');
        this.addOutput('Welcome to Command Race! Type commands as fast as you can!');
        this.addOutput('Your typing speed will be measured in WPM (Words Per Minute)');
        this.addOutput('');
        this.addOutput('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.addOutput('');
        this.addOutput('Commands:');
        this.addOutput('  start  - Begin the race with countdown');
        this.addOutput('  quit   - Exit Command Race mode');
        this.addOutput('');
        this.addOutput('Type "start" when you are ready to begin!');
        
        // Add a new prompt for input
        this.addPrompt();
        
        return '';
    }

    private quitPuzzle(): string {
        if (!this.activatePuzzle) {
            return 'No puzzle is currently active. Type "puzzle" to start a puzzle game.';
        }
        
        // Clear the puzzle
        this.activatePuzzle = null;
        
        // Remove any puzzle boxes from the terminal
        const puzzleBoxes = this.terminalContent?.querySelectorAll('.puzzle-box');
        puzzleBoxes?.forEach(box => box.remove());
        
        this.addOutput('Puzzle game ended. Returning to Terminal Challenge...');
        
        // Return to Terminal Challenge
        return this.showTerminalChallenge();
    }

    private quitToWelcome(): string {
        // Clear the terminal
        if (this.terminalContent) {
            this.terminalContent.innerHTML = '';
        }
        
        // Show welcome message
        this.showWelcomeMessage();
        
        return '';
    }

    private handleQuit(): string {
        // Check if we're in any game mode
        if (this.activatePuzzle || (window as any).rpgMode || (window as any).commandRaceMode) {
            // Quit from game - return to Terminal Challenge
            return this.quitToTerminalChallenge();
        } else {
            // Not in game mode - return to welcome message
            return this.quitToWelcome();
        }
    }

    private quitToTerminalChallenge(): string {
        // Clear any active game states
        this.activatePuzzle = null;
        (window as any).rpgMode = false;
        (window as any).commandRaceMode = false;
        
        // Clear the terminal
        if (this.terminalContent) {
            this.terminalContent.innerHTML = '';
        }
        
        // Show Terminal Challenge
        return this.showTerminalChallenge();
    }

    private listNotes(): string {
        if (notes.length === 0) {
            return 'No notes found. Use "note <title>" to create a new note.';
        }

        let output = 'Notes:\n';
        output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        
        notes.forEach((note, index) => {
            const date = note.updatedAt.toLocaleDateString();
            const preview = note.content.substring(0, 50) + (note.content.length > 50 ? '...' : '');
            output += `${(index + 1).toString().padStart(2)}. ${note.title}\n`;
            output += `    ${preview}\n`;
            output += `    Modified: ${date}\n\n`;
        });
        
        output += 'Use "note <title>" to edit a note or "rmnote <title>" to delete.';
        return output;
    }

    private editNote(args: string[]): string {
        if (args.length === 0) {
            return 'Usage: note <title>\nExample: note "My Linux Commands"';
        }

        const title = args.join(' ');
        let note = notes.find(n => n.title.toLowerCase() === title.toLowerCase());
        
        if (!note) {
            // Create new note
            note = {
                id: Date.now().toString(),
                title: title,
                content: '',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            notes.unshift(note);
            saveNotes();
            renderNotesList(); // Update GUI Notes tab
        }

        // Start terminal-based note editing
        this.startTerminalNoteEdit(note);
        return '';
    }

    private deleteNoteTerminal(args: string[]): string {
        if (args.length === 0) {
            return 'Usage: rmnote <title>\nExample: rmnote "My Linux Commands"';
        }

        const title = args.join(' ');
        const noteIndex = notes.findIndex(n => n.title.toLowerCase() === title.toLowerCase());
        
        if (noteIndex === -1) {
            return `Note "${title}" not found.`;
        }

        const note = notes[noteIndex];
        if (!note) {
            return `Note "${title}" not found.`;
        }
        
        notes.splice(noteIndex, 1);
        saveNotes();
        renderNotesList(); // Update GUI Notes tab
        
        return `Note "${note.title}" deleted successfully.`;
    }

    private startTerminalNoteEdit(note: Note): void {
        this.addOutput(`Editing note: "${note.title}"`);
        this.addOutput('Type your content below. Use "save" to save and exit, or "cancel" to discard changes.');
        this.addOutput('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.addOutput('');
        
        // Show current content
        if (note.content) {
            this.addOutput(note.content);
            this.addOutput('');
        }
        
        this.addOutput('Enter your note content:');
        
        // Set up note editing mode
        (window as any).noteEditMode = true;
        (window as any).currentEditingNote = note;
        (window as any).noteContentBuffer = note.content;
    }

    private handleNoteEditCommand(input: string): string {
        const command = input.toLowerCase().trim();
        
        if (command === 'save') {
            // Save the note
            const note = (window as any).currentEditingNote as Note;
            const content = (window as any).noteContentBuffer as string;
            
            if (note) {
                note.content = content;
                note.updatedAt = new Date();
                saveNotes();
                renderNotesList(); // Update GUI Notes tab
                
                // Exit note editing mode
                (window as any).noteEditMode = false;
                (window as any).currentEditingNote = null;
                (window as any).noteContentBuffer = '';
                
                return `Note "${note.title}" saved successfully.`;
            }
        } else if (command === 'cancel') {
            // Cancel editing without saving
            const note = (window as any).currentEditingNote as Note;
            
            // Exit note editing mode
            (window as any).noteEditMode = false;
            (window as any).currentEditingNote = null;
            (window as any).noteContentBuffer = '';
            
            return `Note editing cancelled.`;
        } else {
            // Add content to the note buffer
            const currentBuffer = (window as any).noteContentBuffer as string;
            (window as any).noteContentBuffer = currentBuffer + input + '\n';
            
            // Show the content being added
            this.addOutput(input);
            return '';
        }
        
        return '';
    }
    
    private displayPuzzleBox(question: string): void {
        if (!this.terminalContent) return;
        
        const puzzleBox = document.createElement('div');
        puzzleBox.className = 'puzzle-box';
        puzzleBox.innerHTML = `
            <div class="puzzle-title">Loading...</div>
            <div class="puzzle-question">${question}</div>
            <div class="puzzle-hint">Use: solve &lt;answer&gt; or quit to exit</div>
        `;
        
        const lastLine = this.terminalContent.querySelector('.terminal-line:last-child');
        if (lastLine) {
            this.terminalContent.insertBefore(puzzleBox, lastLine);
        } else {
            this.terminalContent.appendChild(puzzleBox);
        }
        
        this.scrollToBottom();
        
        this.loadPuzzleTitle(puzzleBox);
    }
    
    private async loadPuzzleTitle(puzzleBox: HTMLElement): Promise<void> {
        const titleElement = puzzleBox.querySelector('.puzzle-title');
        if (!titleElement) return;
        
        try {
            const response = await fetch(`file://${process.cwd()}/assets/txt/math-puzzle.txt`);
            const asciiArt = await response.text();
            titleElement.textContent = asciiArt;
        } catch (error) {
            console.error('Failed to load puzzle title:', error);
            titleElement.textContent = 'MATH PUZZLE';
        }
    }

    private solvePuzzle(args: string[]): string {
        if (!this.activatePuzzle) {
            return 'No puzzle is active! Type "puzzle" to start one.';
        }
        
        if (args.length === 0) {
            return 'Usage: solve <answer>\nExample: solve FIT3146SECRET';
        }
        
        const userAnswer = args.join(' ');
        const correctAnswer = this.activatePuzzle.solution.join('');
        
        if (userAnswer.toUpperCase() === correctAnswer.toUpperCase()) {
            this.puzzleSolved = true;
            const solvedPuzzle = this.activatePuzzle;
            this.activatePuzzle = null;
            setTimeout(() => {
                window.location.href = '../page2/index.html';
            }, 1500);
            return '✓ Correct! Well done!\nRedirecting to next page...';
        } else {
            return `✗ Wrong! Try reading all the clue files carefully.\nHint: Combine the parts you find in the correct order.`;
        }
    }

    private createPrompt(): HTMLElement {
        const promptLine = document.createElement('div');
        promptLine.className = 'terminal-line';
        promptLine.innerHTML = '<span class="prompt">user@computer:~$</span><span class="cursor">_</span>';
        return promptLine;
    }

    public addPrompt(): void {
        if (!this.terminalContent) return;
        
        const promptLine = this.createPrompt();
        this.terminalContent.appendChild(promptLine);
        this.scrollToBottom();
    }

    public executeCommand(input: string): string {
        // Check if RPG mode is active
        if (rpgMode) {
            processRpgCommand(input);
            return ''; // RPG commands don't return text, they use addOutput directly
        }
        
        // Check if Command Race mode is active
        if ((window as any).commandRaceMode) {
            processCommandRaceCommand(input);
            return ''; // Command Race commands don't return text, they use addOutput directly
        }
        
        // Check if note editing mode is active
        if ((window as any).noteEditMode) {
            return this.handleNoteEditCommand(input);
        }
        
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

    public addOutput(text: string): void {
        if (!text || !this.terminalContent) return;
        
        const outputDiv = document.createElement('div');
        outputDiv.className = 'terminal-output';
        outputDiv.textContent = text;
        this.terminalContent.appendChild(outputDiv);
        
        // Performance optimization for Orange Pi - limit terminal history
        if (this.terminalContent) {
            const outputs = this.terminalContent.querySelectorAll('.terminal-output');
            if (outputs.length > 50 && outputs[0]) {
                outputs[0].remove();
            }
        }
    }

    public clearTerminal(): void {
        if (this.terminalContent) {
            this.terminalContent.innerHTML = '';
            this.createPrompt();
        }
    }

    private scrollToBottom(): void {
        if (this.terminalBody) {
            // Optimized scrolling for Orange Pi - use requestAnimationFrame
            requestAnimationFrame(() => {
        if (this.terminalBody) {
            this.terminalBody.scrollTop = this.terminalBody.scrollHeight;
                }
            });
        }
    }

    private updateCurrentLine(): void {
        const currentLine = document.querySelector('.terminal-line:last-child');
        if (!currentLine) return;
        
        // Simple innerHTML update - more efficient for Orange Pi
        currentLine.innerHTML = `<span class="prompt">user@computer:~$</span><span class="command">${this.currentInput}</span><span class="cursor">_</span>`;
    }

    private handleKeyDown = (e: KeyboardEvent): void => {
        // Only prevent default for terminal body, not for special modes
        const target = e.target as HTMLElement;
        
        // Don't interfere with notes textarea or other form elements
        if (target.classList.contains('note-content') || target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
            return;
        }
        
        // If RPG mode is active, handle Enter key but let other keys pass through
        if ((window as any).rpgMode) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const currentLine = document.querySelector('.terminal-line:last-child');
                if (currentLine) {
                    const cursor = currentLine.querySelector('.cursor');
                    if (cursor) {
                        cursor.remove();
                    }
                }
                
                const output = this.executeCommand(this.currentInput);
                this.addOutput(output);
                
                if (this.currentInput.trim()) {
                    this.commandHistory.push(this.currentInput);
                    this.historyIndex = this.commandHistory.length;
                }
                
                this.currentInput = '';
                this.addPrompt();
            } else {
                // Capture typed characters for RPG mode
                if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                    // Handle all printable characters (letters, numbers, symbols, spaces)
                    this.currentInput += e.key;
                    this.updateCurrentLine();
                } else if (e.key === 'Backspace') {
                    if (this.currentInput.length > 0) {
                        this.currentInput = this.currentInput.slice(0, -1);
                        this.updateCurrentLine();
                    }
                }
            }
            return; // Let other keys pass through naturally
        }
        
        // If Command Race mode is active, handle Enter key but let other keys pass through
        if ((window as any).commandRaceMode) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const currentLine = document.querySelector('.terminal-line:last-child');
                if (currentLine) {
                    const cursor = currentLine.querySelector('.cursor');
                    if (cursor) {
                        cursor.remove();
                    }
                }
                
                const output = this.executeCommand(this.currentInput);
                this.addOutput(output);
                
                if (this.currentInput.trim()) {
                    this.commandHistory.push(this.currentInput);
                    this.historyIndex = this.commandHistory.length;
                }
                
                // Don't add prompt if the command was 'start' (countdown will begin)
                const command = this.currentInput.toLowerCase().trim();
                this.currentInput = '';
                
                if (command !== 'start') {
                    this.addPrompt();
                }
            } else {
                // Capture typed characters for Command Race mode
                if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                    // Handle all printable characters (letters, numbers, symbols, spaces)
                    this.currentInput += e.key;
                    this.updateCurrentLine();
                } else if (e.key === 'Backspace') {
                    if (this.currentInput.length > 0) {
                        this.currentInput = this.currentInput.slice(0, -1);
                        this.updateCurrentLine();
                    }
                }
            }
            return; // Let other keys pass through naturally
        }
        
        // If note editing mode is active, handle Enter key but let other keys pass through
        if ((window as any).noteEditMode) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const currentLine = document.querySelector('.terminal-line:last-child');
                if (currentLine) {
                    const cursor = currentLine.querySelector('.cursor');
                    if (cursor) {
                        cursor.remove();
                    }
                }
                
                const output = this.executeCommand(this.currentInput);
                this.addOutput(output);
                
                if (this.currentInput.trim()) {
                    this.commandHistory.push(this.currentInput);
                    this.historyIndex = this.commandHistory.length;
                }
                
                this.currentInput = '';
                this.addPrompt();
            } else {
                // Capture typed characters for note editing mode
                if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                    // Handle all printable characters (letters, numbers, symbols, spaces)
                    this.currentInput += e.key;
                    this.updateCurrentLine();
                } else if (e.key === 'Backspace') {
                    if (this.currentInput.length > 0) {
                        this.currentInput = this.currentInput.slice(0, -1);
                        this.updateCurrentLine();
                    }
                }
            }
            return; // Let other keys pass through naturally
        }
        
        // Tab key highlights sections
        if (e.key === 'Tab') {
            console.log('Tab key detected!');
            e.preventDefault();
            this.highlightNextSection();
            return;
        }
        
        // Always prevent default behavior to avoid browser interference
        e.preventDefault();
        
        const currentLine = document.querySelector('.terminal-line:last-child');
        if (!currentLine) return;
        
        const cursor = currentLine.querySelector('.cursor') as HTMLElement;
        if (!cursor) return;
        
        if (e.key === 'Enter') {
            // Remove cursor from the executed command line
            const currentLine = document.querySelector('.terminal-line:last-child');
            if (currentLine) {
                const cursor = currentLine.querySelector('.cursor');
                if (cursor) {
                    cursor.remove();
                }
            }
            
            const output = this.executeCommand(this.currentInput);
            this.addOutput(output);
            
            if (this.currentInput.trim()) {
                this.commandHistory.push(this.currentInput);
                this.historyIndex = this.commandHistory.length;
            }
            
            // Extract command to check if it's quit or commandrace
            const command = this.currentInput.trim().split(' ')[0]?.toLowerCase() ?? '';
            this.currentInput = '';
            
            // Don't add prompt for quit or commandrace commands as they handle their own display
            if (command !== 'quit' && command !== 'commandrace') {
                this.addPrompt();
            }
            
        } else if (e.key === 'Backspace') {
            if (this.currentInput.length > 0) {
                this.currentInput = this.currentInput.slice(0, -1);
                this.updateCurrentLine();
            }
        } else if (e.key === 'ArrowUp') {
            if (this.historyIndex > 0) {
                this.historyIndex--;
                this.currentInput = this.commandHistory[this.historyIndex] ?? '';
                this.updateCurrentLine();
            }
        } else if (e.key === 'ArrowDown') {
            if (this.historyIndex < this.commandHistory.length - 1) {
                this.historyIndex++;
                this.currentInput = this.commandHistory[this.historyIndex] ?? '';
                this.updateCurrentLine();
            } else if (this.historyIndex === this.commandHistory.length - 1) {
                this.historyIndex = this.commandHistory.length;
                this.currentInput = '';
                this.updateCurrentLine();
            }
        } else if (e.ctrlKey && !e.metaKey && !e.altKey) {
            // Handle Ctrl+key combinations for shell scripting
            e.preventDefault();
            
            switch (e.key.toLowerCase()) {
                case 'a':
                    // Ctrl+A: Move cursor to beginning of line
                    this.currentInput = '';
                    this.updateCurrentLine();
                    break;
                case 'e':
                    // Ctrl+E: Move cursor to end of line (already at end in our implementation)
                    break;
                case 'k':
                    // Ctrl+K: Delete from cursor to end of line
                    this.currentInput = '';
                    this.updateCurrentLine();
                    break;
                case 'u':
                    // Ctrl+U: Delete from beginning to cursor
                    this.currentInput = '';
                    this.updateCurrentLine();
                    break;
                case 'w':
                    // Ctrl+W: Delete word before cursor
                    this.currentInput = this.currentInput.replace(/\s*\S+\s*$/, '');
                    this.updateCurrentLine();
                    break;
                case 'c':
                    // Ctrl+C: Interrupt current command (show ^C)
                    this.addOutput('^C');
                    this.currentInput = '';
                    this.addPrompt();
                    break;
                case 'd':
                    // Ctrl+D: End of file (exit if empty line)
                    if (this.currentInput.trim() === '') {
                        this.addOutput('exit');
                        this.addOutput('Goodbye!');
                        return;
                    }
                    break;
                case 'l':
                    // Ctrl+L: Clear screen
                    if (this.terminalContent) {
                        this.terminalContent.innerHTML = '';
                    }
                    this.addPrompt();
                    break;
                case 'r':
                    // Ctrl+R: Reverse search through history
                    this.addOutput('(reverse-i-search)`\': ');
                    break;
                case 't':
                    // Ctrl+T: Transpose characters
                    if (this.currentInput.length >= 2) {
                        const chars = this.currentInput.split('');
                        const last = chars.pop();
                        const secondLast = chars.pop();
                        chars.push(last!, secondLast!);
                        this.currentInput = chars.join('');
                        this.updateCurrentLine();
                    }
                    break;
            }
        } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            // Handle all printable characters (letters, numbers, symbols, spaces)
            // Exclude control key combinations
            this.currentInput += e.key;
            this.updateCurrentLine();
        }
    };

    public start(): void {
        if (!this.eventListenerAdded) {
        document.addEventListener('keydown', this.handleKeyDown);
            this.eventListenerAdded = true;
        }
    }

    public stop(): void {
        if (this.eventListenerAdded) {
        document.removeEventListener('keydown', this.handleKeyDown);
            this.eventListenerAdded = false;
        }
    }

    private highlightNextSection(): void {
        console.log('Tab key pressed - highlighting sections');
        
        // Remove existing highlights
        const existingHighlights = document.querySelectorAll('.terminal-highlight');
        console.log('Found existing highlights:', existingHighlights.length);
        existingHighlights.forEach(el => {
            el.classList.remove('terminal-highlight');
        });

        // Find all terminal lines with content
        const terminalLines = document.querySelectorAll('.terminal-line');
        console.log('Total terminal lines:', terminalLines.length);
        
        const linesWithContent = Array.from(terminalLines).filter(line => {
            const command = line.querySelector('.command');
            const hasContent = command && command.textContent && command.textContent.trim().length > 0;
            console.log('Line has content:', hasContent, command?.textContent);
            return hasContent;
        });

        console.log('Lines with content:', linesWithContent.length);

        if (linesWithContent.length === 0) {
            console.log('No lines with content found');
            return;
        }

        // Find the next line to highlight (cycle through them)
        let nextIndex = 0;
        const currentHighlighted = document.querySelector('.terminal-highlight');
        if (currentHighlighted) {
            const currentIndex = linesWithContent.indexOf(currentHighlighted);
            nextIndex = (currentIndex + 1) % linesWithContent.length;
            console.log('Current highlighted index:', currentIndex, 'Next index:', nextIndex);
        } else {
            console.log('No current highlight, starting from index 0');
        }

        // Highlight the next section
        const nextLine = linesWithContent[nextIndex];
        if (nextLine) {
            console.log('Highlighting line:', nextLine);
            nextLine.classList.add('terminal-highlight');
            
            // Scroll to the highlighted section
            nextLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            console.log('No next line to highlight');
        }
    }
}

// Global instance to prevent multiple instances
let globalTerminalApp: TerminalApp | null = null;

// Make Learn section functions globally accessible
(window as any).openModule = openModule;
(window as any).closeModule = closeModule;
(window as any).checkAnswer = checkAnswer;

// Start menu functionality
function selectStartOption(option: string): void {
    // Hide start menu
    const startMenu = document.getElementById('start-menu');
    if (startMenu) {
        startMenu.style.display = 'none';
    }
    
    // Show tab navigation
    const tabNav = document.getElementById('tab-nav');
    if (tabNav) {
        tabNav.style.display = 'flex';
    }
    
    // Switch to selected tab
    const tabButton = document.querySelector(`[data-tab="${option}"]`) as HTMLElement;
    if (tabButton) {
        tabButton.click();
    }
    
    // Initialize terminal if terminal option was selected
    if (option === 'terminal' && globalTerminalApp) {
        globalTerminalApp.initTerminal();
    }
}

// Make start menu function globally accessible
(window as any).selectStartOption = selectStartOption;

// Go back to menu functionality
function goBackToMenu(): void {
    // Hide tab navigation
    const tabNav = document.getElementById('tab-nav');
    if (tabNav) {
        tabNav.style.display = 'none';
    }
    
    // Show start menu
    const startMenu = document.getElementById('start-menu');
    if (startMenu) {
        startMenu.style.display = 'flex';
    }
    
    // Clear terminal content if terminal is active
    if (globalTerminalApp && globalTerminalApp.terminalContent) {
        globalTerminalApp.terminalContent.innerHTML = '';
    }
}

// Make go back to menu function globally accessible
(window as any).goBackToMenu = goBackToMenu;

// Tab switching functionality
function initializeTabs(): void {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const targetContent = document.getElementById(targetTab!);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

// Function to switch to terminal tab (called from Play tab)
function switchToTerminal(): void {
    const terminalTab = document.querySelector('[data-tab="terminal"]') as HTMLElement;
    if (terminalTab) {
        terminalTab.click();
    }
}

// Make switchToTerminal available globally
(window as any).switchToTerminal = switchToTerminal;
(window as any).startPuzzleFromPlay = startPuzzleFromPlay;
(window as any).startRPGFromPlay = startRPGFromPlay;
(window as any).startCommandRaceFromPlay = startCommandRaceFromPlay;

// Notes functionality
interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

let notes: Note[] = [];
let currentNoteId: string | null = null;

// Load notes from localStorage
function loadNotes(): void {
    const savedNotes = localStorage.getItem('linux-hero-notes');
    if (savedNotes) {
        notes = JSON.parse(savedNotes).map((note: any) => ({
            ...note,
            createdAt: new Date(note.createdAt),
            updatedAt: new Date(note.updatedAt)
        }));
    }
    renderNotesList();
}

// Save notes to localStorage
function saveNotes(): void {
    localStorage.setItem('linux-hero-notes', JSON.stringify(notes));
}

// Create a new note
function createNewNote(): void {
    const newNote: Note = {
        id: Date.now().toString(),
        title: 'Untitled Note',
        content: '',
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    notes.unshift(newNote);
    saveNotes();
    renderNotesList();
    selectNote(newNote.id);
}

// Select a note
function selectNote(noteId: string): void {
    currentNoteId = noteId;
    const note = notes.find(n => n.id === noteId);
    if (note) {
        renderNoteEditor(note);
        updateActiveNote(noteId);
    }
}

// Update active note in sidebar
function updateActiveNote(noteId: string): void {
    document.querySelectorAll('.note-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeItem = document.querySelector(`[data-note-id="${noteId}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

// Render notes list in sidebar
function renderNotesList(): void {
    const notesList = document.getElementById('notes-list');
    if (!notesList) return;
    
    if (notes.length === 0) {
        notesList.innerHTML = '<div style="text-align: center; color: #7f8c8d; font-style: italic;">No notes yet</div>';
        return;
    }
    
    notesList.innerHTML = notes.map(note => `
        <div class="note-item" data-note-id="${note.id}" onclick="selectNote('${note.id}')">
            <button class="note-delete-btn" onclick="event.stopPropagation(); deleteNote('${note.id}')" title="Delete note">
                🗑️
            </button>
            <div class="note-title">${note.title}</div>
            <div class="note-preview">${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}</div>
            <div class="note-date">${note.updatedAt.toLocaleDateString()}</div>
        </div>
    `).join('');
}

// Render note editor
function renderNoteEditor(note: Note): void {
    const noteEditor = document.getElementById('note-editor');
    if (!noteEditor) return;
    
    noteEditor.innerHTML = `
        <div class="note-title-editor">
            <input type="text" class="note-title-input" placeholder="Note title..." value="${note.title}" oninput="updateNoteTitleDirect('${note.id}', this.value)">
        </div>
        <textarea class="note-content" placeholder="Start typing your note..." oninput="updateNoteContent('${note.id}', this.value)">${note.content}</textarea>
        <div class="note-actions">
            <button class="note-action-btn delete" onclick="deleteNote('${note.id}')">Delete</button>
        </div>
    `;
    
    // Focus the title input
    const titleInput = noteEditor.querySelector('.note-title-input') as HTMLInputElement;
    if (titleInput) {
        titleInput.focus();
        titleInput.select();
    }
}

// Update note title directly
function updateNoteTitleDirect(noteId: string, title: string): void {
    const note = notes.find(n => n.id === noteId);
    if (note) {
        note.title = title.trim() || 'Untitled Note';
        note.updatedAt = new Date();
        saveNotes();
        
        // Update title in sidebar
        const noteItem = document.querySelector(`[data-note-id="${noteId}"]`);
        if (noteItem) {
            const titleElement = noteItem.querySelector('.note-title');
            if (titleElement) {
                titleElement.textContent = note.title;
            }
        }
    }
}

// Update note content
function updateNoteContent(noteId: string, content: string): void {
    const note = notes.find(n => n.id === noteId);
    if (note) {
        note.content = content;
        note.updatedAt = new Date();
        saveNotes();
        
        // Update preview in sidebar
        const noteItem = document.querySelector(`[data-note-id="${noteId}"]`);
        if (noteItem) {
            const preview = noteItem.querySelector('.note-preview');
            if (preview) {
                preview.textContent = content.substring(0, 100) + (content.length > 100 ? '...' : '');
            }
        }
    }
}

// Update note title based on content
function updateNoteTitle(noteId: string): void {
    const note = notes.find(n => n.id === noteId);
    if (note) {
        const firstLine = note.content.split('\n')[0]?.trim();
        if (firstLine && firstLine !== note.title) {
            note.title = firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
            note.updatedAt = new Date();
            saveNotes();
            renderNotesList();
            updateActiveNote(noteId);
        }
    }
}

// Delete note
function deleteNote(noteId: string): void {
    if (confirm('Are you sure you want to delete this note?')) {
        notes = notes.filter(n => n.id !== noteId);
        saveNotes();
        renderNotesList();
        
        // Clear editor if this was the current note
        if (currentNoteId === noteId) {
            currentNoteId = null;
            const noteEditor = document.getElementById('note-editor');
            if (noteEditor) {
                noteEditor.innerHTML = `
                    <div class="note-placeholder">
                        <h3>Welcome to Notes!</h3>
                        <p>Create a new note to get started, or select an existing note from the sidebar.</p>
                    </div>
                `;
            }
        }
    }
}

// Make note functions globally available
(window as any).createNewNote = createNewNote;
(window as any).selectNote = selectNote;
(window as any).updateNoteContent = updateNoteContent;
(window as any).updateNoteTitle = updateNoteTitle;
(window as any).updateNoteTitleDirect = updateNoteTitleDirect;
(window as any).deleteNote = deleteNote;

// Learning module functions - optimized for Orange Pi
function openModule(moduleId: string): void {
    const module = document.getElementById(moduleId);
    if (module) {
        module.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModule(moduleId: string): void {
    const module = document.getElementById(moduleId);
    if (module) {
        module.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function checkAnswer(button: HTMLElement, answer: string, isCorrect: boolean): void {
    const quizButtons = button.parentElement?.querySelectorAll('.quiz-btn') as NodeListOf<HTMLElement>;
    
    // Disable all buttons
    quizButtons.forEach(btn => {
        btn.style.pointerEvents = 'none';
    });
    
    // Mark the clicked button
    if (isCorrect) {
        button.classList.add('correct');
    } else {
        button.classList.add('incorrect');
        // Find and highlight the correct answer
        quizButtons.forEach(btn => {
            if (btn.textContent?.trim() === 'mkdir projects') {
                btn.classList.add('correct');
            }
        });
    }
    
    // Show simple feedback
    const feedback = document.createElement('div');
    feedback.style.cssText = 'margin-top: 10px; padding: 8px; border-radius: 4px; font-weight: 600; text-align: center;';
    
    if (isCorrect) {
        feedback.style.backgroundColor = '#d4edda';
        feedback.style.color = '#155724';
        feedback.style.border = '1px solid #27ae60';
        feedback.textContent = '✓ Correct!';
    } else {
        feedback.style.backgroundColor = '#f8d7da';
        feedback.style.color = '#721c24';
        feedback.style.border = '1px solid #dc3545';
        feedback.textContent = '✗ Incorrect. Answer: "mkdir projects"';
    }
    
    button.parentElement?.appendChild(feedback);
}

// Prevent cursor positioning in input fields to mimic terminal behavior
function preventCursorPositioning(e: Event): void {
    e.preventDefault();
    const input = e.target as HTMLInputElement;
    if (input) {
        // Move cursor to end of text
        setTimeout(() => {
            input.setSelectionRange(input.value.length, input.value.length);
        }, 0);
    }
}

function closeGame(gameId: string): void {
    const game = document.getElementById(gameId);
    if (game) {
        game.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function openGame(gameId: string): void {
    const game = document.getElementById(gameId);
    if (game) {
        game.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Terminal RPG Game - integrated with terminal
let rpgMode = false;
let rpgHealth = 100;
let rpgLevel = 1;
let rpgXp = 0;
let rpgLocation = '/home/wizard';
let rpgStory = '';

// Terminal Command Race Game - integrated with terminal
let commandRaceMode = false;
let commandRaceStartTime = 0;
let commandRaceCurrentText = '';
let commandRaceState = 'waiting'; // 'waiting', 'countdown', 'racing', 'finished'
let commandRaceCountdownTimer: ReturnType<typeof setTimeout> | null = null;
let commandRaceTexts = [
    // Basic file operations
    'ls -la',
    'cd /home/user',
    'mkdir projects',
    'cp file.txt backup.txt',
    'mv old.txt new.txt',
    'rm -rf temp_folder',
    'touch newfile.txt',
    'cat /etc/passwd',
    'head -n 10 file.txt',
    'tail -f /var/log/syslog',
    
    // Text processing
    'grep "error" *.log',
    'find . -name "*.txt"',
    'sed "s/old/new/g" file.txt',
    'awk "{print $1}" data.txt',
    'sort -r file.txt',
    'uniq -c file.txt',
    'wc -l file.txt',
    'cut -d: -f1 /etc/passwd',
    
    // System administration
    'ps aux | grep python',
    'top -n 1',
    'df -h',
    'free -m',
    'uptime',
    'whoami',
    'id',
    'groups',
    'sudo systemctl status nginx',
    'sudo apt update && sudo apt upgrade',
    'sudo chmod 755 script.sh',
    'sudo chown user:group file.txt',
    
    // Network and remote operations
    'ssh user@server.com',
    'scp file.txt user@server:/path/',
    'wget https://example.com/file.zip',
    'curl -O https://api.example.com/data',
    'ping -c 4 google.com',
    'netstat -tulpn',
    'ss -tulpn',
    'iptables -L',
    
    // Version control and development
    'git commit -m "initial commit"',
    'git push origin main',
    'git pull origin develop',
    'git checkout -b feature/new-feature',
    'git merge feature/branch',
    'git log --oneline',
    'git status',
    'git diff HEAD~1',
    
    // Container and virtualization
    'docker run -it ubuntu',
    'docker ps -a',
    'docker images',
    'docker build -t myapp .',
    'docker-compose up -d',
    'kubectl get pods',
    'kubectl logs pod-name',
    
    // Archive and compression
    'tar -czf archive.tar.gz folder/',
    'tar -xzf archive.tar.gz',
    'zip -r backup.zip folder/',
    'unzip archive.zip',
    'gzip file.txt',
    'gunzip file.txt.gz',
    
    // Process management
    'kill -9 1234',
    'killall firefox',
    'nohup command &',
    'jobs',
    'fg %1',
    'bg %1',
    
    // Environment and configuration
    'export PATH=$PATH:/usr/local/bin',
    'echo $HOME',
    'env | grep PATH',
    'source ~/.bashrc',
    'alias ll="ls -la"',
    'history | grep command',
    
    // Advanced text manipulation
    'tr "[:lower:]" "[:upper:]" < file.txt',
    'paste file1.txt file2.txt',
    'join file1.txt file2.txt',
    'comm file1.txt file2.txt',
    'diff file1.txt file2.txt',
    'patch file.txt patch.diff'
];

// Make modes globally accessible
(window as any).rpgMode = rpgMode;
(window as any).commandRaceMode = commandRaceMode;

function processRpgCommand(command: string): void {
    if (!globalTerminalApp) return;
    
    switch (command.toLowerCase()) {
        case 'help':
            globalTerminalApp.addOutput('Available commands:');
            globalTerminalApp.addOutput('  ls - Look around');
            globalTerminalApp.addOutput('  cd .. - Move up directory');
            globalTerminalApp.addOutput('  pwd - Check location');
            globalTerminalApp.addOutput('  cat spellbook.txt - Read spellbook (+20 XP)');
            globalTerminalApp.addOutput('  fight - Battle a monster');
            globalTerminalApp.addOutput('  heal - Use healing potion');
            globalTerminalApp.addOutput('  explore - Explore for treasures (+10 XP)');
            globalTerminalApp.addOutput('  status - Show your stats');
            globalTerminalApp.addOutput('  quit - Exit RPG mode');
            break;
            
        case 'status':
            globalTerminalApp.addOutput('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            globalTerminalApp.addOutput(`Health: ${rpgHealth}/100`);
            globalTerminalApp.addOutput(`Level: ${rpgLevel}`);
            globalTerminalApp.addOutput(`XP: ${rpgXp}`);
            globalTerminalApp.addOutput(`Location: ${rpgLocation}`);
            globalTerminalApp.addOutput('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            break;
            
        case 'ls':
            globalTerminalApp.addOutput('You see magical files:');
            globalTerminalApp.addOutput('  spellbook.txt - Ancient Linux spells');
            globalTerminalApp.addOutput('  potion.sh - Healing script');
            globalTerminalApp.addOutput('  staff.bin - Magical staff');
            globalTerminalApp.addOutput('  robe.conf - Wizard configuration');
            rpgXp += 5;
            globalTerminalApp.addOutput(`+5 XP! Total: ${rpgXp}`);
            break;
            
        case 'cd ..':
            if (rpgLocation === '/home/wizard') {
                rpgLocation = '/home';
                globalTerminalApp.addOutput('You moved to /home. You see other wizard directories.');
            } else {
                globalTerminalApp.addOutput('You cannot go further up!');
            }
            rpgXp += 3;
            globalTerminalApp.addOutput(`+3 XP! Total: ${rpgXp}`);
            break;
            
        case 'pwd':
            globalTerminalApp.addOutput(`Current location: ${rpgLocation}`);
            rpgXp += 2;
            globalTerminalApp.addOutput(`+2 XP! Total: ${rpgXp}`);
            break;
            
        case 'cat spellbook.txt':
            globalTerminalApp.addOutput('You read the spellbook! Learned new Linux spells!');
            globalTerminalApp.addOutput('  - ls -la: List all files with details');
            globalTerminalApp.addOutput('  - grep: Search for patterns');
            globalTerminalApp.addOutput('  - find: Locate files and directories');
            rpgXp += 20;
            globalTerminalApp.addOutput(`+20 XP! Total: ${rpgXp}`);
            break;
            
        case 'fight':
            const damage = Math.floor(Math.random() * 20) + 10;
            rpgHealth -= damage;
            rpgXp += 15;
            globalTerminalApp.addOutput(`⚔️ You fought a terminal monster!`);
            globalTerminalApp.addOutput(`💔 Took ${damage} damage! Health: ${rpgHealth}`);
            globalTerminalApp.addOutput(`✨ Gained 15 XP! Total: ${rpgXp}`);
            break;
            
        case 'heal':
            const healing = Math.floor(Math.random() * 30) + 10;
            rpgHealth = Math.min(100, rpgHealth + healing);
            globalTerminalApp.addOutput(`🧪 You used a healing potion!`);
            globalTerminalApp.addOutput(`❤️ Restored ${healing} health! Health: ${rpgHealth}`);
            break;
            
        case 'explore':
            globalTerminalApp.addOutput('🔍 You explore the system directories...');
            globalTerminalApp.addOutput('Found: Ancient configuration files, hidden logs, and system secrets!');
            rpgXp += 10;
            globalTerminalApp.addOutput(`✨ Found treasures! +10 XP! Total: ${rpgXp}`);
            break;
            
        case 'quit':
            rpgMode = false;
            (window as any).rpgMode = false;
            globalTerminalApp.addOutput('Thanks for playing Terminal RPG!');
            globalTerminalApp.addOutput('Returning to Terminal Challenge...');
            
            // Clear terminal and show Terminal Challenge
            if (globalTerminalApp.terminalContent) {
                globalTerminalApp.terminalContent.innerHTML = '';
            }
            globalTerminalApp.showTerminalChallenge();
            break;
            
        default:
            globalTerminalApp.addOutput(`You tried "${command}" but nothing happened.`);
            globalTerminalApp.addOutput('Type "help" for available commands.');
            break;
    }
    
    // Level up check
    if (rpgXp >= rpgLevel * 50) {
        rpgLevel++;
        rpgHealth = 100; // Full heal on level up
        globalTerminalApp.addOutput('');
        globalTerminalApp.addOutput('🎉 LEVEL UP! 🎉');
        globalTerminalApp.addOutput(`You are now level ${rpgLevel}!`);
        globalTerminalApp.addOutput('Health fully restored!');
        globalTerminalApp.addOutput('');
    }
    
    // Game over check
    if (rpgHealth <= 0) {
        globalTerminalApp.addOutput('');
        globalTerminalApp.addOutput('💀 GAME OVER! 💀');
        globalTerminalApp.addOutput('Your wizard has fallen!');
        globalTerminalApp.addOutput('Type "start" to begin again.');
        rpgMode = false;
        (window as any).rpgMode = false;
    }
}

function processCommandRaceCommand(command: string): void {
    if (!globalTerminalApp) return;
    
    const cmd = command.toLowerCase().trim();
    
    // Handle quit command in any state
    if (cmd === 'quit') {
        // Clear any countdown timer
        if (commandRaceCountdownTimer) {
            clearTimeout(commandRaceCountdownTimer);
            commandRaceCountdownTimer = null;
        }
        
        commandRaceMode = false;
        (window as any).commandRaceMode = false;
        commandRaceState = 'waiting';
        globalTerminalApp.addOutput('Thanks for playing Command Race!');
        globalTerminalApp.addOutput('Returning to Terminal Challenge...');
        
        // Clear terminal and show Terminal Challenge
        if (globalTerminalApp.terminalContent) {
            globalTerminalApp.terminalContent.innerHTML = '';
        }
        globalTerminalApp.showTerminalChallenge();
        return;
    }
    
    // Handle different states
    if (commandRaceState === 'waiting') {
        if (cmd === 'start') {
            startCommandRaceCountdown();
        } else {
            globalTerminalApp.addOutput('Type "start" to begin the race or "quit" to exit.');
        }
    } else if (commandRaceState === 'countdown') {
        globalTerminalApp.addOutput('Please wait for the countdown to finish!');
    } else if (commandRaceState === 'racing') {
        // Check if the typed command matches the target
        if (command === commandRaceCurrentText) {
            finishCommandRace(true);
        } else {
            globalTerminalApp.addOutput(`❌ Incorrect! You typed: "${command}"`);
            globalTerminalApp.addOutput(`Target was: ${commandRaceCurrentText}`);
            globalTerminalApp.addOutput('Try again!');
        }
    } else if (commandRaceState === 'finished') {
        if (cmd === 'play again' || cmd === 'playagain') {
            // Start a new race
            const randomIndex = Math.floor(Math.random() * commandRaceTexts.length);
            commandRaceCurrentText = commandRaceTexts[randomIndex] || 'ls -la';
            commandRaceState = 'waiting';
            globalTerminalApp.addOutput('');
            globalTerminalApp.addOutput('New command selected! Type "start" to begin the next race!');
        } else if (cmd === 'quit') {
            // Already handled above
        } else {
            globalTerminalApp.addOutput('Type "play again" to race again or "quit" to exit.');
        }
    }
}

function startCommandRaceCountdown(): void {
    if (!globalTerminalApp) return;
    
    commandRaceState = 'countdown';
    globalTerminalApp.addOutput('');
    globalTerminalApp.addOutput('Get ready! The race starts in...');
    globalTerminalApp.addOutput('');
    
    let countdown = 3;
    const countdownInterval = setInterval(() => {
        if (!globalTerminalApp) {
            clearInterval(countdownInterval);
            return;
        }
        
        if (countdown > 0) {
            globalTerminalApp.addOutput(`${countdown}...`);
            countdown--;
        } else {
            clearInterval(countdownInterval);
            globalTerminalApp.addOutput('GO! 🏃‍♂️');
            globalTerminalApp.addOutput('');
            globalTerminalApp.addOutput('Type this command:');
            globalTerminalApp.addOutput(commandRaceCurrentText);
            globalTerminalApp.addOutput('');
            globalTerminalApp.addOutput('Start typing NOW!');
            
            // Start the race
            commandRaceState = 'racing';
            commandRaceStartTime = Date.now();
            
            // Add a prompt so user can type
            globalTerminalApp.addPrompt();
        }
    }, 1000);
    
    commandRaceCountdownTimer = countdownInterval as any;
}

function finishCommandRace(success: boolean): void {
    if (!globalTerminalApp) return;
    
    commandRaceState = 'finished';
    
    if (success) {
        const endTime = Date.now();
        const timeTaken = (endTime - commandRaceStartTime) / 1000; // Convert to seconds
        const wordsPerMinute = Math.round((commandRaceCurrentText.split(' ').length / timeTaken) * 60);
        const charactersPerMinute = Math.round((commandRaceCurrentText.length / timeTaken) * 60);
        
        globalTerminalApp.addOutput('');
        globalTerminalApp.addOutput('🎉 EXCELLENT! You completed the command! 🎉');
        globalTerminalApp.addOutput('');
        globalTerminalApp.addOutput(`Time taken: ${timeTaken.toFixed(2)} seconds`);
        globalTerminalApp.addOutput(`Words per minute: ${wordsPerMinute} WPM`);
        globalTerminalApp.addOutput(`Characters per minute: ${charactersPerMinute} CPM`);
        globalTerminalApp.addOutput('');
        
        // Performance feedback
        if (wordsPerMinute >= 60) {
            globalTerminalApp.addOutput('🏆 AMAZING! You are a typing master!');
        } else if (wordsPerMinute >= 40) {
            globalTerminalApp.addOutput('🔥 GREAT! You are a fast typist!');
        } else if (wordsPerMinute >= 25) {
            globalTerminalApp.addOutput('👍 GOOD! You have decent typing speed!');
        } else {
            globalTerminalApp.addOutput('💪 Keep practicing to improve your speed!');
        }
        
        globalTerminalApp.addOutput('');
        globalTerminalApp.addOutput('Type "play again" to race again or "quit" to exit.');
    }
}

// Game launcher functions - switch to terminal and start game
function startPuzzleFromPlay(): void {
    switchToTerminal();
    // Small delay to ensure terminal is ready
    setTimeout(() => {
        if (globalTerminalApp) {
            globalTerminalApp.executeCommand('puzzle');
        }
    }, 100);
}

function startRPGFromPlay(): void {
    switchToTerminal();
    // Small delay to ensure terminal is ready
    setTimeout(() => {
        if (globalTerminalApp) {
            globalTerminalApp.executeCommand('rpg');
        }
    }, 100);
}

function startCommandRaceFromPlay(): void {
    switchToTerminal();
    // Small delay to ensure terminal is ready
    setTimeout(() => {
        if (globalTerminalApp) {
            globalTerminalApp.executeCommand('commandrace');
        }
    }, 100);
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize tab switching
    initializeTabs();
    
    // Initialize terminal app only if not already initialized
    if (!globalTerminalApp) {
        globalTerminalApp = new TerminalApp();
        globalTerminalApp.init();
        globalTerminalApp.start();
    }
    
    // Initialize notes
    loadNotes();
});

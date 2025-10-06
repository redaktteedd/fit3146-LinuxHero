// Terminal-like renderer process JavaScript
document.addEventListener('DOMContentLoaded', () => {
    console.log('Terminal app loaded successfully!');
    
    const terminalContent = document.querySelector('.terminal-content');
    const terminalBody = document.querySelector('.terminal-body');
    let currentInput = '';
    let commandHistory = [];
    let historyIndex = -1;
    
    // Terminal commands
    const commands = {
        help: () => 'Available commands:\n  help - Show this help message\n  clear - Clear the terminal\n  echo <text> - Echo text\n  date - Show current date\n  whoami - Show current user\n  ls - List files\n  pwd - Show current directory',
        clear: () => {
            terminalContent.innerHTML = '';
            return '';
        },
        echo: (args) => args.join(' '),
        date: () => new Date().toString(),
        whoami: () => 'user',
        ls: () => 'total 8\ndrwxr-xr-x  2 user user 4096 Jan  1 12:00 .\ndrwxr-xr-x  3 user user 4096 Jan  1 12:00 ..\n-rw-r--r--  1 user user  220 Jan  1 12:00 .bashrc\n-rw-r--r--  1 user user 3526 Jan  1 12:00 .bash_history',
        pwd: () => '/home/user',
        neofetch: () => `
            ╭─────────────────────────────────────────╮
            │  user@computer                          │
            │  ─────────────────────────────────────  │
            │  OS: macOS 14.6.0                       │
            │  Host: MacBook Pro                      │
            │  Kernel: Darwin 24.6.0                  │
            │  Uptime: 2 hours, 15 minutes            │
            │  Shell: zsh 5.9                         │
            │  Terminal: Terminal App                 │
            │  CPU: Apple M2                          │
            │  Memory: 8GB / 16GB                     │
            ╰─────────────────────────────────────────╯
        `
    };
    
    // Create initial prompt
    function createPrompt() {
        const promptLine = document.createElement('div');
        promptLine.className = 'terminal-line';
        promptLine.innerHTML = `
            <span class="prompt">user@computer:~$</span>
            <span class="cursor">_</span>
        `;
        return promptLine;
    }
    
    // Add new prompt line
    function addPrompt() {
        const promptLine = createPrompt();
        terminalContent.appendChild(promptLine);
        scrollToBottom();
    }
    
    // Execute command
    function executeCommand(input) {
        const parts = input.trim().split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);
        
        if (commands[command]) {
            return commands[command](args);
        } else if (command === '') {
            return '';
        } else {
            return `Command not found: ${command}. Type 'help' for available commands.`;
        }
    }
    
    // Add command output
    function addOutput(text) {
        if (text) {
            const outputDiv = document.createElement('div');
            outputDiv.className = 'terminal-output';
            outputDiv.textContent = text;
            terminalContent.appendChild(outputDiv);
        }
    }
    
    // Scroll to bottom
    function scrollToBottom() {
        terminalBody.scrollTop = terminalBody.scrollHeight;
    }
    
    // Handle keyboard input
    document.addEventListener('keydown', (e) => {
        const currentLine = document.querySelector('.terminal-line:last-child');
        const cursor = currentLine.querySelector('.cursor');
        
        if (e.key === 'Enter') {
            e.preventDefault();
            
            // Remove cursor and add command
            const commandSpan = document.createElement('span');
            commandSpan.className = 'command';
            commandSpan.textContent = currentInput;
            cursor.parentNode.replaceChild(commandSpan, cursor);
            
            // Execute command
            const output = executeCommand(currentInput);
            addOutput(output);
            
            // Add to history
            if (currentInput.trim()) {
                commandHistory.push(currentInput);
                historyIndex = commandHistory.length;
            }
            
            // Reset input and add new prompt
            currentInput = '';
            addPrompt();
            
        } else if (e.key === 'Backspace') {
            e.preventDefault();
            if (currentInput.length > 0) {
                currentInput = currentInput.slice(0, -1);
                updateCurrentLine();
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex > 0) {
                historyIndex--;
                currentInput = commandHistory[historyIndex];
                updateCurrentLine();
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                currentInput = commandHistory[historyIndex];
                updateCurrentLine();
            } else if (historyIndex === commandHistory.length - 1) {
                historyIndex = commandHistory.length;
                currentInput = '';
                updateCurrentLine();
            }
        } else if (e.key.length === 1) {
            // Regular character input
            currentInput += e.key;
            updateCurrentLine();
        }
    });
    
    // Update current line display
    function updateCurrentLine() {
        const currentLine = document.querySelector('.terminal-line:last-child');
        const commandSpan = currentLine.querySelector('.command');
        const cursor = currentLine.querySelector('.cursor');
        
        if (commandSpan) {
            commandSpan.textContent = currentInput;
        } else if (cursor) {
            const newCommandSpan = document.createElement('span');
            newCommandSpan.className = 'command';
            newCommandSpan.textContent = currentInput;
            cursor.parentNode.insertBefore(newCommandSpan, cursor);
        }
    }
    
    // Add initial prompt
    addPrompt();
    
    // Make terminal focusable
    terminalBody.addEventListener('click', () => {
        terminalBody.focus();
    });
    
    terminalBody.tabIndex = 0;
    
    // Update window title
    document.title = 'Terminal App - Ready!';
});

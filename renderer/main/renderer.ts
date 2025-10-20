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
        help: () => 'Available commands:\n  help - Show this help message\n  clear - Clear the terminal\n  echo <text> - Echo text\n  date - Show current date\n  whoami - Show current user\n  ls - List files\n  pwd - Show current directory\n  cat <filename> - Read a file\n  play - Show Terminal Challenge menu\n  puzzle - Start a puzzle\n  solve <answer> - Submit your puzzle answer\n  rpg - Start a RPG game\n  commandrace - Start a command race game\n  notes - List all notes\n  note <title> - Create or edit a note\n  rmnote <title> - Delete a note\n\nFile Operations:\n  mkdir <dir> - Create directory\n  rmdir <dir> - Remove directory\n  cp <src> <dest> - Copy file\n  mv <src> <dest> - Move/rename file\n  rm <file> - Remove file\n  touch <file> - Create empty file\n  chmod <perms> <file> - Change permissions\n  chown <user:group> <file> - Change ownership\n\nSystem Information:\n  ps - Show running processes\n  top - Show system processes\n  df - Show disk usage\n  free - Show memory usage\n  uptime - Show system uptime\n  id - Show user ID\n  groups - Show user groups\n  env - Show environment variables\n  history - Show command history\n  which <cmd> - Find command location\n  whereis <cmd> - Find command files\n\nText Processing:\n  grep <pattern> <file> - Search text\n  find <path> -name <pattern> - Find files\n  head <file> - Show first lines\n  tail <file> - Show last lines\n  wc <file> - Count lines/words/chars\n  sort <file> - Sort lines\n  uniq <file> - Remove duplicates\n  cut -d: -f1 <file> - Extract columns\n\nCopy/Paste:\n  copy <text> - Copy text to clipboard\n  paste - Paste from clipboard\n  clipboard - Show clipboard contents\n\nLearning Resources:\n  learn - Show all learning commands\n  tutorial <topic> - Interactive tutorials\n  examples <cmd> - Command examples\n  cheatsheet <cat> - Quick reference\n  man <cmd> - Manual pages\n\nShell shortcuts:\n  Ctrl+A - Move to beginning of line\n  Ctrl+E - Move to end of line\n  Ctrl+K - Delete to end of line\n  Ctrl+U - Delete to beginning of line\n  Ctrl+W - Delete previous word\n  Ctrl+C - Interrupt command\n  Ctrl+D - Exit (on empty line)\n  Ctrl+L - Clear screen\n  Ctrl+R - Reverse search history\n  Ctrl+T - Transpose characters',
        clear: () => {
            if (this.terminalContent) {
                this.terminalContent.innerHTML = '';
            }
            // Add a prompt after clearing
            this.addPrompt();
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
        play: () => this.showTerminalChallenge(),
        
        // Additional Linux commands
        mkdir: (args: string[]) => {
            if (args.length === 0) {
                return 'mkdir: missing operand\nTry "mkdir <directory_name>"';
            }
            return `Directory '${args[0]}' created successfully`;
        },
        
        rmdir: (args: string[]) => {
            if (args.length === 0) {
                return 'rmdir: missing operand\nTry "rmdir <directory_name>"';
            }
            return `Directory '${args[0]}' removed successfully`;
        },
        
        cp: (args: string[]) => {
            if (args.length < 2) {
                return 'cp: missing file operand\nTry "cp <source> <destination>"';
            }
            return `Copied '${args[0]}' to '${args[1]}'`;
        },
        
        mv: (args: string[]) => {
            if (args.length < 2) {
                return 'mv: missing file operand\nTry "mv <source> <destination>"';
            }
            return `Moved '${args[0]}' to '${args[1]}'`;
        },
        
        rm: (args: string[]) => {
            if (args.length === 0) {
                return 'rm: missing operand\nTry "rm <filename>"';
            }
            return `File '${args[0]}' removed successfully`;
        },
        
        touch: (args: string[]) => {
            if (args.length === 0) {
                return 'touch: missing file operand\nTry "touch <filename>"';
            }
            return `File '${args[0]}' created successfully`;
        },
        
        chmod: (args: string[]) => {
            if (args.length < 2) {
                return 'chmod: missing operand\nTry "chmod <permissions> <filename>"';
            }
            return `Changed permissions of '${args[1]}' to ${args[0]}`;
        },
        
        chown: (args: string[]) => {
            if (args.length < 2) {
                return 'chown: missing operand\nTry "chown <user:group> <filename>"';
            }
            return `Changed ownership of '${args[1]}' to ${args[0]}`;
        },
        
        ps: () => 'PID TTY TIME CMD\n1234 pts/0 00:00:01 bash\n5678 pts/0 00:00:02 node\n9012 pts/0 00:00:01 npm',
        
        top: () => 'top - 14:30:15 up 2 days, 3:45, 2 users, load average: 0.15, 0.10, 0.05\nTasks: 156 total, 1 running, 155 sleeping\n%Cpu(s): 2.1 us, 0.8 sy, 0.0 ni, 96.9 id, 0.2 wa',
        
        df: () => 'Filesystem 1K-blocks Used Available Use% Mounted on\n/dev/sda1 2097152 1048576 1048576 50% /\n/dev/sda2 4194304 2097152 2097152 50% /home',
        
        free: () => 'total used free shared buff/cache available\nMem: 8388608 4194304 2097152 1048576 2097152 3145728\nSwap: 2097152 0 2097152',
        
        uptime: () => `14:30:15 up 2 days, 3:45, 2 users, load average: 0.15, 0.10, 0.05`,
        
        id: () => 'uid=1000(user) gid=1000(user) groups=1000(user),4(adm),24(cdrom),27(sudo)',
        
        groups: () => 'user adm cdrom sudo',
        
        env: () => 'HOME=/home/user\nPATH=/usr/local/bin:/usr/bin:/bin\nUSER=user\nSHELL=/bin/bash',
        
        history: () => '1  ls -la\n2  cd /home/user\n3  mkdir projects\n4  cd projects\n5  touch README.md',
        
        which: (args: string[]) => {
            if (args.length === 0) {
                return 'which: missing program name\nTry "which <program_name>"';
            }
            return `/usr/bin/${args[0]}`;
        },
        
        whereis: (args: string[]) => {
            if (args.length === 0) {
                return 'whereis: missing program name\nTry "whereis <program_name>"';
            }
            return `${args[0]}: /usr/bin/${args[0]} /usr/share/man/man1/${args[0]}.1.gz`;
        },
        
        grep: (args: string[]) => {
            if (args.length === 0) {
                return 'grep: missing pattern\nTry "grep <pattern> <filename>"';
            }
            return `Found "${args[0]}" in file.txt:3:This line contains ${args[0]}`;
        },
        
        find: (args: string[]) => {
            if (args.length === 0) {
                return 'find: missing path\nTry "find <path> -name <pattern>"';
            }
            return './file1.txt\n./file2.txt\n./subdir/file3.txt';
        },
        
        head: (args: string[]) => {
            if (args.length === 0) {
                return 'head: missing file operand\nTry "head <filename>"';
            }
            return `Line 1: This is the first line\nLine 2: This is the second line\nLine 3: This is the third line`;
        },
        
        tail: (args: string[]) => {
            if (args.length === 0) {
                return 'tail: missing file operand\nTry "tail <filename>"';
            }
            return `Line 8: This is the eighth line\nLine 9: This is the ninth line\nLine 10: This is the tenth line`;
        },
        
        wc: (args: string[]) => {
            if (args.length === 0) {
                return 'wc: missing file operand\nTry "wc <filename>"';
            }
            return '10 25 150 file.txt';
        },
        
        sort: (args: string[]) => {
            if (args.length === 0) {
                return 'sort: missing file operand\nTry "sort <filename>"';
            }
            return `apple\nbanana\ncherry\norange\npear`;
        },
        
        uniq: (args: string[]) => {
            if (args.length === 0) {
                return 'uniq: missing file operand\nTry "uniq <filename>"';
            }
            return `apple\nbanana\ncherry\norange`;
        },
        
        cut: (args: string[]) => {
            if (args.length === 0) {
                return 'cut: missing list\nTry "cut -d: -f1 <filename>"';
            }
            return `user1\nuser2\nuser3`;
        },
        
        // Copy/Paste functionality
        copy: (args: string[]) => {
            if (args.length === 0) {
                return 'copy: missing operand\nTry "copy <text>"';
            }
            const text = args.join(' ');
            // Store in clipboard (simulated)
            (window as any).terminalClipboard = text;
            return `Copied "${text}" to clipboard`;
        },
        
        paste: () => {
            const clipboard = (window as any).terminalClipboard;
            if (clipboard) {
                return clipboard;
            } else {
                return 'Clipboard is empty';
            }
        },
        
        clipboard: () => {
            const clipboard = (window as any).terminalClipboard;
            if (clipboard) {
                return `Clipboard contains: "${clipboard}"`;
            } else {
                return 'Clipboard is empty';
            }
        },
        
        // Learning Resources
        tutorial: (args: string[]) => {
            const topic = args[0]?.toLowerCase() || 'general';
            switch (topic) {
                case 'files':
                    return '📚 FILE MANAGEMENT TUTORIAL\n\n' +
                           '1. Creating Files:\n   touch filename.txt\n   echo "content" > file.txt\n\n' +
                           '2. Creating Directories:\n   mkdir directory_name\n   mkdir -p path/to/directory\n\n' +
                           '3. Listing Files:\n   ls - List files\n   ls -la - List with details\n   ls -lh - Human readable sizes\n\n' +
                           '4. Moving Files:\n   mv old_name new_name\n   mv file.txt /path/to/destination/\n\n' +
                           '5. Copying Files:\n   cp source destination\n   cp -r directory/ backup/\n\n' +
                           '6. Removing Files:\n   rm filename\n   rm -rf directory/\n\n' +
                           'Try: tutorial permissions, tutorial text, tutorial system';
                    
                case 'permissions':
                    return '🔐 FILE PERMISSIONS TUTORIAL\n\n' +
                           'Understanding Permissions:\n' +
                           'rwx rwx rwx\n' +
                           '│││ │││ │││\n' +
                           '│││ │││ └─ Others (o)\n' +
                           '│││ └─── Group (g)\n' +
                           '└─────── Owner (u)\n\n' +
                           'r = read (4), w = write (2), x = execute (1)\n\n' +
                           'Common Commands:\n' +
                           'chmod 755 file.sh - Owner: rwx, Group/Others: rx\n' +
                           'chmod u+x file.sh - Add execute for owner\n' +
                           'chmod g-w file.txt - Remove write for group\n' +
                           'chmod 644 file.txt - Owner: rw, Group/Others: r\n\n' +
                           'Try: tutorial files, tutorial text, tutorial system';
                    
                case 'text':
                    return '📝 TEXT PROCESSING TUTORIAL\n\n' +
                           '1. Viewing Files:\n' +
                           '   cat file.txt - Display entire file\n' +
                           '   head -n 10 file.txt - First 10 lines\n' +
                           '   tail -n 5 file.txt - Last 5 lines\n' +
                           '   less file.txt - Interactive viewer\n\n' +
                           '2. Searching Text:\n' +
                           '   grep "pattern" file.txt - Find lines\n' +
                           '   grep -i "pattern" file.txt - Case insensitive\n' +
                           '   grep -r "pattern" directory/ - Recursive search\n\n' +
                           '3. Text Manipulation:\n' +
                           '   sort file.txt - Sort lines\n' +
                           '   uniq file.txt - Remove duplicates\n' +
                           '   cut -d: -f1 file.txt - Extract first field\n' +
                           '   wc -l file.txt - Count lines\n\n' +
                           'Try: tutorial files, tutorial permissions, tutorial system';
                    
                case 'system':
                    return '⚙️ SYSTEM ADMINISTRATION TUTORIAL\n\n' +
                           '1. Process Management:\n' +
                           '   ps aux - List all processes\n' +
                           '   top - Interactive process viewer\n' +
                           '   htop - Enhanced process viewer\n' +
                           '   kill 1234 - Kill process by PID\n' +
                           '   killall firefox - Kill all firefox processes\n' +
                           '   jobs - List background jobs\n' +
                           '   fg %1 - Bring job to foreground\n' +
                           '   bg %1 - Send job to background\n\n' +
                           '2. System Information:\n' +
                           '   df -h - Disk usage\n' +
                           '   free -m - Memory usage\n' +
                           '   uptime - System uptime\n' +
                           '   uname -a - System information\n' +
                           '   lscpu - CPU information\n' +
                           '   lsblk - Block devices\n' +
                           '   lspci - PCI devices\n' +
                           '   lsusb - USB devices\n\n' +
                           '3. User Management:\n' +
                           '   whoami - Current user\n' +
                           '   id - User and group IDs\n' +
                           '   groups - User groups\n' +
                           '   sudo command - Run as root\n' +
                           '   su - Switch user\n' +
                           '   passwd - Change password\n' +
                           '   adduser username - Add new user\n\n' +
                           '4. Service Management:\n' +
                           '   systemctl status service - Check service status\n' +
                           '   systemctl start service - Start service\n' +
                           '   systemctl stop service - Stop service\n' +
                           '   systemctl restart service - Restart service\n' +
                           '   systemctl enable service - Enable auto-start\n\n' +
                           'Try: tutorial files, tutorial permissions, tutorial text, tutorial network';
                    
                case 'network':
                    return '🌐 NETWORK ADMINISTRATION TUTORIAL\n\n' +
                           '1. Network Information:\n' +
                           '   ip addr - Show network interfaces\n' +
                           '   ip route - Show routing table\n' +
                           '   netstat -tulpn - Show network connections\n' +
                           '   ss -tulpn - Modern network connections\n' +
                           '   ifconfig - Network interface configuration\n' +
                           '   iwconfig - Wireless interface configuration\n\n' +
                           '2. Connectivity Testing:\n' +
                           '   ping host - Test connectivity\n' +
                           '   traceroute host - Trace network path\n' +
                           '   mtr host - Network diagnostic tool\n' +
                           '   telnet host port - Test port connectivity\n' +
                           '   nc -zv host port - Netcat port test\n\n' +
                           '3. Remote Access:\n' +
                           '   ssh user@host - Secure shell connection\n' +
                           '   scp file user@host:/path - Secure copy\n' +
                           '   rsync -av source/ dest/ - Sync files\n' +
                           '   wget url - Download files\n' +
                           '   curl -O url - Download with curl\n\n' +
                           '4. Network Security:\n' +
                           '   iptables -L - List firewall rules\n' +
                           '   ufw status - Ubuntu firewall status\n' +
                           '   nmap host - Network scanner\n' +
                           '   tcpdump -i eth0 - Network packet capture\n\n' +
                           'Try: tutorial files, tutorial permissions, tutorial text, tutorial system';
                    
                default:
                    return '📚 LINUX LEARNING TUTORIALS\n\n' +
                           'Available tutorials:\n' +
                           '  tutorial files - File management\n' +
                           '  tutorial permissions - File permissions\n' +
                           '  tutorial text - Text processing\n' +
                           '  tutorial system - System administration\n' +
                           '  tutorial network - Network administration\n\n' +
                           'Example: tutorial files';
            }
        },
        
        examples: (args: string[]) => {
            const command = args[0]?.toLowerCase() || 'general';
            switch (command) {
                case 'ls':
                    return '📁 LS COMMAND EXAMPLES\n\n' +
                           'ls - Basic listing\n' +
                           'ls -la - Detailed listing with hidden files\n' +
                           'ls -lh - Human readable file sizes\n' +
                           'ls -lt - Sort by modification time\n' +
                           'ls -R - Recursive listing\n' +
                           'ls *.txt - List only .txt files\n' +
                           'ls -d */ - List only directories\n\n' +
                           'Try: examples grep, examples find, examples chmod';
                    
                case 'grep':
                    return '🔍 GREP COMMAND EXAMPLES\n\n' +
                           'grep "pattern" file.txt - Find pattern in file\n' +
                           'grep -i "pattern" file.txt - Case insensitive\n' +
                           'grep -r "pattern" directory/ - Recursive search\n' +
                           'grep -n "pattern" file.txt - Show line numbers\n' +
                           'grep -v "pattern" file.txt - Invert match\n' +
                           'grep -c "pattern" file.txt - Count matches\n' +
                           'ls -la | grep "txt" - Pipe with ls\n\n' +
                           'Try: examples ls, examples find, examples chmod';
                    
                case 'find':
                    return '🔎 FIND COMMAND EXAMPLES\n\n' +
                           'find . -name "*.txt" - Find .txt files\n' +
                           'find /home -type d -name "projects" - Find directories\n' +
                           'find . -size +100M - Find large files\n' +
                           'find . -mtime -7 - Files modified in last 7 days\n' +
                           'find . -user john - Files owned by john\n' +
                           'find . -exec rm {} \\; - Delete found files\n' +
                           'find . -name "*.log" -delete - Delete .log files\n\n' +
                           'Try: examples ls, examples grep, examples chmod';
                    
                case 'chmod':
                    return '🔐 CHMOD COMMAND EXAMPLES\n\n' +
                           'chmod 755 script.sh - Owner: rwx, Others: rx\n' +
                           'chmod 644 file.txt - Owner: rw, Others: r\n' +
                           'chmod 600 private.txt - Owner: rw only\n' +
                           'chmod u+x script.sh - Add execute for owner\n' +
                           'chmod g-w file.txt - Remove write for group\n' +
                           'chmod o-r file.txt - Remove read for others\n' +
                           'chmod -R 755 directory/ - Recursive permissions\n\n' +
                           'Try: examples ls, examples grep, examples find, examples ssh';
                    
                case 'ssh':
                    return '🔑 SSH COMMAND EXAMPLES\n\n' +
                           'ssh user@host - Connect to remote host\n' +
                           'ssh -p 2222 user@host - Connect on specific port\n' +
                           'ssh -i key.pem user@host - Use specific key file\n' +
                           'ssh -X user@host - Enable X11 forwarding\n' +
                           'ssh -L 8080:localhost:80 user@host - Local port forwarding\n' +
                           'ssh -R 8080:localhost:80 user@host - Remote port forwarding\n' +
                           'ssh-copy-id user@host - Copy public key to host\n\n' +
                           'Try: examples ls, examples grep, examples find, examples chmod';
                    
                case 'docker':
                    return '🐳 DOCKER COMMAND EXAMPLES\n\n' +
                           'docker run -it ubuntu - Run interactive Ubuntu container\n' +
                           'docker ps -a - List all containers\n' +
                           'docker images - List all images\n' +
                           'docker build -t myapp . - Build image from Dockerfile\n' +
                           'docker exec -it container bash - Execute command in container\n' +
                           'docker logs container - Show container logs\n' +
                           'docker-compose up -d - Start services in background\n\n' +
                           'Try: examples ls, examples grep, examples find, examples chmod';
                    
                case 'git':
                    return '📦 GIT COMMAND EXAMPLES\n\n' +
                           'git init - Initialize repository\n' +
                           'git clone url - Clone repository\n' +
                           'git add file - Stage file for commit\n' +
                           'git commit -m "message" - Commit changes\n' +
                           'git push origin main - Push to remote\n' +
                           'git pull origin main - Pull from remote\n' +
                           'git branch feature - Create new branch\n' +
                           'git checkout branch - Switch branch\n' +
                           'git merge branch - Merge branch\n' +
                           'git log --oneline - Show commit history\n\n' +
                           'Try: examples ls, examples grep, examples find, examples chmod';
                    
                default:
                    return '💡 COMMAND EXAMPLES\n\n' +
                           'Available examples:\n' +
                           '  examples ls - ls command examples\n' +
                           '  examples grep - grep command examples\n' +
                           '  examples find - find command examples\n' +
                           '  examples chmod - chmod command examples\n' +
                           '  examples ssh - ssh command examples\n' +
                           '  examples docker - docker command examples\n' +
                           '  examples git - git command examples\n\n' +
                           'Example: examples ls';
            }
        },
        
        cheatsheet: (args: string[]) => {
            const category = args[0]?.toLowerCase() || 'general';
            switch (category) {
                case 'files':
                    return '📁 FILE OPERATIONS CHEATSHEET\n\n' +
                           'Create:    touch file.txt\n' +
                           'Read:      cat file.txt\n' +
                           'Edit:      nano file.txt\n' +
                           'Copy:      cp file.txt backup.txt\n' +
                           'Move:      mv old.txt new.txt\n' +
                           'Delete:    rm file.txt\n' +
                           'List:      ls -la\n' +
                           'Find:      find . -name "*.txt"\n' +
                           'Search:    grep "pattern" file.txt\n' +
                           'Count:     wc -l file.txt\n\n' +
                           'Try: cheatsheet permissions, cheatsheet system';
                    
                case 'permissions':
                    return '🔐 PERMISSIONS CHEATSHEET\n\n' +
                           'Read:      r (4)\n' +
                           'Write:     w (2)\n' +
                           'Execute:   x (1)\n\n' +
                           'Common:\n' +
                           '755:       rwxr-xr-x (executable)\n' +
                           '644:       rw-r--r-- (readable)\n' +
                           '600:       rw------- (private)\n' +
                           '777:       rwxrwxrwx (all)\n\n' +
                           'Commands:\n' +
                           'chmod 755 file\n' +
                           'chmod u+x file\n' +
                           'chmod g-w file\n\n' +
                           'Try: cheatsheet files, cheatsheet system';
                    
                case 'system':
                    return '⚙️ SYSTEM CHEATSHEET\n\n' +
                           'Processes:\n' +
                           'ps aux     - List processes\n' +
                           'top        - Monitor processes\n' +
                           'htop       - Enhanced monitor\n' +
                           'kill 1234  - Kill process\n' +
                           'jobs       - Background jobs\n' +
                           'fg %1      - Foreground job\n\n' +
                           'System Info:\n' +
                           'df -h      - Disk usage\n' +
                           'free -m    - Memory usage\n' +
                           'uptime     - System uptime\n' +
                           'whoami     - Current user\n' +
                           'lscpu      - CPU info\n' +
                           'lsblk      - Block devices\n\n' +
                           'Services:\n' +
                           'systemctl status service - Service status\n' +
                           'systemctl start service  - Start service\n' +
                           'systemctl stop service   - Stop service\n' +
                           'systemctl restart service - Restart service\n\n' +
                           'Try: cheatsheet files, cheatsheet permissions, cheatsheet network';
                    
                case 'network':
                    return '🌐 NETWORK CHEATSHEET\n\n' +
                           'Connectivity:\n' +
                           'ping host      - Test connection\n' +
                           'traceroute host - Trace path\n' +
                           'telnet host port - Test port\n' +
                           'nc -zv host port - Netcat test\n\n' +
                           'Remote Access:\n' +
                           'ssh user@host  - SSH connection\n' +
                           'scp file dest  - Secure copy\n' +
                           'rsync -av src/ dest/ - Sync files\n' +
                           'wget url       - Download file\n' +
                           'curl -O url    - Download with curl\n\n' +
                           'Network Info:\n' +
                           'ip addr        - Network interfaces\n' +
                           'ip route       - Routing table\n' +
                           'netstat -tulpn - Network connections\n' +
                           'ss -tulpn      - Modern connections\n\n' +
                           'Try: cheatsheet files, cheatsheet permissions, cheatsheet system';
                    
                case 'docker':
                    return '🐳 DOCKER CHEATSHEET\n\n' +
                           'Containers:\n' +
                           'docker run -it image - Run container\n' +
                           'docker ps -a   - List containers\n' +
                           'docker exec -it container bash - Execute\n' +
                           'docker logs container - Show logs\n' +
                           'docker stop container - Stop container\n' +
                           'docker rm container - Remove container\n\n' +
                           'Images:\n' +
                           'docker images - List images\n' +
                           'docker build -t name . - Build image\n' +
                           'docker pull image - Pull image\n' +
                           'docker push image - Push image\n' +
                           'docker rmi image - Remove image\n\n' +
                           'Compose:\n' +
                           'docker-compose up -d - Start services\n' +
                           'docker-compose down - Stop services\n' +
                           'docker-compose logs - Show logs\n' +
                           'docker-compose ps - List services\n\n' +
                           'Try: cheatsheet files, cheatsheet permissions, cheatsheet system';
                    
                case 'git':
                    return '📦 GIT CHEATSHEET\n\n' +
                           'Repository:\n' +
                           'git init       - Initialize repo\n' +
                           'git clone url  - Clone repo\n' +
                           'git remote -v  - Show remotes\n' +
                           'git status     - Show status\n\n' +
                           'Commits:\n' +
                           'git add file   - Stage file\n' +
                           'git commit -m "msg" - Commit\n' +
                           'git push origin main - Push\n' +
                           'git pull origin main - Pull\n\n' +
                           'Branches:\n' +
                           'git branch     - List branches\n' +
                           'git branch name - Create branch\n' +
                           'git checkout branch - Switch\n' +
                           'git merge branch - Merge\n\n' +
                           'History:\n' +
                           'git log --oneline - Commit history\n' +
                           'git diff       - Show changes\n' +
                           'git reset HEAD~1 - Undo commit\n\n' +
                           'Try: cheatsheet files, cheatsheet permissions, cheatsheet system';
                    
                default:
                    return '📋 LINUX CHEATSHEETS\n\n' +
                           'Available cheatsheets:\n' +
                           '  cheatsheet files - File operations\n' +
                           '  cheatsheet permissions - File permissions\n' +
                           '  cheatsheet system - System administration\n' +
                           '  cheatsheet network - Network administration\n' +
                           '  cheatsheet docker - Docker commands\n' +
                           '  cheatsheet git - Git commands\n\n' +
                           'Example: cheatsheet files';
            }
        },
        
        man: (args: string[]) => {
            const command = args[0]?.toLowerCase() || 'help';
            switch (command) {
                case 'ls':
                    return '📖 LS MANUAL PAGE\n\n' +
                           'NAME\n   ls - list directory contents\n\n' +
                           'SYNOPSIS\n   ls [OPTION]... [FILE]...\n\n' +
                           'DESCRIPTION\n   List information about the FILEs (the current directory by default).\n\n' +
                           'OPTIONS\n   -a, --all\n          do not ignore entries starting with .\n\n' +
                           '   -l     use a long listing format\n\n' +
                           '   -h, --human-readable\n          with -l, print sizes in human readable format\n\n' +
                           'EXAMPLES\n   ls -la\n   ls -lh\n   ls *.txt\n\n' +
                           'Try: man grep, man find, man chmod';
                    
                case 'grep':
                    return '📖 GREP MANUAL PAGE\n\n' +
                           'NAME\n   grep - print lines matching a pattern\n\n' +
                           'SYNOPSIS\n   grep [OPTIONS] PATTERN [FILE...]\n\n' +
                           'DESCRIPTION\n   grep searches for PATTERN in each FILE.\n\n' +
                           'OPTIONS\n   -i, --ignore-case\n          ignore case distinctions\n\n' +
                           '   -r, --recursive\n          read all files under each directory\n\n' +
                           '   -n, --line-number\n          print line number with output\n\n' +
                           'EXAMPLES\n   grep "error" log.txt\n   grep -i "warning" *.log\n   grep -rn "function" src/\n\n' +
                           'Try: man ls, man find, man chmod';
                    
                case 'find':
                    return '📖 FIND MANUAL PAGE\n\n' +
                           'NAME\n   find - search for files in a directory hierarchy\n\n' +
                           'SYNOPSIS\n   find [PATH] [EXPRESSION]\n\n' +
                           'DESCRIPTION\n   find searches the directory tree rooted at each given file name.\n\n' +
                           'EXPRESSIONS\n   -name PATTERN\n          base of file name matches PATTERN\n\n' +
                           '   -type TYPE\n          file is of type TYPE (d=directory, f=file)\n\n' +
                           '   -size SIZE\n          file uses SIZE units of space\n\n' +
                           'EXAMPLES\n   find . -name "*.txt"\n   find /home -type d\n   find . -size +100M\n\n' +
                           'Try: man ls, man grep, man chmod';
                    
                case 'chmod':
                    return '📖 CHMOD MANUAL PAGE\n\n' +
                           'NAME\n   chmod - change file mode bits\n\n' +
                           'SYNOPSIS\n   chmod [OPTION]... MODE[,MODE]... FILE...\n\n' +
                           'DESCRIPTION\n   chmod changes the file mode bits of each given file.\n\n' +
                           'MODES\n   u     user (owner)\n   g     group\n   o     other\n   a     all\n\n' +
                           'OPERATORS\n   +     add permission\n   -     remove permission\n   =     set permission\n\n' +
                           'EXAMPLES\n   chmod 755 script.sh\n   chmod u+x file.sh\n   chmod g-w file.txt\n\n' +
                           'Try: man ls, man grep, man find, man ssh';
                    
                case 'ssh':
                    return '📖 SSH MANUAL PAGE\n\n' +
                           'NAME\n   ssh - OpenSSH SSH client (remote login program)\n\n' +
                           'SYNOPSIS\n   ssh [-46AaCfGgKkMNnqsTtVvXxYy] [-B bind_interface]\n   ssh [-46AaCfGgKkMNnqsTtVvXxYy] [-b bind_address]\n\n' +
                           'DESCRIPTION\n   ssh (SSH client) is a program for logging into a remote machine\n   and for executing commands on a remote machine.\n\n' +
                           'OPTIONS\n   -p port\n          Port to connect to on the remote host\n\n' +
                           '   -i identity_file\n          Selects a file from which the identity (private key)\n          for public key authentication is read\n\n' +
                           '   -X     Enables X11 forwarding\n\n' +
                           'EXAMPLES\n   ssh user@host\n   ssh -p 2222 user@host\n   ssh -i key.pem user@host\n\n' +
                           'Try: man ls, man grep, man find, man chmod';
                    
                case 'docker':
                    return '📖 DOCKER MANUAL PAGE\n\n' +
                           'NAME\n   docker - Docker command line interface\n\n' +
                           'SYNOPSIS\n   docker [OPTIONS] COMMAND [ARG...]\n\n' +
                           'DESCRIPTION\n   Docker is a platform for developers and sysadmins to develop,\n   deploy, and run applications with containers.\n\n' +
                           'COMMANDS\n   run     Run a command in a new container\n   ps      List containers\n   images  List images\n   build   Build an image from a Dockerfile\n   exec    Run a command in a running container\n   logs    Fetch the logs of a container\n\n' +
                           'EXAMPLES\n   docker run -it ubuntu\n   docker ps -a\n   docker build -t myapp .\n\n' +
                           'Try: man ls, man grep, man find, man chmod';
                    
                case 'git':
                    return '📖 GIT MANUAL PAGE\n\n' +
                           'NAME\n   git - the stupid content tracker\n\n' +
                           'SYNOPSIS\n   git [--version] [--help] [-C <path>] [-c <name>=<value>]\n   git <command> [<args>]\n\n' +
                           'DESCRIPTION\n   Git is a fast, scalable, distributed revision control system\n   with an unusually rich command set.\n\n' +
                           'COMMANDS\n   init    Create an empty Git repository\n   clone   Clone a repository into a new directory\n   add     Add file contents to the index\n   commit  Record changes to the repository\n   push    Update remote refs along with associated objects\n   pull    Fetch from and integrate with another repository\n\n' +
                           'EXAMPLES\n   git init\n   git clone https://github.com/user/repo.git\n   git add file.txt\n   git commit -m "Initial commit"\n\n' +
                           'Try: man ls, man grep, man find, man chmod';
                    
                default:
                    return '📖 MANUAL PAGES\n\n' +
                           'Available manual pages:\n' +
                           '  man ls - ls command manual\n' +
                           '  man grep - grep command manual\n' +
                           '  man find - find command manual\n' +
                           '  man chmod - chmod command manual\n' +
                           '  man ssh - ssh command manual\n' +
                           '  man docker - docker command manual\n' +
                           '  man git - git command manual\n\n' +
                           'Example: man ls';
            }
        },
        
        learn: () => {
            return '🎓 LINUX LEARNING RESOURCES\n\n' +
                   'Available learning commands:\n' +
                   '  tutorial [topic] - Interactive tutorials\n' +
                   '  examples [cmd] - Command examples\n' +
                   '  cheatsheet [cat] - Quick reference\n' +
                   '  man [cmd] - Manual pages\n\n' +
                   'Tutorials available:\n' +
                   '  tutorial files - File management\n' +
                   '  tutorial permissions - File permissions\n' +
                   '  tutorial text - Text processing\n' +
                   '  tutorial system - System administration\n' +
                   '  tutorial network - Network administration\n\n' +
                   'Examples available:\n' +
                   '  examples ls, examples grep, examples find, examples chmod\n' +
                   '  examples ssh, examples docker, examples git\n\n' +
                   'Cheatsheets available:\n' +
                   '  cheatsheet files, cheatsheet permissions, cheatsheet system\n' +
                   '  cheatsheet network, cheatsheet docker, cheatsheet git\n\n' +
                   'Manual pages available:\n' +
                   '  man ls, man grep, man find, man chmod\n' +
                   '  man ssh, man docker, man git\n\n' +
                   'Example: tutorial files';
        }
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
        
        // Periodic check to fix empty terminal (every 5 seconds)
        setInterval(() => {
            this.checkAndFixEmptyTerminal();
        }, 5000);
        
        document.title = 'Linux App - Ready!';
    }

    public initTerminal(): void {
        // Ensure terminal elements are available
        if (!this.terminalContent || !this.terminalBody) {
            console.error('Terminal elements not found during initTerminal');
            return;
        }
        
        // Clear any existing content to ensure clean state
        if (this.terminalContent) {
            this.terminalContent.innerHTML = '';
        }
        
        // Show welcome message when terminal is selected from start menu
        this.showWelcomeMessage();
        
        // Ensure terminal is focused
        setTimeout(() => {
            this.terminalBody?.focus();
        }, 100);
    }
    
    public checkAndFixEmptyTerminal(): void {
        // Only check if terminal tab is visible (has active class)
        const terminalTab = document.getElementById('terminal');
        if (!terminalTab || !terminalTab.classList.contains('active')) {
            return; // Terminal tab is not visible, don't add content
        }
        
        // Check if terminal is empty and fix it
        if (this.terminalContent && this.terminalContent.innerHTML.trim() === '') {
            console.log('Terminal is empty, reinitializing...');
            this.showWelcomeMessage();
        }
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
        
        // Add a prompt after showing terminal challenge
        this.addPrompt();
        
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
        this.addOutput('  rpg    - Switch to RPG game');
        this.addOutput('  puzzle - Switch to Puzzle game');
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
                    // Ctrl+C: Copy current input to clipboard
                    if (this.currentInput.trim()) {
                        (window as any).terminalClipboard = this.currentInput;
                        this.addOutput(`Copied "${this.currentInput}" to clipboard`);
                    } else {
                        // If no input, show interrupt signal
                        this.addOutput('^C');
                    }
                    this.currentInput = '';
                    this.addPrompt();
                    break;
                case 'v':
                    // Ctrl+V: Paste from clipboard
                    const clipboard = (window as any).terminalClipboard;
                    if (clipboard) {
                        this.currentInput += clipboard;
                        this.updateCurrentLine();
                    } else {
                        this.addOutput('Clipboard is empty');
                    }
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
    
    // Hide all tab content
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.classList.remove('btn-active');
    });
    
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
    
    // Allow switching to other games from RPG mode
    const cmd = command.toLowerCase().trim();
    if (cmd === 'commandrace' || cmd === 'puzzle') {
        // Exit RPG mode first
        rpgMode = false;
        (window as any).rpgMode = false;
        globalTerminalApp.addOutput('Exiting RPG mode...');
        globalTerminalApp.addOutput('');
        // Execute the new game command
        globalTerminalApp.executeCommand(cmd);
        return;
    }
    
    switch (cmd) {
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
            globalTerminalApp.addOutput('  commandrace - Switch to Command Race game');
            globalTerminalApp.addOutput('  puzzle - Switch to Puzzle game');
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
    
    // Allow switching to other games from Command Race mode
    if (cmd === 'rpg' || cmd === 'puzzle') {
        // Clear any countdown timer
        if (commandRaceCountdownTimer) {
            clearTimeout(commandRaceCountdownTimer);
            commandRaceCountdownTimer = null;
        }
        
        // Exit Command Race mode first
        commandRaceMode = false;
        (window as any).commandRaceMode = false;
        commandRaceState = 'waiting';
        globalTerminalApp.addOutput('Exiting Command Race mode...');
        globalTerminalApp.addOutput('');
        // Execute the new game command
        globalTerminalApp.executeCommand(cmd);
        return;
    }
    
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
            globalTerminalApp.addOutput('Type "start" to begin the race, or switch games with "rpg"/"puzzle", or "quit" to exit.');
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

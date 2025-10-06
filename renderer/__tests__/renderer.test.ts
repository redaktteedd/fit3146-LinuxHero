// Mock the puzzles module first
jest.mock('../common/puzzles', () => ({
  loadReadPuzzle: jest.fn()
}));

import { TerminalApp } from '../main/renderer';

import { loadReadPuzzle } from '../common/puzzles';
const mockLoadReadPuzzle = loadReadPuzzle as jest.MockedFunction<typeof loadReadPuzzle>;

describe('TerminalApp', () => {
  let terminalApp: TerminalApp;
  let mockTerminalContent: HTMLElement;
  let mockTerminalBody: HTMLElement;

  beforeEach(() => {
    // Create mock DOM elements
    mockTerminalContent = document.createElement('div');
    mockTerminalContent.className = 'terminal-content';
    
    mockTerminalBody = document.createElement('div');
    mockTerminalBody.className = 'terminal-body';
    mockTerminalBody.appendChild(mockTerminalContent);

    // Mock document.querySelector
    jest.spyOn(document, 'querySelector').mockImplementation((selector: string) => {
      if (selector === '.terminal-content') return mockTerminalContent;
      if (selector === '.terminal-body') return mockTerminalBody;
      return null;
    });

    // Mock document.querySelectorAll for terminal lines
    jest.spyOn(document, 'querySelectorAll').mockReturnValue([] as any);

    terminalApp = new TerminalApp();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize terminal elements', () => {
      terminalApp.init();

      expect(mockTerminalBody.tabIndex).toBe(0);
      expect(mockTerminalBody.style.outline).toBe('none');
      expect(document.title).toBe('Terminal App - Ready!');
    });

    it('should handle missing terminal elements', () => {
      jest.spyOn(document, 'querySelector').mockReturnValue(null);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const newTerminalApp = new TerminalApp();
      newTerminalApp.init();

      expect(consoleSpy).toHaveBeenCalledWith('Terminal elements not found');
      consoleSpy.mockRestore();
    });
  });

  describe('Command Execution', () => {
    beforeEach(() => {
      terminalApp.init();
    });

    it('should execute help command', () => {
      const result = terminalApp['executeCommand']('help');
      expect(result).toContain('Available commands');
      expect(result).toContain('help');
      expect(result).toContain('puzzle');
    });

    it('should execute clear command', () => {
      const result = terminalApp['executeCommand']('clear');
      expect(result).toBe('');
      expect(mockTerminalContent.innerHTML).toBe('');
    });

    it('should execute echo command', () => {
      const result = terminalApp['executeCommand']('echo hello world');
      expect(result).toBe('hello world');
    });

    it('should execute date command', () => {
      const result = terminalApp['executeCommand']('date');
      expect(result).toMatch(/\w{3} \w{3} \d{2} \d{4}/); // Date format
    });

    it('should execute whoami command', () => {
      const result = terminalApp['executeCommand']('whoami');
      expect(result).toBe('user');
    });

    it('should execute pwd command', () => {
      const result = terminalApp['executeCommand']('pwd');
      expect(result).toBe('/home/user');
    });

    it('should handle unknown command', () => {
      const result = terminalApp['executeCommand']('unknown');
      expect(result).toContain('Command not found: unknown');
    });

    it('should handle empty command', () => {
      const result = terminalApp['executeCommand']('');
      expect(result).toBe('');
    });
  });

  describe('Puzzle Commands', () => {
    beforeEach(() => {
      terminalApp.init();
    });

    it('should start puzzle successfully', async () => {
      const mockPuzzle = {
        description: 'Test puzzle',
        files: [
          { name: 'clue1.txt', content: 'FIT' },
          { name: 'clue2.txt', content: '3146' },
          { name: 'clue3.txt', content: 'SECRET' }
        ],
        solution: ['FIT', '3146', 'SECRET']
      };

      mockLoadReadPuzzle.mockResolvedValue(mockPuzzle);

      const result = terminalApp['executeCommand']('puzzle');
      expect(result).toBe('Loading puzzle...\nPlease wait...');

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockLoadReadPuzzle).toHaveBeenCalled();
    });

    it('should handle puzzle loading error', async () => {
      mockLoadReadPuzzle.mockRejectedValue(new Error('Failed to load'));

      const result = terminalApp['executeCommand']('puzzle');
      expect(result).toBe('Loading puzzle...\nPlease wait...');

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockLoadReadPuzzle).toHaveBeenCalled();
    });

    it('should prevent starting puzzle when one is already active', async () => {
      const mockPuzzle = {
        description: 'Test puzzle',
        files: [],
        solution: ['TEST']
      };

      mockLoadReadPuzzle.mockResolvedValue(mockPuzzle);

      // Start first puzzle
      terminalApp['executeCommand']('puzzle');
      await new Promise(resolve => setTimeout(resolve, 0));

      // Try to start second puzzle
      const result = terminalApp['executeCommand']('puzzle');
      expect(result).toBe('A puzzle is already active! Use "solve <answer>" to submit your answer.');
    });
  });

  describe('File Commands', () => {
    beforeEach(() => {
      terminalApp.init();
    });

    it('should list files when no puzzle is active', () => {
      const result = terminalApp['executeCommand']('ls');
      expect(result).toContain('total 8');
      expect(result).toContain('.bashrc');
      expect(result).toContain('.bash_history');
    });

    it('should list puzzle files when puzzle is active', async () => {
      const mockPuzzle = {
        description: 'Test puzzle',
        files: [
          { name: 'clue1.txt', content: 'FIT' },
          { name: 'clue2.txt', content: '3146' }
        ],
        solution: ['FIT', '3146']
      };

      mockLoadReadPuzzle.mockResolvedValue(mockPuzzle);
      terminalApp['executeCommand']('puzzle');
      await new Promise(resolve => setTimeout(resolve, 0));

      const result = terminalApp['executeCommand']('ls');
      expect(result).toContain('total 8');
      expect(result).toContain('clue1.txt');
      expect(result).toContain('clue2.txt');
    });

    it('should read puzzle file content', async () => {
      const mockPuzzle = {
        description: 'Test puzzle',
        files: [
          { name: 'clue1.txt', content: 'The first part is: FIT' }
        ],
        solution: ['FIT']
      };

      mockLoadReadPuzzle.mockResolvedValue(mockPuzzle);
      terminalApp['executeCommand']('puzzle');
      await new Promise(resolve => setTimeout(resolve, 0));

      const result = terminalApp['executeCommand']('cat clue1.txt');
      expect(result).toBe('The first part is: FIT');
    });

    it('should handle reading non-existent file', async () => {
      const mockPuzzle = {
        description: 'Test puzzle',
        files: [
          { name: 'clue1.txt', content: 'FIT' }
        ],
        solution: ['FIT']
      };

      mockLoadReadPuzzle.mockResolvedValue(mockPuzzle);
      terminalApp['executeCommand']('puzzle');
      await new Promise(resolve => setTimeout(resolve, 0));

      const result = terminalApp['executeCommand']('cat nonexistent.txt');
      expect(result).toBe('cat: nonexistent.txt: No such file or directory');
    });

    it('should handle cat command without filename', async () => {
      const mockPuzzle = {
        description: 'Test puzzle',
        files: [],
        solution: ['TEST']
      };

      mockLoadReadPuzzle.mockResolvedValue(mockPuzzle);
      terminalApp['executeCommand']('puzzle');
      await new Promise(resolve => setTimeout(resolve, 0));

      const result = terminalApp['executeCommand']('cat');
      expect(result).toBe('cat: missing file operand\nTry "ls" to see available files.');
    });

    it('should handle cat command when no puzzle is active', () => {
      const result = terminalApp['executeCommand']('cat test.txt');
      expect(result).toBe('No puzzle is active! Type "puzzle" to start one.');
    });
  });

  describe('Solve Command', () => {
    beforeEach(() => {
      terminalApp.init();
    });

    it('should solve puzzle with correct answer', async () => {
      const mockPuzzle = {
        description: 'Test puzzle',
        files: [],
        solution: ['FIT', '3146', 'SECRET']
      };

      mockLoadReadPuzzle.mockResolvedValue(mockPuzzle);
      terminalApp['executeCommand']('puzzle');
      await new Promise(resolve => setTimeout(resolve, 0));

      const result = terminalApp['executeCommand']('solve FIT3146SECRET');
      expect(result).toBe('✓ Correct! Well done!\nRedirecting to next page...');
    });

    it('should reject incorrect answer', async () => {
      const mockPuzzle = {
        description: 'Test puzzle',
        files: [],
        solution: ['FIT', '3146', 'SECRET']
      };

      mockLoadReadPuzzle.mockResolvedValue(mockPuzzle);
      terminalApp['executeCommand']('puzzle');
      await new Promise(resolve => setTimeout(resolve, 0));

      const result = terminalApp['executeCommand']('solve WRONG');
      expect(result).toBe('✗ Wrong! Try reading all the clue files carefully.\nHint: Combine the parts you find in the correct order.');
    });

    it('should handle solve command without answer', async () => {
      const mockPuzzle = {
        description: 'Test puzzle',
        files: [],
        solution: ['TEST']
      };

      mockLoadReadPuzzle.mockResolvedValue(mockPuzzle);
      terminalApp['executeCommand']('puzzle');
      await new Promise(resolve => setTimeout(resolve, 0));

      const result = terminalApp['executeCommand']('solve');
      expect(result).toBe('Usage: solve <answer>\nExample: solve FIT3146SECRET');
    });

    it('should handle solve command when no puzzle is active', () => {
      const result = terminalApp['executeCommand']('solve TEST');
      expect(result).toBe('No puzzle is active! Type "puzzle" to start one.');
    });
  });

  describe('Output Management', () => {
    it('should add output to terminal', () => {
      terminalApp.init();
      terminalApp.addOutput('Test output');

      // Should have 2 children: the prompt line and the output
      expect(mockTerminalContent.children).toHaveLength(2);
      expect(mockTerminalContent.children[1]?.textContent).toBe('Test output');
      expect(mockTerminalContent.children[1]?.className).toBe('terminal-output');
    });

    it('should not add empty output', () => {
      terminalApp.init();
      terminalApp.addOutput('');

      // Should only have the prompt line, no output added
      expect(mockTerminalContent.children).toHaveLength(1);
      expect(mockTerminalContent.children[0]?.className).toBe('terminal-line');
    });

    it('should handle null terminal content', () => {
      jest.spyOn(document, 'querySelector').mockReturnValue(null);
      const terminalApp = new TerminalApp();
      
      // Should not throw error
      expect(() => terminalApp.addOutput('test')).not.toThrow();
    });
  });
});

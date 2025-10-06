import { loadFile, loadReadPuzzle, File, Puzzle } from '../common/puzzles';

// Mock fetch
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('Puzzle Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loadFile', () => {
    it('should load a puzzle file successfully', async () => {
      const mockContent = 'The first part of the code is: FIT';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue(mockContent)
      } as any);

      const result = await loadFile('clue1.txt');

      expect(mockFetch).toHaveBeenCalledWith('file:///mock/path/assets/puzzles/clue1.txt');
      expect(result).toEqual({
        name: 'clue1.txt',
        content: mockContent
      });
    });

    it('should throw error when file is not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      } as any);

      await expect(loadFile('nonexistent.txt')).rejects.toThrow('HTTP error! status: 404');
    });

    it('should throw error when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(loadFile('clue1.txt')).rejects.toThrow('Network error');
    });
  });

  describe('loadReadPuzzle', () => {
    it('should load all puzzle files and create puzzle object', async () => {
      const mockFiles = [
        { name: 'clue1.txt', content: 'The first part of the code is: FIT' },
        { name: 'clue2.txt', content: 'The second part is: 3146' },
        { name: 'clue3.txt', content: 'The final part is: SECRET\nCombine all parts to form the code!' }
      ];

      mockFiles.forEach((file, index) => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          text: jest.fn().mockResolvedValue(file.content)
        } as any);
      });

      const result = await loadReadPuzzle();

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(mockFetch).toHaveBeenCalledWith('file:///mock/path/assets/puzzles/clue1.txt');
      expect(mockFetch).toHaveBeenCalledWith('file:///mock/path/assets/puzzles/clue2.txt');
      expect(mockFetch).toHaveBeenCalledWith('file:///mock/path/assets/puzzles/clue3.txt');

      expect(result).toEqual({
        description: "Read the files to find the secret code. Use 'ls' to list files and 'cat' to read them.",
        files: mockFiles,
        solution: ["FIT", "3146", "SECRET"]
      });
    });

    it('should handle partial file loading failure', async () => {
      // First file succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue('The first part of the code is: FIT')
      } as any);

      // Second file fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      } as any);

      await expect(loadReadPuzzle()).rejects.toThrow('HTTP error! status: 404');
    });
  });

  describe('Puzzle Interface', () => {
    it('should have correct structure', () => {
      const puzzle: Puzzle = {
        description: 'Test puzzle',
        files: [
          { name: 'test.txt', content: 'test content' }
        ],
        solution: ['TEST', 'SOLUTION']
      };

      expect(puzzle.description).toBe('Test puzzle');
      expect(puzzle.files).toHaveLength(1);
      expect(puzzle.files[0]).toEqual({ name: 'test.txt', content: 'test content' });
      expect(puzzle.solution).toEqual(['TEST', 'SOLUTION']);
    });
  });

  describe('File Interface', () => {
    it('should have correct structure', () => {
      const file: File = {
        name: 'test.txt',
        content: 'test content'
      };

      expect(file.name).toBe('test.txt');
      expect(file.content).toBe('test content');
    });
  });
});

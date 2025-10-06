export interface File{
    name: string,
    content: string
}

export interface Puzzle{
    description: string,
    files: File[]
    solution: string[]
}

//Function to load a file from the assets/puzzles directory
export async function loadFile(filename: string): Promise<File>{
    try {
        const response = await fetch(`file://${process.cwd()}/assets/puzzles/${filename}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.text();
        return {name: filename, content: data};
    } catch (error) {
        console.error('Error fetching the puzzle:', error);
        throw error;
    }
}

//Function to create a puzzle
export async function loadReadPuzzle(): Promise<Puzzle>{
    const files = await Promise.all([loadFile("clue1.txt"), loadFile("clue2.txt"), loadFile("clue3.txt")]);
    return {
        description: "Read the files to find the secret code. Use 'ls' to list files and 'cat' to read them.",
        files: files,
        solution: ["FIT", "3146", "SECRET"]
    };
}
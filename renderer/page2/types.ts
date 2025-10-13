export interface Package {
    name: string;
    description: string;
    icon: string;
    installed: boolean;
    isTarget: boolean;
}

export interface TerminalCommand {
    (args: string[]): string;
}

export interface TerminalCommands {
    [key: string]: TerminalCommand;
}


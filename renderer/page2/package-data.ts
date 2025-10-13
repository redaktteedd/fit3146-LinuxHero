import { Package } from './types.js';
import { formatOutput } from '../common/helper.js';

export const PACKAGES: Package[] = [
    {
        name: 'ubdecode',
        description: 'Ubuntu decoder utility for decrypting encrypted files',
        icon: '🔓',
        installed: false,
        isTarget: true
    },
    {
        name: 'gimp',
        description: 'GNU Image Manipulation Program for photo editing',
        icon: '🎨',
        installed: false,
        isTarget: false
    },
    {
        name: 'curl',
        description: 'Command-line tool for transferring data with URLs',
        icon: '🌐',
        installed: true,
        isTarget: false
    },
    {
        name: 'nano',
        description: 'Simple text editor for the terminal',
        icon: '📝',
        installed: true,
        isTarget: false
    },
    {
        name: 'firefox',
        description: 'Mozilla Firefox web browser',
        icon: '🦊',
        installed: false,
        isTarget: false
    },
    {
        name: 'vlc',
        description: 'VLC media player for audio and video files',
        icon: '🎵',
        installed: false,
        isTarget: false
    },
    {
        name: 'git',
        description: 'Distributed version control system',
        icon: '📦',
        installed: true,
        isTarget: false
    }
];

export const SECRET_MESSAGE = formatOutput([
    "🎉 Success! You've installed ubdecode and decrypted the file!",
    "",
    "Decrypted message: 'FIT3146_LINUX_HERO_CHALLENGE_COMPLETED'",
    "",
    "You've mastered Ubuntu package management!"
]);

export const WELCOME_MESSAGE = formatOutput([
    "Terminal Quest: Software & Package Hunt",
    "",
    "📁 You've found an encrypted file — to decode it, you must install the missing tool: ubdecode.",
    "",
    "⚠️  Package not found. Run updates or check installed software.",
    "",
    "Type 'help' for available commands."
]);


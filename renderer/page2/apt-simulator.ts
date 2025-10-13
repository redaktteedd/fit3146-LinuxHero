import { Package } from './types.js';
import { formatOutput } from '../common/helper.js';

export class AptSimulator {
    constructor(private packages: Package[]) {}

    update(): string {
        return formatOutput([
            'Hit:1 http://archive.ubuntu.com/ubuntu focal InRelease',
            'Hit:2 http://archive.ubuntu.com/ubuntu focal-updates InRelease',
            'Hit:3 http://archive.ubuntu.com/ubuntu focal-backports InRelease',
            'Hit:4 http://security.ubuntu.com/ubuntu focal-security InRelease',
            'Reading package lists... Done',
            'Building dependency tree... Done',
            'Reading state information... Done',
            'All packages are up to date.'
        ]);
    }

    install(packageName: string): string {
        const pkg = this.packages.find(p => p.name === packageName);
        if (!pkg) {
            return formatOutput([
                `Package '${packageName}' not found`,
                `Try: apt search ${packageName}`
            ]);
        }

        if (pkg.installed) {
            return formatOutput([
                `${packageName} is already the newest version (1.0-1).`,
                '0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.'
            ]);
        }

        pkg.installed = true;

        return formatOutput([
            'Reading package lists... Done',
            'Building dependency tree... Done',
            'Reading state information... Done',
            'The following NEW packages will be installed:',
            `  ${packageName}`,
            '0 upgraded, 1 newly installed, 0 to remove and 0 not upgraded.',
            'Need to get 0 B/2.5 MB of archives.',
            'After this operation, 5.2 MB of additional disk space will be used.',
            `Get:1 http://archive.ubuntu.com/ubuntu focal/main amd64 ${packageName} amd64 1.0-1 [2.5 MB]`,
            'Fetched 2.5 MB in 2s (1,250 kB/s)',
            `Selecting previously unselected package ${packageName}.`,
            '(Reading database ... 185,000 files and directories currently installed.)',
            `Preparing to unpack .../${packageName}_1.0-1_amd64.deb ...`,
            `Unpacking ${packageName} (1.0-1) ...`,
            `Setting up ${packageName} (1.0-1) ...`,
            'Processing triggers for man-db (2.9.1-1) ...',
            `✓ ${packageName} successfully installed!`
        ]);
    }

    remove(packageName: string): string {
        const pkg = this.packages.find(p => p.name === packageName);
        if (!pkg || !pkg.installed) {
            return formatOutput([
                `Package '${packageName}' is not installed, so not removed`,
                '0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.'
            ]);
        }

        pkg.installed = false;

        return formatOutput([
            'Reading package lists... Done',
            'Building dependency tree... Done',
            'Reading state information... Done',
            'The following packages will be REMOVED:',
            `  ${packageName}`,
            '0 upgraded, 0 newly installed, 1 to remove and 0 not upgraded.',
            'After this operation, 5.2 MB disk space will be freed.',
            '(Reading database ... 185,001 files and directories currently installed.)',
            `Removing ${packageName} (1.0-1) ...`,
            'Processing triggers for man-db (2.9.1-1) ...',
            `✓ ${packageName} successfully removed!`
        ]);
    }

    listInstalled(): string {
        const installedPackages = this.packages.filter(p => p.installed);
        const lines = ['Listing... Done'];
        installedPackages.forEach(pkg => {
            lines.push(`${pkg.name}/focal,now 1.0-1 amd64 [installed]`);
        });
        return formatOutput(lines);
    }

    search(term: string): string {
        const matchingPackages = this.packages.filter(p =>
            p.name.toLowerCase().includes(term.toLowerCase()) ||
            p.description.toLowerCase().includes(term.toLowerCase())
        );

        if (matchingPackages.length === 0) {
            return `No packages found matching '${term}'`;
        }

        const lines = ['Sorting... Done', 'Full Text Search... Done'];
        matchingPackages.forEach(pkg => {
            const status = pkg.installed ? '[installed]' : '';
            lines.push(`${pkg.name}/focal 1.0-1 amd64 ${status}`);
            lines.push(`  ${pkg.description}`);
            lines.push('');
        });
        return formatOutput(lines).trim();
    }

    show(packageName: string): string {
        const pkg = this.packages.find(p => p.name === packageName);
        if (!pkg) {
            return formatOutput([
                `Package: ${packageName}`,
                'Status: not found',
                'Version: -',
                'Priority: -',
                'Section: -',
                'Maintainer: -',
                'Architecture: -',
                'Source: -',
                'Description: Package not found'
            ]);
        }

        return formatOutput([
            `Package: ${pkg.name}`,
            'Version: 1.0-1',
            'Priority: optional',
            'Section: misc',
            'Maintainer: Ubuntu Developers <ubuntu-devel-discuss@lists.ubuntu.com>',
            'Architecture: amd64',
            `Source: ${pkg.name}`,
            `Description: ${pkg.description}`,
            ` This package provides ${pkg.name} utility.`,
            `Homepage: https://example.com/${pkg.name}`,
            'Original-Maintainer: Ubuntu Developers <ubuntu-devel-discuss@lists.ubuntu.com>',
            `Bugs: https://bugs.launchpad.net/ubuntu/+source/${pkg.name}`,
            'Installed-Size: 5.2 MB',
            'Depends: libc6 (>= 2.14)',
            'Download-Size: 2.5 MB',
            'APT-Sources: http://archive.ubuntu.com/ubuntu focal/main amd64 Packages',
            `Description-md5: ${Math.random().toString(36).substring(2, 15)}`
        ]);
    }

    dpkgList(): string {
        const installedPackages = this.packages.filter(p => p.installed);
        const lines = [
            'Desired=Unknown/Install/Remove/Purge/Hold',
            '| Status=Not/Inst/Conf-files/Unpacked/halF-conf/Half-inst/trig-aWait/Trig-pend',
            '|/ Err?=(none)/Reinst-required (Status,Err: uppercase=bad)',
            '||/ Name           Version      Architecture Description',
            '+++-==============-============-============-===================='
        ];

        installedPackages.forEach(pkg => {
            lines.push(`ii  ${pkg.name.padEnd(14)} 1.0-1        amd64        ${pkg.description}`);
        });

        return formatOutput(lines);
    }
}


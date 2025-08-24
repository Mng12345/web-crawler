#!/usr/bin/env node
import { URL } from 'url';
export declare function buildIgnoreSet(opts: {
    ignoreJs?: boolean;
    ignoreCss?: boolean;
    ignoreImage?: boolean;
    ignoreVideo?: boolean;
    ignoreAudio?: boolean;
}): Set<string>;
/**
 * 检查 URL 是否满足 basePath 与 domain 限制
 */
export declare function isAllowed(url: URL, basePath: string, domain: string): boolean;
export declare function parseBasePath(url: string): string;
export declare function parseDomain(url: string): string;
export declare function extractLinks(base: URL, html: string, ignoreSet: Set<string>, basePath: string, domain: string): string[];
export declare function urlToFilePath(rootDir: string, url: URL): string;
export declare function fetchAndSave(url: URL, rootDir: string, visited: Set<string>, ignoreSet: Set<string>, basePath: string, domain: string): Promise<void>;
/**
 * 递归复制目录下的所有文件到新目录，文件名格式为「全路径_文件名」
 * @param srcDir 源目录
 * @param destDir 目标目录
 */
export declare function copyFilesWithFullPathName(srcDir: string, destDir: string): Promise<void>;
export declare function getOriginDir(outDir: string): Promise<string>;
export declare function getFlattenDir(outDir: string): Promise<string>;
//# sourceMappingURL=lib.d.ts.map
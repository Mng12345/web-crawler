#!/usr/bin/env node
import axios, {} from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import pLimit from 'p-limit';
import * as fse from 'fs-extra';
import { Command } from 'commander';
// ------------------------------
// 配置
// ------------------------------
const CONCURRENCY = 8; // 并发量
const TIMEOUT = 10_000; // 请求超时
const USER_AGENT = 'Mozilla/5.0 (compatible; SimpleCrawler/1.0)';
// 需要忽略的资源后缀（小写）
const IGNORE_EXTENSIONS = {
    js: ['.js', '.mjs', '.cjs'],
    css: ['.css', '.scss', '.sass', '.less'],
    image: [
        '.png',
        '.jpg',
        '.jpeg',
        '.gif',
        '.webp',
        '.svg',
        '.ico',
        '.bmp',
        '.tiff',
    ],
    video: ['.mp4', '.mov', '.avi', '.mkv', '.flv', '.webm', '.3gp', '.wmv'],
    audio: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a'],
    xml: ['.xml'],
};
// 根据 CLI 参数生成一个 Set<小写后缀>
export function buildIgnoreSet(opts) {
    const set = new Set();
    Object.keys(IGNORE_EXTENSIONS).forEach((k) => {
        if (opts[`ignore${k.charAt(0).toUpperCase()}${k.slice(1)}`]) {
            IGNORE_EXTENSIONS[k]?.forEach((ext) => set.add(ext));
        }
    });
    return set;
}
/**
 * 检查 URL 是否满足 basePath 与 domain 限制
 */
export function isAllowed(url, basePath, domain) {
    if (domain && url.hostname !== domain)
        return false;
    if (basePath && !url.pathname.startsWith(basePath))
        return false;
    return true;
}
// ------------------------------
// 工具
// ------------------------------
const limit = pLimit(CONCURRENCY);
export function parseBasePath(url) {
    const parsedUrl = new URL(url);
    let basePath = parsedUrl.pathname;
    if (!basePath.startsWith('/')) {
        basePath = `/${basePath}`;
    }
    if (!basePath.endsWith('/')) {
        basePath = `${basePath}/`;
    }
    return basePath;
}
export function parseDomain(url) {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
}
export function extractLinks(base, html, ignoreSet, basePath, domain) {
    const $ = cheerio.load(html);
    const links = [];
    $('a[href]').each((_, el) => {
        let href = $(el).attr('href');
        if (!href)
            return;
        try {
            const resolved = new URL(href, base.href);
            // 协议限制
            if (!/^https?:$/.test(resolved.protocol))
                return;
            // 忽略后缀
            const pathname = resolved.pathname.toLowerCase();
            if ([...ignoreSet].some((ext) => pathname.endsWith(ext)))
                return;
            // 新增：basePath / domain 限制
            if (!isAllowed(resolved, basePath, domain))
                return;
            links.push(resolved.href);
        }
        catch {
            /* ignore */
        }
    });
    return [...new Set(links)];
}
// 把 URL 映射到本地文件路径
export function urlToFilePath(rootDir, url) {
    let pathname = url.pathname;
    if (pathname.endsWith('/'))
        pathname += 'index';
    if (!path.extname(pathname))
        pathname += '.html';
    pathname = pathname.replace(/^\/+/, ''); // 去掉前缀 /
    return path.join(rootDir, url.hostname, pathname);
}
// 写文件，自动创建目录
function writeFileAtomic(filePath, data) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, data);
}
// ------------------------------
// 主逻辑
// ------------------------------
export async function fetchAndSave(url, rootDir, visited, ignoreSet, basePath, domain) {
    if (visited.has(url.href))
        return;
    visited.add(url.href);
    const filePath = urlToFilePath(rootDir, url);
    if (fs.existsSync(filePath))
        return;
    try {
        const res = await limit(() => axios.get(url.href, {
            timeout: TIMEOUT,
            headers: { 'User-Agent': USER_AGENT },
            responseType: 'text',
            maxRedirects: 10,
        }));
        writeFileAtomic(filePath, res.data);
        console.log('✅', url.href, '→', path.relative(process.cwd(), filePath));
        const links = extractLinks(url, res.data, ignoreSet, basePath, domain);
        await Promise.all(links.map((link) => fetchAndSave(new URL(link), rootDir, visited, ignoreSet, basePath, domain).catch(() => { })));
    }
    catch (err) {
        console.warn('❌', url.href, err.message || err);
    }
}
/**
 * 递归复制目录下的所有文件到新目录，文件名格式为「全路径_文件名」
 * @param srcDir 源目录
 * @param destDir 目标目录
 */
export async function copyFilesWithFullPathName(srcDir, destDir) {
    // 确保目标目录存在
    await fse.ensureDir(destDir);
    // 递归读取目录
    const files = await fsp.readdir(srcDir, { withFileTypes: true });
    for (const file of files) {
        const srcPath = path.join(srcDir, file.name);
        if (file.isDirectory()) {
            // 递归处理子目录
            await copyFilesWithFullPathName(srcPath, destDir);
        }
        else {
            // 构造新文件名：将完整路径中的斜杠替换为下划线，并拼接文件名
            const relativePath = path.relative(process.cwd(), srcPath);
            const newFileName = relativePath.replace(/[/\\]/g, '_');
            const destPath = path.join(destDir, newFileName);
            await fsp.copyFile(srcPath, destPath);
            console.log(`Copied: ${srcPath} -> ${destPath}`);
        }
    }
}
async function fileExists(filePath) {
    try {
        await fsp.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
export async function getOriginDir(outDir) {
    if (!(await fileExists('./output'))) {
        await fsp.mkdir('./output', { recursive: true });
    }
    return path.resolve(path.join('output', outDir, 'origin'));
}
export async function getFlattenDir(outDir) {
    if (!(await fileExists('./output'))) {
        await fsp.mkdir('./output', { recursive: true });
    }
    return path.resolve(path.join('output', outDir, 'flatten'));
}
//# sourceMappingURL=lib.js.map
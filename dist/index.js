#!/usr/bin/env node
import { Command } from "commander";
import { buildIgnoreSet, copyFilesWithFullPathName, fetchAndSave, getFlattenDir, getOriginDir, isAllowed, parseBasePath, parseDomain } from "./lib.js";
async function main() {
    const program = new Command();
    program
        .name('crawler')
        .description('Simple recursive web crawler')
        .showHelpAfterError(true)
        .argument('<start-url>', 'initial URL to crawl')
        .option('-o, --out-dir <dir>', 'output directory', 'output')
        .option('--base-path <path>', 'only crawl URLs under this path (e.g. /docs)')
        .option('--domain <domain>', 'only crawl URLs under this domain (e.g. example.com)')
        .option('--ignore-js', 'ignore JavaScript files')
        .option('--ignore-css', 'ignore CSS files')
        .option('--ignore-image', 'ignore image files')
        .option('--ignore-video', 'ignore video files')
        .option('--ignore-audio', 'ignore audio files')
        .action(async (startUrlStr, opts) => {
        const ignoreSet = buildIgnoreSet(opts);
        const originDir = await getOriginDir(opts.outDir);
        const flattenDir = await getFlattenDir(opts.outDir);
        const startUrl = new URL(startUrlStr);
        const visited = new Set();
        const basePath = opts.basePath && opts.basePath.startsWith('/')
            ? opts.basePath
            : parseBasePath(startUrlStr);
        // 规范化 domain：去掉协议和端口
        const domain = opts.domain
            ? parseDomain(`http://${opts.domain}`)
            : parseDomain(startUrlStr);
        // 起始 URL 本身必须满足规则
        if (!isAllowed(startUrl, basePath, domain)) {
            console.error('起始 URL 不满足 --base-path 或 --domain 限制，程序退出。');
            process.exit(1);
        }
        console.log(`🚀 开始抓取 ${startUrl.href} → ${originDir}`);
        await fetchAndSave(startUrl, originDir, visited, ignoreSet, basePath, domain);
        console.log(`🚀 开始复制 ${originDir} → ${flattenDir}`);
        await copyFilesWithFullPathName(originDir, flattenDir);
        console.log('🎉 抓取完成');
    });
    await program.parseAsync();
}
main().catch(console.error);
//# sourceMappingURL=index.js.map
function noteToMd(blockData) {
    let mdOutput = '';
    blockData.blocks.forEach((block, index) => {
        if (block.type == 'header') {
            if (block.data.level == 1) {
                mdOutput += `# ${block.data.text}`; 
            } else if (block.data.level == 2) {
                mdOutput += `## ${block.data.text}`; 
            } else if (block.data.level == 3) {
                mdOutput += `### ${block.data.text}`; 
            } else if (block.data.level == 4) {
                mdOutput += `#### ${block.data.text}`; 
            } else if (block.data.level == 5) {
                mdOutput += `##### ${block.data.text}`; 
            } else if (block.data.level == 6) {
                mdOutput += `###### ${block.data.text}`; 
            }
        } else if (block.type == 'list') {
            let outputObj = { mdOutput };
            parseBlockNestedList(block.data.items, block.data.style == 'ordered', outputObj);
            mdOutput = outputObj.mdOutput;
            if (mdOutput.charAt(mdOutput.length - 1) == '\n') {
                mdOutput = mdOutput.slice(0, -1);
            }
        } else if (block.type == 'image') {
            mdOutput += `![${block.data.caption}](${block.data.url} "${block.data.caption}")`;
            // mdOutput += `![${block.data.caption}](${block.data.url} ${block.data.stretched ? '=425x350' : '=300x200'} "${block.data.caption}")`;
        } else if (block.type == 'checklist') {
            block.data.items.forEach(item => {
                mdOutput += `- ${item.checked ? '[x]' : '[ ]'} ${item.text}\n`
            });
        } else if (block.type == 'breakLine' && block.data.divider) {
            mdOutput += mdOutput.slice(-2) == '\n\n' ? '---' : '\n---';
        } else if (block.type == 'code') {
            const langRe = /%([^%]+)%/;
            const matches = block.data.code.match(langRe);
            mdOutput += `\`\`\`${matches ? matches[1] : ''}\n${block.data.code.replace(langRe, '')}\n\`\`\``
        } else {
            mdOutput += block.data.text ? block.data.text : '';
        }
        mdOutput += (index == blockData.blocks.length - 1) ? '' : '\n';
    });
    mdEditor.value = mdOutput;
    renderPreview(mdOutput);
    return mdOutput;
}

async function mdToNote(mdData) {
    await blockEditor.isReady;
    blockEditor.clear();
    let lines = mdData.split('\n');
    // let lines = [];
    // let line = '';
    // let prevCh = '';
    // let newLineCount = 0;
    // for (let i = 0; i < mdData.length; i++) {
    //     let ch = mdData.charAt(i);
    //     if (ch == '\n') {
    //         if (prevCh != '\n' || newLineCount <= 2) {
    //             lines.push(line);
    //             line = '';
    //         }
    //         newLineCount++;
    //     } else {
    //         line += ch;
    //     }
    //     prevCh = ch;
    // }

    let blockPosition = 0;
    let hasCommand = false;
    let itemsObject = [];
    let checklistItems = [];
    let blockData = {};
    let headerLevel, listStyle, isChecked;
    let codeBlock = '';
    let isCodeBlock = false;
    let blockType = 'paragraph';
    let prevBlockType = 'paragraph';
    const ulRegex = /^(\t*)(?:-)$/;
    const olRegex = /^(\t*)[0-9]*\.$/;
    lines.forEach((line, index) => {
        if (index == lines.length - 1 && line.length == 0) return;
        let tokens = line.split(' ');
        let ulMatch = tokens[0].match(ulRegex);
        let olMatch = tokens[0].match(olRegex);
        let numberOfTabs = 0;

        let url, caption, stretched;
        if (tokens.length > 0 && tokens[0].length > 0 && tokens[0][0] == '!') {
            let imgRegex1 = /!\[.*\]\([^)]+\s*=\s*\d+x\d+\s*"[^"]*"\)/;
            let imgRegex2 = /\!\[([^\]]+)\]\(([^"]+)(?: "([^"]+)")?\)/;
            let imgRegex3 = /\!\[([^\]]+)\]\(([^)]+)\)/;
            if (imgRegex1.test(line) || imgRegex2.test(line) || imgRegex3.test(line)) {
                blockType = 'image';
                const extractRe = /!\[([^[\]]*)\]\(([^)]+)\s*(?:=\s*(\d+x\d+))?\s*(?:"([^"]*)")?\)/g;
                let matches;
                while ((matches = extractRe.exec(line)) !== null) {
                    caption = matches[1]
                    url = matches[2];
                    // stretched = matches[3] ? false : true;
                    stretched = false;
                    caption = matches[4] || caption || "No title";
                }
            }
        } else if (tokens[0] == '#') {
            blockType = 'header';
            headerLevel = 1;
            hasCommand = true;
        } else if (tokens[0] == '##') {
            blockType = 'header';
            headerLevel = 2;
            hasCommand = true;
        } else if (tokens[0] == '###') {
            blockType = 'header';
            headerLevel = 3;
            hasCommand = true;
        } else if (tokens[0] == '####') {
            blockType = 'header';
            headerLevel = 4;
            hasCommand = true;
        } else if (tokens[0] == '#####') {
            blockType = 'header';
            headerLevel = 5;
            hasCommand = true;
        } else if (tokens[0] == '######') {
            blockType = 'header';
            headerLevel = 6;
            hasCommand = true;
        } else if (tokens[0] == '---') {
            blockType = 'breakLine';
            hasCommand = true;
        } else if (ulMatch) {
            numberOfTabs = ulMatch[1].length;
            if (numberOfTabs == 0) {
                if (tokens[1] == '[x]') {
                    blockType = 'checklist';
                    isChecked = true;
                } else if (tokens[1] == '[' && tokens[2] == ']') {
                    blockType = 'checklist';
                    isChecked = false;
                } else {
                    blockType = 'list';
                    listStyle = 'unordered';
                }
            } else {
                blockType = 'list';
                listStyle = 'unordered';
            }
            hasCommand = true;
        } else if (olMatch) {
            numberOfTabs = olMatch[1].length;
            blockType = 'list';
            listStyle = 'ordered';
            hasCommand = true;
        } else if (/```(\b\w+\b)?/.test(line)) {
            isCodeBlock = !isCodeBlock;
            blockType = 'code';
            hasCommand = true;
        } else {
            hasCommand = false;
        }

       if (hasCommand) {
           tokens.shift();
           line = tokens.join(' ');
        }
        
        if (blockType == 'header') {
            blockData.text = line;
            blockData.level = headerLevel;
        } else if (blockType == 'list') {
            try {
                parseMdNestedList(line, itemsObject, numberOfTabs);
            } catch (e) {
                console.log(line, itemsObject, e);
                throw e;
            }
            blockData.items = itemsObject;
            blockData.style = listStyle;
        } else if (blockType == 'checklist') {
            tokens.shift();
            if (!isChecked) {
                tokens.shift();
            }
            line = tokens.join(' ');
            checklistItems.push({
                text: line,
                checked: isChecked
            });
            blockData.items = checklistItems;
        } else if (blockType == 'image') {
            blockData.caption = caption;
            blockData.url = url;
        } else if (blockType == 'breakLine') {
            blockData.divider = true;
        } else {
            if (isCodeBlock) {
                codeBlock += (codeBlock.length > 0 ? '\n' : '') + line;
                blockData = { code: codeBlock };
            } else {
                blockData = { text: line };
            }
        }
        
        if ((blockType == 'list' && prevBlockType == 'list') || (blockType == 'checklist' && prevBlockType == 'checklist') || (blockType != 'code' && isCodeBlock)) {
            let bi = blockEditor.blocks.getCurrentBlockIndex();
            let blockInstance = blockEditor.blocks.getBlockByIndex(bi);
            blockEditor.blocks.update(blockInstance.id, blockData);
        } else {
            if (blockType != 'code' || (blockType =='code' && isCodeBlock)) {
                blockEditor.blocks.insert(blockType, blockData, {}, blockPosition, true);
                blockPosition++;
                blockData = {};
                if (blockType != 'list' && blockType != 'checklist') {
                    itemsObject = [];
                    checklistItems = [];
                }
            }
        }
        if (!isCodeBlock) {
            codeBlock = '';
        }
        headerLevel = null;
        hasCommand = false;
        numberOfTabs = 0;
        prevBlockType = blockType;
        blockType = 'paragraph';
    });
    return await blockEditor.save();
}

function parseBlockNestedList(items, isOrdered, op, level = 0) {
    if (items.length == 0) {
        return;
    }
    level++;
    items.forEach((item, index) => {
        let listSymbol = '-';
        if (isOrdered) {
            listSymbol = (index + 1) + '.';
        }
        op.mdOutput += `${'\t'.repeat(level - 1)}${listSymbol} ${item.content}\n`;
        // op.mdOutput += `${'\t'.repeat(level - 1)}${listSymbol} ${item.content}${(index == items.length - 1) ? (level == 1 ? '' : '\n') : '\n'}`;
        parseBlockNestedList(item.items, isOrdered, op, level);
    });
}

function parseMdNestedList(line, itemsObject, numberOfTabs) {
    if (numberOfTabs == 0) {
        itemsObject.push({
            content: line,
            items: []
        });
        return itemsObject;
    }
    return parseMdNestedList(line, itemsObject[itemsObject.length - 1].items, --numberOfTabs);
}

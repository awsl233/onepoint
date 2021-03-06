'use strict';
const { Msg, formatDate } = require('../utils/msgutils');
const { SharePoint } = require('../lib/sharepointAPI');
const { mime } = require('../utils/nodeutils');

let sharepoint;

exports.ls = ls;
async function ls(path) {
    try {
        let data = await sharepoint.spListData(path);
        if (data.Row.length > 0) {//文件夹
            let content = [];
            data.Row.forEach(e => {
                content.push({
                    type: Number(e['FSObjType']),
                    name: e['LinkFilename'],
                    size: Number(e['SMTotalFileStreamSize']),
                    mime: Number(e['FSObjType']) ? mime.getType(e['LinkFilename']) : 'folder/sharepoint',
                    time: formatDate(e['SMLastModifiedDate'])
                });
            });
            return Msg.list(content);
        } else {//文件 或 空文件夹
            let info = await sharepoint.spGetItemInfo(data.CurrentFolderSpItemUrl);
            if (!info.file) return Msg.list([]);//空文件夹
            return Msg.file({
                type: 0,
                name: info['name'],
                size: info['size'],
                mime: info['file']['mimeType'],
                time: formatDate(info['lastModifiedDateTime'])
            }, info['@content.downloadUrl']);
        }
    } catch (error) {
        //console.log(error);
        if (error.response && error.response.status === 404) return Msg.info(404);
        else throw error;
    }
}
exports.func = async (spConfig, cache, event) => {
    sharepoint = new SharePoint(spConfig['shareUrl']);
    await sharepoint.init();
    let root = spConfig.root || '';
    let p2 = root + event.splitPath.p2;
    switch (event.cmd) {
        case 'ls':
            return await ls(p2);
        default:
            return Msg.info(400, "No such cmd");
    }
}
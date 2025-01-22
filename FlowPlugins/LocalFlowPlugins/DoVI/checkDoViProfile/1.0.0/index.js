"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
var details = function () { return ({
    name: 'Check DoVi Profile',
    description: 'Check Dolby Vision profile of video',
    style: {
        borderColor: 'orange',
    },
    tags: 'video',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: 'faQuestion',
    inputs: [],
    outputs: [
        {
            number: 1,
            tooltip: 'Dolby Vision Profile 4',
        },
        {
            number: 2,
            tooltip: 'Dolby Vision Profile 5',
        },
        {
            number: 3,
            tooltip: 'Dolby Vision Profile 7 with 1 stream',
        },
        {
            number: 4,
            tooltip: 'Dolby Vision Profile 7 with 2 streams',
        },
        {
            number: 5,
            tooltip: 'Dolby Vision Profile 8',
        },
    ],
}); };
exports.details = details;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var plugin = function (args) {
    var _a, _b;
    var lib = require('../../../../../methods/lib')();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-param-reassign
    args.inputs = lib.loadDefaultValues(args.inputs, details);
    var outputNum = -1;
    var vsCount = 0;
    if ((_b = (_a = args.inputFileObj) === null || _a === void 0 ? void 0 : _a.mediaInfo) === null || _b === void 0 ? void 0 : _b.track) {
        args.inputFileObj.mediaInfo.track.forEach(function (stream) {
            if (stream['@type'].toLowerCase() === 'general') {
                vsCount = +stream.VideoCount;
            }
            else if (stream['@type'].toLowerCase() === 'video') {
                if (stream.hasOwnProperty('HDR_Format_Profile')) {
                    var r = /dvhe\.0(.).*/;
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    var m = r.exec(stream.HDR_Format_Profile);
                    if (m) {
                        switch (m[1]) {
                            case '4':
                                outputNum = 1;
                                break;
                            case '5':
                                outputNum = 2;
                                break;
                            case '7':
                                if (vsCount === 1) {
                                    outputNum = 3;
                                }
                                else {
                                    outputNum = 4;
                                }
                                break;
                            case '8':
                                outputNum = 5;
                                break;
                            default:
                                break;
                        }
                    }
                }
            }
        });
    }
    else {
        throw new Error('Failed to identify DV profile');
    }
    if (outputNum === -1) {
        throw new Error('Failed to identify DV profile');
    }
    return {
        outputFileObj: args.inputFileObj,
        outputNumber: outputNum,
        variables: args.variables,
    };
};
exports.plugin = plugin;

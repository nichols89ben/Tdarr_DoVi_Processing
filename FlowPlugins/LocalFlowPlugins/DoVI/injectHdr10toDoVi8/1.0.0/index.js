"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var cliUtils_1 = require("../../../../FlowHelpers/1.0.0/cliUtils");
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");

var details = function () { return ({
    name: 'Inject HDR10+ as DoVi P8',
    description: 'Generate Dolby Vision RPU from HDR10+ metadata and inject it',
    style: {
        borderColor: 'orange',
    },
    tags: 'video',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: '',
    inputs: [],
    outputs: [
        {
            number: 1,
            tooltip: 'Continue to next plugin',
        },
    ],
}); };
exports.details = details;

var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, injectWorkDir, extractWorkDir, baseName, metaFilePath, rpuBinPath, extraJsonPath, blHevcPath, outHevcPath, shellCmd1, cli1, res1, shellCmd2, cli2, res2, shellCmd3, cli3, res3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                // Load defaults
                lib = require('../../../../../methods/lib')();
                args.inputs = lib.loadDefaultValues(args.inputs, details);

                // We keep separate directories to avoid confusion, but
                // note the extracted HDR10+ metadata is in 'hdr10plus_tool'
                extractWorkDir = "".concat(args.workDir, "/hdr10plus_tool");
                injectWorkDir = "".concat(args.workDir, "/hdr10plus_inject");

                // Make sure injection directory exists
                args.deps.fsextra.ensureDirSync(injectWorkDir);

                // Derive file names
                baseName = (0, fileUtils_1.getFileName)(args.originalLibraryFile._id);

                // Path to the JSON file created by the "Extract HDR10+ Metadata" plugin
                // That plugin placed it in 'extractWorkDir'
                metaFilePath = "".concat(extractWorkDir, "/").concat(baseName, "_hdr10plus_metadata.json");

                // We'll store everything else in the injection folder
                rpuBinPath = "".concat(injectWorkDir, "/").concat(baseName, ".rpu.bin");
                extraJsonPath = "".concat(injectWorkDir, "/extra.json");
                blHevcPath = "".concat(injectWorkDir, "/").concat(baseName, "_BL.hevc");
                outHevcPath = "".concat(injectWorkDir, "/").concat(baseName, "_BL_RPU.hevc");

                // Create a minimal extra.json if needed
                args.deps.fsextra.writeFileSync(extraJsonPath, JSON.stringify({
                    cm_version: "V29",
                    length: 100000,
                    level6: {
                        max_display_mastering_luminance: 1000,
                        min_display_mastering_luminance: 1,
                        max_content_light_level: 1000,
                        max_frame_average_light_level: 500
                    }
                }, null, 2));

                // 1) Extract base layer to BL.hevc
                shellCmd1 = "ffmpeg -i \"".concat(args.inputFileObj.file, "\" -y -loglevel error -stats -map 0:v:0 -c:v copy -vbsf hevc_mp4toannexb -f hevc \"").concat(blHevcPath, "\"");
                cli1 = new cliUtils_1.CLI({
                    cli: '/bin/sh',
                    spawnArgs: ['-c', shellCmd1],
                    spawnOpts: {},
                    jobLog: args.jobLog,
                    outputFilePath: blHevcPath,
                    inputFileObj: args.inputFileObj,
                    logFullCliOutput: args.logFullCliOutput,
                    updateWorker: args.updateWorker
                });
                return [4 /*yield*/, cli1.runCli()];
            case 1:
                res1 = _a.sent();
                if (res1.cliExitCode !== 0) {
                    args.jobLog('Failed creating BL.hevc');
                    throw new Error('ffmpeg failed');
                }

                // 2) Generate RPU from HDR10+ JSON
                shellCmd2 = "/usr/local/bin/dovi_tool generate -j \"".concat(extraJsonPath, "\" --hdr10plus-json \"").concat(metaFilePath, "\" -o \"").concat(rpuBinPath, "\"");
                cli2 = new cliUtils_1.CLI({
                    cli: '/bin/sh',
                    spawnArgs: ['-c', shellCmd2],
                    spawnOpts: {},
                    jobLog: args.jobLog,
                    outputFilePath: rpuBinPath,
                    inputFileObj: args.inputFileObj,
                    logFullCliOutput: args.logFullCliOutput,
                    updateWorker: args.updateWorker
                });
                return [4 /*yield*/, cli2.runCli()];
            case 2:
                res2 = _a.sent();
                if (res2.cliExitCode !== 0) {
                    args.jobLog('Failed generating RPU.bin');
                    throw new Error('dovi_tool generate failed');
                }

                // 3) Inject RPU => DoVi P8
                shellCmd3 = "/usr/local/bin/dovi_tool inject-rpu -i \"".concat(blHevcPath, "\" --rpu-in \"").concat(rpuBinPath, "\" -o \"").concat(outHevcPath, "\"");
                cli3 = new cliUtils_1.CLI({
                    cli: '/bin/sh',
                    spawnArgs: ['-c', shellCmd3],
                    spawnOpts: {},
                    jobLog: args.jobLog,
                    outputFilePath: outHevcPath,
                    inputFileObj: args.inputFileObj,
                    logFullCliOutput: args.logFullCliOutput,
                    updateWorker: args.updateWorker
                });
                return [4 /*yield*/, cli3.runCli()];
            case 3:
                res3 = _a.sent();
                if (res3.cliExitCode !== 0) {
                    args.jobLog('Failed injecting RPU');
                    throw new Error('dovi_tool inject-rpu failed');
                }
                args.logOutcome('tSuc');
                return [2 /*return*/, {
                        outputFileObj: { _id: outHevcPath },
                        outputNumber: 1,
                        variables: args.variables
                    }];
        }
    });
}); };
exports.plugin = plugin;
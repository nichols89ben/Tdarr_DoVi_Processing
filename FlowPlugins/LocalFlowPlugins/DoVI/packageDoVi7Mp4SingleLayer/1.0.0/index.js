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
  return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function () { return this; }), g;
  function verb(n) { return function (v) { return step([n, v]); }; }
  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");
    while (_) try {
      if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] : y.next) && !(t = t.call(y, op[1])).done) return t;
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

var details = function () {
  return {
    name: 'Package DoVi 7 mp4 (Dual > Single-Layer)',
    description: 'Package single-layer DV to MP4 if fallback was missing, else normal P8 mux',
    style: { borderColor: 'orange' },
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
  };
};
exports.details = details;

var plugin = function (args) {
  return __awaiter(void 0, void 0, void 0, function () {
    var lib, pluginWorkDir, outFileName, outFilePath, fallbackMissing, fps, mp4Args, spawnArgs, cli, res;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          lib = require('../../../../../methods/lib')();
          args.inputs = lib.loadDefaultValues(args.inputs, details);
          pluginWorkDir = (0, fileUtils_1.getPluginWorkDir)(args);

          outFileName = (0, fileUtils_1.getFileName)(args.originalLibraryFile._id) + "_dolby.mp4";
          outFilePath = pluginWorkDir + "/" + outFileName;

          fallbackMissing = !!args.variables.fallbackMissing;

          // ✅ Get dynamic FPS
          try {
            const metaFps = args.inputFileObj.meta?.VideoFrameRate;
            fps = metaFps ? `fps=${metaFps}` : 'fps=23.976';
          } catch (e) {
            fps = 'fps=23.976';
          }

          // Build MP4Box add args with or without HDR fallback
          mp4Args = fallbackMissing
            ? `${args.inputFileObj.file}:${fps}:dvp=8.1`
            : `${args.inputFileObj.file}:${fps}:dvp=8.1:dv-cm=hdr10`;

          spawnArgs = [
            '-add',
            mp4Args,
            '-tmp', pluginWorkDir + "/tmp",
            '-brand', 'mp42isom',
            '-ab', 'dby1',
            outFilePath
          ];

          cli = new cliUtils_1.CLI({
            cli: '/usr/local/bin/MP4Box',
            spawnArgs: spawnArgs,
            spawnOpts: {},
            jobLog: args.jobLog,
            outputFilePath: outFilePath,
            inputFileObj: args.inputFileObj,
            logFullCliOutput: args.logFullCliOutput,
            updateWorker: args.updateWorker,
          });

          return [4 /*yield*/, cli.runCli()];
        case 1:
          res = _a.sent();
          if (res.cliExitCode !== 0) {
            args.jobLog('Packaging stream into mp4 failed');
            throw new Error('MP4Box failed');
          }
          args.logOutcome('tSuc');
          return [2 /*return*/, {
            outputFileObj: { _id: outFilePath },
            outputNumber: 1,
            variables: args.variables
          }];
      }
    });
  });
};
exports.plugin = plugin;
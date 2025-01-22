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

/* 
  This plugin injects a previously extracted DoVi 7 RPU into a base HEVC stream 
  or converts a single-stream p7 to p8.
*/

var details = function () { 
  return {
    name: 'Inject DoVi RPU 7',
    description: 'Handles Dolby Vision Profile 7 RPU injection or conversion to Profile 8',
    style: { borderColor: 'orange' },
    tags: 'video',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: '',
    inputs: [],
    outputs: [
      { number: 1, tooltip: 'Continue to next plugin' },
    ],
  };
};
exports.details = details;

var plugin = function (args) { 
  return __awaiter(void 0, void 0, void 0, function () {
    var lib, pluginWorkDir, inputFilePath, rpuFilePath, outFileName, outFilePath, videoStreamCountCmd, probeRes, videoStreamCount, cliString, spawnArgs, cli, res;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          lib = require('../../../../../methods/lib')();
          args.inputs = lib.loadDefaultValues(args.inputs, details);

          pluginWorkDir = args.workDir + "/dovi_tool";
          args.deps.fsextra.ensureDirSync(pluginWorkDir);

          // The input HEVC file we want to inject into
          inputFilePath = args.inputFileObj.file;
          // The RPU metadata from the previous extraction step
          rpuFilePath = pluginWorkDir + "/" + (0, fileUtils_1.getFileName)(args.originalLibraryFile._id) + ".rpu.bin";

          // Our final injected or converted output
          outFileName = (0, fileUtils_1.getFileName)(args.originalLibraryFile._id) + "_rpu_injected.hevc";
          outFilePath = pluginWorkDir + "/" + outFileName;

          // Count video streams to decide between single-stream or dual-stream approach
          videoStreamCountCmd = new cliUtils_1.CLI({
            cli: 'ffprobe',
            spawnArgs: [
              '-v', 'error',
              '-select_streams', 'v',
              '-show_entries', 'stream=index',
              '-of', 'csv=p=0',
              inputFilePath
            ],
            spawnOpts: {},
            jobLog: args.jobLog,
            inputFileObj: args.inputFileObj,
            updateWorker: args.updateWorker
          });
          return [4 /*yield*/, videoStreamCountCmd.runCli()];
        case 1:
          probeRes = _a.sent();
          videoStreamCount = 1;
          if (probeRes.cliExitCode === 0 && probeRes.cliOutput) {
            videoStreamCount = probeRes.cliOutput
              .split('\n')
              .filter(function (line) { return line.trim() !== ''; }).length;
          }

          /*
            If there's only 1 stream (DV p7 single-stream):
              We do a convert step: "dovi_tool -m 2 convert --discard -i input -o output"
            If there are 2 streams:
              We do: "dovi_tool inject-rpu -i BL.hevc --rpu-in RPU.bin -o BL_RPU.hevc"
          */
          if (videoStreamCount === 1) {
            // Single-stream approach => convert p7 to p8
            cliString = "dovi_tool -m 2 convert --discard \"" + inputFilePath + "\" -o \"" + outFilePath + "\"";
          } else {
            // Two-stream approach => inject RPU
            cliString =
              "/usr/local/bin/dovi_tool inject-rpu " +
              "-i \"" + inputFilePath + "\" " +
              "--rpu-in \"" + rpuFilePath + "\" " +
              "-o \"" + outFilePath + "\"";
          }

          // We'll run the resulting command in bash
          spawnArgs = ['-c', cliString];
          cli = new cliUtils_1.CLI({
            cli: '/bin/bash',
            spawnArgs: spawnArgs,
            spawnOpts: {},
            jobLog: args.jobLog,
            outputFilePath: outFilePath,
            inputFileObj: args.inputFileObj,
            logFullCliOutput: args.logFullCliOutput,
            updateWorker: args.updateWorker,
          });
          return [4 /*yield*/, cli.runCli()];
        case 2:
          res = _a.sent();
          if (res.cliExitCode !== 0) {
            args.jobLog('Injecting/Converting DoVi RPU failed');
            throw new Error('dovi_tool failed');
          }
          args.logOutcome('tSuc');
          return [2 /*return*/, {
            outputFileObj: {
              _id: outFilePath
            },
            outputNumber: 1,
            variables: args.variables
          }];
      }
    });
  });
};
exports.plugin = plugin;
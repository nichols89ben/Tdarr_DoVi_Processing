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

// Keep these imports
var cliUtils_1 = require("../../../../FlowHelpers/1.0.0/cliUtils");
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");


var details = function () {
  return {
    name: 'Check HDR10 Fallback Metadata',
    description: 'Flags file as missing fallback if we see cll=0,0 or no mention of SMPTE ST 2086 / MasterDisplay / MaxCLL',
    style: { borderColor: 'orange' },
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
        tooltip: 'HDR10 fallback is present',
      },
      {
        number: 2,
        tooltip: 'Fallback metadata missing',
      },
    ],
  };
};
exports.details = details;

var plugin = function (args) {
  return __awaiter(void 0, void 0, void 0, function () {
    var lib, fallbackOk, mediaInfoTracks, trackIdx, vid, anyMaster, anyCll, anySt2086, rawStr, cllZeroMatches, matchCll, matchFall, matchMasterLuminance, ffProbe, _i, _a, st, metaDisplay, metaCll;
    return __generator(this, function (_b) {
      lib = require('../../../../../methods/lib')();
      args.inputs = lib.loadDefaultValues(args.inputs, details);

      fallbackOk = false;

      // 1) Check MediaInfo
      if (
        args.inputFileObj &&
        args.inputFileObj.mediaInfo &&
        Array.isArray(args.inputFileObj.mediaInfo.track)
      ) {
        mediaInfoTracks = args.inputFileObj.mediaInfo.track;
        for (trackIdx = 0; trackIdx < mediaInfoTracks.length; trackIdx++) {
          vid = mediaInfoTracks[trackIdx];
          if (vid['@type'] && vid['@type'].toLowerCase() === 'video') {
            // Convert the entire track to a single lowercased string
            rawStr = JSON.stringify(vid).toLowerCase();

            // Are we seeing mention of "masteringdisplay" or "mastering display luminance" or "st 2086"?
            anyMaster = /mastering\s?display|masteringdisplay|masteringdisplay_luminance|masteringdisplay_colorprimaries/.test(rawStr);
            anySt2086 = /st[\s_]?2086/.test(rawStr);

            // Are we seeing non-zero cll or maxcll? We'll look for typical patterns: "cll=1000,500" or "maxcll 1000"
            anyCll = false;
            cllZeroMatches = rawStr.match(/cll.?=0[,]0/) || []; // e.g. "cll=0,0"
            if (cllZeroMatches.length > 0) {
              // This definitely means 0,0 => not valid fallback
              anyCll = false;
            } else {
              // Maybe we find something like "cll=1000,500" or "maxcll=1000"
              matchCll = rawStr.match(/cll.?=[^\d]*([\d]+)/) || []; // tries to grab a number after cll=
              matchFall = rawStr.match(/maxfall.?=([\d]+)/) || [];
              matchMasterLuminance = rawStr.match(/masteringdisplay_luminance.?=([\d]+)/) || [];

              // If we find a numeric > 0 => good
              if (matchCll.length > 1 && parseInt(matchCll[1]) > 0) {
                anyCll = true;
              }
              else if (matchFall.length > 1 && parseInt(matchFall[1]) > 0) {
                anyCll = true;
              }
              else if (matchMasterLuminance.length > 1 && parseInt(matchMasterLuminance[1]) > 0) {
                anyCll = true;
              }
            }

            // If anyMaster, anySt2086, or anyCll is found => fallbackOk
            if (anyMaster || anyCll || anySt2086) {
              fallbackOk = true;
              break;
            }
          }
        }
      }

      // 2) Check ffProbe if we haven't found it from MediaInfo
      if (!fallbackOk && args.inputFileObj && args.inputFileObj.ffProbeData) {
        ffProbe = args.inputFileObj.ffProbeData.streams || [];
        for (_i = 0, _a = ffProbe; _i < _a.length; _i++) {
          st = _a[_i];
          if (st.codec_type === 'video') {
            // e.g. st.tags["master-display"] and st.tags["cll"]
            metaDisplay = (st.tags && st.tags["master-display"]) || "";
            metaCll = (st.tags && st.tags["cll"]) || "";

            metaDisplay = metaDisplay.toLowerCase();
            metaCll = metaCll.toLowerCase();

            // If it's "cll=0,0" => missing
            if (metaCll.includes("0,0")) {
              // do nothing, fallbackOk = false
            } else {
              // If we see numeric >0 => fallbackOk
              if (/\d{3,}/.test(metaDisplay) || /\d{3,}/.test(metaCll)) {
                fallbackOk = true;
                break;
              }
            }
          }
        }
      }

      // Final decision
      if (fallbackOk) {
        return [2 /*return*/, {
          outputFileObj: args.inputFileObj,
          outputNumber: 1, // fallback found
          variables: args.variables
        }];
      } else {
        return [2 /*return*/, {
          outputFileObj: args.inputFileObj,
          outputNumber: 2, // fallback missing
          variables: args.variables
        }];
      }
    });
  });
};
exports.plugin = plugin;


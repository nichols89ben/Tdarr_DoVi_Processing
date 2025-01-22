"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;

/**
 * This plugin checks the file’s HDR type (Dolby Vision, HDR10+, HDR10, or SDR).
 * Adjusted so that if MediaInfo lists SMPTE ST 2094 (HDR10+) it outputs #2 correctly.
 */

var details = function () {
  return {
    name: 'Check HDR type',
    description: 'Check HDR standard used by the video',
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
        tooltip: 'File is Dolby Vision',
      },
      {
        number: 2,
        tooltip: 'File is HDR10+',
      },
      {
        number: 3,
        tooltip: 'File is HDR10',
      },
      {
        number: 4,
        tooltip: 'File is not HDR',
      },
    ],
  };
};
exports.details = details;

var plugin = function (args) {
  var lib = require('../../../../../methods/lib')();
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  // Default assumption is SDR
  var outputNum = 4;

  // 1) Check MediaInfo track first for Dolby Vision or HDR10+
  //    That way if the file is HDR10+, we set output=2 right away.
  if (
    args.inputFileObj &&
    args.inputFileObj.mediaInfo &&
    Array.isArray(args.inputFileObj.mediaInfo.track)
  ) {
    args.inputFileObj.mediaInfo.track.forEach(function (stream) {
      if (stream['@type'] && stream['@type'].toLowerCase() === 'video') {
        var hdrFormat = stream.HDR_Format || ''; // e.g. "SMPTE ST 2094 App 4"
        // Also check HDR_Format_Commercial or HDR_Format_Compatibility if needed
        var hdrCommercial = stream.HDR_Format_Commercial || ''; // e.g. "HDR10+"
        var combinedInfo = (hdrFormat + ' ' + hdrCommercial).toLowerCase();

        // Dolby Vision?
        if (/dolby\s?vision/i.test(combinedInfo)) {
          outputNum = 1;
        }
        // HDR10+?
        else if (/hdr10\+|smpte\s?st\s?2094/i.test(combinedInfo)) {
          outputNum = 2;
        }
        // If we haven't set DV or HDR10+ yet but see "HDR10" in the data, we could
        // set outputNum=3, but we will cross-check with the ffProbe color_transfer in next step
      }
    });
  }

  // 2) If still not DV or HDR10+, check ffProbe data for standard HDR10
  //    If we see color_transfer=smpte2084 etc. => It's HDR10 unless already set to #2
  if (outputNum === 4) {
    // We only attempt setting #3 if it’s not DV or HDR10+ already
    if (
      args.inputFileObj &&
      args.inputFileObj.ffProbeData &&
      Array.isArray(args.inputFileObj.ffProbeData.streams)
    ) {
      for (var i = 0; i < args.inputFileObj.ffProbeData.streams.length; i++) {
        var stream = args.inputFileObj.ffProbeData.streams[i];
        if (stream.codec_type === 'video') {
          if (
            stream.color_transfer === 'smpte2084' &&
            stream.color_primaries === 'bt2020'
          ) {
            // We assume HDR10
            outputNum = 3;
            break;
          }
        }
      }
    }
  }

  // Return final decision
  return {
    outputFileObj: args.inputFileObj,
    outputNumber: outputNum,
    variables: args.variables,
  };
};
exports.plugin = plugin;
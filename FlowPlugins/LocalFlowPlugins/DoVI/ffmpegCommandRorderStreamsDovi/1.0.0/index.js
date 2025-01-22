"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;

// We only reorder the streams so audio->subtitle->video
var details = function () {
  return {
    name: 'ffmpeg - Reorder Streams DoVi',
    description: 'Reorder streams for DoVi processing: audio,subtitle,video',
    style: {
      borderColor: '#6efefc',
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
  };
};
exports.details = details;

var plugin = function (args) {
  var lib = require('../../../../../methods/lib')();
  args.inputs = lib.loadDefaultValues(args.inputs, details);

  // Ensure ffmpegCommand is initialized
  var checkFfmpegCommandInit = function (argsObj) {
    if (!argsObj.variables.ffmpegCommand) {
      argsObj.variables.ffmpegCommand = {
        init: true,
        streams: [],
        shouldProcess: false,
      };
    }
  };
  checkFfmpegCommandInit(args);

  // Grab the streams from ffmpegCommand
  var streams = JSON.parse(JSON.stringify(args.variables.ffmpegCommand.streams));

  // Keep track of original for comparison
  var originalStreams = JSON.stringify(streams);

  // Simple reorder: audio, subtitle, video
  // We'll create a mapping for each codec_type to an index
  var sortOrder = { audio: 0, subtitle: 1, video: 2 };

  // Reorder the streams in place
  streams.sort(function (a, b) {
    var aVal = sortOrder[a.codec_type] !== undefined ? sortOrder[a.codec_type] : 999;
    var bVal = sortOrder[b.codec_type] !== undefined ? sortOrder[b.codec_type] : 999;
    return aVal - bVal;
  });

  // If anything changed, signal that we should process
  if (JSON.stringify(streams) !== originalStreams) {
    args.variables.ffmpegCommand.shouldProcess = true;
    args.variables.ffmpegCommand.streams = streams;
  }

  return {
    outputFileObj: args.inputFileObj,
    outputNumber: 1,
    variables: args.variables,
  };
};
exports.plugin = plugin;
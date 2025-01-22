"use strict";
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
/* eslint-disable no-param-reassign */

const details = () => ({
    name: 'ffmpeg - Extract Streams DoVI',
    description: "Extract raw HEVC and srt streams from file. Srt streams are moved to input directory and renamed.",
    style: {
        borderColor: '#6efefc',
    },
    tags: 'video',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.11.01',
    sidebarPosition: -1,
    icon: '',
    inputs: [
        {
            label: 'Subtitle languages',
            name: 'subtitle_languages',
            type: 'string',
            defaultValue: 'eng,en',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Specify subtitle languages to keep using a comma-separated list e.g., eng.',
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'Continue to next plugin',
        },
    ],
});
exports.details = details;

const getOutputSubtitlePath = (originalFilePath, languageSuffix) => {
    const path = require('path');
    const directory = path.dirname(originalFilePath);
    const fileName = path.basename(originalFilePath, path.extname(originalFilePath));
    return path.join(directory, `${fileName}.${languageSuffix}.srt`);
};

var plugin = function (args) {
    const lib = require('../../../../../methods/lib')();
    args.inputs = lib.loadDefaultValues(args.inputs, details);

    const subtitle_languages = String(args.inputs.subtitle_languages).trim().split(',');
    args.variables.ffmpegCommand.container = 'hevc';
    args.variables.ffmpegCommand.shouldProcess = true;

    const originalDir = require('path').dirname(args.originalLibraryFile._id);
    const originalFileName = require('path').basename(args.originalLibraryFile._id);
    const baseNameWithoutYear = originalFileName.replace(/\s\(\d{4}\)/, '').replace(/\.[^/.]+$/, '');

    const streams = args.variables.ffmpegCommand.streams;
    streams.forEach((stream) => {
        const index = stream.index;
        if (stream.codec_type === 'subtitle') {
            const lang = stream.tags?.language || 'und'; // Use stream language if available, default to 'und'
            const format = 'srt';

            if (!subtitle_languages.includes(lang) || stream.codec_name.toLowerCase() !== 'subrip') {
                // Skip unsupported subtitle streams
                stream.removed = true;
            } else {
                const subtitlePath = `${originalDir}/${baseNameWithoutYear}.${lang}.${format}`;
                stream.outputArgs.push('-c:s:' + index);
                stream.outputArgs.push('copy');
                stream.outputArgs.push(subtitlePath);
            }
        } else if (stream.codec_type === 'video') {
            stream.outputArgs.push('-c:v');
            stream.outputArgs.push('copy');
            stream.outputArgs.push('-bsf:v');
            stream.outputArgs.push('hevc_mp4toannexb');
        } else {
            stream.removed = true;
        }
    });

    return {
        outputFileObj: args.inputFileObj,
        outputNumber: 1,
        variables: args.variables,
    };
};

exports.plugin = plugin;
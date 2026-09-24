FROM ghcr.io/haveagitgat/tdarr_node:2.40.01 AS build
# FROM ghcr.io/haveagitgat/tdarr_node:latest AS build

ARG DOVI_TOOL_TAG="2.1.3"
ARG MP4BOX_TAG="v2.4.0"
ARG HDR10PLUS_TOOL_TAG="1.6.1"

# Update and install dependencies
RUN apt-get update && \
    apt-get install -y \
        build-essential \
        git \
        pkg-config \
        wget \
        zlib1g-dev \
        mediainfo \
        mkvtoolnix \
        jq \
        bc \
    && rm -rf /var/lib/apt/lists/*

# MP4Box
RUN git clone --depth 1 --branch ${MP4BOX_TAG} https://github.com/gpac/gpac.git && \
    cd gpac && \
    ./configure --static-bin && \
    make -j$(nproc) && \
    make install

# Dovi Tool
RUN wget -O - "https://github.com/quietvoid/dovi_tool/releases/download/${DOVI_TOOL_TAG}/dovi_tool-${DOVI_TOOL_TAG}-x86_64-unknown-linux-musl.tar.gz" | \
    tar -zx -C /usr/local/bin/

# HDR10Plus Tool
RUN wget -O - "https://github.com/quietvoid/hdr10plus_tool/releases/download/${HDR10PLUS_TOOL_TAG}/hdr10plus_tool-${HDR10PLUS_TOOL_TAG}-x86_64-unknown-linux-musl.tar.gz" | \
    tar -zx -C /usr/local/bin/

FROM haveagitgat/tdarr_node:2.37.01

# Copy tools from the build stage
COPY --from=build /usr/local/bin/dovi_tool /usr/local/bin/
COPY --from=build /usr/local/bin/hdr10plus_tool /usr/local/bin/
COPY --from=build /usr/local/bin/MP4Box /usr/local/bin/
COPY --from=build /usr/local/bin/gpac /usr/local/bin/

RUN chmod 755 /usr/local/bin/dovi_tool /usr/local/bin/hdr10plus_tool /usr/local/bin/MP4Box /usr/local/bin/gpac
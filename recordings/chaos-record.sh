#!/bin/bash
# Chaos Screen Recorder — FFmpeg wrapper
# Usage:
#   chaos-record.sh                     # Record full desktop, default 30s
#   chaos-record.sh 10                  # Record full desktop for 10 seconds
#   chaos-record.sh 10 my_clip          # Record 10s, save as my_clip.mp4
#   chaos-record.sh 10 my_clip 30       # Record 10s at 30fps
#   chaos-record.sh 0                   # Record until manually stopped (Ctrl+C or q)

DURATION="${1:-30}"
FILENAME="${2:-chaos_$(date +%Y%m%d_%H%M%S)}"
FPS="${3:-15}"
OUTDIR="C:/Users/stone/stone-ai/recordings"
OUTFILE="${OUTDIR}/${FILENAME}.mp4"

# Duration flag: -t for timed, omit for unlimited
if [ "$DURATION" = "0" ]; then
    DURATION_FLAG=""
    echo "[Chaos] Recording desktop at ${FPS}fps — press 'q' to stop"
else
    DURATION_FLAG="-t ${DURATION}"
    echo "[Chaos] Recording desktop at ${FPS}fps for ${DURATION}s"
fi

echo "[Chaos] Output: ${OUTFILE}"

ffmpeg -f gdigrab -framerate "$FPS" $DURATION_FLAG -i desktop \
    -c:v libx264 -preset ultrafast -crf 23 -pix_fmt yuv420p \
    "$OUTFILE" -y 2>&1 | tail -5

echo "[Chaos] Recording saved: ${OUTFILE}"
ls -lh "$OUTFILE"

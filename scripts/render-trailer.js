/**
 * Render Cinematic MP4 Video using FFmpeg
 */

import { execSync } from 'child_process';
import path from 'path';

const outputVideo = path.resolve('./aether_os_trailer.mp4');

console.log('Rendering AETHER OS Cinematic Video Trailer with FFmpeg...');

// Clean FFmpeg command generating 1080p 60fps cinematic video
const ffmpegCmd = `ffmpeg -y -f lavfi -i color=c=0x06070a:s=1920x1080:d=14:r=60 ` +
  `-f lavfi -i "aevalsrc=sin(2*PI*110*t)*0.18 + sin(2*PI*220*t)*0.12 + sin(2*PI*523.25*t)*0.08:d=14:s=48000" ` +
  `-vf "` +
  `format=yuv420p,` +
  `drawbox=x=0:y=0:w=1920:h=120:color=0x00f0ff@0.08:t=fill,` +
  `drawtext=text='AETHER OS':fontcolor=0x00f0ff:fontsize=76:x=(w-text_w)/2:y=(h-text_h)/2-130:box=1:boxcolor=0x000000@0.7:boxborderw=24,` +
  `drawtext=text='AUTONOMOUS SPATIAL INTELLIGENCE AND 3D QUANTUM STUDIO':fontcolor=0xffffff:fontsize=28:x=(w-text_w)/2:y=(h-text_h)/2-30,` +
  `drawtext=text='7000 RELATIVISTIC PARTICLES - 3D NEURAL REALM - 60 FPS':fontcolor=0x94a3b8:fontsize=22:x=(w-text_w)/2:y=(h-text_h)/2+50,` +
  `drawtext=text='NOW LIVE ON VERCEL PRODUCTION':fontcolor=0x10b981:fontsize=32:x=(w-text_w)/2:y=(h-text_h)/2+140,` +
  `drawtext=text='aether-studio-psi.vercel.app':fontcolor=0x00f0ff:fontsize=26:x=(w-text_w)/2:y=(h-text_h)/2+200` +
  `" ` +
  `-c:v libx264 -pix_fmt yuv420p -preset fast -c:a aac -b:a 192k "${outputVideo}"`;

try {
  execSync(ffmpegCmd, { stdio: 'inherit' });
  console.log('Video generated successfully at:', outputVideo);
} catch (e) {
  console.error('Error generating video:', e.message);
}

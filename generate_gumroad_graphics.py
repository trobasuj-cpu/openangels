import subprocess
import os
from pathlib import Path

out_dir = Path(r"C:\Users\User\.gemini\antigravity\brain\39257401-10ee-48e8-be0c-960b66750f6f")

cover_html = """<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    .crm-btn-oil {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #991b1b 100%);
    }
  </style>
</head>
<body class="bg-black text-white w-[1280px] h-[720px] overflow-hidden flex flex-col justify-between p-12 relative selection:bg-red-500/30">
  <!-- Glowing Background Orbs -->
  <div class="absolute -top-32 -left-32 w-[600px] h-[600px] bg-red-600/15 rounded-full blur-[140px] pointer-events-none"></div>
  <div class="absolute -bottom-32 -right-32 w-[600px] h-[600px] bg-rose-600/15 rounded-full blur-[140px] pointer-events-none"></div>
  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-red-500/5 rounded-full blur-[160px] pointer-events-none"></div>

  <!-- Header -->
  <div class="relative z-10 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center shadow-lg shadow-red-500/30 border border-red-400/30">
        <span class="text-white text-xl font-extrabold tracking-wider">OA</span>
      </div>
      <div>
        <span class="text-2xl font-black tracking-tight text-white">OpenAngels</span>
        <span class="ml-2 text-xs font-bold uppercase tracking-widest text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">PREMIUM</span>
      </div>
    </div>
    <div class="flex items-center gap-2 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 px-4 py-2 rounded-full shadow-md">
      <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
      <span class="text-xs font-bold text-zinc-300">Lifetime Access • No Subscription</span>
    </div>
  </div>

  <!-- Hero Content -->
  <div class="relative z-10 my-auto text-center max-w-4xl mx-auto space-y-4">
    <h1 class="text-5xl font-extrabold tracking-tight leading-none text-white">
      The Ultimate Fundraising Engine for <br/>
      <span class="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-amber-400">Early-Stage Founders</span>
    </h1>
    <p class="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
      Instant access to 4,000+ verified angel investors & VCs, AI cold outreach draft generator, and built-in fundraising CRM.
    </p>
  </div>

  <!-- 3 Main Features Grid -->
  <div class="relative z-10 grid grid-cols-3 gap-6">
    <div class="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 p-5 rounded-2xl flex items-center gap-4 shadow-xl">
      <div class="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
        <span class="text-2xl">🎯</span>
      </div>
      <div>
        <h3 class="text-base font-bold text-white mb-0.5">4,000+ Investors</h3>
        <p class="text-xs text-zinc-400">Direct emails, check sizes & stages</p>
      </div>
    </div>

    <div class="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 p-5 rounded-2xl flex items-center gap-4 shadow-xl">
      <div class="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
        <span class="text-2xl">✨</span>
      </div>
      <div>
        <h3 class="text-base font-bold text-white mb-0.5">AI Email Generator</h3>
        <p class="text-xs text-zinc-400">1-click personalized pitches</p>
      </div>
    </div>

    <div class="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 p-5 rounded-2xl flex items-center gap-4 shadow-xl">
      <div class="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
        <span class="text-2xl">📊</span>
      </div>
      <div>
        <h3 class="text-base font-bold text-white mb-0.5">Fundraising CRM</h3>
        <p class="text-xs text-zinc-400">Track saved, contacted & replies</p>
      </div>
    </div>
  </div>
</body>
</html>
"""

thumbnail_html = """<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
  </style>
</head>
<body class="bg-black text-white w-[600px] h-[600px] overflow-hidden flex flex-col items-center justify-center p-8 relative selection:bg-red-500/30">
  <!-- Glowing Background Orbs -->
  <div class="absolute inset-0 bg-gradient-to-b from-red-950/30 via-zinc-950 to-black"></div>
  <div class="absolute w-[400px] h-[400px] bg-red-500/20 rounded-full blur-[120px] pointer-events-none"></div>

  <!-- Central Card Container -->
  <div class="relative z-10 w-full h-full bg-zinc-900/70 backdrop-blur-2xl border border-red-500/30 rounded-3xl p-8 flex flex-col items-center justify-between text-center shadow-2xl">
    
    <!-- Top Badge -->
    <span class="text-[11px] font-extrabold uppercase tracking-widest text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
      LIFETIME ACCESS
    </span>

    <!-- Logo & Title -->
    <div class="flex flex-col items-center gap-3">
      <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center shadow-2xl shadow-red-500/40 border border-red-400/40">
        <span class="text-white text-3xl font-black tracking-wider">OA</span>
      </div>
      <div>
        <h1 class="text-3xl font-black text-white tracking-tight">OpenAngels</h1>
        <p class="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-400">
          PREMIUM DATABASE & CRM
        </p>
      </div>
    </div>

    <!-- Features Pill List -->
    <div class="space-y-2 w-full">
      <div class="bg-black/50 border border-zinc-800 rounded-xl py-2 px-4 text-xs font-semibold text-zinc-200 flex items-center justify-between">
        <span>🎯 4,000+ Angel Investors</span>
        <span class="text-emerald-400">Direct Emails</span>
      </div>
      <div class="bg-black/50 border border-zinc-800 rounded-xl py-2 px-4 text-xs font-semibold text-zinc-200 flex items-center justify-between">
        <span>✨ AI Pitch Generator</span>
        <span class="text-red-400">1-Click Email</span>
      </div>
      <div class="bg-black/50 border border-zinc-800 rounded-xl py-2 px-4 text-xs font-semibold text-zinc-200 flex items-center justify-between">
        <span>📊 Built-in CRM Board</span>
        <span class="text-amber-400">Pipeline Tracker</span>
      </div>
    </div>
  </div>
</body>
</html>
"""

cover_html_path = out_dir / "gumroad_cover.html"
thumbnail_html_path = out_dir / "gumroad_thumbnail.html"

cover_html_path.write_text(cover_html, encoding='utf-8')
thumbnail_html_path.write_text(thumbnail_html, encoding='utf-8')

cover_png_path = out_dir / "gumroad_cover.png"
thumbnail_png_path = out_dir / "gumroad_thumbnail.png"

edge_bin = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

print("Rendering Cover PNG (1280x720)...")
subprocess.run([
    edge_bin,
    "--headless",
    "--disable-gpu",
    "--window-size=1280,720",
    "--hide-scrollbars",
    f"--screenshot={str(cover_png_path)}",
    str(cover_html_path)
], check=True)

print("Rendering Thumbnail PNG (600x600)...")
subprocess.run([
    edge_bin,
    "--headless",
    "--disable-gpu",
    "--window-size=600,600",
    "--hide-scrollbars",
    f"--screenshot={str(thumbnail_png_path)}",
    str(thumbnail_html_path)
], check=True)

print("DONE! Images generated successfully.")

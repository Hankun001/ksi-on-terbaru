<!-- Dasbor Murid - KSI-ON Redesign -->
<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Dasbor Murid - KSI-ON LMS</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700;800&amp;family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .material-symbols-outlined.fill {
            font-variation-settings: 'FILL' 1;
        }
        
        /* Custom scrollbar for sidebar */
        .sidebar-scroll::-webkit-scrollbar {
            width: 4px;
        }
        .sidebar-scroll::-webkit-scrollbar-track {
            background: transparent;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb {
            background-color: #cbd5e1;
            border-radius: 20px;
        }
        
        .glass-panel {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
    </style>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "on-secondary-container": "#004666",
                        "outline": "#777587",
                        "surface-container": "#e5eeff",
                        "surface-container-low": "#eff4ff",
                        "inverse-surface": "#213145",
                        "tertiary-fixed-dim": "#ffb2b7",
                        "on-error": "#ffffff",
                        "on-tertiary": "#ffffff",
                        "tertiary": "#95002b",
                        "surface-dim": "#cbdbf5",
                        "on-primary-container": "#dad7ff",
                        "on-primary": "#ffffff",
                        "on-primary-fixed": "#0f0069",
                        "inverse-primary": "#c3c0ff",
                        "on-error-container": "#93000a",
                        "error": "#ba1a1a",
                        "on-tertiary-container": "#ffd0d2",
                        "surface": "#f8f9ff",
                        "on-background": "#0b1c30",
                        "on-tertiary-fixed": "#40000d",
                        "primary-fixed-dim": "#c3c0ff",
                        "inverse-on-surface": "#eaf1ff",
                        "surface-variant": "#d3e4fe",
                        "tertiary-container": "#bf0f3c",
                        "secondary": "#006591",
                        "on-surface": "#0b1c30",
                        "primary-fixed": "#e2dfff",
                        "on-secondary-fixed": "#001e2f",
                        "on-surface-variant": "#464555",
                        "outline-variant": "#c7c4d8",
                        "surface-bright": "#f8f9ff",
                        "surface-container-highest": "#d3e4fe",
                        "on-secondary-fixed-variant": "#004c6e",
                        "on-secondary": "#ffffff",
                        "surface-container-high": "#dce9ff",
                        "secondary-fixed": "#c9e6ff",
                        "secondary-fixed-dim": "#89ceff",
                        "tertiary-fixed": "#ffdadb",
                        "surface-container-lowest": "#ffffff",
                        "primary": "#3525cd",
                        "surface-tint": "#4d44e3",
                        "on-tertiary-fixed-variant": "#92002a",
                        "background": "#f8f9ff",
                        "error-container": "#ffdad6",
                        "on-primary-fixed-variant": "#3323cc",
                        "secondary-container": "#39b8fd",
                        "primary-container": "#4f46e5"
                    },
                    borderRadius: {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    spacing: {
                        "md": "16px",
                        "2xl": "48px",
                        "xl": "32px",
                        "sm": "12px",
                        "base": "4px",
                        "gutter": "24px",
                        "xs": "8px",
                        "margin-mobile": "16px",
                        "lg": "24px",
                        "margin-desktop": "32px",
                        "sidebar-width": "280px"
                    },
                    fontFamily: {
                        "title-md": ["Inter", "sans-serif"],
                        "body-lg": ["Inter", "sans-serif"],
                        "headline-lg": ["Hanken Grotesk", "sans-serif"],
                        "label-sm": ["Inter", "sans-serif"],
                        "body-md": ["Inter", "sans-serif"],
                        "display-lg": ["Hanken Grotesk", "sans-serif"],
                        "body-sm": ["Inter", "sans-serif"],
                        "label-md": ["Inter", "sans-serif"],
                        "headline-md": ["Hanken Grotesk", "sans-serif"],
                        "title-lg": ["Inter", "sans-serif"]
                    },
                    fontSize: {
                        "title-md": ["16px", { lineHeight: "24px", fontWeight: "600" }],
                        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
                        "headline-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.01em", fontWeight: "600" }],
                        "label-sm": ["12px", { lineHeight: "16px", fontWeight: "600" }],
                        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
                        "display-lg": ["48px", { lineHeight: "56px", letterSpacing: "-0.02em", fontWeight: "700" }],
                        "body-sm": ["14px", { lineHeight: "20px", fontWeight: "400" }],
                        "label-md": ["14px", { lineHeight: "20px", letterSpacing: "0.01em", fontWeight: "500" }],
                        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "600" }],
                        "title-lg": ["20px", { lineHeight: "28px", fontWeight: "600" }]
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-background text-on-background font-body-md antialiased overflow-hidden flex h-screen">
<!-- Sidebar Navigation -->
<aside class="w-sidebar-width h-screen fixed left-0 top-0 bg-surface flex flex-col h-full border-r border-outline-variant shadow-[0px_4px_20px_rgba(0,0,0,0.05)] z-50 hidden md:flex">
<!-- Logo Area -->
<div class="px-lg py-lg border-b border-outline-variant/30 flex items-center gap-sm">
<div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
<span class="material-symbols-outlined text-primary fill">school</span>
</div>
<div>
<h1 class="font-headline-md text-headline-md font-extrabold text-primary">KSI-ON LMS</h1>
<p class="font-label-sm text-label-sm text-on-surface-variant">Academic Excellence</p>
</div>
</div>
<!-- Navigation Links -->
<nav class="flex-1 overflow-y-auto sidebar-scroll py-md flex flex-col gap-base">
<!-- Active State Dashboard -->
<a class="bg-primary/10 text-primary border-l-4 border-primary rounded-r-full py-md px-lg transition-all flex items-center gap-md group" href="#">
<span class="material-symbols-outlined fill group-hover:scale-110 transition-transform">dashboard</span>
<span class="font-label-md text-label-md font-semibold">Dashboard</span>
</a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out rounded-r-full mr-sm group border-l-4 border-transparent" href="#">
<span class="material-symbols-outlined group-hover:scale-110 transition-transform">school</span>
<span class="font-label-md text-label-md">Kursus</span>
</a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out rounded-r-full mr-sm group border-l-4 border-transparent" href="#">
<span class="material-symbols-outlined group-hover:scale-110 transition-transform">explore</span>
<span class="font-label-md text-label-md">Jelajahi</span>
</a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out rounded-r-full mr-sm group border-l-4 border-transparent" href="#">
<span class="material-symbols-outlined group-hover:scale-110 transition-transform">assignment</span>
<span class="font-label-md text-label-md">Tugas</span>
</a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out rounded-r-full mr-sm group border-l-4 border-transparent" href="#">
<span class="material-symbols-outlined group-hover:scale-110 transition-transform">quiz</span>
<span class="font-label-md text-label-md">Ujian</span>
</a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out rounded-r-full mr-sm group border-l-4 border-transparent" href="#">
<span class="material-symbols-outlined group-hover:scale-110 transition-transform">monitoring</span>
<span class="font-label-md text-label-md">Progres</span>
</a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out rounded-r-full mr-sm group border-l-4 border-transparent" href="#">
<span class="material-symbols-outlined group-hover:scale-110 transition-transform">campaign</span>
<span class="font-label-md text-label-md">Pengumuman</span>
</a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out rounded-r-full mr-sm group border-l-4 border-transparent" href="#">
<span class="material-symbols-outlined group-hover:scale-110 transition-transform">chat</span>
<span class="font-label-md text-label-md flex-1">Pesan</span>
<span class="bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full">3</span>
</a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out rounded-r-full mr-sm group border-l-4 border-transparent" href="#">
<span class="material-symbols-outlined group-hover:scale-110 transition-transform">account_circle</span>
<span class="font-label-md text-label-md">Profil</span>
</a>
</nav>
<!-- Footer / Logout -->
<div class="p-md border-t border-outline-variant/30">
<a class="text-on-surface-variant py-sm px-md flex items-center gap-md hover:bg-error-container hover:text-error transition-all duration-200 ease-in-out rounded-lg group" href="#">
<span class="material-symbols-outlined group-hover:scale-110 transition-transform">logout</span>
<span class="font-label-md text-label-md">Logout</span>
</a>
</div>
</aside>
<!-- Main Content Canvas -->
<main class="flex-1 ml-0 md:ml-sidebar-width h-screen overflow-y-auto flex flex-col relative bg-surface-bright">
<!-- Top App Bar -->
<header class="bg-surface/70 backdrop-blur-md flex justify-between items-center px-lg py-xs w-full z-40 shadow-sm top-0 sticky border-b border-outline-variant">
<!-- Mobile Menu Trigger -->
<button class="md:hidden p-xs rounded-full hover:bg-surface-container-high transition-colors text-primary">
<span class="material-symbols-outlined">menu</span>
</button>
<!-- Page Title Context -->
<div class="hidden md:flex items-center gap-sm">
<span class="material-symbols-outlined text-outline">home</span>
<span class="text-outline-variant">/</span>
<span class="font-label-md text-label-md font-medium text-on-surface">Dashboard Murid</span>
</div>
<!-- Right Actions -->
<div class="flex items-center gap-sm">
<button class="p-sm rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant relative group">
<span class="material-symbols-outlined">notifications</span>
<span class="absolute top-2 right-2 w-2 h-2 bg-error rounded-full ring-2 ring-surface"></span>
</button>
<button class="p-sm rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant">
<span class="material-symbols-outlined">help</span>
</button>
<div class="h-6 w-px bg-outline-variant mx-xs"></div>
<div class="flex items-center gap-sm cursor-pointer hover:bg-surface-container-high p-xs pr-md rounded-full transition-colors border border-outline-variant/30">
<div class="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-title-md text-title-md border border-secondary-fixed">
                        M1
                    </div>
<div class="hidden sm:block">
<p class="font-label-sm text-label-sm text-on-surface">murid1</p>
<p class="text-[10px] text-on-surface-variant leading-none">Murid</p>
</div>
</div>
</div>
</header>
<!-- Scrollable Dashboard Content -->
<div class="p-margin-mobile md:p-margin-desktop flex-1 max-w-7xl mx-auto w-full flex flex-col gap-lg">
<!-- Welcome Header Section -->
<div class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-md">
<div>
<h2 class="font-headline-lg text-headline-lg text-on-background flex items-center gap-sm">
<span class="material-symbols-outlined fill text-secondary text-3xl">school</span>
                        Dasbor Murid
                    </h2>
<p class="font-body-md text-body-md text-on-surface-variant mt-1">Selamat datang kembali, murid1! Siap untuk belajar hari ini?</p>
</div>
<button class="flex items-center gap-xs bg-surface-container px-4 py-2 rounded-lg text-primary font-label-md text-label-md hover:bg-primary/10 transition-colors border border-primary/20">
<span class="material-symbols-outlined text-[18px]">refresh</span>
                    Refresh Data
                </button>
</div>
<!-- Vibrant Welcome Banner -->
<div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-surface-tint p-xl shadow-[0px_10px_30px_rgba(53,37,205,0.2)]">
<!-- Decorative background elements -->
<div class="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
<div class="absolute bottom-0 left-10 w-40 h-40 bg-secondary-container opacity-20 rounded-full blur-2xl translate-y-1/2"></div>
<div class="relative z-10 flex flex-col items-center justify-center text-center py-sm">
<h3 class="font-headline-md text-headline-md text-white mb-2 flex items-center gap-2">
                        Selamat Siang <span class="text-2xl animate-bounce inline-block">👋</span>
</h3>
<p class="font-body-md text-body-md text-primary-fixed max-w-xl">
                        Hai Murid! Selamat belajar. Semangat mencapai prestasi terbaikmu di KSI-ON LMS!
                    </p>
</div>
</div>
<!-- My Statistics / Bento Grid -->
<div>
<h3 class="font-title-lg text-title-lg text-on-background flex items-center gap-xs mb-md">
<span class="material-symbols-outlined text-outline">bar_chart</span>
                    Statistik Saya
                </h3>
<div class="grid grid-cols-2 lg:grid-cols-4 gap-md">
<!-- Stat Card 1: Kursus Diambil -->
<div class="bg-surface rounded-xl p-md border border-outline-variant/30 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center text-center relative overflow-hidden group hover:shadow-[0px_10px_30px_rgba(0,0,0,0.08)] transition-all">
<div class="w-12 h-12 rounded-full bg-secondary-container/30 flex items-center justify-center mb-sm group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined text-secondary fill text-2xl">menu_book</span>
</div>
<h4 class="font-display-lg text-display-lg text-on-background text-3xl mb-1">6</h4>
<p class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Kursus Diambil</p>
<div class="absolute bottom-0 left-0 h-1 bg-secondary w-full transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
</div>
<!-- Stat Card 2: Tugas Selesai -->
<div class="bg-surface rounded-xl p-md border border-outline-variant/30 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center text-center relative overflow-hidden group hover:shadow-[0px_10px_30px_rgba(0,0,0,0.08)] transition-all">
<div class="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-sm group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined text-emerald-600 dark:text-emerald-400 fill text-2xl">check_circle</span>
</div>
<h4 class="font-display-lg text-display-lg text-on-background text-3xl mb-1">0</h4>
<p class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Tugas Selesai</p>
<div class="absolute bottom-0 left-0 h-1 bg-emerald-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
</div>
<!-- Stat Card 3: Menunggu Nilai -->
<div class="bg-surface rounded-xl p-md border border-outline-variant/30 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center text-center relative overflow-hidden group hover:shadow-[0px_10px_30px_rgba(0,0,0,0.08)] transition-all">
<div class="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-sm group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined text-amber-600 dark:text-amber-400 fill text-2xl">schedule</span>
</div>
<h4 class="font-display-lg text-display-lg text-on-background text-3xl mb-1">0</h4>
<p class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Menunggu Nilai</p>
<div class="absolute bottom-0 left-0 h-1 bg-amber-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
</div>
<!-- Stat Card 4: Rata-rata Nilai -->
<div class="bg-surface rounded-xl p-md border border-outline-variant/30 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center text-center relative overflow-hidden group hover:shadow-[0px_10px_30px_rgba(0,0,0,0.08)] transition-all">
<div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-sm group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined text-primary fill text-2xl">insert_chart</span>
</div>
<h4 class="font-display-lg text-display-lg text-primary text-3xl mb-1">0%</h4>
<p class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Rata-rata Nilai</p>
<div class="absolute bottom-0 left-0 h-1 bg-primary w-full transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
</div>
</div>
</div>
<!-- Two Column Layout for Notifications and Tasks -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-lg pb-xl">
<!-- Notifications Column -->
<div class="flex flex-col gap-md">
<div class="flex items-center justify-between border-b border-outline-variant/50 pb-sm">
<h3 class="font-title-lg text-title-lg text-on-background flex items-center gap-xs">
<span class="material-symbols-outlined text-error">notifications_active</span>
                            Notifikasi
                            <span class="bg-error text-on-error font-label-sm text-[10px] px-2 py-0.5 rounded-full ml-1">2</span>
</h3>
<button class="text-primary font-label-sm text-label-sm hover:underline">Tandai semua dibaca</button>
</div>
<div class="flex flex-col gap-sm">
<!-- Notification Item 1 -->
<div class="bg-surface-container-low rounded-xl p-md border border-outline-variant/20 hover:border-primary/30 transition-colors flex gap-md items-start shadow-sm">
<div class="mt-1">
<span class="material-symbols-outlined text-primary fill">campaign</span>
</div>
<div class="flex-1">
<h4 class="font-title-md text-title-md text-on-background line-clamp-1">"microsoft excel": ulangan bahasa indonesia</h4>
<p class="font-body-sm text-body-sm text-on-surface-variant mt-1">Ujian baru telah ditambahkan ke kursus Microsoft Excel Anda.</p>
<p class="font-label-sm text-[11px] text-outline mt-2 flex items-center gap-1">
<span class="material-symbols-outlined text-[14px]">schedule</span> 2/17/2026, 4:11:47 PM
                                </p>
</div>
<button class="text-primary hover:bg-surface-container p-1.5 rounded-full transition-colors">
<span class="material-symbols-outlined text-[20px]">chevron_right</span>
</button>
</div>
<!-- Notification Item 2 -->
<div class="bg-surface rounded-xl p-md border border-outline-variant/20 hover:border-primary/30 transition-colors flex gap-md items-start shadow-sm opacity-80">
<div class="mt-1">
<span class="material-symbols-outlined text-outline">campaign</span>
</div>
<div class="flex-1">
<h4 class="font-title-md text-title-md text-on-background line-clamp-1">"bahasa inggris": ujian bahasa inggris</h4>
<p class="font-body-sm text-body-sm text-on-surface-variant mt-1">Hasil ujian Anda telah dipublikasikan.</p>
<p class="font-label-sm text-[11px] text-outline mt-2 flex items-center gap-1">
<span class="material-symbols-outlined text-[14px]">schedule</span> 2/12/2026, 6:10:46 AM
                                </p>
</div>
</div>
</div>
</div>
<!-- Upcoming Tasks Column -->
<div class="flex flex-col gap-md">
<div class="flex items-center justify-between border-b border-outline-variant/50 pb-sm">
<h3 class="font-title-lg text-title-lg text-on-background flex items-center gap-xs">
<span class="material-symbols-outlined text-secondary">assignment_turned_in</span>
                            Tugas Mendatang
                        </h3>
<a class="text-primary font-label-sm text-label-sm hover:underline" href="#">Lihat Kalender</a>
</div>
<!-- Empty State for Tasks -->
<div class="bg-surface rounded-xl border border-dashed border-outline-variant flex flex-col items-center justify-center p-xl text-center h-full min-h-[200px]">
<div class="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-md border-4 border-white shadow-sm">
<span class="material-symbols-outlined text-emerald-500 fill text-4xl">check_circle</span>
</div>
<h4 class="font-title-md text-title-md text-on-background mb-1">Semua tugas selesai!</h4>
<p class="font-body-sm text-body-sm text-on-surface-variant max-w-[250px]">
                            Tidak ada tugas mendatang. Nikmati waktu luang Anda atau jelajahi materi kursus lainnya 🏖️
                        </p>
</div>
</div>
</div>
</div>
</main>
</body></html>

<!-- Dasbor Admin - KSI-ON Redesign -->
<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>KSI-ON Admin Dashboard</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700;800&amp;family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              "colors": {
                      "on-secondary-container": "#004666",
                      "outline": "#777587",
                      "surface-container": "#e5eeff",
                      "surface-container-low": "#eff4ff",
                      "inverse-surface": "#213145",
                      "tertiary-fixed-dim": "#ffb2b7",
                      "on-error": "#ffffff",
                      "on-tertiary": "#ffffff",
                      "tertiary": "#95002b",
                      "surface-dim": "#cbdbf5",
                      "on-primary-container": "#dad7ff",
                      "on-primary": "#ffffff",
                      "on-primary-fixed": "#0f0069",
                      "inverse-primary": "#c3c0ff",
                      "on-error-container": "#93000a",
                      "error": "#ba1a1a",
                      "on-tertiary-container": "#ffd0d2",
                      "surface": "#f8f9ff",
                      "on-background": "#0b1c30",
                      "on-tertiary-fixed": "#40000d",
                      "primary-fixed-dim": "#c3c0ff",
                      "inverse-on-surface": "#eaf1ff",
                      "surface-variant": "#d3e4fe",
                      "tertiary-container": "#bf0f3c",
                      "secondary": "#006591",
                      "on-surface": "#0b1c30",
                      "primary-fixed": "#e2dfff",
                      "on-secondary-fixed": "#001e2f",
                      "on-surface-variant": "#464555",
                      "outline-variant": "#c7c4d8",
                      "surface-bright": "#f8f9ff",
                      "surface-container-highest": "#d3e4fe",
                      "on-secondary-fixed-variant": "#004c6e",
                      "on-secondary": "#ffffff",
                      "surface-container-high": "#dce9ff",
                      "secondary-fixed": "#c9e6ff",
                      "secondary-fixed-dim": "#89ceff",
                      "tertiary-fixed": "#ffdadb",
                      "surface-container-lowest": "#ffffff",
                      "primary": "#3525cd",
                      "surface-tint": "#4d44e3",
                      "on-tertiary-fixed-variant": "#92002a",
                      "background": "#f8f9ff",
                      "error-container": "#ffdad6",
                      "on-primary-fixed-variant": "#3323cc",
                      "secondary-container": "#39b8fd",
                      "primary-container": "#4f46e5"
              },
              "borderRadius": {
                      "DEFAULT": "0.25rem",
                      "lg": "0.5rem",
                      "xl": "0.75rem",
                      "full": "9999px"
              },
              "spacing": {
                      "md": "16px",
                      "2xl": "48px",
                      "xl": "32px",
                      "sm": "12px",
                      "base": "4px",
                      "gutter": "24px",
                      "xs": "8px",
                      "margin-mobile": "16px",
                      "lg": "24px",
                      "margin-desktop": "32px",
                      "sidebar-width": "280px"
              },
              "fontFamily": {
                      "title-md": [
                              "Inter"
                      ],
                      "body-lg": [
                              "Inter"
                      ],
                      "headline-lg": [
                              "Hanken Grotesk"
                      ],
                      "label-sm": [
                              "Inter"
                      ],
                      "body-md": [
                              "Inter"
                      ],
                      "display-lg": [
                              "Hanken Grotesk"
                      ],
                      "body-sm": [
                              "Inter"
                      ],
                      "label-md": [
                              "Inter"
                      ],
                      "headline-md": [
                              "Hanken Grotesk"
                      ],
                      "title-lg": [
                              "Inter"
                      ]
              },
              "fontSize": {
                      "title-md": [
                              "16px",
                              {
                                      "lineHeight": "24px",
                                      "fontWeight": "600"
                              }
                      ],
                      "body-lg": [
                              "18px",
                              {
                                      "lineHeight": "28px",
                                      "fontWeight": "400"
                              }
                      ],
                      "headline-lg": [
                              "32px",
                              {
                                      "lineHeight": "40px",
                                      "letterSpacing": "-0.01em",
                                      "fontWeight": "600"
                              }
                      ],
                      "label-sm": [
                              "12px",
                              {
                                      "lineHeight": "16px",
                                      "fontWeight": "600"
                              }
                      ],
                      "body-md": [
                              "16px",
                              {
                                      "lineHeight": "24px",
                                      "fontWeight": "400"
                              }
                      ],
                      "display-lg": [
                              "48px",
                              {
                                      "lineHeight": "56px",
                                      "letterSpacing": "-0.02em",
                                      "fontWeight": "700"
                              }
                      ],
                      "body-sm": [
                              "14px",
                              {
                                      "lineHeight": "20px",
                                      "fontWeight": "400"
                              }
                      ],
                      "label-md": [
                              "14px",
                              {
                                      "lineHeight": "20px",
                                      "letterSpacing": "0.01em",
                                      "fontWeight": "500"
                              }
                      ],
                      "headline-md": [
                              "24px",
                              {
                                      "lineHeight": "32px",
                                      "fontWeight": "600"
                              }
                      ],
                      "title-lg": [
                              "20px",
                              {
                                      "lineHeight": "28px",
                                      "fontWeight": "600"
                              }
                      ]
              }
      },
          },
        }
      </script>
<style>
        .glass-panel {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
      </style>
</head>
<body class="bg-background text-on-background min-h-screen flex font-body-md overflow-hidden">
<!-- Top Navigation (Mobile Only) -->
<nav class="md:hidden bg-surface/70 dark:bg-on-background/70 backdrop-blur-md shadow-sm full-width top-0 sticky border-b border-outline-variant flex justify-between items-center px-lg py-xs w-full z-40">
<div class="flex items-center gap-xs">
<img class="w-8 h-8 rounded-full" data-alt="A stylized logo icon featuring an open book and a graduation cap in vibrant indigo and secondary colors, suited for a modern learning management system. White background." src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8AAimchpiMQ0cxzLcvRmXjOdlFNaOmCnFCXHWuAF9kz20zXg0r54WnkSCCXLlCwhg8QOFAO-oly9LjYm0KjurEyU4YyvJeI86mMSh9N2Me12_o53gX00CRXAKldXvlaG8Pbw7yRu9pusACgfXJecqsFTSxB28TWsdR4_RcMS85xd2YmYScL5zwLvdwkEUJyMRPpjW0m6Nvq7PRa1_bJcyv4_ydUqD7yV6_jYGz0iQYLbSOl8yP_dmyg"/>
<span class="font-display-lg text-display-lg font-bold text-primary">KSI-ON</span>
</div>
<div class="flex gap-md">
<span class="material-symbols-outlined text-primary cursor-pointer active:scale-95 hover:bg-surface-container-high transition-colors p-2 rounded-full">notifications</span>
<span class="material-symbols-outlined text-primary cursor-pointer active:scale-95 hover:bg-surface-container-high transition-colors p-2 rounded-full">menu</span>
</div>
</nav>
<!-- Side Navigation Bar (Desktop) -->
<aside class="hidden md:flex flex-col h-full border-r border-outline-variant bg-surface w-sidebar-width h-screen fixed left-0 top-0 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] z-30 overflow-y-auto">
<div class="p-lg flex items-center gap-sm mb-md sticky top-0 bg-surface z-10">
<img class="w-10 h-10 rounded-lg shadow-sm" data-alt="A small, crisp logo icon representing an academic institution or LMS platform, using geometric shapes in indigo and teal on a clean white background." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmxZFT4xY7hGlfsWJH8cSPlFALFmrxK-4Ppdm-mu819Hh50MgAvJOixYFtpAPCDwUCBXy_a1kxKjbBE7XiCqZP8e0ez81IGy_UBe13VI4omRQSCS-EF785K08EMVDXIKaYwC9gDh6m4PePviCYM4TSjWxvBY-hZOBVuxcFsCrbGoVt0uSFye7XM0irDVF2ECjqxG5LeAjpbfus7xGrmz2RRiM5wEHDO7OsipgBlpV7T7SWDZdKOKmvgg"/>
<div>
<h1 class="font-headline-md text-headline-md font-extrabold text-primary">KSI-ON LMS</h1>
<p class="font-label-sm text-label-sm text-on-surface-variant">Academic Excellence</p>
</div>
</div>
<nav class="flex-1 px-md flex flex-col gap-base pb-xl">
<!-- Active Tab: Dashboard -->
<a class="bg-primary/10 text-primary border-l-4 border-primary rounded-r-full py-md px-lg transition-all flex items-center gap-md group" href="#">
<span class="material-symbols-outlined font-[500]" style="font-variation-settings: 'FILL' 1;">dashboard</span>
<span class="font-label-md text-label-md font-semibold">Dashboard</span>
</a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out rounded-r-full" href="#">
<span class="material-symbols-outlined">group</span>
<span class="font-label-md text-label-md">Users</span>
</a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out rounded-r-full" href="#">
<span class="material-symbols-outlined">school</span>
<span class="font-label-md text-label-md">Courses</span>
</a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out rounded-r-full" href="#">
<span class="material-symbols-outlined">quiz</span>
<span class="font-label-md text-label-md">Exams</span>
</a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out rounded-r-full" href="#">
<span class="material-symbols-outlined">campaign</span>
<span class="font-label-md text-label-md">Announcements</span>
</a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out rounded-r-full" href="#">
<span class="material-symbols-outlined">pending_actions</span>
<span class="font-label-md text-label-md">Activities</span>
</a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out rounded-r-full" href="#">
<span class="material-symbols-outlined">settings</span>
<span class="font-label-md text-label-md">Settings</span>
</a>
<div class="mt-md mb-xs px-lg font-label-sm text-label-sm text-outline uppercase tracking-wider">Administration</div>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out rounded-r-full" href="#">
<span class="material-symbols-outlined">class</span>
<span class="font-label-md text-label-md">Class Data</span>
</a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out rounded-r-full" href="#">
<span class="material-symbols-outlined">person_4</span>
<span class="font-label-md text-label-md">Teacher Data</span>
</a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out rounded-r-full" href="#">
<span class="material-symbols-outlined">person</span>
<span class="font-label-md text-label-md">Student Data</span>
</a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out rounded-r-full" href="#">
<span class="material-symbols-outlined">fact_check</span>
<span class="font-label-md text-label-md">Attendance</span>
</a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out rounded-r-full" href="#">
<span class="material-symbols-outlined">analytics</span>
<span class="font-label-md text-label-md">Evaluations</span>
</a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out rounded-r-full" href="#">
<span class="material-symbols-outlined">assessment</span>
<span class="font-label-md text-label-md">Reports</span>
</a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out rounded-r-full" href="#">
<span class="material-symbols-outlined">account_circle</span>
<span class="font-label-md text-label-md">Profile</span>
</a>
</nav>
<div class="p-md border-t border-outline-variant bg-surface sticky bottom-0">
<button class="w-full flex items-center justify-center gap-sm bg-surface-container text-on-surface py-sm px-md rounded-lg hover:bg-surface-container-high transition-colors mb-sm">
<span class="material-symbols-outlined text-[18px]">support_agent</span>
<span class="font-label-md text-label-md">Help Desk</span>
</button>
<a class="text-error flex items-center gap-md py-sm px-md hover:bg-error-container/30 transition-colors rounded-lg" href="#">
<span class="material-symbols-outlined">logout</span>
<span class="font-label-md text-label-md">Logout</span>
</a>
</div>
</aside>
<!-- Main Content Area -->
<main class="flex-1 md:ml-sidebar-width h-screen overflow-y-auto">
<!-- Top App Bar Desktop-->
<header class="hidden md:flex justify-between items-center px-margin-desktop py-md bg-surface/80 backdrop-blur-md sticky top-0 z-20 shadow-sm">
<div class="flex flex-col">
<h2 class="font-title-lg text-title-lg text-on-surface font-semibold">Dashboard</h2>
<p class="font-body-sm text-body-sm text-on-surface-variant">Welcome back, system admin</p>
</div>
<div class="flex items-center gap-md">
<button class="bg-surface-container flex items-center gap-xs px-sm py-xs rounded-full border border-outline-variant hover:border-primary transition-colors">
<span class="material-symbols-outlined text-[18px] text-on-surface-variant">refresh</span>
<span class="font-label-sm text-label-sm text-on-surface">Refresh</span>
</button>
<div class="w-px h-6 bg-outline-variant mx-xs"></div>
<div class="flex items-center gap-sm bg-primary/5 px-sm py-xs rounded-full border border-primary/20">
<span class="font-label-sm text-label-sm text-primary">Halo, admin system (Admin)</span>
<div class="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-[14px]">
                        AS
                    </div>
</div>
</div>
</header>
<div class="p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto space-y-xl">
<!-- Welcome Banner -->
<section class="relative bg-gradient-to-r from-primary to-surface-tint rounded-xl p-xl shadow-[0px_10px_30px_rgba(53,37,205,0.15)] overflow-hidden text-on-primary">
<!-- Decorative Elements -->
<div class="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl"></div>
<div class="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 bg-white opacity-10 rounded-full blur-xl"></div>
<div class="relative z-10 text-center">
<h3 class="font-headline-lg text-headline-lg mb-sm flex items-center justify-center gap-sm">
                        Selamat Datang! <span class="text-3xl">👋</span>
</h3>
<p class="font-body-md text-body-md opacity-90">
                        Hai Admin! Selamat mengelola platform pembelajaran ini dengan penuh tanggung jawab.
                    </p>
</div>
</section>
<!-- Statistik Sistem -->
<section>
<h4 class="font-title-lg text-title-lg mb-md text-on-surface">Statistik Sistem</h4>
<div class="grid grid-cols-2 md:grid-cols-4 gap-md">
<!-- Stat Card 1 -->
<div class="bg-surface rounded-xl p-md border border-outline-variant/50 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center gap-sm hover:-translate-y-1 transition-transform duration-300">
<div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-xs">
<span class="material-symbols-outlined text-[28px]" style="font-variation-settings: 'FILL' 1;">groups</span>
</div>
<span class="font-headline-lg text-headline-lg text-primary font-bold leading-none">43</span>
<span class="font-label-sm text-label-sm text-outline uppercase tracking-wider">Total Pengguna</span>
</div>
<!-- Stat Card 2 -->
<div class="bg-surface rounded-xl p-md border border-outline-variant/50 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center gap-sm hover:-translate-y-1 transition-transform duration-300">
<div class="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-xs">
<span class="material-symbols-outlined text-[28px]" style="font-variation-settings: 'FILL' 1;">library_books</span>
</div>
<span class="font-headline-lg text-headline-lg text-primary font-bold leading-none">6</span>
<span class="font-label-sm text-label-sm text-outline uppercase tracking-wider">Total Kursus</span>
</div>
<!-- Stat Card 3 -->
<div class="bg-surface rounded-xl p-md border border-outline-variant/50 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center gap-sm hover:-translate-y-1 transition-transform duration-300">
<div class="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 mb-xs">
<span class="material-symbols-outlined text-[28px]" style="font-variation-settings: 'FILL' 1;">assignment</span>
</div>
<span class="font-headline-lg text-headline-lg text-primary font-bold leading-none">0</span>
<span class="font-label-sm text-label-sm text-outline uppercase tracking-wider">Total Tugas</span>
</div>
<!-- Stat Card 4 -->
<div class="bg-surface rounded-xl p-md border border-outline-variant/50 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center gap-sm hover:-translate-y-1 transition-transform duration-300">
<div class="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600 mb-xs">
<span class="material-symbols-outlined text-[28px]" style="font-variation-settings: 'FILL' 1;">file_upload</span>
</div>
<span class="font-headline-lg text-headline-lg text-primary font-bold leading-none">0</span>
<span class="font-label-sm text-label-sm text-outline uppercase tracking-wider">Total Pengumpulan</span>
</div>
</div>
</section>
<!-- Pengguna Berdasarkan Peran -->
<section>
<h4 class="font-title-lg text-title-lg mb-md text-on-surface">Pengguna Berdasarkan Peran</h4>
<div class="grid grid-cols-1 md:grid-cols-3 gap-md">
<!-- Murid -->
<div class="glass-panel rounded-xl p-md flex items-center gap-lg">
<div class="w-14 h-14 rounded-full bg-secondary-container/30 flex items-center justify-center text-secondary">
<span class="material-symbols-outlined text-[32px]">school</span>
</div>
<div>
<div class="font-headline-md text-headline-md text-primary font-bold">34</div>
<div class="font-label-sm text-label-sm text-outline uppercase tracking-wider">Murid</div>
</div>
</div>
<!-- Guru -->
<div class="glass-panel rounded-xl p-md flex items-center gap-lg">
<div class="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
<span class="material-symbols-outlined text-[32px]">cast_for_education</span>
</div>
<div>
<div class="font-headline-md text-headline-md text-primary font-bold">7</div>
<div class="font-label-sm text-label-sm text-outline uppercase tracking-wider">Guru</div>
</div>
</div>
<!-- Admin -->
<div class="glass-panel rounded-xl p-md flex items-center gap-lg border-l-4 border-l-primary">
<div class="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
<span class="material-symbols-outlined text-[32px]">admin_panel_settings</span>
</div>
<div>
<div class="font-headline-md text-headline-md text-primary font-bold">2</div>
<div class="font-label-sm text-label-sm text-outline uppercase tracking-wider">Admin</div>
</div>
</div>
</div>
</section>
<!-- Aktivitas Terbaru -->
<section class="bg-surface rounded-xl border border-outline-variant/50 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col">
<div class="p-md border-b border-outline-variant/50 flex justify-between items-center bg-surface-container-lowest">
<h4 class="font-title-lg text-title-lg text-on-surface">Aktivitas Terbaru</h4>
<button class="flex items-center gap-xs bg-primary text-on-primary px-md py-xs rounded-lg text-label-sm font-label-sm shadow-sm hover:bg-surface-tint transition-colors">
<span class="material-symbols-outlined text-[16px]">sync</span>
                        Refresh Data
                    </button>
</div>
<div class="overflow-x-auto">
<table class="w-full text-left border-collapse">
<thead>
<tr class="bg-surface-container-low border-b border-outline-variant/50">
<th class="py-sm px-lg font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">Siswa</th>
<th class="py-sm px-lg font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">Tugas</th>
<th class="py-sm px-lg font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">Kursus</th>
<th class="py-sm px-lg font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">Waktu</th>
<th class="py-sm px-lg font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">Nilai</th>
</tr>
</thead>
<tbody class="divide-y divide-outline-variant/30">
<!-- Empty State for now as per image -->
<tr>
<td class="py-xl text-center text-outline font-body-sm" colspan="5">
<div class="flex flex-col items-center justify-center opacity-50">
<span class="material-symbols-outlined text-[48px] mb-xs">history</span>
<p>Belum ada aktivitas terbaru.</p>
</div>
</td>
</tr>
</tbody>
</table>
</div>
</section>
</div>
</main>
</body></html>

<!-- Dasbor Guru - KSI-ON Redesign -->
<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>KSI-ON LMS - Teacher Dashboard</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700;800&amp;family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              "colors": {
                      "on-secondary-container": "#004666",
                      "outline": "#777587",
                      "surface-container": "#e5eeff",
                      "surface-container-low": "#eff4ff",
                      "inverse-surface": "#213145",
                      "tertiary-fixed-dim": "#ffb2b7",
                      "on-error": "#ffffff",
                      "on-tertiary": "#ffffff",
                      "tertiary": "#95002b",
                      "surface-dim": "#cbdbf5",
                      "on-primary-container": "#dad7ff",
                      "on-primary": "#ffffff",
                      "on-primary-fixed": "#0f0069",
                      "inverse-primary": "#c3c0ff",
                      "on-error-container": "#93000a",
                      "error": "#ba1a1a",
                      "on-tertiary-container": "#ffd0d2",
                      "surface": "#f8f9ff",
                      "on-background": "#0b1c30",
                      "on-tertiary-fixed": "#40000d",
                      "primary-fixed-dim": "#c3c0ff",
                      "inverse-on-surface": "#eaf1ff",
                      "surface-variant": "#d3e4fe",
                      "tertiary-container": "#bf0f3c",
                      "secondary": "#006591",
                      "on-surface": "#0b1c30",
                      "primary-fixed": "#e2dfff",
                      "on-secondary-fixed": "#001e2f",
                      "on-surface-variant": "#464555",
                      "outline-variant": "#c7c4d8",
                      "surface-bright": "#f8f9ff",
                      "surface-container-highest": "#d3e4fe",
                      "on-secondary-fixed-variant": "#004c6e",
                      "on-secondary": "#ffffff",
                      "surface-container-high": "#dce9ff",
                      "secondary-fixed": "#c9e6ff",
                      "secondary-fixed-dim": "#89ceff",
                      "tertiary-fixed": "#ffdadb",
                      "surface-container-lowest": "#ffffff",
                      "primary": "#3525cd",
                      "surface-tint": "#4d44e3",
                      "on-tertiary-fixed-variant": "#92002a",
                      "background": "#f8f9ff",
                      "error-container": "#ffdad6",
                      "on-primary-fixed-variant": "#3323cc",
                      "secondary-container": "#39b8fd",
                      "primary-container": "#4f46e5"
              },
              "borderRadius": {
                      "DEFAULT": "0.25rem",
                      "lg": "0.5rem",
                      "xl": "0.75rem",
                      "full": "9999px"
              },
              "spacing": {
                      "md": "16px",
                      "2xl": "48px",
                      "xl": "32px",
                      "sm": "12px",
                      "base": "4px",
                      "gutter": "24px",
                      "xs": "8px",
                      "margin-mobile": "16px",
                      "lg": "24px",
                      "margin-desktop": "32px",
                      "sidebar-width": "280px"
              },
              "fontFamily": {
                      "title-md": [
                              "Inter"
                      ],
                      "body-lg": [
                              "Inter"
                      ],
                      "headline-lg": [
                              "Hanken Grotesk"
                      ],
                      "label-sm": [
                              "Inter"
                      ],
                      "body-md": [
                              "Inter"
                      ],
                      "display-lg": [
                              "Hanken Grotesk"
                      ],
                      "body-sm": [
                              "Inter"
                      ],
                      "label-md": [
                              "Inter"
                      ],
                      "headline-md": [
                              "Hanken Grotesk"
                      ],
                      "title-lg": [
                              "Inter"
                      ]
              },
              "fontSize": {
                      "title-md": [
                              "16px",
                              {
                                      "lineHeight": "24px",
                                      "fontWeight": "600"
                              }
                      ],
                      "body-lg": [
                              "18px",
                              {
                                      "lineHeight": "28px",
                                      "fontWeight": "400"
                              }
                      ],
                      "headline-lg": [
                              "32px",
                              {
                                      "lineHeight": "40px",
                                      "letterSpacing": "-0.01em",
                                      "fontWeight": "600"
                              }
                      ],
                      "label-sm": [
                              "12px",
                              {
                                      "lineHeight": "16px",
                                      "fontWeight": "600"
                              }
                      ],
                      "body-md": [
                              "16px",
                              {
                                      "lineHeight": "24px",
                                      "fontWeight": "400"
                              }
                      ],
                      "display-lg": [
                              "48px",
                              {
                                      "lineHeight": "56px",
                                      "letterSpacing": "-0.02em",
                                      "fontWeight": "700"
                              }
                      ],
                      "body-sm": [
                              "14px",
                              {
                                      "lineHeight": "20px",
                                      "fontWeight": "400"
                              }
                      ],
                      "label-md": [
                              "14px",
                              {
                                      "lineHeight": "20px",
                                      "letterSpacing": "0.01em",
                                      "fontWeight": "500"
                              }
                      ],
                      "headline-md": [
                              "24px",
                              {
                                      "lineHeight": "32px",
                                      "fontWeight": "600"
                              }
                      ],
                      "title-lg": [
                              "20px",
                              {
                                      "lineHeight": "28px",
                                      "fontWeight": "600"
                              }
                      ]
              }
      },
          },
        }
      </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .material-symbols-outlined.filled {
            font-variation-settings: 'FILL' 1;
        }
        
        /* Custom scrollbar for sidebar */
        .sidebar-scroll::-webkit-scrollbar {
            width: 4px;
        }
        .sidebar-scroll::-webkit-scrollbar-track {
            background: transparent;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb {
            background-color: #c7c4d8;
            border-radius: 4px;
        }
    </style>
</head>
<body class="bg-background text-on-background font-body-md min-h-screen flex">
<!-- SideNavBar Component -->
<nav class="hidden md:flex w-sidebar-width h-screen fixed left-0 top-0 shadow-lg bg-surface dark:bg-on-background flex-col border-r border-outline-variant z-50">
<div class="p-lg border-b border-outline-variant">
<div class="flex items-center gap-sm">
<img alt="KSI-ON Logo" class="w-10 h-10 rounded-full" data-alt="A small circular logo featuring a crest with academic symbols, designed in a modern flat style with a blue and white color palette." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAxfQFOaXXExGKH9pxQXjsi4xDTAcUtx5xSLMufmi2v_qpBhaOxit7v8vLQ7LE2Td3wc00fV2AXk-HQFBMYhb-imwHhLNxV8ReMNqyq6JGZfdv0_xbzhjG092oOOpSL7oZILz1J1_X4dbwIampY-jU7ehKeDhqUrHCOTlDN7rnINQNFrqGRIA0MRg9EzD5GUyvH5QBnXNqcalprRctGaoDxa96cDiZXCEOogwmSVA4jUxxjUZ3xod4bOg"/>
<div>
<h1 class="font-headline-md text-headline-md font-extrabold text-primary">KSI-ON LMS</h1>
<p class="font-label-sm text-label-sm text-on-surface-variant">Academic Excellence</p>
</div>
</div>
</div>
<div class="flex-1 overflow-y-auto sidebar-scroll py-md">
<ul class="space-y-base">
<li>
<a class="bg-primary/10 text-primary border-l-4 border-primary rounded-r-full py-md px-lg transition-all flex items-center gap-md font-label-md text-label-md" href="#">
<span class="material-symbols-outlined filled">dashboard</span>
                        Dashboard
                    </a>
</li>
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md" href="#">
<span class="material-symbols-outlined">school</span>
                        Kursus
                    </a>
</li>
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md" href="#">
<span class="material-symbols-outlined">quiz</span>
                        Ujian
                    </a>
</li>
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md" href="#">
<span class="material-symbols-outlined">menu_book</span>
                        Materi
                    </a>
</li>
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md" href="#">
<span class="material-symbols-outlined">assignment</span>
                        Tugas
                    </a>
</li>
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md" href="#">
<span class="material-symbols-outlined">campaign</span>
                        Pengumuman
                    </a>
</li>
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md" href="#">
<span class="material-symbols-outlined">group</span>
                        Murid
                    </a>
</li>
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md" href="#">
<span class="material-symbols-outlined">chat</span>
                        Pesan
                    </a>
</li>
<!-- Section Header -->
<li class="px-lg pt-md pb-xs">
<span class="font-label-sm text-label-sm text-outline uppercase tracking-wider">ADMINISTRASI</span>
</li>
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md" href="#">
<span class="material-symbols-outlined">book</span>
                        Jurnal Mengajar
                    </a>
</li>
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md" href="#">
<span class="material-symbols-outlined">fact_check</span>
                        Absensi Siswa
                    </a>
</li>
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md" href="#">
<span class="material-symbols-outlined">analytics</span>
                        Penilaian Siswa
                    </a>
</li>
<!-- Section Header -->
<li class="px-lg pt-md pb-xs">
<span class="font-label-sm text-label-sm text-outline uppercase tracking-wider">LAPORAN</span>
</li>
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md" href="#">
<span class="material-symbols-outlined">assessment</span>
                        Laporan Absensi
                    </a>
</li>
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md" href="#">
<span class="material-symbols-outlined">assessment</span>
                        Laporan Penilaian
                    </a>
</li>
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md" href="#">
<span class="material-symbols-outlined">account_circle</span>
                        Profil
                    </a>
</li>
</ul>
</div>
<div class="p-lg border-t border-outline-variant">
<a class="text-on-surface-variant py-md flex items-center gap-md hover:text-primary transition-colors font-label-md text-label-md" href="#">
<span class="material-symbols-outlined">logout</span>
                Keluar
            </a>
</div>
</nav>
<!-- Main Content Area -->
<main class="flex-1 md:ml-sidebar-width min-h-screen flex flex-col relative overflow-hidden">
<!-- TopNavBar Component -->
<header class="flex justify-between items-center px-lg py-xs w-full z-40 bg-surface/70 dark:bg-on-background/70 backdrop-blur-md sticky top-0 border-b border-outline-variant shadow-sm font-body-md text-body-md">
<!-- Mobile Menu Button -->
<button class="md:hidden text-on-surface-variant p-sm rounded-lg hover:bg-surface-container-high transition-colors">
<span class="material-symbols-outlined">menu</span>
</button>
<!-- Breadcrumbs / Title Context -->
<div class="hidden md:flex items-center gap-sm">
<span class="font-title-md text-title-md text-primary">Dasbor Guru</span>
</div>
<!-- Trailing Actions -->
<div class="flex items-center gap-lg">
<div class="flex items-center gap-sm">
<button class="text-on-surface-variant hover:bg-surface-container-high transition-colors p-xs rounded-full cursor-pointer active:scale-95 relative">
<span class="material-symbols-outlined">notifications</span>
<span class="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
</button>
<button class="text-on-surface-variant hover:bg-surface-container-high transition-colors p-xs rounded-full cursor-pointer active:scale-95">
<span class="material-symbols-outlined">help</span>
</button>
</div>
<div class="h-6 w-px bg-outline-variant"></div>
<div class="flex items-center gap-sm bg-surface-container-low rounded-full px-sm py-xs border border-outline-variant">
<div class="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-title-md">
                        R
                    </div>
<span class="font-label-sm text-label-sm hidden lg:block">Halo, Rayhans (Guru)</span>
</div>
</div>
</header>
<!-- Canvas Area -->
<div class="flex-1 p-margin-mobile md:p-margin-desktop space-y-xl max-w-7xl mx-auto w-full z-10 relative">
<!-- Welcome Header -->
<div class="flex flex-col md:flex-row md:items-center justify-between gap-md">
<div>
<h2 class="font-headline-lg text-headline-lg text-on-background">Dasbor Guru</h2>
<p class="font-body-md text-body-md text-on-surface-variant">Selamat datang, Rayhans</p>
</div>
<button class="flex items-center gap-xs bg-surface-container-lowest border border-outline-variant px-md py-sm rounded-lg shadow-sm hover:bg-surface-container-low transition-colors text-on-surface font-label-md text-label-md w-fit">
<span class="material-symbols-outlined text-[18px]">refresh</span>
                    Refresh
                </button>
</div>
<!-- Banner -->
<div class="bg-gradient-to-r from-primary to-surface-tint rounded-xl p-xl shadow-[0px_10px_30px_rgba(53,37,205,0.2)] text-on-primary relative overflow-hidden flex flex-col items-center justify-center text-center min-h-[160px]">
<div class="absolute inset-0 bg-white/5 backdrop-blur-[2px]"></div>
<!-- Decorative circles -->
<div class="absolute -top-12 -left-12 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
<div class="absolute -bottom-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-xl"></div>
<div class="relative z-10">
<h3 class="font-headline-md text-headline-md mb-xs flex items-center justify-center gap-sm">
                        Selamat Siang! <span class="text-2xl">👋</span>
</h3>
<p class="font-body-md text-body-md text-on-primary/90">Hai Guru! Selamat mengajar. Semoga hari Anda penuh berkah dan inspirasi untuk para murid.</p>
</div>
</div>
<!-- Stats Grid -->
<div>
<h4 class="font-title-lg text-title-lg mb-md flex items-center gap-sm">
<span class="material-symbols-outlined text-primary">bar_chart</span>
                    Statistik Saya
                </h4>
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
<!-- Stat Card 1 -->
<div class="bg-surface-container-lowest rounded-xl p-lg shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/30 flex flex-col items-center justify-center text-center hover:shadow-[0px_10px_30px_rgba(0,0,0,0.08)] transition-shadow">
<div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-md">
<span class="material-symbols-outlined">school</span>
</div>
<span class="font-display-lg text-display-lg text-primary mb-xs">1</span>
<span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Kursus Saya</span>
</div>
<!-- Stat Card 2 -->
<div class="bg-surface-container-lowest rounded-xl p-lg shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/30 flex flex-col items-center justify-center text-center hover:shadow-[0px_10px_30px_rgba(0,0,0,0.08)] transition-shadow">
<div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-md">
<span class="material-symbols-outlined">assignment</span>
</div>
<span class="font-display-lg text-display-lg text-primary mb-xs">0</span>
<span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Total Tugas</span>
</div>
<!-- Stat Card 3 -->
<div class="bg-surface-container-lowest rounded-xl p-lg shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/30 flex flex-col items-center justify-center text-center hover:shadow-[0px_10px_30px_rgba(0,0,0,0.08)] transition-shadow">
<div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-md">
<span class="material-symbols-outlined">pending_actions</span>
</div>
<span class="font-display-lg text-display-lg text-primary mb-xs">0</span>
<span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Menunggu Penilaian</span>
</div>
<!-- Stat Card 4 -->
<div class="bg-surface-container-lowest rounded-xl p-lg shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/30 flex flex-col items-center justify-center text-center hover:shadow-[0px_10px_30px_rgba(0,0,0,0.08)] transition-shadow">
<div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-md">
<span class="material-symbols-outlined">group</span>
</div>
<span class="font-display-lg text-display-lg text-primary mb-xs">0</span>
<span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Total Murid</span>
</div>
</div>
</div>
<!-- Notifications List -->
<div>
<h4 class="font-title-lg text-title-lg mb-md flex items-center gap-sm">
<span class="material-symbols-outlined text-primary">notifications_active</span>
                    Notifikasi
                    <span class="bg-error text-on-error font-label-sm text-[10px] px-2 py-0.5 rounded-full ml-xs">3</span>
</h4>
<div class="space-y-sm">
<!-- Notification Item -->
<div class="bg-surface-container-low border border-primary/20 rounded-xl p-md flex items-start gap-md hover:bg-surface-container-high transition-colors cursor-pointer group">
<div class="mt-1 text-primary group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined text-[20px]">assignment_turned_in</span>
</div>
<div class="flex-1">
<p class="font-body-sm text-body-sm text-on-surface">
<span class="font-semibold text-primary">Murid daijinnnnn@gmail.com</span> telah mengumpulkan tugas <span class="italic">"greetings and introductions"</span>
</p>
<p class="font-label-sm text-label-sm text-on-surface-variant mt-xs">2/18/2026, 11:30:36 AM</p>
</div>
</div>
<!-- Notification Item -->
<div class="bg-surface-container-low border border-primary/20 rounded-xl p-md flex items-start gap-md hover:bg-surface-container-high transition-colors cursor-pointer group">
<div class="mt-1 text-primary group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined text-[20px]">assignment_turned_in</span>
</div>
<div class="flex-1">
<p class="font-body-sm text-body-sm text-on-surface">
<span class="font-semibold text-primary">Murid daijinnnnn@gmail.com</span> telah mengumpulkan tugas <span class="italic">"greetings and introductions"</span>
</p>
<p class="font-label-sm text-label-sm text-on-surface-variant mt-xs">2/17/2026, 3:17:00 PM</p>
</div>
</div>
<!-- Notification Item -->
<div class="bg-surface-container-low border border-primary/20 rounded-xl p-md flex items-start gap-md hover:bg-surface-container-high transition-colors cursor-pointer group">
<div class="mt-1 text-primary group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined text-[20px]">assignment_turned_in</span>
</div>
<div class="flex-1">
<p class="font-body-sm text-body-sm text-on-surface">
<span class="font-semibold text-primary">Murid daijinnnnn@gmail.com</span> telah mengumpulkan tugas <span class="italic">"greetings and introductions"</span>
</p>
<p class="font-label-sm text-label-sm text-on-surface-variant mt-xs">2/13/2026, 11:17:58 AM</p>
</div>
</div>
</div>
</div>
<!-- My Courses Section -->
<div>
<h4 class="font-title-lg text-title-lg mb-md flex items-center gap-sm">
<span class="material-symbols-outlined text-primary">menu_book</span>
                    Kursus Saya
                </h4>
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
<!-- Course Card -->
<div class="bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/30 flex flex-col hover:shadow-[0px_10px_30px_rgba(0,0,0,0.1)] transition-all cursor-pointer group">
<div class="h-32 bg-surface-variant flex items-center justify-center relative overflow-hidden">
<!-- Abstract Math/Science Pattern placeholder -->
<div class="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0yMCAyMGMyLjIgMCA0LTEuOCA0LTRzLTEuOC00LTQtNC00IDEuOC00IDQgMS.4 NCA0IDR6bTAgNWMtNC40IDAtOCAzLjYtOCA4aDE2Yy0wLTQuNC0zLjYtOC04LTh6IiBmaWxsPSIjMzUyNWNkIi8+PC9zdmc+')]"></div>
<span class="font-headline-md text-headline-md text-primary tracking-widest z-10 group-hover:scale-105 transition-transform">PELUANG</span>
<!-- Category Badge -->
<div class="absolute top-sm right-sm bg-surface-container-lowest/80 backdrop-blur-sm px-2 py-1 rounded-md">
<span class="font-label-sm text-label-sm text-primary">MAT</span>
</div>
</div>
<div class="p-md flex-1 flex flex-col justify-between">
<div>
<h5 class="font-title-md text-title-md mb-xs line-clamp-1">Matematika: Peluang &amp; Statistika Dasar</h5>
<p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">Materi pengenalan tentang peluang suatu kejadian dan dasar-dasar statistika.</p>
</div>
<div class="mt-md pt-md border-t border-outline-variant/50 flex justify-between items-center">
<span class="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">group</span> 0 Siswa</span>
<span class="text-primary font-label-sm text-label-sm group-hover:underline">Kelola Kelas</span>
</div>
</div>
</div>
</div>
</div>
</div>
</main>
</body></html>

<!-- Kursus Saya - Murid -->
<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>KSI-ON LMS - Halaman Kursus Murid</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700;800&amp;family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              "colors": {
                      "secondary-fixed": "#c9e6ff",
                      "secondary-container": "#39b8fd",
                      "primary": "#3525cd",
                      "surface-container-low": "#eff4ff",
                      "on-error-container": "#93000a",
                      "on-tertiary-fixed": "#40000d",
                      "outline": "#777587",
                      "on-tertiary": "#ffffff",
                      "on-background": "#0b1c30",
                      "error-container": "#ffdad6",
                      "tertiary-fixed-dim": "#ffb2b7",
                      "surface-variant": "#d3e4fe",
                      "outline-variant": "#c7c4d8",
                      "tertiary-fixed": "#ffdadb",
                      "on-tertiary-container": "#ffd0d2",
                      "on-primary-container": "#dad7ff",
                      "on-surface-variant": "#464555",
                      "on-secondary-fixed-variant": "#004c6e",
                      "on-primary-fixed-variant": "#3323cc",
                      "secondary": "#006591",
                      "on-secondary-container": "#004666",
                      "error": "#ba1a1a",
                      "surface-container-highest": "#d3e4fe",
                      "primary-fixed": "#e2dfff",
                      "on-secondary": "#ffffff",
                      "on-primary-fixed": "#0f0069",
                      "secondary-fixed-dim": "#89ceff",
                      "on-secondary-fixed": "#001e2f",
                      "surface-tint": "#4d44e3",
                      "primary-fixed-dim": "#c3c0ff",
                      "surface-container-high": "#dce9ff",
                      "on-surface": "#0b1c30",
                      "tertiary": "#95002b",
                      "inverse-primary": "#c3c0ff",
                      "surface-container": "#e5eeff",
                      "inverse-on-surface": "#eaf1ff",
                      "surface-bright": "#f8f9ff",
                      "surface": "#f8f9ff",
                      "surface-container-lowest": "#ffffff",
                      "on-error": "#ffffff",
                      "tertiary-container": "#bf0f3c",
                      "primary-container": "#4f46e5",
                      "background": "#f8f9ff",
                      "surface-dim": "#cbdbf5",
                      "on-tertiary-fixed-variant": "#92002a",
                      "inverse-surface": "#213145",
                      "on-primary": "#ffffff"
              },
              "borderRadius": {
                      "DEFAULT": "0.25rem",
                      "lg": "0.5rem",
                      "xl": "0.75rem",
                      "full": "9999px"
              },
              "spacing": {
                      "margin-desktop": "32px",
                      "margin-mobile": "16px",
                      "sm": "12px",
                      "lg": "24px",
                      "gutter": "24px",
                      "base": "4px",
                      "sidebar-width": "280px",
                      "xl": "32px",
                      "xs": "8px",
                      "md": "16px",
                      "2xl": "48px"
              },
              "fontFamily": {
                      "label-md": [
                              "Inter"
                      ],
                      "headline-md": [
                              "Hanken Grotesk"
                      ],
                      "body-lg": [
                              "Inter"
                      ],
                      "headline-lg": [
                              "Hanken Grotesk"
                      ],
                      "body-sm": [
                              "Inter"
                      ],
                      "label-sm": [
                              "Inter"
                      ],
                      "body-md": [
                              "Inter"
                      ],
                      "title-md": [
                              "Inter"
                      ],
                      "title-lg": [
                              "Inter"
                      ],
                      "display-lg": [
                              "Hanken Grotesk"
                      ]
              },
              "fontSize": {
                      "label-md": [
                              "14px",
                              {
                                      "lineHeight": "20px",
                                      "letterSpacing": "0.01em",
                                      "fontWeight": "500"
                              }
                      ],
                      "headline-md": [
                              "24px",
                              {
                                      "lineHeight": "32px",
                                      "fontWeight": "600"
                              }
                      ],
                      "body-lg": [
                              "18px",
                              {
                                      "lineHeight": "28px",
                                      "fontWeight": "400"
                              }
                      ],
                      "headline-lg": [
                              "32px",
                              {
                                      "lineHeight": "40px",
                                      "letterSpacing": "-0.01em",
                                      "fontWeight": "600"
                              }
                      ],
                      "body-sm": [
                              "14px",
                              {
                                      "lineHeight": "20px",
                                      "fontWeight": "400"
                              }
                      ],
                      "label-sm": [
                              "12px",
                              {
                                      "lineHeight": "16px",
                                      "fontWeight": "600"
                              }
                      ],
                      "body-md": [
                              "16px",
                              {
                                      "lineHeight": "24px",
                                      "fontWeight": "400"
                              }
                      ],
                      "title-md": [
                              "16px",
                              {
                                      "lineHeight": "24px",
                                      "fontWeight": "600"
                              }
                      ],
                      "title-lg": [
                              "20px",
                              {
                                      "lineHeight": "28px",
                                      "fontWeight": "600"
                              }
                      ],
                      "display-lg": [
                              "48px",
                              {
                                      "lineHeight": "56px",
                                      "letterSpacing": "-0.02em",
                                      "fontWeight": "700"
                              }
                      ]
              }
      },
          },
        }
    </script>
<style>
        .glass-panel {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.5);
        }
        .progress-bar-track {
            background: rgba(53, 37, 205, 0.1); /* Primary color at 10% */
        }
        .murid-accent {
            color: #006591; /* secondary color for murid */
        }
        .murid-bg-accent {
            background-color: rgba(0, 101, 145, 0.1);
        }
    </style>
</head>
<body class="bg-background text-on-surface font-body-md antialiased min-h-screen flex">
<!-- SideNavBar -->
<aside class="w-sidebar-width h-screen fixed left-0 top-0 bg-surface shadow-[0px_4px_20px_rgba(0,0,0,0.05)] flex flex-col h-full border-r border-outline-variant z-50 hidden md:flex">
<!-- Header -->
<div class="p-lg border-b border-outline-variant/50">
<div class="flex items-center gap-sm">
<div class="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container font-headline-md font-bold">
                    K
                </div>
<div>
<h1 class="font-headline-md text-headline-md font-extrabold text-primary">KSI-ON LMS</h1>
<p class="font-label-sm text-label-sm text-on-surface-variant">Academic Excellence</p>
</div>
</div>
</div>
<!-- Navigation Tabs -->
<nav aria-label="Main Navigation" class="flex-1 overflow-y-auto py-sm">
<ul class="space-y-base">
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">dashboard</span>
                        Dashboard
                    </a>
</li>
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">group</span>
                        Users
                    </a>
</li>
<li>
<a class="bg-primary/10 text-primary border-l-4 border-primary rounded-r-full py-md px-lg transition-all flex items-center gap-md font-label-md text-label-md" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">school</span>
                        Courses
                    </a>
</li>
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">quiz</span>
                        Exams
                    </a>
</li>
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">campaign</span>
                        Announcements
                    </a>
</li>
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">pending_actions</span>
                        Activities
                    </a>
</li>
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">settings</span>
                        Settings
                    </a>
</li>
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">class</span>
                        Class Data
                    </a>
</li>
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">person_4</span>
                        Teacher Data
                    </a>
</li>
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">person</span>
                        Student Data
                    </a>
</li>
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">fact_check</span>
                        Attendance
                    </a>
</li>
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">analytics</span>
                        Evaluations
                    </a>
</li>
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">assessment</span>
                        Reports
                    </a>
</li>
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">account_circle</span>
                        Profile
                    </a>
</li>
</ul>
</nav>
<!-- Footer Actions -->
<div class="p-lg border-t border-outline-variant/50 flex flex-col gap-sm">
<button class="w-full flex items-center justify-center gap-xs py-sm px-md rounded-lg bg-surface-container-high text-primary hover:bg-primary-container hover:text-on-primary-container transition-colors font-label-md text-label-md">
<span class="material-symbols-outlined">help</span>
                Help Desk
            </button>
<a class="flex items-center gap-md py-sm px-md text-on-surface-variant hover:text-error transition-colors font-label-md text-label-md" href="#">
<span class="material-symbols-outlined">logout</span>
                Logout
            </a>
</div>
</aside>
<!-- Main Content Area -->
<main class="flex-1 flex flex-col md:ml-[280px] min-w-0 bg-surface-bright">
<!-- TopNavBar -->
<header class="bg-surface/70 backdrop-blur-md flex justify-between items-center px-lg py-xs w-full z-40 sticky top-0 border-b border-outline-variant shadow-sm transition-colors">
<div class="flex items-center gap-md">
<!-- Mobile Menu Button (Visible only on small screens) -->
<button class="md:hidden text-on-surface-variant p-sm rounded-full hover:bg-surface-container-high transition-colors">
<span class="material-symbols-outlined">menu</span>
</button>
<div class="font-display-lg text-display-lg font-bold text-primary md:hidden">KSI-ON</div>
<!-- Search Bar -->
<div class="hidden sm:flex items-center bg-surface-container-highest rounded-full px-md py-xs border border-outline-variant/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
<span class="material-symbols-outlined text-outline">search</span>
<input class="bg-transparent border-none focus:ring-0 text-body-sm font-body-sm text-on-surface w-64 placeholder-outline" placeholder="Cari kursus..." type="text"/>
</div>
</div>
<div class="flex items-center gap-sm">
<button aria-label="Notifications" class="text-on-surface-variant p-sm rounded-full hover:bg-surface-container-high transition-colors relative">
<span class="material-symbols-outlined">notifications</span>
<span class="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border border-surface"></span>
</button>
<button aria-label="Help" class="text-on-surface-variant p-sm rounded-full hover:bg-surface-container-high transition-colors">
<span class="material-symbols-outlined">help</span>
</button>
<div class="h-8 w-px bg-outline-variant/50 mx-xs"></div>
<button class="flex items-center gap-xs px-sm py-xs rounded-full hover:bg-surface-container-high transition-colors font-label-md text-label-md text-on-surface-variant">
<img alt="User profile" class="w-8 h-8 rounded-full object-cover border border-outline-variant/30" data-alt="A professional headshot of a student in a bright, modern learning environment, soft natural lighting, high resolution portrait." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBK4qSmKi21G7HVy16ESazVoXPfKL4Csq7Iej7jRzAWMD6IDHxGdqwgM0dcYcV9Si4XI_zP-J-wRB82mqDrrJtRQvIw5fLfzRZHn6j--hLVb_AY1KGafgEBADviDPVmZvIOtFGb7I5S2CxCG_nZpFAZosQNljVuyqcAibOqxOVuBEBRElkMUKsDw6gO45DHmMnLZEh__-rS5IDODkfRw1UB6uGC5CWtEH7_Vs0V2GM6dYtoNHRjS7IxVw"/>
<span class="hidden lg:block">Budi Santoso</span>
<span class="material-symbols-outlined text-[18px]">expand_more</span>
</button>
</div>
</header>
<!-- Page Content -->
<div class="p-margin-mobile md:p-margin-desktop flex-1 overflow-y-auto">
<!-- Page Header & Filters -->
<div class="flex flex-col md:flex-row md:items-end justify-between gap-md mb-lg">
<div>
<h2 class="font-headline-lg text-headline-lg text-on-surface mb-xs">Kursus Saya</h2>
<p class="font-body-md text-body-md text-on-surface-variant">Lanjutkan pembelajaran Anda untuk mencapai target akademik.</p>
</div>
<div class="flex flex-wrap items-center gap-sm">
<!-- Category Filter -->
<div class="relative">
<select class="appearance-none bg-surface border border-outline-variant rounded-lg pl-md pr-xl py-sm font-label-md text-label-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-sm">
<option>Semua Kategori</option>
<option>Sains &amp; Matematika</option>
<option>Bahasa &amp; Sastra</option>
<option>Ilmu Sosial</option>
<option>Teknologi</option>
</select>
<span class="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
</div>
<!-- Status Filter -->
<div class="flex bg-surface-container-low rounded-lg p-1 border border-outline-variant/50">
<button class="px-md py-xs rounded-md bg-surface shadow-sm font-label-md text-label-md text-primary font-semibold transition-all">Sedang Berjalan</button>
<button class="px-md py-xs rounded-md font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-all">Selesai</button>
</div>
</div>
</div>
<!-- Bento Grid / Course Cards -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter">
<!-- Course Card 1 -->
<article class="bg-surface rounded-xl border border-outline-variant/30 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col group hover:-translate-y-1 transition-transform duration-300">
<div class="h-32 relative w-full overflow-hidden">
<div class="bg-cover bg-center w-full h-full transform group-hover:scale-105 transition-transform duration-500" data-alt="A macro shot of complex mathematical equations written on a clear glass board with vibrant blue markers, highly detailed, soft studio lighting, professional educational aesthetic." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuBts9-wkJs0h3oSzWMPYb77yRG0XwHjDBIAt4TpMXgtiwtrzrZpV7GWkuPjVZbFz7SA9KhrVUnOi9BY68aQwEXT4foarF9Ke6pTajKh_uFgf90G-hBJg_BtTXAvenmycJcp-0uEvI3Qyflm8Y87PJq7KbIpqFaPyJqfh-6sa6kXIMOpDuGPr-JXCSkC0NjYrB3v4T91sY_08LnUdm-0XKAzhw-fTVdqJF4_oCRYQ7ACUa_zpiq3QZvleQ')"></div>
<div class="absolute top-sm right-sm bg-surface/90 backdrop-blur-sm px-sm py-xs rounded-full flex items-center gap-xs shadow-sm">
<div class="w-2 h-2 rounded-full bg-secondary"></div>
<span class="font-label-sm text-label-sm text-on-surface">Sains</span>
</div>
</div>
<div class="p-md flex flex-col flex-1">
<h3 class="font-title-lg text-title-lg text-on-surface mb-xs line-clamp-2 leading-tight group-hover:text-primary transition-colors">Matematika Lanjut: Kalkulus Integral</h3>
<div class="flex items-center gap-xs mb-md mt-auto pt-sm">
<span class="material-symbols-outlined text-[16px] text-on-surface-variant">person</span>
<span class="font-body-sm text-body-sm text-on-surface-variant">Dr. Andi Wijaya</span>
</div>
<div class="space-y-xs mb-md">
<div class="flex justify-between items-center">
<span class="font-label-sm text-label-sm text-on-surface-variant">Progress Belajar</span>
<span class="font-label-sm text-label-sm font-bold text-primary">65%</span>
</div>
<div class="w-full h-2 rounded-full progress-bar-track overflow-hidden">
<div class="h-full bg-primary rounded-full transition-all duration-1000 ease-out" style="width: 65%;"></div>
</div>
</div>
<button class="w-full py-sm bg-primary text-on-primary rounded-lg font-label-md text-label-md flex justify-center items-center gap-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:bg-primary-container hover:text-on-primary-container transition-colors active:scale-[0.98]">
                            Lanjut Belajar
                            <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
</button>
</div>
</article>
<!-- Course Card 2 -->
<article class="bg-surface rounded-xl border border-outline-variant/30 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col group hover:-translate-y-1 transition-transform duration-300">
<div class="h-32 relative w-full overflow-hidden">
<div class="bg-cover bg-center w-full h-full transform group-hover:scale-105 transition-transform duration-500" data-alt="A minimalist and modern language lab setting, showcasing a clean desk with headphones and a digital tablet displaying interactive language learning graphics, cool tones, bright and inviting atmosphere." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuD4ByHY7baq_9POdh5FRQCfN8Um9QTO-QpUPGiYV_b-7-I5PctEwFrWSt9Y0h8YzlGAXrMiRikUhbgRrTv8JpZTC6N6_Q528_bEkC7cjAwJXkFaiLkGGspI3i6G7UM2WGtvsqG3jhwXaBWVV-c3Rs2v1vi679FwU1_DLELnVzHHAdHJ85wYrk_0D2wAuXBceJtC7NahQCQ8nWZOS06_YhcskPibBQwkgWejx94193TOMfQwM0ml-epujA')"></div>
<div class="absolute top-sm right-sm bg-surface/90 backdrop-blur-sm px-sm py-xs rounded-full flex items-center gap-xs shadow-sm">
<div class="w-2 h-2 rounded-full bg-tertiary"></div>
<span class="font-label-sm text-label-sm text-on-surface">Bahasa</span>
</div>
</div>
<div class="p-md flex flex-col flex-1">
<h3 class="font-title-lg text-title-lg text-on-surface mb-xs line-clamp-2 leading-tight group-hover:text-primary transition-colors">Bahasa Inggris: Persiapan TOEFL ITP</h3>
<div class="flex items-center gap-xs mb-md mt-auto pt-sm">
<span class="material-symbols-outlined text-[16px] text-on-surface-variant">person</span>
<span class="font-body-sm text-body-sm text-on-surface-variant">Sarah Johnson, M.A.</span>
</div>
<div class="space-y-xs mb-md">
<div class="flex justify-between items-center">
<span class="font-label-sm text-label-sm text-on-surface-variant">Progress Belajar</span>
<span class="font-label-sm text-label-sm font-bold text-primary">30%</span>
</div>
<div class="w-full h-2 rounded-full progress-bar-track overflow-hidden">
<div class="h-full bg-primary rounded-full transition-all duration-1000 ease-out" style="width: 30%;"></div>
</div>
</div>
<button class="w-full py-sm bg-primary text-on-primary rounded-lg font-label-md text-label-md flex justify-center items-center gap-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:bg-primary-container hover:text-on-primary-container transition-colors active:scale-[0.98]">
                            Lanjut Belajar
                            <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
</button>
</div>
</article>
<!-- Course Card 3 -->
<article class="bg-surface rounded-xl border border-outline-variant/30 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col group hover:-translate-y-1 transition-transform duration-300">
<div class="h-32 relative w-full overflow-hidden">
<div class="bg-cover bg-center w-full h-full transform group-hover:scale-105 transition-transform duration-500" data-alt="A sleek abstract representation of computer programming code floating in a bright, ethereal digital space, featuring a color palette of deep indigo and pure white, reflecting modern technology education." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuCB4M27lTCm5Fw9tyeyH-tG416acArDRutoducyrryBkNJPq4bYrZS7fvyQ8ZaNeb9GhzmRn0LuLBRDZvl2xdSN8ky3V7NuElHvihAv7YC-XWmPMUhBaAyqEJTKktPZC-CyjVs5XIIT905mabAAkWZU8M9BWTfyxlFUtBvv9-3In3Rz0rBDYfz_Z7RXx9Aebj9wAlZ1NfDtoGfvlKOPrVEvdbKg1ZepkzZPtxrdoz1KUYmmfSMJtxD_1w')"></div>
<div class="absolute top-sm right-sm bg-surface/90 backdrop-blur-sm px-sm py-xs rounded-full flex items-center gap-xs shadow-sm">
<div class="w-2 h-2 rounded-full bg-primary"></div>
<span class="font-label-sm text-label-sm text-on-surface">Teknologi</span>
</div>
</div>
<div class="p-md flex flex-col flex-1">
<h3 class="font-title-lg text-title-lg text-on-surface mb-xs line-clamp-2 leading-tight group-hover:text-primary transition-colors">Dasar Pemrograman Python untuk Data Science</h3>
<div class="flex items-center gap-xs mb-md mt-auto pt-sm">
<span class="material-symbols-outlined text-[16px] text-on-surface-variant">person</span>
<span class="font-body-sm text-body-sm text-on-surface-variant">Budi Pratama, S.Kom</span>
</div>
<div class="space-y-xs mb-md">
<div class="flex justify-between items-center">
<span class="font-label-sm text-label-sm text-on-surface-variant">Progress Belajar</span>
<span class="font-label-sm text-label-sm font-bold text-primary">85%</span>
</div>
<div class="w-full h-2 rounded-full progress-bar-track overflow-hidden">
<div class="h-full bg-primary rounded-full transition-all duration-1000 ease-out" style="width: 85%;"></div>
</div>
</div>
<button class="w-full py-sm bg-primary text-on-primary rounded-lg font-label-md text-label-md flex justify-center items-center gap-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:bg-primary-container hover:text-on-primary-container transition-colors active:scale-[0.98]">
                            Lanjut Belajar
                            <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
</button>
</div>
</article>
<!-- New Course Action Card -->
<article class="bg-surface-container-low rounded-xl border-2 border-dashed border-outline-variant/50 hover:border-primary/50 transition-colors flex flex-col items-center justify-center p-lg min-h-[300px] cursor-pointer group">
<div class="w-16 h-16 rounded-full bg-surface shadow-sm flex items-center justify-center mb-md group-hover:scale-110 transition-transform duration-300">
<span class="material-symbols-outlined text-primary text-[32px]">add</span>
</div>
<h3 class="font-title-md text-title-md text-on-surface text-center mb-xs">Eksplorasi Kursus Baru</h3>
<p class="font-body-sm text-body-sm text-on-surface-variant text-center">Temukan materi pembelajaran lainnya untuk meningkatkan skill Anda.</p>
</article>
</div>
<!-- Quick Stats Section (Glassmorphism concept) -->
<div class="mt-xl grid grid-cols-1 md:grid-cols-3 gap-md">
<div class="glass-panel rounded-xl p-md flex items-center gap-md">
<div class="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center">
<span class="material-symbols-outlined text-primary">school</span>
</div>
<div>
<p class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Total Kursus Aktif</p>
<p class="font-headline-md text-headline-md font-bold text-on-surface">3</p>
</div>
</div>
<div class="glass-panel rounded-xl p-md flex items-center gap-md">
<div class="w-12 h-12 rounded-full murid-bg-accent flex items-center justify-center">
<span class="material-symbols-outlined murid-accent">task_alt</span>
</div>
<div>
<p class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Tugas Selesai</p>
<p class="font-headline-md text-headline-md font-bold text-on-surface">12</p>
</div>
</div>
<div class="glass-panel rounded-xl p-md flex items-center gap-md">
<div class="w-12 h-12 rounded-full bg-tertiary-container/20 flex items-center justify-center">
<span class="material-symbols-outlined text-tertiary">schedule</span>
</div>
<div>
<p class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Jam Belajar Minggu Ini</p>
<p class="font-headline-md text-headline-md font-bold text-on-surface">14.5</p>
</div>
</div>
</div>
</div>
</main>
</body></html>

<!-- Ujian - Guru -->
<!DOCTYPE html>

<html lang="id"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>KSI-ON LMS - Manajemen Ujian</title>
<!-- Material Symbols Outlined -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@600;700;800&amp;family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<!-- Tailwind CSS with Custom Config -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "primary": "#3525cd",
                        "secondary-fixed-dim": "#89ceff",
                        "outline-variant": "#c7c4d8",
                        "on-surface": "#0b1c30",
                        "inverse-on-surface": "#eaf1ff",
                        "surface-bright": "#f8f9ff",
                        "on-tertiary-container": "#ffd0d2",
                        "outline": "#777587",
                        "tertiary": "#95002b",
                        "secondary-fixed": "#c9e6ff",
                        "on-background": "#0b1c30",
                        "inverse-surface": "#213145",
                        "error-container": "#ffdad6",
                        "on-secondary-container": "#004666",
                        "tertiary-fixed-dim": "#ffb2b7",
                        "on-tertiary-fixed-variant": "#92002a",
                        "on-error-container": "#93000a",
                        "inverse-primary": "#c3c0ff",
                        "on-primary-fixed": "#0f0069",
                        "error": "#ba1a1a",
                        "surface-variant": "#d3e4fe",
                        "secondary-container": "#39b8fd",
                        "surface-container": "#e5eeff",
                        "surface": "#f8f9ff",
                        "on-secondary-fixed-variant": "#004c6e",
                        "on-primary-container": "#dad7ff",
                        "on-primary-fixed-variant": "#3323cc",
                        "on-error": "#ffffff",
                        "on-surface-variant": "#464555",
                        "background": "#f8f9ff",
                        "tertiary-container": "#bf0f3c",
                        "on-tertiary": "#ffffff",
                        "surface-tint": "#4d44e3",
                        "primary-fixed": "#e2dfff",
                        "on-secondary-fixed": "#001e2f",
                        "tertiary-fixed": "#ffdadb",
                        "surface-container-high": "#dce9ff",
                        "surface-container-low": "#eff4ff",
                        "surface-container-highest": "#d3e4fe",
                        "on-tertiary-fixed": "#40000d",
                        "secondary": "#006591",
                        "primary-container": "#4f46e5",
                        "primary-fixed-dim": "#c3c0ff",
                        "on-secondary": "#ffffff",
                        "surface-dim": "#cbdbf5",
                        "on-primary": "#ffffff",
                        "surface-container-lowest": "#ffffff"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "base": "4px",
                        "sidebar-width": "280px",
                        "md": "16px",
                        "gutter": "24px",
                        "lg": "24px",
                        "margin-mobile": "16px",
                        "2xl": "48px",
                        "margin-desktop": "32px",
                        "xs": "8px",
                        "xl": "32px",
                        "sm": "12px"
                    },
                    "fontFamily": {
                        "label-md": ["Inter"],
                        "label-sm": ["Inter"],
                        "body-sm": ["Inter"],
                        "headline-md": ["Hanken Grotesk"],
                        "headline-lg": ["Hanken Grotesk"],
                        "display-lg": ["Hanken Grotesk"],
                        "body-lg": ["Inter"],
                        "body-md": ["Inter"],
                        "title-md": ["Inter"],
                        "title-lg": ["Inter"]
                    },
                    "fontSize": {
                        "label-md": ["14px", { "lineHeight": "20px", "letterSpacing": "0.01em", "fontWeight": "500" }],
                        "label-sm": ["12px", { "lineHeight": "16px", "fontWeight": "600" }],
                        "body-sm": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
                        "headline-md": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
                        "headline-lg": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "600" }],
                        "display-lg": ["48px", { "lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
                        "body-lg": ["18px", { "lineHeight": "28px", "fontWeight": "400" }],
                        "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
                        "title-md": ["16px", { "lineHeight": "24px", "fontWeight": "600" }],
                        "title-lg": ["20px", { "lineHeight": "28px", "fontWeight": "600" }]
                    }
                },
            },
        }
    </script>
<style>
        /* Custom scrollbar for webkit */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        ::-webkit-scrollbar-track {
            background: transparent;
        }
        ::-webkit-scrollbar-thumb {
            background-color: #c7c4d8;
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background-color: #777587;
        }
    </style>
</head>
<body class="bg-background text-on-background font-body-md h-screen overflow-hidden flex flex-col md:flex-row light">
<!-- Mobile Nav Overlay (Hidden on Desktop) -->
<div class="fixed inset-0 bg-on-background/50 z-40 hidden md:hidden transition-opacity" id="mobile-nav-overlay"></div>
<!-- SideNavBar (Desktop & Mobile Drawer) -->
<aside class="w-sidebar-width h-screen fixed md:relative left-0 top-0 bg-surface dark:bg-on-background flex flex-col border-r border-outline-variant shadow-lg shadow-[0px_4px_20px_rgba(0,0,0,0.05)] z-50 transform -translate-x-full md:translate-x-0 transition-transform duration-300 ease-in-out" id="sidebar">
<!-- Sidebar Header -->
<div class="px-gutter py-lg flex items-center gap-md border-b border-outline-variant/50">
<div class="w-10 h-10 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">school</span>
</div>
<div>
<h1 class="font-headline-md text-headline-md font-extrabold text-primary">KSI-ON LMS</h1>
<p class="font-label-sm text-label-sm text-on-surface-variant">Academic Excellence</p>
</div>
<!-- Mobile Close Button -->
<button class="md:hidden ml-auto text-on-surface-variant hover:text-primary p-xs rounded-full hover:bg-surface-container-low transition-colors" id="close-sidebar">
<span class="material-symbols-outlined">close</span>
</button>
</div>
<!-- Sidebar Navigation Links -->
<nav class="flex-1 overflow-y-auto py-md">
<ul class="flex flex-col gap-xs font-label-md text-label-md pr-md">
<!-- Dashboard -->
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary rounded-r-full transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">dashboard</span>
                        Dashboard
                    </a>
</li>
<!-- Users -->
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary rounded-r-full transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">group</span>
                        Users
                    </a>
</li>
<!-- Courses -->
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary rounded-r-full transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">school</span>
                        Courses
                    </a>
</li>
<!-- Exams (ACTIVE) -->
<li>
<a class="bg-primary/10 text-primary border-l-4 border-primary rounded-r-full py-md px-lg flex items-center gap-md transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">quiz</span>
                        Exams
                    </a>
</li>
<!-- Announcements -->
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary rounded-r-full transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">campaign</span>
                        Announcements
                    </a>
</li>
<!-- Activities -->
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary rounded-r-full transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">pending_actions</span>
                        Activities
                    </a>
</li>
<!-- Settings -->
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary rounded-r-full transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">settings</span>
                        Settings
                    </a>
</li>
<!-- Class Data -->
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary rounded-r-full transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">class</span>
                        Class Data
                    </a>
</li>
<!-- Teacher Data -->
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary rounded-r-full transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">person_4</span>
                        Teacher Data
                    </a>
</li>
<!-- Student Data -->
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary rounded-r-full transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">person</span>
                        Student Data
                    </a>
</li>
<!-- Attendance -->
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary rounded-r-full transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">fact_check</span>
                        Attendance
                    </a>
</li>
<!-- Evaluations -->
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary rounded-r-full transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">analytics</span>
                        Evaluations
                    </a>
</li>
<!-- Reports -->
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary rounded-r-full transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">assessment</span>
                        Reports
                    </a>
</li>
<!-- Profile -->
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary rounded-r-full transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">account_circle</span>
                        Profile
                    </a>
</li>
</ul>
</nav>
<!-- Sidebar Footer -->
<div class="p-lg border-t border-outline-variant/50">
<button class="w-full flex items-center justify-center gap-xs py-sm px-md rounded-lg bg-surface-container-low text-primary font-label-md text-label-md hover:bg-primary hover:text-on-primary transition-colors duration-200 mb-md">
<span class="material-symbols-outlined text-[20px]">support_agent</span>
                Help Desk
            </button>
<a class="flex items-center gap-md text-on-surface-variant hover:text-error transition-colors px-sm font-label-md text-label-md" href="#">
<span class="material-symbols-outlined">logout</span>
                Logout
            </a>
</div>
</aside>
<!-- Main Content Canvas -->
<main class="flex-1 flex flex-col h-full min-w-0 bg-background relative">
<!-- TopNavBar -->
<header class="flex justify-between items-center px-lg py-xs w-full z-40 bg-surface/70 dark:bg-on-background/70 backdrop-blur-md sticky top-0 border-b border-outline-variant dark:border-outline shadow-sm">
<!-- Left: Mobile Menu Toggle & Search -->
<div class="flex items-center gap-md flex-1">
<button class="md:hidden text-on-surface p-xs rounded-full hover:bg-surface-container-high transition-colors" id="open-sidebar">
<span class="material-symbols-outlined">menu</span>
</button>
<div class="hidden md:flex relative max-w-md w-full items-center">
<span class="material-symbols-outlined absolute left-sm text-outline">search</span>
<input class="w-full bg-surface-bright border border-outline-variant rounded-full py-sm pl-[40px] pr-md font-body-sm text-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="Cari ujian, siswa, atau kelas..." type="text"/>
</div>
</div>
<!-- Right: Actions & Profile -->
<div class="flex items-center gap-xs md:gap-md">
<button class="text-on-surface-variant hover:bg-surface-container-high p-xs rounded-full transition-colors cursor-pointer active:scale-95 flex items-center justify-center relative">
<span class="material-symbols-outlined">notifications</span>
<span class="absolute top-[4px] right-[4px] w-2 h-2 bg-error rounded-full border border-surface"></span>
</button>
<button class="text-on-surface-variant hover:bg-surface-container-high p-xs rounded-full transition-colors cursor-pointer active:scale-95 flex items-center justify-center hidden sm:flex">
<span class="material-symbols-outlined">help</span>
</button>
<div class="h-6 w-[1px] bg-outline-variant mx-xs hidden sm:block"></div>
<div class="flex items-center gap-sm cursor-pointer hover:bg-surface-container-high p-xs pr-sm rounded-full transition-colors active:scale-95">
<img alt="User profile" class="w-8 h-8 rounded-full object-cover border border-outline-variant" data-alt="A professional headshot of a teacher, well-lit studio photography, soft neutral background, wearing business casual attire, warm approachable expression, high resolution." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDr8O3TJjnMIk2OHfd8Ba6o0wl3V9xHdv6btb5kUM-u2jVw1tVvGyyadSjh0azU_NacShy2LN_oYpZb7Hk59Nsy-VU6F2_OGT-5SA3zAdGDJjatnHkES4On5fztFZA2oKnNLKQrBygPXBl9JEVQf5daQD6eHd0JqBVnh91pnZeD9KFoPZc9EDuhgrs7jttxCPsHcfTcQRJDS0c4957PwA57TJd_lGSYRKcki_R1uT8wy-wGLcoUqtsukw"/>
<div class="hidden lg:block text-left">
<p class="font-label-sm text-label-sm text-on-surface leading-tight">Budi Santoso</p>
<p class="text-[10px] text-on-surface-variant leading-tight">Guru Matematika</p>
</div>
</div>
</div>
</header>
<!-- Scrollable Content Area -->
<div class="flex-1 overflow-y-auto p-gutter lg:p-margin-desktop">
<!-- Page Header -->
<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-md mb-xl">
<div>
<h2 class="font-headline-lg text-headline-lg text-on-surface">Manajemen Ujian</h2>
<p class="font-body-md text-body-md text-on-surface-variant mt-xs">Kelola jadwal ujian, bank soal, dan hasil penilaian siswa Anda.</p>
</div>
<div class="flex flex-wrap items-center gap-sm">
<button class="flex items-center gap-xs px-lg py-sm rounded-xl bg-surface border border-outline-variant text-on-surface font-label-md text-label-md hover:bg-surface-container-low hover:border-primary/50 transition-all shadow-sm">
<span class="material-symbols-outlined text-[20px]">folder_managed</span>
                        Kelola Bank Soal
                    </button>
<button class="flex items-center gap-xs px-lg py-sm rounded-xl bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-fixed-variant hover:shadow-md transition-all shadow-sm shadow-primary/20">
<span class="material-symbols-outlined text-[20px]">add</span>
                        Buat Ujian Baru
                    </button>
</div>
</div>
<!-- Bento Grid Layout -->
<div class="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
<!-- Main Column: Jadwal Ujian (Span 8) -->
<div class="lg:col-span-8 flex flex-col gap-gutter">
<!-- Stats Overview (Mini Cards) -->
<div class="grid grid-cols-1 sm:grid-cols-3 gap-md">
<div class="bg-surface rounded-xl p-md border border-outline-variant/40 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] flex items-center gap-md">
<div class="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
<span class="material-symbols-outlined">event_available</span>
</div>
<div>
<p class="font-label-sm text-label-sm text-on-surface-variant">Ujian Aktif</p>
<p class="font-headline-md text-headline-md text-on-surface mt-[-2px]">3</p>
</div>
</div>
<div class="bg-surface rounded-xl p-md border border-outline-variant/40 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] flex items-center gap-md">
<div class="w-12 h-12 rounded-full bg-secondary-fixed/50 text-on-secondary-container flex items-center justify-center shrink-0">
<span class="material-symbols-outlined">schedule</span>
</div>
<div>
<p class="font-label-sm text-label-sm text-on-surface-variant">Terjadwal</p>
<p class="font-headline-md text-headline-md text-on-surface mt-[-2px]">5</p>
</div>
</div>
<div class="bg-surface rounded-xl p-md border border-outline-variant/40 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] flex items-center gap-md">
<div class="w-12 h-12 rounded-full bg-tertiary-fixed/50 text-on-tertiary-fixed-variant flex items-center justify-center shrink-0">
<span class="material-symbols-outlined">grading</span>
</div>
<div>
<p class="font-label-sm text-label-sm text-on-surface-variant">Perlu Dinilai</p>
<p class="font-headline-md text-headline-md text-on-surface mt-[-2px]">42</p>
</div>
</div>
</div>
<!-- Jadwal Ujian Mendatang Card -->
<div class="bg-surface rounded-xl border border-outline-variant/40 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] flex flex-col overflow-hidden">
<div class="px-lg py-md border-b border-outline-variant/40 flex justify-between items-center bg-surface-bright">
<h3 class="font-title-md text-title-md text-on-surface flex items-center gap-xs">
<span class="material-symbols-outlined text-primary">calendar_month</span>
                                Jadwal Ujian Mendatang
                            </h3>
<button class="text-primary font-label-sm text-label-sm hover:underline">Lihat Semua</button>
</div>
<div class="p-0 overflow-x-auto">
<table class="w-full text-left border-collapse">
<thead>
<tr class="bg-surface-container-lowest font-label-sm text-label-sm text-on-surface-variant border-b border-outline-variant/40">
<th class="px-lg py-sm font-medium">Nama Ujian</th>
<th class="px-lg py-sm font-medium">Kelas</th>
<th class="px-lg py-sm font-medium">Waktu</th>
<th class="px-lg py-sm font-medium">Status</th>
<th class="px-lg py-sm font-medium text-right">Aksi</th>
</tr>
</thead>
<tbody class="font-body-sm text-body-sm text-on-surface divide-y divide-outline-variant/20">
<tr class="hover:bg-surface-container-low transition-colors group">
<td class="px-lg py-md">
<p class="font-title-md text-[14px] font-semibold">Ujian Tengah Semester - Aljabar</p>
<p class="text-on-surface-variant text-[12px]">Matematika XA</p>
</td>
<td class="px-lg py-md">X-MIPA-1, X-MIPA-2</td>
<td class="px-lg py-md">
<div class="flex items-center gap-xs text-on-surface-variant">
<span class="material-symbols-outlined text-[16px]">schedule</span>
                                                Besok, 08:00 - 10:00
                                            </div>
</td>
<td class="px-lg py-md">
<span class="inline-flex items-center px-2 py-1 rounded-full bg-secondary-fixed/40 text-on-secondary-container text-[11px] font-semibold border border-secondary-fixed">
                                                Terjadwal
                                            </span>
</td>
<td class="px-lg py-md text-right">
<button class="text-on-surface-variant hover:text-primary p-xs rounded-full hover:bg-surface-container-high transition-colors">
<span class="material-symbols-outlined text-[20px]">more_vert</span>
</button>
</td>
</tr>
<tr class="hover:bg-surface-container-low transition-colors group">
<td class="px-lg py-md">
<p class="font-title-md text-[14px] font-semibold">Kuis Mingguan: Trigonometri Dasar</p>
<p class="text-on-surface-variant text-[12px]">Matematika XIA</p>
</td>
<td class="px-lg py-md">XI-IPS-1</td>
<td class="px-lg py-md">
<div class="flex items-center gap-xs text-on-surface-variant">
<span class="material-symbols-outlined text-[16px]">schedule</span>
                                                Kamis, 13:00 - 14:30
                                            </div>
</td>
<td class="px-lg py-md">
<span class="inline-flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold border border-primary/20">
                                                Draf Siap
                                            </span>
</td>
<td class="px-lg py-md text-right">
<button class="text-on-surface-variant hover:text-primary p-xs rounded-full hover:bg-surface-container-high transition-colors">
<span class="material-symbols-outlined text-[20px]">more_vert</span>
</button>
</td>
</tr>
</tbody>
</table>
</div>
<div class="p-md bg-surface-container-lowest border-t border-outline-variant/40 flex justify-center">
<button class="flex items-center gap-xs text-primary font-label-md text-label-md hover:bg-primary/5 px-md py-xs rounded-lg transition-colors">
<span class="material-symbols-outlined text-[20px]">calendar_add_on</span>
                                Buka Kalender Ujian
                            </button>
</div>
</div>
</div>
<!-- Side Column: Tasks & Banks (Span 4) -->
<div class="lg:col-span-4 flex flex-col gap-gutter">
<!-- Hasil Perlu Dinilai Card -->
<div class="bg-surface rounded-xl border border-tertiary/20 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] relative overflow-hidden flex flex-col h-fit">
<!-- Accent Bar -->
<div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-tertiary to-error"></div>
<div class="px-lg py-md border-b border-outline-variant/40 flex justify-between items-center">
<h3 class="font-title-md text-title-md text-on-surface flex items-center gap-xs">
<span class="material-symbols-outlined text-tertiary">priority_high</span>
                                Perlu Dinilai
                            </h3>
<span class="bg-error-container text-on-error-container px-2 py-0.5 rounded-full text-[12px] font-bold">42 Berkas</span>
</div>
<div class="flex flex-col p-md gap-sm">
<!-- Item 1 -->
<div class="flex items-start gap-md p-sm rounded-lg hover:bg-surface-container-lowest transition-colors cursor-pointer border border-transparent hover:border-outline-variant/30">
<div class="w-10 h-10 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center mt-1 shrink-0">
<span class="material-symbols-outlined">assignment</span>
</div>
<div class="flex-1">
<h4 class="font-title-md text-[14px] leading-tight text-on-surface">Esai: Sejarah Kalkulus</h4>
<p class="font-body-sm text-[12px] text-on-surface-variant mt-0.5">XI-MIPA-1 • Tenggat: Kemarin</p>
<div class="mt-2 w-full bg-surface-variant rounded-full h-1.5">
<div class="bg-tertiary h-1.5 rounded-full" style="width: 25%"></div>
</div>
<p class="text-[10px] text-tertiary mt-1 font-semibold text-right">10/40 Dinilai</p>
</div>
</div>
<!-- Item 2 -->
<div class="flex items-start gap-md p-sm rounded-lg hover:bg-surface-container-lowest transition-colors cursor-pointer border border-transparent hover:border-outline-variant/30">
<div class="w-10 h-10 rounded-lg bg-surface-variant text-on-surface flex items-center justify-center mt-1 shrink-0">
<span class="material-symbols-outlined">checklist</span>
</div>
<div class="flex-1">
<h4 class="font-title-md text-[14px] leading-tight text-on-surface">Ujian Harian Bab 2</h4>
<p class="font-body-sm text-[12px] text-on-surface-variant mt-0.5">X-IPS-2 • Selesai 2 jam lalu</p>
<p class="text-[12px] text-on-surface font-medium mt-1">2 Butir Soal Uraian</p>
</div>
</div>
</div>
<div class="p-md mt-auto">
<button class="w-full py-sm bg-tertiary text-on-tertiary rounded-lg font-label-md text-label-md hover:bg-tertiary-container hover:text-on-tertiary-container transition-colors shadow-sm">
                                Mulai Penilaian
                            </button>
</div>
</div>
<!-- Ringkasan Bank Soal Card -->
<div class="bg-surface rounded-xl border border-outline-variant/40 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] p-lg flex flex-col relative overflow-hidden">
<!-- Subtle Background Graphic -->
<span class="material-symbols-outlined absolute -bottom-4 -right-4 text-[120px] text-outline-variant/10 rotate-12 pointer-events-none select-none">source</span>
<h3 class="font-title-md text-title-md text-on-surface flex items-center gap-xs mb-md relative z-10">
<span class="material-symbols-outlined text-primary">database</span>
                            Bank Soal Anda
                        </h3>
<div class="flex items-end gap-sm mb-md relative z-10">
<span class="font-display-lg text-[40px] leading-none font-bold text-on-surface">482</span>
<span class="font-body-sm text-on-surface-variant mb-1">total butir soal</span>
</div>
<div class="space-y-sm relative z-10">
<div class="flex justify-between items-center text-[13px]">
<span class="text-on-surface-variant flex items-center gap-xs"><span class="w-2 h-2 rounded-full bg-primary"></span> Pilihan Ganda</span>
<span class="font-semibold text-on-surface">320</span>
</div>
<div class="flex justify-between items-center text-[13px]">
<span class="text-on-surface-variant flex items-center gap-xs"><span class="w-2 h-2 rounded-full bg-secondary-container"></span> Uraian / Esai</span>
<span class="font-semibold text-on-surface">115</span>
</div>
<div class="flex justify-between items-center text-[13px]">
<span class="text-on-surface-variant flex items-center gap-xs"><span class="w-2 h-2 rounded-full bg-outline"></span> Menjodohkan</span>
<span class="font-semibold text-on-surface">47</span>
</div>
</div>
<div class="mt-lg pt-md border-t border-outline-variant/40 relative z-10">
<button class="flex items-center justify-between w-full group">
<span class="font-label-md text-label-md text-primary group-hover:underline">Tambah Soal Baru</span>
<span class="material-symbols-outlined text-primary text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
</button>
</div>
</div>
</div>
</div>
</div>
</main>
<script>
        // Simple Mobile Sidebar Toggle Logic
        const openBtn = document.getElementById('open-sidebar');
        const closeBtn = document.getElementById('close-sidebar');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobile-nav-overlay');

        function toggleSidebar() {
            const isClosed = sidebar.classList.contains('-translate-x-full');
            if (isClosed) {
                sidebar.classList.remove('-translate-x-full');
                overlay.classList.remove('hidden');
                // Small delay to allow display:block to apply before opacity transition
                setTimeout(() => {
                    overlay.classList.add('opacity-100');
                    overlay.classList.remove('opacity-0');
                }, 10);
            } else {
                sidebar.classList.add('-translate-x-full');
                overlay.classList.add('opacity-0');
                overlay.classList.remove('opacity-100');
                setTimeout(() => {
                    overlay.classList.add('hidden');
                }, 300); // match transition duration
            }
        }

        openBtn.addEventListener('click', toggleSidebar);
        closeBtn.addEventListener('click', toggleSidebar);
        overlay.addEventListener('click', toggleSidebar);
    </script>
</body></html>

<!-- Jelajahi Kursus - Murid -->
<!DOCTYPE html>

<html lang="id"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Jelajahi Kursus - KSI-ON LMS</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;family=Hanken+Grotesk:wght@600;700;800&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "secondary-fixed": "#c9e6ff",
                        "secondary-container": "#39b8fd",
                        "primary": "#3525cd",
                        "surface-container-low": "#eff4ff",
                        "on-error-container": "#93000a",
                        "on-tertiary-fixed": "#40000d",
                        "outline": "#777587",
                        "on-tertiary": "#ffffff",
                        "on-background": "#0b1c30",
                        "error-container": "#ffdad6",
                        "tertiary-fixed-dim": "#ffb2b7",
                        "surface-variant": "#d3e4fe",
                        "outline-variant": "#c7c4d8",
                        "tertiary-fixed": "#ffdadb",
                        "on-tertiary-container": "#ffd0d2",
                        "on-primary-container": "#dad7ff",
                        "on-surface-variant": "#464555",
                        "on-secondary-fixed-variant": "#004c6e",
                        "on-primary-fixed-variant": "#3323cc",
                        "secondary": "#006591",
                        "on-secondary-container": "#004666",
                        "error": "#ba1a1a",
                        "surface-container-highest": "#d3e4fe",
                        "primary-fixed": "#e2dfff",
                        "on-secondary": "#ffffff",
                        "on-primary-fixed": "#0f0069",
                        "secondary-fixed-dim": "#89ceff",
                        "on-secondary-fixed": "#001e2f",
                        "surface-tint": "#4d44e3",
                        "primary-fixed-dim": "#c3c0ff",
                        "surface-container-high": "#dce9ff",
                        "on-surface": "#0b1c30",
                        "tertiary": "#95002b",
                        "inverse-primary": "#c3c0ff",
                        "surface-container": "#e5eeff",
                        "inverse-on-surface": "#eaf1ff",
                        "surface-bright": "#f8f9ff",
                        "surface": "#f8f9ff",
                        "surface-container-lowest": "#ffffff",
                        "on-error": "#ffffff",
                        "tertiary-container": "#bf0f3c",
                        "primary-container": "#4f46e5",
                        "background": "#f8f9ff",
                        "surface-dim": "#cbdbf5",
                        "on-tertiary-fixed-variant": "#92002a",
                        "inverse-surface": "#213145",
                        "on-primary": "#ffffff"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "margin-desktop": "32px",
                        "margin-mobile": "16px",
                        "sm": "12px",
                        "lg": "24px",
                        "gutter": "24px",
                        "base": "4px",
                        "sidebar-width": "280px",
                        "xl": "32px",
                        "xs": "8px",
                        "md": "16px",
                        "2xl": "48px"
                    },
                    "fontFamily": {
                        "label-md": ["Inter"],
                        "headline-md": ["Hanken Grotesk"],
                        "body-lg": ["Inter"],
                        "headline-lg": ["Hanken Grotesk"],
                        "body-sm": ["Inter"],
                        "label-sm": ["Inter"],
                        "body-md": ["Inter"],
                        "title-md": ["Inter"],
                        "title-lg": ["Inter"],
                        "display-lg": ["Hanken Grotesk"]
                    },
                    "fontSize": {
                        "label-md": ["14px", { "lineHeight": "20px", "letterSpacing": "0.01em", "fontWeight": "500" }],
                        "headline-md": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
                        "body-lg": ["18px", { "lineHeight": "28px", "fontWeight": "400" }],
                        "headline-lg": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "600" }],
                        "body-sm": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
                        "label-sm": ["12px", { "lineHeight": "16px", "fontWeight": "600" }],
                        "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
                        "title-md": ["16px", { "lineHeight": "24px", "fontWeight": "600" }],
                        "title-lg": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
                        "display-lg": ["48px", { "lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700" }]
                    }
                },
            },
        }
    </script>
<style>
        .glass-panel {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.5);
        }
        
        .tier-0 { background-color: #F8FAFC; }
        .tier-1 { box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.05); background-color: white; }
        .tier-2 { box-shadow: 0px 10px 30px rgba(0, 0, 0, 0.1); background-color: white; }
        
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
    </style>
</head>
<body class="bg-background text-on-surface font-body-md min-h-screen flex selection:bg-primary-container selection:text-on-primary-container">
<!-- SideNavBar -->
<nav class="hidden md:flex flex-col h-screen fixed left-0 top-0 w-sidebar-width bg-surface shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border-r border-outline-variant z-30 transition-all duration-200 ease-in-out">
<!-- Header -->
<div class="px-lg py-xl border-b border-outline-variant/30 flex items-center gap-md">
<div class="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container">
<span class="material-symbols-outlined" data-weight="fill" style="font-variation-settings: 'FILL' 1;">school</span>
</div>
<div>
<h1 class="font-headline-md text-headline-md font-extrabold text-primary tracking-tight">KSI-ON LMS</h1>
<p class="font-label-sm text-label-sm text-on-surface-variant">Academic Excellence</p>
</div>
</div>
<!-- Navigation Links -->
<div class="flex-1 overflow-y-auto py-md hide-scroll">
<ul class="space-y-1">
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md group" href="#">
<span class="material-symbols-outlined text-outline group-hover:text-primary transition-colors">dashboard</span>
                        Dashboard
                    </a>
</li>
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md group" href="#">
<span class="material-symbols-outlined text-outline group-hover:text-primary transition-colors">group</span>
                        Users
                    </a>
</li>
<!-- Active State Example (Courses is closest to 'Jelajahi Kursus') -->
<li>
<a class="bg-primary/10 text-primary border-l-4 border-primary rounded-r-full py-md px-lg transition-all font-label-md text-label-md flex items-center gap-md relative" href="#">
<div class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full"></div>
<span class="material-symbols-outlined" data-weight="fill" style="font-variation-settings: 'FILL' 1;">school</span>
                        Courses
                    </a>
</li>
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md group" href="#">
<span class="material-symbols-outlined text-outline group-hover:text-primary transition-colors">quiz</span>
                        Exams
                    </a>
</li>
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md group" href="#">
<span class="material-symbols-outlined text-outline group-hover:text-primary transition-colors">campaign</span>
                        Announcements
                    </a>
</li>
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md group" href="#">
<span class="material-symbols-outlined text-outline group-hover:text-primary transition-colors">pending_actions</span>
                        Activities
                    </a>
</li>
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md group" href="#">
<span class="material-symbols-outlined text-outline group-hover:text-primary transition-colors">settings</span>
                        Settings
                    </a>
</li>
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md group" href="#">
<span class="material-symbols-outlined text-outline group-hover:text-primary transition-colors">class</span>
                        Class Data
                    </a>
</li>
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md group" href="#">
<span class="material-symbols-outlined text-outline group-hover:text-primary transition-colors">person_4</span>
                        Teacher Data
                    </a>
</li>
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md group" href="#">
<span class="material-symbols-outlined text-outline group-hover:text-primary transition-colors">person</span>
                        Student Data
                    </a>
</li>
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md group" href="#">
<span class="material-symbols-outlined text-outline group-hover:text-primary transition-colors">fact_check</span>
                        Attendance
                    </a>
</li>
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md group" href="#">
<span class="material-symbols-outlined text-outline group-hover:text-primary transition-colors">analytics</span>
                        Evaluations
                    </a>
</li>
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md group" href="#">
<span class="material-symbols-outlined text-outline group-hover:text-primary transition-colors">assessment</span>
                        Reports
                    </a>
</li>
<li>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out font-label-md text-label-md group" href="#">
<span class="material-symbols-outlined text-outline group-hover:text-primary transition-colors">account_circle</span>
                        Profile
                    </a>
</li>
</ul>
</div>
<!-- Support & Logout -->
<div class="p-lg border-t border-outline-variant/30 space-y-md">
<button class="w-full bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-label-md py-sm rounded-lg transition-colors flex items-center justify-center gap-sm">
<span class="material-symbols-outlined text-[18px]">help</span> Help Desk
            </button>
<a class="text-on-surface-variant hover:text-error flex items-center gap-md font-label-md text-label-md px-md transition-colors group" href="#">
<span class="material-symbols-outlined text-outline group-hover:text-error transition-colors">logout</span>
                 Logout
            </a>
</div>
</nav>
<!-- Main Content Area -->
<main class="flex-1 md:ml-sidebar-width min-h-screen flex flex-col relative w-full overflow-x-hidden">
<!-- TopNavBar (Mobile mainly, but acts as header here) -->
<header class="bg-surface/70 backdrop-blur-md flex justify-between items-center px-lg py-sm w-full z-20 sticky top-0 border-b border-outline-variant/20 shadow-sm transition-all h-[72px]">
<!-- Mobile Menu Toggle -->
<button class="md:hidden text-on-surface-variant p-sm hover:bg-surface-container-high rounded-full transition-colors cursor-pointer active:scale-95">
<span class="material-symbols-outlined">menu</span>
</button>
<div class="flex-1 flex items-center justify-between md:justify-end gap-lg">
<!-- Search (Mobile) -->
<button class="md:hidden text-on-surface-variant p-sm hover:bg-surface-container-high rounded-full transition-colors cursor-pointer active:scale-95">
<span class="material-symbols-outlined">search</span>
</button>
<!-- Actions -->
<div class="flex items-center gap-sm">
<button class="text-on-surface-variant hover:bg-surface-container-high p-sm rounded-full transition-colors relative cursor-pointer active:scale-95">
<span class="material-symbols-outlined">notifications</span>
<span class="absolute top-1 right-2 w-2 h-2 bg-error rounded-full"></span>
</button>
<button class="text-on-surface-variant hover:bg-surface-container-high p-sm rounded-full transition-colors hidden md:block cursor-pointer active:scale-95">
<span class="material-symbols-outlined">help</span>
</button>
<div class="h-8 w-px bg-outline-variant mx-sm hidden md:block"></div>
<!-- Profile -->
<button class="flex items-center gap-sm p-sm rounded-full hover:bg-surface-container-high transition-colors cursor-pointer active:scale-95">
<img alt="User profile" class="w-8 h-8 rounded-full object-cover border border-outline-variant/30" data-alt="A modern, professional avatar of a young student in a clean, bright setting. The student is smiling gently, wearing neat casual attire. The background is a soft, out-of-focus educational space. Lighting is soft, high-key, and flattering, creating a polished, corporate modern look suitable for an academic platform." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDcmAK7FmLA28LMXJcgjwxdTR8Ktlvqm1G_6kp-c-a0_XgHUErPC20Bri-PCFqSKh0jnOZDXD8jubpSWtGmrVLHct8ffZCOYx7LLpCTJB6g8zcm2wBYakkSga4ecoMVqdfBNQ7NuT4e8PU52bHYHou9Qcn8lRdx_Y6b6wVKnlj8Sm93ArXyOiny_ARHvAmxKY1520dgQVTSvy-P0f3XTJ9gpK6bSnAKpwsLciOBVum_7ULHaW0K_L9SXA"/>
<span class="hidden lg:block font-label-md text-label-md text-on-surface font-medium">Budi Santoso</span>
<span class="material-symbols-outlined hidden lg:block text-outline text-[20px]">expand_more</span>
</button>
</div>
</div>
</header>
<!-- Canvas -->
<div class="flex-1 p-margin-mobile md:p-margin-desktop space-y-xl max-w-7xl mx-auto w-full">
<!-- Hero / Search Section -->
<section class="relative rounded-2xl overflow-hidden tier-1 bg-primary text-on-primary p-xl md:p-2xl min-h-[300px] flex flex-col justify-center items-center text-center">
<!-- Background Pattern -->
<div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 24px 24px;"></div>
<div class="relative z-10 max-w-2xl w-full space-y-lg">
<h1 class="font-headline-lg text-headline-lg md:text-display-lg md:font-display-lg text-white font-bold leading-tight">
                        Jelajahi Dunia Pengetahuan
                    </h1>
<p class="font-body-lg text-body-lg text-primary-fixed opacity-90 max-w-xl mx-auto">
                        Temukan ribuan kursus berkualitas tinggi untuk meningkatkan keterampilan dan mencapai tujuan akademis Anda.
                    </p>
<!-- Big Search Bar -->
<div class="relative mt-lg max-w-xl mx-auto">
<div class="absolute inset-y-0 left-0 pl-lg flex items-center pointer-events-none">
<span class="material-symbols-outlined text-outline">search</span>
</div>
<input class="w-full pl-14 pr-4 py-4 rounded-xl border-none shadow-lg text-on-surface font-body-lg text-body-lg focus:ring-4 focus:ring-primary-container/30 transition-all placeholder:text-outline-variant h-[60px]" placeholder="Cari kursus, topik, atau instruktur..." type="text"/>
<button class="absolute inset-y-2 right-2 px-lg bg-primary text-white font-label-md text-label-md rounded-lg hover:bg-primary/90 transition-colors shadow-sm cursor-pointer active:scale-95 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                            Cari
                        </button>
</div>
</div>
</section>
<!-- Categories -->
<section class="space-y-md">
<div class="flex justify-between items-end">
<h2 class="font-title-lg text-title-lg text-on-surface">Kategori Populer</h2>
<a class="font-label-md text-label-md text-primary hover:text-primary-container transition-colors flex items-center gap-xs" href="#">
                        Lihat Semua <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
</a>
</div>
<!-- Bento-ish Category Grid -->
<div class="grid grid-cols-2 md:grid-cols-4 gap-md">
<a class="tier-1 rounded-xl p-md flex flex-col items-center justify-center gap-sm text-center hover:ring-2 hover:ring-primary/50 transition-all group bg-surface h-32" href="#">
<div class="w-12 h-12 rounded-full bg-secondary-fixed/30 flex items-center justify-center text-secondary-container group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined text-[28px]">biotech</span>
</div>
<span class="font-label-md text-label-md text-on-surface group-hover:text-primary transition-colors">Sains &amp; Teknologi</span>
</a>
<a class="tier-1 rounded-xl p-md flex flex-col items-center justify-center gap-sm text-center hover:ring-2 hover:ring-primary/50 transition-all group bg-surface h-32" href="#">
<div class="w-12 h-12 rounded-full bg-tertiary-fixed/30 flex items-center justify-center text-tertiary group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined text-[28px]">calculate</span>
</div>
<span class="font-label-md text-label-md text-on-surface group-hover:text-primary transition-colors">Matematika</span>
</a>
<a class="tier-1 rounded-xl p-md flex flex-col items-center justify-center gap-sm text-center hover:ring-2 hover:ring-primary/50 transition-all group bg-surface h-32" href="#">
<div class="w-12 h-12 rounded-full bg-primary-fixed/30 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined text-[28px]">translate</span>
</div>
<span class="font-label-md text-label-md text-on-surface group-hover:text-primary transition-colors">Bahasa &amp; Sastra</span>
</a>
<a class="tier-1 rounded-xl p-md flex flex-col items-center justify-center gap-sm text-center hover:ring-2 hover:ring-primary/50 transition-all group bg-surface h-32" href="#">
<div class="w-12 h-12 rounded-full bg-surface-variant flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined text-[28px]">palette</span>
</div>
<span class="font-label-md text-label-md text-on-surface group-hover:text-primary transition-colors">Seni &amp; Desain</span>
</a>
</div>
</section>
<!-- Course Catalog -->
<section class="space-y-lg">
<div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-md">
<div>
<h2 class="font-headline-md text-headline-md text-on-surface">Rekomendasi Kursus</h2>
<p class="font-body-sm text-body-sm text-on-surface-variant">Berdasarkan minat dan aktivitas Anda sebelumnya.</p>
</div>
<!-- Filters/Sort -->
<div class="flex gap-sm w-full md:w-auto overflow-x-auto hide-scroll pb-1">
<button class="whitespace-nowrap px-md py-sm rounded-full border border-primary text-primary bg-primary/5 font-label-md text-label-md hover:bg-primary/10 transition-colors">Semua</button>
<button class="whitespace-nowrap px-md py-sm rounded-full border border-outline-variant text-on-surface-variant font-label-md text-label-md hover:bg-surface-container transition-colors">Terbaru</button>
<button class="whitespace-nowrap px-md py-sm rounded-full border border-outline-variant text-on-surface-variant font-label-md text-label-md hover:bg-surface-container transition-colors flex items-center gap-xs">
                            Filter <span class="material-symbols-outlined text-[16px]">tune</span>
</button>
</div>
</div>
<!-- Course Grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
<!-- Card 1 -->
<article class="tier-1 rounded-2xl overflow-hidden flex flex-col group hover:-translate-y-1 transition-transform duration-300">
<div class="relative h-48 w-full bg-surface-container-high overflow-hidden">
<img alt="Fisika Kuantum Dasar" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="A clean, minimalist 3D illustration representing physics and quantum mechanics. The image features stylized atoms, planetary orbits, and glowing energy lines floating in a bright, modern, white and light blue space. The aesthetic is corporate modern and sophisticated, perfect for a high-end educational course cover." src="https://lh3.googleusercontent.com/aida-public/AB6AXuACjvfi1b1oV9UP1c7vPwH0J8aNPTv3YrzSzNVy7DgXkBgf8NsEPDveDikqlhMHCKOLVKpE26R1LfNuetmqw8D9I6VtsQ8CBXuLGHEl8IQT1OlfSJb_1tkp-Mqta52-bffpNGWbEbEWr0GZDV-Y0DhhROwx37dU3ZmXB6XaQO_UOm9aQlKYVm76a88ORHyIqa9OwYtFG1fdwDB1z9cye-tLgzYtNeJ330s-R6eSX9cGDaklRVW1sWr7xw"/>
<div class="absolute top-sm right-sm bg-white/90 backdrop-blur-sm px-sm py-xs rounded-md font-label-sm text-label-sm text-primary font-bold shadow-sm flex items-center gap-xs">
<span class="material-symbols-outlined text-[14px] text-tertiary-container" data-weight="fill" style="font-variation-settings: 'FILL' 1;">star</span> 4.8
                            </div>
</div>
<div class="p-lg flex flex-col flex-1">
<div class="flex justify-between items-start mb-sm">
<span class="text-xs font-semibold tracking-wider text-secondary uppercase">Sains</span>
<span class="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-xs">
<span class="material-symbols-outlined text-[14px]">group</span> 1,240
                                </span>
</div>
<h3 class="font-title-lg text-title-lg text-on-surface leading-snug mb-xs group-hover:text-primary transition-colors line-clamp-2">Pengantar Fisika Kuantum untuk Pemula</h3>
<p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mb-md">Pahami konsep dasar mekanika kuantum dengan cara yang intuitif dan visual tanpa matematika rumit.</p>
<div class="mt-auto pt-md border-t border-outline-variant/30 flex items-center gap-sm">
<img alt="Instruktur" class="w-8 h-8 rounded-full object-cover" data-alt="A small, circular avatar portrait of an academic professor in a modern setting. High-key lighting, professional appearance, light mode aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDM-DIeBjUdGHCZqoCcvUsF2av7etGebYNT3wtv74KbtZ2k6gDxk8Rvqlnp47KT6qZ7GMjVLet9TU17WlZoN7Rx9KRywZW6M1KGgDfJ9mPsQIKorvNjHzFYugfLG3jM4egpRMPIQzYhwM425FT_9YMM-PpkTz6IOMKCkBZ4Wb7NF24IVlOJhNp9Ea6LQz8Fv_Jns0g0osId3S22ERLlpoVQTleovzKnifDYGaNX2FbY-yqFXbN5peWvYg"/>
<span class="font-label-sm text-label-sm text-on-surface">Dr. Albert F.</span>
</div>
</div>
</article>
<!-- Card 2 -->
<article class="tier-1 rounded-2xl overflow-hidden flex flex-col group hover:-translate-y-1 transition-transform duration-300">
<div class="relative h-48 w-full bg-surface-container-high overflow-hidden">
<img alt="Kalkulus Lanjut" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="A striking digital composition representing advanced mathematics and calculus. The visual features elegant, glowing geometric shapes and mathematical curves overlaid on a pristine white background with subtle depth and glassmorphic elements. The mood is intellectual and precise, fitting a modern learning management system." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDMzj84hDtbxQBI2O5KnbFTj-1VJJhg6fqObubQ-yco-DV1Eckzx1o9tl4UIhyDh0UbDrFmOfdbmkxg5pQ2FEZX1-Vmexj7U3FYnDn2CrYNdoGM_p1e0d_GcE5tqR6zOVGckX5uJGJvUBwIYIuN0NA8NQmJ-O2JCEDT-Ofy0xWoPkPul9h2pn-LT6VLvroGgEHT4lLDbGyIk1GmTopTb37wph5nkuXD9YUrljrjytYpgcHLedH4eP9S6Q"/>
<div class="absolute top-sm right-sm bg-white/90 backdrop-blur-sm px-sm py-xs rounded-md font-label-sm text-label-sm text-primary font-bold shadow-sm flex items-center gap-xs">
<span class="material-symbols-outlined text-[14px] text-tertiary-container" data-weight="fill" style="font-variation-settings: 'FILL' 1;">star</span> 4.9
                            </div>
</div>
<div class="p-lg flex flex-col flex-1">
<div class="flex justify-between items-start mb-sm">
<span class="text-xs font-semibold tracking-wider text-tertiary uppercase">Matematika</span>
<span class="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-xs">
<span class="material-symbols-outlined text-[14px]">group</span> 850
                                </span>
</div>
<h3 class="font-title-lg text-title-lg text-on-surface leading-snug mb-xs group-hover:text-primary transition-colors line-clamp-2">Kalkulus Multivariabel Terapan</h3>
<p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mb-md">Pelajari turunan parsial dan integral lipat untuk menyelesaikan masalah teknik dunia nyata.</p>
<div class="mt-auto pt-md border-t border-outline-variant/30 flex items-center gap-sm">
<img alt="Instruktur" class="w-8 h-8 rounded-full object-cover" data-alt="A small, circular avatar portrait of an academic professor in a modern setting. High-key lighting, professional appearance, light mode aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDOSsyQ9e6a24wvPZt-03CzEkknLaBUgNCRxcCkjO5IsImSXBKTt9-QzXOeTvSe2fsC6toYw2PlqMTwefSWhjrbtNPcOY-IZCt8IMHbSQOBifHNLUxNc1vtVzvamRGkN_SIwVimZhuNEexDkVMU3pZlN-0FQrFoj95r1COpfoKLGIIZoABGMl_wsSxYAxNN6dixsvk7N8pcYpipbRcs0ZneOla0L_U2IIWdORe_ACIzJ6hEh8lTPqwGaw"/>
<span class="font-label-sm text-label-sm text-on-surface">Prof. Sarah W.</span>
</div>
</div>
</article>
<!-- Card 3 -->
<article class="tier-1 rounded-2xl overflow-hidden flex flex-col group hover:-translate-y-1 transition-transform duration-300">
<div class="relative h-48 w-full bg-surface-container-high overflow-hidden">
<img alt="Sastra Inggris" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="A sophisticated visual representation of language learning and literature. Soft, layered translucent books and elegant typography floating in a clean, bright space with subtle indigo and sky-blue accents. The aesthetic is modern, calm, and academic, designed for a high-end UI layout." src="https://lh3.googleusercontent.com/aida-public/AB6AXuB2Sucl28qyIK58WVktv1KceTZnfvJEFduRrA1jOQPL2VhfC628P-GtbjceBumNJ0UglXnA5jx1dRFafavGBV_Q0G4fTl3Q80ZJJb-xUYyvsS4-roMSpkBIngeujvP9CfldyERQMcdjc53eEQIeO_V_waKgeyDMEUvPS9_ahlasL2q-j5F39CTs8VrDLuHjn5F8Uzx-0Yr79tQxY0SrbjMH61OFCLBkzwBn5vjc6zzMCNEYOuAMhgD2PA"/>
<div class="absolute top-sm right-sm bg-white/90 backdrop-blur-sm px-sm py-xs rounded-md font-label-sm text-label-sm text-primary font-bold shadow-sm flex items-center gap-xs">
<span class="material-symbols-outlined text-[14px] text-tertiary-container" data-weight="fill" style="font-variation-settings: 'FILL' 1;">star</span> 4.7
                            </div>
</div>
<div class="p-lg flex flex-col flex-1">
<div class="flex justify-between items-start mb-sm">
<span class="text-xs font-semibold tracking-wider text-primary uppercase">Bahasa</span>
<span class="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-xs">
<span class="material-symbols-outlined text-[14px]">group</span> 2,100
                                </span>
</div>
<h3 class="font-title-lg text-title-lg text-on-surface leading-snug mb-xs group-hover:text-primary transition-colors line-clamp-2">Sastra Inggris Klasik: Shakespeare &amp; Rekan</h3>
<p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mb-md">Eksplorasi mendalam karya-karya terbesar era Elizabethan dan maknanya di era modern.</p>
<div class="mt-auto pt-md border-t border-outline-variant/30 flex items-center gap-sm">
<img alt="Instruktur" class="w-8 h-8 rounded-full object-cover" data-alt="A small, circular avatar portrait of an academic professor in a modern setting. High-key lighting, professional appearance, light mode aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCIH8LpjgRzbS9sRnu4iO1G4MeZRaSWJoZ-mAfQVh7VS0Cdqar8LwNYO3F1oaLwBHAgFsKjSDHfXnMEu4aONJlBepg-9VibCG4KdQIG5MHqtwnZ7VbRgvCBjfJJyIxUjCO_frDW_Ca2I2DVZLG3qYp4Otsk3L1uFw7z7wCE44Sg2lIJoKKJG48-CP0lpMUGAYzuyDfh8mJZ8hcTolhg4JiDW-hHfzfuSE5JHl6txvCGPqsr5pxlmVK0aQ"/>
<span class="font-label-sm text-label-sm text-on-surface">Dr. James K.</span>
</div>
</div>
</article>
</div>
<div class="flex justify-center mt-xl pt-lg">
<button class="px-xl py-sm bg-surface text-primary border border-primary/20 rounded-xl font-title-md text-title-md shadow-sm hover:bg-surface-container transition-colors active:scale-95">
                        Muat Lebih Banyak
                    </button>
</div>
</section>
</div>
</main>
</body></html>

<!-- Tugas - Murid -->
<!DOCTYPE html>

<html lang="id"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>KSI-ON LMS - Tugas Murid</title>
<!-- Material Symbols -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@100..900&family=Inter:wght@100..900&display=swap" rel="stylesheet"/>
<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<!-- Tailwind Configuration -->
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "secondary-fixed": "#c9e6ff",
                    "secondary-container": "#39b8fd",
                    "primary": "#3525cd",
                    "surface-container-low": "#eff4ff",
                    "on-error-container": "#93000a",
                    "on-tertiary-fixed": "#40000d",
                    "outline": "#777587",
                    "on-tertiary": "#ffffff",
                    "on-background": "#0b1c30",
                    "error-container": "#ffdad6",
                    "tertiary-fixed-dim": "#ffb2b7",
                    "surface-variant": "#d3e4fe",
                    "outline-variant": "#c7c4d8",
                    "tertiary-fixed": "#ffdadb",
                    "on-tertiary-container": "#ffd0d2",
                    "on-primary-container": "#dad7ff",
                    "on-surface-variant": "#464555",
                    "on-secondary-fixed-variant": "#004c6e",
                    "on-primary-fixed-variant": "#3323cc",
                    "secondary": "#006591",
                    "on-secondary-container": "#004666",
                    "error": "#ba1a1a",
                    "surface-container-highest": "#d3e4fe",
                    "primary-fixed": "#e2dfff",
                    "on-secondary": "#ffffff",
                    "on-primary-fixed": "#0f0069",
                    "secondary-fixed-dim": "#89ceff",
                    "on-secondary-fixed": "#001e2f",
                    "surface-tint": "#4d44e3",
                    "primary-fixed-dim": "#c3c0ff",
                    "surface-container-high": "#dce9ff",
                    "on-surface": "#0b1c30",
                    "tertiary": "#95002b",
                    "inverse-primary": "#c3c0ff",
                    "surface-container": "#e5eeff",
                    "inverse-on-surface": "#eaf1ff",
                    "surface-bright": "#f8f9ff",
                    "surface": "#f8f9ff",
                    "surface-container-lowest": "#ffffff",
                    "on-error": "#ffffff",
                    "tertiary-container": "#bf0f3c",
                    "primary-container": "#4f46e5",
                    "background": "#f8f9ff",
                    "surface-dim": "#cbdbf5",
                    "on-tertiary-fixed-variant": "#92002a",
                    "inverse-surface": "#213145",
                    "on-primary": "#ffffff"
            },
            "borderRadius": {
                    "DEFAULT": "0.25rem",
                    "lg": "0.5rem",
                    "xl": "0.75rem",
                    "full": "9999px"
            },
            "spacing": {
                    "margin-desktop": "32px",
                    "margin-mobile": "16px",
                    "sm": "12px",
                    "lg": "24px",
                    "gutter": "24px",
                    "base": "4px",
                    "sidebar-width": "280px",
                    "xl": "32px",
                    "xs": "8px",
                    "md": "16px",
                    "2xl": "48px"
            },
            "fontFamily": {
                    "label-md": ["Inter"],
                    "headline-md": ["Hanken Grotesk"],
                    "body-lg": ["Inter"],
                    "headline-lg": ["Hanken Grotesk"],
                    "body-sm": ["Inter"],
                    "label-sm": ["Inter"],
                    "body-md": ["Inter"],
                    "title-md": ["Inter"],
                    "title-lg": ["Inter"],
                    "display-lg": ["Hanken Grotesk"]
            },
            "fontSize": {
                    "label-md": ["14px", {"lineHeight": "20px", "letterSpacing": "0.01em", "fontWeight": "500"}],
                    "headline-md": ["24px", {"lineHeight": "32px", "fontWeight": "600"}],
                    "body-lg": ["18px", {"lineHeight": "28px", "fontWeight": "400"}],
                    "headline-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "600"}],
                    "body-sm": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
                    "label-sm": ["12px", {"lineHeight": "16px", "fontWeight": "600"}],
                    "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
                    "title-md": ["16px", {"lineHeight": "24px", "fontWeight": "600"}],
                    "title-lg": ["20px", {"lineHeight": "28px", "fontWeight": "600"}],
                    "display-lg": ["48px", {"lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700"}]
            }
          }
        }
      }
    </script>
<style>
        .inner-glow { box-shadow: inset 0 1px 0 rgba(255,255,255,0.2); }
        .glass-pill { background: rgba(53, 37, 205, 0.05); backdrop-filter: blur(8px); border: 1px solid rgba(199, 196, 216, 0.5); }
        /* Scrollbar styling for a cleaner look */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #c7c4d8; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #777587; }
    </style>
</head>
<body class="bg-background text-on-background font-body-md min-h-screen flex overflow-hidden selection:bg-primary-container selection:text-on-primary-container">
<!-- SideNavBar (Shared Component) -->
<nav class="hidden md:flex flex-col h-full border-r border-outline-variant bg-surface dark:bg-on-background text-primary dark:text-primary-fixed font-label-md text-label-md w-sidebar-width h-screen fixed left-0 top-0 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] shadow-lg z-50">
<!-- Header -->
<div class="p-lg flex flex-col gap-xs border-b border-outline-variant">
<div class="flex items-center gap-md">
<div class="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary inner-glow shadow-sm">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">school</span>
</div>
<div>
<h1 class="font-headline-md text-headline-md font-extrabold text-primary">KSI-ON LMS</h1>
<p class="font-label-sm text-label-sm text-on-surface-variant">Academic Excellence</p>
</div>
</div>
</div>
<!-- Navigation Links -->
<div class="flex-1 overflow-y-auto py-md flex flex-col gap-base">
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">dashboard</span>
                Dashboard
            </a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">group</span>
                Users
            </a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">school</span>
                Courses
            </a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">quiz</span>
                Exams
            </a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">campaign</span>
                Announcements
            </a>
<!-- ACTIVE TAB: Activities -->
<a class="bg-primary/10 text-primary border-l-4 border-primary rounded-r-full py-md px-lg transition-all flex items-center gap-md font-bold" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">pending_actions</span>
                Activities
            </a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">settings</span>
                Settings
            </a>
<div class="px-lg py-sm mt-md">
<p class="font-label-sm text-label-sm text-outline uppercase tracking-wider">Data</p>
</div>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">class</span>
                Class Data
            </a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">person_4</span>
                Teacher Data
            </a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">person</span>
                Student Data
            </a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">fact_check</span>
                Attendance
            </a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">analytics</span>
                Evaluations
            </a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">assessment</span>
                Reports
            </a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">account_circle</span>
                Profile
            </a>
</div>
<!-- Footer -->
<div class="p-lg border-t border-outline-variant mt-auto">
<button class="w-full mb-sm bg-surface-container-low text-primary font-title-md text-title-md py-sm rounded-xl hover:bg-surface-variant transition-colors flex items-center justify-center gap-sm">
<span class="material-symbols-outlined">support_agent</span>
                Help Desk
            </button>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-error transition-all duration-200 ease-in-out rounded-xl" href="#">
<span class="material-symbols-outlined">logout</span>
                Logout
            </a>
</div>
</nav>
<!-- Main Content Area -->
<main class="flex-1 md:ml-sidebar-width flex flex-col h-screen overflow-hidden relative">
<!-- TopNavBar (Shared Component) -->
<header class="flex justify-between items-center px-lg py-xs w-full z-40 bg-surface/70 dark:bg-on-background/70 backdrop-blur-md text-primary dark:text-primary-fixed font-body-md text-body-md full-width top-0 sticky border-b border-outline-variant dark:border-outline shadow-sm">
<div class="flex items-center gap-md md:hidden">
<button class="p-sm rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant">
<span class="material-symbols-outlined">menu</span>
</button>
<span class="font-display-lg text-title-lg font-bold text-primary dark:text-primary-fixed">KSI-ON</span>
</div>
<div class="hidden md:flex flex-1">
<!-- Search bar on left logic if needed, but UI usually has title here -->
<h2 class="font-headline-md text-title-lg font-bold text-on-background">Manajemen Tugas</h2>
</div>
<div class="flex items-center gap-md">
<button class="p-xs rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant relative cursor-pointer active:scale-95">
<span class="material-symbols-outlined">notifications</span>
<span class="absolute top-0 right-0 w-2 h-2 bg-error rounded-full border-2 border-surface"></span>
</button>
<button class="p-xs rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant cursor-pointer active:scale-95 hidden sm:block">
<span class="material-symbols-outlined">help</span>
</button>
<div class="h-6 w-px bg-outline-variant mx-xs"></div>
<div class="flex items-center gap-sm cursor-pointer hover:bg-surface-container-high p-xs rounded-xl transition-colors">
<img alt="User profile" class="w-8 h-8 rounded-full object-cover border border-outline-variant" data-alt="A highly detailed professional headshot of a student in a bright, modern learning environment. The lighting is soft and natural, creating a clean light-mode aesthetic. The student wears neat casual academic attire. The background is a slightly blurred modern classroom or library with subtle glassmorphic elements and white/indigo color hints." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPprYN1tGoQLbN9okUjP6_TXui2QhtKBGj7LVR5EK-bvEW9fMKdUBlI1DVLmcogpdZR6PaBDYjAL0_W0mg4v0-dAbMZs_zgOa_mdA8HZFZQZl00Aud1vUenkCQNRvHYI2zt-_N9LGelgbHs9mg3dUh2U_MJdOs55fkCS9N9iP1oOecZXNCBfcjymQcrl3qH66Cxl5Lopjp06Aw_qPsvEgS6JpewzuC1FpKU2bMZUswargk14wuYQ1YoQ"/>
<span class="font-title-md text-label-md hidden sm:block">Budi Santoso</span>
<span class="material-symbols-outlined text-outline">expand_more</span>
</div>
</div>
</header>
<!-- Scrollable Content Canvas -->
<div class="flex-1 overflow-y-auto p-margin-mobile md:p-margin-desktop">
<!-- Page Header & Filters -->
<div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-md mb-xl">
<div>
<h1 class="font-headline-lg text-headline-lg font-bold text-on-background mb-xs">Tugas Saya</h1>
<p class="font-body-md text-body-md text-on-surface-variant">Pantau dan kelola semua tugas akademik Anda di sini.</p>
</div>
<!-- Tab Navigation (Glassmorphic Pill) -->
<div class="glass-pill rounded-full p-1 flex items-center w-full md:w-auto">
<button class="flex-1 md:flex-none px-lg py-sm rounded-full bg-surface shadow-sm font-title-md text-label-md text-primary transition-all">
                        Semua Tugas
                    </button>
<button class="flex-1 md:flex-none px-lg py-sm rounded-full font-title-md text-label-md text-on-surface-variant hover:text-primary transition-all">
                        Sedang Dinilai
                    </button>
<button class="flex-1 md:flex-none px-lg py-sm rounded-full font-title-md text-label-md text-on-surface-variant hover:text-primary transition-all">
                        Selesai
                    </button>
</div>
</div>
<!-- Dashboard Stats (Tier 1 Depth) -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-lg mb-xl">
<!-- Stat 1 -->
<div class="bg-surface-container-lowest rounded-xl p-lg shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-surface-variant flex items-center gap-md transition-transform hover:-translate-y-1 duration-300">
<div class="w-12 h-12 rounded-full bg-error-container flex items-center justify-center text-on-error-container">
<span class="material-symbols-outlined">assignment_late</span>
</div>
<div>
<p class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Harus Dikerjakan</p>
<p class="font-headline-md text-headline-md text-on-background">4 <span class="font-body-sm text-body-sm text-on-surface-variant font-normal">tugas</span></p>
</div>
</div>
<!-- Stat 2 -->
<div class="bg-surface-container-lowest rounded-xl p-lg shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-surface-variant flex items-center gap-md transition-transform hover:-translate-y-1 duration-300">
<div class="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
<span class="material-symbols-outlined">hourglass_top</span>
</div>
<div>
<p class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Sedang Dinilai</p>
<p class="font-headline-md text-headline-md text-on-background">2 <span class="font-body-sm text-body-sm text-on-surface-variant font-normal">tugas</span></p>
</div>
</div>
<!-- Stat 3 -->
<div class="bg-surface-container-lowest rounded-xl p-lg shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-surface-variant flex items-center gap-md transition-transform hover:-translate-y-1 duration-300">
<div class="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center text-primary">
<span class="material-symbols-outlined">task_alt</span>
</div>
<div>
<p class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Selesai (Bulan Ini)</p>
<p class="font-headline-md text-headline-md text-on-background">12 <span class="font-body-sm text-body-sm text-on-surface-variant font-normal">tugas</span></p>
</div>
</div>
</div>
<h2 class="font-title-lg text-title-lg text-on-background mb-lg">Daftar Tugas</h2>
<!-- Task Grid (Bento Style layout for cards) -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg pb-2xl">
<!-- CARD: Pending (Urgent) -->
<div class="bg-surface-container-lowest rounded-xl p-lg shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border-l-4 border-l-error flex flex-col group hover:shadow-[0px_10px_30px_rgba(0,0,0,0.1)] transition-all duration-300 relative overflow-hidden">
<div class="absolute top-0 right-0 w-32 h-32 bg-error/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
<div class="flex justify-between items-start mb-md">
<div class="flex items-center gap-sm">
<span class="w-8 h-8 rounded-lg bg-surface-variant flex items-center justify-center text-primary">
<span class="material-symbols-outlined text-sm">calculate</span>
</span>
<span class="font-label-md text-label-md text-on-surface-variant">Matematika Lanjut</span>
</div>
<span class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-error-container text-on-error-container font-label-sm text-label-sm">
<span class="material-symbols-outlined text-[14px]">error</span>
                            Pending
                        </span>
</div>
<div class="mb-lg flex-1">
<h3 class="font-title-lg text-title-lg text-on-background mb-sm group-hover:text-primary transition-colors">Tugas Aljabar Linear - Matriks 2x2</h3>
<p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">Kerjakan soal dari buku paket halaman 45 nomor 1 sampai 10. Kumpulkan dalam format PDF.</p>
</div>
<div class="flex items-center justify-between mt-auto pt-md border-t border-surface-variant">
<div class="flex flex-col">
<span class="font-label-sm text-label-sm text-outline">Tenggat Waktu</span>
<span class="font-title-md text-label-md text-error flex items-center gap-1">
<span class="material-symbols-outlined text-[16px]">schedule</span>
                                Hari ini, 23:59
                            </span>
</div>
<button class="bg-primary text-on-primary font-title-md text-label-md px-md py-sm rounded-xl inner-glow hover:bg-surface-tint transition-colors active:scale-95 shadow-sm flex items-center gap-2">
<span class="material-symbols-outlined text-[18px]">upload_file</span>
                            Upload
                        </button>
</div>
</div>
<!-- CARD: Pending (Normal) -->
<div class="bg-surface-container-lowest rounded-xl p-lg shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-surface-variant flex flex-col group hover:shadow-[0px_10px_30px_rgba(0,0,0,0.1)] transition-all duration-300">
<div class="flex justify-between items-start mb-md">
<div class="flex items-center gap-sm">
<span class="w-8 h-8 rounded-lg bg-surface-variant flex items-center justify-center text-primary">
<span class="material-symbols-outlined text-sm">science</span>
</span>
<span class="font-label-md text-label-md text-on-surface-variant">Biologi</span>
</div>
<span class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
                            Pending
                        </span>
</div>
<div class="mb-lg flex-1">
<h3 class="font-title-lg text-title-lg text-on-background mb-sm group-hover:text-primary transition-colors">Laporan Praktikum Fotosintesis</h3>
<p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">Susun laporan berdasarkan hasil pengamatan praktikum minggu lalu. Sertakan foto dan tabel data.</p>
</div>
<div class="flex items-center justify-between mt-auto pt-md border-t border-surface-variant">
<div class="flex flex-col">
<span class="font-label-sm text-label-sm text-outline">Tenggat Waktu</span>
<span class="font-title-md text-label-md text-on-background flex items-center gap-1">
<span class="material-symbols-outlined text-[16px] text-outline">schedule</span>
                                24 Okt, 10:00
                            </span>
</div>
<button class="bg-primary text-on-primary font-title-md text-label-md px-md py-sm rounded-xl inner-glow hover:bg-surface-tint transition-colors active:scale-95 shadow-sm flex items-center gap-2">
<span class="material-symbols-outlined text-[18px]">upload_file</span>
                            Upload
                        </button>
</div>
</div>
<!-- CARD: In Progress / Grading -->
<div class="bg-surface-container-lowest rounded-xl p-lg shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-surface-variant flex flex-col group hover:shadow-[0px_10px_30px_rgba(0,0,0,0.1)] transition-all duration-300">
<div class="flex justify-between items-start mb-md">
<div class="flex items-center gap-sm">
<span class="w-8 h-8 rounded-lg bg-surface-variant flex items-center justify-center text-primary">
<span class="material-symbols-outlined text-sm">history_edu</span>
</span>
<span class="font-label-md text-label-md text-on-surface-variant">Sejarah Indonesia</span>
</div>
<span class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">
                            Sedang Dinilai
                        </span>
</div>
<div class="mb-lg flex-1">
<h3 class="font-title-lg text-title-lg text-on-background mb-sm group-hover:text-primary transition-colors">Esai Kemerdekaan RI</h3>
<p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">Tugas esai minimal 1000 kata mengenai peran tokoh-tokoh daerah menjelang proklamasi.</p>
</div>
<div class="flex items-center justify-between mt-auto pt-md border-t border-surface-variant">
<div class="flex flex-col">
<span class="font-label-sm text-label-sm text-outline">Dikumpulkan Pada</span>
<span class="font-title-md text-label-md text-on-background flex items-center gap-1">
<span class="material-symbols-outlined text-[16px] text-outline">check_circle</span>
                                20 Okt, 14:20
                            </span>
</div>
<button class="bg-surface border border-outline-variant text-primary font-title-md text-label-md px-md py-sm rounded-xl hover:bg-surface-container-low transition-colors active:scale-95 flex items-center gap-2">
                            Lihat Kiriman
                        </button>
</div>
</div>
<!-- CARD: Completed -->
<div class="bg-surface-container-lowest rounded-xl p-lg shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-surface-variant flex flex-col group hover:shadow-[0px_10px_30px_rgba(0,0,0,0.1)] transition-all duration-300 opacity-80 hover:opacity-100">
<div class="flex justify-between items-start mb-md">
<div class="flex items-center gap-sm">
<span class="w-8 h-8 rounded-lg bg-surface-variant flex items-center justify-center text-primary">
<span class="material-symbols-outlined text-sm">translate</span>
</span>
<span class="font-label-md text-label-md text-on-surface-variant">Bahasa Inggris</span>
</div>
<span class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary-container/20 text-primary font-label-sm text-label-sm">
<span class="material-symbols-outlined text-[14px]">done_all</span>
                            Selesai
                        </span>
</div>
<div class="mb-lg flex-1">
<h3 class="font-title-lg text-title-lg text-on-background mb-sm">Speaking Test Recording</h3>
<p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">Rekaman percakapan tentang "Future Career Plans" berdurasi 3 menit.</p>
</div>
<div class="flex items-center justify-between mt-auto pt-md border-t border-surface-variant bg-surface-bright rounded-b-lg -mx-lg -mb-lg p-lg">
<div class="flex flex-col">
<span class="font-label-sm text-label-sm text-outline">Nilai Akhir</span>
<span class="font-display-lg text-headline-lg font-bold text-primary flex items-end gap-1 leading-none mt-1">
                                92 <span class="font-body-sm text-label-sm text-on-surface-variant mb-1">/100</span>
</span>
</div>
<div class="w-12 h-12 rounded-full bg-surface border-2 border-primary-container/30 flex items-center justify-center text-primary">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">workspace_premium</span>
</div>
</div>
</div>
</div>
</div>
</main>
</body></html>

<!-- Kursus - Guru -->
<!DOCTYPE html>

<html lang="id"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Kursus - Guru | KSI-ON</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700;800&amp;family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "primary": "#3525cd",
                    "secondary-fixed-dim": "#89ceff",
                    "outline-variant": "#c7c4d8",
                    "on-surface": "#0b1c30",
                    "inverse-on-surface": "#eaf1ff",
                    "surface-bright": "#f8f9ff",
                    "on-tertiary-container": "#ffd0d2",
                    "outline": "#777587",
                    "tertiary": "#95002b",
                    "secondary-fixed": "#c9e6ff",
                    "on-background": "#0b1c30",
                    "inverse-surface": "#213145",
                    "error-container": "#ffdad6",
                    "on-secondary-container": "#004666",
                    "tertiary-fixed-dim": "#ffb2b7",
                    "on-tertiary-fixed-variant": "#92002a",
                    "on-error-container": "#93000a",
                    "inverse-primary": "#c3c0ff",
                    "on-primary-fixed": "#0f0069",
                    "error": "#ba1a1a",
                    "surface-variant": "#d3e4fe",
                    "secondary-container": "#39b8fd",
                    "surface-container": "#e5eeff",
                    "surface": "#f8f9ff",
                    "on-secondary-fixed-variant": "#004c6e",
                    "on-primary-container": "#dad7ff",
                    "on-primary-fixed-variant": "#3323cc",
                    "on-error": "#ffffff",
                    "on-surface-variant": "#464555",
                    "background": "#f8f9ff",
                    "tertiary-container": "#bf0f3c",
                    "on-tertiary": "#ffffff",
                    "surface-tint": "#4d44e3",
                    "primary-fixed": "#e2dfff",
                    "on-secondary-fixed": "#001e2f",
                    "tertiary-fixed": "#ffdadb",
                    "surface-container-high": "#dce9ff",
                    "surface-container-low": "#eff4ff",
                    "surface-container-highest": "#d3e4fe",
                    "on-tertiary-fixed": "#40000d",
                    "secondary": "#006591",
                    "primary-container": "#4f46e5",
                    "primary-fixed-dim": "#c3c0ff",
                    "on-secondary": "#ffffff",
                    "surface-dim": "#cbdbf5",
                    "on-primary": "#ffffff",
                    "surface-container-lowest": "#ffffff"
            },
            "borderRadius": {
                    "DEFAULT": "0.25rem",
                    "lg": "0.5rem",
                    "xl": "0.75rem",
                    "full": "9999px"
            },
            "spacing": {
                    "base": "4px",
                    "sidebar-width": "280px",
                    "md": "16px",
                    "gutter": "24px",
                    "lg": "24px",
                    "margin-mobile": "16px",
                    "2xl": "48px",
                    "margin-desktop": "32px",
                    "xs": "8px",
                    "xl": "32px",
                    "sm": "12px"
            },
            "fontFamily": {
                    "label-md": ["Inter"],
                    "label-sm": ["Inter"],
                    "body-sm": ["Inter"],
                    "headline-md": ["Hanken Grotesk"],
                    "headline-lg": ["Hanken Grotesk"],
                    "display-lg": ["Hanken Grotesk"],
                    "body-lg": ["Inter"],
                    "body-md": ["Inter"],
                    "title-md": ["Inter"],
                    "title-lg": ["Inter"]
            },
            "fontSize": {
                    "label-md": ["14px", {"lineHeight": "20px", "letterSpacing": "0.01em", "fontWeight": "500"}],
                    "label-sm": ["12px", {"lineHeight": "16px", "fontWeight": "600"}],
                    "body-sm": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
                    "headline-md": ["24px", {"lineHeight": "32px", "fontWeight": "600"}],
                    "headline-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "600"}],
                    "display-lg": ["48px", {"lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                    "body-lg": ["18px", {"lineHeight": "28px", "fontWeight": "400"}],
                    "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
                    "title-md": ["16px", {"lineHeight": "24px", "fontWeight": "600"}],
                    "title-lg": ["20px", {"lineHeight": "28px", "fontWeight": "600"}]
            }
          },
        },
      }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .icon-fill {
            font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
    </style>
</head>
<body class="bg-background text-on-background font-body-md antialiased h-screen overflow-hidden flex">
<!-- SideNavBar -->
<aside class="hidden md:flex flex-col bg-surface dark:bg-on-background w-sidebar-width h-screen fixed left-0 top-0 shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border-r border-outline-variant z-50">
<!-- Brand Header -->
<div class="px-lg py-xl">
<h1 class="font-headline-md text-headline-md font-extrabold text-primary">KSI-ON LMS</h1>
<p class="font-label-sm text-label-sm text-on-surface-variant mt-xs">Academic Excellence</p>
</div>
<!-- Navigation Tabs -->
<nav class="flex-1 overflow-y-auto px-xs pb-lg space-y-2">
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary rounded-r-full transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">dashboard</span>
<span class="font-label-md text-label-md">Dashboard</span>
</a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary rounded-r-full transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">group</span>
<span class="font-label-md text-label-md">Users</span>
</a>
<a class="bg-primary/10 text-primary border-l-4 border-primary rounded-r-full py-md px-lg transition-all flex items-center gap-md font-label-md text-label-md" href="#">
<span class="material-symbols-outlined icon-fill">school</span>
<span>Courses</span>
</a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary rounded-r-full transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">quiz</span>
<span class="font-label-md text-label-md">Exams</span>
</a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary rounded-r-full transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">campaign</span>
<span class="font-label-md text-label-md">Announcements</span>
</a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary rounded-r-full transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">pending_actions</span>
<span class="font-label-md text-label-md">Activities</span>
</a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary rounded-r-full transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">settings</span>
<span class="font-label-md text-label-md">Settings</span>
</a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary rounded-r-full transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">class</span>
<span class="font-label-md text-label-md">Class Data</span>
</a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary rounded-r-full transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">person_4</span>
<span class="font-label-md text-label-md">Teacher Data</span>
</a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary rounded-r-full transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">person</span>
<span class="font-label-md text-label-md">Student Data</span>
</a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary rounded-r-full transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">fact_check</span>
<span class="font-label-md text-label-md">Attendance</span>
</a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary rounded-r-full transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">analytics</span>
<span class="font-label-md text-label-md">Evaluations</span>
</a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary rounded-r-full transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">assessment</span>
<span class="font-label-md text-label-md">Reports</span>
</a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md hover:bg-surface-container-low hover:text-primary rounded-r-full transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">account_circle</span>
<span class="font-label-md text-label-md">Profile</span>
</a>
</nav>
<!-- Footer Action -->
<div class="p-lg border-t border-outline-variant mt-auto">
<button class="w-full flex items-center justify-center gap-sm bg-primary text-on-primary py-sm px-md rounded-lg font-label-md text-label-md shadow-sm hover:shadow-md transition-shadow">
                Help Desk
            </button>
<a class="mt-md text-on-surface-variant py-sm px-md flex items-center gap-md hover:bg-surface-container-low hover:text-primary rounded-full transition-all duration-200 ease-in-out" href="#">
<span class="material-symbols-outlined">logout</span>
<span class="font-label-md text-label-md">Logout</span>
</a>
</div>
</aside>
<!-- Main Content Area -->
<div class="flex-1 ml-0 md:ml-sidebar-width flex flex-col h-screen overflow-hidden">
<!-- TopNavBar (Mobile Only for Navigation, Desktop for Context/Actions) -->
<header class="bg-surface/70 backdrop-blur-md dark:bg-on-background/70 font-body-md text-body-md border-b border-outline-variant dark:border-outline shadow-sm flex justify-between items-center px-lg py-xs w-full z-40 sticky top-0">
<div class="flex items-center md:hidden">
<span class="font-display-lg text-display-lg font-bold text-primary dark:text-primary-fixed">KSI-ON</span>
</div>
<!-- Context Header for Desktop -->
<div class="hidden md:flex flex-col">
<h2 class="font-title-lg text-title-lg text-on-surface">Manajemen Kursus</h2>
</div>
<div class="flex items-center gap-md">
<!-- Actions -->
<button class="text-on-surface-variant hover:bg-surface-container-high transition-colors p-sm rounded-full cursor-pointer active:scale-95">
<span class="material-symbols-outlined">notifications</span>
</button>
<button class="text-on-surface-variant hover:bg-surface-container-high transition-colors p-sm rounded-full cursor-pointer active:scale-95">
<span class="material-symbols-outlined">help</span>
</button>
<div class="h-8 w-px bg-outline-variant mx-xs"></div>
<!-- Profile/Logout -->
<div class="flex items-center gap-sm">
<img class="w-10 h-10 rounded-full object-cover border border-outline-variant" data-alt="A small, circular avatar portrait of a professional teacher smiling warmly in a well-lit academic setting. Soft natural light, high quality corporate modern headshot style." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDan4WNGrTPM02w6W79bVU6_IIruoHUe7OSzvJLwcwavWn5prQulZ3smBWHMTvtUxkOKm3MzFyIHo-YB0YH9RgJuvXLg0hcn9-75uiOoE05FEYfGdvaRIKbckCT3bxvFqauBbwvEG8eHm2NU23V9vE1MbOH1_KHsE2Sm6R_eAm-QBDfxgRLp2oIg2bmcwu_yqoGuiDGJ4VoUsk54krOrZTPSSf-4mOGBQTTZvDvh3I2nQJ0q5Ygv6DFmg"/>
<button class="hidden lg:block font-label-md text-label-md text-primary font-bold cursor-pointer active:scale-95">
                         Logout
                     </button>
</div>
</div>
</header>
<!-- Scrollable Canvas -->
<main class="flex-1 overflow-y-auto p-margin-mobile md:p-margin-desktop bg-background pb-32">
<!-- Page Header & Global Actions -->
<div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-md mb-lg">
<div>
<h1 class="font-headline-lg text-headline-lg text-on-surface">Kursus Anda</h1>
<p class="font-body-md text-body-md text-on-surface-variant mt-xs">Kelola materi, tugas, dan aktivitas siswa di kelas yang Anda ampu.</p>
</div>
<button class="bg-primary text-on-primary font-label-md text-label-md py-sm px-lg rounded-lg shadow-sm hover:shadow-md transition-shadow flex items-center gap-xs">
<span class="material-symbols-outlined">add</span>
                    Tambah Kursus Baru
                </button>
</div>
<!-- Dashboard Stats Summary -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-md mb-xl">
<!-- Stat Card 1 -->
<div class="bg-surface rounded-xl p-lg shadow-[0px_4px_20px_rgba(0,0,0,0.05)] flex items-center gap-md border border-surface-container-high">
<div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
<span class="material-symbols-outlined icon-fill">school</span>
</div>
<div>
<p class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Total Kursus Aktif</p>
<p class="font-headline-md text-headline-md text-on-surface">12</p>
</div>
</div>
<!-- Stat Card 2 -->
<div class="bg-surface rounded-xl p-lg shadow-[0px_4px_20px_rgba(0,0,0,0.05)] flex items-center gap-md border border-surface-container-high">
<div class="w-12 h-12 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary">
<span class="material-symbols-outlined icon-fill">group</span>
</div>
<div>
<p class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Total Siswa Dibimbing</p>
<p class="font-headline-md text-headline-md text-on-surface">348</p>
</div>
</div>
<!-- Stat Card 3 -->
<div class="bg-surface rounded-xl p-lg shadow-[0px_4px_20px_rgba(0,0,0,0.05)] flex items-center gap-md border border-surface-container-high">
<div class="w-12 h-12 rounded-full bg-tertiary-container/10 flex items-center justify-center text-tertiary">
<span class="material-symbols-outlined icon-fill">assignment_turned_in</span>
</div>
<div>
<p class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Tugas Menunggu Koreksi</p>
<p class="font-headline-md text-headline-md text-on-surface">45</p>
</div>
</div>
</div>
<!-- Bento Grid / Course List -->
<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">
<!-- Course Card 1 -->
<div class="bg-surface rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-surface-container-highest overflow-hidden flex flex-col group hover:-translate-y-1 transition-transform duration-300">
<!-- Image Banner -->
<div class="h-32 w-full relative">
<img class="w-full h-full object-cover" data-alt="A bright, abstract geometric illustration representing advanced mathematics and physics. Clean lines, soft blue and indigo corporate color palette, glassmorphic elements overlaying equations. Professional academic aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQxISd05aCuLkKdlKAhr-kfs9k_2w6teLxjSIppZlaXdQrkW1Iv6B3055GEqmMJwOuPeEF2_2qwIAl5MPSiZhFvFetNBahVyv3Xd4w9hpkUvzbxYw09GQnIfQFZcGQHORtrKVMqJ8D6pLuynoWDs3hh7A7P5lhnIxHbmx6ZMGH7xywXjFHx_cQ_uLoXn5kR_8e1th8DiIbyh9Yjq6eMPR5IAP3-s187VueRRthief_oyZM7yYYZOlVyA"/>
<div class="absolute inset-0 bg-gradient-to-t from-surface to-transparent"></div>
<div class="absolute bottom-sm left-md px-sm py-xs bg-surface/80 backdrop-blur-md rounded-md border border-white/20 font-label-sm text-label-sm text-on-surface">
                            Fisika Lanjutan
                        </div>
</div>
<div class="p-md flex-1 flex flex-col">
<h3 class="font-title-lg text-title-lg text-on-surface mb-xs group-hover:text-primary transition-colors">Dinamika Kuantum XII</h3>
<p class="font-body-sm text-body-sm text-on-surface-variant mb-md flex-1">Pembahasan mendalam tentang mekanika kuantum aplikatif untuk kelas XII IPA.</p>
<!-- Quick Stats -->
<div class="flex items-center gap-md mb-md p-sm bg-surface-container-low rounded-lg">
<div class="flex items-center gap-xs text-on-surface-variant">
<span class="material-symbols-outlined text-[18px]">group</span>
<span class="font-label-md text-label-md">32 Siswa</span>
</div>
<div class="w-px h-4 bg-outline-variant"></div>
<div class="flex items-center gap-xs text-on-surface-variant">
<span class="material-symbols-outlined text-[18px]">menu_book</span>
<span class="font-label-md text-label-md">14 Modul</span>
</div>
</div>
<!-- Actions -->
<div class="flex gap-sm mt-auto pt-sm border-t border-outline-variant/50">
<button class="flex-1 bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-label-md py-sm rounded-lg transition-colors text-center border border-primary/20">
                                Kelola Kelas
                            </button>
<button class="flex-1 bg-primary text-on-primary font-label-md text-label-md py-sm rounded-lg hover:shadow-md transition-shadow text-center">
                                Lihat Materi
                            </button>
</div>
</div>
</div>
<!-- Course Card 2 -->
<div class="bg-surface rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-surface-container-highest overflow-hidden flex flex-col group hover:-translate-y-1 transition-transform duration-300">
<div class="h-32 w-full relative">
<img class="w-full h-full object-cover" data-alt="A modern, sleek digital illustration representing computer science and coding. Glowing binary codes, circuit board patterns in deep indigo and bright cyan, glassmorphic UI elements floating. High-tech academic style." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmL2SmVd2h4EjZbfKZYFm1N8HQHYXbZ9JsmOJghNyL7pghp94W2sTt3Y976YGPrS4mT8-Nwb9o6hkegGAkCBCTsNEsjI48y9UKYjvwYdDA8ehlkZzkTg3-BgNwwFaoZ_fw89tnZZeKCotY27mOBdugpKefIES1gxVlqINck6qtkjnNyM9JgbgOcnGEcytn2z1mx-ID1_gD2LHOvkQ2Y-SfTel3Cygwxqe_ncybCLkLwDt4pL18kHwWfw"/>
<div class="absolute inset-0 bg-gradient-to-t from-surface to-transparent"></div>
<div class="absolute bottom-sm left-md px-sm py-xs bg-surface/80 backdrop-blur-md rounded-md border border-white/20 font-label-sm text-label-sm text-on-surface">
                            Ilmu Komputer
                        </div>
</div>
<div class="p-md flex-1 flex flex-col">
<h3 class="font-title-lg text-title-lg text-on-surface mb-xs group-hover:text-primary transition-colors">Algoritma &amp; Struktur Data</h3>
<p class="font-body-sm text-body-sm text-on-surface-variant mb-md flex-1">Konsep dasar pemrograman berorientasi objek dan manipulasi data.</p>
<div class="flex items-center gap-md mb-md p-sm bg-surface-container-low rounded-lg">
<div class="flex items-center gap-xs text-on-surface-variant">
<span class="material-symbols-outlined text-[18px]">group</span>
<span class="font-label-md text-label-md">45 Siswa</span>
</div>
<div class="w-px h-4 bg-outline-variant"></div>
<div class="flex items-center gap-xs text-on-surface-variant">
<span class="material-symbols-outlined text-[18px]">menu_book</span>
<span class="font-label-md text-label-md">20 Modul</span>
</div>
</div>
<div class="flex gap-sm mt-auto pt-sm border-t border-outline-variant/50">
<button class="flex-1 bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-label-md py-sm rounded-lg transition-colors text-center border border-primary/20">
                                Kelola Kelas
                            </button>
<button class="flex-1 bg-primary text-on-primary font-label-md text-label-md py-sm rounded-lg hover:shadow-md transition-shadow text-center">
                                Lihat Materi
                            </button>
</div>
</div>
</div>
<!-- Course Card 3 -->
<div class="bg-surface rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-surface-container-highest overflow-hidden flex flex-col group hover:-translate-y-1 transition-transform duration-300">
<div class="h-32 w-full relative">
<img class="w-full h-full object-cover" data-alt="A clean, sophisticated illustration representing literature and history. Ancient scrolls morphing into modern digital tablets, soft warm lighting contrasting with corporate indigo hues, elegant typography floating in the background." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSMOEF8mIlb2X1kV47CjSu2DS6WwPsZlcCmmaU3I0TYLOxff-PKdPkK4aC8Qq4qW8O9woeofEUSUVLEF5rV8PivjmhiTIxIn_Soo3sDw1IH-ob6xl6Ne_JbCiFcLnp45DWScYSw5kVVpRGtDsWYVo1plzE-iHUZ2Coj5wVkwbSg6I4u88qgINUBH8UBtUL7eBzkQDlljrebamw9E3ZhY6Ur5NqCie4cL6MEvCNwt_MPA1gSpHMHj3oDg"/>
<div class="absolute inset-0 bg-gradient-to-t from-surface to-transparent"></div>
<div class="absolute bottom-sm left-md px-sm py-xs bg-surface/80 backdrop-blur-md rounded-md border border-white/20 font-label-sm text-label-sm text-on-surface">
                            Sejarah Dunia
                        </div>
</div>
<div class="p-md flex-1 flex flex-col">
<h3 class="font-title-lg text-title-lg text-on-surface mb-xs group-hover:text-primary transition-colors">Peradaban Modern XI</h3>
<p class="font-body-sm text-body-sm text-on-surface-variant mb-md flex-1">Analisis perkembangan sosial politik era industri hingga pasca-perang dingin.</p>
<div class="flex items-center gap-md mb-md p-sm bg-surface-container-low rounded-lg">
<div class="flex items-center gap-xs text-on-surface-variant">
<span class="material-symbols-outlined text-[18px]">group</span>
<span class="font-label-md text-label-md">28 Siswa</span>
</div>
<div class="w-px h-4 bg-outline-variant"></div>
<div class="flex items-center gap-xs text-on-surface-variant">
<span class="material-symbols-outlined text-[18px]">menu_book</span>
<span class="font-label-md text-label-md">10 Modul</span>
</div>
</div>
<div class="flex gap-sm mt-auto pt-sm border-t border-outline-variant/50">
<button class="flex-1 bg-surface-container hover:bg-surface-container-high text-primary font-label-md text-label-md py-sm rounded-lg transition-colors text-center border border-primary/20">
                                Kelola Kelas
                            </button>
<button class="flex-1 bg-primary text-on-primary font-label-md text-label-md py-sm rounded-lg hover:shadow-md transition-shadow text-center">
                                Lihat Materi
                            </button>
</div>
</div>
</div>
</div>
</main>
</div>
</body></html>

<!-- Materi - Guru -->
<!DOCTYPE html>

<html lang="id"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>KSI-ON LMS - Materi Pembelajaran</title>
<!-- Material Symbols -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700;800&amp;family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "primary": "#3525cd",
                        "secondary-fixed-dim": "#89ceff",
                        "outline-variant": "#c7c4d8",
                        "on-surface": "#0b1c30",
                        "inverse-on-surface": "#eaf1ff",
                        "surface-bright": "#f8f9ff",
                        "on-tertiary-container": "#ffd0d2",
                        "outline": "#777587",
                        "tertiary": "#95002b",
                        "secondary-fixed": "#c9e6ff",
                        "on-background": "#0b1c30",
                        "inverse-surface": "#213145",
                        "error-container": "#ffdad6",
                        "on-secondary-container": "#004666",
                        "tertiary-fixed-dim": "#ffb2b7",
                        "on-tertiary-fixed-variant": "#92002a",
                        "on-error-container": "#93000a",
                        "inverse-primary": "#c3c0ff",
                        "on-primary-fixed": "#0f0069",
                        "error": "#ba1a1a",
                        "surface-variant": "#d3e4fe",
                        "secondary-container": "#39b8fd",
                        "surface-container": "#e5eeff",
                        "surface": "#f8f9ff",
                        "on-secondary-fixed-variant": "#004c6e",
                        "on-primary-container": "#dad7ff",
                        "on-primary-fixed-variant": "#3323cc",
                        "on-error": "#ffffff",
                        "on-surface-variant": "#464555",
                        "background": "#f8f9ff",
                        "tertiary-container": "#bf0f3c",
                        "on-tertiary": "#ffffff",
                        "surface-tint": "#4d44e3",
                        "primary-fixed": "#e2dfff",
                        "on-secondary-fixed": "#001e2f",
                        "tertiary-fixed": "#ffdadb",
                        "surface-container-high": "#dce9ff",
                        "surface-container-low": "#eff4ff",
                        "surface-container-highest": "#d3e4fe",
                        "on-tertiary-fixed": "#40000d",
                        "secondary": "#006591",
                        "primary-container": "#4f46e5",
                        "primary-fixed-dim": "#c3c0ff",
                        "on-secondary": "#ffffff",
                        "surface-dim": "#cbdbf5",
                        "on-primary": "#ffffff",
                        "surface-container-lowest": "#ffffff"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "base": "4px",
                        "sidebar-width": "280px",
                        "md": "16px",
                        "gutter": "24px",
                        "lg": "24px",
                        "margin-mobile": "16px",
                        "2xl": "48px",
                        "margin-desktop": "32px",
                        "xs": "8px",
                        "xl": "32px",
                        "sm": "12px"
                    },
                    "fontFamily": {
                        "label-md": ["Inter"],
                        "label-sm": ["Inter"],
                        "body-sm": ["Inter"],
                        "headline-md": ["Hanken Grotesk"],
                        "headline-lg": ["Hanken Grotesk"],
                        "display-lg": ["Hanken Grotesk"],
                        "body-lg": ["Inter"],
                        "body-md": ["Inter"],
                        "title-md": ["Inter"],
                        "title-lg": ["Inter"]
                    },
                    "fontSize": {
                        "label-md": ["14px", { "lineHeight": "20px", "letterSpacing": "0.01em", "fontWeight": "500" }],
                        "label-sm": ["12px", { "lineHeight": "16px", "fontWeight": "600" }],
                        "body-sm": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
                        "headline-md": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
                        "headline-lg": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "600" }],
                        "display-lg": ["48px", { "lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
                        "body-lg": ["18px", { "lineHeight": "28px", "fontWeight": "400" }],
                        "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
                        "title-md": ["16px", { "lineHeight": "24px", "fontWeight": "600" }],
                        "title-lg": ["20px", { "lineHeight": "28px", "fontWeight": "600" }]
                    }
                }
            }
        }
    </script>
<style>
        /* Hide scrollbar for clean aesthetic */
        ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        ::-webkit-scrollbar-track {
            background: transparent;
        }
        ::-webkit-scrollbar-thumb {
            background: #c7c4d8;
            border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #777587;
        }
        
        .glass-panel {
            background: rgba(255, 255, 255, 0.6);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(199, 196, 216, 0.5);
        }
    </style>
</head>
<body class="bg-background text-on-background font-body-md h-screen flex overflow-hidden selection:bg-primary selection:text-on-primary">
<!-- SideNavBar (Shared Component) -->
<aside class="w-sidebar-width h-screen fixed left-0 top-0 bg-surface dark:bg-on-background shadow-[0px_4px_20px_rgba(0,0,0,0.05)] flex flex-col border-r border-outline-variant z-50 transition-all duration-200 ease-in-out hidden md:flex">
<!-- Header -->
<div class="p-lg border-b border-outline-variant flex items-center gap-md">
<div class="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-sm">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">school</span>
</div>
<div>
<h1 class="font-headline-md text-headline-md font-extrabold text-primary">KSI-ON LMS</h1>
<p class="font-label-sm text-label-sm text-on-surface-variant">Academic Excellence</p>
</div>
</div>
<!-- Navigation Tabs -->
<nav class="flex-1 overflow-y-auto py-md flex flex-col gap-xs px-xs">
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md font-label-md text-label-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out rounded-r-full" href="#">
<span class="material-symbols-outlined">dashboard</span>
                Dashboard
            </a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md font-label-md text-label-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out rounded-r-full" href="#">
<span class="material-symbols-outlined">group</span>
                Users
            </a>
<!-- Active Tab: Courses (Semantically mapped for Materials) -->
<a class="bg-primary/10 text-primary border-l-4 border-primary rounded-r-full py-md px-lg transition-all font-label-md text-label-md flex items-center gap-md relative" href="#">
<span class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/4 bg-primary rounded-r-full"></span>
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">school</span>
                Courses
            </a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md font-label-md text-label-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out rounded-r-full" href="#">
<span class="material-symbols-outlined">quiz</span>
                Exams
            </a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md font-label-md text-label-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out rounded-r-full" href="#">
<span class="material-symbols-outlined">campaign</span>
                Announcements
            </a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md font-label-md text-label-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out rounded-r-full" href="#">
<span class="material-symbols-outlined">pending_actions</span>
                Activities
            </a>
<div class="my-xs mx-lg border-t border-outline-variant/50"></div>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md font-label-md text-label-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out rounded-r-full" href="#">
<span class="material-symbols-outlined">settings</span>
                Settings
            </a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md font-label-md text-label-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out rounded-r-full" href="#">
<span class="material-symbols-outlined">class</span>
                Class Data
            </a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md font-label-md text-label-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out rounded-r-full" href="#">
<span class="material-symbols-outlined">person_4</span>
                Teacher Data
            </a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md font-label-md text-label-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out rounded-r-full" href="#">
<span class="material-symbols-outlined">person</span>
                Student Data
            </a>
<div class="my-xs mx-lg border-t border-outline-variant/50"></div>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md font-label-md text-label-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out rounded-r-full" href="#">
<span class="material-symbols-outlined">fact_check</span>
                Attendance
            </a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md font-label-md text-label-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out rounded-r-full" href="#">
<span class="material-symbols-outlined">analytics</span>
                Evaluations
            </a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md font-label-md text-label-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out rounded-r-full" href="#">
<span class="material-symbols-outlined">assessment</span>
                Reports
            </a>
<a class="text-on-surface-variant py-md px-lg flex items-center gap-md font-label-md text-label-md hover:bg-surface-container-low hover:text-primary transition-all duration-200 ease-in-out rounded-r-full" href="#">
<span class="material-symbols-outlined">account_circle</span>
                Profile
            </a>
</nav>
<!-- Footer -->
<div class="p-md border-t border-outline-variant">
<button class="w-full bg-surface-container-low text-primary border border-primary/20 hover:bg-primary hover:text-on-primary transition-colors py-sm px-md rounded-lg font-label-md text-label-md flex justify-center items-center gap-xs">
<span class="material-symbols-outlined text-[18px]">help</span>
                Help Desk
            </button>
<a class="mt-xs text-on-surface-variant py-sm px-lg flex items-center gap-md font-label-md text-label-md hover:bg-error-container hover:text-error transition-all duration-200 ease-in-out rounded-lg w-full" href="#">
<span class="material-symbols-outlined">logout</span>
                Logout
            </a>
</div>
</aside>
<!-- Main Content Area -->
<main class="flex-1 flex flex-col md:ml-[280px] h-screen overflow-hidden relative">
<!-- TopNavBar (Shared Component) -->
<header class="flex justify-between items-center px-lg py-xs w-full z-40 bg-surface/70 dark:bg-on-background/70 backdrop-blur-md shadow-sm border-b border-outline-variant dark:border-outline font-body-md text-body-md full-width top-0 sticky">
<div class="flex items-center gap-md w-1/3">
<!-- Search Bar -->
<div class="relative w-full max-w-sm hidden sm:block">
<span class="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
<input class="w-full bg-surface-container-lowest border border-outline-variant rounded-full py-xs pl-[40px] pr-md text-body-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Cari materi..." type="text"/>
</div>
</div>
<div class="flex items-center gap-sm">
<button class="p-xs text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-full cursor-pointer active:scale-95 flex items-center justify-center">
<span class="material-symbols-outlined">notifications</span>
</button>
<button class="p-xs text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-full cursor-pointer active:scale-95 flex items-center justify-center">
<span class="material-symbols-outlined">help</span>
</button>
<div class="h-6 w-px bg-outline-variant mx-xs"></div>
<div class="flex items-center gap-sm cursor-pointer hover:bg-surface-container-high transition-colors p-xs rounded-lg active:scale-95">
<img alt="User profile" class="w-8 h-8 rounded-full object-cover border border-outline-variant" data-alt="A professional headshot of a teacher in a bright, modern classroom setting, wearing smart casual attire. Soft natural light, high-key photography style. Corporate modern aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDiRRqu87SElyefW0bot3XDclTUNL5LBq2U_X1nSUdJRTKcBh0RyIhDi-1kZVf1GLDqwZnLS7_n4LQpyDN90pBFrgY6MJh0tpmk02hYrwR75sfb-YjvdXotMwlBH-BZRSo_rDO5akx28i4y1i9HZtoWNCpDzVDVmgMa8h1It-7cww8davIAEXIZGi0x_jRX4309qRETOCcr-GMNFuwGNEXGg1Jboebid73Cslult6jyLT-vLS32_hA4zg"/>
<div class="hidden md:block text-left">
<p class="font-label-sm text-label-sm text-on-surface leading-tight">Budi Santoso</p>
<p class="text-[10px] text-on-surface-variant leading-tight">Guru Matematika</p>
</div>
<span class="material-symbols-outlined text-on-surface-variant text-[18px]">expand_more</span>
</div>
</div>
</header>
<!-- Page Canvas -->
<div class="flex-1 overflow-y-auto p-md lg:p-margin-desktop scroll-smooth">
<div class="max-w-[1400px] mx-auto flex flex-col gap-lg">
<!-- Page Header & Actions -->
<div class="flex flex-col sm:flex-row sm:items-end justify-between gap-md">
<div>
<h2 class="font-display-lg text-headline-lg lg:text-display-lg font-bold text-on-surface tracking-tight">Pusat Materi</h2>
<p class="font-body-md text-body-md text-on-surface-variant mt-xs max-w-2xl">Kelola, unggah, dan bagikan sumber belajar untuk murid. Semua file dan tautan tersimpan aman di satu tempat.</p>
</div>
<button class="bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md py-sm px-lg rounded-xl flex items-center justify-center gap-xs shadow-[0_4px_14px_0_rgba(53,37,205,0.39)] hover:shadow-[0_6px_20px_rgba(53,37,205,0.23)] hover:-translate-y-0.5 transition-all duration-200">
<span class="material-symbols-outlined text-[20px]">upload_file</span>
                        Unggah Materi Baru
                    </button>
</div>
<!-- Glassmorphic Filter Bar -->
<div class="glass-panel rounded-xl p-sm flex flex-wrap items-center gap-sm z-10 relative shadow-sm">
<div class="flex items-center gap-xs bg-surface-container-lowest px-sm py-xs rounded-lg border border-outline-variant/50">
<span class="material-symbols-outlined text-on-surface-variant text-[18px]">filter_list</span>
<span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Filter:</span>
</div>
<select class="bg-surface-container-lowest border-none rounded-lg text-body-sm font-body-sm py-xs pl-sm pr-lg focus:ring-0 cursor-pointer shadow-sm hover:bg-surface-container-low transition-colors">
<option>Semua Mata Pelajaran</option>
<option>Matematika</option>
<option>Fisika</option>
<option>Biologi</option>
</select>
<select class="bg-surface-container-lowest border-none rounded-lg text-body-sm font-body-sm py-xs pl-sm pr-lg focus:ring-0 cursor-pointer shadow-sm hover:bg-surface-container-low transition-colors">
<option>Semua Kelas</option>
<option>Kelas 10A</option>
<option>Kelas 10B</option>
<option>Kelas 11A</option>
</select>
<div class="h-6 w-px bg-outline-variant mx-xs hidden sm:block"></div>
<!-- Type Toggles -->
<div class="flex bg-surface-container-lowest rounded-lg shadow-sm overflow-hidden border border-outline-variant/30">
<button class="px-md py-xs bg-primary/10 text-primary font-label-sm text-label-sm flex items-center gap-xs border-r border-outline-variant/30 transition-colors">
<span class="material-symbols-outlined text-[16px]">grid_view</span> Semua
                        </button>
<button class="px-md py-xs text-on-surface-variant hover:bg-surface-container-low font-label-sm text-label-sm flex items-center gap-xs border-r border-outline-variant/30 transition-colors">
<span class="material-symbols-outlined text-[16px]">picture_as_pdf</span> PDF
                        </button>
<button class="px-md py-xs text-on-surface-variant hover:bg-surface-container-low font-label-sm text-label-sm flex items-center gap-xs transition-colors">
<span class="material-symbols-outlined text-[16px]">play_circle</span> Video
                        </button>
</div>
</div>
<!-- Content Grid (Bento Style) -->
<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md lg:gap-lg">
<!-- Card 1: PDF -->
<div class="bg-surface-container-lowest rounded-xl p-lg shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/40 flex flex-col hover:-translate-y-1 hover:shadow-[0px_10px_30px_rgba(0,0,0,0.08)] transition-all duration-300 group">
<div class="flex justify-between items-start mb-md">
<div class="w-12 h-12 rounded-xl bg-error-container text-error flex items-center justify-center shadow-sm">
<span class="material-symbols-outlined text-[28px]" style="font-variation-settings: 'FILL' 1;">picture_as_pdf</span>
</div>
<div class="flex gap-xs">
<div class="bg-surface-container-high px-xs py-[2px] rounded text-[10px] font-label-sm text-on-surface-variant flex items-center gap-[2px]">
<span class="material-symbols-outlined text-[12px]">visibility</span> Terlihat
                                </div>
<button class="text-outline hover:text-on-surface transition-colors p-xs rounded hover:bg-surface-container-low">
<span class="material-symbols-outlined text-[20px]">more_vert</span>
</button>
</div>
</div>
<h3 class="font-title-lg text-title-lg text-on-surface mb-xs group-hover:text-primary transition-colors line-clamp-2">Modul Aljabar Linear: Matriks &amp; Determinan</h3>
<p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mb-md">Bab 4 - Penjelasan mendetail tentang operasi matriks dasar dan aplikasinya.</p>
<div class="mt-auto pt-md border-t border-outline-variant/30 flex justify-between items-center">
<div class="flex flex-col">
<span class="font-label-sm text-label-sm text-on-surface">Matematika Wajib</span>
<span class="text-[11px] text-outline">Kelas 10A, 10B • 2.4 MB</span>
</div>
<button class="w-8 h-8 rounded-full bg-surface-container-low text-primary flex items-center justify-center hover:bg-primary hover:text-on-primary transition-colors">
<span class="material-symbols-outlined text-[18px]">download</span>
</button>
</div>
</div>
<!-- Card 2: Video -->
<div class="bg-surface-container-lowest rounded-xl p-lg shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/40 flex flex-col hover:-translate-y-1 hover:shadow-[0px_10px_30px_rgba(0,0,0,0.08)] transition-all duration-300 group">
<div class="flex justify-between items-start mb-md">
<div class="w-12 h-12 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-sm relative overflow-hidden">
<div class="absolute inset-0 bg-secondary opacity-10"></div>
<span class="material-symbols-outlined text-[28px]" style="font-variation-settings: 'FILL' 1;">play_circle</span>
</div>
<div class="flex gap-xs">
<div class="bg-tertiary-container/10 px-xs py-[2px] rounded text-[10px] font-label-sm text-tertiary flex items-center gap-[2px]">
<span class="material-symbols-outlined text-[12px]">visibility_off</span> Disembunyikan
                                </div>
<button class="text-outline hover:text-on-surface transition-colors p-xs rounded hover:bg-surface-container-low">
<span class="material-symbols-outlined text-[20px]">more_vert</span>
</button>
</div>
</div>
<h3 class="font-title-lg text-title-lg text-on-surface mb-xs group-hover:text-primary transition-colors line-clamp-2">Rekaman Sesi: Pembahasan Soal UTS</h3>
<p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mb-md">Review soal-soal tersulit dari Ujian Tengah Semester minggu lalu.</p>
<div class="mt-auto pt-md border-t border-outline-variant/30 flex justify-between items-center">
<div class="flex flex-col">
<span class="font-label-sm text-label-sm text-on-surface">Fisika Dasar</span>
<span class="text-[11px] text-outline">Kelas 11A • 45 Menit</span>
</div>
<button class="w-8 h-8 rounded-full bg-surface-container-low text-primary flex items-center justify-center hover:bg-primary hover:text-on-primary transition-colors">
<span class="material-symbols-outlined text-[18px]">play_arrow</span>
</button>
</div>
</div>
<!-- Card 3: Link -->
<div class="bg-surface-container-lowest rounded-xl p-lg shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-outline-variant/40 flex flex-col hover:-translate-y-1 hover:shadow-[0px_10px_30px_rgba(0,0,0,0.08)] transition-all duration-300 group">
<div class="flex justify-between items-start mb-md">
<div class="w-12 h-12 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shadow-sm">
<span class="material-symbols-outlined text-[28px]" style="font-variation-settings: 'FILL' 1;">link</span>
</div>
<div class="flex gap-xs">
<div class="bg-surface-container-high px-xs py-[2px] rounded text-[10px] font-label-sm text-on-surface-variant flex items-center gap-[2px]">
<span class="material-symbols-outlined text-[12px]">visibility</span> Terlihat
                                </div>
<button class="text-outline hover:text-on-surface transition-colors p-xs rounded hover:bg-surface-container-low">
<span class="material-symbols-outlined text-[20px]">more_vert</span>
</button>
</div>
</div>
<h3 class="font-title-lg text-title-lg text-on-surface mb-xs group-hover:text-primary transition-colors line-clamp-2">Jurnal: Struktur Anatomi Daun Monokotil</h3>
<p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mb-md">Referensi eksternal untuk tugas praktikum biologi minggu depan.</p>
<div class="mt-auto pt-md border-t border-outline-variant/30 flex justify-between items-center">
<div class="flex flex-col">
<span class="font-label-sm text-label-sm text-on-surface">Biologi</span>
<span class="text-[11px] text-outline">Semua Kelas • Google Scholar</span>
</div>
<button class="w-8 h-8 rounded-full bg-surface-container-low text-primary flex items-center justify-center hover:bg-primary hover:text-on-primary transition-colors">
<span class="material-symbols-outlined text-[18px]">open_in_new</span>
</button>
</div>
</div>
<!-- Empty State / Add New Card (Bento Filler) -->
<div class="bg-surface-container-lowest/50 rounded-xl p-lg border-2 border-dashed border-outline-variant/50 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-surface-container-lowest hover:border-primary/50 hover:shadow-sm transition-all duration-300 min-h-[220px]">
<div class="w-12 h-12 rounded-full bg-surface-container-highest text-outline flex items-center justify-center mb-sm group-hover:bg-primary/10 group-hover:text-primary transition-colors">
<span class="material-symbols-outlined text-[24px]">add</span>
</div>
<h3 class="font-title-md text-title-md text-on-surface mb-xs">Tambah Materi Lain</h3>
<p class="font-body-sm text-body-sm text-on-surface-variant max-w-[200px]">Seret dan lepas file di sini atau klik untuk browse.</p>
</div>
</div>
<!-- Bottom spacing for scroll -->
<div class="h-xl"></div>
</div>
</div>
</main>
</body></html>
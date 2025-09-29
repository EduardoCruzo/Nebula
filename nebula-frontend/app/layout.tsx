import "./globals.css";
import type { ReactNode } from "react";
import WalletConnect from "@/components/WalletConnect";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <title>NebulaVote - 奢华隐私投票平台</title>
      </head>
      <body className="min-h-screen text-white relative overflow-x-hidden">
        {/* 浮动装饰球体 */}
        <div className="floating-orb w-64 h-64 luxury-gradient-1 -top-32 -left-32" style={{animationDelay: '0s'}}></div>
        <div className="floating-orb w-48 h-48 luxury-gradient-2 -top-24 right-1/4" style={{animationDelay: '5s'}}></div>
        <div className="floating-orb w-32 h-32 luxury-gradient-3 top-1/2 -right-16" style={{animationDelay: '10s'}}></div>
        <div className="floating-orb w-40 h-40 luxury-gradient-4 bottom-1/4 -left-20" style={{animationDelay: '15s'}}></div>
        
        <div className="relative z-10">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <header className="flex items-center justify-between mb-16 animate-fade-in">
              <div className="text-4xl font-bold tracking-wider">
                <span className="text-gradient">Nebula</span>
                <span className="text-white ml-1">Vote</span>
                <div className="w-full h-1 luxury-gradient-1 rounded-full mt-2 animate-pulse-glow"></div>
              </div>
              
              <div className="flex items-center gap-8">
                <nav className="flex space-x-8 text-lg font-medium">
                  <a className="text-white/80 hover:text-white transition-all duration-300 hover:scale-110 relative group" href="/create">
                    <span>创建</span>
                    <div className="absolute -bottom-1 left-0 w-0 h-0.5 luxury-gradient-1 group-hover:w-full transition-all duration-300"></div>
                  </a>
                  <a className="text-white/80 hover:text-white transition-all duration-300 hover:scale-110 relative group" href="/topics">
                    <span>议题</span>
                    <div className="absolute -bottom-1 left-0 w-0 h-0.5 luxury-gradient-2 group-hover:w-full transition-all duration-300"></div>
                  </a>
                  <a className="text-white/80 hover:text-white transition-all duration-300 hover:scale-110 relative group" href="/analytics">
                    <span>分析</span>
                    <div className="absolute -bottom-1 left-0 w-0 h-0.5 luxury-gradient-3 group-hover:w-full transition-all duration-300"></div>
                  </a>
                </nav>
                
                <WalletConnect />
              </div>
            </header>
            
            <main className="min-h-[80vh]">
              {children}
            </main>
            
            <footer className="mt-20 text-center animate-fade-in">
              <div className="inline-flex items-center space-x-4 px-8 py-4 rounded-full backdrop-blur-xl border border-white/10">
                <div className="w-3 h-3 rounded-full luxury-gradient-1 animate-pulse"></div>
                <span className="text-white/60 font-medium">FHEVM 隐私投票</span>
                <div className="w-1 h-1 rounded-full bg-white/30"></div>
                <span className="text-gradient font-bold">Nebula 系列</span>
                <div className="w-3 h-3 rounded-full luxury-gradient-2 animate-pulse"></div>
              </div>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}



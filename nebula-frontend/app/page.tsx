"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [stats, setStats] = useState({
    totalTopics: 0,
    activeTopics: 0,
    totalVotes: 0,
    isLoading: true
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setStats({
        totalTopics: 28,
        activeTopics: 7,
        totalVotes: 1247,
        isLoading: false
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const features = [
    {
      icon: "🚀",
      title: "极速体验",
      description: "毫秒级响应，丝滑交互体验",
      gradient: "luxury-gradient-1",
      delay: "0s"
    },
    {
      icon: "🔒",
      title: "绝对隐私",
      description: "FHEVM 同态加密，无人可窥探",
      gradient: "luxury-gradient-2",
      delay: "0.2s"
    },
    {
      icon: "✨",
      title: "完全透明",
      description: "区块链验证，结果可信可查",
      gradient: "luxury-gradient-3",
      delay: "0.4s"
    },
    {
      icon: "🌐",
      title: "去中心化",
      description: "无需信任中心，永久可用",
      gradient: "luxury-gradient-4",
      delay: "0.6s"
    },
    {
      icon: "⚡",
      title: "实时计票",
      description: "同态聚合，实时更新结果",
      gradient: "luxury-gradient-5",
      delay: "0.8s"
    },
    {
      icon: "🛡️",
      title: "抗审查",
      description: "分布式部署，无法被关闭",
      gradient: "luxury-gradient-1",
      delay: "1s"
    }
  ];

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="text-center space-y-12 animate-fade-in">
        <div className="space-y-8">
          <h1 className="text-7xl md:text-8xl font-black leading-tight">
            <div className="text-gradient mb-4">Nebula</div>
            <div className="text-white">Vote</div>
          </h1>
          <p className="text-2xl md:text-3xl text-white/80 max-w-4xl mx-auto leading-relaxed font-light">
            奢华体验的隐私投票平台
          </p>
          <p className="text-lg text-white/60 max-w-3xl mx-auto leading-relaxed">
            基于 FHEVM 同态加密技术，结合 Relayer 解密服务，为您提供前所未有的隐私保护与用户体验
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-8">
          <Link href="/create" className="btn-primary text-xl px-12 py-6 animate-pulse-glow">
            🚀 立即创建议题
          </Link>
          <Link href="/topics" className="btn-outline text-xl px-12 py-6">
            🗳️ 参与投票
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-slide-in-left">
        {[
          { label: "总议题数", value: stats.totalTopics, gradient: "luxury-gradient-1", icon: "📊" },
          { label: "活跃议题", value: stats.activeTopics, gradient: "luxury-gradient-2", icon: "🔥" },
          { label: "总投票数", value: stats.totalVotes, gradient: "luxury-gradient-3", icon: "🗳️" }
        ].map((stat, index) => (
          <div key={index} className="card text-center group">
            <div className="text-5xl mb-4">{stat.icon}</div>
            <div className="text-5xl font-bold mb-4">
              {stats.isLoading ? (
                <div className="animate-pulse">
                  <div className="h-12 bg-white/20 rounded-xl mx-auto w-24"></div>
                </div>
              ) : (
                <span className="text-gradient">{stat.value.toLocaleString()}</span>
              )}
            </div>
            <div className="text-xl font-semibold text-white mb-2">{stat.label}</div>
            <div className={`h-1 w-full ${stat.gradient} rounded-full group-hover:animate-pulse`}></div>
          </div>
        ))}
      </section>

      {/* Features Section */}
      <section className="space-y-12">
        <div className="text-center space-y-6 animate-fade-in">
          <h2 className="text-5xl font-bold text-gradient">核心特性</h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            融合最新区块链技术与密码学创新，打造极致安全与奢华体验
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card group animate-fade-in"
              style={{ animationDelay: feature.delay }}
            >
              <div className="text-center space-y-6">
                <div className={`w-20 h-20 ${feature.gradient} rounded-3xl flex items-center justify-center text-3xl mx-auto transform group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-white">{feature.title}</h3>
                <p className="text-white/70 leading-relaxed">{feature.description}</p>
                <div className={`h-1 w-full ${feature.gradient} rounded-full opacity-50 group-hover:opacity-100 transition-opacity`}></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Technology Showcase */}
      <section className="card text-center space-y-8 animate-slide-in-right">
        <h3 className="text-3xl font-bold text-gradient">技术架构</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { name: "FHEVM", color: "luxury-gradient-1" },
            { name: "Ethereum", color: "luxury-gradient-2" },
            { name: "Sepolia", color: "luxury-gradient-3" },
            { name: "Next.js", color: "luxury-gradient-4" }
          ].map((tech, index) => (
            <div key={index} className="group">
              <div className={`w-16 h-16 ${tech.color} rounded-2xl mx-auto mb-4 transform group-hover:scale-110 transition-transform duration-300`}></div>
              <div className="text-white font-semibold">{tech.name}</div>
            </div>
          ))}
        </div>
        <div className="pt-6 border-t border-white/10">
          <p className="text-white/60 text-sm">
            合约地址: <span className="text-gradient font-mono">0x769bD81246E65e9B05f0e9c28A5c1c790c1A1D4D</span>
          </p>
        </div>
      </section>
    </div>
  );
}



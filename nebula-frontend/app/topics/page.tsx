"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { NebulaVoteHubABI } from "@/abi/NebulaVoteHubABI";
import { NebulaVoteHubAddresses } from "@/abi/NebulaVoteHubAddresses";

type Item = { id: number; title: string; status: string };

export default function TopicsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [chainId] = useState(11155111);

  const contractAddr = useMemo(() => {
    const m = NebulaVoteHubAddresses[String(chainId) as keyof typeof NebulaVoteHubAddresses];
    return (m?.address || "0x0000000000000000000000000000000000000000") as `0x${string}`;
  }, [chainId]);

  useEffect(() => {
    async function run() {
      try {
        const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
        const c = new ethers.Contract(contractAddr, NebulaVoteHubABI.abi, provider);
        const total: bigint = await c.motionsCount();
        const list: Item[] = [];
        for (let i = 1n; i <= total; i++) {
          try {
            const [title, , , openAt, closeAt, finalized] = await c.readMotion(i);
            const now = Math.floor(Date.now() / 1000);
            let status = "进行中";
            if (finalized) status = "已发布";
            else if (Number(openAt) > now) status = "未开始";
            else if (Number(closeAt) < now) status = "已结束";
            list.push({ id: Number(i), title, status });
          } catch {}
        }
        setItems(list);
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [contractAddr]);

  const filteredItems = items.filter(item => {
    if (filter === "all") return true;
    return item.status === filter;
  });

  const statusConfig = {
    "未开始": { color: "bg-blue-500/20 border-blue-500/30 text-blue-400", icon: "⏳" },
    "进行中": { color: "bg-green-500/20 border-green-500/30 text-green-400", icon: "🔥" },
    "已结束": { color: "bg-yellow-500/20 border-yellow-500/30 text-yellow-400", icon: "⏰" },
    "已发布": { color: "bg-purple-500/20 border-purple-500/30 text-purple-400", icon: "✅" }
  };

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold text-gradient">投票议题</h1>
        <p className="text-xl text-white/70 max-w-3xl mx-auto">
          浏览所有投票议题，参与民主决策过程
        </p>
        <div className="w-32 h-1 luxury-gradient-2 rounded-full mx-auto animate-pulse-glow"></div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        {[
          { key: "all", label: "全部", icon: "🌟" },
          { key: "未开始", label: "未开始", icon: "⏳" },
          { key: "进行中", label: "进行中", icon: "🔥" },
          { key: "已结束", label: "已结束", icon: "⏰" },
          { key: "已发布", label: "已发布", icon: "✅" }
        ].map((f) => (
          <button
            key={f.key}
            className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 ${
              filter === f.key
                ? "luxury-gradient-1 text-white shadow-2xl scale-105"
                : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
            }`}
            onClick={() => setFilter(f.key)}
          >
            {f.icon} {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto">
        {loading ? (
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="h-6 bg-white/20 rounded-lg w-3/4"></div>
                    <div className="h-4 bg-white/10 rounded-lg w-1/2"></div>
                  </div>
                  <div className="h-12 w-12 bg-white/10 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredItems.map((item, index) => (
              <Link 
                key={item.id} 
                href={`/topics/detail?id=${item.id}`} 
                className="card-hover group animate-slide-in-left"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-3 flex-1">
                    <h3 className="text-2xl font-bold text-white group-hover:text-gradient transition-all duration-300">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-2 rounded-xl border font-medium text-sm ${statusConfig[item.status as keyof typeof statusConfig]?.color}`}>
                        {statusConfig[item.status as keyof typeof statusConfig]?.icon} {item.status}
                      </span>
                      <span className="text-white/50 text-sm">议题 #{item.id}</span>
                    </div>
                  </div>
                  <div className="w-16 h-16 luxury-gradient-3 rounded-2xl flex items-center justify-center text-2xl transform group-hover:scale-110 transition-transform duration-300">
                    🗳️
                  </div>
                </div>
              </Link>
            ))}

            {filteredItems.length === 0 && !loading && (
              <div className="card text-center py-16">
                <div className="text-6xl mb-6">🤔</div>
                <h3 className="text-2xl font-bold text-white/70 mb-4">暂无议题</h3>
                <p className="text-white/50 mb-8">
                  {filter === "all" ? "还没有任何议题" : `没有${filter}的议题`}
                </p>
                <Link href="/create" className="btn-primary">
                  🚀 创建第一个议题
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
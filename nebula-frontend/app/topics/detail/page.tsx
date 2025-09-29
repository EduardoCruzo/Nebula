"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ethers } from "ethers";
import { NebulaVoteHubABI } from "@/abi/NebulaVoteHubABI";
import { NebulaVoteHubAddresses } from "@/abi/NebulaVoteHubAddresses";
import { encryptOneHot } from "@/fhevm/adapter";

function TopicDetailInner() {
  const search = useSearchParams();
  const id = Number(search.get("id") || 0);
  const [info, setInfo] = useState<any>(null);
  const [sel, setSel] = useState<number>(0);
  const [status, setStatus] = useState<string>("");
  const [isVoting, setIsVoting] = useState(false);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [chainId, setChainId] = useState<number>(11155111);

  const contractAddr = useMemo(() => {
    const m = NebulaVoteHubAddresses[String(chainId) as keyof typeof NebulaVoteHubAddresses];
    return (m?.address || "0x0000000000000000000000000000000000000000") as `0x${string}`;
  }, [chainId]);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const p = new ethers.BrowserProvider((window as any).ethereum);
      setProvider(p);
      p.getNetwork().then((n) => setChainId(Number(n.chainId)));
    }
  }, []);

  useEffect(() => {
    async function fetchMotion() {
      try {
        const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
        const c = new ethers.Contract(contractAddr, NebulaVoteHubABI.abi, provider);
        const r = await c.readMotion(id);
        const obj = {
          title: r[0] as string,
          description: r[1] as string,
          choices: r[2] as string[],
          openAt: Number(r[3]),
          closeAt: Number(r[4]),
          finalized: Boolean(r[5]),
          curator: r[6] as string,
        };
        setInfo(obj);
      } catch (e) {}
    }
    if (id && contractAddr) fetchMotion();
  }, [id, contractAddr]);

  async function castVote() {
    if (!provider || !info) return;
    setIsVoting(true);
    setStatus("正在加密投票数据...");
    try {
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      const c = new ethers.Contract(contractAddr, NebulaVoteHubABI.abi, signer);
      const onehot = Array.from({ length: info.choices.length }, (_, i) => (i === sel ? 1 : 0));
      setStatus("正在通过 Relayer 加密...");
      const encrypted = await encryptOneHot({ contractAddress: contractAddr, userAddress: addr, onehot, chainId });
      setStatus("正在提交到区块链...");
      const tx = await c.submitShieldOneHot(id, encrypted.handles, encrypted.inputProof);
      setStatus("等待交易确认...");
      await tx.wait(1);
      setStatus("🎉 投票成功提交！");
    } catch (error: any) {
      setStatus(`❌ 投票失败: ${error.message}`);
    } finally {
      setIsVoting(false);
    }
  }

  const getTimeStatus = () => {
    if (!info) return null;
    const now = Math.floor(Date.now() / 1000);
    if (info.finalized)
      return { text: "已发布", color: "bg-purple-500/20 border-purple-500/30 text-purple-400", icon: "✅" };
    if (now < info.openAt)
      return { text: "未开始", color: "bg-blue-500/20 border-blue-500/30 text-blue-400", icon: "⏳" };
    if (now <= info.closeAt)
      return { text: "进行中", color: "bg-green-500/20 border-green-500/30 text-green-400", icon: "🔥" };
    return { text: "已结束", color: "bg-yellow-500/20 border-yellow-500/30 text-yellow-400", icon: "⏰" };
  };

  const timeStatus = getTimeStatus();
  const canVote = info && !info.finalized && Date.now() / 1000 >= info.openAt && Date.now() / 1000 <= info.closeAt;

  if (!info) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card text-center py-16">
          <div className="animate-spin w-16 h-16 luxury-gradient-1 rounded-full mx-auto mb-6"></div>
          <p className="text-white/70">加载议题信息中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in">
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center gap-4 mb-4">
          <span className="text-white/50 text-lg">议题 #{id}</span>
          {timeStatus && (
            <span className={`px-4 py-2 rounded-xl border font-medium text-sm ${timeStatus.color}`}>
              {timeStatus.icon} {timeStatus.text}
            </span>
          )}
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-gradient">{info.title}</h1>
        <p className="text-xl text-white/70 max-w-4xl mx-auto leading-relaxed">{info.description}</p>
        <div className="w-32 h-1 luxury-gradient-3 rounded-full mx-auto animate-pulse-glow"></div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="card space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-white">🗳️ 投票选项</h2>
            <p className="text-white/60">选择您的立场，所有投票都经过 FHEVM 加密保护</p>
          </div>
          <div className="grid gap-4">
            {info.choices.map((choice: string, i: number) => (
              <label key={i} className={`card-hover flex items-center gap-6 cursor-pointer transition-all duration-300 ${sel === i ? "ring-2 ring-blue-400/50 luxury-gradient-1" : ""}`}>
                <input type="radio" name="vote-option" className="w-6 h-6 accent-blue-400" checked={sel === i} onChange={() => setSel(i)} disabled={!canVote} />
                <div className="flex-1">
                  <div className="text-xl font-semibold text-white">{choice}</div>
                  <div className="text-white/50 text-sm">选项 {i + 1}</div>
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${sel === i ? "luxury-gradient-2" : "bg-white/10"}`}>
                  {sel === i ? "✓" : "○"}
                </div>
              </label>
            ))}
          </div>
          <div className="flex items-center gap-6 pt-8 border-t border-white/10 flex-col">
            {canVote ? (
              <button className={`btn-primary text-xl px-16 py-6 ${isVoting ? "opacity-50 cursor-not-allowed" : "animate-pulse-glow"}`} onClick={castVote} disabled={isVoting}>
                {isVoting ? "🔄 投票中..." : "🚀 提交投票"}
              </button>
            ) : (
              <div className="px-8 py-4 rounded-2xl bg-white/10 border border-white/20 text-white/60">
                {info.finalized ? "📊 投票已结束并发布结果" : Date.now() / 1000 < info.openAt ? "⏳ 投票尚未开始" : "⏰ 投票时间已结束"}
              </div>
            )}
            {status && (
              <div className={`px-6 py-3 rounded-xl font-medium max-w-md text-center ${status.includes("成功") ? "bg-green-500/20 border border-green-500/30 text-green-400" : status.includes("失败") ? "bg-red-500/20 border border-red-500/30 text-red-400" : "bg-blue-500/20 border border-blue-500/30 text-blue-400"}`}>
                {status}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card space-y-4">
          <h3 className="text-2xl font-bold text-gradient">📅 时间信息</h3>
          <div className="space-y-3 text-white/70">
            <div>开始时间: {new Date(info.openAt * 1000).toLocaleString('zh-CN')}</div>
            <div>结束时间: {new Date(info.closeAt * 1000).toLocaleString('zh-CN')}</div>
          </div>
        </div>
        <div className="card space-y-4">
          <h3 className="text-2xl font-bold text-gradient">👤 创建者</h3>
          <div className="text-white/70 font-mono text-sm break-all">{info.curator}</div>
        </div>
      </div>
    </div>
  );
}

export default function TopicDetail() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-400">加载中...</div>}>
      <TopicDetailInner />
    </Suspense>
  );
}



"use client";

import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { NebulaVoteHubABI } from "@/abi/NebulaVoteHubABI";
import { NebulaVoteHubAddresses } from "@/abi/NebulaVoteHubAddresses";

export default function CreatePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [choices, setChoices] = useState<string[]>(["赞成", "反对"]);
  const [openAt, setOpenAt] = useState<string>("");
  const [closeAt, setCloseAt] = useState<string>("");
  const [quota, setQuota] = useState<number>(1);
  const [status, setStatus] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [chainId, setChainId] = useState<number>(11155111);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const p = new ethers.BrowserProvider((window as any).ethereum);
      setProvider(p);
      p.getNetwork().then((n) => setChainId(Number(n.chainId)));
    }
  }, []);

  const contractAddr = useMemo(() => {
    const m = NebulaVoteHubAddresses[String(chainId) as keyof typeof NebulaVoteHubAddresses];
    return (m?.address || "0x0000000000000000000000000000000000000000") as `0x${string}`;
  }, [chainId]);

  async function createMotion() {
    if (!provider) {
      setStatus("请连接钱包");
      return;
    }
    setIsSubmitting(true);
    setStatus("正在创建议题...");
    try {
      const signer = await provider.getSigner();
      const c = new ethers.Contract(contractAddr, NebulaVoteHubABI.abi, signer);
      const open = Math.floor(new Date(openAt).getTime() / 1000);
      const close = Math.floor(new Date(closeAt).getTime() / 1000);
      const tx = await c.createMotion(title, description, choices, open, close, quota);
      setStatus("交易已提交，等待确认...");
      await tx.wait(1);
      setStatus("🎉 议题创建成功！");
      // 重置表单
      setTitle("");
      setDescription("");
      setChoices(["赞成", "反对"]);
      setOpenAt("");
      setCloseAt("");
      setQuota(1);
    } catch (error: any) {
      setStatus(`❌ 创建失败: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateChoice(i: number, v: string) {
    const arr = choices.slice();
    arr[i] = v; 
    setChoices(arr);
  }

  function addChoice() {
    setChoices([...choices, `选项 ${choices.length + 1}`]);
  }

  function removeChoice(i: number) {
    if (choices.length > 2) {
      const arr = choices.slice();
      arr.splice(i, 1);
      setChoices(arr);
    }
  }

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold text-gradient">创建议题</h1>
        <p className="text-xl text-white/70 max-w-3xl mx-auto">
          发起新的投票议题，利用 FHEVM 技术保护投票隐私
        </p>
        <div className="w-32 h-1 luxury-gradient-1 rounded-full mx-auto animate-pulse-glow"></div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto">
        <div className="card space-y-8">
          <div className="grid gap-6">
            {/* Title */}
            <div className="space-y-3">
              <label className="text-xl font-semibold text-white flex items-center gap-2">
                <span>📋</span> 议题标题
              </label>
              <input 
                className="luxury-input text-lg" 
                placeholder="输入您的议题标题..." 
                value={title} 
                onChange={(e)=>setTitle(e.target.value)} 
              />
            </div>

            {/* Description */}
            <div className="space-y-3">
              <label className="text-xl font-semibold text-white flex items-center gap-2">
                <span>📝</span> 详细描述
              </label>
              <textarea 
                className="luxury-input min-h-[120px] resize-none" 
                placeholder="详细描述您的议题内容..." 
                value={description} 
                onChange={(e)=>setDescription(e.target.value)} 
              />
            </div>

            {/* Choices */}
            <div className="space-y-3">
              <label className="text-xl font-semibold text-white flex items-center gap-2">
                <span>🎯</span> 投票选项
              </label>
              <div className="grid gap-4">
                {choices.map((c,i)=> (
                  <div key={i} className="flex items-center gap-4">
                    <input 
                      className="luxury-input flex-1" 
                      value={c} 
                      placeholder={`选项 ${i + 1}`}
                      onChange={(e)=>updateChoice(i, e.target.value)} 
                    />
                    {choices.length > 2 && (
                      <button 
                        className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all duration-300"
                        onClick={()=>removeChoice(i)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button 
                  className="btn-outline w-full" 
                  onClick={addChoice}
                  disabled={choices.length >= 10}
                >
                  ➕ 添加选项 ({choices.length}/10)
                </button>
              </div>
            </div>

            {/* Time Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-xl font-semibold text-white flex items-center gap-2">
                  <span>🕐</span> 开始时间
                </label>
                <input 
                  className="luxury-input" 
                  type="datetime-local"
                  value={openAt} 
                  onChange={(e)=>setOpenAt(e.target.value)} 
                />
              </div>
              <div className="space-y-3">
                <label className="text-xl font-semibold text-white flex items-center gap-2">
                  <span>🕕</span> 结束时间
                </label>
                <input 
                  className="luxury-input" 
                  type="datetime-local"
                  value={closeAt} 
                  onChange={(e)=>setCloseAt(e.target.value)} 
                />
              </div>
            </div>

            {/* Quota */}
            <div className="space-y-3">
              <label className="text-xl font-semibold text-white flex items-center gap-2">
                <span>👥</span> 每地址投票配额
              </label>
              <input 
                className="luxury-input" 
                type="number" 
                min="1" 
                max="10"
                value={quota} 
                onChange={(e)=>setQuota(Number(e.target.value||1))} 
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex flex-col items-center gap-6 pt-8 border-t border-white/10">
            <button 
              className={`btn-primary text-xl px-16 py-6 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'animate-pulse-glow'}`}
              onClick={createMotion}
              disabled={isSubmitting || !title || !description || choices.length < 2}
            >
              {isSubmitting ? "🔄 创建中..." : "🚀 创建议题"}
            </button>
            
            {status && (
              <div className={`px-6 py-3 rounded-xl font-medium ${
                status.includes('成功') ? 'bg-green-500/20 border border-green-500/30 text-green-400' :
                status.includes('失败') ? 'bg-red-500/20 border border-red-500/30 text-red-400' :
                'bg-blue-500/20 border border-blue-500/30 text-blue-400'
              }`}>
                {status}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ethers } from "ethers";
import { decryptAggregate } from "@/fhevm/adapter";
import { NebulaVoteHubABI } from "@/abi/NebulaVoteHubABI";
import { NebulaVoteHubAddresses } from "@/abi/NebulaVoteHubAddresses";

function ResultDetailInner() {
  const search = useSearchParams();
  const id = Number(search.get("id") || 0);
  const [chainId] = useState(11155111);

  const contractAddr = useMemo(() => {
    const m = NebulaVoteHubAddresses[String(chainId) as keyof typeof NebulaVoteHubAddresses];
    return (m?.address || "0x0000000000000000000000000000000000000000") as `0x${string}`;
  }, [chainId]);

  async function doDecrypt() {
    // 示例：从合约读取句柄数组 encHandles 后调用 decryptAggregate
    // 这里保留占位，页面作为静态导出
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">计票结果 #{id}</h2>
      <div className="text-sm text-slate-400">发布后可解密人群解密得到聚合结果（Snapshot）</div>
    </div>
  );
}

export default function ResultDetail() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-400">加载中...</div>}>
      <ResultDetailInner />
    </Suspense>
  );
}



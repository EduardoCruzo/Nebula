"use client";

import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { NebulaVoteHubABI } from "@/abi/NebulaVoteHubABI";
import { NebulaVoteHubAddresses } from "@/abi/NebulaVoteHubAddresses";
import { decryptAggregate } from "@/fhevm/adapter";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

type MotionDetail = {
  id: number;
  title: string;
  description: string;
  choices: string[];
  openAt: number;
  closeAt: number;
  finalized: boolean;
  curator: string;
  status: string;
};

export default function AnalyticsPage() {
  const [chainId] = useState(11155111);
  const [viewMode, setViewMode] = useState<"overview" | "specific">("overview");
  const [selectedMotion, setSelectedMotion] = useState<number | null>(null);
  const [motions, setMotions] = useState<MotionDetail[]>([]);
  const [decryptedResults, setDecryptedResults] = useState<number[] | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptStatus, setDecryptStatus] = useState<string>("");
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    finalized: 0,
    active: 0,
    upcoming: 0,
    loading: true
  });

  const contractAddr = useMemo(() => {
    const m = NebulaVoteHubAddresses[String(chainId) as keyof typeof NebulaVoteHubAddresses];
    return (m?.address || "0x0000000000000000000000000000000000000000") as `0x${string}`;
  }, [chainId]);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const p = new ethers.BrowserProvider((window as any).ethereum);
      setProvider(p);
    }
  }, []);

  // 解密聚合结果
  async function decryptMotionResults(motionId: number) {
    if (!provider || !selectedMotionDetail) return;
    
    setIsDecrypting(true);
    setDecryptStatus("正在获取加密句柄...");
    
    try {
      const c = new ethers.Contract(contractAddr, NebulaVoteHubABI.abi, provider);
      
      // 获取加密聚合数据的句柄
      const encryptedAggregates = await c.encryptedAggregationOf(motionId);
      
      if (!encryptedAggregates || encryptedAggregates.length === 0) {
        setDecryptStatus("❌ 暂无加密数据可解密");
        return;
      }
      
      setDecryptStatus("正在通过 Relayer 解密...");
      
      // 将 BigInt 转换为字符串
      const handles: string[] = encryptedAggregates.map((handle: any) => handle.toString());
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      
      // 解密聚合结果
      const results = await decryptAggregate({
        contractAddress: contractAddr,
        encHandles: handles,
        userAddress,
        chainId,
        provider
      });
      
      // 将解密结果转换为数字数组
      const decrypted = handles.map((_, index) => {
        const key = handles[index];
        return Number(results[key] || 0);
      });
      
      setDecryptedResults(decrypted);
      setDecryptStatus("🎉 解密成功！");
      
    } catch (error: any) {
      console.error('Decrypt error:', error);
      setDecryptStatus(`❌ 解密失败: ${error.message}`);
    } finally {
      setIsDecrypting(false);
    }
  }

  useEffect(() => {
    async function run() {
      try {
        const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
        const c = new ethers.Contract(contractAddr, NebulaVoteHubABI.abi, provider);
        const cnt: bigint = await c.motionsCount();
        const total = Number(cnt);
        
        let finalized = 0;
        let active = 0;
        let upcoming = 0;
        const now = Math.floor(Date.now() / 1000);
        const motionsList: MotionDetail[] = [];

        for (let i = 1n; i <= cnt; i++) {
          try { 
            const r = await c.readMotion(i); 
            const motion: MotionDetail = {
              id: Number(i),
              title: r[0] as string,
              description: r[1] as string,
              choices: r[2] as string[],
              openAt: Number(r[3]),
              closeAt: Number(r[4]),
              finalized: Boolean(r[5]),
              curator: r[6] as string,
              status: ""
            };

            // 计算状态
            if (motion.finalized) {
              motion.status = "已发布";
              finalized += 1;
            } else if (motion.openAt > now) {
              motion.status = "未开始";
              upcoming += 1;
            } else if (motion.closeAt >= now) {
              motion.status = "进行中";
              active += 1;
            } else {
              motion.status = "已结束";
            }

            motionsList.push(motion);
          } catch {}
        }

        setMotions(motionsList);
        setStats({ total, finalized, active, upcoming, loading: false });
      } catch (error) {
        setStats(prev => ({ ...prev, loading: false }));
      }
    }
    run();
  }, [contractAddr]);

  const overviewChartData = [
    { label: "活跃议题", value: stats.active, color: "luxury-gradient-1", icon: "🔥" },
    { label: "即将开始", value: stats.upcoming, color: "luxury-gradient-2", icon: "⏳" },
    { label: "已发布", value: stats.finalized, color: "luxury-gradient-3", icon: "✅" },
  ];

  const selectedMotionDetail = selectedMotion ? motions.find(m => m.id === selectedMotion) : null;

  // 图表配置
  const getChartData = () => {
    if (!selectedMotionDetail || !decryptedResults) return null;
    
    const labels = selectedMotionDetail.choices;
    const data = decryptedResults;
    const total = data.reduce((sum, val) => sum + val, 0);
    
    const colors = [
      'rgba(102, 126, 234, 0.8)',
      'rgba(240, 147, 251, 0.8)', 
      'rgba(79, 172, 254, 0.8)',
      'rgba(67, 233, 123, 0.8)',
      'rgba(247, 112, 154, 0.8)',
      'rgba(254, 215, 102, 0.8)',
    ];
    
    const borderColors = [
      'rgba(102, 126, 234, 1)',
      'rgba(240, 147, 251, 1)',
      'rgba(79, 172, 254, 1)',
      'rgba(67, 233, 123, 1)',
      'rgba(247, 112, 154, 1)',
      'rgba(254, 215, 102, 1)',
    ];

    return {
      labels,
      datasets: [{
        label: '投票数',
        data,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: borderColors.slice(0, labels.length),
        borderWidth: 2,
      }],
      total
    };
  };

  const chartData = getChartData();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            size: 14
          }
        }
      },
      title: {
        display: true,
        text: '投票结果统计',
        color: 'rgba(255, 255, 255, 0.9)',
        font: {
          size: 16
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        }
      },
      x: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: '投票比例分布',
        color: 'rgba(255, 255, 255, 0.9)',
        font: {
          size: 16
        }
      },
    },
  };

  return (
    <div className="space-y-16 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold text-gradient">平台分析</h1>
        <p className="text-xl text-white/70 max-w-3xl mx-auto">
          深入了解 NebulaVote 平台的使用数据与统计信息
        </p>
        <div className="w-32 h-1 luxury-gradient-4 rounded-full mx-auto animate-pulse-glow"></div>
      </div>

      {/* View Mode Selector */}
      <div className="flex justify-center gap-4">
        <button
          className={`px-8 py-4 rounded-2xl font-semibold transition-all duration-300 ${
            viewMode === "overview"
              ? "luxury-gradient-1 text-white shadow-2xl scale-105"
              : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
          }`}
          onClick={() => setViewMode("overview")}
        >
          📊 平台总览
        </button>
        <button
          className={`px-8 py-4 rounded-2xl font-semibold transition-all duration-300 ${
            viewMode === "specific"
              ? "luxury-gradient-2 text-white shadow-2xl scale-105"
              : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
          }`}
          onClick={() => setViewMode("specific")}
        >
          🎯 议题详情
        </button>
      </div>

      {/* Motion Selector (only show when specific mode) */}
      {viewMode === "specific" && (
        <div className="max-w-4xl mx-auto">
          <div className="card space-y-6">
            <h3 className="text-2xl font-bold text-gradient text-center">选择要分析的议题</h3>
            <div className="grid gap-4 max-h-96 overflow-y-auto">
              {motions.map((motion) => (
                <button
                  key={motion.id}
                  className={`card-hover text-left transition-all duration-300 ${
                    selectedMotion === motion.id ? 'ring-2 ring-blue-400/50 luxury-gradient-1' : ''
                  }`}
                  onClick={() => setSelectedMotion(motion.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-lg font-semibold text-white mb-1">#{motion.id} {motion.title}</div>
                      <div className="text-sm text-white/60 mb-2">{motion.description.slice(0, 100)}...</div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                          motion.status === "进行中" ? "bg-green-500/20 text-green-400" :
                          motion.status === "未开始" ? "bg-blue-500/20 text-blue-400" :
                          motion.status === "已发布" ? "bg-purple-500/20 text-purple-400" :
                          "bg-yellow-500/20 text-yellow-400"
                        }`}>
                          {motion.status}
                        </span>
                        <span className="text-white/40 text-xs">{motion.choices.length} 个选项</span>
                      </div>
                    </div>
                    <div className="text-2xl">
                      {selectedMotion === motion.id ? '✅' : '🗳️'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Specific Motion Analysis */}
      {viewMode === "specific" && selectedMotionDetail && (
        <div className="max-w-6xl mx-auto">
          <div className="card space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-gradient">议题 #{selectedMotionDetail.id} 详细分析</h2>
              <h3 className="text-2xl text-white">{selectedMotionDetail.title}</h3>
              <p className="text-white/70">{selectedMotionDetail.description}</p>
            </div>

            {/* Motion Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-xl font-bold text-gradient">📋 基本信息</h4>
                <div className="space-y-3 text-white/80">
                  <div className="flex justify-between">
                    <span>议题ID:</span>
                    <span className="font-mono">#{selectedMotionDetail.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>状态:</span>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      selectedMotionDetail.status === "进行中" ? "bg-green-500/20 text-green-400" :
                      selectedMotionDetail.status === "未开始" ? "bg-blue-500/20 text-blue-400" :
                      selectedMotionDetail.status === "已发布" ? "bg-purple-500/20 text-purple-400" :
                      "bg-yellow-500/20 text-yellow-400"
                    }`}>
                      {selectedMotionDetail.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>选项数量:</span>
                    <span>{selectedMotionDetail.choices.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>开始时间:</span>
                    <span className="text-sm">{new Date(selectedMotionDetail.openAt * 1000).toLocaleString('zh-CN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>结束时间:</span>
                    <span className="text-sm">{new Date(selectedMotionDetail.closeAt * 1000).toLocaleString('zh-CN')}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xl font-bold text-gradient">🎯 投票选项</h4>
                <div className="space-y-3">
                  {selectedMotionDetail.choices.map((choice, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="w-8 h-8 luxury-gradient-1 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <span className="text-white">{choice}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Creator Info */}
            <div className="border-t border-white/10 pt-6">
              <h4 className="text-xl font-bold text-gradient mb-4">👤 创建者信息</h4>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-white/60 text-sm mb-1">创建者地址:</div>
                <div className="font-mono text-sm text-white break-all">{selectedMotionDetail.curator}</div>
              </div>
            </div>

            {/* Time Analysis */}
            <div className="border-t border-white/10 pt-6">
              <h4 className="text-xl font-bold text-gradient mb-4">⏰ 时间分析</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl mb-2">📅</div>
                  <div className="text-white/60 text-sm">持续时间</div>
                  <div className="text-white font-semibold">
                    {Math.ceil((selectedMotionDetail.closeAt - selectedMotionDetail.openAt) / (24 * 60 * 60))} 天
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">⏳</div>
                  <div className="text-white/60 text-sm">剩余时间</div>
                  <div className="text-white font-semibold">
                    {selectedMotionDetail.status === "进行中" 
                      ? `${Math.max(0, Math.ceil((selectedMotionDetail.closeAt - Date.now() / 1000) / (24 * 60 * 60)))} 天`
                      : selectedMotionDetail.status === "未开始"
                      ? `${Math.ceil((selectedMotionDetail.openAt - Date.now() / 1000) / (24 * 60 * 60))} 天后开始`
                      : "已结束"
                    }
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="text-white/60 text-sm">进度</div>
                  <div className="text-white font-semibold">
                    {selectedMotionDetail.status === "未开始" ? "0%" :
                     selectedMotionDetail.status === "进行中" 
                       ? `${Math.min(100, Math.max(0, ((Date.now() / 1000 - selectedMotionDetail.openAt) / (selectedMotionDetail.closeAt - selectedMotionDetail.openAt) * 100))).toFixed(1)}%`
                       : "100%"
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Decryption Section */}
            <div className="border-t border-white/10 pt-6">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-bold text-gradient">🔓 投票结果解密</h4>
                <button
                  className={`btn-primary ${isDecrypting ? 'opacity-50 cursor-not-allowed' : 'animate-pulse-glow'}`}
                  onClick={() => decryptMotionResults(selectedMotionDetail.id)}
                  disabled={isDecrypting || !provider}
                >
                  {isDecrypting ? "🔄 解密中..." : "🔓 解密投票结果"}
                </button>
              </div>
              
              {decryptStatus && (
                <div className={`mb-6 px-6 py-3 rounded-xl font-medium text-center ${
                  decryptStatus.includes('成功') ? 'bg-green-500/20 border border-green-500/30 text-green-400' :
                  decryptStatus.includes('失败') ? 'bg-red-500/20 border border-red-500/30 text-red-400' :
                  'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                }`}>
                  {decryptStatus}
                </div>
              )}

              {/* Charts Display */}
              {chartData && decryptedResults && (
                <div className="space-y-8">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="card text-center">
                      <div className="text-3xl font-bold text-gradient mb-2">{chartData.total}</div>
                      <div className="text-white/70 text-sm">总投票数</div>
                    </div>
                    <div className="card text-center">
                      <div className="text-3xl font-bold text-gradient mb-2">{Math.max(...decryptedResults)}</div>
                      <div className="text-white/70 text-sm">最高票数</div>
                    </div>
                    <div className="card text-center">
                      <div className="text-3xl font-bold text-gradient mb-2">
                        {((Math.max(...decryptedResults) / chartData.total) * 100).toFixed(1)}%
                      </div>
                      <div className="text-white/70 text-sm">最高得票率</div>
                    </div>
                    <div className="card text-center">
                      <div className="text-3xl font-bold text-gradient mb-2">{selectedMotionDetail.choices.length}</div>
                      <div className="text-white/70 text-sm">选项数量</div>
                    </div>
                  </div>

                  {/* Charts Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Bar Chart */}
                    <div className="card">
                      <h5 className="text-lg font-bold text-gradient mb-4 text-center">📊 柱状图</h5>
                      <div className="h-80">
                        <Bar data={chartData} options={chartOptions} />
                      </div>
                    </div>

                    {/* Doughnut Chart */}
                    <div className="card">
                      <h5 className="text-lg font-bold text-gradient mb-4 text-center">🍩 环形图</h5>
                      <div className="h-80">
                        <Doughnut data={chartData} options={doughnutOptions} />
                      </div>
                    </div>

                    {/* Pie Chart */}
                    <div className="card">
                      <h5 className="text-lg font-bold text-gradient mb-4 text-center">🥧 饼状图</h5>
                      <div className="h-80">
                        <Pie data={chartData} options={doughnutOptions} />
                      </div>
                    </div>

                    {/* Line Chart (Trend) */}
                    <div className="card">
                      <h5 className="text-lg font-bold text-gradient mb-4 text-center">📈 趋势图</h5>
                      <div className="h-80">
                        <Line 
                          data={{
                            labels: chartData.labels,
                            datasets: [{
                              label: '投票趋势',
                              data: chartData.datasets[0].data,
                              borderColor: 'rgba(102, 126, 234, 1)',
                              backgroundColor: 'rgba(102, 126, 234, 0.1)',
                              fill: true,
                              tension: 0.4,
                            }]
                          }} 
                          options={{
                            ...chartOptions,
                            plugins: {
                              ...chartOptions.plugins,
                              title: {
                                ...chartOptions.plugins.title,
                                text: '投票趋势分析'
                              }
                            }
                          }} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Detailed Results Table */}
                  <div className="card">
                    <h5 className="text-lg font-bold text-gradient mb-4 text-center">📋 详细结果</h5>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left py-3 px-4 text-white/80">选项</th>
                            <th className="text-center py-3 px-4 text-white/80">票数</th>
                            <th className="text-center py-3 px-4 text-white/80">占比</th>
                            <th className="text-center py-3 px-4 text-white/80">排名</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedMotionDetail.choices.map((choice, index) => {
                            const votes = decryptedResults[index];
                            const percentage = chartData.total > 0 ? (votes / chartData.total * 100).toFixed(2) : '0.00';
                            const rank = decryptedResults
                              .map((v, i) => ({ votes: v, index: i }))
                              .sort((a, b) => b.votes - a.votes)
                              .findIndex(item => item.index === index) + 1;
                            
                            return (
                              <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                                <td className="py-3 px-4 text-white">{choice}</td>
                                <td className="py-3 px-4 text-center text-gradient font-bold">{votes}</td>
                                <td className="py-3 px-4 text-center text-white/80">{percentage}%</td>
                                <td className="py-3 px-4 text-center">
                                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                    rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                                    rank === 2 ? 'bg-gray-400/20 text-gray-300' :
                                    rank === 3 ? 'bg-amber-600/20 text-amber-400' :
                                    'bg-white/10 text-white/60'
                                  }`}>
                                    #{rank}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Overview Mode Content */}
      {viewMode === "overview" && (
        <>
          {/* Main Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="card text-center group animate-slide-in-left">
              <div className="text-6xl mb-6">📊</div>
              <div className="text-5xl font-bold mb-4">
                {stats.loading ? (
                  <div className="animate-pulse">
                    <div className="h-12 bg-white/20 rounded-xl mx-auto w-20"></div>
                  </div>
                ) : (
                  <span className="text-gradient">{stats.total}</span>
                )}
              </div>
              <div className="text-xl font-semibold text-white mb-2">总议题数</div>
              <div className="text-white/50 text-sm">累计创建的所有议题</div>
              <div className="h-1 w-full luxury-gradient-1 rounded-full mt-4 group-hover:animate-pulse"></div>
            </div>

            <div className="card text-center group animate-slide-in-left" style={{animationDelay: '0.1s'}}>
              <div className="text-6xl mb-6">🔥</div>
              <div className="text-5xl font-bold mb-4">
                {stats.loading ? (
                  <div className="animate-pulse">
                    <div className="h-12 bg-white/20 rounded-xl mx-auto w-20"></div>
                  </div>
                ) : (
                  <span className="text-gradient">{stats.active}</span>
                )}
              </div>
              <div className="text-xl font-semibold text-white mb-2">活跃议题</div>
              <div className="text-white/50 text-sm">正在进行投票的议题</div>
              <div className="h-1 w-full luxury-gradient-2 rounded-full mt-4 group-hover:animate-pulse"></div>
            </div>

            <div className="card text-center group animate-slide-in-left" style={{animationDelay: '0.2s'}}>
              <div className="text-6xl mb-6">⏳</div>
              <div className="text-5xl font-bold mb-4">
                {stats.loading ? (
                  <div className="animate-pulse">
                    <div className="h-12 bg-white/20 rounded-xl mx-auto w-20"></div>
                  </div>
                ) : (
                  <span className="text-gradient">{stats.upcoming}</span>
                )}
              </div>
              <div className="text-xl font-semibold text-white mb-2">即将开始</div>
              <div className="text-white/50 text-sm">尚未开始的议题</div>
              <div className="h-1 w-full luxury-gradient-3 rounded-full mt-4 group-hover:animate-pulse"></div>
            </div>

            <div className="card text-center group animate-slide-in-left" style={{animationDelay: '0.3s'}}>
              <div className="text-6xl mb-6">✅</div>
              <div className="text-5xl font-bold mb-4">
                {stats.loading ? (
                  <div className="animate-pulse">
                    <div className="h-12 bg-white/20 rounded-xl mx-auto w-20"></div>
                  </div>
                ) : (
                  <span className="text-gradient">{stats.finalized}</span>
                )}
              </div>
              <div className="text-xl font-semibold text-white mb-2">已发布</div>
              <div className="text-white/50 text-sm">已公布结果的议题</div>
              <div className="h-1 w-full luxury-gradient-4 rounded-full mt-4 group-hover:animate-pulse"></div>
            </div>
          </div>

          {/* Chart Visualization */}
          <div className="max-w-6xl mx-auto">
            <div className="card space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-gradient">📈 议题状态分布</h2>
                <p className="text-white/60">可视化展示各种状态议题的分布情况</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {overviewChartData.map((item, index) => (
                  <div key={index} className="text-center space-y-4 animate-fade-in" style={{animationDelay: `${index * 0.2}s`}}>
                    <div className={`w-32 h-32 ${item.color} rounded-full mx-auto flex items-center justify-center text-4xl transform hover:scale-110 transition-transform duration-300`}>
                      {item.icon}
                    </div>
                    <div className="space-y-2">
                      <div className="text-3xl font-bold text-white">{item.value}</div>
                      <div className="text-lg font-semibold text-white/80">{item.label}</div>
                      <div className="text-sm text-white/50">
                        {stats.total > 0 ? `${((item.value / stats.total) * 100).toFixed(1)}%` : '0%'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress Bars */}
              <div className="space-y-4">
                {overviewChartData.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-white/80">
                      <span className="font-medium">{item.icon} {item.label}</span>
                      <span>{item.value}</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.color} transition-all duration-1000 ease-out`}
                        style={{ 
                          width: stats.total > 0 ? `${(item.value / stats.total) * 100}%` : '0%',
                          animationDelay: `${index * 0.2}s`
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Technology Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card space-y-6 animate-slide-in-left">
              <h3 className="text-2xl font-bold text-gradient">🔐 隐私保护</h3>
              <div className="space-y-4 text-white/70">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 luxury-gradient-1 rounded-full flex-shrink-0 mt-0.5"></div>
                  <div>
                    <div className="font-semibold text-white">同态加密</div>
                    <div className="text-sm">使用 FHEVM 技术保护投票隐私</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 luxury-gradient-2 rounded-full flex-shrink-0 mt-0.5"></div>
                  <div>
                    <div className="font-semibold text-white">零知识证明</div>
                    <div className="text-sm">验证投票有效性而不泄露内容</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 luxury-gradient-3 rounded-full flex-shrink-0 mt-0.5"></div>
                  <div>
                    <div className="font-semibold text-white">去中心化</div>
                    <div className="text-sm">运行在以太坊区块链上</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card space-y-6 animate-slide-in-right">
              <h3 className="text-2xl font-bold text-gradient">⚡ 技术特性</h3>
              <div className="space-y-4 text-white/70">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 luxury-gradient-4 rounded-full flex-shrink-0 mt-0.5"></div>
                  <div>
                    <div className="font-semibold text-white">实时计票</div>
                    <div className="text-sm">同态聚合技术实现实时统计</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 luxury-gradient-5 rounded-full flex-shrink-0 mt-0.5"></div>
                  <div>
                    <div className="font-semibold text-white">可验证性</div>
                    <div className="text-sm">所有投票过程链上可查</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 luxury-gradient-1 rounded-full flex-shrink-0 mt-0.5"></div>
                  <div>
                    <div className="font-semibold text-white">抗审查</div>
                    <div className="text-sm">分布式架构确保服务可用性</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contract Info */}
          <div className="card text-center space-y-6 animate-fade-in">
            <h3 className="text-3xl font-bold text-gradient">🏗️ 合约信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              <div>
                <div className="text-white/60 text-sm mb-2">合约地址</div>
                <div className="font-mono text-sm text-gradient break-all">{contractAddr}</div>
              </div>
              <div>
                <div className="text-white/60 text-sm mb-2">网络</div>
                <div className="text-white">Sepolia Testnet</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
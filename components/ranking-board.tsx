'use client'

import { Badge } from '@/components/ui/badge'

interface TopPerformer {
  name: string
  count: number
}

interface Ranking {
  rank: number
  name: string
  count: number
  deskNumber: number
  lastDate: string
}

interface RankingBoardProps {
  topPerformers: TopPerformer[]
  rankings: Ranking[]
}

export default function RankingBoard({ topPerformers, rankings }: RankingBoardProps) {
  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇'
      case 2:
        return '🥈'
      case 3:
        return '🥉'
      default:
        return `${rank}`
    }
  }

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 2:
        return 'bg-gray-100 text-gray-800 border-gray-300'
      case 3:
        return 'bg-orange-100 text-orange-800 border-orange-300'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300'
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">BẢNG XẾP HẠNG PHÁT BIỂU</h2>
        <div className="h-1 w-20 bg-gradient-to-r from-blue-400 to-blue-600 mx-auto rounded-full"></div>
      </div>

      {/* Top 3 Performers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((rank) => {
          const performer = topPerformers[rank - 1]
          return (
            <div
              key={rank}
              className={`p-6 rounded-lg text-center font-semibold transition-transform hover:scale-105 ${
                rank === 1
                  ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300 shadow-lg'
                  : rank === 2
                    ? 'bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300'
                    : 'bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300'
              }`}
            >
              <div className="text-4xl mb-2">{getMedalEmoji(rank)} Hạng {rank}</div>
              <div className="text-lg font-bold text-slate-800 mb-2">{performer?.name || 'Chưa có'}</div>
              <div className={`text-2xl font-bold ${rank === 1 ? 'text-yellow-600' : rank === 2 ? 'text-gray-600' : 'text-orange-600'}`}>
                {performer?.count || 0} lần
              </div>
            </div>
          )
        })}
      </div>

      {/* Full Ranking Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <th className="px-4 py-3 text-left font-semibold rounded-tl-lg">Hạng</th>
              <th className="px-4 py-3 text-left font-semibold">Học sinh</th>
              <th className="px-4 py-3 text-center font-semibold">Số lần phát biểu</th>
              <th className="px-4 py-3 text-center font-semibold">Bàn số</th>
              <th className="px-4 py-3 text-left font-semibold rounded-tr-lg">Lần phát biểu gần nhất</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((ranking, index) => (
              <tr
                key={ranking.rank}
                className={`border-b transition-colors hover:bg-blue-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
              >
                <td className="px-4 py-3">
                  <Badge className={`${getMedalColor(ranking.rank)} border font-bold`}>
                    {getMedalEmoji(ranking.rank)}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-medium text-slate-800">{ranking.name}</td>
                <td className="px-4 py-3 text-center">
                  <Badge className="bg-red-100 text-red-700 border border-red-300 font-bold">
                    {ranking.count} lần
                  </Badge>
                </td>
                <td className="px-4 py-3 text-center font-semibold text-blue-600">Bàn {ranking.deskNumber}</td>
                <td className="px-4 py-3 text-slate-700">{ranking.lastDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

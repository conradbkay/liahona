"use client"

import { useState, useEffect } from "react"
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface RepoStarHistoryProps {
  owner: string
  repo: string
}

// Format number with k, m suffix
const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}m`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
  return num.toString()
}

export function RepoStarHistory({ owner, repo }: RepoStarHistoryProps) {
  const [starData, setStarData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStarHistory = async () => {
      setLoading(true)
      setError(null)

      try {
        // Using the star-history API (https://star-history.com)
        // This is a third-party service that provides star history data
        const response = await fetch(
          `https://star-history.com/api/chart/timeline?repo=${owner}/${repo}`
        )

        if (!response.ok) {
          throw new Error(`Failed to fetch star history: ${response.status}`)
        }

        const data = await response.json()

        if (data && data.series && data.series.length > 0) {
          // Transform the data for our chart
          const transformedData = data.series[0].data.map((point: any) => ({
            date: new Date(point[0]).toLocaleDateString(),
            stars: point[1]
          }))

          // Sample the data to avoid too many points
          const sampledData = sampleData(transformedData, 20)
          setStarData(sampledData)
        } else {
          throw new Error("No star history data available")
        }
      } catch (err: any) {
        console.error("Error fetching star history:", err)
        setError(err.message || "Failed to load star history")

        // Fallback: Generate mock data based on current star count
        generateMockStarData()

        toast.error("Could not fetch actual star history", {
          description: "Using estimated data instead"
        })
      } finally {
        setLoading(false)
      }
    }

    const generateMockStarData = async () => {
      try {
        // Fetch current star count
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}`
        )
        const repoData = await response.json()
        const currentStars = repoData.stargazers_count || 1000

        // Generate mock data
        const mockData = []
        const today = new Date()
        const startDate = new Date(today)
        startDate.setFullYear(today.getFullYear() - 1)

        // Create 12 data points (monthly)
        for (let i = 0; i < 12; i++) {
          const date = new Date(startDate)
          date.setMonth(startDate.getMonth() + i)

          // Simulate exponential growth
          const growthFactor = Math.pow(1.1, i)
          const stars = Math.round(
            (currentStars / Math.pow(1.1, 12)) * growthFactor
          )

          mockData.push({
            date: date.toLocaleDateString(),
            stars: stars
          })
        }

        setStarData(mockData)
      } catch (err) {
        console.error("Error generating mock data:", err)
        setStarData([])
      }
    }

    fetchStarHistory()
  }, [owner, repo])

  // Sample data to reduce number of points
  const sampleData = (data: any[], targetCount: number) => {
    if (data.length <= targetCount) return data

    const result = []
    const step = Math.floor(data.length / targetCount)

    for (let i = 0; i < data.length; i += step) {
      result.push(data[i])
    }

    // Always include the last point
    if (result[result.length - 1] !== data[data.length - 1]) {
      result.push(data[data.length - 1])
    }

    return result
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex justify-between">
          <h3 className="text-lg font-medium">Star History</h3>
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-[200px] w-full" />
      </div>
    )
  }

  if (error && !starData.length) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Could not load star history</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Star History</h3>
        <div className="text-sm text-muted-foreground">
          {starData.length > 0 &&
            `Current: ${formatNumber(
              starData[starData.length - 1].stars
            )} stars`}
        </div>
      </div>

      <ChartContainer
        config={{
          stars: {
            label: "Stars",
            color: "hsl(var(--primary))"
          }
        }}
        className="h-[200px]"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={starData}
            margin={{
              top: 5,
              right: 10,
              left: 10,
              bottom: 0
            }}
          >
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tickFormatter={(value) => {
                const date = new Date(value)
                return `${date.getMonth() + 1}/${date
                  .getFullYear()
                  .toString()
                  .slice(2)}`
              }}
              minTickGap={30}
            />
            <YAxis
              tickFormatter={(value) => formatNumber(value)}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <Tooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="stars"
              strokeWidth={2}
              activeDot={{
                r: 6,
                style: { fill: "var(--color-stars)", opacity: 0.8 }
              }}
              style={{
                stroke: "var(--color-stars)"
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { RotateCw, Clock, FileText, User, Activity, Database, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Switch } from "./ui/switch"

interface FileChange {
  id: string
  type: "added" | "modified" | "deleted"
  user: string
  timestamp: string
  description?: string
}

interface FileData {
  changes: FileChange[]
  lastModified?: string
}

interface Props {
  initialData: FileData
}

export function FileChangesDisplay({ initialData }: Props) {
  const [data, setData] = useState<FileData>(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/file-changes")
      const newData = await response.json()
      setData(newData)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined
    if (autoRefresh) {
      interval = setInterval(fetchData, 5000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const getChangeTypeBadge = (type: string) => {
    switch (type) {
      case "added":
        return <Badge variant="success">Added</Badge>
      case "modified":
        return <Badge variant="info">Modified</Badge>
      case "deleted":
        return <Badge variant="error">Deleted</Badge>
      default:
        return <Badge>{type}</Badge>
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getChangeTypeStats = () => {
    const stats = data.changes.reduce(
      (acc, change) => {
        acc[change.type] = (acc[change.type] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )
    return stats
  }

  const stats = getChangeTypeStats()

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="container mx-auto max-w-7xl p-4 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Group Admission
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">Track and monitor file changes in real-time</p>
          </div>
        </div>

        {/* Controls */}
        <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button
                onClick={fetchData}
                disabled={isLoading}
                variant="outline"
                className="w-full sm:w-auto min-w-[140px] bg-transparent"
              >
                <RotateCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh Data
              </Button>

              <div className="flex items-center space-x-3">
                <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} id="auto-refresh" />
                <label
                  htmlFor="auto-refresh"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  <Clock className="h-4 w-4" />
                  Auto Refresh ({autoRefresh ? "ON" : "OFF"})
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Modified</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {data.lastModified ? formatTimestamp(data.lastModified) : "Unknown"}
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Changes</CardTitle>
              <Database className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{data.changes?.length || 0}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Rank updates recorded</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Activity Status</CardTitle>
              <Activity className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {data.changes?.length > 0 ? "Active" : "Idle"}
              </div>
              {data.changes?.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Latest: {data.changes[0].user}</p>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Change Types</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {Object.entries(stats).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span className="capitalize text-gray-600 dark:text-gray-400">{type}:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Changes List */}
        <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Detailed Activity Log
            </CardTitle>
            <CardDescription>Complete history of all rank changes and modifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
              {data.changes?.length ? (
                <div className="space-y-4">
                  {data.changes.map((change, index) => (
                    <div key={change.id}>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 hover:shadow-md transition-all duration-200">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                            <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <p className="font-semibold text-gray-900 dark:text-gray-100">{change.user}</p>
                              {getChangeTypeBadge(change.type)}
                            </div>
                            {change.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                {change.description}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimestamp(change.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                      {index < data.changes.length - 1 && (
                        <div className="flex justify-center my-2">
                          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-6 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 mb-6">
                    <FileText className="h-12 w-12 text-blue-500 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No Changes Yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md leading-relaxed">
                    No rank updates have been recorded. Check back later or initiate a rank change to see activity logs
                    here.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
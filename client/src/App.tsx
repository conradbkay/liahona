"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import {
  Search,
  Star,
  GitFork,
  Clock,
  Github,
  ExternalLink,
  Eye
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { Octokit } from "@octokit/rest"
import { RepoStarHistory } from "@/components/repo-star-history"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext
} from "@/components/ui/pagination"
import { toast } from "sonner"

// Language color mapping (similar to GitHub)
const languageColors: Record<string, string> = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Java: "#b07219",
  Go: "#00ADD8",
  Rust: "#dea584",
  C: "#555555",
  "C++": "#f34b7d",
  "C#": "#178600",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#ffac45",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  CSS: "#563d7c",
  HTML: "#e34c26",
  Shell: "#89e051"
}

// Initialize Octokit
// Note: For higher rate limits, you would use authentication
const octokit = new Octokit()

// Format date to relative time
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 86400)} days ago`
  if (diffInSeconds < 31536000)
    return `${Math.floor(diffInSeconds / 2592000)} months ago`
  return `${Math.floor(diffInSeconds / 31536000)} years ago`
}

// Format number with k, m suffix
const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}m`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
  return num.toString()
}

export default function Home() {
  const [query, setQuery] = useState("")
  const [repositories, setRepositories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [selectedRepo, setSelectedRepo] = useState<any>(null)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const perPage = 10

  const searchRepositories = useCallback(async () => {
    if (query.trim().length === 0) {
      setRepositories([])
      setTotalCount(0)
      setTotalPages(0)
      return
    }

    setLoading(true)
    try {
      const response = await octokit.search.repos({
        q: query,
        sort: "stars",
        order: "desc",
        per_page: perPage,
        page: page
      })

      setRepositories(response.data.items)
      setTotalCount(response.data.total_count)
      setTotalPages(
        Math.min(Math.ceil(response.data.total_count / perPage), 100)
      ) // GitHub API limits to 1000 results (100 pages of 10)
    } catch (error: any) {
      console.error("Error fetching repositories:", error)
      toast.error(error.message || "Failed to fetch repositories")
      setRepositories([])
    } finally {
      setLoading(false)
    }
  }, [page, query])

  useEffect(() => {
    // Set initial load to false after a short delay
    const timer = setTimeout(() => {
      setInitialLoad(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Reset page when query changes
    if (page !== 1) {
      setPage(1)
    } else {
      searchRepositories()
    }
  }, [query, page, setPage, searchRepositories])

  useEffect(() => {
    if (!initialLoad) {
      searchRepositories()
    }
  }, [page, initialLoad, searchRepositories])

  const handleRepoClick = (repo: any) => {
    window.open(repo.html_url, "_blank", "noopener,noreferrer")
  }

  const handleShowStats = (e: React.MouseEvent, repo: any) => {
    e.stopPropagation()
    setSelectedRepo(selectedRepo?.id === repo.id ? null : repo)
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null

    const pageNumbers = []
    const maxVisiblePages = 5

    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }

    return (
      <Pagination className="mt-8">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className={
                page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
              }
            />
          </PaginationItem>

          {startPage > 1 && (
            <>
              <PaginationItem>
                <PaginationLink onClick={() => setPage(1)}>1</PaginationLink>
              </PaginationItem>
              {startPage > 2 && (
                <PaginationItem>
                  <span className="px-4 py-2">...</span>
                </PaginationItem>
              )}
            </>
          )}

          {pageNumbers.map((num) => (
            <PaginationItem key={num}>
              <PaginationLink
                onClick={() => setPage(num)}
                isActive={page === num}
              >
                {num}
              </PaginationLink>
            </PaginationItem>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <PaginationItem>
                  <span className="px-4 py-2">...</span>
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationLink onClick={() => setPage(totalPages)}>
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}

          <PaginationItem>
            <PaginationNext
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className={
                page === totalPages
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
  }

  return (
    <ThemeProvider defaultTheme="dark">
      <main className="min-h-screen bg-background">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="container mx-auto px-4 py-16 md:py-24 max-w-4xl">
          <div className="relative z-10 space-y-12">
            {/* Header */}
            <div className="text-center space-y-6 relative">
              <div className="flex justify-center mb-8 animate-bounce-slow">
                <div className="bg-background dark:bg-background/90 rounded-full p-4">
                  <Github className="h-12 w-12 text-primary" />
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                GitHub Repository Search
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Discover amazing repositories from the GitHub universe
              </p>
            </div>

            {/* Search bar */}
            <div className="relative max-w-2xl mx-auto">
              <div className="relative bg-card rounded-lg border border-border">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  type="text"
                  placeholder="Search repositories..."
                  className="pl-12 py-7 text-lg bg-transparent border-none focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-primary/50 transition-all"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      searchRepositories()
                    }
                  }}
                />
              </div>
            </div>

            {/* Repository results */}
            <div className="space-y-4 relative">
              {initialLoad ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Github className="h-8 w-8 text-primary animate-pulse" />
                    </div>
                  </div>
                  <p className="text-muted-foreground animate-pulse">
                    Connecting to GitHub...
                  </p>
                </div>
              ) : loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="overflow-hidden border bg-card">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="space-y-3 flex-1">
                            <Skeleton className="h-6 w-1/3" />
                            <Skeleton className="h-4 w-full" />
                            <div className="flex gap-4 pt-2">
                              <Skeleton className="h-4 w-16" />
                              <Skeleton className="h-4 w-16" />
                              <Skeleton className="h-4 w-16" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : repositories.length > 0 ? (
                <div>
                  <div className="mb-4 text-sm text-muted-foreground">
                    Found {formatNumber(totalCount)} repositories
                  </div>
                  <div className="space-y-4">
                    {repositories.map((repo, index) => (
                      <div key={repo.id} className="space-y-4">
                        <Card
                          className="overflow-hidden border bg-card hover:bg-accent transition-all duration-300 group cursor-pointer"
                          style={{
                            animationDelay: `${index * 100}ms`,
                            animation: "fadeInUp 0.5s ease-out forwards"
                          }}
                          onClick={() => handleRepoClick(repo)}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <img
                                src={
                                  repo.owner.avatar_url || "/placeholder.svg"
                                }
                                alt={`${repo.owner.login} avatar`}
                                className="h-12 w-12 rounded-full border-2 border-border"
                              />
                              <div className="space-y-2 flex-1">
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-xl group-hover:text-primary transition-colors duration-300">
                                      {repo.full_name}
                                    </h3>
                                    <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 gap-1 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                      onClick={(e) => handleShowStats(e, repo)}
                                    >
                                      <Eye className="h-4 w-4" />
                                      Stats
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 gap-1 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                    >
                                      <Star className="h-4 w-4" />
                                      {formatNumber(repo.stargazers_count)}
                                    </Button>
                                  </div>
                                </div>
                                <p className="text-muted-foreground">
                                  {repo.description}
                                </p>
                                <div className="flex flex-wrap gap-4 pt-2 text-sm">
                                  {repo.language && (
                                    <span className="flex items-center gap-1.5 text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                                      <span
                                        className="h-3 w-3 rounded-full"
                                        style={{
                                          backgroundColor:
                                            languageColors[repo.language] ||
                                            "#8b949e"
                                        }}
                                      ></span>
                                      {repo.language}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1.5 text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                                    <GitFork className="h-3.5 w-3.5" />
                                    {formatNumber(repo.forks_count)}
                                  </span>
                                  <span className="flex items-center gap-1.5 text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                                    <Clock className="h-3.5 w-3.5" />
                                    {formatDate(repo.updated_at)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        {selectedRepo?.id === repo.id && (
                          <Card className="border bg-card p-4">
                            <CardContent className="p-2">
                              <RepoStarHistory
                                owner={repo.owner.login}
                                repo={repo.name}
                              />
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    ))}
                  </div>
                  {renderPagination()}
                </div>
              ) : query ? (
                <div className="text-center py-16 space-y-4 animate-fadeIn">
                  <div className="inline-flex items-center justify-center p-6 rounded-full bg-muted">
                    <Search className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-medium">
                      No repositories found
                    </h3>
                    <p className="text-muted-foreground mt-1">
                      Try a different search term
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 space-y-4 animate-fadeIn">
                  <div className="inline-flex items-center justify-center p-6 rounded-full bg-muted">
                    <Github className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-medium">
                      Discover GitHub repositories
                    </h3>
                    <p className="text-muted-foreground mt-1">
                      Start typing to search
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </ThemeProvider>
  )
}

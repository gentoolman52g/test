"use client"

import { useState, useEffect } from "react"
import { fetchNotionDatabase } from "@/app/api/notion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, RefreshCw } from "lucide-react"

export default function NotionDatabaseView() {
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function fetchData() {
    setIsLoading(true)
    setError(null)

    try {
      const result = await fetchNotionDatabase()

      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError("데이터를 가져오는 중 오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch data on component mount
  useEffect(() => {
    fetchData()
  }, [])

  // Extract property keys from the first item if data exists
  const propertyKeys = data?.results && data.results.length > 0 ? Object.keys(data.results[0].properties || {}) : []

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{data?.title || "Notion 데이터베이스 뷰어"}</CardTitle>
            <CardDescription>
              {data?.results ? `총 ${data.results.length}개의 항목이 있습니다` : "데이터베이스 정보를 불러오는 중..."}
            </CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={fetchData} disabled={isLoading} title="새로고침">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && !data && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">데이터를 불러오는 중...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-md mb-4">
            <p className="font-semibold">오류 발생</p>
            <p>{error}</p>
          </div>
        )}

        {data?.results && data.results.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {propertyKeys.map((key) => (
                    <TableHead key={key}>{key}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.results.map((item: any, index: number) => (
                  <TableRow key={index}>
                    {propertyKeys.map((key) => (
                      <TableCell key={key}>{renderPropertyValue(item.properties[key])}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : data?.results && data.results.length === 0 ? (
          <div className="text-center py-10 text-gray-500">데이터베이스에 항목이 없습니다</div>
        ) : null}
      </CardContent>
    </Card>
  )
}

// Helper function to render different Notion property types
function renderPropertyValue(property: any) {
  if (!property) return "-"

  switch (property.type) {
    case "title":
      return property.title.map((t: any) => t.plain_text).join("")
    case "rich_text":
      return property.rich_text.map((t: any) => t.plain_text).join("")
    case "number":
      return property.number?.toString() || "-"
    case "select":
      return property.select?.name || "-"
    case "multi_select":
      return property.multi_select.map((s: any) => s.name).join(", ")
    case "date":
      return property.date?.start || "-"
    case "checkbox":
      return property.checkbox ? "✓" : "✗"
    case "url":
      return property.url || "-"
    case "email":
      return property.email || "-"
    case "phone_number":
      return property.phone_number || "-"
    default:
      return JSON.stringify(property)
  }
}

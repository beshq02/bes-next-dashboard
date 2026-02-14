'use client'

import { useState, useMemo, useCallback } from 'react'
import { isWithinInterval, parseISO, startOfDay, endOfDay, subDays } from 'date-fns'
import MetricCards from './MetricCards'
import TenderFilters from './TenderFilters'
import TenderTable from './TenderTable'
import { useFavorites } from './useFavorites'

export default function TenderListClient({ initialData = [], fieldMapping = [], tenderTypes = [], tenderRanges = [], procurementCategories = [] }) {
  // 篩選狀態
  const [searchTerm, setSearchTerm] = useState('')
  const defaultCategory = procurementCategories.find(c => c.if_display)?.cate || 'all'
  const [procurementCategory, setProcurementCategory] = useState(defaultCategory)
  const defaultLevel = tenderRanges.find(r => r.if_display)?.range || 'all'
  const [procurementLevel, setProcurementLevel] = useState(defaultLevel)
  const [tenderTypeId, setTenderTypeId] = useState('all')
  const [budgetMin, setBudgetMin] = useState(null)
  const defaultDateRange = { from: subDays(new Date(), 6), to: new Date() }
  const [dateRange, setDateRange] = useState(defaultDateRange)

  // 收藏
  const { favorites, toggle: toggleFavorite } = useFavorites()

  // 分頁狀態
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)

  // 排序狀態
  const [sortConfig, setSortConfig] = useState({ key: 'announcement_date', direction: 'desc' })

  // 處理排序
  const handleSort = useCallback(key => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
    setCurrentPage(1)
  }, [])

  // 篩選後的資料
  const filteredData = useMemo(() => {
    let result = [...initialData]

    // 標案名稱篩選
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase()
      result = result.filter(
        item =>
          item.tender_name?.toLowerCase().includes(lowerSearch) ||
          item.org_name?.toLowerCase().includes(lowerSearch) ||
          item.tender_no?.toLowerCase().includes(lowerSearch)
      )
    }

    // 招標類型篩選（依 tender_type_id）
    if (tenderTypeId !== 'all') {
      result = result.filter(item => item.tender_type_id === Number(tenderTypeId))
    }

    // 採購性質篩選
    if (procurementCategory !== 'all') {
      result = result.filter(item => item.procurement_nature === procurementCategory)
    }

    // 採購級距篩選
    if (procurementLevel === 'custom') {
      if (budgetMin != null && budgetMin > 0) {
        const threshold = budgetMin * 100000000 // 億 → 元
        result = result.filter(item => {
          const amt = parseFloat(String(item.budget ?? '').replace(/,/g, ''))
          return !isNaN(amt) && amt >= threshold
        })
      }
    } else if (procurementLevel !== 'all') {
      if (procurementLevel === 'null') {
        result = result.filter(item => !item.procurement_level)
      } else {
        result = result.filter(item => item.procurement_level === procurementLevel)
      }
    }

    // 日期範圍篩選
    if (dateRange.from || dateRange.to) {
      result = result.filter(item => {
        if (!item.announcement_date) return false
        const itemDate = parseISO(item.announcement_date)

        if (dateRange.from && dateRange.to) {
          return isWithinInterval(itemDate, {
            start: startOfDay(dateRange.from),
            end: endOfDay(dateRange.to),
          })
        }

        if (dateRange.from) {
          return itemDate >= startOfDay(dateRange.from)
        }

        if (dateRange.to) {
          return itemDate <= endOfDay(dateRange.to)
        }

        return true
      })
    }

    // 排序
    result.sort((a, b) => {
      let aValue = a[sortConfig.key]
      let bValue = b[sortConfig.key]

      // 處理空值
      if (aValue == null) aValue = ''
      if (bValue == null) bValue = ''

      // 數字排序
      if (sortConfig.key === 'budget') {
        aValue = parseFloat(String(aValue).replace(/,/g, '')) || 0
        bValue = parseFloat(String(bValue).replace(/,/g, '')) || 0
      }

      // 日期排序
      if (sortConfig.key === 'announcement_date') {
        aValue = aValue ? new Date(aValue).getTime() : 0
        bValue = bValue ? new Date(bValue).getTime() : 0
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [initialData, searchTerm, tenderTypeId, procurementCategory, procurementLevel, budgetMin, dateRange, sortConfig])

  // 分頁資料
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredData.slice(startIndex, startIndex + pageSize)
  }, [filteredData, currentPage, pageSize])

  const totalPages = Math.ceil(filteredData.length / pageSize)

  // 重設篩選
  const handleResetFilters = useCallback(() => {
    setSearchTerm('')
    setProcurementCategory(defaultCategory)
    setProcurementLevel(defaultLevel)
    setBudgetMin(null)
    setTenderTypeId('all')
    setDateRange({ from: subDays(new Date(), 6), to: new Date() })
    setCurrentPage(1)
  }, [defaultCategory, defaultLevel])

  // 篩選變更時重設頁碼
  const handleSearchChange = useCallback(value => {
    setSearchTerm(value)
    setCurrentPage(1)
  }, [])

  const handleProcurementLevelChange = useCallback(value => {
    setProcurementLevel(value)
    if (value === 'custom') setBudgetMin(20)
    else setBudgetMin(null)
    setCurrentPage(1)
  }, [])

  const handleBudgetMinChange = useCallback(value => {
    setBudgetMin(value)
    setCurrentPage(1)
  }, [])

  const handleProcurementCategoryChange = useCallback(value => {
    setProcurementCategory(value)
    setCurrentPage(1)
  }, [])

  const handleTenderTypeChange = useCallback(value => {
    setTenderTypeId(value)
    setCurrentPage(1)
  }, [])

  const handleDateRangeChange = useCallback(range => {
    setDateRange(range)
    setCurrentPage(1)
  }, [])

  return (
    <div className="space-y-6">
      {/* 統計卡片 */}
      <MetricCards data={initialData} filteredData={filteredData} />

      {/* 篩選器 */}
      <TenderFilters
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        procurementCategory={procurementCategory}
        onProcurementCategoryChange={handleProcurementCategoryChange}
        procurementCategories={procurementCategories}
        procurementLevel={procurementLevel}
        onProcurementLevelChange={handleProcurementLevelChange}
        tenderRanges={tenderRanges}
        budgetMin={budgetMin}
        onBudgetMinChange={handleBudgetMinChange}
        tenderTypeId={tenderTypeId}
        onTenderTypeChange={handleTenderTypeChange}
        tenderTypes={tenderTypes}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        onResetFilters={handleResetFilters}
      />

      {/* 表格 */}
      <TenderTable
        data={paginatedData}
        totalCount={filteredData.length}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        sortConfig={sortConfig}
        onSort={handleSort}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  )
}

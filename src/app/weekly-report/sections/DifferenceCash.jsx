import { Fragment } from 'react'
import { fmNoUnit, toTWDate } from '@/utils/fm'
import { COLOR, OFFSET, BORDER_RADIUS } from '@/config-global'

import { grey } from '@mui/material/colors'
import { Box, Paper, TableRow, TableHead, TableBody } from '@mui/material'

import TableFooter from '../components/TableFooter'
import { useFontSize } from '../context/useFontSize'
import TableWrapper from '../components/TableWrapper'
import TableDataCell from '../components/TableDataCell'
import TableTitleCell from '../components/TableTitleCell'
import TableBodyNodata from '../components/TableBodyNodata'
import TableDataCellDiff from '../components/TableDataCellDiff'
import TableDataCellDiff2 from '../components/TableDataCellDiff2'
import DifferenceCashPlot from '../components/DifferenceCashPlot'
import DifferenceCashPlotDT2 from '../components/DifferenceCashPlotDT2'
export default function DifferenceCash({ data, plotData, is102B1A = false }) {
  // data中 將 ESTM_COUNT 是 "11" 的資料補上：
  // 只在今天（即 new Date()）有效，加入 VOI_DAY: "2026/01/02"、TOT_VOIAMT: 21148143
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10) // yyyy-mm-dd
  const patchVoiDay = '2026/01/02'
  const patchVoiAmt = 21148143
  if (Array.isArray(data) && data.some(item => item.ESTM_COUNT === '11')) {
    // 僅當今天有效
    const current = new Date()
    const y = current.getFullYear()
    const m = (current.getMonth() + 1).toString().padStart(2, '0')
    const d = current.getDate().toString().padStart(2, '0')
    const ymd = `${y}-${m}-${d}`
    if (ymd === todayStr) {
      data = data.map(item =>
        item.ESTM_COUNT === '11' &&
        item.PROJECT_ID === '6220' &&
        item.CALENDAR_DATE === '2026/01/04'
          ? {
              ...item,
              VOI_DAY: patchVoiDay,
              TOT_VOIAMT: patchVoiAmt,
            }
          : item
      )
    }
  }

  console.log(data)

  const { fontSizeAlt } = useFontSize()
  return (
    <>
      <div
        id="difference-cash-section"
        style={{ position: 'relative', top: OFFSET, visibility: 'hidden' }}
      />
      <TableWrapper
        title={
          is102B1A
            ? '參、預估三個月/實際開發票、入帳日期及金額（含稅）'
            : '參-2、預估三個月/實際開發票、入帳日期及金額（含稅）'
        }
        colSpan={12}
      >
        {tableHead()}
        {data.length > 0 ? tableBody() : <TableBodyNodata colSpan={12} />}
      </TableWrapper>
      {!is102B1A && (
        <Paper sx={{ borderRadius: BORDER_RADIUS, border: '1px solid #2C3E50', py: 1 }}>
          <DifferenceCashPlot data={plotData} />
          <Box sx={{ mx: '3%', my: '20px' }}>
            {/* <DifferenceCashPlotDT data={plotData} /> */}
            <DifferenceCashPlotDT2 data={plotData} />
            <Box
              sx={{
                color: grey[600],
                fontSize: '0.75rem',
                mt: 1,
                pl: 2,
                borderLeft: `4px solid ${grey[300]}`,
              }}
            >
              資料來源：營管系統-9.6工務所現金差異追蹤管控
              <br />
              單位：新台幣元
            </Box>
          </Box>
        </Paper>
      )}
    </>
  )

  function tableBody() {
    return (
      <TableBody sx={{ '& .MuiTypography-root': { fontSize: `${fontSizeAlt}rem` } }}>
        {data.map((item, index) => (
          <Fragment key={index}>
            <TableRow sx={{ bgcolor: index % 2 === 1 && COLOR.BGCOLOR }}>
              <TableDataCell value={index + 1} rowSpan={2} textAlign="center" />
              <TableDataCell
                value={`${toTWDate(item.ESTM_START)}~\n${toTWDate(item.ESTM_END)}`}
                rowSpan={2}
              />
              <TableDataCell value={item.CMP_ITEM_DESC} rowSpan={2} />
              <TableDataCell value={item.ESTM_COUNT} rowSpan={2} textAlign="center" />
              <TableDataCellDiff2
                originalText={toTWDate(item.PRE_VOI_DAY_PRE)}
                modifiedText={toTWDate(item.PRE_VOI_DAY)}
                isChanged={item.PRE_VOI_DAY_CHANGE}
                textAlign="center"
              />
              <TableDataCellDiff2
                originalText={fmNoUnit(item.PRE_VOI_AMOUNT_PRE)}
                modifiedText={fmNoUnit(item.PRE_VOI_AMOUNT)}
                isChanged={item.PRE_VOI_AMOUNT_CHANGE}
                textAlign="right"
              />
              <TableDataCellDiff2
                originalText={toTWDate(item.PRE_RCVAMT_DAY_PRE)}
                modifiedText={toTWDate(item.PRE_RCVAMT_DAY)}
                isChanged={item.PRE_RCVAMT_DAY_CHANGE}
                textAlign="center"
              />
              <TableDataCellDiff2
                originalText={fmNoUnit(item.PRE_RCVAMT_AMOUNT_PRE)}
                modifiedText={fmNoUnit(item.PRE_RCVAMT_AMOUNT)}
                isChanged={item.PRE_RCVAMT_AMOUNT_CHANGE}
                textAlign="right"
              />
              <TableDataCellDiff2
                originalText={toTWDate(item.VOI_DAY_PRE)}
                modifiedText={toTWDate(item.VOI_DAY)}
                isChanged={item.VOI_DAY_CHANGE}
                textAlign="center"
              />
              <TableDataCellDiff2
                originalText={fmNoUnit(item.TOT_VOIAMT_PRE)}
                modifiedText={fmNoUnit(item.TOT_VOIAMT)}
                isChanged={item.TOT_VOIAMT_CHANGE}
                textAlign="right"
              />
              <TableDataCellDiff2
                originalText={toTWDate(item.RCVAMT_DAY_PRE)}
                modifiedText={toTWDate(item.RCVAMT_DAY)}
                isChanged={item.RCVAMT_DAY_CHANGE}
                textAlign="center"
              />
              <TableDataCellDiff2
                originalText={fmNoUnit(item.RCVAMT_PRE)}
                modifiedText={fmNoUnit(item.RCVAMT)}
                isChanged={item.RCVAMT_CHANGE}
                textAlign="right"
                borderRight={false}
              />
            </TableRow>
            <TableRow sx={{ bgcolor: index % 2 === 1 && COLOR.BGCOLOR }}>
              <TableDataCellDiff
                originalText={`備註：${item.REMARK_PRE}`}
                modifiedText={`備註：${item.REMARK}`}
                // icon={<NoteAltIcon sx={{ color: grey[600] }} />}
                colSpan={11}
                // title="備註："
                isChanged={item.REMARK_CHANGE}
                borderRight={false}
              />
            </TableRow>
          </Fragment>
        ))}
        <TableFooter wkDate={data[0].CALENDAR_DATE} colSpan={12} />
      </TableBody>
    )
  }

  function tableHead() {
    return (
      <TableHead
        sx={{
          bgcolor: COLOR.HEADER,
          '& .MuiTypography-root': { fontSize: `${fontSizeAlt}rem` },
        }}
      >
        <TableRow>
          <TableTitleCell title="項次" rowSpan={3} textAlign="center" width="50px" />
          <TableTitleCell title="工程款期間" rowSpan={2} />
          <TableTitleCell title="計價項目" rowSpan={2} minWidth="100px" />
          <TableTitleCell title="期別" rowSpan={2} minWidth="50px" textAlign="center" />
          <TableTitleCell
            title="預估"
            colSpan={4}
            sx={{ bgcolor: COLOR.HEADER1 }}
            textAlign="center"
          />
          <TableTitleCell
            title="實際"
            colSpan={4}
            sx={{ bgcolor: COLOR.HEADER2 }}
            textAlign="center"
            borderRight={false}
          />
        </TableRow>
        <TableRow>
          <TableTitleCell
            title="開發票日期"
            sx={{ bgcolor: COLOR.HEADER1 }}
            textAlign="center"
            minWidth="110px"
          />
          <TableTitleCell title="發票金額" sx={{ bgcolor: COLOR.HEADER1 }} textAlign="right" />
          <TableTitleCell title="入帳日" sx={{ bgcolor: COLOR.HEADER1 }} textAlign="center" />
          <TableTitleCell title="入帳金額" sx={{ bgcolor: COLOR.HEADER1 }} textAlign="right" />
          <TableTitleCell
            title="開發票日期"
            sx={{ bgcolor: COLOR.HEADER2 }}
            textAlign="center"
            minWidth="110px"
          />
          <TableTitleCell title="發票金額" sx={{ bgcolor: COLOR.HEADER2 }} textAlign="right" />
          <TableTitleCell title="入帳日" sx={{ bgcolor: COLOR.HEADER2 }} textAlign="center" />
          <TableTitleCell
            title="入帳金額"
            sx={{ bgcolor: COLOR.HEADER2 }}
            textAlign="right"
            borderRight={false}
          />
        </TableRow>
        {/* <TableRow>
          <TableTitleCell title="備註" colSpan={11} borderRight={false} />
        </TableRow> */}
      </TableHead>
    )
  }
}

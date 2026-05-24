const calc = require('../../utils/calculator.js')

Page({
  data: {
    loanAmount: 0,
    loanYear: 0,
    loanRate: 0,
    repayTypeName: '',
    monthlyDisplay: '',
    totalInterestDisplay: '',
    totalMonths: 0,
    scheduleData: [],
    displaySchedule: [],
    selectedYear: 1,
    years: [],
    chartPoints: [],
    yearSummary: {}
  },

  onShow() {
    const app = getApp()
    const params = app.globalData.calcResult
    if (!params) return

    const { loanType, repayType, loanAmount, loanRate, loanYear, fundAmount, fundRate } = params

    let schedule = []
    let monthlyPayment = 0
    let totalInterest = 0
    let typeName = ''

    if (loanType === 'combined') {
      typeName = '组合贷款'
      const commercialAmt = Math.max(0, loanAmount - fundAmount)
      const combined = calc.calcCombined(commercialAmt, loanRate, fundAmount, fundRate, loanYear)
      monthlyPayment = combined.monthlyPayment
      totalInterest = combined.totalInterest
      // 合并还款计划（粗略合并）
      const commSched = calc.calcEqualPayment(commercialAmt * 10000, loanRate, loanYear).schedule
      const fundSched = calc.calcEqualPayment(fundAmount * 10000, fundRate, loanYear).schedule
      schedule = commSched.map((s, i) => ({
        period: s.period,
        monthlyPayment: s.monthlyPayment + fundSched[i].monthlyPayment,
        principalPaid: s.principalPaid + fundSched[i].principalPaid,
        interestPaid: s.interestPaid + fundSched[i].interestPaid,
        remainingPrincipal: s.remainingPrincipal + fundSched[i].remainingPrincipal
      }))
    } else if (repayType === 'equal-payment') {
      typeName = '等额本息'
      const r = calc.calcEqualPayment(loanAmount * 10000, loanRate, loanYear)
      monthlyPayment = r.monthlyPayment
      totalInterest = r.totalInterest
      schedule = r.schedule
    } else {
      typeName = '等额本金'
      const r = calc.calcEqualPrincipal(loanAmount * 10000, loanRate, loanYear)
      monthlyPayment = r.firstPayment
      totalInterest = r.totalInterest
      schedule = r.schedule
    }

    const totalMonths = schedule.length
    const years = []
    for (let i = 1; i <= Math.ceil(totalMonths / 12); i++) {
      years.push(i)
    }

    // 生成图表采样点（每年取一个点）
    const chartPoints = []
    const sampleInterval = Math.max(1, Math.floor(totalMonths / 8))
    for (let i = 0; i < totalMonths; i += sampleInterval) {
      const s = schedule[i]
      const total = s.monthlyPayment || (s.principalPaid + s.interestPaid)
      chartPoints.push({
        label: `第${s.period}期`,
        interestPct: total > 0 ? (s.interestPaid / total * 100).toFixed(0) : 0,
        principalPct: total > 0 ? (s.principalPaid / total * 100).toFixed(0) : 0,
        totalDisplay: calc.formatMoney(total)
      })
    }

    // 确保最后一个点也在
    const lastS = schedule[totalMonths - 1]
    const lastTotal = lastS.monthlyPayment || (lastS.principalPaid + lastS.interestPaid)
    chartPoints.push({
      label: `第${lastS.period}期`,
      interestPct: lastTotal > 0 ? (lastS.interestPaid / lastTotal * 100).toFixed(0) : 0,
      principalPct: lastTotal > 0 ? (lastS.principalPaid / lastTotal * 100).toFixed(0) : 0,
      totalDisplay: calc.formatMoney(lastTotal)
    })

    this.setData({
      loanAmount: parseFloat(loanAmount).toFixed(0),
      loanYear, 
      loanRate,
      repayTypeName: typeName,
      monthlyDisplay: calc.formatMoney(monthlyPayment),
      totalInterestDisplay: (totalInterest / 10000).toFixed(2),
      totalMonths,
      scheduleData: schedule,
      years,
      selectedYear: 1,
      chartPoints
    })

    this.filterByYear(1)
  },

  // 按年份筛选
  selectYear(e) {
    const year = e.currentTarget.dataset.year
    this.setData({ selectedYear: year })
    this.filterByYear(year)
  },

  filterByYear(year) {
    const { scheduleData } = this.data
    const start = (year - 1) * 12
    const end = year * 12
    const filtered = scheduleData.slice(start, end)

    const displaySchedule = filtered.map(s => ({
      ...s,
      monthlyDisplay: calc.formatMoney(s.monthlyPayment),
      principalDisplay: calc.formatMoney(s.principalPaid),
      interestDisplay: calc.formatMoney(s.interestPaid),
      remainDisplay: calc.formatMoney(s.remainingPrincipal)
    }))

    // 年度汇总
    const yrData = scheduleData.slice(0, end)
    let totalPayment = 0, totalPrincipal = 0, totalInterest = 0
    const yearData = scheduleData.slice(start, end)
    yearData.forEach(s => {
      totalPayment += s.monthlyPayment
      totalPrincipal += s.principalPaid
      totalInterest += s.interestPaid
    })

    const lastInRange = scheduleData[end - 1] || scheduleData[scheduleData.length - 1]

    this.setData({
      displaySchedule,
      yearSummary: {
        totalPayment: calc.formatMoney(totalPayment),
        totalPrincipal: calc.formatMoney(totalPrincipal),
        totalInterest: calc.formatMoney(totalInterest),
        remaining: calc.formatMoney(lastInRange ? lastInRange.remainingPrincipal : 0)
      }
    })
  }
})
